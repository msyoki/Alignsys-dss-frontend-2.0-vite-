import React, { useState, useEffect, useContext } from 'react';
import { FaCheckCircle, FaEnvelopeOpenText, FaEnvelope, FaComment } from 'react-icons/fa';
import '../styles/App.css';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import Authcontext from '../context/Authcontext';
import Loading from '../components/loaders/Loading';
import logo from '../images/ZFBLU.webp';
import ConfirmVoid from '../components/ConfirmVoid';
import { getComponent } from '@syncfusion/ej2-base';
import HelpBubble from '../components/HelpBubble';
import LoadingDialog from '../components/loaders/LoadingDialog';
import CommentsDialog from '../components/dialogs/CommentsDialog';
import * as constants from '../components/constants/constants';
import LoadingMini from '../components/loaders/LoadingMini2';
import AuthGuestDialog from '../components/AuthenticateGuest';
import HumanizedDate from '../components/HumanizeDate';
import PDFViewerSigningLoader from '../components/preview/PDFViewerSigningLoader';

import CommentIcon from '@mui/icons-material/Comment';
import Button from '@mui/material/Button';

function Signing_Page_Redirect() {
  const { user, authTokens } = useContext(Authcontext);
  const navigate = useNavigate();
  const { fileurl, signerguid } = useParams();

  // State
  const [onepagebtncssclass, setOnePgebtnCssClass] = useState('e-custom-light');
  const [allpagebtncssclass, setAllPgebtnCssClass] = useState('e-custom-light');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifysigner, setVerify] = useState(false);
  const [ip, setIp] = useState('');
  const [otpnumber, setOtpNumber] = useState('');
  const [signed, setSigned] = useState(false);
  const [voided, setVoided] = useState(false);
  const [singlepage, setSinglepage] = useState(false);
  const [multipage, setMultipage] = useState(false);
  const [savedsignature, setSaveSignature] = useState('');
  const [addsignature, setAddSignature] = useState(false);
  const [comments, setComments] = useState([]);
  const [signingpaddidabled, setSigningPadDisabled] = useState(true);
  const [opendialogsignature, setOpenDialogSignature] = useState(false);
  const [isstampuload, setIsStampUpload] = useState(false);
  const [tempUploadedsignature, setTempSignature] = useState('');
  const [authenticateUser, setAuthenticateUser] = useState(false);
  const [opendialogvoid, setOpenDialogVoid] = useState(false);
  const [opendialogotp, setOpenDialogOtp] = useState(false);
  const [opendialogcomments, setOpenDialogComments] = useState(false);
  const [newotp, setOTP] = useState('');
  const [otpphone, setOtpPhone] = useState('');
  const [maskedotpphone, setMaskedOtpPhone] = useState('');
  const [trialcount, setTrialCount] = useState(0);
  const [openalert, setOpenAlert] = useState(true);
  const [alertmsg, setAlertMsg] = useState('');
  const [alertseverity, setAlertSeverity] = useState('');
  const [signersavedsignatures, setSignerSavedSignatures] = useState([]);
  const [signersavedstamps, setSignerSavedStamps] = useState([]);
  const [docname, setDocName] = useState('');
  const [text, setText] = useState('');
  const [currentsignerEmail, setCurrentSignerEmail] = useState('');
  const [currentsignerphone, setCurrentSignerPhone] = useState('');
  const [docguid, setDocGuid] = useState('');
  const [selfsign, setSelfSign] = useState('');
  const [signers, setSigners] = useState([]);
  const [doccreated, setDocCreated] = useState('');
  const [docowner, setDocOwner] = useState('');
  const [docoassignmentdescription, setDocAssignmentDescription] = useState('');
  const [companylogo, setCompanyLogo] = useState('');
  const [opendialogloading, setOpenDialogLoading] = useState(false);
  const [openconfirmcompletedialog, setOpenConfirmCompleteDialog] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [signaturewidth, setSignatureWidth] = useState('');
  const [signatureheight, setSignatureHeight] = useState('');
  const [uploadedsignaturewidth, setUploadedWidth] = useState('');
  const [uploadedsignatureheight, setUploadedHeight] = useState('');
  const [hasannotations, setHasAnnotations] = useState(false);
  const [pdfInstance, setPdfInstance] = useState(null);
  const [annotationList, setAnnotationList] = useState([]);
  const [sampleURL, setSampleUrl] = useState('');
  const [opendialogauthguest, setOpenDialogAuthGuest] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [time, setTime] = useState(600);
  const [resetTimer, setResetTimer] = useState(false);
  const [placedSignature, setPlacedSignature] = useState('');
  const [signerAnnotations, setSignerAnnotations] = useState([]);
  const [fileLocked, setFileLocked] = useState(true);
  const [clickedSignatureBox, setClickedSignatureBox] = useState(false);

  const handleComments = () => {
    setOpenDialogComments(true);
  };

  // Timer logic
  function timerClock() {
    const timer = setInterval(() => {
      setTime(prevTime => {
        if (prevTime > 0 && !resetTimer) {
          return prevTime - 1;
        } else if (prevTime > 0 && resetTimer) {
          clearInterval(timer);
          return 600;
        } else {
          clearInterval(timer);
          return 0;
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }

  // Fetch file as base64
  const getFileURL = async () => {
    try {
      const response = await axios.get(`${constants.devApiBaseUrl}/api/base64/${fileurl}/`, {
        onDownloadProgress: progressEvent => {
          const percentage = (progressEvent.loaded / progressEvent.total) * 100;
          setLoadingPercentage(parseFloat(percentage.toFixed(2)));
        }
      });
      // Split Base64 string into chunks
      let base64Chunks = response.data.base64_uri.match(/.{1,10000}/g);
      let base64Data = base64Chunks ? base64Chunks.join('') : '';
      setSampleUrl(base64Data);
    } catch (error) {
      if (user) {
        navigate('/', { state: { openalert: true, alertmsg: `${docname} signing already complete`, alertseverity: 'success' } });
      } else {
        navigate('/404', { state: { doctitle: `${docname}`, msg: ` signing already complete` } });
      }
      console.error(error.response?.status || error.message);
    }
  };

  // Fetch signer info and document details
  const getSigner = async () => {
    try {
      const { data } = await axios.post(`${constants.devApiBaseUrl}/api/signer/`, { uid: signerguid });
      if (data.docsigningcomplete === 'True') {
        if (user) {
          navigate('/', { state: { openalert: true, alertmsg: `${data.docname} signing already complete`, alertseverity: 'success' } });
        } else {
          navigate('/blocked', { state: { doctitle: `${data.docname}`, msg: ` signing already complete` } });
        }
        return;
      }
      if (data.docvoided === 'True') {
        if (user) {
          navigate('/', { state: { openalert: true, alertmsg: `${data.docname} was voided`, alertseverity: 'success' } });
        } else {
          navigate('/blocked', { state: { doctitle: `${data.docname}`, msg: `Document already voided` } });
        }
        return;
      }
      if (data.phone != null) setOpenDialogOtp(true);
      if (data.authenticate_signer === "True") setAuthenticateUser(true);

      setLoading(false);
      setVerify(data.verify);
      setCurrentSignerEmail(data.email);
      setCurrentSignerPhone(data.phone);
      setDocName(data.docname);
      setDocGuid(data.guid);
      getComments(data.guid);
      setSelfSign(data.selfsign);
      setSigners(data.signers);
      setDocCreated(data.created);
      setDocOwner(data.owner);
      setDocAssignmentDescription(data.assignmentd);
      getCompanyLogo(data.guid);
      getAnnotationsBySignerEmailAndDocument(data.email);

      // Get IP and log
      try {
        // Using ipify - reliable and CORS-friendly
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        setIp(ipResponse.data.ip);
        log(data.docname, data.guid, ipResponse.data.ip, data.email);
      } catch {
        setIp("hidden");
        log(data.docname, data.guid, "hidden", data.email);
      }

      if (data.verify === 'True') setOtpNumber(data.phone);
    } catch (error) {
      // console.log(error);
    }
  };

  // Fetch company logo
  const getCompanyLogo = async (guid) => {
    try {
      const { data } = await axios.post(`${constants.devApiBaseUrl}/api/logo2/`, { docguid: guid });
      setCompanyLogo(data.logo);
    } catch { }
  };

  // Fetch avatar
  const getAvatar = () => {
    axios.get(`${constants.devApiBaseUrl}/api/avatar/`, {
      headers: { 'Authorization': `Bearer ${authTokens.access} ` }
    })
      .then(response => {
        let url = `${constants.devApiBaseUrl}${response.data['avatar_url']}`;
        setAvatar(url);
      })
      .catch(() => { });
  };

  // Fetch comments
  function getComments(documentguid) {
    axios.post(`${constants.devApiBaseUrl}/api/comments/`, { guid: `${documentguid}` })
      .then((response) => setComments(response.data))
      .catch(() => { });
  }

  // Fetch saved signatures
  const getSavedSignatures = () => {
    axios
      .post(`${constants.devApiBaseUrl}/api/savedsignatures/`, {
        email: currentsignerEmail,
      })
      .then((response) => {
        setSignerSavedSignatures(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.error("Error fetching saved signatures:", error);
      });
  };

  // Fetch saved stamps
  const getSavedStamps = () => {
    axios.post(`${constants.devApi2BaseUrl}/api/SaveStamp/Receive?Email=${currentsignerEmail}`)
      .then((response) => setSignerSavedStamps(response.data))
      .catch(() => { });
  };

  // Fetch annotations by signer email and document
  const getAnnotationsBySignerEmailAndDocument = async (email) => {
    try {
      const documentId = fileurl?.split("_")?.[1]?.split(".")?.[0];

      if (!documentId || !email) return;

      const { data } = await axios.post(
        `${constants.devApiBaseUrl}/api/annotations-by-email-and-document/`,
        {
          email,
          documentId,
        }
      );
      console.log("Fetched signer annotations:", data);

      setSignerAnnotations(data);
    } catch (error) {
      console.error("Failed to fetch signer annotations:", error);
    }
  };

  // Add comment
  const addComment = (comment, signer) => {
    if (comment) {
      axios.post(`${constants.devApiBaseUrl}/api/new/comments/`, {
        signer: `${signer}`,
        comment: `${comment}`
      })
        .then(() => {
          getComments(docguid);
          setText('');
          document.getElementById('textarea').value = '';
        })
        .catch(() => { });
    } else {
      setOpenAlert(true);
      setAlertMsg('comment text is required');
      setAlertSeverity('success');
      setTimeout(() => setOpenAlert(false), 3000);
    }
  };

  // Logging
  async function log(doc_name, guid, ip, email) {
    axios.post(`${constants.devApiBaseUrl}/api/new/log/`, {
      activity: "preview",
      description: `previewed ${doc_name}`,
      guid: `${guid}`,
      ip: ip,
      user: email
    }).catch(() => { });
  }

  // OTP
  async function sendOTP(phone) {
    axios.post(`${constants.devApiBaseUrl}/api/sms/otp/`, { phone })
      .then(() => {
        timerClock();
        setTrialCount(trialcount + 1);
        setOpenAlert(true);
        setAlertMsg('Otp was sent successfully!!');
        setAlertSeverity('success');
        setTimeout(() => setOpenAlert(false), 3000);
      })
      .catch(() => { });
  }

  // Signature box logic
  const SignSignatureBoxes = () => {
    // 1. Collect the unique pages that have annotations
    const pagesWithAnnotations = new Set(
      signerAnnotations.map((annotation) => annotation.page_number)
    );

    // 2. Decide if signatures are across multiple pages or just one
    if (pagesWithAnnotations.size > 1) {

      setSinglepage(false);  // only one page → single-page mode OFF
      setMultipage(true);    // multi-page mode ON
    } else {
      setSinglepage(true);   // multiple pages → single-page mode ON
      setMultipage(false);   // multi-page mode OFF
    }

    // 3. Load previously saved signatures and stamps
    getSavedSignatures();
    getSavedStamps();

    // 4. Reset signing pad & signature add mode
    setSigningPadDisabled(true);
    setAddSignature(false);

    // 5. Style buttons (probably toggle UI buttons for one-page vs all-page signing)
    setOnePgebtnCssClass('e-custom-primary');
    setAllPgebtnCssClass('e-custom-light');

    // 6. Reset the signature component if it’s available and editable
    let signature = getComponent(document.getElementById('signature'), 'signature');
    if (signature && !signature.disabled && !signature.isReadOnly) {
      signature.clear();      // clear the canvas
      setTempSignature('');   // clear any temp stored signature
    }

    // 7. Finally, open the signature dialog/modal
    setOpenDialogSignature(true);
  };


  // Check signing status
  const checkSigning = () => {
    setOpenDialogLoading(false);
    if (voided) {
      if (user) {
        navigate('/', { state: { openalert: true, alertmsg: ` ${docname} voided successfully`, alertseverity: 'success' } });
      } else {
        navigate('/declined', { state: { doctitle: docname } });
      }
    } else if (signed) {
      if (user) {
        navigate('/', { state: { openalert: true, alertmsg: ` ${docname} signed successfully`, alertseverity: 'success' } });
      } else {
        navigate('/complete', { state: { doctitle: docname } });
      }
    }
  };

  // Void document
  const voidDocument = () => {
    const pdfViewer = document.getElementById('previewer2').ej2_instances[0];
    pdfViewer.serverActionSettings.download = "SaveDocument2";
    pdfViewer.download();
    pdfViewer.serverActionSettings.download = "Download";
    setVoided(true);
  };

  // Sign all pages
  const signAllpages = () => {
    setMultipage(true);
    setSinglepage(false);
    getSavedSignatures();
    getSavedStamps();
    setSigningPadDisabled(true);
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

  // Sign one page
  const signonePage = () => {
    setSinglepage(true);
    setMultipage(false);
    getSavedSignatures();
    getSavedStamps();
    setSigningPadDisabled(true);
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

  // New signature
  const newSignature = () => setTempSignature('');

  // Effects
  useEffect(() => {
    getFileURL();
    getSigner();
    if (user) getAvatar();
    // eslint-disable-next-line
  }, []);

  // Logo style
  const logostyle = {
    width: '45%',
    backgroundColor: 'white'
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <AuthGuestDialog
            setOpenDialogAuthGuest={setOpenDialogAuthGuest}
            opendialogauthguest={opendialogauthguest}
            signersEmail={currentsignerEmail}
            setLocked={setFileLocked}
            locked={fileLocked}
            placedSignature={placedSignature}
            selfSign={false}
          />
          <ConfirmVoid
            voidDocument={voidDocument}
            setOpenDialogVoid={setOpenDialogVoid}
            setOpenDialogLoading={setOpenDialogLoading}
            opendialogvoid={opendialogvoid}
            docname={docname}
            signerguid={signerguid}
            fileurl={fileurl}
            user={user}
            ip={ip}
          />
          <CommentsDialog
            docoassignmentdescription={docoassignmentdescription}
            setText={setText}
            text={text}
            addComment={addComment}
            signerguid={signerguid}
            comments={comments}
            opendialogcomments={opendialogcomments}
            setOpenDialogComments={setOpenDialogComments}
          />
          <LoadingDialog opendialogloading={opendialogloading} />
          <HelpBubble content='' base64={sampleURL} filename={docname} />
          <div className="row bg-white" style={{ maxHeight: '100vh', height: '100vh' }}>
            <div className="col-lg-9 col-md-12 col-sm-12 order-lg-1 order-sm-1 bg-white">
              {sampleURL ? (
                <PDFViewerSigningLoader
                  getSavedSignatures={getSavedSignatures}
                  getSavedStamps={getSavedStamps}
                  document={sampleURL}
                  setOpenDialogAuthGuest={setOpenDialogAuthGuest}
                  authenticateUser={authenticateUser}
                  setFileLocked={setFileLocked}
                  setPlacedSignature={setPlacedSignature}
                  currentsignerphone={currentsignerphone}
                  time={time}
                  setResetTimer={setResetTimer}
                  setTime={setTime}
                  timerClock={timerClock}
                  pdfInstance={pdfInstance}
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
                  currentsignerEmail={currentsignerEmail}
                  pagetype="redirectsign"
                  isstampuload={isstampuload}
                  signingpaddidabled={signingpaddidabled}
                  setSigningPadDisabled={setSigningPadDisabled}
                  signerguid={signerguid}
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
                  setAllPgebtnCssClass={setAllPgebtnCssClass}
                  setOnePgebtnCssClass={setOnePgebtnCssClass}
                  opendialogloading={opendialogloading}
                  setOpenDialogLoading={setOpenDialogLoading}
                  openconfirmcompletedialog={openconfirmcompletedialog}
                  setOpenConfirmCompleteDialog={setOpenConfirmCompleteDialog}
                  fileurl={fileurl}
                  ip={ip}
                  checkSigning={checkSigning}
                  setOpenDialogSignature={setOpenDialogSignature}
                  docname={docname}
                  setOpenDialogVoid={setOpenDialogVoid}
                  guid={docguid}
                  multipage={multipage}
                  sampleURL={sampleURL}
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
                  signerAnnotations={signerAnnotations}
                  clickedSignatureBox={clickedSignatureBox}
                  setClickedSignatureBox={setClickedSignatureBox}
                  SignSignatureBoxes={SignSignatureBoxes}
                />
              ) : (
                <div className="bg-white" style={{ height: '100vh' }}>
                  <LoadingMini
                    filename={docname}
                    percent={loadingPercentage}
                    logo={logo}
                    companylogo={companylogo}
                    logostyle={logostyle}
                  />
                </div>
              )}
            </div>
            <div className="bg-white col-lg-3 col-md-12 col-sm-12 text-center shadow-lg order-lg-2 order-sm-2 d-flex flex-column" style={{ height: '100vh' }}>
              {/* Logo Section */}
              <div
                className="d-flex flex-column justify-content-center align-items-center"
                style={{
                  height: "60px",
                  minHeight: "61px",
                  maxHeight: "61px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={companylogo || logo}
                  alt="Organization logo"
                  className="logo"
                  style={{
                    width: "auto",
                    maxWidth: "80%",
                    maxHeight: "48px",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* Document Details Section - This will grow to fill available space */}
              <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>
                <p className="text-white p-2" style={{ fontSize: '11px', backgroundColor: '#1C4690' }}>Document Details</p>
                <ul className="list-unstyled m-0 p-0 flex-grow-1" style={{ overflowY: 'auto' }}>
                  <li className="mb-2" style={{ fontSize: "12px", fontWeight: 450, color: "#1C4690" }}>Title</li>
                  <li className="mt-2 mb-2" style={{ fontSize: "12px", fontWeight: 440 }}>{docname}</li>
                  <li className="mt-2 mb-2" style={{ fontSize: "12px", color: "#1C4690" }}>
                    Owner: <span style={{ fontSize: "12px", color: "#595959" }}>{docowner}</span>
                  </li>
                  {/* Signers List */}
                  <li className="mt-2 mb-2" style={{ fontSize: "12px", fontWeight: 440 }}>Signers ({signers.length}):</li>
                  {signers.length > 0 && (
                    <div className="border rounded p-2" style={{ maxHeight: "20vh", overflowY: "auto", backgroundColor: '#ecf4fc' }}>
                      {signers.map((s, index) => (
                        <div
                          key={index}
                          className={`d-flex justify-content-between align-items-center ${signers.length > 1 && index !== signers.length - 1 ? "border-bottom" : ""}`}
                          style={{ fontSize: "12px", padding: "5px 0" }}
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
                  <li className="mt-2 mb-2" style={{ fontSize: '12px', color: '#1C4690' }}>
                    Created: <span style={{ fontSize: '12px', color: '#595959' }}>
                      <HumanizedDate dateStr={doccreated} />
                    </span>
                  </li>
                  {docoassignmentdescription && (
                    <li className="m-3" style={{ fontSize: '12px', color: '#1C4690' }}>
                      Instructions: <br />
                      <span style={{ fontSize: '12px', color: '#595959', height: '10vh', overflowY: 'scroll' }}>{docoassignmentdescription}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Footer - Always at bottom */}
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

export default Signing_Page_Redirect;