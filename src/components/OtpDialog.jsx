import React, { useState, useRef, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { styled, keyframes } from '@mui/system';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';

import Alert from '../components/Alert';
import logo from '../images/ZFBLU.png';
import * as constants from '../components/constants/constants';

import { Button } from '@mui/material';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const StyledDialog = styled(Dialog)({
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  '& .MuiPaper-root': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    overflow: 'visible',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const InputField = styled('input')({
  width: '50px',
  height: '50px',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#ffffff',
  backgroundColor: '#2757aa',
  border: '2px solid #ffffff',
  borderRadius: '12px',
  textAlign: 'center',
  marginRight: '10px',
  transition: 'all 0.3s ease-in-out',
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  '&:hover': {
    backgroundColor: '#1f4891',
    borderColor: '#ffffff',
  },
  '&:focus': {
    backgroundColor: '#1c3d7d',
    outline: 'none',
    borderColor: '#ffffff',
    boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.3)',
  },
  '::placeholder': {
    color: '#dfe6f3',
  },
});

const ContentWrapper = styled('div')({
  padding: '30px',
  backgroundColor: '#fff',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '300px',
  maxWidth: '90vw',
});

const IconWrapper = styled('div')({
  animation: `${fadeIn} 0.5s ease`,
  fontSize: '40px',
  marginBottom: '20px',
});

const OtpDialog = (props) => {
  const [otp, setOtp] = useState('');
  const [locked, setLocked] = useState(true);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  const [initialSent, setInitialSent] = useState(false)
  const [showTimer, setShowTimer] = useState(false)

  const handleChange = (e, i) => {
    const newOtp = otp.split('');
    const val = e.target.value.replace(/\D/, '');
    newOtp[i] = val;
    setOtp(newOtp.join(''));

    if (val && i < 5) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const showAlert = (msg, severity) => {
    props.setAlertMsg(msg);
    props.setAlertSeverity(severity);
    props.setOpenAlert(true);
    setTimeout(() => props.setOpenAlert(false), 3000);
  };

  const validateOTP = async () => {
    // console.log(otp)
    if (otp.length !== 6) {
      showAlert('Please enter the complete 6-digit OTP', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${constants.devApiBaseUrl}/api/verify/otp/`, {
        otp,
        phone: props.otpphone,
      });
      setLocked(false);
      setTimeout(() => props.setOpenDialogOtp(false), 3000);
    } catch {
      showAlert('Invalid OTP code!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isSendingRef = useRef(false);

const resendOtp = async () => {
  if (isSendingRef.current) return; // prevent duplicate call
  if (props.trialcount >= 3) {
    showAlert('Maximum trials reached, try later!!', 'error');
    return;
  }

  isSendingRef.current = true;

  try {
    await axios.post(`${constants.devApiBaseUrl}/api/sms/otp/`, {
      phone: props.otpphone,
    });
    props.setResetTimer(true);
    props.setTime(600);
    props.timerClock();
    props.setTrialCount((prev) => prev + 1);
    showAlert('OTP sent successfully!', 'success');
  } catch {
    showAlert('Failed to send OTP. Please try again.', 'error');
  } finally {
    isSendingRef.current = false;
  }
};


  const sendInitial = () => {
    resendOtp()
    setShowTimer(true)
    setInitialSent(true)
  }

 

  const minutes = Math.floor(props.time / 60);
  const seconds = props.time % 60;
  const maskedPhone = props.otpphone ? `***** *** ${props.otpphone.slice(-3)}` : '*** *** ***';
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!props.opendialogotp) return;

      if (/^\d$/.test(e.key) && activeIndex < 6) {
        const newOtp = otp.split('');
        newOtp[activeIndex] = e.key;
        setOtp(newOtp.join(''));

        // Move focus to next box
        inputsRef.current[activeIndex]?.focus();
        setActiveIndex((prev) => Math.min(prev + 1, 5));
      } else if (e.key === 'Backspace' && activeIndex > 0) {
        const newOtp = otp.split('');
        newOtp[activeIndex - 1] = '';
        setOtp(newOtp.join(''));

        setActiveIndex((prev) => Math.max(prev - 1, 0));
        inputsRef.current[activeIndex - 1]?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [otp, activeIndex, props.opendialogotp]);




  return (
    <StyledDialog open={props.opendialogotp}>
      <DialogContent
        sx={{
          backgroundColor: 'transparent',
          padding: 0,
          overflow: 'visible',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ContentWrapper>
          <IconWrapper>
            <i style={{ color: "#2757aa" }} className={`fas ${locked ? 'fa-lock' : 'fa-unlock-alt'}`} />
          </IconWrapper>

          {loading ? (
            <div className="d-flex flex-column align-items-center text-center">
              <div className="mb-3">
                <img src={logo} alt="logo" width="200" />
              </div>
              <div>
                <p className="my-2 mb-2" style={{ fontWeight: '500', color: '#555' }}>Validating OTP...</p>
              </div>
              <div className="mb-3">
                <CircularProgress size={50} style={{ color: '#2757aa' }} />
              </div>
            </div>
          ) : locked ? (
            <>
              <p style={{ color: '#555' }}>Enter the 6-digit OTP sent to:</p>
              <strong style={{ color: '#2757aa' }}>{maskedPhone}</strong>
              <div style={{ marginTop: '20px', marginBottom: '10px' }}>
                {[...Array(6)].map((_, i) => (
                  <InputField
                    key={i}
                    maxLength={1}
                    value={otp[i] || ''}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    ref={(el) => (inputsRef.current[i] = el)}
                  />
                ))}
              </div>
              {showTimer ? (
                <p style={{ color: '#555' }}>
                  Time left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </p>
              ) : null}

              {initialSent ? (
                <>
                  {otp.length < 6 ? <></> : <Button
                    color="primary"
                    variant='contained'
                    type="button"
                    onClick={validateOTP}
              
                    cssClass="e-custom-success"
                    className="mb-3 m-2"
                    style={{ textTransform: 'none', fontWeight: 'lighter', width: '40%', padding: '10px' }}

                  >
                    Verify Otp
                  </Button>}


                  <p
                    onClick={resendOtp}
                    className="mb-3 m-2 btn btn-sm"
                    style={{
                      textTransform: 'none',
                      fontWeight: 'lighter',
                      padding: '10px',
                      color: '#2757aa',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    RESEND NEW CODE ({props.trialcount}/3)
                  </p>
                </>
              ) : (
                <Button
                  color="primary"
                  variant='contained'
                  type="button"
                  onClick={sendInitial}
            

                  cssClass="e-custom-success"
                  className="my-4"
                  style={{ textTransform: 'none', fontWeight: 'lighter', width: '40%', padding: '10px' }}

                >
                  Send Otp
                </Button>
              )}
            </>
          ) : (
            <p>OTP Verified Successfully!</p>
          )}
          <Alert
            alertseverity={props.alertseverity}
            alertmsg={props.alertmsg}
            openalert={props.openalert}
            setOpenAlert={props.setOpenAlert}
          />
        </ContentWrapper>
      </DialogContent>
    </StyledDialog>
  );
};

export default OtpDialog;
