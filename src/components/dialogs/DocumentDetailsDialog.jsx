import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Box, Button, Dialog, DialogContent, Switch, TextField, Tooltip, Typography } from '@mui/material';
import {
  FaBan, FaCheck, FaClock, FaEnvelopeOpenText, FaExclamationCircle, FaFileAlt, FaMobileAlt, FaPaperPlane, FaSearch, FaShieldAlt,
} from 'react-icons/fa';
import { FaDownload } from 'react-icons/fa6';
import AuthContext from '../../context/Authcontext.jsx';
import * as constants from '../constants/constants.js';
import { downloadDocument } from '../../api/documentFiles';
import { isValidEmail } from '../../utils/email';
import useOtpAvailability from '../../hooks/useOtpAvailability';
import { jsonPhoneCodesData } from '../../data/country-phone-codes';
import SimpleAlert from '../SimpleAlert.jsx';
import { PILL_COMPACT, PILL_OUTLINE } from '../common/pillButton';
import {
  ConfirmDialog, DialogFooter, DialogHeader, PrimaryButton, PropertyRow, PropertyValue, SecondaryButton, StatusChip, fieldSx,
} from '../common/dialogKit';
import { formatFull } from '../../utils/datetime';

// Document details, shared by the dashboard tabs (Inbox, Outbox, Completed, ...) and the
// admin document log. People who manage the document (its originator; in the admin log,
// the organisation admin) can, while it is in progress and for signers who haven't signed:
//   - substitute a signer (optionally with an SMS code for the new one),
//   - add an SMS code, change its number, or turn it off.
// The originator can also resend to the current signer and recall (void) the document.
// The server checks every permission again and writes each change to the logs.

const PHONE_DIGITS = /^[1-9][0-9]{6,14}$/;
const EMPTY_PHONE = { code: '+254', number: '' };
const phoneProblem = (p) => (PHONE_DIGITS.test(p.number.trim())
  ? '' : 'Enter the phone number without the country code or leading 0, e.g. 722123456');
const fullPhone = (p) => `${p.code}${p.number.trim()}`;

export const maskPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 3 ? `••• ${digits.slice(-3)}` : '';
};
const fmt = (value) => formatFull(value);
const fmtShort = (value) => formatFull(value);
const isTrue = (v) => v === true || v === 'True';
const errorText = (err, fallback) => err?.response?.data?.msg || err?.response?.data?.error || fallback;

const SMALL_BTN = { ...PILL_OUTLINE, minHeight: 30, py: 0.25, px: 1.5, fontSize: '12px', whiteSpace: 'nowrap' };
const labelSx = { fontSize: 12, color: '#374151', fontWeight: 500, mb: 0.5, display: 'block' };

function PhoneFields({ value, onChange, disabled, idPrefix, numberLabel = 'Phone number' }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Box sx={{ width: 160 }}>
        <Typography component="label" htmlFor={`${idPrefix}-code`} sx={labelSx}>Country code</Typography>
        <TextField
          id={`${idPrefix}-code`} select fullWidth size="small" value={value.code} disabled={disabled}
          onChange={(e) => set({ code: e.target.value })} SelectProps={{ native: true }} sx={fieldSx()}
        >
          <option value="+254">Kenya (+254)</option>
          {jsonPhoneCodesData.map((item, index) => (
            <option key={index} value={item.dial_code}>{item.name} ({item.dial_code})</option>
          ))}
        </TextField>
      </Box>
      <Box sx={{ flex: '1 1 180px' }}>
        <Typography component="label" htmlFor={`${idPrefix}-number`} sx={labelSx}>{numberLabel}</Typography>
        <TextField
          id={`${idPrefix}-number`} fullWidth size="small" type="tel" placeholder="e.g. 722123456" disabled={disabled}
          value={value.number} inputProps={{ maxLength: 15 }} sx={fieldSx()}
          onChange={(e) => set({ number: e.target.value.replace(/[^0-9]/g, '') })}
        />
      </Box>
    </Box>
  );
}

function OtpUnavailable({ availability }) {
  if (availability.loading || availability.available) return null;
  return (
    <Typography role="status" sx={{ fontSize: 12, color: '#8a6100' }}>
      {availability.message || 'SMS codes are not available for your organisation.'}
    </Typography>
  );
}

function SignerChips({ signer }) {
  const signedAt = fmtShort(signer.signed_time_stamp);
  const verifiedAt = fmtShort(signer.otp_verified_at);
  const phone = maskPhone(signer.otpnumber);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
      {signer.otp && (
        <Tooltip title={signer.otp_verified
          ? `SMS verified${verifiedAt ? ` ${verifiedAt}` : ''}${phone ? ` (${phone})` : ''}`
          : `SMS code${phone ? ` to ${phone}` : ''}, not verified yet`}
        >
          <Box
            component="span"
            aria-label={signer.otp_verified ? 'SMS verified' : 'SMS code required'}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 11.5, color: signer.otp_verified ? '#2e7d32' : '#8a6100', whiteSpace: 'nowrap' }}
          >
            {signer.otp_verified ? <FaShieldAlt size={11} /> : <FaMobileAlt size={11} />}
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{phone}</Box>
          </Box>
        </Tooltip>
      )}
      {isTrue(signer.signed) ? (
        <Tooltip title={signedAt ? `Signed ${signedAt}` : 'Signed'}>
          <span><StatusChip tone="success" icon={<FaCheck size={10} />}>Signed</StatusChip></span>
        </Tooltip>
      ) : isTrue(signer.current_signer) ? (
        <StatusChip tone="info" icon={<FaEnvelopeOpenText size={10} />}>Current</StatusChip>
      ) : (
        <StatusChip tone="neutral" icon={<FaClock size={10} />}>Queued</StatusChip>
      )}
    </Box>
  );
}

const numberBadge = (signer) => {
  const c = isTrue(signer.signed) ? ['#e8f5e9', '#2e7d32'] : isTrue(signer.current_signer) ? ['#e3edf7', '#1a3a7a'] : ['#f3f4f6', '#4b5563'];
  return { width: 20, height: 20, borderRadius: '50%', bgcolor: c[0], color: c[1], fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
};

export default function DocumentDetailsDialog({
  open, onClose, document: doc = {}, signers: initialSigners = [], type = '', onChanged,
}) {
  const { user, authTokens } = useContext(AuthContext) || {};
  const auth = { headers: { Authorization: `Bearer ${authTokens?.access}` } };

  const [signers, setSigners] = useState(initialSigners);
  // panel: { email, mode: 'substitute' | 'sms' | 'confirmOff' }
  const [panel, setPanel] = useState(null);
  const [busy, setBusy] = useState('');
  const [alert, setAlert] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [subOtp, setSubOtp] = useState(false);
  const [phone, setPhone] = useState(EMPTY_PHONE);
  const [recallOpen, setRecallOpen] = useState(false);
  const [reason, setReason] = useState('');

  // Fresh state each time the dialog opens or shows another document.
  useEffect(() => {
    if (open) {
      setSigners(initialSigners);
      setPanel(null); setAlert(null); setBusy(''); setRecallOpen(false); setReason('');
      setSignerQuery(''); setShowAllSigners(false);
    }
  }, [open, doc.guid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!alert) return undefined;
    const t = setTimeout(() => setAlert(null), 6000);
    return () => clearTimeout(t);
  }, [alert]);

  const otpAvailability = useOtpAvailability(!!panel && open);

  const completed = isTrue(doc.signedcomplete);
  const voided = isTrue(doc.declined);
  const trashed = isTrue(doc.trashed) || type === 'trashed';
  const inProgress = !completed && !voided && !trashed;
  const isOwner = !!user?.email && String(doc.owner || '').toLowerCase() === String(user.email).toLowerCase();
  const canManage = inProgress && signers.length > 0 && (isOwner || type === 'admin');
  const canResend = isOwner && inProgress && signers.length > 0;
  const canRecall = isOwner && inProgress && (type === 'inbox' || type === 'outbox');
  const recallLabel = type === 'outbox' ? 'Recall document' : 'Void document';

  // Long lists: search, and collapsed to the first few plus the current signer and any open panel.
  const [signerQuery, setSignerQuery] = useState('');
  const [showAllSigners, setShowAllSigners] = useState(false);
  const ordered = useMemo(() => {
    const rank = (s) => (isTrue(s.signed) ? 1 : isTrue(s.current_signer) ? 2 : 3);
    return [...signers].sort((a, b) => rank(a) - rank(b));
  }, [signers]);
  const signedCount = signers.filter((s) => isTrue(s.signed)).length;
  const manySigners = signers.length > 8;
  const collapsible = manySigners;
  const visibleSigners = (() => {
    const all = ordered.map((s, index) => ({ s, index }));
    const q = signerQuery.trim().toLowerCase();
    if (q) return all.filter(({ s }) => s.email.toLowerCase().includes(q));
    if (!collapsible || showAllSigners) return all;
    return all.filter(({ s, index }) => index < 5
      || (isTrue(s.current_signer) && !isTrue(s.signed))
      || (panel && panel.email === s.email));
  })();
  const current = signers.find((s) => isTrue(s.current_signer) && !isTrue(s.signed));

  const status = completed ? { tone: 'success', label: 'Signing completed' }
    : voided ? { tone: 'danger', label: 'Voided' }
      : trashed ? { tone: 'neutral', label: 'In trash' }
        : { tone: 'warning', label: 'Pending signing' };

  const show = (message, severity = 'success') => setAlert({ message, severity });
  const updateSigner = (email, patch) => setSigners((list) => list.map((s) => (
    s.email.toLowerCase() === email.toLowerCase() ? { ...s, ...patch } : s)));
  const changed = () => { try { onChanged?.(); } catch { /* list refresh is best effort */ } };

  const openPanel = (signer, mode) => {
    setPanel({ email: signer.email, mode });
    setNewEmail(''); setSubOtp(false); setPhone(EMPTY_PHONE); setAlert(null);
  };
  const closePanel = () => setPanel(null);

  // --- Actions ----------------------------------------------------------------
  const substitute = async (signer) => {
    const email = newEmail.trim();
    if (!isValidEmail(email)) return show('Enter a valid email address, e.g. name@example.com.', 'error');
    if (subOtp) { const p = phoneProblem(phone); if (p) return show(p, 'error'); }
    setBusy('substitute');
    try {
      const res = await axios.post(`${constants.devApiBaseUrl}/api/signers/substitute/`, {
        documentid: doc.guid, oldsigneremail: signer.email, email, ...(subOtp ? { phone: fullPhone(phone) } : {}),
      }, auth);
      const otpOn = !!res.data?.otp;
      updateSigner(signer.email, {
        email, otp: otpOn, otpnumber: otpOn ? fullPhone(phone) : null, otp_verified: false, otp_verified_at: null,
      });
      closePanel();
      if (res.data?.warning) show(res.data.warning, 'warning');
      else show(`${signer.email} was replaced by ${email}${otpOn ? ', with an SMS code' : ''}.`);
      changed();
    } catch (err) {
      show(errorText(err, 'Could not substitute the signer. Please try again.'), 'error');
    } finally { setBusy(''); }
  };

  const savePhone = async (signer) => {
    const p = phoneProblem(phone);
    if (p) return show(p, 'error');
    setBusy('phone');
    try {
      const number = fullPhone(phone);
      await axios.post(`${constants.devApiBaseUrl}/api/signers/phone/`, { documentid: doc.guid, email: signer.email, phone: number }, auth);
      updateSigner(signer.email, { otp: true, otpnumber: number });
      closePanel();
      show(signer.otp
        ? `SMS codes for ${signer.email} now go to ${maskPhone(number)}. Codes sent to the old number no longer work.`
        : `${signer.email} will be asked for an SMS code sent to ${maskPhone(number)}.`);
      changed();
    } catch (err) {
      show(errorText(err, 'Could not save the number. Please try again.'), 'error');
    } finally { setBusy(''); }
  };

  const turnOffSms = async (signer) => {
    setBusy('off');
    try {
      await axios.post(`${constants.devApiBaseUrl}/api/signers/phone/`, { documentid: doc.guid, email: signer.email, action: 'off' }, auth);
      updateSigner(signer.email, { otp: false, otpnumber: null });
      closePanel();
      show(`${signer.email} will no longer be asked for an SMS code.`);
      changed();
    } catch (err) {
      show(errorText(err, 'Could not turn off the SMS code. Please try again.'), 'error');
    } finally { setBusy(''); }
  };

  const resend = async () => {
    setBusy('resend');
    try {
      await axios.post(`${constants.devApiBaseUrl}/api/resend/mail/signer/`, { fileGuid: doc.guid }, auth);
      show(`Signing request resent${current ? ` to ${current.email}` : ''}.`);
      changed();
    } catch (err) {
      show(errorText(err, 'Failed to resend the signing request.'), 'error');
    } finally { setBusy(''); }
  };

  const recall = async () => {
    setBusy('recall');
    try {
      await axios.post(`${constants.devApiBaseUrl}/api/owner/void/`, { guid: doc.guid, reason: reason.trim() }, auth);
      setRecallOpen(false);
      show(type === 'outbox' ? 'Document recalled.' : 'Document voided.');
      changed();
      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setRecallOpen(false);
      show(errorText(err, 'Failed to void the document.'), 'error');
    } finally { setBusy(''); }
  };

  const download = () => downloadDocument(doc.guid, { token: authTokens?.access, title: doc.title })
    .catch(() => show('Download failed. Please try again.', 'error'));

  // --- Panels -----------------------------------------------------------------
  const substitutePanel = (signer) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: { xs: 0, sm: 3.75 } }}>
      <Box>
        <Typography component="label" htmlFor="dd-sub-email" sx={labelSx}>New signer's email</Typography>
        <TextField
          id="dd-sub-email" autoFocus fullWidth size="small" type="email" value={newEmail} disabled={!!busy}
          placeholder="name@example.com" onChange={(e) => setNewEmail(e.target.value)} sx={fieldSx()}
          onKeyDown={(e) => { if (e.key === 'Enter') substitute(signer); }}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Switch
            size="small" checked={subOtp && otpAvailability.available} disabled={!!busy || !otpAvailability.available}
            onChange={(e) => setSubOtp(e.target.checked)} inputProps={{ 'aria-labelledby': 'dd-sub-otp-label' }}
          />
          <Typography id="dd-sub-otp-label" sx={{ fontSize: 12.8, color: '#374151' }}>Ask for an SMS code before signing</Typography>
        </Box>
        <OtpUnavailable availability={otpAvailability} />
        {subOtp && otpAvailability.available && (
          <>
            <PhoneFields idPrefix="dd-sub-phone" value={phone} onChange={setPhone} disabled={!!busy} />
            <Typography sx={{ fontSize: 11.5, color: '#6D7386' }}>The code goes to this number, not to the person being replaced.</Typography>
          </>
        )}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <SecondaryButton onClick={closePanel} disabled={!!busy} sx={{ minHeight: 32 }}>Cancel</SecondaryButton>
        <PrimaryButton onClick={() => substitute(signer)} loading={busy === 'substitute'} sx={{ ...PILL_COMPACT }}>Substitute signer</PrimaryButton>
      </Box>
    </Box>
  );

  const smsPanel = (signer) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, pl: { xs: 0, sm: 3.75 } }}>
      {signer.otp && (
        <Typography sx={{ fontSize: 12.8, color: '#374151' }}>
          Codes go to <strong>{maskPhone(signer.otpnumber) || 'the saved number'}</strong>
          {signer.otp_verified ? ` · verified${fmtShort(signer.otp_verified_at) ? ` ${fmtShort(signer.otp_verified_at)}` : ''}` : ' · not verified yet'}
        </Typography>
      )}
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{signer.otp ? 'Change number' : 'Add an SMS code'}</Typography>
      <OtpUnavailable availability={otpAvailability} />
      <PhoneFields
        idPrefix="dd-sms-phone" value={phone} onChange={setPhone} disabled={!!busy || !otpAvailability.available}
        numberLabel={signer.otp ? 'New phone number' : 'Phone number'}
      />
      {signer.otp && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', p: '8px 10px', borderRadius: 1.5, bgcolor: '#fff8e1', border: '1px solid #ffe082', color: '#8a6100', fontSize: 12, lineHeight: 1.5 }}>
          <FaExclamationCircle size={13} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
          <span>Any code already sent to the old number stops working. The signer gets a new code on this number when they open the document.</span>
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        {!signer.otp && <SecondaryButton onClick={closePanel} disabled={!!busy} sx={{ minHeight: 32 }}>Cancel</SecondaryButton>}
        <PrimaryButton onClick={() => savePhone(signer)} loading={busy === 'phone'} disabled={!otpAvailability.available} sx={{ ...PILL_COMPACT }}>
          {signer.otp ? 'Save number' : 'Add SMS code'}
        </PrimaryButton>
      </Box>
      {signer.otp && (
        <>
          <Box sx={{ borderTop: '1px solid #e5e7eb' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 220px' }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>Turn off SMS code</Typography>
              <Typography sx={{ fontSize: 12, color: '#6D7386' }}>The signer signs without a code. You'll be asked to confirm.</Typography>
            </Box>
            <Button
              onClick={() => setPanel({ email: signer.email, mode: 'confirmOff' })} disabled={!!busy}
              sx={{ ...SMALL_BTN, color: '#b42318', borderColor: '#f5c2c0', '&:hover': { bgcolor: '#fdecea', borderColor: '#b42318' } }}
            >
              Turn off SMS code
            </Button>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SecondaryButton onClick={closePanel} disabled={!!busy} sx={{ minHeight: 32 }}>Cancel</SecondaryButton>
          </Box>
        </>
      )}
    </Box>
  );

  const confirmOffPanel = (signer) => (
    <Box role="alert" sx={{ ml: { xs: 0, sm: 3.75 }, p: 1.5, borderRadius: 1.5, bgcolor: '#fff', border: '1px solid #f5c2c0', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#b42318' }}>Turn off the SMS code for {signer.email}?</Typography>
      <Typography sx={{ fontSize: 12.5, color: '#374151', lineHeight: 1.55 }}>
        They won't be asked for a code when they open the document.
        {signer.otp_verified
          ? ` Their verification${fmtShort(signer.otp_verified_at) ? ` on ${fmtShort(signer.otp_verified_at)}` : ''} stays in the OTP activity log and the signing report.`
          : ' This change is recorded in the OTP activity log.'}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <SecondaryButton onClick={() => setPanel({ email: signer.email, mode: 'sms' })} disabled={!!busy} sx={{ minHeight: 32 }}>Keep SMS code</SecondaryButton>
        <PrimaryButton tone="danger" onClick={() => turnOffSms(signer)} loading={busy === 'off'} sx={{ ...PILL_COMPACT }}>Turn off SMS code</PrimaryButton>
      </Box>
    </Box>
  );

  // --- Render -----------------------------------------------------------------
  return (
    <>
      <Dialog open={!!open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="doc-details-title">
        <DialogHeader id="doc-details-title" icon={<FaFileAlt />} title="Document details" subtitle={doc.title} onClose={onClose} />

        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2, maxHeight: '70vh' }}>
          {alert && (
            <Box sx={{ mb: 1.5 }}>
              <SimpleAlert openAlert alertMsg={alert.message} alertSeverity={alert.severity} />
            </Box>
          )}

          <PropertyRow label="Owner">
            <PropertyValue>{doc.owner}{isOwner ? ' (you)' : ''}</PropertyValue>
          </PropertyRow>
          {fmt(doc.docdate) && <PropertyRow label="Sent"><PropertyValue>{fmt(doc.docdate)}</PropertyValue></PropertyRow>}
          {completed && fmt(doc.signeddate) && <PropertyRow label="Completed"><PropertyValue>{fmt(doc.signeddate)}</PropertyValue></PropertyRow>}
          <PropertyRow label="Status">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
              <StatusChip tone={status.tone}>{status.label}</StatusChip>
              {inProgress && signers.length > 0 && (
                <Typography component="span" sx={{ fontSize: 12, color: '#6D7386' }}>{signedCount} of {signers.length} signed</Typography>
              )}
            </Box>
          </PropertyRow>
          {voided && doc.voided_by && (
            <>
              <PropertyRow label="Voided by">
                <PropertyValue>
                  {doc.voided_by.by ? (
                    <>
                      {doc.voided_by.by}
                      <Box component="span" sx={{ color: '#6D7386' }}>
                        {doc.voided_by.role === 'owner' ? ' · sender, recalled it' : doc.voided_by.role === 'signer' ? ' · signer, declined to sign' : ''}
                      </Box>
                    </>
                  ) : <Box component="span" sx={{ color: '#9ca3af' }}>Not recorded</Box>}
                </PropertyValue>
              </PropertyRow>
              {fmt(doc.voided_by.at) && <PropertyRow label="Voided on"><PropertyValue>{fmt(doc.voided_by.at)}</PropertyValue></PropertyRow>}
              {doc.voided_by.reason && <PropertyRow label="Reason" alignTop><PropertyValue>{doc.voided_by.reason}</PropertyValue></PropertyRow>}
            </>
          )}
          <PropertyRow label="Document ID"><PropertyValue mono>{doc.guid}</PropertyValue></PropertyRow>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 2, mb: 1, px: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Signers ({signers.length})</Typography>
            {signers.length > 1 && (
              <Typography sx={{ fontSize: 12, color: '#6D7386' }}>· {signedCount} signed</Typography>
            )}
            {manySigners && (
              <TextField
                size="small"
                value={signerQuery}
                onChange={(e) => setSignerQuery(e.target.value)}
                placeholder="Find a signer"
                inputProps={{ 'aria-label': 'Find a signer' }}
                InputProps={{ startAdornment: <FaSearch size={11} color="#9aa3b2" style={{ marginRight: 8 }} /> }}
                sx={{ ml: { sm: 'auto' }, width: { xs: '100%', sm: 210 }, '& .MuiInputBase-root': { fontSize: 12.8, minHeight: 32 }, '& .MuiInputBase-input': { py: '5px' } }}
              />
            )}
          </Box>
          {signers.length === 0 ? (
            <Typography sx={{ fontSize: 12.5, color: '#9ca3af', px: 0.5 }}>No signers on this document.</Typography>
          ) : (
            <>
            {visibleSigners.length === 0 && (
              <Typography sx={{ fontSize: 12.5, color: '#9ca3af', px: 0.5, py: 1 }}>No signer matches "{signerQuery}".</Typography>
            )}
            <Box sx={{ border: visibleSigners.length ? '1px solid #e5e7eb' : 0, borderRadius: 1.5, overflow: 'hidden' }}>
              {visibleSigners.map(({ s, index }, row) => {
                const open_ = panel && panel.email === s.email ? panel.mode : null;
                const editable = canManage && !isTrue(s.signed);
                return (
                  <Box
                    key={s.uid || s.email}
                    sx={{
                      px: 1.25, py: open_ ? 1.25 : '6px', minHeight: 40, boxSizing: 'border-box', borderTop: row ? '1px solid #f3f4f6' : 'none',
                      bgcolor: open_ === 'confirmOff' ? '#fdf3f2' : open_ || (isTrue(s.current_signer) && !isTrue(s.signed)) ? '#f7faff' : 'transparent',
                      display: 'flex', flexDirection: 'column', gap: open_ ? 1.5 : 0,
                    }}
                  >
                    {/* One line per signer (about 40px); the buttons drop below on phones. */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                      <Box component="span" sx={numberBadge(s)}>{index + 1}</Box>
                      <Typography noWrap title={s.email} sx={{ flex: { xs: '1 1 calc(100% - 32px)', sm: '1 1 120px' }, minWidth: 0, fontSize: 13, fontWeight: 500, color: open_ === 'substitute' ? '#6D7386' : '#111827', textDecoration: open_ === 'substitute' ? 'line-through' : 'none' }}>
                        {s.email}
                      </Typography>
                      <Box sx={{ display: 'flex' }}><SignerChips signer={s} /></Box>
                      {editable && !panel && (
                        <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0, ml: { xs: 'auto', sm: 0 } }}>
                          <Tooltip title={s.otp ? 'Change the number or turn off the SMS code' : 'Ask this signer for an SMS code before signing'}>
                            <Button onClick={() => openPanel(s, 'sms')} sx={SMALL_BTN}>{s.otp ? 'SMS code' : 'Add SMS code'}</Button>
                          </Tooltip>
                          <Tooltip title="Replace this signer with someone else">
                            <Button onClick={() => openPanel(s, 'substitute')} sx={SMALL_BTN}>Substitute</Button>
                          </Tooltip>
                        </Box>
                      )}
                      {open_ && (
                        <Typography sx={{ fontSize: 12, color: '#1a3a7a', fontWeight: 500, flexShrink: 0 }}>
                          {open_ === 'substitute' ? 'Substituting' : 'SMS code'}
                        </Typography>
                      )}
                    </Box>
                    {open_ === 'substitute' && substitutePanel(s)}
                    {open_ === 'sms' && smsPanel(s)}
                    {open_ === 'confirmOff' && confirmOffPanel(s)}
                  </Box>
                );
              })}
            </Box>
            {collapsible && !signerQuery.trim() && (
              <Button
                size="small"
                onClick={() => setShowAllSigners((v) => !v)}
                sx={{ mt: 0.75, textTransform: 'none', fontSize: 12.5, color: '#2757aa', px: 0.5, minWidth: 0 }}
              >
                {showAllSigners ? 'Show fewer' : `Show all ${signers.length} signers`}
              </Button>
            )}
            </>
          )}
        </DialogContent>

        <DialogFooter>
          {/* Wraps onto two lines on narrow screens instead of running off the edges. */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
          {panel ? (
            <>
              <Typography sx={{ flex: '1 1 auto', fontSize: 12, color: '#6D7386' }}>Finish or cancel the change to use the other actions.</Typography>
              <SecondaryButton onClick={onClose} disabled={!!busy}>Close</SecondaryButton>
            </>
          ) : (
            <>
              {canRecall && (
                <Button
                  onClick={() => { setReason(''); setRecallOpen(true); }} disabled={!!busy} startIcon={<FaBan />}
                  sx={{ ...PILL_COMPACT, color: '#b42318', bgcolor: 'transparent', border: 0, '&:hover': { bgcolor: '#fdecea' } }}
                >
                  {recallLabel}
                </Button>
              )}
              <Box sx={{ flex: '1 1 auto' }} />
              <SecondaryButton onClick={onClose} disabled={!!busy}>Close</SecondaryButton>
              {canResend && (
                <Tooltip title={current ? `Email the signing link to ${current.email} again` : 'Email the signing request again'}>
                  <span>
                    <Button onClick={resend} disabled={!!busy} startIcon={<FaPaperPlane />} sx={{ ...PILL_OUTLINE }}>
                      {busy === 'resend' ? 'Resending…' : 'Resend'}
                    </Button>
                  </span>
                </Tooltip>
              )}
              <PrimaryButton startIcon={<FaDownload />} onClick={download} disabled={!doc.guid || !!busy}>Download</PrimaryButton>
            </>
          )}
          </Box>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={recallOpen}
        icon={<FaBan />}
        title={type === 'outbox' ? 'Recall this document?' : 'Void this document?'}
        tone="danger"
        confirmLabel={recallLabel}
        cancelLabel="Keep document"
        busy={busy === 'recall'}
        onCancel={() => setRecallOpen(false)}
        onConfirm={recall}
        message={(
          <>
            <strong>{doc.title}</strong> will be voided.
            {signers.length - signedCount > 0 && ` ${signers.length - signedCount === 1 ? 'The signer who hasn\'t' : `The ${signers.length - signedCount} signers who haven't`} signed yet can no longer open it.`}
            {' '}This can't be undone.
          </>
        )}
      >
        <Box sx={{ px: 1 }}>
          <Typography component="label" htmlFor="dd-recall-reason" sx={labelSx}>Reason (optional, recorded in the activity log)</Typography>
          <TextField
            id="dd-recall-reason" fullWidth multiline minRows={3} value={reason} inputProps={{ maxLength: 300 }}
            onChange={(e) => setReason(e.target.value)} disabled={busy === 'recall'} sx={fieldSx()}
          />
        </Box>
      </ConfirmDialog>
    </>
  );
}
