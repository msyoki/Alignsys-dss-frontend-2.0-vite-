import React, { useState } from 'react';
import { FaCheckCircle, FaEnvelopeOpenText, FaEnvelope, FaDownload } from 'react-icons/fa';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Tooltip from '@mui/material/Tooltip';
import * as constants from '../constants/constants';
import logo from '../../images/ZFWHITE.webp';
import axios from 'axios';

const DocDetailsDialog = ({ opendialogdocdetails, setOpenDialogDocDetails, document = {} }) => {
  const handleClose = () => setOpenDialogDocDetails(false);
  const [editingSigner, setEditingSigner] = useState(null);
  const [newEmail, setNewEmail] = useState('');

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
      // Call backend or perform update
      await axios.post('/api/swap-signer', { oldEmail, newEmail });
      alert(`Signer changed from ${oldEmail} → ${newEmail}`);
      // Optionally refresh signer list
    } catch (err) {
      console.error(err);
      alert('Failed to update signer');
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
            {signers.map((s, index) => (
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
                        signed <FaCheckCircle className="text-success mx-1" />: {s.signed_time_stamp}
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
                      <button className="btn btn-success btn-sm me-1" onClick={submitChange}>
                        Save
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    !s.signed && (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => startEdit(s.email)}
                      >
                        Change
                      </button>
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
        {signedcomplete === 'True' && (
          <Tooltip title="Download Document">
            <FaDownload
              className="mx-2"
              onClick={() => window.open(`${constants.devApi2BaseUrl}/api/Doc/FileDownload/${guid}`)}
              style={{ fontSize: '30px', color: '#2757aa', cursor: 'pointer' }}
            />
          </Tooltip>
        )}
      </div>

      {/* Footer */}
      <div className="footer bg-light border-top py-2">
        <div className="container text-center text-muted" style={{ fontSize: '13px' }}>
          <p className="my-1"><span>Owner:</span> {owner}</p>
          <p className="my-1">
            <span>Status:</span>
            {signedcomplete === 'True' ? (
              <span><i className="fas fa-circle mx-1 text-success"></i> Signing Completed</span>
            ) : declined === 'True' ? (
              <span><i className="fas fa-circle mx-1 text-danger"></i> Voided</span>
            ) : (
              <span><i className="fas fa-circle mx-1 text-warning"></i> Pending Signing</span>
            )}
          </p>
          <p className="mt-1" style={{ fontSize: '11px' }}>GUID: {guid}</p>
        </div>
      </div>
    </Dialog>
  );
};

export default DocDetailsDialog;