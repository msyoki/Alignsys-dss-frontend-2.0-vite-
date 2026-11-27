import React, { useRef, useContext, useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import axios from 'axios';
import AuthContext from '../../context/Authcontext';
import Switch from '@mui/material/Switch';
import { jsonPhoneCodesData } from '../../data/country-phone-codes';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import * as constants from '../constants/constants';
import SignersBoxDialog from './SignersBoxDialog';
import { signerColor } from '../preview/signerColors';
import { isValidEmail } from '../../utils/email';
import { readDraftFor, writeDraft, clearDraft } from '../../utils/addSignersDraft';
import { ListSubheader, CircularProgress, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import {
  FaPaperPlane,
  FaPlus,
  FaTimes,
  FaChevronUp,
  FaChevronDown,
  FaMobileAlt,
  FaUserShield,
  FaUserPlus,
  FaPen,
  FaProjectDiagram,
  FaExclamationCircle,
} from 'react-icons/fa';
import TimedAlert from '../TimedAlert';
import useOtpAvailability from '../../hooks/useOtpAvailability';
import { otpError } from '../../api/otp';
import { PILL_COMPACT, PILL_OUTLINE } from '../common/pillButton';
import { DialogHeader, DialogFooter, PrimaryButton, SecondaryButton, StatusChip, fieldSx } from '../common/dialogKit';

// =============================================================================
// PROP INTERFACE
// =============================================================================
//
// Both original call sites work without any changes:
//
// ── V1 call site (file-upload flow) ──────────────────────────────────────────
//   <AddSignersDialog
//     setAlertSeverity={setAlertSeverity}   ← bubbles alerts up to parent
//     setAlertMsg={setAlertMsg}
//     setOpenAlert={setOpenAlert}
//     loading={loading}
//     setLoading={setLoading}
//     getWorkflows={getWorkflows}
//     workflows={workflows}
//     organizationWorkflows={organizationWorkflows}
//     opendialogaddsigners={opendialogaddsigners}
//     setOpenDialogAddSigners={setOpenDialogAddSigners}
//     fileurl={uploadedfileurl}             ← old prop name kept
//     refreshdata={refreshdata}
//     setActiveForm={setActiveForm}
//   />
//
// ── V2 call site (document view / route flow) ────────────────────────────────
//   <AddSignersDialog
//     getWorkflows={getWorkflows}
//     workflows={workflows}
//     organizationWorkflows={organizationWorkflows}
//     opendialogaddsigners={opendialogaddsigners}
//     setOpenDialogAddSigners={setOpenDialogAddSigners}
//     file={location.state.docguid}         ← new prop name kept
//     loading={loading}
//     setLoading={setLoading}
//     docTitle={location.state.doctitle}
//   />
//
// The component detects which call site it is from:
//   • fileurl present   → v1 mode  (enableAuthentication on, v1 delete URL, refreshdata/setActiveForm on success)
//   • file present      → v2 mode  (preventSelfSigning on, navigate('/') on success)
//
// You can also override any behaviour explicitly by passing the flags directly.
// =============================================================================

const labelSx = { fontSize: 12, color: '#374151', fontWeight: 500, mb: 0.5, display: 'block' };
const sectionSx = { fontSize: 13, fontWeight: 600, color: '#111827' };
const ROUND_BTN = { width: 30, height: 30, border: '1px solid #d0d5dd', color: '#4b5563', bgcolor: '#fff', '&:hover': { bgcolor: '#f5f7fa' } };

// Signature boxes are tied to a signer by `signer.id` = their position in the list
// (SignersBoxDialog) and sent with their email. After the list changes (reorder or
// remove), renumber each signer's boxes by email so they stay with the right person,
// and give them the colour of their new position (colours follow signing order).
export const reindexBoxes = (boxes, list) => boxes
  .map((box) => {
    const index = list.findIndex((s) => s.email === box.signer.email);
    if (index < 0) return null;
    const color = signerColor(index);
    return {
      ...box,
      signer: { ...box.signer, id: index, color },
      annotations: (box.annotations || []).map((a) => ({ ...a, color })),
    };
  })
  .filter(Boolean);

const maskPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 3 ? `••• ${digits.slice(-3)}` : '';
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const AddSignersDialogMerged = (props) => {
  // ── Resolve which mode we're in based on which file prop was passed ──────
  // v1 passes `fileurl`; v2 passes `file`. Support both without breaking either.
  const isV1 = props.fileurl !== undefined;
  const file = props.fileurl ?? props.file;

  // ── Behavioural flags ─────────────────────────────────────────────────────
  // Defaults are inferred from the call site; can always be overridden explicitly.
  const enableAuthentication = props.enableAuthentication ?? isV1;
  const preventSelfSigning = props.preventSelfSigning ?? !isV1;

  // ── Delete URL ────────────────────────────────────────────────────────────
  const buildDeleteUrl = props.buildDeleteUrl ?? (
    isV1
      ? (id) => `${constants.devApiBaseUrl}/api/workflow/${id}/delete/`
      : (id) => `${constants.devApiBaseUrl}/api/workflows/${id}/`
  );

  // ── Destructure remaining shared props ───────────────────────────────────
  const {
    opendialogaddsigners,
    setOpenDialogAddSigners,
    workflows = [],
    organizationWorkflows = [],
    getWorkflows,
    setLoading,
    // V1-specific callbacks
    setAlertSeverity: parentSetAlertSeverity,
    setAlertMsg: parentSetAlertMsg,
    setOpenAlert: parentSetOpenAlert,
    refreshdata,
    setActiveForm,
  } = props;

  // --- Refs ---
  const selectRef = useRef();
  const emailInputRef = useRef();
  const [emailValid, setEmailValid] = useState(false); // enables the "Add" button
  const phoneNumberRef = useRef();
  const wfTitleRef = useRef();
  const assignmentDescRef = useRef();
  const phoneCodeRef = useRef();

  // --- Context ---
  const { authTokens, logoutUser, user } = useContext(AuthContext);

  // --- State ---
  const [workflow, setWorkflow] = useState('');
  const [selectedworkflowtitle, setSelectedWorkflowTitle] = useState('');
  const [workflowNote, setWorkflowNote] = useState(''); // e.g. "SMS codes were left off"
  const [signers, setSigners] = useState([]);
  const [checked, setChecked] = useState(false); // OTP
  const [checked2, setChecked2] = useState(false); // Save as workflow
  const [checked3, setChecked3] = useState(false); // Account verification (v1)
  const [openalert, setOpenAlert] = useState(false);
  const [alertseverity, setAlertSeverity] = useState('');
  const [alertmsg, setAlertMsg] = useState('');
  const [alertDuration, setAlertDuration] = useState(undefined);
  const [open, setOpen] = useState(false);
  const [signatureBoxes, setSignatureBoxes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingAddSigner, setLoadingAddSigner] = useState(false);
  const [loadingDeleteWorkflow, setLoadingDeleteWorkflow] = useState(false);

  const otpAvailability = useOtpAvailability(!!opendialogaddsigners);
  useEffect(() => {
    if (!otpAvailability.loading && !otpAvailability.available) setChecked(false);
  }, [otpAvailability.loading, otpAvailability.available]);
  const otpAvailable = !otpAvailability.loading && otpAvailability.available;

  // --- Keep the open dialog across a reload of this tab ---------------------
  // Restores what you had (signers, boxes, message, workflow, open box screen) when the
  // page reopens the dialog for the same document; saved as you go; removed on close.
  // Sending is unchanged: it reads the same state and inputs as before.
  const restoredFor = useRef(null);
  const textDraft = useRef({ message: '', wfTitle: '' });

  useEffect(() => {
    if (!opendialogaddsigners || !file || restoredFor.current === file) return;
    restoredFor.current = file;
    const d = readDraftFor(file);
    if (!d) return;
    setSigners(d.signers || []);
    setSignatureBoxes(d.signatureBoxes || []);
    setWorkflow(d.workflow || '');
    setSelectedWorkflowTitle(d.workflowTitle || '');
    setWorkflowNote(d.workflowNote || '');
    setChecked2(!!d.saveAsWorkflow);
    textDraft.current = { message: d.message || '', wfTitle: d.wfTitle || '' };
    if (d.boxScreenOpen && (d.signers || []).length) setOpen(true);
  }, [opendialogaddsigners, file]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveDraft = () => {
    if (!opendialogaddsigners || !file || restoredFor.current !== file) return;
    writeDraft({
      file,
      origin: isV1 ? 'dashboard' : 'selfsign',
      docTitle: props.docTitle || '',
      signers,
      signatureBoxes,
      workflow,
      workflowTitle: selectedworkflowtitle,
      workflowNote,
      saveAsWorkflow: checked2,
      boxScreenOpen: open,
      message: textDraft.current.message,
      wfTitle: textDraft.current.wfTitle,
    });
  };
  useEffect(saveDraft, [opendialogaddsigners, file, signers, signatureBoxes, workflow, selectedworkflowtitle, workflowNote, checked2, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Alert helper --------------------------------------------------------
  // Shows alert locally inside the dialog. For v1, also bubbles up to parent.
  // One toast at a time; TimedAlert times it (errors 6 s, success 4 s, or `duration`).
  // It stays mounted when the dialog closes, so the parent's own toast isn't used as well
  // (that showed every message twice on the dashboard).
  const showAlert = (message, severity, duration) => {
    setAlertMsg(message);
    setAlertSeverity(severity);
    setAlertDuration(duration);
    setOpenAlert(true);
  };

  // A readable message for a failed request (no connection, expired session, server text).
  const requestError = (err, fallback) => {
    if (!err?.response) return { message: 'Could not reach the server. Check your connection and try again.' };
    if (err.response.status === 401) return { message: 'Your session has expired. Please sign in again.', expired: true };
    const e = otpError(err, fallback);
    if (e.code) return { message: e.message, code: e.code, duration: 8000 };
    const data = err.response.data || {};
    const text = [data.error, data.msg, data.detail, data.message].find((v) => typeof v === 'string' && v.trim());
    return { message: text || fallback };
  };

  // --- Helpers -------------------------------------------------------------
  // Shared signer email check (allows e.g. john+tag@… and o'brien@…, rejects jane..doe@…).
  const validateEmail = isValidEmail;

  const clearWorkflow = () => {
    if (selectRef.current) selectRef.current.value = '';
    setWorkflow('');
    setSelectedWorkflowTitle('');
    setWorkflowNote('');
  };

  const resetDialog = () => {
    clearWorkflow();
    setSigners([]);
    setSignatureBoxes([]);
    setSelectedUser(null);
    setSelectedAnnotationId(null);
    setChecked2(false);
    if (emailInputRef.current) emailInputRef.current.value = '';
    setEmailValid(false);
    if (phoneNumberRef.current) phoneNumberRef.current.value = '';
    if (phoneCodeRef.current) phoneCodeRef.current.value = '';
    if (wfTitleRef.current) wfTitleRef.current.value = '';
    if (assignmentDescRef.current) assignmentDescRef.current.value = '';
    // Closed (sent, cancelled or closed): nothing to bring back after a reload.
    clearDraft();
    restoredFor.current = null;
    textDraft.current = { message: '', wfTitle: '' };
  };

  // --- Handlers ------------------------------------------------------------
  const handleClose2 = () => {
    setOpenDialogAddSigners(false);
    resetDialog();
  };

  const handleWorkflowSelection = (e) => {
    const value = e.target.value;
    if (!value) {
      clearWorkflow();
      return;
    }
    setWorkflow(value);
    setWorkflowNote('');
    setSignatureBoxes([]); // boxes belonged to the previous list
    const dashIndex = value.indexOf('-');
    const type = value.slice(0, dashIndex);
    const id = +value.slice(dashIndex + 1);

    const source = type === 'personal' ? workflows : organizationWorkflows;
    const selectedWorkflow = source.find((wf) => wf.id === id);
    if (!selectedWorkflow) return;

    if (
      preventSelfSigning &&
      selectedWorkflow.signers.some(
        (s) => s.email.toLowerCase() === user.email.toLowerCase()
      )
    ) {
      showAlert(
        'You cannot add yourself as a signer since you have already signed.',
        'error'
      );
      clearWorkflow();
      setSigners([]);
      return;
    }

    setSelectedWorkflowTitle(selectedWorkflow.title);
    const hasOtpSigners = selectedWorkflow.signers.some((s) => s.phone);
    if (hasOtpSigners && !otpAvailability.available) {
      setSigners(selectedWorkflow.signers.map(({ phone, ...rest }) => rest)); // eslint-disable-line no-unused-vars
      setWorkflowNote(
        `This workflow asks for SMS codes, but they were left off. ${otpAvailability.message || 'SMS codes are not available for your organisation.'}`
      );
      return;
    }
    setSigners([...selectedWorkflow.signers]);
  };

  // "Clear": drop the workflow and its signers, back to an empty list.
  const clearWorkflowSigners = () => {
    clearWorkflow();
    setSigners([]);
    setSignatureBoxes([]);
  };

  const deleteWorkflow = async (workflowId) => {
    setLoadingDeleteWorkflow(true);
    try {
      await axios.delete(buildDeleteUrl(workflowId), {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      getWorkflows();
      clearWorkflowSigners();
      showAlert('Workflow deleted successfully', 'success');
    } catch (err) {
      showAlert(requestError(err, 'Could not delete the workflow.').message, 'error');
    }
    setLoadingDeleteWorkflow(false);
  };

  const addMailList = async (e) => {
    e.preventDefault();
    setLoadingAddSigner(true);
    clearWorkflow();

    const email = emailInputRef.current.value.trim();

    if (checked && !otpAvailability.available) {
      showAlert(otpAvailability.message, 'error', 6000);
      setLoadingAddSigner(false);
      return;
    }
    if (checked && (!phoneNumberRef.current?.value || !phoneCodeRef.current?.value)) {
      showAlert('Phone number is required for OTP', 'error');
      setLoadingAddSigner(false);
      return;
    }
    if (checked && !/^[1-9][0-9]{6,14}$/.test(phoneNumberRef.current.value.trim())) {
      showAlert('Enter the phone number without the country code or leading 0, e.g. 722123456', 'error', 6000);
      setLoadingAddSigner(false);
      return;
    }
    if (!email) {
      showAlert('Email is required', 'error');
      setLoadingAddSigner(false);
      return;
    }
    if (!validateEmail(email)) {
      showAlert(`Email ${email} is invalid, enter a valid email address`, 'error');
      setLoadingAddSigner(false);
      return;
    }
    if (preventSelfSigning && email.toLowerCase() === user.email.toLowerCase()) {
      showAlert(
        'You cannot add yourself as a signer since you have already signed.',
        'error'
      );
      setLoadingAddSigner(false);
      return;
    }
    if (signers.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
      showAlert('Email already exists, enter another signer or send to signers', 'error');
      setLoadingAddSigner(false);
      return;
    }

    const otp = checked;
    const phoneNumber = otp ? phoneNumberRef.current.value.trim() : '';
    const phoneCode = otp ? phoneCodeRef.current.value : '';
    const signer = {
      email,
      ...(otp ? { phone: `${phoneCode}${phoneNumber}` } : {}),
      ...(enableAuthentication && checked3 ? { authenticate: true } : {}),
    };

    setSigners((prev) => [...prev, signer]);
    emailInputRef.current.value = '';
    setEmailValid(false);
    if (checked && phoneNumberRef.current) phoneNumberRef.current.value = '';
    setChecked(false);
    setChecked3(false);
    setLoadingAddSigner(false);
    emailInputRef.current.focus();
  };

  const removeSigner = (email) => {
    const next = signers.filter((item) => item.email !== email);
    setSigners(next);
    setSignatureBoxes((prev) => reindexBoxes(prev, next));
    setSelectedUser(null); // positions changed; pick the signer again
    if (next.length === 0) {
      clearWorkflow();
      setChecked2(false);
    }
  };

  // Move a signer up (-1) or down (+1) in the signing order.
  const moveSigner = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= signers.length) return;
    const next = [...signers];
    [next[index], next[target]] = [next[target], next[index]];
    setSigners(next);
    setSignatureBoxes((prev) => reindexBoxes(prev, next));
    setSelectedUser(null); // positions changed; pick the signer again
  };

  const saveWorkflow = async () => {
    try {
      const title = wfTitleRef.current.value;
      const data = JSON.stringify({ wftitle: title, wfsigners: signers });
      await axios.post(`${constants.devApiBaseUrl}/api/new/workflow/`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.access}`,
        },
      });
      getWorkflows();
      wfTitleRef.current.value = '';
      setChecked2(false);
      showAlert('Workflow was saved successfully', 'success');
    } catch (err) {
      const e = requestError(err, 'Could not save the workflow.');
      showAlert(e.message, 'error', e.duration);
    }
  };

  const sendForSigning = async () => {
    setLoadingSend(true);
    const assignmentDescription = assignmentDescRef.current?.value || '';

    if (
      preventSelfSigning &&
      signers.some((s) => s.email.toLowerCase() === user.email.toLowerCase())
    ) {
      showAlert(
        'You should not include yourself as a signer since you have already signed.',
        'error'
      );
      setLoadingSend(false);
      return;
    }
    if (checked2 && !wfTitleRef.current?.value) {
      showAlert('New workflow title is required!', 'error');
      setLoadingSend(false);
      return;
    }
    if (!signers.length) {
      showAlert('At least one signer is required!', 'error');
      setLoadingSend(false);
      return;
    }

    if (checked2) await saveWorkflow();

    const mydata = JSON.stringify({
      documentid: file,
      signers,
      ...(assignmentDescription ? { assignmentd: assignmentDescription } : {}),
      ...(signatureBoxes?.length > 0 ? { annotations: signatureBoxes } : {}),
    });

    try {
      const response = await axios.post(
        `${constants.devApiBaseUrl}/api/othersigners/`,
        mydata,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authTokens.access}`,
          },
        }
      );
      setLoading(false);

      if (response.status === 200) {
        setOpenDialogAddSigners(false);
        showAlert('Successfully sent for signing!', 'success', 6000);

        // V1: call refreshdata + setActiveForm if provided
        if (isV1) {
          if (refreshdata) refreshdata();
          if (setActiveForm) setActiveForm('file-upload');
        }

        // Any extra onSuccess callback (optional override from either call site)
        if (props.onSuccess) props.onSuccess();

      } else if (response.statusText === 'Unauthorized') {
        logoutUser();
      } else {
        showAlert('Something went wrong, try again.', 'error');
      }
    } catch (err) {
      setLoading(false);
      // The backend explains OTP blocks (e.g. no SMS provider configured).
      const e = requestError(err, 'Failed to send document. Please try again.');
      showAlert(e.message, 'error', e.duration);
      if (e.code && e.code.startsWith('otp_')) otpAvailability.refresh();
      if (e.expired) logoutUser();
    }
    setLoadingSend(false);
  };

  // --- Derived ---------------------------------------------------------------
  const boxCount = (email) => signatureBoxes.find((b) => b.signer.email === email)?.annotations?.length || 0;
  const signersWithBoxes = signers.filter((s) => boxCount(s.email) > 0).length;
  const workflowIsPersonal = workflow.startsWith('personal-');

  // --- Render --------------------------------------------------------------
  return (
    <>
      <SignersBoxDialog
        selectedAnnotationId={selectedAnnotationId}
        setSelectedAnnotationId={setSelectedAnnotationId}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        file={file}
        docTitle={props.docTitle}
        signers={signers}
        open={open}
        setOpen={setOpen}
        signatureBoxes={signatureBoxes}
        setSignatureBoxes={setSignatureBoxes}
      />

      <TimedAlert
        open={openalert}
        onClose={() => setOpenAlert(false)}
        severity={alertseverity}
        message={alertmsg}
        setSeverity={setAlertSeverity}
        setMessage={setAlertMsg}
        duration={alertDuration}
      />

      <Dialog
        open={!!opendialogaddsigners}
        onClose={loadingSend ? undefined : handleClose2}
        TransitionProps={{ onExited: resetDialog }}
        aria-labelledby="add-signers-title"
        fullWidth
        maxWidth="md"
      >
        <DialogHeader
          id="add-signers-title"
          icon={<FaPaperPlane />}
          title="Send for signing"
          subtitle={props.docTitle}
          onClose={loadingSend ? undefined : handleClose2}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px minmax(0, 1fr)' }, minHeight: { md: 480 }, maxHeight: '72vh', overflowY: 'auto' }}>

          {/* ── Left: add a signer, or start from a saved workflow ───────────── */}
          <Box sx={{ bgcolor: '#f7faff', borderRight: { md: '1px solid #e5e7eb' }, borderBottom: { xs: '1px solid #e5e7eb', md: 0 }, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            <Box component="form" onSubmit={addMailList} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <Typography sx={sectionSx}>Add a signer</Typography>
              <Box>
                <Typography component="label" htmlFor="as-email" sx={labelSx}>Email</Typography>
                <TextField
                  id="as-email" inputRef={emailInputRef} type="email" size="small" fullWidth
                  placeholder="name@example.com"
                  sx={{ ...fieldSx(), '& .MuiInputBase-root': { ...fieldSx()['& .MuiInputBase-root'], bgcolor: '#fff', pr: 0.5 } }}
                  inputProps={{ 'aria-label': 'Signer email' }}
                  onChange={(e) => setEmailValid(validateEmail(e.target.value.trim()))}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={emailValid ? 'Add to signing order' : ''} placement="top">
                          <span>
                            <IconButton
                              type="submit"
                              size="small"
                              disabled={loadingAddSigner || !emailValid}
                              aria-label="Add to signing order"
                              sx={{
                                width: 28, height: 28, borderRadius: '8px',
                                // Theme blue once the email is valid, grey until then.
                                bgcolor: '#2757aa', color: '#fff',
                                '&:hover': { bgcolor: '#1a3a7a' },
                                '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' },
                              }}
                            >
                              {loadingAddSigner ? <CircularProgress size={12} color="inherit" /> : <FaPlus size={11} />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography sx={{ fontSize: 11.5, color: '#6D7386', mt: 0.5 }}>
                  Enter a valid email, then press + or Enter to put this signer in the signing order.
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title={!otpAvailability.loading && !otpAvailability.available ? otpAvailability.message : ''} placement="top">
                    <span>
                      <Switch
                        size="small"
                        checked={checked && otpAvailable}
                        disabled={!otpAvailable}
                        onChange={(e) => setChecked(e.target.checked)}
                        inputProps={{ 'aria-labelledby': 'as-otp-label' }}
                      />
                    </span>
                  </Tooltip>
                  <Typography id="as-otp-label" sx={{ fontSize: 12.8, color: otpAvailable ? '#374151' : '#9ca3af' }}>
                    Ask for an SMS code before signing
                  </Typography>
                </Box>
                {!otpAvailability.loading && !otpAvailability.available && (
                  <Typography role="status" sx={{ fontSize: 11.5, color: '#8a6100', mt: 0.5 }}>
                    {otpAvailability.message || 'SMS codes are not available for your organisation.'}
                  </Typography>
                )}
              </Box>

              {checked && otpAvailable && (
                <Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ width: 130, flexShrink: 0 }}>
                      <Typography component="label" htmlFor="as-code" sx={labelSx}>Country code</Typography>
                      <TextField
                        id="as-code" select fullWidth size="small" defaultValue="+254" inputRef={phoneCodeRef}
                        SelectProps={{ native: true }} sx={fieldSx()}
                      >
                        <option value="+254">Kenya (+254)</option>
                        {jsonPhoneCodesData.map((item, index) => (
                          <option key={index} value={item.dial_code}>{item.name} ({item.dial_code})</option>
                        ))}
                      </TextField>
                    </Box>
                    <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                      <Typography component="label" htmlFor="as-phone" sx={labelSx}>Phone number</Typography>
                      <TextField
                        id="as-phone" type="tel" fullWidth size="small" placeholder="e.g. 722123456" inputRef={phoneNumberRef}
                        inputProps={{ maxLength: 15 }} sx={fieldSx()}
                      />
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: 11.5, color: '#6D7386', mt: 0.5 }}>
                    Without the leading 0. The code is sent when they open the document.
                  </Typography>
                </Box>
              )}

              {/* "Signer must log in" (checked3, v1) stays hidden, as before the redesign. */}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: '#6D7386', fontSize: 12 }}>
              <Box component="span" sx={{ flex: '1 1 auto', borderTop: '1px solid #e5e7eb' }} />or
              <Box component="span" sx={{ flex: '1 1 auto', borderTop: '1px solid #e5e7eb' }} />
            </Box>

            <Typography sx={sectionSx}>Use a saved workflow</Typography>
            <Box>
              <Typography component="label" id="as-wf-label" sx={labelSx}>Workflow</Typography>
              <Select
                ref={selectRef}
                labelId="as-wf-label"
                value={workflow}
                onChange={handleWorkflowSelection}
                displayEmpty
                fullWidth
                size="small"
                sx={{ fontSize: 12.8, bgcolor: '#fff', minHeight: 36, color: workflow ? '#374151' : '#6D7386' }}
                renderValue={(v) => (v ? `${selectedworkflowtitle}` : 'Choose a workflow…')}
              >
                <ListSubheader sx={{ fontSize: 12, lineHeight: '30px' }}>Personal ({workflows.length})</ListSubheader>
                {workflows.length === 0 && <MenuItem disabled sx={{ fontSize: 12.5 }}>No personal workflows yet</MenuItem>}
                {workflows.map((wf) => (
                  <MenuItem key={`personal-${wf.id}`} value={`personal-${wf.id}`} sx={{ fontSize: 12.8 }}>
                    {wf.title}
                    <Box component="span" sx={{ ml: 'auto', pl: 2, fontSize: 11.5, color: '#6D7386' }}>{wf.signers?.length || 0} signers</Box>
                  </MenuItem>
                ))}
                <ListSubheader sx={{ fontSize: 12, lineHeight: '30px' }}>Your organisation ({organizationWorkflows.length})</ListSubheader>
                {organizationWorkflows.length === 0 && <MenuItem disabled sx={{ fontSize: 12.5 }}>No organisation workflows</MenuItem>}
                {organizationWorkflows.map((wf) => (
                  <MenuItem key={`organization-${wf.id}`} value={`organization-${wf.id}`} sx={{ fontSize: 12.8 }}>
                    {wf.title}
                    <Box component="span" sx={{ ml: 'auto', pl: 2, fontSize: 11.5, color: '#6D7386' }}>{wf.signers?.length || 0} signers</Box>
                  </MenuItem>
                ))}
              </Select>
              <Typography sx={{ fontSize: 11.5, color: '#6D7386', mt: 0.5 }}>Choosing one replaces the signing order.</Typography>
            </Box>
          </Box>

          {/* ── Right: the signing order, boxes, message, save as workflow ──── */}
          <Box sx={{ p: { xs: 2, sm: 2.5 }, px: { sm: 3 }, display: 'flex', flexDirection: 'column', gap: 1.75, minWidth: 0 }}>
            {workflow && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', p: '10px 12px', borderRadius: 1.5, bgcolor: '#e3edf7', border: '1px solid #c5d9ed' }}>
                <FaProjectDiagram size={14} color="#1a3a7a" aria-hidden />
                <Typography sx={{ flex: '1 1 180px', fontSize: 12.8, color: '#1a3a7a' }}>
                  From workflow <strong>{selectedworkflowtitle}</strong> · {workflowIsPersonal ? 'Personal' : 'Your organisation'}
                </Typography>
                <Tooltip title="Remove this workflow's signers and start again">
                  <Button onClick={clearWorkflowSigners} sx={{ ...PILL_OUTLINE, minHeight: 30, py: 0.25, px: 1.5, fontSize: 12 }}>Clear</Button>
                </Tooltip>
                {workflowIsPersonal && (
                  <Button
                    onClick={() => deleteWorkflow(workflow.split('-')[1])}
                    disabled={loadingDeleteWorkflow}
                    startIcon={loadingDeleteWorkflow ? <CircularProgress size={12} color="inherit" /> : null}
                    sx={{ ...PILL_OUTLINE, minHeight: 30, py: 0.25, px: 1.5, fontSize: 12, color: '#b42318', borderColor: '#f5c2c0', '&:hover': { bgcolor: '#fdecea', borderColor: '#b42318' } }}
                  >
                    Delete workflow
                  </Button>
                )}
              </Box>
            )}

            {workflowNote && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', p: '8px 10px', borderRadius: 1.5, bgcolor: '#fff8e1', border: '1px solid #ffe082', color: '#8a6100', fontSize: 12, lineHeight: 1.5 }}>
                <FaExclamationCircle size={13} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
                <span>{workflowNote}</span>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={sectionSx}>Signing order ({signers.length})</Typography>
              {signers.length > 1 && (
                <Typography sx={{ fontSize: 12, color: '#6D7386' }}>signers sign one after another, top to bottom</Typography>
              )}
            </Box>

            {signers.length === 0 ? (
              <Box sx={{ flex: '1 1 auto', minHeight: 220, border: '1px dashed #c5d9ed', borderRadius: 2, bgcolor: '#fbfdff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.25, p: 4, textAlign: 'center' }}>
                <FaUserPlus size={30} color="#2757aa" aria-hidden />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>No signers yet</Typography>
                <Typography sx={{ fontSize: 12.5, color: '#6D7386', maxWidth: 360, lineHeight: 1.55 }}>
                  Add signers on the left in the order they should sign, or choose a saved workflow. You can change the order before sending.
                </Typography>
              </Box>
            ) : (
              <>
                {/* One line per signer (about 40px). Long lists scroll inside their own box so the
                    message and "save as workflow" stay close by. */}
                <Box
                  component="ol"
                  aria-label="Signing order"
                  sx={{
                    listStyle: 'none', m: 0, p: 0, border: '1px solid #e5e7eb', borderRadius: 1.5,
                    overflowX: 'hidden', overflowY: signers.length > 8 ? 'auto' : 'visible',
                    maxHeight: signers.length > 8 ? 360 : 'none',
                  }}
                >
                  {signers.map((s, index) => {
                    const boxes = boxCount(s.email);
                    return (
                      <Box component="li" key={s.email} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: '5px', minHeight: 40, boxSizing: 'border-box', borderTop: index ? '1px solid #f3f4f6' : 'none' }}>
                        <Box component="span" sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#e3edf7', color: '#1a3a7a', fontSize: 10.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {index + 1}
                        </Box>
                        <Typography noWrap title={s.email} sx={{ flex: '1 1 auto', minWidth: 0, fontSize: 13, fontWeight: 500, color: '#111827' }}>{s.email}</Typography>
                        {s.phone && (
                          <Tooltip title={`SMS code to ${maskPhone(s.phone)}`}>
                            <Box component="span" aria-label={`SMS code to ${maskPhone(s.phone)}`} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 11.5, color: '#4b5563', flexShrink: 0, whiteSpace: 'nowrap' }}>
                              <FaMobileAlt size={11} /> {maskPhone(s.phone)}
                            </Box>
                          </Tooltip>
                        )}
                        {s.authenticate && (
                          <Tooltip title="Must log in to DSS before signing">
                            <Box component="span" aria-label="Must log in" sx={{ display: 'inline-flex', color: '#1a3a7a', flexShrink: 0 }}><FaUserShield size={12} /></Box>
                          </Tooltip>
                        )}
                        <Box component="span" sx={{ fontSize: 11.5, color: boxes ? '#2e7d32' : '#8a6100', flexShrink: 0, whiteSpace: 'nowrap', minWidth: 52, textAlign: 'right' }}>
                          {boxes ? `${boxes} box${boxes === 1 ? '' : 'es'}` : 'No box'}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <IconButton aria-label={`Move ${s.email} up`} disabled={index === 0} onClick={() => moveSigner(index, -1)} sx={{ ...ROUND_BTN, width: 26, height: 26, visibility: index === 0 ? 'hidden' : 'visible' }}>
                            <FaChevronUp size={11} />
                          </IconButton>
                          <IconButton aria-label={`Move ${s.email} down`} disabled={index === signers.length - 1} onClick={() => moveSigner(index, 1)} sx={{ ...ROUND_BTN, width: 26, height: 26, visibility: index === signers.length - 1 ? 'hidden' : 'visible' }}>
                            <FaChevronDown size={11} />
                          </IconButton>
                          <IconButton
                            aria-label={`Remove ${s.email}`} onClick={() => removeSigner(s.email)}
                            sx={{ ...ROUND_BTN, width: 26, height: 26, borderColor: '#f5c2c0', color: '#b42318', '&:hover': { bgcolor: '#fdecea' } }}
                          >
                            <FaTimes size={11} />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', p: '10px 12px', borderRadius: 1.5, bgcolor: '#f7faff', border: '1px solid #c5d9ed' }}>
                  <FaPen size={15} color="#2757aa" aria-hidden />
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography sx={{ fontSize: 12.8, fontWeight: 600, color: '#111827' }}>Signature boxes</Typography>
                    <Typography sx={{ fontSize: 12, color: '#6D7386' }}>
                      {signersWithBoxes === 0
                        ? 'None placed yet. Mark where each signer should sign.'
                        : `Placed for ${signersWithBoxes} of ${signers.length} signer${signers.length === 1 ? '' : 's'}.`}
                    </Typography>
                  </Box>
                  <Button onClick={() => setOpen(true)} sx={{ ...PILL_OUTLINE, whiteSpace: 'nowrap' }}>Place signature boxes</Button>
                </Box>

                <Box>
                  <Typography component="label" htmlFor="as-msg" sx={labelSx}>Message to signers (optional)</Typography>
                  <TextField
                    id="as-msg" inputRef={assignmentDescRef} multiline minRows={3} fullWidth size="small"
                    placeholder="e.g. Please sign by Friday."
                    defaultValue={textDraft.current.message}
                    onChange={(e) => { textDraft.current.message = e.target.value; saveDraft(); }}
                    sx={{ ...fieldSx(), '& .MuiInputBase-multiline': { p: 0 }, '& .MuiInputBase-input': { py: '8px', px: '12px' } }}
                  />
                </Box>

                {!workflow && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        size="small" checked={checked2} onChange={(e) => setChecked2(e.target.checked)}
                        inputProps={{ 'aria-labelledby': 'as-save-label' }}
                      />
                      <Typography id="as-save-label" sx={{ fontSize: 12.8, color: '#374151' }}>Save this signing order as a workflow</Typography>
                    </Box>
                    {checked2 && (
                      <Box sx={{ pl: { sm: 5.5 }, mt: 1, maxWidth: 380 }}>
                        <Typography component="label" htmlFor="as-wfname" sx={labelSx}>Workflow name</Typography>
                        <TextField
                          id="as-wfname" inputRef={wfTitleRef} fullWidth size="small" placeholder="e.g. Supplier contracts" sx={fieldSx()}
                          defaultValue={textDraft.current.wfTitle}
                          onChange={(e) => { textDraft.current.wfTitle = e.target.value; saveDraft(); }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        <DialogFooter>
          {signers.length === 0 && (
            <Typography sx={{ flex: '1 1 auto', fontSize: 12, color: '#6D7386' }}>Add at least one signer to send.</Typography>
          )}
          <SecondaryButton onClick={handleClose2} disabled={loadingSend}>Cancel</SecondaryButton>
          <PrimaryButton
            onClick={sendForSigning}
            loading={loadingSend}
            disabled={!signers.length || loadingSend}
            startIcon={<FaPaperPlane />}
            sx={{ ...PILL_COMPACT, minHeight: 34, px: 2.25 }}
          >
            {loadingSend ? 'Sending…' : signers.length ? `Send to ${signers.length} signer${signers.length === 1 ? '' : 's'}` : 'Send to signers'}
          </PrimaryButton>
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default AddSignersDialogMerged;
