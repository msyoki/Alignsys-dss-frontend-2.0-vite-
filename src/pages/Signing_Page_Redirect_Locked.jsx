import React, { useState, useEffect } from 'react'
import '../styles/App.css';
import { useParams } from "react-router-dom";

import axios from 'axios'
import { useNavigate } from "react-router-dom";
import Authcontext from '../context/Authcontext';
import Loading from '../components/Loading/Loading';
import logo from '../images/ZFBLU.webp'

import ConfirmVoid from '../components/ConfirmVoid';
import { getComponent } from '@syncfusion/ej2-base';
import Button from '@mui/material/Button';
import HelpBubble from '../components/HelpBubble';
import LoadingDialog from '../components/Loading/LoadingDialog';
import CommentsDialog from '../components/CommentsDialog';
import * as constants from '../components/constants/constants'
import LoadingMini from '../components/Loading/LoadingMini2';
import AuthGuestDialog from '../components/AuthenticateGuest';

import HumanizedDate from '../components/HumanizeDate';
import PDFViewerSigningLoader from '../components/PDFViewerSigningLoader';
import Button from '@mui/material/Button';
import CommentIcon from '@mui/icons-material/Comment';
import { FaCircle, FaComments } from 'react-icons/fa';

function Signing_Page_Redirect_Locked() {

  let { user, authTokens } = React.useContext(Authcontext)

  let navigate = useNavigate();
  let [onepagebtncssclass, setOnePgebtnCssClass] = useState('e-custom-light')
  let [allpagebtncssclass, setAllPgebtnCssClass] = useState('e-custom-light')
  let [avatar, setAvatar] = useState('')
  let { fileurl, signerguid } = useParams();
  let [loading, setLoading] = useState(false)
  let [verifysigner, setVerify] = useState(false)
  let [ip, setIp] = useState('')
  let [otpnumber, setOtpNumber] = useState('')
  let [signed, setSigned] = useState(false)
  let [voided, setVoided] = useState(false)
  let [singlepage, setSinglepage] = useState(false)
  let [multipage, setMultipage] = useState(false)
  let [savedsignature, setSaveSignature] = useState('')
  let [addsignature, setAddSignature] = useState(false)
  let [comments, setComments] = useState([])
  let [signingpaddidabled, setSigningPadDisabled] = useState(true)

  let [opendialogsignature, setOpenDialogSignature] = useState(false)
  let [isstampuload, setIsStampUpload] = useState(false)
  let [tempUploadedsignature, setTempSignature] = useState('')
  let [authenticateUser, setAuthenticateUser] = useState(false)

  const [opendialogvoid, setOpenDialogVoid] = React.useState(false);
  const [opendialogotp, setOpenDialogOtp] = React.useState(false);
  let [opendialogcomments, setOpenDialogComments] = useState(false)
  let [newotp, setOTP] = useState('');
  let [otpphone, setOtpPhone] = useState('');
  let [maskedotpphone, setMaskedOtpPhone] = useState('');
  let [trialcount, setTrialCount] = useState(0);
  const [openalert, setOpenAlert] = React.useState(true);
  const [alertmsg, setAlertMsg] = React.useState('');
  const [alertseverity, setAlertSeverity] = React.useState('');
  let [signersavedsignatures, setSignerSavedSignatures] = React.useState([]);
  let [signersavedstamps, setSignerSavedStamps] = React.useState([]);
  let [docname, setDocName] = useState('')
  const [text, setText] = useState('');
  let [currentsignerEmail, setCurrentSignerEmail] = React.useState('');
  let [currentsignerphone, setCurrentSignerPhone] = React.useState('');
  const [docguid, setDocGuid] = useState('')
  const [selfsign, setSelfSign] = useState('')
  let [signers, setSigners] = useState([])
  let [doccreated, setDocCreated] = useState('')
  let [docowner, setDocOwner] = useState('')
  let [docoassignmentdescription, setDocAssignmentDescription] = useState('')
  let [companylogo, setCompanyLogo] = useState('')
  let [opendialogloading, setOpenDialogLoading] = useState(false)
  const [openconfirmcompletedialog, setOpenConfirmCompleteDialog] = React.useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  let [signaturewidth, setSignatureWidth] = useState('');
  let [signatureheight, setSignatureHeight] = useState('');
  let [uploadedsignaturewidth, setUploadedWidth] = useState('');
  let [uploadedsignatureheight, setUploadedHeight] = useState('');
  let [hasannotations, setHasAnnotations] = useState(false)
  let [pdfInstance, setPdfInstance] = useState(null);
  let [annotationList, setAnnotationList] = useState([]);
  let [sampleURL, setSampleUrl] = useState('')
  let [opendialogauthguest, setOpenDialogAuthGuest] = useState(false)

  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [time, setTime] = useState(600); // 600 seconds = 10 minutes
  const [resetTimer, setResetTimer] = useState(false); // 600 seconds = 10 minutes
  const [placedSignature, setPlacedSignature] = useState("")

  let [fileLocked, setFileLocked] = useState(true);

  function timerClock() {
    const timer = setInterval(() => {
      setTime(prevTime => {
        if (prevTime > 0 && !resetTimer) {
          return prevTime - 1;
        } else if (prevTime > 0 && resetTimer) {
          clearInterval(timer); // Clear interval when time reaches 0
          return 600; // Ensure time does not go below 0
        } else {
          clearInterval(timer); // Clear interval when time reaches 0
          return 0; // Ensure time does not go below 0
        }

      });
    }, 1000);

    return () => clearInterval(timer);

  }

  async function sendOTP(phone) {
    let data = JSON.stringify({
      "phone": phone
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/sms/otp/`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    axios.request(config)
      .then((response) => {
        // //// console.log(JSON.stringify(response.data));
        timerClock()
        setTrialCount(trialcount + 1)
        setOpenAlert(true)
        setAlertMsg('Otp was sent successfully!!')
        setAlertSeverity('success')
        setTimeout(
          function () {
            setOpenAlert(false);
          }, 3000)
      })
      .catch((error) => {
        // // console.log(error);
      });

  }

  let newSignature = () => {
    setTempSignature('')
  }

  let getCompanyLogo = async (guid) => {

    let data = JSON.stringify({
      "docguid": guid
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/logo2/`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    await axios.request(config)
      .then((response) => {
        // // console.log(JSON.stringify(response.data.logo));
        setCompanyLogo(response.data.logo)

      })
      .catch((error) => {
        // // console.log(error);
      });



  }

  let handleComments = () => {
    setOpenDialogComments(true)
  }

  let getFileURL = async () => {
    try {
      const response = await axios.get(`${constants.devApiBaseUrl}/api/base64/${fileurl}/`, {
        onDownloadProgress: progressEvent => {
          const percentage = (progressEvent.loaded / progressEvent.total) * 100;
          displayPercentageWaitingTime(percentage);
        }
      });

      // Split Base64 string into chunks
      let base64Chunks = response.data.base64_uri.match(/.{1,10000}/g);  // Assuming 10,000 characters per chunk

      // Fetch the chunks and concatenate them
      let base64Data = '';
      for (let chunk of base64Chunks) {
        base64Data += chunk;  // Simulate downloading in chunks
      }

      // Set the final Base64 string in the state
      setSampleUrl(base64Data);

    } catch (error) {
      // Error handling
      if (user) {
        navigate('/', { state: { openalert: true, alertmsg: `${docname} signing already complete`, alertseverity: 'success' } });
      } else {
        navigate('/404', { state: { doctitle: `${docname}`, msg: ` signing already complete` } });
      }
      console.error(error.response?.status || error.message);
    }
  };



  // Function to display percentage waiting time
  function displayPercentageWaitingTime(percentage) {
    // You can update your UI or // console.log the percentage
    let perce = parseFloat(percentage.toFixed(2));
    setLoadingPercentage(perce);

  }

  async function log(doc_name, guid, ip, email) {
    let data = JSON.stringify({
      "activity": "preview",
      "description": `previewed ${doc_name}`,
      "guid": `${guid}`,
      "ip": ip,
      "user": email
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/new/log/`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    axios.request(config)
      .then((response3) => {
        // // console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        // // console.log(error);
      });
  }


  let getSigner = async () => {
    var data = JSON.stringify({
      "uid": signerguid
    });

    var config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/signer/`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };



    axios(config)
      .then(function (response1) {
        if (response1.data.docsigningcomplete === 'True') {
          if (user) {
            navigate('/', { state: { openalert: true, alertmsg: `${response1.data.docname} signing already complete`, alertseverity: 'success' } })
          }
          else {

            navigate('/blocked', { state: { doctitle: `${response1.data.docname}`, msg: ` signing already complete` } })
          }

        }

        if (response1.data.docvoided === 'True') {
          if (user) {

            navigate('/', { state: { openalert: true, alertmsg: `${response1.data.docname} was voided`, alertseverity: 'success' } })
          }
          else {
            navigate('/blocked', { state: { doctitle: `${response1.data.docname}`, msg: `Document already voided` } })
          }

        }

        if (response1.data.phone != null) {

          sendOTP(response1.data.phone)
          setOpenDialogOtp(true)

        }

        if (response1.data.authenticate_signer === "True") {
          setAuthenticateUser(true)

        }
        setLoading(false)
        setVerify(response1.data.verify)
        setCurrentSignerEmail(response1.data.email)
        setCurrentSignerPhone(response1.data.phone)
        setDocName(response1.data.docname)
        setDocGuid(response1.data.guid)
        getComments(response1.data.guid)
        setSelfSign(response1.data.selfsign)
        setSigners(response1.data.signers)
        setDocCreated(response1.data.created)
        setDocOwner(response1.data.owner)
        setDocAssignmentDescription(response1.data.assignmentd)
        getCompanyLogo(response1.data.guid)

        async function getIP() {
          try {
            // Attempt to get the user's IP address
            const ipResponse = await axios.get('https://ipapi.co/json', { maxBodyLength: Infinity });
            // If the IP address fetch is successful, update the userip
            setIp(ipResponse.data.ip)
            log(response1.data.docname, response1.data.guid, ipResponse.data.ip, response1.data.email)
          } catch (error) {
            // If the IP address fetch fails, userip remains "hidden"
            // console.error('Error fetching IP address:', error.message);
            setIp("hidden")
            log(response1.data.docname, response1.data.guid, "hidden", response1.data.email)
          }

        }
        getIP()

        if (response1.data.verify === 'True') {
          setOtpNumber(response1.data.phone)
        }

      })
      .catch(function (error) {
        // console.log(error);
      })
  }

  function getComments(documentguid) {
    let data = JSON.stringify({
      "guid": `${documentguid}`
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/comments/`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    axios.request(config)
      .then((response) => {
        // // console.log(JSON.stringify(response.data));
        setComments(response.data)
      })
      .catch((error) => {
        // // console.log(error);
      });




  }


  let checkSigning = () => {
    setOpenDialogLoading(false)
    if (voided) {
      if (user) {
        navigate('/', { state: { openalert: true, alertmsg: ` ${docname} voided successfully`, alertseverity: 'success' } })
      }
      else {
        navigate('/declined', { state: { doctitle: docname } })
      }
    }
    else if (signed) {
      if (user) {
        navigate('/', { state: { openalert: true, alertmsg: ` ${docname} signed successfully`, alertseverity: 'success' } })
      }
      else {
        navigate('/complete', { state: { doctitle: docname } })
      }

    }



  }

  let voidDocument = (e) => {
    var pdfViewer = document.getElementById('previewer2').ej2_instances[0];
    pdfViewer.serverActionSettings.download = "SaveDocument2";
    pdfViewer.download();
    pdfViewer.serverActionSettings.download = "Download";
    setVoided(true)

  }


  let signAllpages = (e) => {
    setMultipage(true)
    setSinglepage(false)
    getSavedSignatures()
    getSavedStamps()
    setSigningPadDisabled(true)
    // document.getElementById('signaturediv').style.display='block'

    setAddSignature(false)
    setAllPgebtnCssClass('e-custom-primary')
    setOnePgebtnCssClass('e-custom-light')
    let signature = getComponent(document.getElementById('signature'), 'signature');
    if (!signature.disabled && !signature.isReadOnly) {
      signature.clear();
      setTempSignature('')
    }


    // document.getElementById('placeDrawn').style.display='none'
    // document.getElementById('clear').style.display='none'
    // document.getElementById('save_my_sinature').style.display='none'

    setOpenDialogSignature(true)

  }


  let signonePage = (e) => {
    setSinglepage(true)
    setMultipage(false)
    getSavedSignatures()
    getSavedStamps()
    setSigningPadDisabled(true)
    // document.getElementById('signaturediv').style.display='block'
    setAddSignature(false)
    setOnePgebtnCssClass('e-custom-primary')
    setAllPgebtnCssClass('e-custom-light')
    let signature = getComponent(document.getElementById('signature'), 'signature');
    if (!signature.disabled && !signature.isReadOnly) {
      signature.clear();
      setTempSignature('')
    }


    // document.getElementById('placeDrawn').style.display='none'
    // document.getElementById('clear').style.display='none' 
    // document.getElementById('save_my_sinature').style.display='none'
    setOpenDialogSignature(true)
  }

  let completeSigning = (e) => {
    setSigned(true)
    var pdfViewer = document.getElementById('previewer2').ej2_instances[0];
    if (singlepage) {
      pdfViewer.serverActionSettings.download = "SaveDocument";
      pdfViewer.download();
      pdfViewer.serverActionSettings.download = "Download";

    }
    else if (multipage) {
      pdfViewer.serverActionSettings.download = "SaveDocument1";
      pdfViewer.download();
      pdfViewer.serverActionSettings.download = "Download";
    }


  }

  const logostyle = {
    width: '45%',
    backgroundColor: 'white'
  }



  let getSavedSignatures = () => {
    let data = JSON.stringify({
      "email": currentsignerEmail
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/savedsignatures/`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    axios.request(config)
      .then((response) => {
        setSignerSavedSignatures(response.data)
      })
      .catch((error) => {
        // // console.log(error);
      });

  }
  let getSavedStamps = () => {
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApi2BaseUrl}/api/SaveStamp/Receive?Email=${currentsignerEmail}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    axios.request(config)
      .then((response) => {
        setSignerSavedStamps(response.data)
        // console.log(response.data)
      })
      .catch((error) => {
        // // console.log(error);
      });

  }

  let getAvatar = () => {
    var config = {
      method: 'get',
      url: `${constants.devApiBaseUrl}/api/avatar/`,
      headers: { 'Authorization': `Bearer ${authTokens.access} ` }
    };

    axios(config)
      .then(function (response) {
        // setAvatar(response.data)
        let url = `${constants.devApiBaseUrl}${response.data['avatar_url']}`
        setAvatar(url)
        // // console.log(url);
      })
      .catch(function (error) {
        // // console.log(error);
      });

  }

  let addComment = (comment, signer) => {
    if (comment) {
      // alert(signer)
      let data = JSON.stringify({
        "signer": `${signer}`,
        "comment": `${comment}`
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${constants.devApiBaseUrl}/api/new/comments/`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: data
      };

      axios.request(config)
        .then((response) => {
          // // console.log(JSON.stringify(response.data));
          getComments(docguid)
          setText('')
          document.getElementById('textarea').value = '';
        })
        .catch((error) => {
          // // console.log(error);
        });
    }
    else {
      setOpenAlert(true)
      setAlertMsg('comment text is required')
      setAlertSeverity('success')
      setTimeout(
        function () {
          setOpenAlert(false);
        }, 3000)
    }

  }


  useEffect(() => {
    getFileURL();
    getSigner();

    if (user) {
      getAvatar();
    }
  }, []);



  return (
    <>
      {loading ? (
        <>
          <Loading />
        </>
      ) : (
        <>

          <AuthGuestDialog

            setOpenDialogAuthGuest={setOpenDialogAuthGuest}
            opendialogauthguest={opendialogauthguest}
            signersEmail={currentsignerEmail}
            setLocked={setFileLocked}
            locked={fileLocked}
            placedSignature={placedSignature}

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

          <CommentsDialog docoassignmentdescription={docoassignmentdescription} setText={setText} text={text} addComment={addComment} signerguid={signerguid} comments={comments} opendialogcomments={opendialogcomments} setOpenDialogComments={setOpenDialogComments} />


          <></>

          <LoadingDialog opendialogloading={opendialogloading} />
          <HelpBubble
            content=''
            base64={sampleURL}
            filename={docname}
          />
          {/* <div className="row" style={{ height: '100vh', backgroundColor: '#ffff' }} id='redirectdiv' >
            <div className="col-lg-9 col-md-12 col-sm-12 card" style={{ borderRadius: '0', borderTop: 'none', boxShadow: '0', backgroundColor: '#ffff' }}>


              <div className=''>
                {sampleURL ?

                  <>
                    <PdfJsSigning
                      document={sampleURL}
                      setOpenDialogAuthGuest={setOpenDialogAuthGuest}
                      authenticateUser={authenticateUser}
                      setFileLocked={setFileLocked}
                      setPlacedSignature={setPlacedSignature}
                      // document={constants.base64ui}
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
                      pagetype={'redirectsign'}
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


                    />

                  </>

                  : <div className='bg-white' style={{ height: '100vh' }}>
                    <LoadingMini filename={docname} percent={loadingPercentage} logo={logo} companylogo={companylogo} logostyle={logostyle} />

                  </div>}

              </div>





            </div>
            <div className="col-lg-3 col-md-12 text-center card" style={{ overflow: 'clip', borderRadius: '0', borderTop: 'none', boxShadow: '0' }}>
              <div className="p-2 card-header bg-white">
                <a href="https://alignsys.tech" target="_blank" rel="noopener noreferrer">
                  {companylogo ? (
                    <img src={companylogo} style={logostyle} alt="Company Logo" />
                  ) : (
                    <img src={logo} style={logostyle} alt="Default Logo" />
                  )}
                </a>
              </div>

              <p className="text-white p-2" style={{ fontSize: '11px', backgroundColor: '#1C4690' }}>Document Details</p>

              <div className="container-fluid">
                <ul style={{ listStyle: 'none' }}>
                  <li className="mb-2" style={{ fontSize: '12px', fontWeight: 450, color: '#1C4690' }}>Title</li>
                  <li className="mt-2 mb-3" style={{ fontSize: '12px', fontWeight: 440 }}>{docname}</li>
                  <li className="mt-2 mb-2" style={{ fontSize: '12px', color: '#1C4690' }}>
                    Current Signer: <span style={{ fontSize: '12px', color: '#595959' }}>{currentsignerEmail}</span>
                  </li>
                  <li className="mt-2 mb-2" style={{ fontSize: '12px', color: '#1C4690' }}>
                    Owner: <span style={{ fontSize: '12px', color: '#595959' }}>{docowner}</span>
                  </li>
                  <li className="mt-2 mb-2" style={{ fontSize: '12px', color: '#1C4690' }}>
                    Created: <span style={{ fontSize: '12px', color: '#595959' }}>
                      <HumanizedDate dateStr={doccreated} />
                    </span>
                  </li>
                  {docoassignmentdescription && (
                    <li className="mt-2 mb-2" style={{ fontSize: '12px', color: '#1C4690' }}>
                      Instructions: <br />
                      <span style={{ fontSize: '12px', color: '#595959' }}>{docoassignmentdescription}</span>
                    </li>
                  )}
                  <li className="mt-2 mb-3" style={{ fontSize: '12px', fontWeight: 440 }}>Signers ({signers.length}):</li>
                  <li className="mt-3 mb-3" style={{ fontSize: '12px', color: '#1C4690', height: '10vh', overflowY: 'scroll' }}>
                    <div>
                      {signers.length > 0 ? (
                        signers.map((s, index) => (
                          <span key={index} style={{ fontSize: '12px' }}>
                            {s.signed === 'True' ? (
                              <small className="text-success">
                                <FaCircle className="dot text-success shadow-lg m-1" aria-hidden="true" />
                                {s.email}
                                <br />
                                <span style={{ fontSize: '10px' }}>{s.signed_time_stamp}</span>
                              </small>
                            ) : (
                              <span>
                                {s.current_signer === 'True' ? (
                                  <small>
                                    <FaCircle className="dot text-secondary shadow-lg m-1" aria-hidden="true" />
                                    {s.email}
                                  </small>
                                ) : (
                                  <small>
                                    <FaCircle className="dot text-secondary shadow-lg m-1" aria-hidden="true" />
                                    {s.email}
                                  </small>
                                )}
                              </span>
                            )}
                            <br />
                          </span>
                        ))
                      ) : null}
                    </div>
                  </li>
                </ul>
              </div>

              <div className="container">
                <Button
                  variant="contained"
                  color="primary"
                  className="p-2 my-4"
                  style={{ textTransform: 'none', fontWeight: 'lighter', fontSize: '12px' }}
                  disabled={false}
                  onClick={handleComments}
                  startIcon={<FaComments className="mx-1" />}
                >
                  <span className="mx-2">Comments ({comments.length})</span>
                </Button>
              </div>

              <div className="card-footer p-1 bg-white">
                <a className="my-4" href="https://alignsys.tech" target="_blank" rel="noopener noreferrer">
                  <img src={logo} style={{ width: '60%' }} alt="Footer Logo" />
                </a>
              </div>
            </div>

          </div> */}
          <div className="row bg-white" style={{ height: '100vh', overflow: 'clip' }} id="redirectdiv">

            <div className="col-lg-9 col-md-12 col-sm-12 bg-white" >
              <div>
                {sampleURL ? (
                  <>
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
                    />
                  </>
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
            </div>

            <div className="col-lg-3 col-md-12 col-sm-12  text-center shadow-lg order-lg-2 order-sm-1" style={{ overflow: 'clip', borderRadius: '0', borderTop: 'none', boxShadow: '0' }}>
              {/* Logo Section */}
              <div
                className="d-flex flex-column justify-content-center align-items-center  bg-white shadow-lg"
                style={{
                  height: "60px", // Fixed height (adjust as needed)
                  minHeight: "61px", // Prevent shrinking
                  maxHeight: "61px", // Prevent expansion
                  overflow: "hidden", // Prevent content from affecting height
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


              <p className="text-white p-2" style={{ fontSize: '11px', backgroundColor: '#1C4690' }}>Document Details</p>

              <div className="container-fluid">
                <ul style={{ listStyle: 'none' }}>
                  <li className="mb-2" style={{ fontSize: '12px', fontWeight: 450, color: '#1C4690' }}>Title</li>
                  <li className="mt-2 mb-3" style={{ fontSize: '12px', fontWeight: 440 }}>{docname}</li>
                  <li className="mt-2 mb-2" style={{ fontSize: '12px', color: '#1C4690' }}>
                    Current Signer: <span style={{ fontSize: '12px', color: '#595959' }}>{currentsignerEmail}</span>
                  </li>
                  <li className="mt-2 mb-2" style={{ fontSize: '12px', color: '#1C4690' }}>
                    Owner: <span style={{ fontSize: '12px', color: '#595959' }}>{docowner}</span>
                  </li>
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
                  <li className="mt-2 mb-3" style={{ fontSize: '12px', fontWeight: 440 }}>Signers ({signers.length}):</li>
                  <li className="mt-3 mb-3" style={{ fontSize: '12px', color: '#1C4690', height: '10vh', overflowY: 'scroll' }}>
                    {signers.length > 0 ? signers.map((s, index) => (
                      <span key={index} style={{ fontSize: '12px' }}>
                        {s.signed === 'True' ? (
                          <small className="text-success">
                            <FaCircle className="dot text-success shadow-lg m-1" aria-hidden="true" />
                            {s.email}
                            <br />
                            <span style={{ fontSize: '10px' }}>{s.signed_time_stamp}</span>
                          </small>
                        ) : (
                          <small>
                            <FaCircle className={`dot ${s.current_signer === 'True' ? 'text-secondary' : 'text-secondary'} shadow-lg m-1`} aria-hidden="true" />
                            {s.email}
                          </small>
                        )}
                        <br />
                      </span>
                    )) : null}
                  </li>
                </ul>
              </div>

              <div className="container">


                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  className="mb-3 m-2"
                  style={{ textTransform: 'none', fontWeight: 'lighter', width: '60%', padding: '6px' }}
                  disabled={false}
                  startIcon={<CommentIcon />}
                >
                  <span className='mx-1'> Comments ({comments.length})</span>
                </Button>
              </div>

              <div className="card-footer p-1 bg-white">
                <a className="my-4" href="https://alignsys.tech" target="_blank" rel="noopener noreferrer">
                  <img src={logo} style={{ width: '40%' }} alt="Footer Logo" />
                </a>
              </div>
            </div>


          </div>


        </>
      )}

    </>

  )
}

export default Signing_Page_Redirect_Locked