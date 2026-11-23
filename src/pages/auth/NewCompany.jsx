import React, { useState } from 'react'
import { Link, useLocation } from "react-router-dom";
import Authcontext from '../../context/Authcontext'

import { useContext, useEffect } from 'react'
import "../../styles/App.css";
import "../../styles/Login.css";
import Alerts from '../../components/Alert';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios'
import RegistrationCompleteDialog from '../../components/dialogs/RegistrationCompleteDialog';
import { registerLicense } from '@syncfusion/ej2-base';
import { Button } from '@mui/material';
import * as constants from '../../components/constants/constants'
import { isValidEmail } from '../../utils/email'
import LoginBanner from '../../components/auth/LoginBanner.jsx'

import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';

import { Email as EmailIcon } from '@mui/icons-material';

import { CorporateFare as CorporateFareIcon } from '@mui/icons-material';
import { FaRegCreditCard } from 'react-icons/fa';
import NativeSelect from '@mui/material/NativeSelect';
import { PILL_LARGE } from '../../components/common/pillButton';

const NewCompany = () => {
  registerLicense('Mgo+DSMBPh8sVXJ0S0J+XE9HflRDX3xKf0x/TGpQb19xflBPallYVBYiSV9jS31TckVnWHlbcXFWT2NbVA==');
  let [opendialogregcomplete, setCompanyRegCompleteDialog] = useState(false)
  let [loading, setLoading] = useState(false)
  let [registered, setRegistered] = useState({ name: '', email: '' })
  const location = useLocation()


  let { alertmsg, alertseverity, openalert, setOpenAlert, setAlertMsg, setAlertSeverity } = useContext(Authcontext)

  const primaryColor = {

    color: "#1C4690"
  }

  let register_company = (e) => {
    e.preventDefault()
    if (!isValidEmail(e.target.email.value.trim())) {
      setAlertMsg('Enter a valid email address, e.g. name@company.com.')
      setAlertSeverity('error')
      setOpenAlert(true)
      return
    }
    var user_email = "useridhere@sitename.com"
    var user_ind = user_email.indexOf("@");
    var admin_domain = user_email.slice((user_ind + 1), user_email.length);


    const orgName = e.target.name.value.trim()
    const orgEmail = e.target.email.value.trim()
    var data = JSON.stringify({
      "name": orgName,
      "email": orgEmail
    });

    var config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/company/register/`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    setLoading(true)
    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
        setOpenAlert(false)
        setRegistered({ name: response.data?.name || orgName, email: orgEmail })
        setCompanyRegCompleteDialog(true)
      })
      .catch(function (error) {
        // The server says what's wrong (name or email taken, email couldn't be sent, ...).
        const data = error.response?.data || {}
        setOpenAlert(true)
        setAlertMsg(error.response
          ? (data.error || Object.values(data.fields || {}).join(' ') || 'Registration failed. Please try again.')
          : "We couldn't reach the server. Check your connection and try again.")
        setAlertSeverity("error")
        setTimeout(
          function () {
            setOpenAlert(false);
          }, 6000)
      })
      .finally(() => setLoading(false));

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
        kind="organization"
        name={registered.name}
        email={registered.email}
      />
      <div className="login-container d-flex flex-column flex-md-row" style={{ minHeight: '100vh' }}>
        {/* Left Side - Form */}
        <div className="left-side d-flex align-items-center justify-content-center w-100 w-md-50 bg-white p-4">
          <form onSubmit={register_company} className="text-center text-dark w-100" style={{ maxWidth: '320px' }}>
            
             <div className="d-flex justify-content-center align-items-center my-4" style={{ color: '#2757aa' }}>
              <h5 className="mb-0 text-dark">
                REGISTER
              </h5>
              <span className="d-block d-md-none ms-2" style={{ fontSize: '14px' }}>
                to  Digital Signing Service
              </span>
            </div>
            <Alerts alertseverity={alertseverity} alertmsg={alertmsg} openalert={openalert} setOpenAlert={setOpenAlert} />
            <div className="form-group ">

              <div className="input-group mt-1">
                <FormControl variant="standard" fullWidth>
                  <InputLabel htmlFor="input-with-icon-adornment">
                    Organization name*
                  </InputLabel>
                  <Input
                    style={{ fontSize: '13px' }}
                    id="name"
                    startAdornment={
                      <InputAdornment position="start">
                        <CorporateFareIcon />
                      </InputAdornment>
                    }
                    name="name"
                    placeholder="Enter organization name"
                    type='text'
                    required
                  />
                </FormControl>
              </div>
            </div>
            <div className="form-group ">

              <div className="input-group mt-2">

                <FormControl variant="standard" fullWidth>
                  <InputLabel htmlFor="input-with-icon-adornment">
                    Email*
                  </InputLabel>
                  <Input
                    style={{ fontSize: '13px' }}
                    id="email"
                    startAdornment={
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    }
                    name="email"
                    placeholder="Admin Email"
                    type='email'
                    required
                  />
                </FormControl>
              </div>
            </div>

            <div className="form-group ">
              {/* <div className="form-group mb-2">

                <div className="input-group mt-2 mb-1">

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


                </div>

              </div> */}

              <div className="text-center mt-3 row">
                <div className='col-lg-3 col-md-3 col-sm-3'> </div>
                <div className='col-lg-6 col-md-6 col-sm-6'>

                  {/* <ButtonComponent type="submit" cssClass='e-custom-primary' className='mb-4 m-2' style={{ textTransform: 'none', width: '100%', padding: '10px' }} disabled={false}> REGISTER</ButtonComponent>
                */}
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
          </form>
        </div>


        {/* Right Side - Banner */}
        <LoginBanner />
      </div>


    </>

  )
}

export default NewCompany



