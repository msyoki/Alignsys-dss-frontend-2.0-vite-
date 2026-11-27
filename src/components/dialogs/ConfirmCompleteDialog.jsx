import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { FaCheck, FaSignature, FaExclamationTriangle, FaRedoAlt } from 'react-icons/fa';
import { Box, Typography } from '@mui/material';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Authcontext from '../../context/Authcontext';
import * as constants from "../constants/constants";
import { signingTimestamp } from '../../utils/datetime';
import { ConfirmDialog, DialogFooter, DialogHeader, PrimaryButton, SecondaryButton } from '../common/dialogKit';

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

function ConfirmCompleteDialog(props) {
  const { user } = React.useContext(Authcontext);
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
      // Time Finish was clicked, in the signer's configured time zone, e.g. "18/Nov/2026 :22:20:24 Nairobi (UTC+03:00)".
      "timestamp": signingTimestamp(props.signedAt || new Date()),
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

  // What is about to be signed, for the summary: signatures, stamps and text, with pages.
  const images = Array.isArray(props.annotationList) ? props.annotationList : [];
  const texts = Array.isArray(props.textAnnotation) ? props.textAnnotation : [];
  const summaryLine = (items, one, many) => {
    if (!items.length) return null;
    const pages = [...new Set(items.map((a) => (Number(a.pageIndex) || 0) + 1))].sort((a, b) => a - b);
    const pageText = pages.length > 1
      ? `pages ${pages.slice(0, -1).join(', ')} and ${pages[pages.length - 1]}`
      : `page ${pages[0]}`;
    return `${items.length} ${items.length === 1 ? one : many} placed, on ${pageText}`;
  };
  const summary = [
    summaryLine(images.filter((a) => a.isSignature), 'signature', 'signatures'),
    summaryLine(images.filter((a) => !a.isSignature), 'stamp', 'stamps'),
    summaryLine(texts, 'text note', 'text notes'),
  ].filter(Boolean);

  // Return dialog JSX
  return (
    <div>
      <Dialog
        open={!!props.openconfirmcompletedialog}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        aria-labelledby="complete-signing-title"
        aria-describedby="complete-signing-desc"
      >
        <DialogHeader id="complete-signing-title" icon={<FaSignature />} title="Complete signing" onClose={handleClose} />
        <DialogContent sx={{ px: 3, pt: '22px !important', pb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          <Box id="complete-signing-desc">
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111827', wordBreak: 'break-word' }}>
              {props.docname ? `Ready to sign ${props.docname}?` : 'Ready to sign this document?'}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 13, lineHeight: 1.5, color: '#4b5563' }}>
              I confirm the placed signature is in order. Once signed, it can't be changed.
            </Typography>
          </Box>
          {summary.length > 0 && (
            <Box component="ul" sx={{ listStyle: 'none', m: 0, px: 1.75, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: '#f7faff', border: '1px solid #dbe5f4', borderRadius: '10px' }}>
              {summary.map((line) => (
                <Box component="li" key={line} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: '#374151' }}>
                  <FaCheck size={11} color="#2e7d32" aria-hidden style={{ flexShrink: 0 }} />
                  {line}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <Box sx={{ borderTop: '1px solid #e5e7eb' }}>
          <DialogFooter>
            <SecondaryButton onClick={handleClose}>Go back</SecondaryButton>
            <PrimaryButton onClick={handleCloseAgree} startIcon={<FaCheck />} autoFocus>Sign document</PrimaryButton>
          </DialogFooter>
        </Box>
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
