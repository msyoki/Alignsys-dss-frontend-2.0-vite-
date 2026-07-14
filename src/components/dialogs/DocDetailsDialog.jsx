import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaEnvelopeOpenText, FaEnvelope, FaCircle, FaSpinner } from 'react-icons/fa';
import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import * as constants from '../constants/constants';
import logo from '../../images/ZFWHITE.webp';
import axios from 'axios';
import SimpleAlert from '../SimpleAlert.jsx';
import { FaDownload } from "react-icons/fa6";
import HumanizedDate from '../HumanizeDate.jsx';
const DocDetailsDialog = ({ opendialogdocdetails, setOpenDialogDocDetails, document = {} }) => {
  const handleClose = () => setOpenDialogDocDetails(false);
  const [editingSigner, setEditingSigner] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [isLoadingSubstitute, setIsLoadingSubstitute] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [alertMsg, setAlertMsg] = useState('');

  const startEdit = (email) => {
    setEditingSigner(email);
    setNewEmail('');
  };

  const cancelEdit = () => {
    setEditingSigner(null);
    setNewEmail('');
  };

  const showAlert = (message, severity) => {
    setAlertMsg(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
  };

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (openAlert) {
      const timer = setTimeout(() => {
        setOpenAlert(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [openAlert]);

  const submitChange = () => {
    if (!newEmail) return alert('Please enter a new email');
    handleSwapSigner(editingSigner, newEmail);
    cancelEdit();
  };

  const handleSwapSigner = async (oldEmail, newEmail) => {
    setIsLoadingSubstitute(true);
    try {
      // Call backend or perform update
      await axios.post('/api/swap-signer', { oldEmail, newEmail });
      showAlert(`Signer changed from ${oldEmail} → ${newEmail}`, 'success');
      // Optionally refresh signer list
    } catch (err) {
      console.error(err);
      showAlert('Failed to update signer', 'error');
    } finally {
      setIsLoadingSubstitute(false);
    }
  };


  const {
    title = 'N/A',
    owner = 'N/A',
    docdate = 'N/A',
    signedcomplete = 'False',
    declined = 'False',
    guid = 'N/A',
    expirydate = 'N/A',
    signers = [],
  } = document;

  return (
    <Dialog open={opendialogdocdetails} onClose={handleClose} fullWidth maxWidth="sm">
      {/* Header */}
      <DialogTitle
        className="p-2 d-flex justify-content-between align-items-center"
        style={{ backgroundColor: '#2757aa', color: '#fff', fontSize: '15px' }}
      >
        <img src={logo} alt="Logo" width="130px" className="mx-3" />
        <span className="flex items-center mx-3 cursor-pointer">
          <span className="font-bold mx-1">Document Details</span>
          <IconButton onClick={handleClose} style={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </span>
      </DialogTitle>

      {/* Content */}
      <DialogContent style={{ fontSize: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
        <div className="row">
          <p className='text-center font-weight-bold mt-3'>
            <span style={{ color: '#2757aa' }}>Title</span><br />
            {title}
          </p>
          {signers.length > 0 && (
            <p className="font-weight-bold text-center" style={{ color: '#2757aa' }}>
              Signers ({signers.length})
            </p>
          )}
          {openAlert && alertMsg && (
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <SimpleAlert openAlert={openAlert} alertMsg={alertMsg} alertSeverity={alertSeverity} />
            </div>
          )}

          {/* <div className="border rounded p-2" style={{ maxHeight: '20vh', overflowY: 'auto', backgroundColor: '#ecf4fc' }}>
            {signers.map((s, index) => (
              <div
                key={index}
                className={`d-flex justify-content-between align-items-center p-1 ${signers.length > 1 && index !== signers.length - 1 ? 'border-bottom' : ''}`}
                style={{ fontSize: '13.5px' }}
              >
                <span>{s.email}</span>
                <span className="text-muted">
                  {s.signed === 'True' ? (
                    <>
                      signed <i className="fas fa-check-circle text-success mx-1"></i>: {s.signed_time_stamp}
                    </>
                  ) : (
                    <>
                      {s.current_signer === 'True' ? 'Current Signer' : 'Queued'}
                      <i className={s.current_signer === 'True' ? 'fas fa-envelope-open-text text-danger mx-1' : 'fas fa-envelope text-warning mx-1'}></i>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div> */}
          <div
            className="border rounded p-2"
            style={{ maxHeight: '20vh', overflowY: 'auto', backgroundColor: '#ecf4fc' }}
          >
            {[...signers].sort((a, b) => {
              // Priority: 1. Signed, 2. Current Signer, 3. Queued
              const getPriority = (signer) => {
                if (signer.signed === 'True') return 1;
                if (signer.current_signer === 'True') return 2;
                return 3;
              };
              return getPriority(a) - getPriority(b);
            }).map((s, index) => (
              <div
                key={index}
                className={`d-flex justify-content-between align-items-center p-1 ${signers.length > 1 && index !== signers.length - 1 ? 'border-bottom' : ''}`}
                style={{ fontSize: '13.5px' }}
              >
                <div>
                  <span className="fw-semibold">{s.email}</span>
                  <span className="text-muted ms-2">
                    {s.signed === 'True' ? (
                      <>
                        signed  <FaCheckCircle className="text-success mx-1" />: <HumanizedDate dateStr={s.signed_time_stamp} />
                      </>
                    ) : (
                      <>
                        {s.current_signer === 'True' ? 'Current Signer' : 'Queued'}
                        {s.current_signer === 'True' ? <FaEnvelopeOpenText className="text-danger mx-1" /> : <FaEnvelope className="text-warning mx-1" />}
                      </>
                    )}
                  </span>
                </div>
                {/* Action column */}
                <div>
                  {editingSigner === s.email ? (
                    <div className="d-flex align-items-center">
                      <input
                        type="email"
                        placeholder="new email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="form-control form-control-sm me-1"
                        style={{ width: '180px' }}
                      />
                      <Tooltip title="Save changes">
                        <span>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={submitChange}
                            disabled={isLoadingSubstitute}
                            sx={{
                              textTransform: 'none',
                              fontSize: '12px',
                              backgroundColor: '#2757aa',
                              mr: 0.5,
                              '&:hover': {
                                backgroundColor: '#1e4a93',
                              },
                            }}
                          >
                            {isLoadingSubstitute ? (
                              <>
                                <FaSpinner className="fa-spin me-1" /> Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Cancel editing">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={cancelEdit}
                            disabled={isLoadingSubstitute}
                            sx={{
                              textTransform: 'none',
                              fontSize: '12px',
                              color: '#2757aa',
                              borderColor: '#2757aa',
                              '&:hover': {
                                backgroundColor: '#e6eefc',
                                borderColor: '#1e4a93',
                              },
                            }}
                          >
                            Cancel
                          </Button>
                        </span>
                      </Tooltip>
                    </div>
                  ) : (
                    !s.signed && (
                      <Tooltip title="Change this signer's email">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => startEdit(s.email)}
                          sx={{
                            textTransform: 'none',
                            fontSize: '12px',
                            color: '#2757aa',
                            borderColor: '#2757aa',
                            '&:hover': {
                              backgroundColor: '#e6eefc',
                              borderColor: '#1e4a93',
                            },
                          }}
                        >
                          Change
                        </Button>
                      </Tooltip>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>

      {/* Action Buttons */}
      <div className="d-flex justify-content-center my-3 gap-3">
     
          <Tooltip title="Download Document">
            <FaDownload
              className="mx-2"
              onClick={() => window.open(`${constants.devApi2BaseUrl}/api/Doc/FileDownload/${guid}`)}
              style={{ fontSize: '30px', color: '#2757aa', cursor: 'pointer' }}
            />
          </Tooltip>
   
      </div>

      {/* Footer */}
      <div className="footer bg-light border-top py-2">
        <div className="container text-center text-muted" style={{ fontSize: '13px' }}>
          <p className="my-1"><span>Owner:</span> {owner}</p>
          <p className="my-1">
            <span>Status:</span>
            {signedcomplete === 'True' ? (
              <span><FaCircle className="mx-1 text-success" /> Signing Completed</span>
            ) : declined === 'True' ? (
              <span><FaCircle className="mx-1 text-danger" /> Voided</span>
            ) : (
              <span><FaCircle className="mx-1 text-warning" /> Pending Signing</span>
            )}
          </p>
          <p className="mt-1" style={{ fontSize: '11px' }}>GUID: {guid}</p>
        </div>
      </div>
    </Dialog>
  );
};

export default DocDetailsDialog;