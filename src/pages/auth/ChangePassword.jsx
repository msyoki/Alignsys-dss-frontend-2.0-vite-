import React, { useContext, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Authcontext from '../../context/Authcontext.jsx';
import * as constants from '../../components/constants/constants';
import {
  AuthLayout, Checklist, Field, Heading, StrengthMeter, rulesMet,
} from '../../components/auth/AuthUi';

/**
 * Choose your own password. Required after signing in with a temporary (emailed)
 * password: the app and the server allow nothing else until it's done. Also
 * usable any time to change your password.
 */
const ChangePassword = () => {
  const { user, authTokens, logoutUser, updateClaims } = useContext(Authcontext);
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  if (!user) return <Navigate to="/login" replace />;
  const forced = Boolean(user.must_change_password);
  const ready = current && rulesMet(password, confirm);
  const mismatch = confirm.length > 0 && password !== confirm && confirm.length >= password.length;

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      await axios.post(`${constants.devApiBaseUrl}/api/password/change/`,
        { current_password: current, new_password: password },
        { headers: { Authorization: `Bearer ${authTokens?.access}` } });
      updateClaims?.({ must_change_password: false, first_login: false });
      navigate('/', { replace: true, state: { openalert: true, alertmsg: 'Your password has been changed.', alertseverity: 'success' } });
    } catch (err) {
      const data = err.response?.data || {};
      setFieldErrors(data.fields || {});
      setError(data.fields ? '' : (data.detail || data.error || 'Your password could not be changed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const firstName = (user.first_name && user.first_name !== 'None') ? user.first_name : '';
  return (
    <AuthLayout
      headline={forced ? `Welcome to Alignsys${firstName ? `, ${firstName}` : ''}.` : undefined}
      sub={forced ? `Your administrator${user.company ? ` at ${user.company}` : ''} created this account. Choose a password to finish setting it up.` : undefined}
    >
      <form className="auth-card" onSubmit={submit} noValidate>
        <Heading title={forced ? 'Choose your password' : 'Change password'}>
          {forced
            ? 'You signed in with the temporary password from your email. Choose your own to continue; the temporary one then stops working.'
            : 'Enter your current password, then choose a new one.'}
        </Heading>
        {error && <div className="auth-alert error" role="alert">{error}</div>}
        <Field
          label={forced ? 'Temporary password' : 'Current password'} password autoComplete="current-password" autoFocus
          value={current} onChange={(e) => setCurrent(e.target.value)} disabled={busy} error={fieldErrors.current_password}
          hint={forced ? 'The one from your email. Already filled in if your browser saved it when you signed in.' : undefined}
        />
        <Field
          label="New password" password autoComplete="new-password" value={password}
          onChange={(e) => setPassword(e.target.value)} disabled={busy} error={fieldErrors.new_password}
          after={<StrengthMeter password={password} />}
        />
        <Field
          label="Confirm new password" password autoComplete="new-password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} disabled={busy}
          error={mismatch ? "The passwords don't match yet." : ''}
        />
        <Checklist password={password} confirm={confirm} />
        <button type="submit" className="auth-btn" disabled={!ready || busy}>
          {busy ? 'Saving…' : forced ? 'Save and continue' : 'Change password'}
        </button>
        {forced ? (
          <button type="button" className="auth-link" onClick={logoutUser}>Sign out</button>
        ) : (
          <button type="button" className="auth-link" onClick={() => navigate(-1)}>Cancel</button>
        )}
      </form>
    </AuthLayout>
  );
};

export default ChangePassword;
