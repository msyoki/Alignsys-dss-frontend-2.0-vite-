import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as constants from '../../components/constants/constants';
import {
  AuthLayout, Badge, Checklist, Field, Heading, Icons, StrengthMeter, rulesMet,
} from '../../components/auth/AuthUi';

// Answers from /api/password_reset_confirm/ that mean the link itself is no good.
const LINK_ERRORS = ['Invalid token', 'Invalid data'];

/**
 * Opened from a reset email, or a new account's welcome email (?welcome=1):
 * set a password, then "Password updated" / "Your account is ready", or "Link expired".
 */
const PasswordResetConfirm = () => {
  const { uid, token } = useParams();
  const [params] = useSearchParams();
  const welcome = params.get('welcome') === '1';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState('form'); // form | done | expired
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ready = rulesMet(password, confirm);
  // Only once they've typed as much as the password, not on every keystroke.
  const mismatch = confirm.length > 0 && password !== confirm && confirm.length >= password.length;

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      await axios.post(`${constants.devApiBaseUrl}/api/password_reset_confirm/`, { uidb64: uid, token, new_password: password });
      setState('done');
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (LINK_ERRORS.includes(msg)) setState('expired');
      else setError(msg || 'Your password could not be saved. Please try again.'); // e.g. a password rule from the server
    } finally {
      setBusy(false);
    }
  };

  if (state === 'done') {
    return (
      <AuthLayout>
        <section className="auth-card center" aria-live="polite">
          <Badge tone="green" round>{Icons.check(32)}</Badge>
          {welcome
            ? <Heading title="Your account is ready">Sign in with your email and the password you just chose.</Heading>
            : <Heading title="Password updated">You can now sign in with your new password. The reset link can&apos;t be used again.</Heading>}
          <Link to="/login" className="auth-btn">Sign in</Link>
        </section>
      </AuthLayout>
    );
  }

  if (state === 'expired') {
    return (
      <AuthLayout>
        <section className="auth-card" aria-live="polite">
          <Badge tone="amber">{Icons.clock()}</Badge>
          <Heading title="This link has expired">
            {welcome
              ? 'Set-password links work once and expire after 3 days. Request a new one with your email address: it works the same way.'
              : 'Reset links work only once and only for a limited time. If you asked for more than one, use the most recent email.'}
          </Heading>
          <Link to="/password-reset" className="auth-btn">Request a new link</Link>
          <Link to="/login" className="auth-link">{Icons.back(16)} Back to sign in</Link>
        </section>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      headline={welcome ? 'Welcome to Alignsys.' : undefined}
      sub={welcome ? 'Your administrator created an account for you. Choose a password to finish setting it up.' : undefined}
    >
      <form className="auth-card" onSubmit={submit} noValidate>
        <Heading title={welcome ? 'Set your password' : 'Set a new password'}>Choose a password you don&apos;t use for other sites.</Heading>
        <Field
          label="New password" password autoComplete="new-password" autoFocus value={password}
          onChange={(e) => setPassword(e.target.value)} disabled={busy} error={error}
          after={<StrengthMeter password={password} />}
        />
        <Field
          label="Confirm new password" password autoComplete="new-password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} disabled={busy}
          error={mismatch ? "The passwords don't match yet." : ''}
        />
        <Checklist password={password} confirm={confirm} />
        <button type="submit" className="auth-btn" disabled={!ready || busy}>{busy ? 'Saving…' : welcome ? 'Save password' : 'Save new password'}</button>
      </form>
    </AuthLayout>
  );
};

export default PasswordResetConfirm;
