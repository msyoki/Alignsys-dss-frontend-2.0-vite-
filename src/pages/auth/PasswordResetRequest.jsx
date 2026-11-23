import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as constants from '../../components/constants/constants';
import { isValidEmail } from '../../utils/email';
import { AuthLayout, Badge, Field, Heading, Icons } from '../../components/auth/AuthUi';

const RESEND_WAIT = 45; // seconds before "Resend email" is available again

const requestReset = (email) =>
  axios.post(`${constants.devApiBaseUrl}/api/password_reset/`, { email }, { headers: { 'Content-Type': 'application/json' } });

/** Forgot password: ask for the email, then "Check your email" with a timed resend. */
const PasswordResetRequest = () => {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const trimmed = email.trim();
  const emailError = touched && trimmed && !isValidEmail(trimmed) ? 'Enter a valid email address, e.g. name@company.com.' : '';

  const send = async (e) => {
    e?.preventDefault?.();
    setTouched(true);
    if (!isValidEmail(trimmed)) return;
    setBusy(true);
    setError('');
    try {
      await requestReset(trimmed);
      setSent(true);
      setWait(RESEND_WAIT);
    } catch (err) {
      setError(err.response?.data?.error || 'We could not send the email right now. Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const startOver = () => { setSent(false); setError(''); setTouched(false); };
  const mmss = `${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, '0')}`;
  const back = <Link to="/login" className="auth-link">{Icons.back(16)} Back to sign in</Link>;

  if (sent) {
    return (
      <AuthLayout>
        <section className="auth-card" aria-live="polite">
          <Badge tone="green">{Icons.mail()}</Badge>
          <Heading title="Check your email">
            If an account exists for <strong>{trimmed}</strong>, we&apos;ve sent a link to choose a new password. The link works once.
          </Heading>
          <div className="auth-info">
            <span style={{ color: '#2757aa', flexShrink: 0, marginTop: 2 }}>{Icons.info(18)}</span>
            <span>Not there after a few minutes? Check your spam or junk folder, and make sure this is the address you registered with.</span>
          </div>
          {error && <div className="auth-alert error" role="alert">{error}</div>}
          <button type="button" className="auth-btn secondary" onClick={send} disabled={busy || wait > 0}>
            {busy ? 'Sending…' : wait > 0 ? `Resend email in ${mmss}` : 'Resend email'}
          </button>
          <div className="auth-links">
            {back}
            <button type="button" className="auth-link" onClick={startOver}>Use a different email</button>
          </div>
        </section>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout below="No longer have access to this email? Ask your organisation's administrator.">
      <form className="auth-card" onSubmit={send} noValidate>
        <Badge>{Icons.key()}</Badge>
        <Heading title="Forgot your password?">
          Enter the email you sign in with. We&apos;ll send you a link to choose a new password.
        </Heading>
        {error && <div className="auth-alert error" role="alert">{error}</div>}
        <Field
          label="Email" type="email" autoComplete="email" autoFocus value={email}
          onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} error={emailError} disabled={busy}
        />
        <button type="submit" className="auth-btn" disabled={busy || !trimmed}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
        {back}
      </form>
    </AuthLayout>
  );
};

export default PasswordResetRequest;
