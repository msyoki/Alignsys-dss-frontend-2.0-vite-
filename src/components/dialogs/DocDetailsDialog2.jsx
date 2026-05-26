import React, { useContext, useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';

import { FaRegWindowClose, FaCheckCircle, FaEnvelopeOpenText, FaEnvelope, FaPaperPlane, FaBan, FaCircle, FaSpinner } from "react-icons/fa";
import { FaDownload } from "react-icons/fa6";
import { RiMailSendLine } from "react-icons/ri";
import axios from 'axios';
import AuthContext from '../../context/Authcontext.jsx';
import DocExpiryDate from '../GetExpiryDate.jsx';
import * as constants from '../constants/constants.js';
import TimedAlert from '../TimedAlert.jsx';
import logo from '../../images/ZFWHITE.webp';
import Alerts from '../Alert.jsx';
import SimpleAlert from '../SimpleAlert.jsx';

const DocDetailsDialog2 = ({
  opendialogdocdetails,
  setOpenDialogDocDetails,
  document = {},
  documentsigners = [],
  refreshdata = () => { },
  type = '',

}) => {
  const { user } = useContext(AuthContext);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [alertMsg, setAlertMsg] = useState('');
  const [editingSigner, setEditingSigner] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [isLoadingSubstitute, setIsLoadingSubstitute] = useState(false);
  const [isLoadingResend, setIsLoadingResend] = useState(false);
  const [isLoadingVoid, setIsLoadingVoid] = useState(false);
  const isSubstitutionAllowed =
    document.signedcomplete !== 'True' && document.declined !== 'True';


  const handleClose = () => setOpenDialogDocDetails(false);

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

  const handleVoiding = async () => {
    setIsLoadingVoid(true);
    try {
      await axios.post(`${constants.devApi2BaseUrl}/api/SendSigning/OwnerDecline`, {
        fileGuid: document.guid,
      });
      showAlert('Document successfully voided.', 'success');

      setTimeout(() => {
        refreshdata();
        handleClose();
      }, 2000);
    } catch (error) {
      showAlert('Failed to void document.', 'error');
      console.error('Error:', error);
    } finally {
      setIsLoadingVoid(false);
    }
  };

  const resendSigner = async () => {
    setIsLoadingResend(true);
    try {
      await axios.post(`${constants.devApi2BaseUrl}/api/signers/Resend`, {
        fileGuid: document.guid,
      });
      showAlert('Signer request resent successfully.', 'success');
      setTimeout(() => {
        refreshdata();
        handleClose();
      }, 2000);
    } catch (error) {
      showAlert('Failed to resend signer request.', 'error');
      console.error('Error resending signer request:', error);
    } finally {
      setIsLoadingResend(false);
    }
  };

  const startEdit = (email) => {
    setEditingSigner(email);
    setNewEmail('');
  };

  const cancelEdit = () => {
    setEditingSigner(null);
    setNewEmail('');
  };

  const submitChange = () => {
    if (!newEmail) return alert('Please enter a new email');
    handleSwapSigner(editingSigner, newEmail);
    cancelEdit();
  };

  const handleSwapSigner = async (oldEmail, newEmail) => {
    setIsLoadingSubstitute(true);
    try {
      const payload = {
        email: newEmail,
        oldsigneremail: oldEmail,
        documentid: document.guid,
      };

      await axios.post(
        `${constants.devApi2BaseUrl}/api/signers/SubstituteSigner`,
        payload,
        {
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
          },
        }
      );

      showAlert(`Signer changed from ${oldEmail} → ${newEmail}`, 'success');

      // Keep dialog open for 2s to show alert, then refresh & close
      setTimeout(() => {
        refreshdata();
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Error swapping signer:', err);
      showAlert('Failed to update signer', 'error');
    } finally {
      setIsLoadingSubstitute(false);
    }
  };




  return (
    <>


      <Dialog
        open={opendialogdocdetails}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        {/* Header */}
        <DialogTitle
          className="p-2 d-flex justify-content-between align-items-center"
          style={{ backgroundColor: '#2757aa', color: '#fff', fontSize: '15px' }}
        >
          <img src={logo} alt="Logo" width="130px" className="mx-3" />
          <span className="flex items-center mx-3 cursor-pointer">
            <span className="font-bold mx-1">Document Details</span>
            <IconButton onClick={handleClose} style={{ color: 'white' }}>
              <FaRegWindowClose />
            </IconButton>
          </span>
        </DialogTitle>

        {/* Content */}
        <DialogContent style={{ fontSize: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="row">
            <p className="text-center font-weight-bold mt-3">
              <span style={{ color: '#2757aa' }}>Title</span>
              <br />
              {document.title}
            </p>

            {documentsigners.length > 0 && (
              <p className="font-weight-bold text-center" style={{ color: '#2757aa' }}>
                Signers ({documentsigners.length})
              </p>
            )}
            {openAlert && alertMsg && (
              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <SimpleAlert openAlert={openAlert} alertMsg={alertMsg} alertSeverity={alertSeverity} />
              </div>
            )}

            {/* Signers List */}
            {documentsigners.length > 0 && (
              <div
                className="border rounded p-2"
                style={{ maxHeight: '20vh', overflowY: 'auto', backgroundColor: '#ecf4fc' }}
              >

                {[...documentsigners].sort((a, b) => {
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
                    className={`d-flex justify-content-between align-items-center p-1 ${documentsigners.length > 1 && index !== documentsigners.length - 1
                      ? 'border-bottom'
                      : ''
                      }`}
                    style={{ fontSize: '13.5px' }}
                  >
                    {editingSigner === s.email ? (
                      // --- Editing Mode ---
                      <form
                        className="d-flex w-100 justify-content-between align-items-center"
                        onSubmit={(e) => {
                          e.preventDefault(); // prevent page reload
                          submitChange();
                        }}
                      >
                        <input
                          type="email"
                          required
                          className="form-control form-control-sm me-2"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter substitute email"
                          style={{ fontSize: '13px' }}
                        />
                        <div className="d-flex">
                          <Tooltip title="Save changes">
                            <span>
                              <Button
                                type="submit"
                                variant="contained"
                                size="small"
                                disabled={isLoadingSubstitute}
                                sx={{
                                  borderRadius: 5,
                                  mr: 1,
                                  textTransform: 'none',
                                  fontSize: '13px',
                                  backgroundColor: '#2757aa',
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
                                variant="outlined"
                                size="small"
                                onClick={cancelEdit}
                                disabled={isLoadingSubstitute}
                                sx={{
                                  borderRadius: 5,
                                  textTransform: 'none',
                                  fontSize: '13px',
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
                      </form>
                    ) : (
                      // --- Display Mode ---
                      <>
                        <span>{s.email}</span>
                        <span className="text-muted d-flex align-items-center">
                          {s.signed === 'True' ? (
                            <>
                              signed <FaCheckCircle className="text-success mx-1" />:
                              {s.signed_time_stamp}
                            </>
                          ) : (
                            <>
                              {s.current_signer === 'True' ? 'Current Signer' : 'Queued'}
                              {s.current_signer === 'True' ? (
                                <FaEnvelopeOpenText className="text-danger mx-1" />
                              ) : (
                                <FaEnvelope className="text-warning mx-1" />
                              )}
                              {document.owner === user.email && isSubstitutionAllowed && (
                                <Tooltip title="Replace this signer with another email">
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => startEdit(s.email)}
                                    sx={{
                                      borderRadius: 5,
                                      ml: 1,
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
                                    Substitute
                                  </Button>
                                </Tooltip>
                              )}

                            </>
                          )}
                        </span>
                      </>
                    )}


                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>

        {/* Action Icons */}
        <div className="d-flex justify-content-center my-3 gap-3">
          {document.owner === user.email && document.signedcomplete !== 'True' && document.declined !== 'True' && documentsigners.length > 0 && type !== 'trashed' && (
            <Tooltip title="Resend Mail">
              <span style={{ position: 'relative', display: 'inline-block' }}>
                {isLoadingResend ? (
                  <FaSpinner className="fa-spin mx-2" style={{ fontSize: '30px', color: '#2757aa' }} />
                ) : (
                  <RiMailSendLine
                    onClick={resendSigner}
                    className="mx-2"
                    style={{ fontSize: '30px', color: '#2757aa', cursor: 'pointer' }}
                  />
                )}
              </span>
            </Tooltip>
          )}
          <Tooltip title="Download">
            <FaDownload
              className="mx-2"
              style={{ fontSize: '30px', color: '#2757aa', cursor: 'pointer' }}
              onClick={() =>
                window.open(`${constants.devApi2BaseUrl}/api/Doc/FileDownload/${document.guid}`)
              }
            />
          </Tooltip>
          {document.owner === user.email && (type === 'inbox' || type === 'outbox' ) && (
            <Tooltip title={type === 'outbox' ? 'Recall Document' : 'Void Document'}>
              <span style={{ position: 'relative', display: 'inline-block' }}>
                {isLoadingVoid ? (
                  <FaSpinner className="fa-spin mx-2" style={{ fontSize: '30px', color: '#ff4f4f' }} />
                ) : (
                  <FaBan
                    onClick={handleVoiding}
                    className="mx-2"
                    style={{ fontSize: '30px', color: '#ff4f4f', cursor: 'pointer' }}
                  />
                )}
              </span>
            </Tooltip>
          )}
        </div>

        {/* Footer */}
        <div className="footer bg-light border-top py-2">
          <div className="container text-center text-muted" style={{ fontSize: '13px' }}>
            <p className="my-1">
              <span>Owner:</span> {document.owner}
            </p>
            <p className="my-1">
              <span>Expiry Date:</span> <DocExpiryDate expirydate={document.expirydate} />
            </p>
            <p className="my-1">
              <span>Status:</span>
              {document.signedcomplete === 'True' ? (
                <span>
                  <FaCircle className="mx-1 text-success" /> Signing Completed
                </span>
              ) : document.declined === 'True' ? (
                <span>
                  <FaCircle className="mx-1 text-danger" /> Voided
                </span>
              ) :  document.trashed === 'True' ? (
                <span>
                  <FaCircle className="mx-1 text-warning" /> Trashed
                </span>
              ) : (
              <span>
                <FaCircle className="mx-1 text-warning" /> Pending Signing
              </span>
              )}
            </p>
            <p className="mt-1" style={{ fontSize: '11px' }}>
              GUID: {document.guid}
            </p>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default DocDetailsDialog2;
