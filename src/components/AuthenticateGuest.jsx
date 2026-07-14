import React, { useState, useContext } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import { FaLock, FaLockOpen, FaCheck, FaTimes, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import Authcontext from '../context/Authcontext.jsx';
import LoadingMini from './loaders/LoadingMini.jsx';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/Input';

const AuthGuestDialog = (props) => {
  const [loading, setLoading] = useState(false);
  const [maxWidth] = useState('sm');
  const { authenticateGuest } = useContext(Authcontext);
  const [showPassword, setShowPassword] = useState(false);

  const handleCancel = () => {
    window.location.reload();
  };

  async function VerifyGuest(e) {
    e.preventDefault();
    setLoading(true);
    const username = props.signersEmail;
    const password = e.target.password.value;
    const response = await authenticateGuest(e, username, password);

    if (response === 200) {
      setTimeout(() => {
        setLoading(false);
        props.setLocked(false);
        setTimeout(() => {
          props.setOpenDialogAuthGuest(false);
          if (props.selfSign) {
            props.setOpenConfirmCompleteDialog(true);
          }
        }, 1000);
      }, 1000);
    } else {
      setLoading(false);
      alert("Invalid password");
    }
  }

  const togglePassword = () => setShowPassword((prev) => !prev);
  const actionBtn = {
    textTransform: 'none',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '999px',
    px: 1.8,
    py: 0.8,
    minHeight: 34,
    boxShadow: 'none',
  };

  return (
    <Dialog
      open={props.opendialogauthguest}
      maxWidth={maxWidth}
      keepMounted
      aria-describedby="alert-dialog-slide-description"
      PaperProps={{
        style: { borderRadius: 18, minWidth: 380, background: 'white' }
      }}
    >
      <DialogContent style={{ padding: '32px 24px 24px 24px' }}>
        {props.locked ? (
          loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 220 }}>
              <LoadingMini msg="Verifying" msg2="Please wait while we verify your password..." />
              <FaLock style={{ fontSize: '48px', color: '#174291' }} className="my-3" />
            </div>
          ) : (
            <form autoComplete="off" onSubmit={VerifyGuest} className="w-100">
              <div className="d-flex flex-column align-items-center mb-3">
                <FaLock style={{ fontSize: '38px', color: '#174291' }} className="mb-2" />
                <div style={{ color: '#174291', fontSize: '16px' }}>Signature is locked</div>
                <div className="mt-2 mb-1" style={{ fontSize: '13px', color: '#555' }}>
                  To sign as <span style={{ color: '#174291' }}>{props.signersEmail}</span>
                </div>
              </div>
              <div className="mb-3">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter account password"
                  autoComplete='off'
                  name="password"
                  required
                  fullWidth
                  startAdornment={
                    <InputAdornment position="start">
                      <FaKey />
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      {showPassword ? (
                        <FaEye
                          onClick={togglePassword}
                          className="ms-2"
                          id="togglePassword"
                          style={{ cursor: 'pointer', color: '#174291' }}
                        />
                      ) : (
                        <FaEyeSlash
                          onClick={togglePassword}
                          className="ms-2"
                          id="togglePassword"
                          style={{ cursor: 'pointer', color: '#174291' }}
                        />
                      )}
                    </InputAdornment>
                  }
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    fontSize: 14,
                    padding: '8px 12px',
                    width: '100%'
                  }}
                />
              </div>
              <div className="d-flex justify-content-between align-items-center w-100 mt-3">

                <Button
                  onClick={handleCancel}
                  variant="outlined"
                  color="warning"
                  size="small"
                  sx={{
                    ...actionBtn,
                  }}
                  startIcon={<FaTimes />}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{
                    ...actionBtn,
                  }}
                  startIcon={<FaCheck />}
                >
                  Submit Password
                </Button>

              </div>
            </form>
          )
        ) : (
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 220 }}>
            <LoadingMini msg="Document Unlocked" msg2="Click on the page to place your signature" />
            <FaLockOpen style={{ fontSize: '48px', color: '#174291' }} className="my-3" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthGuestDialog;