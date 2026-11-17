import React, { useMemo, useState } from 'react';
import { Grid } from '@mui/material';
import { FaPaperPlane, FaFilePdf, FaPencilAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import PDFViewerSetSIgningAreas from '../viewer/PDFViewerSetSIgningAreas';
import { Spinner } from './StatusScreens';
import logo from '../../../../images/ZFBLU.webp';
import { buildSendPayload, otpUnavailableText, phoneProblems, sendToSigners } from '../api';
import SignerOtp from './SignerOtp';

const noop = () => {};
const NO_BOXES = [];

// First screen: document preview + details. The sender either sends as is (no signing areas,
// signers choose where to sign) or goes on to place signing areas in the Editor.
export default function Overview({
  guid, name, signerEmails, pdfBase64, message, onMessageChange, boxTotal, onSetAreas, onSent,
  phones, onPhonesChange, suggestedPhones = {}, otp,
}) {
  const document = useMemo(() => `data:application/pdf;base64,${pdfBase64}`, [pdfBase64]);
  const signers = useMemo(() => signerEmails.map((email) => ({ email })), [signerEmails]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showPhoneErrors, setShowPhoneErrors] = useState(false);

  const setPhone = (email, value) => onPhonesChange((prev) => {
    const next = { ...prev };
    if (value === undefined) delete next[email]; else next[email] = value;
    return next;
  });

  // "Send as is": no annotations in the payload.
  const sendAsIs = async () => {
    if (sending) return;
    const bad = phoneProblems(phones);
    if (bad.length) {
      setShowPhoneErrors(true);
      setError(`Enter a valid phone number for ${bad.join(', ')}, or switch off "Require SMS code".`);
      return;
    }
    if (boxTotal > 0 && !window.confirm(
      `Send without the ${boxTotal} signing area${boxTotal === 1 ? '' : 's'} you placed? Signers will choose where to sign.`,
    )) return;
    setSending(true);
    setError('');
    try {
      await sendToSigners(buildSendPayload({
        documentid: guid, signers: signerEmails, signatureBoxes: NO_BOXES, message: message.trim(), phones,
      }));
      onSent(signerEmails);
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  };

  return (
    <Grid
      container
      sx={{ height: { xs: 'auto', md: '100vh' }, overflow: { xs: 'visible', md: 'hidden' }, bgcolor: '#f5f6f8' }}
    >
      {/* Read-only preview: same viewer as the editor, with placing switched off */}
      <Grid item xs={12} md={8} lg={9} order={{ xs: 2, md: 1 }} sx={{ height: { xs: 'auto', md: '100%' }, overflow: 'hidden', p: 2 }}>
        <PDFViewerSetSIgningAreas
          title="Document"
          complete={false}
          uploadeddocument={document}
          signer={null}
          signatureBoxes={NO_BOXES}
          setSignatureBoxes={noop}
          selectedAnnotationId={null}
          setSelectedAnnotationId={noop}
          addSignatureBox={false}
          setAddSignatureBox={noop}
          handleSelectUser={noop}
          signers={signers}
        />
      </Grid>

      <Grid
        item
        xs={12}
        md={4}
        lg={3}
        order={{ xs: 1, md: 2 }}
        component="aside"
        className="overview-panel"
        aria-label="Document details"
        // Layout via sx: MUI's own Grid styles load after styles.css and would win (flex-direction: row).
        sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'auto', md: '100%' } }}
      >
        <div className="overview-head">
          <FaPaperPlane size={13} aria-hidden />
          <h1>Send for signing</h1>
        </div>

        <div className="overview-body">
          <section>
            <p className="sfo-modal-label">Document</p>
            <p className="review-doc" title={name || 'Document'}>
              <FaFilePdf size={13} aria-hidden style={{ color: '#b42318', flexShrink: 0 }} />
              <span>{name || 'Document'}</span>
            </p>
          </section>

          <section>
            <p className="sfo-modal-label">Signers ({signerEmails.length})</p>
            <ol className="review-list">
              {signerEmails.map((email, i) => (
                <li key={email} className="has-otp">
                  <span className="signer-dot sm" style={{ background: '#1C4690' }} aria-hidden>{i + 1}</span>
                  <span className="review-email" title={email}>{email}</span>
                  <SignerOtp email={email} phone={phones[email]} suggested={suggestedPhones[email]}
                    onChange={setPhone} otp={otp} disabled={sending} showErrors={showPhoneErrors} />
                </li>
              ))}
            </ol>
            {!otp.loading && (otp.available === false ? (
              <p className="overview-hint small">{otpUnavailableText(otp.code)}</p>
            ) : (
              <p className="overview-hint small">Optional: add an SMS code for signers who must confirm their phone before opening.</p>
            ))}
          </section>

          <section>
            <label className="sfo-modal-label" htmlFor="overview-message">
              Message to signers <span className="optional">(optional)</span>
            </label>
            <textarea
              id="overview-message"
              className="sfo-textarea"
              rows={2}
              maxLength={400}
              placeholder="e.g. Please review and sign by Friday."
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              disabled={sending}
            />
          </section>

          <section className="overview-choice">
            <p className="overview-question">Do you want to set where each signer signs?</p>
            {boxTotal > 0 ? (
              <p className="overview-hint ok">
                <FaCheckCircle size={11} aria-hidden /> {boxTotal} signing area{boxTotal === 1 ? '' : 's'} placed.
              </p>
            ) : (
              <p className="overview-hint">If not, send it as is and each signer chooses where to sign.</p>
            )}
            <div className="overview-actions">
              <button type="button" className="ui-btn ui-btn-outline ui-btn-block" onClick={onSetAreas} disabled={sending}>
                <FaPencilAlt size={11} aria-hidden /> {boxTotal > 0 ? 'Review signing areas' : 'Set signing areas'}
              </button>
              <button type="button" className="ui-btn ui-btn-primary ui-btn-block" onClick={sendAsIs} disabled={sending}>
                {sending
                  ? <><Spinner size={14} /> Sending…</>
                  : <><FaPaperPlane size={12} aria-hidden /> Send as is</>}
              </button>
            </div>
          </section>

          {error && (
            <div className="sfo-note error" role="alert">
              <FaExclamationTriangle size={12} aria-hidden />
              <span>{error}</span>
            </div>
          )}
        </div>

        <a className="overview-logo" href="https://alignsys.tech" target="_blank" rel="noreferrer">
          <img src={logo} alt="Alignsys" />
        </a>
      </Grid>
    </Grid>
  );
}
