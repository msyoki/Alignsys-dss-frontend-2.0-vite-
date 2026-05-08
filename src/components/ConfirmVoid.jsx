import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import IconButton from '@mui/material/IconButton';
import axios from 'axios';
import * as constants from './constants/constants.js';
import { FaBan, FaTimes } from 'react-icons/fa';
import Alerts from './Alert.jsx';

const pillBtn = {
  textTransform: 'none',
  fontSize: '12px',
  fontWeight: 500,
  borderRadius: '999px',
  px: 2,
  py: 0.8,
  minHeight: 34,
  boxShadow: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const iconStyle = { fontSize: '13px', flexShrink: 0 };

const ConfirmVoid = (props) => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [alertMsg, setAlertMsg] = useState('');

  const handleClose = () => props.setOpenDialogVoid(false);

  const handleClose2 = () => {
    if (!text.trim()) {
      setOpenAlert(true);
      setAlertMsg('Voiding comment is required');
      setAlertSeverity('error');
      setTimeout(() => setOpenAlert(false), 4000);
      return;
    }

    addComment(text, props.signerguid);
    props.setOpenDialogVoid(false);
    props.setOpenDialogLoading(true);

    const data = JSON.stringify({
      fileName: `${props.fileurl}`,
      ipAddress: `${props.ip}`,
      signerid: `${props.signerguid}`,
    });

    axios.request({
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.annotationsurl}/api/Decline`,
      headers: { 'Content-Type': 'application/json' },
      data,
    })
      .then(() => {
        props.setOpenDialogLoading(false);
        if (props.user) {
          navigate('/', {
            state: { openAlert: true, alertMsg: `${props.docName} voided successfully`, alertSeverity: 'success' },
          });
        } else {
          navigate('/declined', { state: { docTitle: props.docName, msg: text } });
        }
      })
      .catch(console.log);
  };

  const addComment = (comment, signer) => {
    axios.request({
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/new/comments/`,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ signer: `${signer}`, comment: `${comment}` }),
    })
      .then(() => setText(''))
      .catch(console.log);
  };

  const isEmpty = !text.trim();

  return (
    <Dialog
      open={props.opendialogvoid}
      keepMounted
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
      PaperProps={{
        sx: { borderRadius: 3, minWidth: { xs: '90%', sm: 420 }, overflow: 'hidden' },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          backgroundColor: '#1C4690',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.2,
          px: 2,
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        Confirm Voiding
        <IconButton onClick={handleClose} size="small" sx={{ color: '#fff' }}>
          <FaTimes size={13} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 2 }}>
        <DialogContentText component="div" id="alert-dialog-slide-description">

          <p style={{  fontSize: '13px', fontWeight: 400, textAlign: 'center', marginBottom: 20, marginTop:20}}>
            Please provide a reason for voiding this document.
          </p>

          <Alerts alertseverity={alertSeverity} alertmsg={alertMsg} openalert={openAlert} setOpenAlert={setOpenAlert} />

          <textarea
            rows={3}
            className="form-control mt-2 mb-1"
            placeholder="Enter reason here..."
            value={text}
            onChange={(e) => { setText(e.target.value); setTouched(true); }}
            style={{
              resize: 'none',
              fontSize: '12.5px',
              borderRadius: 8,
              border: `1px solid ${touched && isEmpty ? '#e57373' : '#ccc'}`,
              padding: '8px 10px',
            }}
          />
          {touched && isEmpty && (
            <small style={{ color: '#e57373', fontSize: '11px' }}>Reason is required to void.</small>
          )}

          <div className="d-flex justify-content-center" style={{ gap: 8, marginTop: 16 }}>
            <Button
              variant="contained"
              color="error"
              disabled={isEmpty}
              sx={pillBtn}
              onClick={handleClose2}
            >
              <FaBan style={iconStyle} />
              Void Document
            </Button>
            <Button
              variant="outlined"
              color="warning"
              sx={pillBtn}
              onClick={handleClose}
            >
              <FaTimes style={iconStyle} />
              Cancel
            </Button>
          </div>

        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmVoid;