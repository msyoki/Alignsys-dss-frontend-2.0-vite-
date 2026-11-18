import React, { useContext, useState } from 'react';
import axios from 'axios';
import AuthContext from '../../context/Authcontext.jsx';
import * as constants from '../constants/constants.js';
import SignerOtpBadge, { maskPhone } from './SignerOtpBadge.jsx';

const PHONE_RE = /^\+[1-9]\d{6,14}$/;
const linkBtn = {
  background: 'none', border: 0, padding: 0, color: '#2757aa', fontSize: '11.5px',
  fontWeight: 500, cursor: 'pointer', textDecoration: 'underline',
};

// SMS OTP badge for a signer, plus "Change number" for people who manage the document
// (originator, their organisation admin, super admin) while the signer hasn't signed.
// Calls POST /api/signers/phone/; the badge shows the new number straight away.
export default function SignerOtpStatus({ signer, documentGuid, canChange = false, onChanged }) {
  const { authTokens } = useContext(AuthContext) || {};
  const [phone, setPhone] = useState(signer?.otpnumber || '');
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (!signer?.otp) return null;
  const changeAllowed = canChange && signer.signed !== 'True';

  const start = () => { setEditing(true); setValue(''); setError(''); setNotice(''); };
  const cancel = () => { setEditing(false); setError(''); };

  const save = async (e) => {
    e?.preventDefault();
    const next = value.replace(/[\s-]/g, '');
    if (!PHONE_RE.test(next)) { setError('Use international format, e.g. +254712345678'); return; }
    setSaving(true); setError('');
    try {
      await axios.post(
        `${constants.devApiBaseUrl}/api/signers/phone/`,
        { documentid: documentGuid, email: signer.email, phone: next },
        { headers: { Authorization: `Bearer ${authTokens?.access}` } },
      );
      setPhone(next);
      setEditing(false);
      setNotice(`Codes now go to ${maskPhone(next)}. The signer can request a new code on the signing page.`);
      onChanged?.(signer.email, next);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.response?.data?.error || 'Could not change the number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, maxWidth: '100%' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <SignerOtpBadge signer={{ ...signer, otpnumber: phone }} />
        {changeAllowed && !editing && (
          <button type="button" style={linkBtn} onClick={start} title="Send this signer's SMS codes to a different number">
            Change number
          </button>
        )}
      </span>
      {editing && (
        // Not a <form>: this can sit inside the substitute form.
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <input
            type="tel"
            autoFocus
            className="form-control form-control-sm"
            style={{ width: 170, fontSize: '12.5px' }}
            placeholder="+254712345678"
            aria-label={`New SMS number for ${signer.email}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(e); if (e.key === 'Escape') cancel(); }}
            disabled={saving}
          />
          <button type="button" className="btn btn-sm btn-primary" style={{ fontSize: '12px', backgroundColor: '#2757aa', borderColor: '#2757aa' }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary" style={{ fontSize: '12px' }} onClick={cancel} disabled={saving}>
            Cancel
          </button>
        </span>
      )}
      {error && <span role="alert" style={{ fontSize: '11.5px', color: '#b42318' }}>{error}</span>}
      {notice && !editing && <span role="status" style={{ fontSize: '11.5px', color: '#1b5e20' }}>{notice}</span>}
    </span>
  );
}
