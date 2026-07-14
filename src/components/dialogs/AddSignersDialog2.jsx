import React, { useRef, useContext, useState } from 'react';
import { FaUserCircle, FaMobileAlt, FaTimes, FaTrashAlt, FaArrowRight, FaUserPlus, FaPlusCircle, FaEnvelopeOpenText, FaUsers, FaNetworkWired, FaMailBulk } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AuthContext from '../../context/Authcontext.jsx';
import Alerts from '../Alert.jsx';
import SignersBoxDialog from './SignersBoxDialog.jsx';
import { jsonPhoneCodesData } from '../../data/country-phone-codes.jsx';
import * as constants from '../constants/constants.js';
import axios from 'axios';
import Box from '@mui/material/Box';
import ListSubheader from '@mui/material/ListSubheader';
import TimedAlert from '../TimedAlert.jsx';



const AddSignerForm = React.memo(({
  onSubmit,
  checked,
  setChecked,
  loadingAddSigner,
  emailInputRef,
  phoneNumberRef,
  phoneCodeRef,
}) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="rounded mb-2 mt-2">
        {/* <h5 className="mb-2" style={{ fontSize: 13, color: '#2757aa' }}>
          <FaUserPlus className="me-2" />Add new signer
        </h5> */}



        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap" style={{ fontSize: 13 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: '8px',
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
                maxWidth: '280px',
                minWidth: '220px',
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
              }}
            >
              Add Signer
            </Button>
          </div>
        </div>
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
          onChange={e => setChecked(e.target.checked)}
          inputProps={{ 'aria-label': 'Enable SMS OTP verification' }}
          className="ms-1"
          size="small"
        />

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
      </div>
    </form>
  );
});

const AddSignersDialog2 = (props) => {

  const navigate = useNavigate();
  // Refs
  const selectRef = useRef();
  const emailInputRef = useRef();
  const phoneNumberRef = useRef();
  const wfTitleRef = useRef();
  const assignmentDescRef = useRef();
  const phoneCodeRef = useRef();

  // Context
  const { user, authTokens, logoutUser } = useContext(AuthContext);

  // State
  const [workflow, setWorkflow] = useState('');
  const [selectedworkflowtitle, setSelectedWorkflowTitle] = useState('');
  const [signers, setSigners] = useState([]);
  const [checked, setChecked] = useState(false); // OTP
  const [checked2, setChecked2] = useState(false); // Save as workflow
  const [openalert, setOpenAlert] = useState(false);
  const [alertseverity, setAlertSeverity] = useState('');
  const [alertmsg, setAlertMsg] = useState('');
  const [open, setOpen] = useState(false);
  const [signatureBoxes, setSignatureBoxes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [loadingAddSigner, setLoadingAddSigner] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingDeleteWorkflow, setLoadingDeleteWorkflow] = useState(false);

  // Styles
  const textcolor = { color: '#2757aa' };

  // Handlers
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

  const validateEmail = (email) => {
    const res = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return res.test(email);
  };

  const deleteWorkflow = async (workflowId) => {
    setLoadingDeleteWorkflow(true);
    try {
      await axios.delete(`${constants.devApiBaseUrl}/api/workflows/${workflowId}/`, {
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
    setWorkflow(e.target.value);
    const [type, id] = e.target.value.split('-');
    let selectedWorkflow;
    if (type === 'personal') {
      selectedWorkflow = props.workflows.find((wf) => wf.id === +id);
    } else if (type === 'org') {
      selectedWorkflow = props.organizationWorkflows.find((wf) => wf.id === +id);
    }
    if (selectedWorkflow) {
      // Check if any signer email matches user.email
      if (selectedWorkflow.signers.some(signer => signer.email.toLowerCase() === user.email.toLowerCase())) {
        setOpenAlert(true);
        setAlertMsg("You cannot add yourself as a signer since you have already signed.");
        setAlertSeverity("error");
        setTimeout(() => setOpenAlert(false), 3000);
        setWorkflow('');
        setSelectedWorkflowTitle('');
        setSigners([]);
        return;
      }
      setSelectedWorkflowTitle(selectedWorkflow.title);
      setSigners([...selectedWorkflow.signers]);
    }
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

  const addMailList = async (e) => {
    e.preventDefault();
    setLoadingAddSigner(true);
    selectRef.current.value = '';
    setWorkflow('');
    setSelectedWorkflowTitle('');
    const email = emailInputRef.current.value;
    if (checked && (!phoneNumberRef.current.value || !phoneCodeRef.current.value)) {
      setOpenAlert(true);
      setAlertMsg('Phone number is required for OTP');
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
      setAlertMsg(`Email ${email} is invalid, enter a valid email address`);
      setAlertSeverity('error');
      setTimeout(() => setOpenAlert(false), 3000);
      setLoadingAddSigner(false);
      return;
    }
    // Check if trying to add self as signer
    if (email.toLowerCase() === user.email.toLowerCase()) {
      setOpenAlert(true);
      setAlertMsg("You cannot add yourself as a signer since you have already signed.");
      setAlertSeverity("error");
      setTimeout(() => setOpenAlert(false), 3000);
      setLoadingAddSigner(false);
      return;
    }
    const otp = checked;
    const phoneNumber = otp ? phoneNumberRef.current.value : '';
    const phoneCode = otp ? phoneCodeRef.current.value : '';
    let signer = {
      email,
      ...(otp ? { phone: `${phoneCode}${phoneNumber}` } : {})
    };
    if (!signers.some(item => item.email === email)) {
      setSigners(prev => [...prev, signer]);
      emailInputRef.current.value = '';
      if (checked) phoneNumberRef.current.value = '';
      setChecked(false);
    } else {
      setOpenAlert(true);
      setAlertMsg('Email already exists, enter another signer or send to signers');
      setAlertSeverity('error');
      setTimeout(() => setOpenAlert(false), 3000);
    }
    setLoadingAddSigner(false);
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

  const sendForSigning = async (e) => {
    setLoadingSend(true);
    const assignmentDescription = assignmentDescRef.current.value;
    const filename = props.file;

    // Prevent sending to self
    if (signers.some(s => s.email.toLowerCase() === user.email.toLowerCase())) {
      setOpenAlert(true);
      setAlertMsg("You should not include yourself as a signer since you have already signed.");
      setAlertSeverity("error");
      setTimeout(() => setOpenAlert(false), 3000);
      setLoadingSend(false);
      return;
    }

    if (checked2 && !wfTitleRef.current.value) {
      setOpenAlert(true);
      setAlertMsg("New workflow title is required!");
      setAlertSeverity("error");
      setTimeout(() => setOpenAlert(false), 3000);
      setLoadingSend(false);
      return;
    }
    if (!signers.length) {
      setOpenAlert(true);
      setAlertMsg("At least one signer is required!");
      setAlertSeverity("error");
      setTimeout(() => setOpenAlert(false), 3000);
      setLoadingSend(false);
      return;
    }
    if (checked2) await saveWorkflow();
    const mydata = JSON.stringify({
      documentid: filename,
      signers,
      ...(assignmentDescription ? { assignmentd: assignmentDescription } : { annotations: signatureBoxes || null }),
    });

    console.log(mydata);
    try {
      const response = await axios.post(`${constants.devApiBaseUrl}/api/othersigners/`, mydata, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.access}`
        }
      });
      props.setLoading(false);
      if (response.status === 200) {
        props.setOpenDialogAddSigners(false);
        setOpenAlert(true);
        setAlertMsg('Successfully sent to signers!');
        setAlertSeverity('success');
        setTimeout(() => {
          setOpenAlert(false);
          navigate('/');
        }, 2000); // Redirect home after 2 seconds
      } else if (response.statusText === 'Unauthorized') {
        logoutUser();
      }
    } catch (error) {
      props.setLoading(false);
      setOpenAlert(true);
      setAlertMsg('Error sending document. Please try again.');
      setAlertSeverity('error');
      setTimeout(() => setOpenAlert(false), 3000);
    }
    setLoadingSend(false);
  };

  const SignersList = ({ signers, removeSigner }) => (
    <div className="d-flex flex-wrap align-items-center mt-2 mb-2" style={{ maxHeight: '30vh' }}>
      {signers.map((item, index) => (
        <React.Fragment key={item.email}>
          <div
            className="d-flex align-items-center shadow-sm px-3 py-2 me-2 mb-2"
            style={{
              borderRadius: '25px',
              backgroundColor: 'white',
              fontSize: '13px',
              maxWidth: '100%',
              flexShrink: 0,
            }}
          >
            <FaUserCircle className="me-1" style={{ color: '#2757aa' }} />
            <span className="me-2 text-dark">{item.email}</span>
            {item.phone && (
              <Tooltip title="OTP authentication enabled" placement="top">
                <FaMobileAlt className="text-primary me-2" />
              </Tooltip>
            )}
            <FaTimes
              className="text-danger"
              style={{ cursor: 'pointer' }}
              onClick={e => removeSigner(e, item.email)}
            />
          </div>
          {index < signers.length - 1 && (
            <FaArrowRight
              className="me-2 text-nowrap"
              style={{ color: '#2757aa', fontSize: '16px' }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );



  return (
    <>
      <SignersBoxDialog
        selectedAnnotationId={selectedAnnotationId}
        setSelectedAnnotationId={setSelectedAnnotationId}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        file={props.file}
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
        open={props.opendialogaddsigners}

        aria-describedby="alert-dialog-slide-description"
        fullWidth
        maxWidth="md"
      >
        <div className='row m-0' style={{ width: '100%' }}>
          <div
            className="col-md-12 col-lg-5"
            style={{
              backgroundColor: "#fff",
              color: "#000",
              padding: "12px 14px",
            }}
          >
            {/* Step 1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  fontSize: "14px",
                  color: "#2757aa",
                  fontWeight: 500,
                  marginBottom: "2px",
                  marginTop: "5px"
                }}
              >
                1. Add signer(s)' emails below in the order you would like them to sign
              </div>

              <AddSignerForm
                onSubmit={addMailList}
                checked={checked}
                setChecked={setChecked}
                emailInputRef={emailInputRef}
                phoneNumberRef={phoneNumberRef}
                phoneCodeRef={phoneCodeRef}
                loadingAddSigner={loadingAddSigner}
              />
            </div>

            {/* OR divider */}
            <div
              style={{
                textAlign: "center",
                margin: "6px 0",
                fontSize: "13.5px",
                color: "#2757aa",
                fontWeight: 500,
              }}
            >
              OR
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  fontSize: "14px",
                  color: "#2757aa",
                  fontWeight: 500,
                  marginBottom: "2px",
                }}
              >
                2. Select an existing workflow below
              </div>

              <FormControl
                variant="filled"
                size="small"
                style={{
                  width: "100%",
                  marginTop: "4px",
                  marginBottom: "4px",
                }}
              >
                <InputLabel
                  id="merged-select-label"
                  style={{ fontSize: "14px", color: "black" }}
                >
                  Select Workflow
                </InputLabel>

                <Select
                  ref={selectRef}
                  labelId="merged-select-label"
                  id="merged-select"
                  value={workflow}
                  onChange={AddWorkflow}
                  name="wf"
                  size="small"
                  style={{ backgroundColor: "white" }}
                  inputProps={{ style: { backgroundColor: "white" } }}
                >
                  <ListSubheader
                    disabled
                    style={{
                      fontSize: "13px",
                      backgroundColor: "#f0f0f0",
                      color: "#2757aa",
                    }}
                  >
                    Personal Workflows ({props.workflows.length})
                  </ListSubheader>

                  {props.workflows.map((wf) => (
                    <MenuItem
                      key={`personal-${wf.id}`}
                      value={`personal-${wf.id}`}
                      style={{ fontSize: "12.5px" }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        width="100%"
                      >
                        <span>{wf.title}</span>

                        <Tooltip title="Delete workflow">
                          <span>
                            <FaTrashAlt
                              className="text-danger"
                              style={{
                                cursor: loadingDeleteWorkflow
                                  ? "not-allowed"
                                  : "pointer",
                                marginLeft: "8px",
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
                                style={{ marginLeft: 4, verticalAlign: "middle" }}
                              />
                            )}
                          </span>
                        </Tooltip>
                      </Box>
                    </MenuItem>
                  ))}

                  <ListSubheader
                    disabled
                    style={{
                      fontSize: "13px",
                      backgroundColor: "#f0f0f0",
                      color: "#2757aa",
                    }}
                  >
                    Organization Workflows ({props.organizationWorkflows.length})
                  </ListSubheader>

                  {props.organizationWorkflows.map((wf) => (
                    <MenuItem
                      key={`org-${wf.id}`}
                      value={`org-${wf.id}`}
                      style={{ fontSize: "12.5px" }}
                    >
                      {wf.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {/* Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "10px",
              }}
            >
              <Button
                variant="contained"
                onClick={handleClose2}
                disabled={false}
                style={{
                  textTransform: "none",
                  fontSize: "14px",
                  width: "50%",
                  background: "#ffda75",
                  color: "#30343f",
                  borderRadius: "30px",
                  boxShadow: "none",
                  padding: "8px 16px",
                }}
              >
                Cancel / Back home
              </Button>
            </div>
          </div>

          <div className='col-md-12 col-lg-7 text-center shadow-lg' id='maillist'>
            <span className="bg-white text-center" style={{ height: 'auto' }}>
              {signers.length < 1 ? (
                <div className="row d-flex justify-content-center mt-5">
                  <div className="col-md-6">
                    <h6 className='mt-2 mb-4' style={textcolor}>
                      <FaEnvelopeOpenText className="mx-1" /> No signers added
                    </h6>
                  </div>
                </div>
              ) : (
                <>
                  <br />
                  {workflow && (
                    <h6 className='mt-2 mb-4' style={textcolor}>
                      Selected Workflow - {selectedworkflowtitle}
                    </h6>
                  )}
                  {signers.length > 0 && (
                    <h6 className='my-2' style={textcolor}>
                      <FaUsers className="mx-1" /> Signers (<small>{signers.length}</small>)
                    </h6>
                  )}
                  <Alerts
                    alertseverity={alertseverity}
                    alertmsg={alertmsg}
                    openalert={openalert}
                    setOpenAlert={setOpenAlert}
                  />
                  <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                    <SignersList signers={signers} removeSigner={removeSigner} />
                  </div>
                  {signers.length > 0 && (
                    <Button
                      variant="contained"
                      color="primary"
                      className="m-2 p-2"
                      style={{
                        textTransform: "none",
                        fontSize: "12px",
                        background: '#2757aa',
                        color: '#fff',
                        borderRadius: 30,
                        boxShadow: 'none',
                        outline: 'none',
                        margin: '8px 0',
                        padding: '8px 16px'
                      }}
                      onClick={() => setOpen(true)}
                      disabled={false}
                    >
                      <span className="mx-2">Preview / Mark Where to Sign</span>
                    </Button>
                  )}
                  {signers.length > 0 && !workflow && (
                    <div className='input-group mt-4' style={{ backgroundColor: "#e5e5e5" }}>
                      <label className='m-1 text-dark m-2' style={{ fontSize: '12.5px' }}>
                        <FaNetworkWired className="mx-1" style={{ color: "#2757aa" }} /> Save as workflow?
                      </label>
                      <Switch
                        checked={checked2}
                        onChange={e => setChecked2(e.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                      />
                      {checked2 && (
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
                      style={{
                        textTransform: 'none',
                        fontSize: '12px',
                        position: 'relative',
                        background: '#43a047',
                        color: '#fff',
                        borderRadius: 30,
                        boxShadow: 'none',
                        outline: 'none',
                        margin: '8px 0',
                        padding: '8px 16px'
                      }}
                      onClick={sendForSigning}
                      disabled={loadingSend}
                      startIcon={loadingSend ? <CircularProgress size={18} color="inherit" style={{ marginRight: 8 }} /> : <FaMailBulk className="mx-1" />}
                    >
                      {loadingSend ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          Sending for signing...
                        </span>
                      ) : (
                        <span className='mx-2'>Send to Signers</span>
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


export default AddSignersDialog2;