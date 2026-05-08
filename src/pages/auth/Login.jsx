import React, { useContext, useEffect, useState } from 'react';
console.log("Login component rendered");
import { Link, useLocation } from 'react-router-dom';
import {
  InputLabel,
  InputAdornment,
  FormControl,
  Input,
  Box,
  CircularProgress
} from '@mui/material';
import { FaEye, FaEyeSlash, FaKey, FaUser, FaEnvelope } from 'react-icons/fa';
import { Button } from '@mui/material';

import Authcontext from '../../context/Authcontext.jsx';
import TermsAndConditionsDialog from '../../components/dialogs/TermsAndConditionsDialog.jsx';
import TimedAlert from '../../components/TimedAlert.jsx';
import { Visibility, VisibilityOff, Key, Person } from '@mui/icons-material';
import logo from '../../images/ZFWHITE.png';
import logo2 from '../../images/ZFBLU.png';

import '../../styles/App.css';
import '../../styles/Login.css';

const Login = () => {
  const [opentandcdialog, setOpenTAndCDialog] = useState(false);
  const location = useLocation();

  const {
    miniLoader,
    loginUser,
    alertmsg,
    alertseverity,
    openalert,
    setOpenAlert,
    setAlertMsg,
    setAlertSeverity,
  } = useContext(Authcontext);

  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleClickOpenTC = () => setOpenTAndCDialog(true);

  useEffect(() => {
    try {
      if (location.state) {
        setOpenAlert(location.state.openalert);
        setAlertMsg(location.state.alertmsg);
        setAlertSeverity(location.state.alertseverity);
        setTimeout(() => setOpenAlert(false), 3000);
      }
    } catch (err) {
      // No location state
    }
  }, [location]);

  return (
    <>
      <TermsAndConditionsDialog
        opentandcdialog={opentandcdialog}
        setOpenTAndCDialog={setOpenTAndCDialog}
      />

      <div className="login-container d-flex flex-column flex-md-row" style={{ minHeight: '100vh' }}>
        {/* Left Side - Form */}
        <div className="left-side d-flex align-items-center justify-content-center w-100 w-md-50 bg-white p-4">
          <form onSubmit={loginUser} className="text-center text-dark w-100" style={{ maxWidth: '320px' }}>
            {/* Logo for small screens */}
            {/* <Box className="d-block d-md-none text-center mb-3">
              <img src={logo2} alt="Logo" style={{ width: '300px' }} />

            </Box> */}
            <div className="d-flex justify-content-center align-items-center my-4" style={{ color: '#2757aa' }}>
              <h5 className="mb-0 text-dark">
                LOGIN
              </h5>
              <span className="d-block d-md-none ms-2" style={{ fontSize: '14px' }}>
                to  Digital Signing Service
              </span>
            </div>

            <TimedAlert
              open={openalert}
              onClose={() => setOpenAlert(false)}
              severity={alertseverity}
              message={alertmsg}
              setSeverity={setAlertSeverity}
              setMessage={setAlertMsg}
            />

            <FormControl variant="standard" fullWidth className="mb-3">
              <InputLabel htmlFor="email">Email*</InputLabel>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="User email address"
                style={{ fontSize: '13px' }}
                startAdornment={
                  <InputAdornment position="start">
                    <FaUser />
                  </InputAdornment>
                }
              />
              {/* <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  constants.auth_type_email === 'true' ? 'Email' : 'Username'
                }
                startAdornment={
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                }
                style={{ fontSize: '14px' }}
              /> */}
            </FormControl>

            <FormControl variant="standard" fullWidth className="mb-2">
              <InputLabel htmlFor="password">Password*</InputLabel>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="User password"
                style={{ fontSize: '13px' }}
                startAdornment={
                  <InputAdornment position="start">
                    <FaKey />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    {showPassword ? (
                      <FaEye
                        id="togglePassword"
                        onClick={togglePasswordVisibility}
                        style={{ cursor: 'pointer' }}
                        className="ml-2"
                      />
                    ) : (
                      <FaEyeSlash
                        id="togglePassword"
                        onClick={togglePasswordVisibility}
                        style={{ cursor: 'pointer' }}
                        className="ml-2"
                      />
                    )}
                  </InputAdornment>
                }
              />
            </FormControl>

            <div className="d-flex justify-content-between align-items-center my-2">
              <div></div>
              <Link to="/password-reset" style={{ fontSize: '13px', color: '#2757aa', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <div className="form-check mt-1 text-start">
              <input className="form-check-input" type="checkbox" id="flexCheckTnC" required />
              <label className="form-check-label" htmlFor="flexCheckTnC">
                <p style={{ fontSize: '13px' }}>
                  I have read and agreed to the{' '}
                  <a
                    onClick={handleClickOpenTC}
                    style={{ color: '#1C4690', cursor: 'pointer', textDecoration: 'none' }}
                  >
                    Terms and Conditions
                  </a>
                </p>
              </label>
            </div>

            <div className="text-center mt-3 row">
              <div className="col-lg-3 col-md-3" />
              <div className="col-lg-6 col-md-6">
                {/* 
                <Button
                  type="submit"
                  variant="contained"
                  className="mb-3 rounded-pill"
                  style={{
                    fontSize: '13px',
                    color: '#fff',
                    backgroundColor: '#2757aa',
                    width: '100%',
                    padding: '10px',
                    textTransform: 'none',
                  }}
                >
                  LOGIN
                </Button> */}
                <Button
                  type="submit"
                  variant="contained"
                  className="mb-3 rounded-pill"
                  disabled={miniLoader}
                  startIcon={miniLoader ? <CircularProgress size={14} color="inherit" /> : null}
                  sx={{
                    fontSize: '13px',
                    textTransform: 'none',
                    width: '100%',
                    px: 2,
                    py: 1,
                    backgroundColor: miniLoader ? '#ccc' : '#2757aa',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: miniLoader ? '#ccc' : '#1e4794',
                    },
                  }}
                >
                  {miniLoader ? 'Logging in ...' : 'LOGIN'}
                </Button>

              </div>
              <div className="col-lg-3 col-md-3" />
            </div>

            <div className="mt-3">
              <small style={{ fontSize: '13px' }}>
                Don't have an account?
                <br />
                <br />
                Register your{' '}
                <Link to="/company/register" style={{ color: '#2757aa', textDecoration: 'none' }}>
                  Organization
                </Link>{' '}
                or{' '}
                <Link to="/individual/register" style={{ color: '#2757aa', textDecoration: 'none' }}>
                  Individual
                </Link>{' '}
                account.
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


          </form>
        </div>

        {/* Right Side - Banner */}
        <div
          className="d-none d-md-flex right-side w-100 w-md-50 flex-column justify-content-center align-items-center"
          style={{
            backgroundColor: '#2757aa',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <img
            src={logo}
            alt="Banner Logo"
            style={{
              width: '300px',
              maxWidth: '80%',
              filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.25))',
            }}
          />

          <p
            className="text-white mt-4"
            style={{
              fontSize: '18px',
              fontWeight: 500,
              opacity: 0.9,
              letterSpacing: '0.5px',
            }}
          >
            <strong style={{ fontSize: '20px' }}>DSS</strong> Digital Signing Service
          </p>

          <div
            style={{
              width: '60px',
              height: '4px',
              backgroundColor: 'white',
              opacity: 0.5,
              borderRadius: '2px',
              marginTop: '10px',
            }}
          ></div>

          <p
            className="text-white mt-4"
            style={{
              fontSize: '14px',
              maxWidth: '340px',
              lineHeight: '1.6',
              opacity: 0.85,
            }}
          >
            Sign and manage documents digitally with secure, seamless workflow automation.
          </p>
        </div>

      </div>

    </>
  );
};

export default Login;
