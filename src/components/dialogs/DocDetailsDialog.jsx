import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaEnvelope, FaEnvelopeOpenText, FaFileAlt } from 'react-icons/fa';
import { Box, Dialog, DialogContent, TextField, Tooltip, Button, Typography } from '@mui/material';
import * as constants from '../constants/constants';
import axios from 'axios';
import SimpleAlert from '../SimpleAlert.jsx';
import { FaDownload } from "react-icons/fa6";
import HumanizedDate from '../HumanizeDate.jsx';
import { DialogFooter, DialogHeader, PrimaryButton, PropertyRow, PropertyValue, SecondaryButton, StatusChip, fieldSx } from '../common/dialogKit';
import { PILL_COMPACT, PILL_OUTLINE } from '../common/pillButton';
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

  const status = signedcomplete === 'True'
    ? { tone: 'success', label: 'Signing completed' }
    : declined === 'True'
      ? { tone: 'danger', label: 'Voided' }
      : { tone: 'warning', label: 'Pending signing' };

  // Signed first, then the current signer, then the queue.
  const orderedSigners = [...signers].sort((a, b) => {
    const getPriority = (signer) => {
      if (signer.signed === 'True') return 1;
      if (signer.current_signer === 'True') return 2;
      return 3;
    };
    return getPriority(a) - getPriority(b);
  });

  return (
    <Dialog open={opendialogdocdetails} onClose={handleClose} fullWidth maxWidth="sm" aria-labelledby="doc-details-title">
      <DialogHeader id="doc-details-title" icon={<FaFileAlt />} title="Document details" subtitle={title} onClose={handleClose} />

      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2, maxHeight: '65vh' }}>
        {openAlert && alertMsg && (
          <Box sx={{ mb: 1.5 }}>
            <SimpleAlert openAlert={openAlert} alertMsg={alertMsg} alertSeverity={alertSeverity} />
          </Box>
        )}

        <PropertyRow label="Title"><PropertyValue>{title !== 'N/A' ? title : ''}</PropertyValue></PropertyRow>
        <PropertyRow label="Owner"><PropertyValue>{owner !== 'N/A' ? owner : ''}</PropertyValue></PropertyRow>
        <PropertyRow label="Created">
          <PropertyValue>{docdate && docdate !== 'N/A' ? <HumanizedDate dateStr={docdate} /> : ''}</PropertyValue>
        </PropertyRow>
        <PropertyRow label="Status">
          <Box sx={{ py: 0.5 }}><StatusChip tone={status.tone}>{status.label}</StatusChip></Box>
        </PropertyRow>
        <PropertyRow label="Document ID"><PropertyValue mono>{guid !== 'N/A' ? guid : ''}</PropertyValue></PropertyRow>

        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827', mt: 2, mb: 1, px: 1 }}>
          Signers ({signers.length})
        </Typography>
        {signers.length === 0 ? (
          <Typography sx={{ fontSize: 12.5, color: '#9ca3af', px: 1 }}>No signers on this document.</Typography>
        ) : (
          <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1.5, overflow: 'hidden' }}>
            {orderedSigners.map((s, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap',
                  px: 1.5, py: 1, borderTop: index ? '1px solid #f3f4f6' : 'none', '&:hover': { bgcolor: '#f9fafb' },
                }}
              >
                <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography noWrap title={s.email} sx={{ fontSize: 13, color: '#111827', fontWeight: 500, maxWidth: 260 }}>{s.email}</Typography>
                  {s.signed === 'True' ? (
                    <StatusChip tone="success" icon={<FaCheckCircle size={11} />}>
                      Signed{s.signed_time_stamp ? <>&nbsp;·&nbsp;<HumanizedDate dateStr={s.signed_time_stamp} /></> : ''}
                    </StatusChip>
                  ) : s.current_signer === 'True' ? (
                    <StatusChip tone="info" icon={<FaEnvelopeOpenText size={11} />}>Current signer</StatusChip>
                  ) : (
                    <StatusChip tone="neutral" icon={<FaEnvelope size={11} />}>Queued</StatusChip>
                  )}
                </Box>

                {/* Change signer (unchanged logic; see handleSwapSigner) */}
                <Box sx={{ flexShrink: 0 }}>
                  {editingSigner === s.email ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        type="email"
                        size="small"
                        placeholder="New email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        sx={{ ...fieldSx(), width: 190 }}
                      />
                      <Tooltip title="Save changes">
                        <span>
                          <PrimaryButton onClick={submitChange} loading={isLoadingSubstitute} sx={{ ...PILL_COMPACT }}>
                            {isLoadingSubstitute ? 'Saving…' : 'Save'}
                          </PrimaryButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Cancel editing">
                        <span>
                          <SecondaryButton onClick={cancelEdit} disabled={isLoadingSubstitute} sx={{ minHeight: 32 }}>Cancel</SecondaryButton>
                        </span>
                      </Tooltip>
                    </Box>
                  ) : (
                    !s.signed && (
                      <Tooltip title="Change this signer's email">
                        <Button onClick={() => startEdit(s.email)} sx={{ ...PILL_OUTLINE, ...{ minHeight: 30, py: 0.25, px: 1.5, fontSize: '12px' } }}>
                          Change
                        </Button>
                      </Tooltip>
                    )
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogFooter>
        <SecondaryButton onClick={handleClose}>Close</SecondaryButton>
        <PrimaryButton
          startIcon={<FaDownload />}
          onClick={() => window.open(`${constants.devApi2BaseUrl}/api/Doc/FileDownload/${guid}`)}
          disabled={!guid || guid === 'N/A'}
        >
          Download
        </PrimaryButton>
      </DialogFooter>
    </Dialog>
  );
};

export default DocDetailsDialog;