import React, { useState } from 'react'
import { Link, useLocation } from "react-router-dom";
import Authcontext from '../../context/Authcontext'
import LoginBanner from '../../components/auth/LoginBanner.jsx'
import { useContext, useEffect } from 'react'
import "../../styles/App.css";
import "../../styles/Login.css";
import Alerts from '../../components/Alert';
import axios from 'axios'
import RegistrationCompleteDialog from '../../components/dialogs/RegistrationCompleteDialog';
import { registerLicense } from '@syncfusion/ej2-base';

import * as constants from '../../components/constants/constants'
import { isValidEmail } from '../../utils/email'
import { Box, CircularProgress } from '@mui/material';
import { Button } from '@mui/material';

import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';

import { Email as EmailIcon } from '@mui/icons-material';

import { FaIdBadge, FaEnvelope, FaPhone, FaRegCreditCard } from 'react-icons/fa';
import { Phone as PhoneIcon } from '@mui/icons-material';
import { AddCard as AddCardIcon } from '@mui/icons-material';
import NativeSelect from '@mui/material/NativeSelect';
import { useNavigate } from 'react-router-dom';
import { PILL_LARGE } from '../../components/common/pillButton';

const NewIndividual = () => {
  registerLicense('Mgo+DSMBPh8sVXJ0S0J+XE9HflRDX3xKf0x/TGpQb19xflBPallYVBYiSV9jS31TckVnWHlbcXFWT2NbVA==');
  let [opendialogregcomplete, setCompanyRegCompleteDialog] = useState(false)
  let navigate = useNavigate()
  let [loading, setLoading] = useState(false)
  let [registered, setRegistered] = useState({ name: '', email: '' })
  const location = useLocation()

  const loginlogo = {
    width: "70%",
  }

  let { authTokens, loginUser, alertmsg, alertseverity, openalert, setOpenAlert, setAlertMsg, setAlertSeverity } = useContext(Authcontext)
  const companylink = {
    textDecoration: "None",
    color: 'white'

  }
  const primaryColor = {

    color: "#1C4690"
  }

  let registeruser = async (e) => {
    e.preventDefault()
    if (!isValidEmail(e.target.email.value.trim())) {
      setAlertMsg('Enter a valid email address, e.g. name@company.com.')
      setAlertSeverity('error')
      setOpenAlert(true)
      return
    }



    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const email = e.target.email.value.trim()
    const first_name = e.target.fname.value.trim()
    var raw = JSON.stringify({
      "email": e.target.email.value.trim(),
      "first_name": e.target.fname.value,
      "last_name": e.target.lname.value,
      "phone": e.target.phone.value,
    });
    setLoading(true)
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    // Never left on "loading": every outcome, including no network, ends it.
    let response = null
    let data = {}
    try {
      response = await fetch(`${constants.devApiBaseUrl}/api/individual/new/user/`, requestOptions)
      data = await response.json().catch(() => ({}))
    } catch (err) {
      response = null
    } finally {
      setLoading(false)
    }

    if (response && response.status === 201) {
      // A request: a super admin approves it, then a "Set your password" email follows.
      setOpenAlert(false)
      setRegistered({ name: data.first_name || first_name, email: data.email || email })
      setCompanyRegCompleteDialog(true)
      return
    }
    setOpenAlert(true)
    setAlertMsg(!response
      ? "We couldn't reach the server. Check your connection and try again."
      : (data.error || Object.values(data.fields || {}).join(' ') || 'Registration failed. Please try again.'))
    setAlertSeverity('error')
    setTimeout(function () { setOpenAlert(false) }, 7000)



  }



  useEffect(() => {

    try {
      setOpenAlert(location.state.openalert)
      setAlertMsg(location.state.alertmsg)
      setAlertSeverity(location.state.alertseverity)
      setTimeout(
        function () {
          setOpenAlert(false);
        }, 3000)
    }
    catch (err) {
    }

  }, [])

  return (
    <>
      <RegistrationCompleteDialog
        open={opendialogregcomplete}
        onClose={() => setCompanyRegCompleteDialog(false)}
        kind="individual"
        name={registered.name}
        email={registered.email}
      />
      <div className="login-container d-flex flex-column flex-md-row" style={{ minHeight: '100vh' }}>
        {/* Left Side - Form */}
        <div className="left-side d-flex align-items-center justify-content-center w-100 w-md-50 bg-white p-4">
          <form onSubmit={registeruser} className="text-center text-dark w-100" style={{ maxWidth: '320px' }}>


            <div className="d-flex justify-content-center align-items-center my-4" style={{ color: '#2757aa' }}>
              <h5 className="mb-0 text-dark">
                REGISTER
              </h5>
              <span className="d-block d-md-none ms-2" style={{ fontSize: '14px' }}>
                to  Digital Signing Service
              </span>
            </div>
            <Alerts alertseverity={alertseverity} alertmsg={alertmsg} openalert={openalert} setOpenAlert={setOpenAlert} />
            <div className='row'>
              <div className="form-group my-2 col-12">

                <div className="input-group mt-2">

                  <FormControl variant="standard" fullWidth>
                    <InputLabel htmlFor="input-with-icon-adornment">
                      First Name*
                    </InputLabel>
                    <Input
                      style={{ fontSize: '13px' }}
                      id="fname"
                      startAdornment={
                        <InputAdornment position="start">
                          <FaIdBadge />
                        </InputAdornment>
                      }
                      name="fname"
                      placeholder="Enter first name"
                      type='text'
                      required
                    />
                  </FormControl>
                </div>
              </div>
              <div className="form-group my-2 col-12">

                <div className="input-group mt-2">

                  <FormControl variant="standard" fullWidth>
                    <InputLabel htmlFor="input-with-icon-adornment">
                      Last Name*
                    </InputLabel>
                    <Input
                      style={{ fontSize: '13px' }}
                      id="lname"
                      startAdornment={
                        <InputAdornment position="start">
                          <FaIdBadge />
                        </InputAdornment>
                      }
                      name="lname"
                      placeholder="Enter last name"
                      type='text'
                      required
                    />
                  </FormControl>
                </div>
              </div>
            </div>
            <div className='row'>
              <div className="form-group my-2 col-12">

                <div className="input-group mt-2">

                  <FormControl variant="standard" fullWidth>
                    <InputLabel htmlFor="input-with-icon-adornment">
                      Phone*
                    </InputLabel>
                    <Input
                      style={{ fontSize: '13px' }}
                      id="phone"
                      startAdornment={
                        <InputAdornment position="start">
                          <FaPhone />
                        </InputAdornment>
                      }
                      name="phone"
                      placeholder="e.g. 07xx xxx xxx"
                      type='phone'
                      inputProps={{
                        pattern: '[0]{1}[1-7]{1}[0-9]{2}[0-9]{3}[0-9]{3}',
                      }}
                      required
                    />
                  </FormControl>
                </div>
              </div>
              <div className="form-group my-2 col-12">

                <div className="input-group mt-2 mb-1">


                  <FormControl variant="standard" fullWidth>
                    <InputLabel htmlFor="input-with-icon-adornment">
                      Email*
                    </InputLabel>
                    <Input
                      style={{ fontSize: '13px' }}
                      id="email"
                      startAdornment={
                        <InputAdornment position="start">
                          <FaEnvelope />
                        </InputAdornment>
                      }
                      name="email"
                      placeholder="Email address"
                      type='email'
                      required
                    />
                  </FormControl>

                </div>


              </div>
            </div>

            {
              <div className="form-group ">
                {/* 
                <div className="input-group mt-2 mb-3">

                  <FormControl fullWidth>
                    <InputLabel variant="standard" htmlFor="uncontrolled-native">
                      Package Plan*
                    </InputLabel>
                    <NativeSelect
                      style={{ fontSize: '14px' }}
                      defaultValue={30}
                      inputProps={{
                        name: 'plan',
                        id: 'plan',
                      }}
                      startAdornment={
                        <InputAdornment position="start">
                          <FaRegCreditCard />
                        </InputAdornment>
                      }
                    >
                      <option value={"Free trial"} >Free trial</option>
                      <option value={"Advanced"}>Advanced</option>

                    </NativeSelect>
                  </FormControl>
                </div> */}


                <div className="text-center mt-3 row">
                  <div className='col-lg-3 col-md-3 col-sm-3'> </div>

                  <div className='col-lg-6 col-md-6 col-sm-6'>

                    {/* <ButtonComponent type="submit" cssClass='e-custom-primary' className='mb-2 m-2' style={{ textTransform: 'none', width: '100%', padding: '10px' }} disabled={false}> Register</ButtonComponent> */}
                    <Button
                      type="submit"
                      variant="contained"
                      className="mb-3"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
                      sx={{
                        ...PILL_LARGE,
                        width: '100%',
                        backgroundColor: loading ? '#ccc' : '#2757aa',
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: loading ? '#ccc' : '#1a3a7a',
                        },
                      }}
                    >
                      {loading ? 'Registering ...' : 'REGISTER'}
                    </Button>
                  </div>
                  <div className='col-lg-3 col-md-3 col-sm-3'> </div>

                  <br />
                  <div className="mt-3 text-center">
                    <small style={{ fontSize: '13px' }}>
                      Already have an account?{' '}
                      <Link to="/login" style={{ color: '#2757aa', textDecoration: 'none' }}>
                        Login to my account
                      </Link>
                    </small>
                  </div>

                  <div className="mt-4">
                    <a
                      href="https://edms.alignsys.tech"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: '#2757aa', textDecoration: 'none' }}
                    >
                      EDMS - Electronic Document Management System
                    </a>
                  </div>
                </div>
              </div>

            }

          </form>
        </div>


        {/* Right Side - Banner */}
        <LoginBanner />
      </div>
    </>

  )
}

export default NewIndividual




