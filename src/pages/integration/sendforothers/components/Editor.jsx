import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { FaPencilAlt, FaUserCircle, FaCheckSquare, FaPaperPlane, FaArrowLeft } from 'react-icons/fa';
import PDFViewerSetSIgningAreas from '../viewer/PDFViewerSetSIgningAreas';
import { PILL } from '../viewer/pillButton';
import ReviewDialog from './ReviewDialog';
import logo from '../../../../images/ZFBLU.webp';
import { buildSendPayload, phoneProblems, sendToSigners } from '../api';

// --- Colour per signer: same rules as the DSS app (random, distinct, never green) ---
const generateRandomRGB = () => ({
  r: Math.floor(Math.random() * 256),
  g: Math.floor(Math.random() * 256),
  b: Math.floor(Math.random() * 256),
});
const rgbToHex = (rgb) => {
  const toHex = (x) => x.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};
const hexToRgb = (hex) => {
  const bigint = parseInt(hex.slice(1), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
};
const colorDifference = (c1, c2) => {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
};
const isGreenShade = (rgb) => rgb.g > rgb.r && rgb.g > rgb.b && rgb.g > 100;
const generateUniqueColor = (existingColors, threshold = 60) => {
  let newColor;
  let attempts = 0;
  do {
    newColor = rgbToHex(generateRandomRGB());
    const tooSimilar = Object.values(existingColors).some((c) => colorDifference(newColor, c) < threshold);
    if (!tooSimilar && !isGreenShade(hexToRgb(newColor))) break;
    attempts++;
  } while (attempts < 20);
  return newColor;
};

// Full-page version of the DSS app's "place signature boxes" screen (SignersBoxDialog).
export default function Editor({
  guid, name, signerEmails, pdfBase64, message, onMessageChange, onBack, onBoxesChange, onSent,
  phones = {},
}) {
  const signers = useMemo(() => signerEmails.map((email) => ({ email })), [signerEmails]);
  const document = useMemo(() => `data:application/pdf;base64,${pdfBase64}`, [pdfBase64]);

  const [signatureBoxes, setSignatureBoxes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [addSignatureBox, setAddSignatureBox] = useState(false);
  const [userColors, setUserColors] = useState({});

  const [reviewOpen, setReviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const boxCount = (email) => signatureBoxes
    .filter((b) => b.signer.email === email)
    .reduce((n, b) => n + b.annotations.length, 0);
  const totalBoxes = signatureBoxes.reduce((n, b) => n + b.annotations.length, 0);

  // Same as the DSS app: pick a signer, then click on the document.
  const addOrUpdateSigner = (newSigner) => {
    setSignatureBoxes((prev) => (prev.some((box) => box.signer.id === newSigner.id)
      ? prev
      : [...prev, { signer: newSigner, annotations: [] }]));
  };

  const handleSelectUser = (index, item, startPlacing) => {
    if (startPlacing) setAddSignatureBox(true);
    const colorToUse = userColors[index] || generateUniqueColor(userColors);
    const newSigner = { id: index, email: item.email, color: colorToUse };
    if (!userColors[index]) setUserColors((prev) => ({ ...prev, [index]: colorToUse }));
    setSelectedUser(newSigner);
    addOrUpdateSigner(newSigner);
  };

  // Warn before leaving with unsent boxes.
  useEffect(() => {
    if (!totalBoxes) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [totalBoxes]);

  // Lets the overview show how many signing areas are placed.
  useEffect(() => { onBoxesChange?.(totalBoxes); }, [totalBoxes, onBoxesChange]);

  const send = async () => {
    if (sending) return;
    // SMS verification is set on the overview screen; don't send an incomplete number.
    const bad = phoneProblems(phones);
    if (bad.length) {
      setSendError(`Go back and enter a valid phone number for ${bad.join(', ')}, or switch off "Require SMS code".`);
      return;
    }
    setSending(true);
    setSendError('');
    try {
      await sendToSigners(buildSendPayload({
        documentid: guid, signers: signerEmails, signatureBoxes, message: message.trim(), phones,
      }));
      onSent(signerEmails);
    } catch (err) {
      setSendError(err.message);
      setSending(false);
    }
  };

  return (
    <>
      <Grid
        container
        sx={{
          height: { xs: 'auto', md: '100vh' },
          overflow: { xs: 'visible', md: 'hidden' },
          bgcolor: '#f5f6f8',
        }}
      >
        {/* PDF Viewer */}
        <Grid item xs={12} md={8} lg={9} sx={{ height: { xs: 'auto', md: '100%' }, overflow: 'hidden', p: 2 }}>
          <PDFViewerSetSIgningAreas
            title="Document"
            complete={false}
            uploadeddocument={document}
            signer={selectedUser}
            signatureBoxes={signatureBoxes}
            setSignatureBoxes={setSignatureBoxes}
            selectedAnnotationId={selectedAnnotationId}
            setSelectedAnnotationId={setSelectedAnnotationId}
            addSignatureBox={addSignatureBox}
            setAddSignatureBox={setAddSignatureBox}
            handleSelectUser={handleSelectUser}
            signers={signers}
          />
        </Grid>

        {/* Signers */}
        <Grid
          item
          xs={12}
          md={4}
          lg={3}
          className="shadow-lg"
          sx={{
            bgcolor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: '100%' },
            padding: '20px',
          }}
        >
          <Box sx={{ bgcolor: '#2757aa', color: '#fff', p: 1, textAlign: 'center' }}>
            <Typography fontSize={{ xs: 10, sm: 12 }}>ORDER OF SIGNERS</Typography>
            <Typography fontSize={{ xs: 10, sm: 12 }}>Number of signers ({signers.length})</Typography>
          </Box>

          <Box sx={{ bgcolor: '#e9f2ff', borderRadius: 1, m: 2, p: 1.5, fontSize: 12 }}>
            <strong style={{ color: '#2757aa' }}>Instructions:</strong>{' '}
            Select a user, then click on the document to place a signature box.
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
            {signers.map((item, index) => {
              const isActive = selectedUser?.id === index && addSignatureBox;
              const n = boxCount(item.email);
              return (
                <Box
                  key={item.email}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  onClick={() => handleSelectUser(index, item, true)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectUser(index, item, true); } }}
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1, outline: 'none', '&:focus-visible > div': { boxShadow: '0 0 0 2px #2757aa' } }}
                >
                  <FaCheckSquare style={{ color: isActive ? userColors[index] : '#ccc', fontSize: 20, minWidth: 20 }} />
                  <Box sx={{ ml: 1, flex: 1, minWidth: 0, p: 1, borderRadius: '25px', boxShadow: 1, bgcolor: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{index + 1}.</span>
                    <FaUserCircle style={{ color: userColors[index] || '#1C4690', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={item.email}>{item.email}</span>
                    {n > 0 && (
                      <span style={{ fontSize: 11, color: userColors[index] || '#2757aa', flexShrink: 0 }}>
                        {n} box{n === 1 ? '' : 'es'}
                      </span>
                    )}
                    {isActive && <FaPencilAlt style={{ marginLeft: 4, fontSize: 14, flexShrink: 0 }} />}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Footer */}
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<FaPaperPlane />}
              sx={{ ...PILL, bgcolor: '#2757aa', '&:hover': { bgcolor: '#1a3a7a', boxShadow: 'none' } }}
              onClick={() => { setSendError(''); setReviewOpen(true); }}
            >
              Send for signing
            </Button>

            <Button
              variant="text"
              startIcon={<FaArrowLeft size={11} />}
              onClick={onBack}
              sx={{ textTransform: 'none', fontSize: 13, color: '#374151' }}
            >
              Back to document details
            </Button>

            <a href="https://alignsys.tech" target="_blank" rel="noreferrer" style={{ marginTop: 4 }}>
              <img src={logo} alt="Alignsys" style={{ height: 32, width: 'auto', maxWidth: 140, objectFit: 'contain' }} />
            </a>
          </Box>
        </Grid>
      </Grid>

      <ReviewDialog
        open={reviewOpen}
        name={name}
        signers={signerEmails}
        colors={userColors}
        boxCount={boxCount}
        phones={phones}
        sending={sending}
        error={sendError}
        message={message}
        onMessageChange={onMessageChange}
        onClose={() => { if (!sending) setReviewOpen(false); }}
        onSend={send}
      />
    </>
  );
}
