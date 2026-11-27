import React, { useContext, useEffect, useState } from 'react';
import { PILL_LARGE } from '../../components/common/pillButton';
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
import LoginBanner from '../../components/auth/LoginBanner.jsx';

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

            {/* Full form width, same as the Create account / Register organisation buttons. */}
            <div className="text-center mt-3">
              <div>
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
                  disableElevation
                  className="mb-3"
                  disabled={miniLoader}
                  aria-busy={miniLoader}
                  startIcon={miniLoader ? <CircularProgress size={14} thickness={5} sx={{ color: '#fff' }} /> : null}
                  sx={{
                    ...PILL_LARGE,
                    width: '100%',
                    minHeight: 40,
                    fontSize: '13.5px',
                    fontWeight: 600,
                    letterSpacing: '0.2px',
                    color: '#fff',
                    bgcolor: '#2757aa',
                    boxShadow: 'none',
                    transition: 'background-color .15s ease, transform .1s ease',
                    '&:hover': { bgcolor: '#1a3a7a', boxShadow: 'none' },
                    '&:active': { transform: 'scale(0.98)' },
                    '&:focus-visible': { outline: '2px solid #2757aa', outlineOffset: 2 },
                    // While signing in: stay in the brand colour (slightly softened), not grey.
                    '&.Mui-disabled': { bgcolor: '#2757aa', color: '#fff', opacity: 0.85, cursor: 'progress' },
                  }}
                >
                  {miniLoader ? 'Signing in…' : 'Sign in'}
                </Button>
              </div>
            </div>

            <div className="mt-2">
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
        <LoginBanner />
      </div>

    </>
  );
};

export default Login;
