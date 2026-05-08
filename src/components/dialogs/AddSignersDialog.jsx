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
import { FaPlusCircle } from 'react-icons/fa';
import { FaEnvelopeOpenText, FaUsers, FaNetworkWired, FaMailBulk } from 'react-icons/fa';

import TimedAlert from '../TimedAlert';

const AddSignersDialog = (props) => {
  // --- Refs ---
  const selectRef = useRef();
  const emailInputRef = useRef();
  const phoneNumberRef = useRef();
  const wfTitleRef = useRef();
  const assignmentDescRef = useRef();
  const phoneCodeRef = useRef();

  // --- State ---
  const [workflow, setWorkflow] = useState('');
  const [selectedworkflowtitle, setSelectedWorkflowTitle] = useState('');
  const [emailexists, setEmailExists] = useState(false);
  const [signers, setSigners] = useState([]);
  const { authTokens, logoutUser, user } = useContext(AuthContext);
  const [checked, setChecked] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);
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

  // --- Handlers ---
  const handleClose = () => {
    props.setOpenDialogAddSigners(false);
    setSelectedUser(null);
    setSelectedAnnotationId(null);
  };

  const handleClose2 = () => {
    props.setOpenDialogAddSigners(false);
    selectRef.current.value = '';
    setWorkflow('');
    setSelectedWorkflowTitle('');
    setSigners([]);
    setSignatureBoxes([]);
    setSelectedUser(null);
    setSelectedAnnotationId(null);
  };

  const changeForm = (e) => setChecked(e.target.checked);
  const changeForm2 = (e) => setChecked2(e.target.checked);
  const changeForm3 = (e) => setChecked3(e.target.checked);

  const validateEmail = (email) =>
    /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email);

  const deleteWorkflow = async (workflowId) => {
    setLoadingDeleteWorkflow(true);
    try {
      await axios.delete(`${constants.devApiBaseUrl}/api/workflow/${workflowId}/delete/`, {
        headers: { 'Authorization': `Bearer ${authTokens.access}` }
      });
      props.getWorkflows();
      selectRef.current.value = '';
      setWorkflow('');
      setSelectedWorkflowTitle('');
      setSigners([]);
      setOpenAlert(true);
      setAlertMsg('Workflow deleted successfully');
      setAlertSeverity('success');
      setTimeout(() => setOpenAlert(false), 3000);
    } catch {
      setOpenAlert(true);
      setAlertMsg('Error deleting workflow');
      setAlertSeverity('error');
      setTimeout(() => setOpenAlert(false), 3000);
    }
    setLoadingDeleteWorkflow(false);
  };

  const AddWorkflow = (e, selectedValue) => {
    setWorkflow(e ? e.target.value : `personal-${selectedValue}`);
    const intValue = +selectedValue;
    const selectedWorkflow = props.workflows.find((wf) => wf.id === intValue);
    if (selectedWorkflow) {
      setSelectedWorkflowTitle(selectedWorkflow.title);
      setSigners([...selectedWorkflow.signers]);
    }
  };

  const AddOrganizationWorkflow = (e, selectedValue) => {
    setWorkflow(e ? e.target.value : `org-${selectedValue}`);
    const intValue = +selectedValue;
    const selectedWorkflow = props.organizationWorkflows.find((wf) => wf.id === intValue);
    if (selectedWorkflow) {
      setSelectedWorkflowTitle(selectedWorkflow.title);
      setSigners([...selectedWorkflow.signers]);
    }
  };

  const saveWorkflow = async () => {
    try {
      const title = wfTitleRef.current.value;
      const data = JSON.stringify({ wftitle: title, wfsigners: signers });
      await axios.post(`${constants.devApiBaseUrl}/api/new/workflow/`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.access}`
        }
      });
      props.getWorkflows();
      wfTitleRef.current.value = '';
      setChecked2(false);
      setOpenAlert(true);
      setAlertMsg(`Workflow was saved successfully`);
      setAlertSeverity('success');
      setTimeout(() => setOpenAlert(false), 3000);
    } catch {
      setOpenAlert(true);
      setAlertMsg('Error saving workflow');
      setAlertSeverity('error');
      setTimeout(() => setOpenAlert(false), 3000);
    }
  };

  const addMailList = async (e) => {
    e.preventDefault();
    setLoadingAddSigner(true);
    selectRef.current.value = '';
    setWorkflow('');
    setSelectedWorkflowTitle('');
    setEmailExists(false);
    const email = emailInputRef.current.value;
    if (checked && (!phoneNumberRef.current.value || !phoneCodeRef.current.value)) {
      setOpenAlert(true);
      setAlertMsg('phone number is required for otp');
      setAlertSeverity('error');
      setTimeout(() => setOpenAlert(false), 3000);
      setLoadingAddSigner(false);
      return;
    }
    if (!email) {
      setOpenAlert(true);
      setAlertMsg('Email is required');
      setAlertSeverity('error');
      setTimeout(() => setOpenAlert(false), 3000);
      setLoadingAddSigner(false);
      return;
    }
    if (!validateEmail(email)) {
      setOpenAlert(true);
      setAlertMsg(`email ${email} is invalid, enter a valid email address`);
      setAlertSeverity('error');
      setTimeout(() => setOpenAlert(false), 3000);
      setLoadingAddSigner(false);
      return;
    }
    const authenticate = checked3;
    const otp = checked;
    const phoneNumber = otp ? phoneNumberRef.current.value : '';
    const phoneCode = otp ? phoneCodeRef.current.value : '';
    let signer = {
      email,
      ...(otp ? { phone: `${phoneCode}${phoneNumber}` } : {}),
      ...(authenticate ? { authenticate: true } : {})
    };
    if (!signers.some(item => item.email === email)) {
      setSigners(prev => [...prev, signer]);
      emailInputRef.current.value = '';
      if (checked) phoneNumberRef.current.value = '';
      setChecked(false);
      setChecked3(false);
    } else {
      setOpenAlert(true);
      setAlertMsg('email already exists, enter another signer or send to signers');
      setAlertSeverity('error');
      setTimeout(() => setOpenAlert(false), 3000);
    }
    setLoadingAddSigner(false);
  };

  const removeSigner = (e, email) => {
    setSigners(signers.filter(item => item.email !== email));
    setSignatureBoxes((prevState) =>
      prevState.filter((item) => item.signer.email !== email)
    );
    if (signers.length === 1) {
      selectRef.current.value = '';
      setWorkflow('');
      setSelectedWorkflowTitle('');
      setChecked2(false);
    }
  };

  const sendForSigning = async (e) => {
    setLoadingSend(true);
    const assignmentDescription = assignmentDescRef.current.value;
    const filename = props.fileurl;
    const showAlert = (message, severity) => {
      props.setOpenAlert(true);
      props.setAlertMsg(message);
      props.setAlertSeverity(severity);
      setTimeout(() => props.setOpenAlert(false), 3000);
    };
    if (checked2 && !wfTitleRef.current.value) {
      setOpenAlert(true);
      setAlertMsg("New workflow title is required!");
      setAlertSeverity("error");
      setTimeout(() => setOpenAlert(false), 3000);
      setLoadingSend(false);
      return;
    }
    if (!signers.length) {
      showAlert("At least one signer is required!", "error");
      setLoadingSend(false);
      return;
    }
    if (checked2) await saveWorkflow();
    const mydata = JSON.stringify({
      documentid: filename,
      signers,
      ...(assignmentDescription ? { assignmentd: assignmentDescription } : { annotations: signatureBoxes || null }),
    });
    console.log(filename);
    try {
      const response = await axios.post(`${constants.devApiBaseUrl}/api/othersigners/`, mydata, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
      });
      props.setLoading(false);
      if (response.status === 200) {
        props.refreshdata();
        props.setOpenDialogAddSigners(false);
        // Use callback to parent to reset form, not direct DOM manipulation
        if (props.onResetForm) props.onResetForm();
        showAlert("Successfully sent for signing!", "success");
        props.setActiveForm('file-upload')
        setTimeout(() => props.setOpenAlert(false), 6000);
      } else if (response.statusText === "Unauthorized") {
        logoutUser();
      } else {
        showAlert("Something went wrong, try again.", "error");
      }
    } catch (error) {

      console.log(error);
      props.setLoading(false);
      showAlert("Failed to send document. Please try again.", error.response ? "error" : "error");
    }
    setLoadingSend(false);
  };

  // --- UI Components ---
  const SignersList = ({ signers, removeSigner }) => (
    <div className="d-flex flex-wrap align-items-center mt-2 mb-2 p-2" style={{ backgroundColor: '#e9f2ff', maxHeight: '12vh', overflowY: 'auto', gap: '4px' }}>
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
            <i className="fas fa-user-circle" style={{ color: '#2757aa', fontSize: '14px' }}></i>
            <span className="text-dark text-truncate" style={{ maxWidth: 120 }}>{item.email}</span>
            {item.phone && (
              <Tooltip title="OTP authentication enabled" placement="top">
                <i className="fas fa-mobile text-primary" style={{ fontSize: '14px' }}></i>
              </Tooltip>
            )}
            {item.authenticate && (
              <Tooltip title="Account verification enabled" placement="top">
                <i className="fas fa-user-shield text-primary" style={{ fontSize: '14px' }}></i>
              </Tooltip>
            )}
            <i
              className="fas fa-times text-danger"
              style={{ cursor: 'pointer', fontSize: '14px' }}
              onClick={e => removeSigner(e, item.email)}
            ></i>
          </div>

          {index < signers.length - 1 && (
            <i
              className="fas fa-arrow-right text-nowrap"
              style={{ color: '#2757aa', fontSize: '14px', alignSelf: 'center' }}
            ></i>
          )}
        </React.Fragment>
      ))}
    </div>
  );


  const AddSignerForm = ({
    onSubmit, checked, setChecked, emailInputRef, phoneNumberRef, phoneCodeRef
  }) => (
    <form onSubmit={onSubmit}>
      <div className="rounded mb-2">
        {/* <h5 className="mb-2" style={{ fontSize: 13, color: '#2757aa' }}>
          <i className="fas fa-user-plus me-2"></i>Add new signer
        </h5> */}
        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap" style={{ fontSize: 13 }}>



          <label htmlFor="otpSwitch" className="text-dark mb-0" style={{ userSelect: 'none', whiteSpace: 'nowrap', fontSize: 13 }}>
            Enable SMS OTP verification
          </label>
          <Switch
            id="otpSwitch"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            inputProps={{ 'aria-label': 'Enable SMS OTP verification' }}
            className="ms-1"
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
   <div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
  }}
>
  <input
    ref={emailInputRef}
    className="form-control form-control-sm"
    type="email"
    name="to"
    placeholder="Email e.g. jdoe@mail.com"
    required
    aria-label="Signer email"
    style={{
      flex: 1,
      minWidth: 0,
      height: '36px',
      fontSize: '13px',
    }}
  />

  <Button
    type="submit"
    variant="contained"
    color="primary"
    size="small"
    disabled={loadingAddSigner}
    startIcon={<FaPlusCircle size={13} />}
    style={{
      backgroundColor: '#2757aa',
      textTransform: 'none',
      fontSize: '12px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '0 12px',
      whiteSpace: 'nowrap',
      fontWeight: 300,
      // borderRadius: '999px',
      boxShadow: 'none',
      flexShrink: 0,
    }}
  >
    Add Signer
  </Button>
</div>



      </div>
    </form>
  );

  function handleWorkflowSelection(value) {
    if (!value) {
      setWorkflow(null);
      return;
    }
    const [type, id] = value.split('-');
    if (type === 'personal') {
      AddWorkflow(null, id);
    } else if (type === 'org') {
      AddOrganizationWorkflow(null, id);
    }
    setWorkflow(value);
  }

  // --- Render ---
  const textcolor = { color: '#2757aa' };

  return (
    <>
      <SignersBoxDialog selectedAnnotationId={selectedAnnotationId} setSelectedAnnotationId={setSelectedAnnotationId} selectedUser={selectedUser} setSelectedUser={setSelectedUser} file={props.fileurl} signers={signers} open={open} setOpen={setOpen} signatureBoxes={signatureBoxes} setSignatureBoxes={setSignatureBoxes} />



      <TimedAlert
        open={openalert}
        onClose={() => setOpenAlert(false)}
        severity={alertseverity}
        message={alertmsg}
        setSeverity={setAlertSeverity}
        setMessage={setAlertMsg}
      />

      <Dialog
        open={props.opendialogaddsigners}
        onClose={handleClose2}
        TransitionProps={{
          onExited: () => {
            // Reset state only after dialog is fully closed
            setSigners([]);
            setWorkflow('');
            setSelectedWorkflowTitle('');
            setSignatureBoxes([]);
            setSelectedUser(null);
            setSelectedAnnotationId(null);
            setChecked2(false);
            if (emailInputRef.current) emailInputRef.current.value = '';
            if (phoneNumberRef.current) phoneNumberRef.current.value = '';
            if (phoneCodeRef.current) phoneCodeRef.current.value = '';
            if (wfTitleRef.current) wfTitleRef.current.value = '';
            if (assignmentDescRef.current) assignmentDescRef.current.value = '';
          }
        }}
        aria-describedby="alert-dialog-slide-description"
        fullWidth
        maxWidth="md"
      >
        <div className='row m-0' style={{ width: '100%' }} >
          <div className='col-md-12 col-lg-5' style={{ backgroundColor: '#fff', color: 'white' }}>
            <div
              className="text-dark p-3"
              style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {/* Section: Add new signers */}
              <div style={{ fontSize: '14px', color: '#2757aa', fontWeight: 500 }}>
                1. Add signer(s)' emails below in the order you would like them to sign
              </div>

              <AddSignerForm
                onSubmit={addMailList}
                checked={checked}
                setChecked={setChecked}
                emailInputRef={emailInputRef}
                phoneNumberRef={phoneNumberRef}
                phoneCodeRef={phoneCodeRef}
              />

              {/* Divider */}
              <div className="text-center" style={{ margin: '5px 0' }}>
                <span style={{ fontSize: '13.5px', color: '#2757aa', fontWeight: 500 }}>
                  OR
                </span>
              </div>

              {/* Section: Select existing workflow */}
              <div style={{ fontSize: '14px', color: '#2757aa', fontWeight: 500 }}>
                2. Select an existing workflow below
              </div>

              <FormControl
                variant="filled"
                size="small"
                style={{ width: '100%' }}
              >
                <InputLabel id="merged-select-label" style={{ fontSize: '14px', color: 'black' }}>
                  Select Workflow
                </InputLabel>

                <Select
                  ref={selectRef}
                  labelId="merged-select-label"
                  id="merged-select"
                  value={workflow}
                  onChange={(e) => handleWorkflowSelection(e.target.value)}
                  name="wf"
                  size="small"
                  style={{ backgroundColor: 'white' }}
                  inputProps={{ style: { backgroundColor: 'white' } }}
                >
                  {/* Personal Workflows */}
                  <ListSubheader
                    disabled
                    style={{
                      fontSize: '13px',
                      backgroundColor: '#f0f0f0',
                      color: '#2757aa',
                    }}
                  >
                    Personal Workflows ({props.workflows.length})
                  </ListSubheader>

                  {props.workflows.map((wf) => {
                    const itemValue = `personal-${wf.id}`;
                    const isSelected = workflow === itemValue;

                    return (
                      <MenuItem
                        key={itemValue}
                        value={itemValue}
                        style={{ fontSize: '12.5px' }}
                      >
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          width="100%"
                        >
                          <span>{wf.title}</span>

                          {/* Only show delete icon if NOT selected */}
                          {!isSelected && (
                            <Tooltip title="Delete workflow">
                              <span>
                                <i
                                  className="fas fa-trash-alt text-danger"
                                  style={{
                                    cursor: loadingDeleteWorkflow ? 'not-allowed' : 'pointer',
                                    marginLeft: '8px',
                                  }}
                                  onClick={
                                    loadingDeleteWorkflow
                                      ? undefined
                                      : (e) => {
                                        e.stopPropagation();
                                        deleteWorkflow(wf.id);
                                      }
                                  }
                                />
                                {loadingDeleteWorkflow && (
                                  <CircularProgress
                                    size={14}
                                    color="inherit"
                                    style={{
                                      marginLeft: 4,
                                      verticalAlign: 'middle',
                                    }}
                                  />
                                )}
                              </span>
                            </Tooltip>
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}


                  {/* Organization Workflows */}
                  <ListSubheader
                    disabled
                    style={{
                      fontSize: '13px',
                      backgroundColor: '#f0f0f0',
                      color: '#2757aa',
                    }}
                  >
                    Organization Workflows ({props.organizationWorkflows.length})
                  </ListSubheader>

                  {props.organizationWorkflows.map((wf) => (
                    <MenuItem
                      key={`org-${wf.id}`}
                      value={`org-${wf.id}`}
                      style={{ fontSize: '12.5px' }}
                    >
                      {wf.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>




            <div className='row d-flex justify-content-center my-2'>
              <Button
                variant="contained"
                color="warning"
                onClick={() => props.setOpenDialogAddSigners(false)}
                style={{ textTransform: 'none', fontSize: '14px', width: "50%", borderRadius: 30, background: '#ffda75', color: '#30343f', boxShadow: 'none', border: 'none' }}
                className='m-2 p-2'
                disableElevation
                disabled={false}
              >
                Cancel/ Back home
              </Button>
            </div>
          </div>
          <div className='col-md-12 col-lg-7 text-center shadow-lg' id='maillist'>
            <span className="bg-white text-center" style={{ height: 'auto' }}>
              {signers.length < 1 ? (
                <div className="row d-flex justify-content-center mt-5">
                  <div className="col-md-6">
                    <h6 className='mt-2 mb-4' style={textcolor}>
                      <FaEnvelopeOpenText size={15} className="mx-1" />
                      No signers added
                    </h6>
                  </div>
                </div>
              ) : (
                <>
                  <br />

                  {workflow && (
                    <div className="d-flex align-items-center mt-2 mb-4" style={{ fontSize: '14px', color: '#2757aa' }}>
                      <span>Selected Workflow - {selectedworkflowtitle}</span>

                      {/* Only show delete if selected workflow is personal */}
                      {workflow.startsWith('personal-') && (
                        <Tooltip title="Delete workflow">
                          <span
                            className="ms-2"
                            style={{ display: 'flex', alignItems: 'center', cursor: loadingDeleteWorkflow ? 'not-allowed' : 'pointer' }}
                            onClick={loadingDeleteWorkflow ? undefined : (e) => {
                              e.stopPropagation();
                              const wfId = workflow.split('-')[1];
                              deleteWorkflow(wfId);
                            }}
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
                    <h6 className='my-2' style={textcolor}>
                      <FaUsers size={15} className="mx-1" />
                      Signers (<small>{signers.length}</small>)
                    </h6>
                  )}

                  <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                    <SignersList signers={signers} removeSigner={removeSigner} />
                  </div>
                  {signers.length > 0 && (
                    <Button
                      variant="contained"
                      color="primary"
                      className="m-1 p-2"
                      style={{ textTransform: "none", fontSize: "12px", borderRadius: 30, background: '#2757aa', color: '#fff', boxShadow: 'none', border: 'none' }}
                      onClick={() => setOpen(true)}
                      disableElevation
                      disabled={false}
                    >
                      <span className="mx-2">Preview / Mark Where to Sign</span>
                    </Button>
                  )}
                  {signers.length > 0 && !workflow && (
                    <div className='input-group mt-4' style={{ backgroundColor: "#e5e5e5" }}>
                      <label className='m-1 text-dark m-2' style={{ fontSize: '12.5px' }}>
                        <FaNetworkWired size={15} style={{ color: "#2757aa" }} />
                        Save this order as a workflow?
                      </label>
                      <Switch
                        checked={checked2}
                        onChange={changeForm2}
                        inputProps={{ 'aria-label': 'controlled' }}
                      />
                      {checked2.toString() === "true" && (
                        <input
                          ref={wfTitleRef}
                          className="form-control form-control-sm"
                          type="text"
                          placeholder='Type workflow title here'
                          required
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </span>
            <div className='row'>
              {signers.length > 0 && (
                <div className='text-center'>
                  <label className='m-3' style={{ fontSize: '14px' }}>Assignment Description :</label>
                  <div className='input-group'>
                    <textarea
                      ref={assignmentDescRef}
                      className='form-control form-control-sm'
                      name="ad"
                      rows="3"
                      cols="50"
                    />
                  </div>
                  <div className='my-3 mb-3'>
                    <Button
                      variant="contained"
                      color="success"
                      className='m-2 p-2'
                      style={{ textTransform: 'none', fontSize: '12px', position: 'relative', borderRadius: 30, background: '#43a047', color: '#fff', boxShadow: 'none', border: 'none' }}
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
                          <span className='mx-2'>Send to Signers</span>
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

export default AddSignersDialog;