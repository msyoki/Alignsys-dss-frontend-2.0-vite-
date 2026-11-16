import React, { useEffect, useRef } from 'react';
import { FaMobileAlt, FaPlus, FaTimes } from 'react-icons/fa';
import { PHONE_RE } from '../api';

// Optional SMS verification for one signer. Off by default: the sender turns it
// on per signer ("+ SMS code"), which reveals a phone field on the next line.
// Off it adds nothing to the row's height. A number from the M-Files link (`suggested`)
// only pre-fills the field once the sender turns it on.
// phone === undefined -> off; a string (possibly '') -> on.
export default function SignerOtp({ email, phone, suggested = '', onChange, otp, disabled, showErrors }) {
  const on = phone !== undefined;
  const inputRef = useRef(null);
  const justOpened = useRef(false);
  const invalid = on && showErrors && !PHONE_RE.test((phone || '').trim());

  useEffect(() => {
    if (on && justOpened.current) {
      justOpened.current = false;
      inputRef.current?.focus();
    }
  }, [on]);

  // Organisation known not to have SMS verification (explained once under the list): no control.
  // If availability couldn't be checked (null), still offer it: the server checks on send.
  if (otp.loading || otp.available === false) return null;

  if (!on) {
    return (
      <button
        type="button"
        className="signer-otp-add"
        disabled={disabled}
        title="Ask this signer to confirm a code sent to their phone before they can open the document"
        onClick={() => { justOpened.current = true; onChange(email, suggested); }}
      >
        <FaPlus size={8} aria-hidden /> SMS code
      </button>
    );
  }

  return (
    <>
      <span className="signer-otp-on" title="This signer must confirm an SMS code before opening the document">
        <FaMobileAlt size={10} aria-hidden /> SMS code
        <button type="button" className="signer-otp-remove" aria-label={`Remove SMS code for ${email}`}
          disabled={disabled} onClick={() => onChange(email, undefined)}>
          <FaTimes size={9} />
        </button>
      </span>
      <div className="signer-otp-row">
        <input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          className={`signer-otp-phone${invalid ? ' invalid' : ''}`}
          placeholder="Phone, e.g. +254712345678"
          aria-label={`Phone number for ${email}`}
          aria-invalid={invalid || undefined}
          value={phone}
          disabled={disabled}
          autoComplete="off"
          onChange={(e) => onChange(email, e.target.value.replace(/[^\d+]/g, ''))}
        />
        {invalid && <span className="signer-otp-error">Use international format, e.g. +254712345678</span>}
      </div>
    </>
  );
}
