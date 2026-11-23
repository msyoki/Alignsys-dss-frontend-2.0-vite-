// Shown once an organisation or individual registration is accepted:
// what was received, where the confirmation went, and what happens next.
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Icons } from '../auth/AuthUi.jsx';
import '../../styles/AuthPages.css';

const COPY = {
  organization: {
    title: () => 'Registration received',
    lead: (name, email) => (
      <>We've received the registration for <strong>{name}</strong> and sent a confirmation to <strong>{email}</strong>.</>
    ),
    review: 'We review your organisation',
    last: 'The admin gets a "Set your password" email',
    lastSub: 'Sign in, then add your team',
  },
  individual: {
    title: (name) => (name ? `Request received, ${name}` : 'Request received'),
    lead: (_name, email) => <>We've sent a confirmation to <strong>{email}</strong>.</>,
    review: 'We review your request',
    last: 'You get a "Set your password" email',
    lastSub: 'Choose a password, then sign in',
  },
};

const RegistrationCompleteDialog = ({ open, onClose, kind = 'organization', name, email }) => {
  const navigate = useNavigate();
  const phone = useMediaQuery('(max-width:480px)');
  const copy = COPY[kind] || COPY.organization;

  const backToSignIn = () => {
    onClose?.();
    navigate('/login');
  };

  return (
    <Dialog
      open={open}
      onClose={backToSignIn}
      fullWidth
      maxWidth={false}
      aria-labelledby="reg-complete-title"
      PaperProps={{
        className: 'reg-complete',
        sx: { maxWidth: 440, m: phone ? 2 : 4, borderRadius: '16px' },
      }}
    >
      <div className="reg-complete-badge">{Icons.check(28)}</div>
      <div>
        <h2 id="reg-complete-title" className="auth-title">{copy.title(name)}</h2>
        <p className="auth-lead">{copy.lead(name, email)}</p>
      </div>
      <ol className="reg-steps" aria-label="What happens next">
        <li className="done">
          <span className="reg-step-dot">{Icons.check(14)}</span>
          <span>Confirmation email sent</span>
        </li>
        <li>
          <span className="reg-step-dot">2</span>
          <span>{copy.review}<small>Usually within 24 hours</small></span>
        </li>
        <li>
          <span className="reg-step-dot">3</span>
          <span>{copy.last}<small>{copy.lastSub}</small></span>
        </li>
      </ol>
      <p className="auth-hint" style={{ margin: 0 }}>No email in a few minutes? Check your spam or junk folder.</p>
      <button type="button" className="auth-btn" onClick={backToSignIn} autoFocus>
        Back to sign in
      </button>
    </Dialog>
  );
};

export default RegistrationCompleteDialog;
