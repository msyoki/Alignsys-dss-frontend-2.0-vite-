import React, { useState } from 'react'
import { Link, useLocation } from "react-router-dom";
import Authcontext from '../../context/Authcontext'

import { useContext, useEffect } from 'react'
import "../../styles/App.css";
import "../../styles/Login.css";
import Alerts from '../../components/Alert';
import { Box } from '@mui/material';
import axios from 'axios'
import RegistrationCompleteDialog from '../../components/dialogs/RegistrationCompleteDialog';
import { registerLicense } from '@syncfusion/ej2-base';
import { Button } from '@mui/material';
import * as constants from '../../components/constants/constants'
import logo from '../../images/ZFWHITE.webp'
import logo2 from '../../images/ZFBLU.webp'

import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';

import EmailIcon from '@mui/icons-material/Email';

import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import { FaRegCreditCard } from 'react-icons/fa';
import NativeSelect from '@mui/material/NativeSelect';

const NewCompany = () => {
  registerLicense('Mgo+DSMBPh8sVXJ0S0J+XE9HflRDX3xKf0x/TGpQb19xflBPallYVBYiSV9jS31TckVnWHlbcXFWT2NbVA==');
  let [opendialogregcomplete, setCompanyRegCompleteDialog] = useState(false)
  const location = useLocation()


  let { alertmsg, alertseverity, openalert, setOpenAlert, setAlertMsg, setAlertSeverity } = useContext(Authcontext)

  const primaryColor = {

    color: "#1C4690"
  }

  let register_company = (e) => {
    e.preventDefault()
    var user_email = "useridhere@sitename.com"
    var user_ind = user_email.indexOf("@");
    var admin_domain = user_email.slice((user_ind + 1), user_email.length);


    var data = JSON.stringify({
      "name": e.target.name.value,
      "email": e.target.email.value
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

    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
        setCompanyRegCompleteDialog(true)
      })
      .catch(function (error) {
        console.log(error);
        setOpenAlert(true)
        setAlertMsg("company with this name/email already registered.")
        setAlertSeverity("error")
        setTimeout(
          function () {
            setOpenAlert(false);
          }, 6000)
      });

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
          <form onSubmit={register_company} className=" text-center ">
            
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
            <div className="form-group ">

              <div className="input-group mt-1">
                <FormControl variant="standard" fullWidth>
                  <InputLabel htmlFor="input-with-icon-adornment">
                    Organization name*
                  </InputLabel>
                  <Input
                    style={{ fontSize: '14px' }}
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
                    style={{ fontSize: '14px' }}
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

              <div className="text-center text-lg-start mt-2  row">
                <div className='col-lg-3 col-md-3 col-sm-3'> </div>
                <div className='col-lg-6 col-md-6 col-sm-6'>

                  {/* <ButtonComponent type="submit" cssClass='e-custom-primary' className='mb-4 m-2' style={{ textTransform: 'none', width: '100%', padding: '10px' }} disabled={false}> REGISTER</ButtonComponent>
                */}
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

export default NewCompany



