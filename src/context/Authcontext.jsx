import React from 'react'
import {createContext, useState, useEffect} from 'react'
import jwt_decode from "jwt-decode";
import { useNavigate  } from "react-router-dom";
import Loading from '../components/loaders/LoadingDialog';
import axios from "axios"
import * as constants from '../components/constants/constants'
const Authcontext= createContext()

export default Authcontext;

export const AuthProvider = ({children}) => {
    
    let[authTokens, setAuthtokens]= useState(()=>sessionStorage.getItem('authTokens')? JSON.parse(sessionStorage.getItem('authTokens')): null)
    let[user, setUser]= useState(()=>sessionStorage.getItem('authTokens')? jwt_decode(sessionStorage.getItem('authTokens')): null)
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

    let updateToken = async ()=>{


        try {
            const response = await axios.post(`${constants.devApiBaseUrl}/api/token/refresh/`,{
                refresh:authTokens?.refresh
            })
            const data= response.data
            if(response.status === 200){
                setAuthtokens(data)
                setUser(jwt_decode(data.access))
                // console.log(jwt_decode(data.access))
                sessionStorage.setItem('authTokens',JSON.stringify(data))
            }else{
            
                logoutUser()
            }
        }
        catch(error){
            logoutUser()
        }
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


    // Update token
    useEffect(()=>{
        
        if(loading){
            updateToken()
        }
        let threeMinutes= 1000*60*3
        let interval= setInterval(()=>{
            if(authTokens){
                updateToken()
            }
        },threeMinutes)
        return ()=>clearInterval(interval)
    }, [authTokens, loading])
  return (
  
    <Authcontext.Provider value={contextData}>
        {loading ? <Loading/>: children}
    </Authcontext.Provider>
    
  )
}
