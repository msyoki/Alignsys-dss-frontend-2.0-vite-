import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { FaPaperPlane, FaArrowLeft } from 'react-icons/fa';
import SignerBoxesPanel from '../../../../components/preview/SignerBoxesPanel';
import { signerColor } from '../../../../components/preview/signerColors';
import PDFViewerSetSIgningAreas from '../viewer/PDFViewerSetSIgningAreas';
import { PILL } from '../viewer/pillButton';
import ReviewDialog from './ReviewDialog';
import logo from '../../../../images/ZFBLU.webp';
import { buildSendPayload, phoneProblems, sendToSigners } from '../api';

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
  // Fixed colour per signing position, same as the DSS app (was random).
  const userColors = useMemo(() => Object.fromEntries(signers.map((_, i) => [i, signerColor(i)])), [signers]);

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
    const newSigner = { id: index, email: item.email, color: signerColor(index) };
    setSelectedUser(newSigner);
    addOrUpdateSigner(newSigner);
  };

  // Remove every box of one signer (same effect as deleting them one by one).
  const removeSignerBoxes = (email) => {
    setSignatureBoxes((prev) => prev.map((box) => (box.signer.email === email ? { ...box, annotations: [] } : box)));
    setSelectedAnnotationId(null);
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
          sx={{
            bgcolor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: '100%' },
            borderLeft: { md: '1px solid #e5e7eb' },
          }}
        >
          <SignerBoxesPanel
            signers={signers}
            signatureBoxes={signatureBoxes}
            activeIndex={selectedUser?.id ?? null}
            placing={addSignatureBox}
            onSelect={(index, item) => { setSelectedAnnotationId(null); handleSelectUser(index, item, true); }}
            onRemoveBoxes={removeSignerBoxes}
            footer={(
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <Button
                  variant="contained"
                  startIcon={<FaPaperPlane />}
                  sx={{ ...PILL, width: '100%', bgcolor: '#2757aa', '&:hover': { bgcolor: '#1a3a7a', boxShadow: 'none' } }}
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
            )}
          />
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
