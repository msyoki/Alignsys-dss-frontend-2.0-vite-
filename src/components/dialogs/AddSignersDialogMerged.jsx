import React, { useRef, useContext, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import axios from 'axios';
import AuthContext from '../../context/Authcontext';
import Switch from '@mui/material/Switch';
import { jsonPhoneCodesData } from '../../data/country-phone-codes';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import * as constants from '../constants/constants';
import SignersBoxDialog from './SignersBoxDialog';
import { ListSubheader, CircularProgress, Button } from '@mui/material';
import {
  FaPlusCircle,
  FaEnvelopeOpenText,
  FaUsers,
  FaNetworkWired,
  FaMailBulk,
  FaTrashAlt,
  FaUserCircle,
  FaMobileAlt,
  FaUserShield,
  FaTimes,
  FaArrowRight,
} from 'react-icons/fa';
import TimedAlert from '../TimedAlert';

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

// ---------------------------------------------------------------------------
// SignersList — defined OUTSIDE the parent to prevent unmount/remount
// ---------------------------------------------------------------------------
const SignersList = ({ signers, removeSigner, enableAuthentication }) => (
  <div
    className="d-flex flex-wrap align-items-center mt-2 mb-2 p-2"
    style={{ backgroundColor: '#e9f2ff', maxHeight: '12vh', overflowY: 'auto', gap: '4px' }}
  >
    {signers.map((item, index) => (
      <React.Fragment key={item.email}>
        <div
          className="d-flex align-items-center shadow-sm px-2 py-1"
          style={{
            borderRadius: '20px',
            backgroundColor: 'white',
            fontSize: '12px',
            flexShrink: 0,
            maxWidth: '100%',
            gap: '4px',
          }}
        >
          <FaUserCircle style={{ color: '#2757aa', fontSize: '14px' }} />

          <span className="text-dark text-truncate" style={{ maxWidth: 120 }}>
            {item.email}
          </span>

          {item.phone && (
            <Tooltip title="OTP authentication enabled" placement="top">
              <FaMobileAlt style={{ fontSize: '14px', color: '#0d6efd' }} />
            </Tooltip>
          )}

          {enableAuthentication && item.authenticate && (
            <Tooltip title="Account verification enabled" placement="top">
              <FaUserShield style={{ fontSize: '14px', color: '#0d6efd' }} />
            </Tooltip>
          )}

          <FaTimes
            style={{ cursor: 'pointer', fontSize: '14px', color: 'red' }}
            onClick={(e) => removeSigner(e, item.email)}
          />
        </div>

        {index < signers.length - 1 && (
          <FaArrowRight style={{ color: '#2757aa', fontSize: '14px', alignSelf: 'center' }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// AddSignerForm — defined OUTSIDE the parent to prevent unmount/remount
// ---------------------------------------------------------------------------
const AddSignerForm = React.memo(({
  onSubmit,
  checked,
  setChecked,
  checked3,
  setChecked3,
  loadingAddSigner,
  emailInputRef,
  phoneNumberRef,
  phoneCodeRef,
  enableAuthentication,
}) => (
  <form onSubmit={onSubmit}>
    <div className="rounded mb-2">
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
        <input
          ref={emailInputRef}
          className="form-control form-control-sm"
          type="email"
          name="to"
          placeholder="Email e.g. jdoe@mail.com"
          required
          aria-label="Signer email"
          style={{ flex: 1, minWidth: 0, height: '36px', fontSize: '13px' }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="medium"
          disabled={loadingAddSigner}
          startIcon={<FaPlusCircle size={13} />}
          className='rounded-pill'
          style={{

            textTransform: 'none',
            fontSize: '12px',
            px: { xs: 1.75, sm: 2.25 },     // balanced horizontal padding
            py: 1,

          }}
        >
          Add Signer
        </Button>
      </div>

      <div className="d-flex align-items-center gap-2 mb-2 flex-wrap" style={{ fontSize: 13 }}>
        <label
          htmlFor="otpSwitch"
          className="text-dark mb-0"
          style={{ userSelect: 'none', whiteSpace: 'nowrap', fontSize: 13 }}
        >
          Enable SMS OTP verification
        </label>
        <Switch
          id="otpSwitch"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          inputProps={{ 'aria-label': 'Enable SMS OTP verification' }}
          className="ms-1   mt-4"
          size="small"
        />
      </div>

      {checked && (
        <div className="d-flex gap-1 mb-2" style={{ maxWidth: 300 }}>
          <select
            ref={phoneCodeRef}
            className="form-control form-control-sm"
            name="phoneCode"
            style={{ maxWidth: 100, padding: '0.25rem 0.5rem' }}
            aria-label="Select country code"
          >
            <option value="+254">Kenya (+254)</option>
            {jsonPhoneCodesData.map((item, index) => (
              <option key={index} value={item.dial_code}>
                {item.name} ({item.dial_code})
              </option>
            ))}
          </select>
          <input
            ref={phoneNumberRef}
            type="tel"
            className="form-control form-control-sm"
            maxLength={15}
            name="phoneNumber"
            placeholder="e.g. 722XXXXXX"
            pattern="[1-9][0-9]{6,14}"
            title="Enter a valid phone number without the country code"
            aria-label="Phone number"
            style={{ minWidth: 160, padding: '0.25rem 0.5rem' }}
          />
        </div>
      )}

      {/* Account verification — only shown in v1 mode */}
      {/* {enableAuthentication && (
        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: 13 }}>
          <label
            htmlFor="authSwitch"
            className="text-dark mb-0"
            style={{ userSelect: 'none', whiteSpace: 'nowrap', fontSize: 13 }}
          >
            Enable account verification
          </label>
          <Switch
            id="authSwitch"
            checked={checked3}
            onChange={(e) => setChecked3(e.target.checked)}
            inputProps={{ 'aria-label': 'Enable account verification' }}
            className="ms-1"
            size="small"
          />
        </div>
      )} */}
    </div>
  </form>
));

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
    workflows,
    organizationWorkflows,
    getWorkflows,
    setLoading,
    // V1-specific callbacks
    setAlertSeverity: parentSetAlertSeverity,
    setAlertMsg: parentSetAlertMsg,
    setOpenAlert: parentSetOpenAlert,
    refreshdata,
    setActiveForm,
    // V2-specific
    // (navigate is called via onSuccess below — no extra prop needed)
  } = props;

  // --- Refs ---
  const selectRef = useRef();
  const emailInputRef = useRef();
  const phoneNumberRef = useRef();
  const wfTitleRef = useRef();
  const assignmentDescRef = useRef();
  const phoneCodeRef = useRef();

  // --- Context ---
  const { authTokens, logoutUser, user } = useContext(AuthContext);

  // --- State ---
  const [workflow, setWorkflow] = useState('');
  const [selectedworkflowtitle, setSelectedWorkflowTitle] = useState('');
  const [signers, setSigners] = useState([]);
  const [checked, setChecked] = useState(false); // OTP
  const [checked2, setChecked2] = useState(false); // Save as workflow
  const [checked3, setChecked3] = useState(false); // Account verification (v1)
  const [openalert, setOpenAlert] = useState(false);
  const [alertseverity, setAlertSeverity] = useState('');
  const [alertmsg, setAlertMsg] = useState('');
  const [open, setOpen] = useState(false);
  const [signatureBoxes, setSignatureBoxes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingAddSigner, setLoadingAddSigner] = useState(false);
  const [loadingDeleteWorkflow, setLoadingDeleteWorkflow] = useState(false);

  const textcolor = { color: '#2757aa' };

  // --- Alert helper --------------------------------------------------------
  // Shows alert locally inside the dialog. For v1, also bubbles up to parent.
  const showAlert = (message, severity, duration = 3000) => {
    setOpenAlert(true);
    setAlertMsg(message);
    setAlertSeverity(severity);
    setTimeout(() => setOpenAlert(false), duration);

    if (isV1 && parentSetOpenAlert) {
      parentSetOpenAlert(true);
      if (parentSetAlertMsg) parentSetAlertMsg(message);
      if (parentSetAlertSeverity) parentSetAlertSeverity(severity);
      setTimeout(() => parentSetOpenAlert(false), duration);
    }
  };

  // --- Helpers -------------------------------------------------------------
  const validateEmail = (email) =>
    /^([a-zA-Z0-9_.\-])+@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email);

  const resetDialog = () => {
    if (selectRef.current) selectRef.current.value = '';
    setWorkflow('');
    setSelectedWorkflowTitle('');
    setSigners([]);
    setSignatureBoxes([]);
    setSelectedUser(null);
    setSelectedAnnotationId(null);
    setChecked2(false);
    if (emailInputRef.current) emailInputRef.current.value = '';
    if (phoneNumberRef.current) phoneNumberRef.current.value = '';
    if (phoneCodeRef.current) phoneCodeRef.current.value = '';
    if (wfTitleRef.current) wfTitleRef.current.value = '';
    if (assignmentDescRef.current) assignmentDescRef.current.value = '';
  };

  // --- Handlers ------------------------------------------------------------
  const handleClose = () => {
    setOpenDialogAddSigners(false);
    setSelectedUser(null);
    setSelectedAnnotationId(null);
  };

  const handleClose2 = () => {
    setOpenDialogAddSigners(false);
    resetDialog();
  };

  const handleWorkflowSelection = (e) => {
    const value = e.target.value;
    if (!value) {
      setWorkflow('');
      return;
    }
    setWorkflow(value);
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
      setWorkflow('');
      setSelectedWorkflowTitle('');
      setSigners([]);
      return;
    }

    setSelectedWorkflowTitle(selectedWorkflow.title);
    setSigners([...selectedWorkflow.signers]);
  };

  const deleteWorkflow = async (workflowId) => {
    setLoadingDeleteWorkflow(true);
    try {
      await axios.delete(buildDeleteUrl(workflowId), {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      getWorkflows();
      if (selectRef.current) selectRef.current.value = '';
      setWorkflow('');
      setSelectedWorkflowTitle('');
      setSigners([]);
      showAlert('Workflow deleted successfully', 'success');
    } catch {
      showAlert('Error deleting workflow', 'error');
    }
    setLoadingDeleteWorkflow(false);
  };

  const addMailList = async (e) => {
    e.preventDefault();
    setLoadingAddSigner(true);
    if (selectRef.current) selectRef.current.value = '';
    setWorkflow('');
    setSelectedWorkflowTitle('');

    const email = emailInputRef.current.value;

    if (checked && (!phoneNumberRef.current.value || !phoneCodeRef.current.value)) {
      showAlert('Phone number is required for OTP', 'error');
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
    if (signers.some((item) => item.email === email)) {
      showAlert('Email already exists, enter another signer or send to signers', 'error');
      setLoadingAddSigner(false);
      return;
    }

    const otp = checked;
    const phoneNumber = otp ? phoneNumberRef.current.value : '';
    const phoneCode = otp ? phoneCodeRef.current.value : '';
    const signer = {
      email,
      ...(otp ? { phone: `${phoneCode}${phoneNumber}` } : {}),
      ...(enableAuthentication && checked3 ? { authenticate: true } : {}),
    };

    setSigners((prev) => [...prev, signer]);
    emailInputRef.current.value = '';
    if (checked && phoneNumberRef.current) phoneNumberRef.current.value = '';
    setChecked(false);
    setChecked3(false);
    setLoadingAddSigner(false);
  };

  const removeSigner = (e, email) => {
    setSigners((prev) => prev.filter((item) => item.email !== email));
    setSignatureBoxes((prev) => prev.filter((item) => item.signer.email !== email));
    if (signers.length === 1) {
      if (selectRef.current) selectRef.current.value = '';
      setWorkflow('');
      setSelectedWorkflowTitle('');
      setChecked2(false);
    }
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
    } catch {
      showAlert('Error saving workflow', 'error');
    }
  };

  const sendForSigning = async () => {
    setLoadingSend(true);
    const assignmentDescription = assignmentDescRef.current.value;

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
    if (checked2 && !wfTitleRef.current.value) {
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
    } catch {
      setLoading(false);
      showAlert('Failed to send document. Please try again.', 'error');
    }
    setLoadingSend(false);
  };

  // --- Render --------------------------------------------------------------
  return (
    <>
      <SignersBoxDialog
        selectedAnnotationId={selectedAnnotationId}
        setSelectedAnnotationId={setSelectedAnnotationId}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        file={file}
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
      />

      <Dialog
        open={opendialogaddsigners}
        onClose={handleClose2}
        TransitionProps={{ onExited: resetDialog }}
        aria-describedby="alert-dialog-slide-description"
        fullWidth
        maxWidth="md"
      >
        <div className="row m-0" style={{ width: '100%' }}>

          {/* ── Left panel: add signers + workflow selection ─────────────── */}
          <div className="col-md-12 col-lg-5" style={{ backgroundColor: '#fff', color: 'white' }}>
            <div
              className="text-dark p-3"
              style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div style={{ fontSize: '14px', color: '#2757aa', fontWeight: 500 }}>
                1. Add signer(s)' emails below in the order you would like them to sign
              </div>

              <AddSignerForm
                onSubmit={addMailList}
                checked={checked}
                setChecked={setChecked}
                checked3={checked3}
                setChecked3={setChecked3}
                loadingAddSigner={loadingAddSigner}
                emailInputRef={emailInputRef}
                phoneNumberRef={phoneNumberRef}
                phoneCodeRef={phoneCodeRef}
                enableAuthentication={enableAuthentication}
              />

              <div className="text-center" style={{ margin: '5px 0' }}>
                <span style={{ fontSize: '13.5px', color: '#2757aa', fontWeight: 500 }}>OR</span>
              </div>

              <div style={{ fontSize: '14px', color: '#2757aa', fontWeight: 500 }}>
                2. Select an existing workflow below
              </div>

              <FormControl variant="filled" size="small" style={{ width: '100%' }}>
                <InputLabel id="merged-select-label" style={{ fontSize: '14px', color: 'black' }}>
                  Select Workflow
                </InputLabel>
                <Select
                  ref={selectRef}
                  labelId="merged-select-label"
                  id="merged-select"
                  value={workflow}
                  onChange={handleWorkflowSelection}
                  name="wf"
                  size="small"
                  style={{ backgroundColor: 'white' }}
                  inputProps={{ style: { backgroundColor: 'white' } }}
                >
                  <ListSubheader
                    disabled
                    style={{ fontSize: '13px', backgroundColor: '#f0f0f0', color: '#2757aa' }}
                  >
                    Personal Workflows ({workflows.length})
                  </ListSubheader>

                  {workflows.map((wf) => {
                    const itemValue = `personal-${wf.id}`;
                    const isSelected = workflow === itemValue;
                    return (
                      <MenuItem key={itemValue} value={itemValue} style={{ fontSize: '12.5px' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                          <span>{wf.title}</span>
                          {!isSelected && (
                            <Tooltip title="Delete workflow">
                              <span>
                                <FaTrashAlt
                                  style={{
                                    color: 'red',
                                    cursor: loadingDeleteWorkflow ? 'not-allowed' : 'pointer',
                                    marginLeft: '8px',
                                    opacity: loadingDeleteWorkflow ? 0.5 : 1,
                                  }}
                                  onClick={
                                    loadingDeleteWorkflow
                                      ? undefined
                                      : (e) => { e.stopPropagation(); deleteWorkflow(wf.id); }
                                  }
                                />
                                {loadingDeleteWorkflow && (
                                  <CircularProgress
                                    size={14}
                                    color="inherit"
                                    style={{ marginLeft: 4, verticalAlign: 'middle' }}
                                  />
                                )}
                              </span>
                            </Tooltip>
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}

                  <ListSubheader
                    disabled
                    style={{ fontSize: '13px', backgroundColor: '#f0f0f0', color: '#2757aa' }}
                  >
                    Organization Workflows ({organizationWorkflows.length})
                  </ListSubheader>

                  {organizationWorkflows.map((wf) => (
                    <MenuItem key={`org-${wf.id}`} value={`org-${wf.id}`} style={{ fontSize: '12.5px' }}>
                      {wf.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <div className="row justify-content-center my-2">
                <Button
                  variant="contained"
                  color="warning"
                  size="medium"
                  onClick={handleClose2}
                  className="rounded-pill"
                  disableElevation
                  sx={{
                    textTransform: "none",
                    fontSize: "12px",
                    fontWeight: 500,
                    minHeight: 32,
                    px: 2,
                    py: 0.6,
                    minWidth: 160,
                    width: "fit-content",
                    borderRadius: "999px",
                    alignSelf: "center",
                  }}
                >
                  Cancel / Back Home
                </Button>
              </div>
            </div>
          </div>

          {/* ── Right panel: signers list + send ─────────────────────────── */}
          <div className="col-md-12 col-lg-7 text-center shadow-lg" id="maillist">
            <span className="bg-white text-center" style={{ height: 'auto' }}>
              {signers.length < 1 ? (
                <div className="row d-flex justify-content-center mt-5">
                  <div className="col-md-6">
                    <h6 className="mt-2 mb-4" style={textcolor}>
                      <FaEnvelopeOpenText size={15} className="mx-1" />
                      No signers added
                    </h6>
                  </div>
                </div>
              ) : (
                <>
                  <br />

                  {workflow && (
                    <div
                      className="d-flex align-items-center mt-2 mb-4"
                      style={{ fontSize: '14px', color: '#2757aa' }}
                    >
                      <span>Selected Workflow - {selectedworkflowtitle}</span>
                      {workflow.startsWith('personal-') && (
                        <Tooltip title="Delete workflow">
                          <span
                            className="ms-2"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              cursor: loadingDeleteWorkflow ? 'not-allowed' : 'pointer',
                            }}
                            onClick={
                              loadingDeleteWorkflow
                                ? undefined
                                : (e) => {
                                  e.stopPropagation();
                                  deleteWorkflow(workflow.split('-')[1]);
                                }
                            }
                          >
                            <FaTrashAlt size={15} className="text-danger" />
                            {loadingDeleteWorkflow && (
                              <CircularProgress size={14} color="inherit" style={{ marginLeft: 4 }} />
                            )}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  )}

                  {signers.length > 0 && (
                    <h6 className="my-2" style={textcolor}>
                      <FaUsers size={15} className="mx-1" />
                      Signers (<small>{signers.length}</small>)
                    </h6>
                  )}

                  <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                    <SignersList
                      signers={signers}
                      removeSigner={removeSigner}
                      enableAuthentication={enableAuthentication}
                    />
                  </div>

                  {signers.length > 0 && (
                    <Button
                      variant="contained"
                      color="primary"
                      size='medium'
                      className='rounded-pill'
                      style={{

                        textTransform: 'none',
                        fontSize: '12px',
                        px: { xs: 1.75, sm: 2.25 },     // balanced horizontal padding
                        py: 1,

                      }}
                      onClick={() => setOpen(true)}
                      disableElevation
                    >
                      <span className="mx-2">Preview / Mark Where to Sign</span>
                    </Button>
                  )}

                  {signers.length > 0 && !workflow && (
                    <div className="input-group mt-4" style={{ backgroundColor: '#e5e5e5' }}>
                      <label className="m-1 text-dark m-2" style={{ fontSize: '12.5px' }}>
                        <FaNetworkWired size={15} style={{ color: '#2757aa' }} />
                        Save this order as a workflow?
                      </label>
                      <Switch
                        checked={checked2}
                        onChange={(e) => setChecked2(e.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                      />
                      {checked2 && (
                        <input
                          ref={wfTitleRef}
                          className="form-control form-control-sm"
                          type="text"
                          placeholder="Type workflow title here"
                          required
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </span>

            <div className="row">
              {signers.length > 0 && (
                <div className="text-center">
                  <label className="m-3" style={{ fontSize: '14px' }}>
                    Assignment Description :
                  </label>
                  <div className="input-group">
                    <textarea
                      ref={assignmentDescRef}
                      className="form-control form-control-sm"
                      name="ad"
                      rows="3"
                      cols="50"
                    />
                  </div>
                  <div className="my-3 mb-3">
                    <Button
                      variant="contained"
                      color="success"
                      size='large'
                      className='rounded-pill'
                      style={{

                        textTransform: 'none',
                        fontSize: '12px',
                        px: { xs: 1.75, sm: 2.25 },     // balanced horizontal padding
                        py: 1,

                      }}
                      onClick={sendForSigning}
                      disableElevation
                      disabled={loadingSend}
                    >
                      {loadingSend ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CircularProgress size={18} color="inherit" style={{ marginRight: 8 }} />
                          Sending for signing...
                        </span>
                      ) : (
                        <>
                          <FaMailBulk size={15} className="mx-1" />
                          <span className="mx-2">Send to Signers</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </Dialog>
    </>
  );
};

export default AddSignersDialogMerged;