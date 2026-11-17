import React, { useEffect, useRef } from 'react';
import { FaPaperPlane, FaTimes, FaExclamationTriangle, FaCheckCircle, FaFilePdf, FaMobileAlt } from 'react-icons/fa';
import { Spinner } from './StatusScreens';

const maskPhone = (p = '') => (p.length > 7 ? `${p.slice(0, 4)}•••${p.slice(-3)}` : p);

// Before sending: the document, who gets it and how many boxes each, SMS verification, optional message.
export default function ReviewDialog({
  open, name, signers, colors, boxCount, phones = {}, sending, error, message, onMessageChange, onClose, onSend,
}) {
  const sendRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    sendRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  const withoutBox = signers.filter((s) => !boxCount(s));

  const submit = (e) => {
    e.preventDefault();
    onSend();
  };

  return (
    <div className="sfo-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="sfo-modal" role="dialog" aria-modal="true" aria-labelledby="review-title" onSubmit={submit} noValidate>
        <div className="sfo-modal-head">
          <FaPaperPlane size={14} aria-hidden />
          <h2 id="review-title">Send for signing</h2>
          <button type="button" className="sfo-modal-close" aria-label="Close" onClick={onClose} disabled={sending}>
            <FaTimes />
          </button>
        </div>

        <div className="sfo-modal-body">
          {name && (
            <>
              <p className="sfo-modal-label">Document</p>
              <p className="review-doc" title={name}>
                <FaFilePdf size={13} aria-hidden style={{ color: '#b42318', flexShrink: 0 }} />
                <span>{name}</span>
              </p>
            </>
          )}

          <p className="sfo-modal-label">Signers ({signers.length})</p>
          <ul className="review-list">
            {signers.map((emailItem, i) => {
              const n = boxCount(emailItem);
              return (
                <li key={emailItem}>
                  <span className="signer-dot sm" style={{ background: colors[i] || '#1C4690' }} aria-hidden>{i + 1}</span>
                  <span className="review-email" title={emailItem}>{emailItem}</span>
                  {phones[emailItem] !== undefined && (
                    <span className="review-otp" title={`Must confirm an SMS code sent to ${phones[emailItem] || 'their phone'}`}>
                      <FaMobileAlt size={10} aria-hidden /> SMS {maskPhone(phones[emailItem])}
                    </span>
                  )}
                  <span className={`review-count${n ? '' : ' none'}`}>
                    {n ? <><FaCheckCircle size={11} aria-hidden /> {n} box{n === 1 ? '' : 'es'}</> : 'No box'}
                  </span>
                </li>
              );
            })}
          </ul>

          {withoutBox.length > 0 && (
            <div className="sfo-note warning" role="status">
              <FaExclamationTriangle size={12} aria-hidden />
              <span>
                {withoutBox.length === signers.length
                  ? 'No signature boxes placed. Signers will choose where to sign.'
                  : `${withoutBox.length} signer${withoutBox.length === 1 ? ' has' : 's have'} no signature box and will choose where to sign.`}
              </span>
            </div>
          )}

          <label className="sfo-modal-label" htmlFor="review-message">Message to signers <span className="optional">(optional)</span></label>
          <textarea
            id="review-message"
            className="sfo-textarea"
            rows={3}
            maxLength={400}
            placeholder="e.g. Please sign on page 3 next to your name."
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            disabled={sending}
          />

          {error && (
            <div className="sfo-note error" role="alert">
              <FaExclamationTriangle size={12} aria-hidden />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="sfo-modal-foot">
          <button type="button" className="ui-btn ui-btn-outline-neutral" onClick={onClose} disabled={sending}>Back</button>
          <button ref={sendRef} type="submit" className="ui-btn ui-btn-primary" disabled={sending}>
            {sending
              ? <><Spinner size={14} /> Sending…</>
              : <><FaPaperPlane size={12} aria-hidden /> {`Send to ${signers.length} signer${signers.length === 1 ? '' : 's'}`}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
