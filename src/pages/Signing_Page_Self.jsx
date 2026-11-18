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
import BrandLogo from '../components/common/BrandLogo';
import DocumentDetailsPanel from '../components/common/DocumentDetailsPanel';
import Button from '@mui/material/Button';
import HelpBubble from '../components/HelpBubble';
import '../styles/SigningLayout.css';
import LoadingDialog from '../components/loaders/LoadingDialog';
import CommentsDialog from '../components/dialogs/CommentsDialog';
import * as constants from '../components/constants/constants';
import { getDocumentBase64 } from '../api/documentFiles';
import LoadingMini from '../components/loaders/LoadingMini2';
import AuthGuestDialog from '../components/AuthenticateGuest';
import PDFViewerSigningLoader from '../components/preview/PDFViewerSigningLoader';
import HumanizedDate from '../components/HumanizeDate';
import { PILL } from '../components/common/pillButton';

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
      const uri = await getDocumentBase64(location.state.fileurl, {
        token: authTokens?.access,
        onDownloadProgress: progressEvent => {
          const percentage = (progressEvent.loaded / progressEvent.total) * 100;
          setLoadingPercentage(parseFloat(percentage.toFixed(2)));
        }
      });
      setSampleUrl(uri);
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
            signerguid={signeruid}
            otpphone={otpphone}
            alertseverity={alertseverity}
            alertmsg={alertmsg}
            openalert={openalert}
            setAlertMsg={setAlertMsg}
            setAlertSeverity={setAlertSeverity}
            setOpenAlert={setOpenAlert}
            setOpenDialogOtp={setOpenDialogOtp}
            opendialogotp={opendialogotp}
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
          <div className="row bg-white signing-layout">
            {/* Main Document Viewer */}
            <div className="col-lg-9 col-md-12 col-sm-12 order-lg-1 order-sm-1 bg-white signing-viewer-col">
              <div className="signing-viewer-stack">
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
            <div className="bg-white col-lg-3 col-md-12 col-sm-12 shadow-lg order-lg-2 order-sm-2 d-flex flex-column signing-details p-0">
              {/* Document details: same panel as the dashboard preview */}
              <DocumentDetailsPanel
                topLogo={(
                  <BrandLogo
                    src={companylogo}
                    fallback={logo}
                    alt="Organization logo"
                    className="logo"
                    style={{ width: "auto", maxWidth: "80%", maxHeight: "48px", objectFit: "contain" }}
                  />
                )}
                title={docname}
                owner={docowner}
                created={doccreated}
                signers={signers}
                commentsCount={comments.length}
                onComments={handleComments}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Signing_Page_Self;