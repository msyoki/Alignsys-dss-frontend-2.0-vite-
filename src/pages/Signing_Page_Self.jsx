import React, { useState, useContext, useEffect } from 'react';
import { FaCheckCircle, FaEnvelopeOpenText, FaEnvelope, FaComment } from 'react-icons/fa';
import AuthContext from '../context/Authcontext';
import { useNavigate, useLocation } from "react-router-dom";
import '../styles/App.css';
import Loading from '../components/loaders/Loading';
import axios from 'axios';
import ConfirmVoid from '../components/ConfirmVoid';
import OtpDialog from '../components/OtpDialog';
import { getComponent } from '@syncfusion/ej2-base';
import logo from '../images/ZFBLU.webp';
import Button from '@mui/material/Button';
import HelpBubble from '../components/HelpBubble';
import LoadingDialog from '../components/loaders/LoadingDialog';
import CommentsDialog from '../components/dialogs/CommentsDialog';
import * as constants from '../components/constants/constants';
import LoadingMini from '../components/loaders/LoadingMini2';
import AuthGuestDialog from '../components/AuthenticateGuest';
import PDFViewerSigningLoader from '../components/preview/PDFViewerSigningLoader';
import HumanizedDate from '../components/HumanizeDate';

function Signing_Page_Self() {
  const location = useLocation();
  const navigate = useNavigate();

  // Guard: Redirect if fileurl is missing
  if (!location.state || !location.state.fileurl) {
    console.error('Missing navigation state or fileurl:', location.state);
    return <div style={{ padding: 40, color: 'red', fontWeight: 600 }}>Error: Missing document information. Please access this page from the dashboard or document list.</div>;
  }
  const { authTokens, user } = useContext(AuthContext);

  // State
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [onepagebtncssclass, setOnePgebtnCssClass] = useState('e-custom-light');
  const [allpagebtncssclass, setAllPgebtnCssClass] = useState('e-custom-light');
  const [opendialogloading, setOpenDialogLoading] = useState(false);
  const [opendialogcomments, setOpenDialogComments] = useState(false);
  const [opendialogsignature, setOpenDialogSignature] = useState(false);
  const [signed, setSigned] = useState(false);
  const [voided, setVoided] = useState(false);
  const [ip, setIp] = useState('');
  const [savedsignature, setSaveSignature] = useState('');
  const [addsignature, setAddSignature] = useState(false);
  const [docguid, setDocGuid] = useState('');
  const [singlepage, setSinglepage] = useState(false);
  const [multipage, setMultipage] = useState(false);
  const [comments, setComments] = useState([]);
  const [signingpaddidabled, setSigningPadDisabled] = useState(true);
  const [newotp, setOTP] = useState('');
  const [otpphone, setOtpPhone] = useState('');
  const [maskedotpphone, setMaskedOtpPhone] = useState('');
  const [trialcount, setTrialCount] = useState(0);
  const [openalert, setOpenAlert] = useState(true);
  const [alertmsg, setAlertMsg] = useState('');
  const [alertseverity, setAlertSeverity] = useState('');
  const [signeruid, setSignerUid] = useState('');
  const [text, setText] = useState('');
  const [opendialogvoid, setOpenDialogVoid] = useState(false);
  const [opendialogotp, setOpenDialogOtp] = useState(false);
  const [tempUploadedsignature, setTempSignature] = useState('');
  const [docoassignmentdescription, setDocAssignmentDescription] = useState([]);
  const [signersavedsignatures, setSignerSavedSignatures] = useState([]);
  const [signersavedstamps, setSignerSavedStamps] = useState([]);
  const [signers, setSigners] = useState([]);
  const [doccreated, setDocCreated] = useState('');
  const [docname, setDocName] = useState('');
  const [companylogo, setCompanyLogo] = useState('');
  const [docowner, setDocOwner] = useState('');
  const [signaturewidth, setSignatureWidth] = useState('');
  const [signatureheight, setSignatureHeight] = useState('');
  const [uploadedsignaturewidth, setUploadedWidth] = useState('');
  const [uploadedsignatureheight, setUploadedHeight] = useState('');
  const [hasannotations, setHasAnnotations] = useState(false);
  const [pdfInstance, setPdfInstance] = useState(null);
  const [isstampuload, setIsStampUpload] = useState(false);
  const [annotationList, setAnnotationList] = useState([]);
  const [sampleURL, setSampleUrl] = useState('');
  const [fileLocked, setFileLocked] = useState(true);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [authenticateUser, setAuthenticateUser] = useState(true);
  const [placedSignature, setPlacedSignature] = useState('');
  const [opendialogauthguest, setOpenDialogAuthGuest] = useState(false);
  const [openconfirmcompletedialog, setOpenConfirmCompleteDialog] = useState(false);

  // Utility functions
  const newSignature = () => setTempSignature('');
  const handleComments = () => setOpenDialogComments(true);
  const handleClickOpenCompleteDialog = () => setOpenConfirmCompleteDialog(true);
  const handleClickOpenDialogVoid = () => setOpenDialogVoid(true);

  const signAllpages = () => {
    setMultipage(true);
    setSinglepage(false);
    setSigningPadDisabled(true);
    getSavedSignatures();
    getSavedStamps();
    setAddSignature(false);
    setAllPgebtnCssClass('e-custom-primary');
    setOnePgebtnCssClass('e-custom-light');
    let signature = getComponent(document.getElementById('signature'), 'signature');
    if (signature && !signature.disabled && !signature.isReadOnly) {
      signature.clear();
      setTempSignature('');
    }
    setOpenDialogSignature(true);
  };

  const signonePage = () => {
    setSinglepage(true);
    setMultipage(false);
    setSigningPadDisabled(true);
    getSavedSignatures();
    getSavedStamps();
    setAddSignature(false);
    setOnePgebtnCssClass('e-custom-primary');
    setAllPgebtnCssClass('e-custom-light');
    let signature = getComponent(document.getElementById('signature'), 'signature');
    if (signature && !signature.disabled && !signature.isReadOnly) {
      signature.clear();
      setTempSignature('');
    }
    setOpenDialogSignature(true);
  };

  const logostyle = {
    width: "45%",
    backgroundColor: 'white'
  };

  // API calls
  const getIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setIp(data.ip);
    } catch {
      setIp("hidden");
    }
  };

  function getCommentsAPI(documentguid) {
    axios.post(`${constants.devApiBaseUrl}/api/comments/`, { guid: `${documentguid}` })
      .then((response) => setComments(response.data))
      .catch(() => { });
  }

  const getSavedSignatures = () => {
    axios.post(`${constants.devApiBaseUrl}/api/savedsignatures/`, { email: user.email })
      .then((response) => setSignerSavedSignatures(response.data))
      .catch(() => { });
  };

  const getSavedStamps = () => {
    axios.post(`${constants.devApi2BaseUrl}/api/SaveStamp/Receive?Email=${user.email}`)
      .then((response) => setSignerSavedStamps(response.data))
      .catch(() => { });
  };

  const getCompanyLogo = (guid) => {
    axios.post(`${constants.devApiBaseUrl}/api/logo2/`, { docguid: guid })
      .then((response) => setCompanyLogo(response.data.logo))
      .catch(() => { });
  };

  const getSignerUid = () => {
    let g = location.state.fileurl;
    function removeExtension(filename) {
      const x = filename.substring(0, filename.lastIndexOf('.')) || filename;
      const y = x.split('_');
      return y[1];
    }
    let documentguid = removeExtension(g);
    setDocGuid(documentguid);
    getCompanyLogo(documentguid);
    axios.post(`${constants.devApiBaseUrl}/api/signer/selfsign/`, { docguid: documentguid }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens.access}`
      }
    })
      .then((response) => {
        setSignerUid(response.data.uid);
        setSigners(response.data.signers);
        setDocCreated(response.data.created);
        setDocOwner(response.data.owner);
        setDocName(response.data.docname);
        setDocAssignmentDescription(response.data.assignmentd);
        getCommentsAPI(documentguid);
      })
      .catch(() => { });
  };

  const addComment = (comment, signer) => {
    if (comment) {
      axios.post(`${constants.devApiBaseUrl}/api/new/comments/`, {
        signer: `${signer}`,
        comment: `${comment}`
      })
        .then(() => {
          getCommentsAPI(docguid);
          setText('');
          document.getElementById('textarea').value = '';
        })
        .catch(() => { });
    } else {
      alert('comment text is required');
    }
  };

  // File loading
  const getFileURL = async () => {
    try {
      console.log('Fetching file with fileurl:', location.state.fileurl);
      const response = await axios.get(`${constants.devApiBaseUrl}/api/base64/${location.state.fileurl}/`, {
        onDownloadProgress: progressEvent => {
          const percentage = (progressEvent.loaded / progressEvent.total) * 100;
          setLoadingPercentage(parseFloat(percentage.toFixed(2)));
        }
      });
      console.log('API response for file:', response);
      setSampleUrl(response.data.base64_uri);
    } catch (error) {
      console.error('Error fetching file:', error);
    }
  };

  useEffect(() => {
    getFileURL();
    setAvatar(location.state.avatar);
    getIP();
    getSignerUid();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <AuthGuestDialog
            setOpenDialogAuthGuest={setOpenDialogAuthGuest}
            opendialogauthguest={opendialogauthguest}
            signersEmail={user.email}
            setLocked={setFileLocked}
            locked={fileLocked}
            placedSignature={placedSignature}
            setOpenConfirmCompleteDialog={setOpenConfirmCompleteDialog}
            selfSign={true}
          />
          <ConfirmVoid
            setOpenDialogVoid={setOpenDialogVoid}
            setOpenDialogLoading={setOpenDialogLoading}
            opendialogvoid={opendialogvoid}
            docname={docname}
            signerguid={signeruid}
            fileurl={location.state.fileurl}
            user={user}
          />
          <OtpDialog
            alertseverity={alertseverity}
            alertmsg={alertmsg}
            openalert={openalert}
            maskedotpphone={maskedotpphone}
            otpphone={otpphone}
            newotp={newotp}
            setOtpPhone={setOtpPhone}
            setMaskedOtpPhone={setMaskedOtpPhone}
            trialcount={trialcount}
            setTrialCount={setTrialCount}
            setAlertMsg={setAlertMsg}
            setAlertSeverity={setAlertSeverity}
            setOpenAlert={setOpenAlert}
            setOTP={setOTP}
            setOpenDialogOtp={setOpenDialogOtp}
            opendialogotp={opendialogotp}
            user={user}
          />
          <CommentsDialog
            setText={setText}
            text={text}
            addComment={addComment}
            signerguid={signeruid}
            comments={comments}
            opendialogcomments={opendialogcomments}
            setOpenDialogComments={setOpenDialogComments}
          />
          <LoadingDialog opendialogloading={opendialogloading} />
          <HelpBubble content='' base64={sampleURL} filename={docname} />
          <div className="row bg-white" >
            {/* Main Document Viewer */}
            <div className="col-lg-9 col-md-12 col-sm-12 order-lg-1 order-sm-1 bg-white">
              <div>
                {sampleURL ? (
                  <PDFViewerSigningLoader
                    getSavedSignatures={getSavedSignatures}
                    document={sampleURL}
                    pdfInstance={pdfInstance}
                    setOpenDialogAuthGuest={setOpenDialogAuthGuest}
                    authenticateUser={authenticateUser}
                    setPlacedSignature={setPlacedSignature}
                    setFileLocked={setFileLocked}
                    setPdfInstance={setPdfInstance}
                    opendialogsignature={opendialogsignature}
                    user={user}
                    savedsignature={savedsignature}
                    setSaveSignature={setSaveSignature}
                    setSignerSavedStamps={setSignerSavedStamps}
                    setAddSignature={setAddSignature}
                    tempUploadedsignature={tempUploadedsignature}
                    setTempSignature={setTempSignature}
                    signersavedsignatures={signersavedsignatures}
                    signersavedstamps={signersavedstamps}
                    setAllPgebtnCssClass={setAllPgebtnCssClass}
                    setOnePgebtnCssClass={setOnePgebtnCssClass}
                    currentsignerEmail={user.email}
                    pagetype={'selfsign'}
                    isstampuload={isstampuload}
                    signingpaddidabled={signingpaddidabled}
                    setSigningPadDisabled={setSigningPadDisabled}
                    signerguid={signeruid}
                    setSignatureHeight={setSignatureHeight}
                    setSignatureWidth={setSignatureWidth}
                    uploadedsignatureheight={uploadedsignatureheight}
                    uploadedsignaturewidth={uploadedsignaturewidth}
                    setUploadedHeight={setUploadedHeight}
                    setUploadedWidth={setUploadedWidth}
                    setHasAnnotations={setHasAnnotations}
                    instance={pdfInstance}
                    hasannotations={hasannotations}
                    width={signaturewidth}
                    height={signatureheight}
                    allpagebtncssclass={allpagebtncssclass}
                    onepagebtncssclass={onepagebtncssclass}
                    newSignature={newSignature}
                    signonePage={signonePage}
                    signAllpages={signAllpages}
                    annotationList={annotationList}
                    setAnnotationList={setAnnotationList}
                    setSinglepage={setSinglepage}
                    setMultipage={setMultipage}
                    opendialogloading={opendialogloading}
                    setOpenDialogLoading={setOpenDialogLoading}
                    openconfirmcompletedialog={openconfirmcompletedialog}
                    setOpenConfirmCompleteDialog={setOpenConfirmCompleteDialog}
                    fileurl={location.state.fileurl}
                    ip={ip}
                    setOpenDialogSignature={setOpenDialogSignature}
                    docname={docname}
                    setOpenDialogVoid={setOpenDialogVoid}
                    guid={docguid}
                    multipage={multipage}
                  />
                ) : (
                  <div className="bg-white" style={{ height: "100vh" }}>
                    <LoadingMini filename={docname} percent={loadingPercentage} logo={logo} companylogo={companylogo} logostyle={logostyle} />
                  </div>
                )}
              </div>
            </div>
            {/* Sidebar (Right on Large Screens, Top on Small Screens) */}
            <div className="bg-white col-lg-3 col-md-12 col-sm-12 text-center shadow-lg order-lg-2 order-sm-2 d-flex flex-column" style={{ height: '100vh' }}>
              {/* Logo Section */}
              <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "60px", minHeight: "60px", overflow: "hidden" }}>
                <img
                  src={companylogo || logo}
                  alt="Organization logo"
                  className="logo"
                  style={{ maxWidth: "80%", maxHeight: "48px", objectFit: "contain" }}
                />
              </div>

              {/* Document Details Header */}
              <p className="text-white p-2" style={{ fontSize: "11px", backgroundColor: "#1C4690" }}>Document Details</p>

              {/* Document Information - This will grow to fill available space */}
              <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>
                <ul className="list-unstyled m-0 p-0 flex-grow-1" style={{ overflowY: 'auto' }}>
                  <li className="mb-2" style={{ fontSize: "12px", fontWeight: 450, color: "#1C4690" }}>Title</li>
                  <li className="mt-2 mb-2" style={{ fontSize: "12px", fontWeight: 440 }}>{docname}</li>
                  <li className="mt-2 mb-2" style={{ fontSize: "12px", color: "#1C4690" }}>
                    Owner: <span style={{ fontSize: "12px", color: "#595959" }}>{docowner}</span>
                  </li>
                  <li className="mt-2 mb-2" style={{ fontSize: "12px", color: "#1C4690" }}>
                    Created: <span style={{ fontSize: "12px", color: "#595959" }}>
                      <HumanizedDate dateStr={doccreated} />
                    </span>
                  </li>
                  {/* Signers List */}
                  <li className="mt-2 mb-2" style={{ fontSize: "12px", fontWeight: 440 }}>Signers ({signers.length}):</li>
                  {signers.length > 0 && (
                    <div className="border rounded p-2 bg-light" style={{ maxHeight: "20vh", overflowY: "auto", backgroundColor: '#ecf4fc' }}>
                      {signers.map((s, index) => (
                        <div
                          onContextMenu={e => {
                            e.preventDefault();
                            alert(`Right-clicked Email:${s.email}`);
                          }}
                          key={index}
                          className={`d-flex justify-content-between align-items-center ${signers.length > 1 && index !== signers.length - 1 ? "border-bottom" : ""}`}
                          style={{ fontSize: "12px" }}
                        >
                          <span>{s.email}</span>
                          <span className="text-muted">
                            {s.signed === "True" ? (
                              <>
                                Signed <FaCheckCircle className="text-success mx-1" />
                              </>
                            ) : (
                              <>
                                {s.current_signer === "True" ? "Signing" : "Queued"}
                                {s.current_signer === "True" ? (
                                  <FaEnvelopeOpenText className="text-danger mx-1" />
                                ) : (
                                  <FaEnvelope className="text-warning mx-1" />
                                )}
                              </>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ul>
              </div>

              {/* Comments Button and Footer - Always at bottom */}
              <div className='footer bottom-buttons mt-auto'>
                <div className="container">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleComments}
                    disabled={false}
                    startIcon={<FaComment size={13} />}
                    sx={{
                      textTransform: 'none',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: '999px',
                      px: 1.8,
                      py: 0.8,
                      minHeight: 34,
                      boxShadow: 'none',
                    
                    }}
                  >
                    Comments ({comments.length})
                  </Button>
                </div>
                <div className="mt-3 p-1 bg-white">
                  <a className="my-4" href="https://alignsys.tech" target="_blank" rel="noopener noreferrer">
                    <img src={logo} style={{ width: '40%' }} alt="Footer Logo" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Signing_Page_Self;