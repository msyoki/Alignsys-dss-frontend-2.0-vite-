import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PILL_OUTLINE } from './common/pillButton';
import { DialogHeader, PrimaryButton } from './common/dialogKit';
import { BRAND } from './layout/shellTheme';
import {
  FaLock, FaUnlockAlt, FaMobileAlt, FaRedoAlt, FaClock, FaExclamationTriangle, FaCheckCircle, FaPaperPlane,
} from 'react-icons/fa';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { styled } from '@mui/system';
import CircularProgress from '@mui/material/CircularProgress';
import { Button, Box, Typography } from '@mui/material';

import Alert from '../components/Alert';
import {
  getOtpStatus, sendOtp, verifyOtp, getVerifiedToken, saveVerifiedToken, otpError,
} from '../api/otp';

// One digit box. Sized to fit six across a 320px phone.
const InputField = styled('input')({
  width: 'clamp(38px, 11vw, 48px)',
  height: 'clamp(46px, 13vw, 54px)',
  fontSize: '1.4rem',
  fontWeight: 600,
  color: '#1f2937',
  backgroundColor: '#fff',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  textAlign: 'center',
  caretColor: BRAND.primary,
  transition: 'border-color .15s ease, box-shadow .15s ease, background-color .15s ease',
  '&:hover': { borderColor: '#9ca3af' },
  '&:focus': {
    outline: 'none',
    borderColor: BRAND.primary,
    boxShadow: `0 0 0 3px ${BRAND.primary}33`,
  },
  '&[data-filled="true"]': { borderColor: BRAND.primary, backgroundColor: BRAND.surfaceLight },
  '&:disabled': { opacity: 0.6 },
});

// Small status line under the code boxes.
const Note = ({ tone = 'muted', icon, children }) => {
  const tones = {
    muted: { color: '#6b7280', bg: 'transparent', border: 'transparent' },
    warning: { color: '#8a6100', bg: '#fff8e1', border: '#ffe082' },
  };
  const t = tones[tone];
  return (
    <Box role="status" sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
      fontSize: 12.5, color: t.color, bgcolor: t.bg, border: `1px solid ${t.border}`,
      borderRadius: '8px', px: tone === 'muted' ? 0 : 1.25, py: tone === 'muted' ? 0 : 0.75,
      textAlign: 'left', width: tone === 'muted' ? 'auto' : '100%',
    }}>
      {icon && <Box component="span" aria-hidden sx={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</Box>}
      <span>{children}</span>
    </Box>
  );
};

// Round icon badge at the top of each state.
const Badge = ({ children, tone = 'primary' }) => {
  const c = tone === 'success' ? { fg: '#2e7d32', bg: '#e8f5e9' } : tone === 'warning' ? { fg: '#b45309', bg: '#fff4e5' } : { fg: BRAND.primary, bg: BRAND.surfaceLight };
  return (
    <Box aria-hidden sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: c.bg, color: c.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, mb: 1.5 }}>
      {children}
    </Box>
  );
};

const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? `0${s}` : s}`;
};

// The server decides everything (expiry, cooldowns, limits); this dialog only
// displays its answers, so refreshing the page never sends another SMS.
//
// Props: opendialogotp, setOpenDialogOtp, signerguid, otpphone (fallback for
// the masked number) and the shared alert props.
const OtpDialog = (props) => {
  const { opendialogotp, setOpenDialogOtp, signerguid } = props;

  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState('loading'); // loading | ready | verifying | verified | unavailable | error
  const [codeSent, setCodeSent] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [sendsRemaining, setSendsRemaining] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputsRef = useRef([]);

  const showAlert = useCallback((msg, severity) => {
    if (!props.setAlertMsg) return;
    props.setAlertMsg(msg);
    props.setAlertSeverity(severity);
    props.setOpenAlert(true);
    setTimeout(() => props.setOpenAlert(false), 3000);
  }, [props.setAlertMsg, props.setAlertSeverity, props.setOpenAlert]);

  const applyState = (data) => {
    if (typeof data.code_active === 'boolean') setCodeSent(data.code_active);
    if (typeof data.expires_in === 'number') setExpiresIn(data.expires_in);
    if (typeof data.resend_in === 'number') setResendIn(data.resend_in);
    if (typeof data.retry_in === 'number') setResendIn(data.retry_in);
    if (typeof data.sends_remaining === 'number') setSendsRemaining(data.sends_remaining);
    if (typeof data.attempts_remaining === 'number') setAttemptsRemaining(data.attempts_remaining);
    if (data.phone_masked || data.recepient) setMaskedPhone(data.phone_masked || data.recepient);
  };

  const unlock = useCallback(() => {
    setPhase('verified');
    setTimeout(() => setOpenDialogOtp(false), 1500);
  }, [setOpenDialogOtp]);

  // Ask the server what to show whenever the dialog opens. Sends nothing.
  useEffect(() => {
    if (!opendialogotp || !signerguid) return;
    let cancelled = false;
    setPhase('loading');
    getOtpStatus(signerguid, getVerifiedToken(signerguid))
      .then((data) => {
        if (cancelled) return;
        if (!data.otp_required || data.verified) {
          setOpenDialogOtp(false);
          return;
        }
        applyState(data);
        if (!data.otp_available) {
          setNotice(data.unavailable_message || 'OTP verification is currently unavailable for this document.');
          setPhase('unavailable');
          return;
        }
        setPhase('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setNotice(otpError(err, 'Could not load the verification step. Please refresh the page.').message);
        setPhase('error');
      });
    return () => { cancelled = true; };
  }, [opendialogotp, signerguid, setOpenDialogOtp]);

  // One ticking clock for the expiry and resend countdowns.
  useEffect(() => {
    if (!opendialogotp || (expiresIn <= 0 && resendIn <= 0)) return undefined;
    const timer = setInterval(() => {
      setExpiresIn((v) => Math.max(0, v - 1));
      setResendIn((v) => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [opendialogotp, expiresIn > 0, resendIn > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (codeSent && expiresIn === 0 && phase === 'ready') {
      setCodeSent(false);
      setOtp('');
      setNotice('Your code has expired. Request a new one.');
    }
  }, [codeSent, expiresIn, phase]);

  const requestCode = async (resend) => {
    if (sending) return;
    setSending(true);
    setNotice('');
    try {
      const data = await sendOtp(signerguid, { resend });
      applyState(data);
      setCodeSent(true);
      setOtp('');
      setActiveIndex(0);
      showAlert(data.already_sent ? 'A code was already sent. Enter it below.' : 'OTP sent successfully!', 'success');
    } catch (err) {
      const e = otpError(err, 'Failed to send OTP. Please try again.');
      applyState(e.data);
      setNotice(e.message);
      showAlert(e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const validateOTP = async () => {
    if (otp.length !== 6) {
      showAlert('Please enter the complete 6-digit OTP', 'error');
      return;
    }
    setPhase('verifying');
    try {
      const data = await verifyOtp(signerguid, otp);
      saveVerifiedToken(signerguid, data.token);
      unlock();
    } catch (err) {
      const e = otpError(err, 'Invalid OTP code!');
      applyState(e.data);
      setOtp('');
      setActiveIndex(0);
      if (['code_expired', 'too_many_attempts', 'no_active_code'].includes(e.code)) {
        setCodeSent(false);
        setExpiresIn(0);
      }
      setNotice(e.message);
      showAlert(e.message, 'error');
      setPhase('ready');
    }
  };

  // --- Code input -----------------------------------------------------------
  const handleChange = (e, i) => {
    const digits = otp.split('');
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    digits[i] = val;
    setOtp(digits.join('').slice(0, 6));
    if (val && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputsRef.current[i - 1]?.focus();
    else if (e.key === 'ArrowLeft' && i > 0) inputsRef.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < 5) inputsRef.current[i + 1]?.focus();
    else if (e.key === 'Enter' && otp.length === 6) validateOTP();
  };

  const handlePaste = (e) => {
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      e.preventDefault();
      setOtp(pasted);
      inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // Typing anywhere while the dialog is open fills the boxes (kept from the previous version).
  useEffect(() => {
    if (!opendialogotp || !codeSent || phase !== 'ready') return undefined;
    const handleGlobalKeyDown = (e) => {
      if (document.activeElement && inputsRef.current.includes(document.activeElement)) return;
      if (/^\d$/.test(e.key) && activeIndex < 6) {
        const digits = otp.split('');
        digits[activeIndex] = e.key;
        setOtp(digits.join(''));
        inputsRef.current[activeIndex]?.focus();
        setActiveIndex((prev) => Math.min(prev + 1, 5));
      } else if (e.key === 'Backspace' && activeIndex > 0) {
        const digits = otp.split('');
        digits[activeIndex - 1] = '';
        setOtp(digits.join(''));
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        inputsRef.current[activeIndex - 1]?.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [otp, activeIndex, opendialogotp, codeSent, phase]);

  const fallbackMask = props.otpphone ? `***** *** ${props.otpphone.slice(-3)}` : '*** *** ***';
  const phoneLabel = maskedPhone || fallbackMask;
  const noSendsLeft = sendsRemaining === 0;
  const canResend = !sending && resendIn === 0 && !noSendsLeft;
  const verifying = phase === 'verifying';

  const resendLabel = noSendsLeft
    ? 'No more codes available, try later'
    : resendIn > 0
      ? `Resend code in ${formatTime(resendIn)}`
      : `Resend code${sendsRemaining !== null ? ` · ${sendsRemaining} left` : ''}`;

  const renderBody = () => {
    if (phase === 'loading') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={36} sx={{ color: BRAND.primary }} />
          <Typography sx={{ mt: 2, fontSize: 14, color: '#6b7280' }}>Preparing verification…</Typography>
        </Box>
      );
    }
    if (phase === 'verified') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          <Badge tone="success"><FaCheckCircle /></Badge>
          <Typography sx={{ fontSize: 17, fontWeight: 600, color: '#1f2937' }}>Phone verified</Typography>
          <Typography sx={{ mt: 0.5, fontSize: 13.5, color: '#6b7280' }}>Opening your document…</Typography>
        </Box>
      );
    }
    if (phase === 'unavailable' || phase === 'error') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
          <Badge tone="warning"><FaExclamationTriangle /></Badge>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
            {phase === 'error' ? 'Something went wrong' : 'Verification unavailable'}
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 13.5, color: '#4b5563', maxWidth: 360 }}>{notice}</Typography>
          <Typography sx={{ mt: 1.5, fontSize: 12.5, color: '#6b7280' }}>
            Please contact the person who sent you this document.
          </Typography>
        </Box>
      );
    }

    // ready / verifying
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Badge>{codeSent ? <FaLock /> : <FaMobileAlt />}</Badge>
        <Typography sx={{ fontSize: 17, fontWeight: 600, color: '#1f2937' }}>
          {codeSent ? 'Enter your code' : 'Verify it\'s you'}
        </Typography>
        <Typography sx={{ mt: 0.75, fontSize: 13.5, color: '#4b5563', maxWidth: 340 }}>
          {codeSent ? 'We sent a 6-digit code by SMS to' : 'To open this document we\'ll send a 6-digit code by SMS to'}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, fontWeight: 600, color: BRAND.primary, letterSpacing: '.04em' }}>
          {phoneLabel}
        </Typography>

        {codeSent && (
          <Box
            onPaste={handlePaste}
            role="group"
            aria-label="6-digit code"
            sx={{ display: 'flex', justifyContent: 'center', gap: { xs: '6px', sm: '8px' }, mt: 2.5, mb: 1.5 }}
          >
            {[...Array(6)].map((_, i) => (
              <InputField
                key={i}
                maxLength={1}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${i + 1}`}
                value={otp[i] || ''}
                data-filled={otp[i] ? 'true' : 'false'}
                disabled={verifying}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                ref={(el) => (inputsRef.current[i] = el)}
              />
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%', mt: codeSent ? 0 : 2 }}>
          {codeSent && expiresIn > 0 && (
            <Note icon={<FaClock size={11} />}>Code expires in {formatTime(expiresIn)}</Note>
          )}
          {codeSent && attemptsRemaining !== null && attemptsRemaining < 5 && attemptsRemaining > 0 && (
            <Note>{attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} left</Note>
          )}
          {notice && <Note tone="warning" icon={<FaExclamationTriangle size={12} />}>{notice}</Note>}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, width: '100%', maxWidth: 320, mt: 2.5 }}>
          {codeSent ? (
            <>
              <PrimaryButton
                onClick={validateOTP}
                disabled={otp.length !== 6}
                loading={verifying}
                startIcon={<FaUnlockAlt size={13} />}
                sx={{ py: 1 }}
              >
                {verifying ? 'Verifying…' : 'Verify'}
              </PrimaryButton>
              <Button
                variant="text"
                onClick={() => requestCode(true)}
                disabled={!canResend || verifying}
                startIcon={sending ? <CircularProgress size={13} color="inherit" /> : <FaRedoAlt size={11} />}
                sx={{ ...PILL_OUTLINE, py: 0.9 }}
              >
                {sending ? 'Sending…' : resendLabel}
              </Button>
            </>
          ) : (
            <PrimaryButton
              onClick={() => requestCode(false)}
              disabled={noSendsLeft || resendIn > 0}
              loading={sending}
              startIcon={<FaPaperPlane size={12} />}
              sx={{ py: 1 }}
            >
              {sending ? 'Sending…' : resendIn > 0 ? `Send code (${formatTime(resendIn)})` : 'Send code'}
            </PrimaryButton>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={!!opendialogotp}
      fullWidth
      maxWidth="xs"
      aria-labelledby="otp-dialog-title"
      sx={{ '& .MuiDialog-paper': { mx: 2, width: 'calc(100% - 32px)' } }}
    >
      <DialogHeader
        id="otp-dialog-title"
        icon={phase === 'verified' ? <FaUnlockAlt /> : <FaLock />}
        title="Secure document"
        subtitle="Phone verification"
      />
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pt: '24px !important', pb: 3, textAlign: 'center' }}>
        {renderBody()}
        {/* The inline note already shows errors; only show alerts that add something new. */}
        {phase !== 'verified' && props.alertmsg !== notice && (
        <Alert
          alertseverity={props.alertseverity}
          alertmsg={props.alertmsg}
          openalert={props.openalert}
          setOpenAlert={props.setOpenAlert}
        />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OtpDialog;
