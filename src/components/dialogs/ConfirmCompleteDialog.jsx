import * as React from 'react';
import { PILL } from '../common/pillButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { FaTimes, FaCheck, FaSignature, FaExclamationTriangle, FaRedoAlt } from 'react-icons/fa';
import { Box, Typography } from '@mui/material';
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Authcontext from '../../context/Authcontext';
import * as constants from "../constants/constants";
import { ConfirmDialog } from '../common/dialogKit';

// Turn an axios error from the signing service into a plain-language message
// plus the technical detail (kept for support, shown on demand).
function describeSigningError(error) {
  const res = error?.response;
  const data = res?.data;
  const serverMsg = typeof data === 'string'
    ? data.slice(0, 300)
    : data?.message || data?.error || data?.detail || data?.title || '';

  let message;
  if (!res) {
    message = error?.code === 'ECONNABORTED'
      ? 'The signing service took too long to respond. Your signature has not been applied. Please try again.'
      : 'We couldn\'t reach the signing service. Check your internet connection and try again.';
  } else if (res.status === 400) {
    message = 'The document couldn\'t be signed because some of the signing details were not accepted.';
  } else if (res.status === 401 || res.status === 403) {
    message = 'You are not allowed to sign this document, or your signing link has expired.';
  } else if (res.status === 404) {
    message = 'This document could not be found. It may have been removed, voided or already completed.';
  } else if (res.status === 409) {
    message = 'This document has already been signed or was changed by someone else.';
  } else if (res.status === 413) {
    message = 'The signature or stamp image is too large. Try a smaller image.';
  } else if (res.status >= 500) {
    message = 'The signing service ran into a problem and your signature has not been applied. Please try again in a moment.';
  } else {
    message = 'The document could not be signed. Please try again.';
  }

  const detail = [
    res ? `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}` : (error?.code || 'Network error'),
    serverMsg,
  ].filter(Boolean).join(' — ');

  return { message, detail };
}

// Transition for dialog slide
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function ConfirmCompleteDialog(props) {
  const { user } = React.useContext(Authcontext);
  const [fullWidth, setFullWidth] = React.useState(true);
  const [maxWidth, setMaxWidth] = React.useState('sm');
  let navigate = useNavigate();
  const [signError, setSignError] = React.useState(null); // { message, detail }
  const [showDetail, setShowDetail] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);

  // Close the dialog
  const handleClose = () => {
    props.setOpenConfirmCompleteDialog(false);
  };

  // Append annotations
  async function appendAnnotations() {
    props.setAnnotatingDocument(true)


    // Ensure all text annotation content has \n for line breaks
    let processedTextAnnotations = Array.isArray(props.textAnnotation)
      ? props.textAnnotation.map(ann => ({
          ...ann,
          content: typeof ann.content === 'string' ? ann.content.replace(/\r?\n/g, '\\n') : ann.content
        }))
      : props.textAnnotation;

    let payload = JSON.stringify({
      "fileName": `${props.fileurl}`,
      "ipAddress": `${props.ip}`,
      "signersGuid": `${props.signerguid}`,
      "imageAnnotations": props.annotationList,
      "textAnnotations": processedTextAnnotations
    });

    //console.log(props.textAnnotation)

    console.log(payload);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.annotationsurl}/api/Values`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload
    };



    // console.log(payload)

    await axios.request(config)
      .then((response) => {
        props.setAnnotatingDocument(false);
        // console.log("success")
        if (props.pagetype === "redirectsign") {
          if (user) {
            navigate('/', { state: { openalert: true, alertmsg: `${props.docname} signed successfully`, alertseverity: 'success' } });
          } else {
            navigate('/complete', { state: { doctitle: props.docname } });
          }
        } else {
       
          navigate('/selfsign/otheractions', { state: { user: user, voided: false, signed: true, fileurl: props.fileurl, docguid: props.guid, doctitle: props.docname } });
        }
      })
      .catch((error) => {
        props.setAnnotatingDocument(false);
        console.error('Complete signing failed:', error);
        setShowDetail(false);
        setSignError(describeSigningError(error));
      });

  }

  const retrySigning = async () => {
    setRetrying(true);
    setSignError(null);
    try {
      await appendAnnotations();
    } finally {
      setRetrying(false);
    }
  };

  // Confirm and proceed
  const handleCloseAgree = () => {
    // console.log(props.annotationList);
    props.setOpenConfirmCompleteDialog(false);
    props.setOpenDialogLoading(true);

    appendAnnotations();
    props.setOpenDialogLoading(false);

 
  };

  // Return dialog JSX
  return (
    <div>
      <Dialog
        open={props.openconfirmcompletedialog}
        TransitionComponent={Transition}
        keepMounted
        // onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle
          className="text-center"
          style={{ color: "#ffff", backgroundColor: "#1C4690", fontSize: "14px" }}
        >
          <FaSignature style={{ marginRight: 6, verticalAlign: 'middle' }} /> {"Complete Signing"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description" className="text-center">
            <p className="m-4 text-dark" style={{ fontSize: "14px" }}>
              I confirm the placed signature is in order. Let's proceed.
            </p>
          </DialogContentText>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingBottom: 8 }}>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleClose}
              sx={{ ...PILL, minWidth: 100 }}
              startIcon={<FaTimes />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCloseAgree}
              sx={{ ...PILL, minWidth: 100 }}
              startIcon={<FaCheck />}
            >
              Proceed
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!signError}
        title="Signing could not be completed"
        icon={<FaExclamationTriangle />}
        tone="primary"
        busy={retrying}
        confirmLabel={<><FaRedoAlt size={11} style={{ marginRight: 6 }} />Try again</>}
        cancelLabel="Close"
        onConfirm={retrySigning}
        onCancel={() => setSignError(null)}
        message={
          <>
            <Typography sx={{ fontSize: 13.5, color: '#1f2937', mb: 1 }}>{signError?.message}</Typography>
            <Typography sx={{ fontSize: 12.5, color: '#6b7280' }}>
              Your placed signatures are still on the document. If this keeps happening, contact the person who sent you the document.
            </Typography>
          </>
        }
      >
        {signError?.detail && (
          <Box sx={{ px: 1 }}>
            <Typography
              component="button"
              type="button"
              onClick={() => setShowDetail((v) => !v)}
              sx={{ fontSize: 12, color: '#1C4690', background: 'none', border: 0, p: 0, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {showDetail ? 'Hide details' : 'Show details'}
            </Typography>
            {showDetail && (
              <Box component="pre" sx={{
                mt: 1, mb: 0, p: 1.25, fontSize: 11.5, bgcolor: '#f3f4f6', border: '1px solid #e5e7eb',
                borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#374151',
              }}>
                {signError.detail}
              </Box>
            )}
          </Box>
        )}
      </ConfirmDialog>
    </div>
  );
}

export default ConfirmCompleteDialog;
