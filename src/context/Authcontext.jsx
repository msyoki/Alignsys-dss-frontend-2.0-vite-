import React from 'react'
import {createContext, useState, useEffect} from 'react'
import jwt_decode from "jwt-decode";
import { useNavigate  } from "react-router-dom";
import Loading from '../components/loaders/LoadingDialog';
import axios from "axios"
import * as constants from '../components/constants/constants'
const Authcontext= createContext()

export default Authcontext;

// --- Token helpers ---------------------------------------------------------
// The backend rotates refresh tokens and blacklists the old one on use, so a
// refresh token works exactly once. Two refreshes with the same token (React
// StrictMode running effects twice, the timer firing during a refresh, ...)
// make one of them fail; that failure used to log the user out at random.
const readTokens = () => {
    try { return JSON.parse(sessionStorage.getItem('authTokens')) || null } catch { return null }
}
const decodeAccess = (tokens) => {
    try { return tokens?.access ? jwt_decode(tokens.access) : null } catch { return null }
}
const secondsLeft = (tokens) => {
    const claims = decodeAccess(tokens)
    return claims?.exp ? claims.exp - Date.now() / 1000 : 0
}
// Only one refresh at a time, shared by every caller (module level, so it
// survives StrictMode's double mount).
let refreshInFlight = null

export const AuthProvider = ({children}) => {
    
    let[authTokens, setAuthtokens]= useState(()=>readTokens())
    // Decode the access token (previously the whole JSON string was decoded,
    // which only worked by accident).
    let[user, setUser]= useState(()=>decodeAccess(readTokens()))
    let[loading,setLoading]= useState(true)
    let navigate = useNavigate()
    let [miniLoader, setMiniLoader] = useState(false);
    let[openalert,setOpenAlert]=useState(false)
    let[alertseverity,setAlertSeverity]=useState('')
    let [alertmsg,setAlertMsg]=useState('')


    // login request
    let loginUser = async(e)=>{
        e.preventDefault()
        setMiniLoader(true)
        try {
            const response = await axios.post(`${constants.devApiBaseUrl}/api/token/`,{
                email: e.target.email.value,
                password: e.target.password.value
            });
            if(response.status === 200){
                setMiniLoader(false)
                const data= response.data;
                setAuthtokens(data);
                setUser(jwt_decode(data.access))
                sessionStorage.setItem('authTokens',JSON.stringify(data))
           
                // if(jwt_decode(response.data.access).is_superuser === 'True'){
                   
                //     navigate('/super/admin/dashboard',{state:{openalert:true,alertmsg:"logged in successfully",alertseverity:"success"}}  )
                    
                //     // else{
                //     //     navigate('/admin/dashboard',{state:{openalert:true,alertmsg:"logged in successfully",alertseverity:"success"}} )
                //     // }
                    
                // }
                // else{
                    if(jwt_decode(response.data.access).first_login  === 'True'){
                        navigate('/change-password')
                    }
                    else{
                        navigate('/',{state:{openalert:true,alertmsg:"logged in successfully",alertseverity:"success"}} )
                    }
                       
                // }
            }
        }
        catch(error){
            setMiniLoader(false)
         
            var config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: 'https://ipapi.co/json',
                headers: {}
            };
        
            axios(config)
            .then(function (response) {
            // console.log(JSON.stringify(response.data));
            // console.log(response.data['IPv4'])
            var userip=''
            userip = response.data.ip
            let data = JSON.stringify({
                "activity": "login attempt",
                "description": "failed ( invalid username or password )",
                "ip": userip,
                "user": e.target.email.value
                });
    
                let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `${constants.devApiBaseUrl}/api/new/log/`,
                headers: { 
                    'Content-Type': 'application/json'
                },
                data : data
                };
    
                axios.request(config)
                .then((response) => {
                // console.log(JSON.stringify(response.data));
                })
                .catch((error) => {
                // console.log(error);
                });
            })
            .catch(function (error) {
            // console.log(error);
            });
        
            setOpenAlert(true)
            setAlertMsg('Invalid username or password !!!')
            setAlertSeverity('error')
            setTimeout(
              function() {
              setOpenAlert(false);
            }, 5000)
        }
    }

    // logout user
    let logoutUser = ()=>{
        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://ipapi.co/json',
            headers: {}
        };
    
        axios(config)
        .then(function (response) {
        // console.log(JSON.stringify(response.data));
        // console.log(response.data['IPv4'])
        var userip=''
        userip = response.data.ip
        if (!user?.email) return
        let data = JSON.stringify({
            "activity": "logout",
            "description": "successful logout",
            "ip": userip,
            "user": user.email
            });

            let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${constants.devApiBaseUrl}/api/new/log/`,
            headers: { 
                'Content-Type': 'application/json'
            },
            data : data
            };

            axios.request(config)
            .then((response) => {
            // console.log(JSON.stringify(response.data));
            })
            .catch((error) => {
            // console.log(error);
            });
        })
        .catch(function (error) {
        // console.log(error);
        });
        setAuthtokens(null)
        setUser(null) 
        sessionStorage.removeItem('authTokens')
    }

    // Update token

    // Refresh the access token. Safe to call from anywhere, any number of times:
    // concurrent calls share one request, and it always uses the newest refresh
    // token (from storage, not a possibly stale copy in this closure).
    // Logs out only when the server rejects the refresh token (expired /
    // already used); a network error or server restart just retries later.
    let updateToken = async ()=>{
        const tokens = readTokens()
        if (!tokens?.refresh) {
            if (loading) setLoading(false)
            return
        }
        if (!refreshInFlight) {
            refreshInFlight = axios.post(`${constants.devApiBaseUrl}/api/token/refresh/`, { refresh: tokens.refresh })
                .then((response) => {
                    sessionStorage.setItem('authTokens', JSON.stringify(response.data))
                    return { ok: true, data: response.data }
                })
                .catch((error) => ({ ok: false, status: error?.response?.status }))
                .finally(() => { refreshInFlight = null })
        }
        const result = await refreshInFlight
        if (result.ok) {
            setAuthtokens(result.data)
            setUser(decodeAccess(result.data))
        } else if (result.status === 401 || result.status === 400) {
            // Another tab may have refreshed with the same token a moment ago;
            // if storage already holds a newer, still-valid token, keep it.
            const latest = readTokens()
            if (latest?.refresh && latest.refresh !== tokens.refresh && secondsLeft(latest) > 0) {
                setAuthtokens(latest)
                setUser(decodeAccess(latest))
            } else {
                logoutUser()
            }
        }
        // Other errors (offline, 5xx, server restarting): stay signed in and retry on the next tick.
        if(loading){
            setLoading(false)
        }

    }

    let authenticateGuest=async(e,username,password)=>{
        e.preventDefault()
        try {
            const response = await axios.post(`${constants.devApiBaseUrl}/api/token/`,{
                email: username,
                password: password
            });
            if(response.status === 200){
               return 200 
            }
        }
        catch(error){
         
            var config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: 'https://ipapi.co/json',
                headers: {}
            };
        
            axios(config)
            .then(function (response) {
            // console.log(JSON.stringify(response.data));
            // console.log(response.data['IPv4'])
            var userip=''
            userip = response.data.ip
            let data = JSON.stringify({
                "activity": "document access",
                "description": "failed to authenticate document access",
                "ip": userip,
                "user": username
                });
    
                let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `${constants.devApiBaseUrl}/api/new/log/`,
                headers: { 
                    'Content-Type': 'application/json'
                },
                data : data
                };
    
                axios.request(config)
                .then((response) => {
                // console.log(JSON.stringify(response.data));
                })
                .catch((error) => {
                // console.log(error);
                });
            })
            .catch(function (error) {
            // console.log(error);
            });
        
            setOpenAlert(true)
            setAlertMsg('password !!!')
            setAlertSeverity('error')
            setTimeout(
              function() {
              setOpenAlert(false);
            }, 5000)
        }

    }

    let contextData={
        miniLoader:miniLoader,
        user:user,
        updateToken:updateToken,
        authTokens:authTokens,
        loginUser:loginUser,
        logoutUser:logoutUser,
        authenticateGuest:authenticateGuest,
        alertmsg:alertmsg,
        alertseverity:alertseverity,
        openalert:openalert,
        setOpenAlert:setOpenAlert,
        setAlertMsg:setAlertMsg,
        setAlertSeverity:setAlertSeverity
       
    }


    // Keep the session alive. Instead of a blind 3-minute timer, refresh when the
    // access token is about to expire: checked every 30 s and whenever the tab
    // becomes visible again (browsers slow timers in background tabs and stop
    // them while a laptop sleeps).
    useEffect(()=>{
        if(loading){
            updateToken()
        }
        const refreshIfDue = () => {
            const tokens = readTokens()
            if (tokens?.refresh && secondsLeft(tokens) < 90) updateToken()
        }
        const interval = setInterval(refreshIfDue, 30 * 1000)
        const onVisible = () => { if (document.visibilityState === 'visible') refreshIfDue() }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', refreshIfDue)
        return ()=>{
            clearInterval(interval)
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', refreshIfDue)
        }
    }, [authTokens, loading]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
  
    <Authcontext.Provider value={contextData}>
        {loading ? <Loading/>: children}
    </Authcontext.Provider>
    
  )
}
