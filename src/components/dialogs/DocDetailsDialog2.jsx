import React, { useContext, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';

import { FaRegWindowClose } from "react-icons/fa";
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
  const isSubstitutionAllowed =
    document.signedcomplete !== 'True' && document.declined !== 'True';


  const handleClose = () => setOpenDialogDocDetails(false);

  const showAlert = (message, severity) => {
    setAlertMsg(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
  };

  const handleVoiding = async () => {
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
    }
  };

  const resendSigner = async () => {
    try {
      await axios.post(`${constants.devApi2BaseUrl}/api/signers/Resend`, {
        fileGuid: document.guid,
      });
      handleClose();
      showAlert('Signer request resent successfully.', 'success');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      showAlert('Failed to resend signer request.', 'error');
      console.error('Error resending signer request:', error);
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
              <SimpleAlert openAlert={openAlert} alertMsg={alertMsg} alertSeverity={alertSeverity} />
            )}

            {/* Signers List */}
            {documentsigners.length > 0 && (
              <div
                className="border rounded p-2"
                style={{ maxHeight: '20vh', overflowY: 'auto', backgroundColor: '#ecf4fc' }}
              >

                {documentsigners.map((s, index) => (
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
                          <Button
                            type="submit"
                            variant="contained"
                            size="small"
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
                            Save
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={cancelEdit}
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
                        </div>
                      </form>
                    ) : (
                      // --- Display Mode ---
                      <>
                        <span>{s.email}</span>
                        <span className="text-muted d-flex align-items-center">
                          {s.signed === 'True' ? (
                            <>
                              signed <i className="fas fa-check-circle text-success mx-1"></i>:
                              {s.signed_time_stamp}
                            </>
                          ) : (
                            <>
                              {s.current_signer === 'True' ? 'Current Signer' : 'Queued'}
                              <i
                                className={
                                  s.current_signer === 'True'
                                    ? 'fas fa-envelope-open-text text-danger mx-1'
                                    : 'fas fa-envelope text-warning mx-1'
                                }
                              ></i>
                              {document.owner === user.email && isSubstitutionAllowed && (
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
          {document.owner === user.email && (
            <Tooltip title="Resend Mail">
              <i
                onClick={resendSigner}
                className="fa-solid fa-paper-plane mx-2"
                style={{ fontSize: '30px', color: '#2757aa', cursor: 'pointer' }}
              ></i>
            </Tooltip>
          )}
          <Tooltip title="Download">
            <i
              className="fas fa-download mx-2"
              style={{ fontSize: '30px', color: '#2757aa', cursor: 'pointer' }}
              onClick={() =>
                window.open(`${constants.devApi2BaseUrl}/api/Doc/FileDownload/${document.guid}`)
              }
            ></i>
          </Tooltip>
          {document.owner === user.email && (type === 'inbox' || type === 'outbox') && (
            <Tooltip title={type === 'outbox' ? 'Recall Document' : 'Void Document'}>
              <i
                onClick={handleVoiding}
                className="fas fa-ban mx-2"
                style={{ fontSize: '30px', color: '#ff4f4f', cursor: 'pointer' }}
              ></i>
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
                  <i className="fas fa-circle mx-1 text-success"></i> Signing Completed
                </span>
              ) : document.declined === 'True' ? (
                <span>
                  <i className="fas fa-circle mx-1 text-danger"></i> Voided
                </span>
              ) : (
                <span>
                  <i className="fas fa-circle mx-1 text-warning"></i> Pending Signing
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
