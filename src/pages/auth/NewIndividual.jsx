import React, { useState } from 'react'
import { Link, useLocation } from "react-router-dom";
import Authcontext from '../../context/Authcontext'
import logo from '../../images/ZFWHITE.webp'
import logo2 from '../../images/ZFBLU.webp'
import { useContext, useEffect } from 'react'
import "../../styles/App.css";
import "../../styles/Login.css";
import Alerts from '../../components/Alert';
import axios from 'axios'
import RegistrationCompleteDialog from '../../components/dialogs/RegistrationCompleteDialog';
import { registerLicense } from '@syncfusion/ej2-base';

import * as constants from '../../components/constants/constants'
import { Box } from '@mui/material';
import { Button } from '@mui/material';

import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';

import EmailIcon from '@mui/icons-material/Email';

import { FaIdBadge } from 'react-icons/fa';
import PhoneIcon from '@mui/icons-material/Phone';
import AddCardIcon from '@mui/icons-material/AddCard';
import NativeSelect from '@mui/material/NativeSelect';
import { useNavigate } from 'react-router-dom';
import LoadingMini from '../../components/loaders/LoadingMini';

const NewIndividual = () => {
  registerLicense('Mgo+DSMBPh8sVXJ0S0J+XE9HflRDX3xKf0x/TGpQb19xflBPallYVBYiSV9jS31TckVnWHlbcXFWT2NbVA==');
  let [opendialogregcomplete, setCompanyRegCompleteDialog] = useState(false)
  let navigate = useNavigate()
  let [loading, setLoading] = useState(false)
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



    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      "email": e.target.email.value,
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

    let response = await fetch(`${constants.devApiBaseUrl}/api/individual/new/user/`, requestOptions)
    if (response.status === 201) {
      setLoading(false)
      setOpenAlert(true)
      setAlertMsg('account created successfully, please check your email !!!')
      setAlertSeverity('success')
      setTimeout(
        function () {
          setOpenAlert(false);

          navigate('/')
        }, 12000)
    }
    else if (response.status === 400) {
      setLoading(false)
      setOpenAlert(true)
      setAlertMsg('Account with email already exists !!!')
      setAlertSeverity('error')
      setTimeout(
        function () {
          setOpenAlert(false);
        }, 5000)
    }
    else {
      setLoading(false)
      setOpenAlert(true)
      setAlertMsg('Something went wrong, please try again later or contact admin')
      setAlertSeverity('error')
      setTimeout(
        function () {
          setOpenAlert(false);
        }, 5000)
    }



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
        opendialogregcomplete={opendialogregcomplete}
        setCompanyRegCompleteDialog={setCompanyRegCompleteDialog}
        alertmsg={alertmsg}
      />
      <div className="login-container d-flex flex-column flex-md-row" style={{ minHeight: '100vh' }}>
        {/* Left Side - Form */}
        <div className="left-side d-flex align-items-center justify-content-center w-100 w-md-50 bg-white p-4">
          <form onSubmit={registeruser} className=" text-center ">


            <Box className="d-block d-md-none text-center mb-3">
              <img src={logo2} alt="Logo" style={{ width: '300px' }} />

            </Box>
            <div className="d-flex justify-content-center align-items-center mb-3">
              <h5 className="mb-0">
                REGISTER
              </h5>
              <span className="d-block d-md-none ms-2" style={{ fontSize: '14px'}}>
                to <strong>DSS</strong> Digital Signing Service
              </span>
            </div>
            <Alerts alertseverity={alertseverity} alertmsg={alertmsg} openalert={openalert} setOpenAlert={setOpenAlert} />
            <div className='row'>
              <div className="form-group my-2 col-md-6 col-sm-12">

                <div className="input-group mt-2">

                  <FormControl variant="standard" fullWidth>
                    <InputLabel htmlFor="input-with-icon-adornment">
                      First Name*
                    </InputLabel>
                    <Input
                      style={{ fontSize: '14px' }}
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
              <div className="form-group my-2 col-md-6 col-sm-12">

                <div className="input-group mt-2">

                  <FormControl variant="standard" fullWidth>
                    <InputLabel htmlFor="input-with-icon-adornment">
                      Last Name*
                    </InputLabel>
                    <Input
                      style={{ fontSize: '14px' }}
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
              <div className="form-group my-2 col-md-6 col-sm-12">

                <div className="input-group mt-2">

                  <FormControl variant="standard" fullWidth>
                    <InputLabel htmlFor="input-with-icon-adornment">
                      Phone*
                    </InputLabel>
                    <Input
                      style={{ fontSize: '14px' }}
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
              <div className="form-group my-2 col-md-5 col-sm-12">

                <div className="input-group mt-2 mb-1">


                  <FormControl variant="standard" fullWidth>
                    <InputLabel htmlFor="input-with-icon-adornment">
                      Email*
                    </InputLabel>
                    <Input
                      style={{ fontSize: '14px' }}
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

            {loading ? <LoadingMini /> :
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


                <div className="text-center text-lg-start  pt-2 row">
                  <div className='col-lg-3 col-md-3 col-sm-3'> </div>

                  <div className='col-lg-6 col-md-6 col-sm-6'>

                    {/* <ButtonComponent type="submit" cssClass='e-custom-primary' className='mb-2 m-2' style={{ textTransform: 'none', width: '100%', padding: '10px' }} disabled={false}> Register</ButtonComponent> */}
                    <Button
                      type="submit"
                      variant="contained"
                      className="mb-3 rounded-pill my-3"
                      style={{
                        fontSize: '13px',
                        color: '#fff',
                        backgroundColor: '#2757aa',
                        width: '100%',
                        padding: '10px',
                        textTransform: 'none',
                      }}
                    >
                      REGISTER
                    </Button>
                  </div>
                  <div className='col-lg-3 col-md-3 col-sm-3'> </div>

                  <br />
                  <p className="  mt-2 pt-1 mb-0">Already have an account? <Link to={'/login'} style={{ textDecoration: 'none', color: '#1C4690' }}><span className='m-1'>Login to my account</span></Link></p>
                </div>
              </div>

            }

          </form>
        </div>

        {/* Right Side - Banner */}
        <div
          className="d-none d-md-flex right-side bg w-100 w-md-50 flex-column justify-content-center align-items-center"
          style={{
            backgroundColor: '#007bff',
            padding: '20px',
          }}
        >
          <img src={logo} alt="Logo" width="300px" />
          <p className="text-white mt-4" style={{ fontSize: '15px' }}>
            <strong>DSS</strong> Digital Signing Service
          </p>
        </div>
      </div>
    </>

  )
}

export default NewIndividual




