import React from 'react'
import {createContext, useState, useEffect} from 'react'
import jwt_decode from "jwt-decode";
import { useNavigate  } from "react-router-dom";
// App-start screen while the session is restored (was LoadingDialog, which rendered closed).
import Loading from '../components/loaders/Loading';
import axios from "axios"
import * as constants from '../components/constants/constants'
import { setDisplayTimeZone } from '../utils/datetime'
import { isValidEmail } from '../utils/email'
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
// Time zone changes saved in this session. The login token carries the time
// zone claims and token refresh copies them, so without this a change would
// only show after the next login. Cleared on login and logout.
const TZ_OVERRIDE_KEY = 'timezoneOverride'
const readTzOverride = () => {
    try { return JSON.parse(sessionStorage.getItem(TZ_OVERRIDE_KEY)) || null } catch { return null }
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
    let[tzOverride, setTzOverride]= useState(()=>readTzOverride())
    let navigate = useNavigate()
    let [miniLoader, setMiniLoader] = useState(false);
    let[openalert,setOpenAlert]=useState(false)
    let[alertseverity,setAlertSeverity]=useState('')
    let [alertmsg,setAlertMsg]=useState('')


    // login request
    let loginUser = async(e)=>{
        e.preventDefault()
        if (!isValidEmail(e.target.email.value.trim())) {
            setAlertMsg('Enter a valid email address, e.g. name@company.com.')
            setAlertSeverity('error')
            setOpenAlert(true)
            return
        }
        setMiniLoader(true)
        try {
            const response = await axios.post(`${constants.devApiBaseUrl}/api/token/`,{
                email: e.target.email.value.trim(),
                password: e.target.password.value
            });
            if(response.status === 200){
                setMiniLoader(false)
                const data= response.data;
                setAuthtokens(data);
                setUser(jwt_decode(data.access))
                sessionStorage.setItem('authTokens',JSON.stringify(data))
                sessionStorage.removeItem(TZ_OVERRIDE_KEY)
                setTzOverride(null)
           
                // if(jwt_decode(response.data.access).is_superuser === 'True'){
                   
                //     navigate('/super/admin/dashboard',{state:{openalert:true,alertmsg:"logged in successfully",alertseverity:"success"}}  )
                    
                //     // else{
                //     //     navigate('/admin/dashboard',{state:{openalert:true,alertmsg:"logged in successfully",alertseverity:"success"}} )
                //     // }
                    
                // }
                // else{
                    // Temporary (emailed) password: choose your own before anything else.
                    // (first_login was compared with the string 'True' but is a boolean, so it never matched.)
                    if(jwt_decode(response.data.access).must_change_password){
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
        
            // The server says why when the password was right but access isn't allowed
            // (waiting for approval, no licence, organisation's licence missing or expired).
            const reason = error?.response?.data
            const known = ['pending_approval', 'no_licence', 'organisation_unlicensed', 'organisation_suspended'].includes(reason?.code)
            setOpenAlert(true)
            setAlertMsg(known ? reason.detail : 'Invalid email or password.')
            setAlertSeverity(known ? 'warning' : 'error')
            setTimeout(
              function() {
              setOpenAlert(false);
            }, known ? 10000 : 5000)
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
        sessionStorage.removeItem(TZ_OVERRIDE_KEY)
        setTzOverride(null)
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

    // Record time zone settings saved in this session, e.g.
    // updateTimezones({ timezone: 'Europe/London', user_timezone: 'Europe/London' }).
    const updateTimezones = (changes) => {
        const next = { ...(tzOverride || {}), ...changes }
        try { sessionStorage.setItem(TZ_OVERRIDE_KEY, JSON.stringify(next)) } catch { /* private mode */ }
        setTzOverride(next)
    }
    const effectiveUser = user && tzOverride ? { ...user, ...tzOverride } : user
    // Every date on screen uses this zone (see utils/datetime.js). Set while
    // rendering, so children render with the right zone straight away.
    setDisplayTimeZone(effectiveUser?.timezone)

    let contextData={
        miniLoader:miniLoader,
        user:effectiveUser,
        updateTimezones:updateTimezones,
        // Same store, for other claims changed in this session (e.g. must_change_password).
        updateClaims:updateTimezones,
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
    // Any request refused because the password must be changed first sends the
    // user to the change-password page (the server allows nothing else until then).
    useEffect(()=>{
        const id = axios.interceptors.response.use(
            (res) => res,
            (err) => {
                const code = err?.response?.status === 403 ? err.response.data?.code : null
                if (code === 'password_change_required' && window.location.pathname !== '/change-password') {
                    navigate('/change-password')
                }
                // Licence withdrawn or expired while signed in: sign out and say why.
                if (['no_licence', 'organisation_unlicensed', 'organisation_suspended', 'pending_approval'].includes(code)) {
                    setAuthtokens(null)
                    setUser(null)
                    sessionStorage.removeItem('authTokens')
                    navigate('/login')
                    setAlertMsg(err.response.data.detail)
                    setAlertSeverity('warning')
                    setOpenAlert(true)
                }
                return Promise.reject(err)
            }
        )
        return () => axios.interceptors.response.eject(id)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
