// Building blocks for the password pages (see styles/AuthPages.css).
import React, { useId, useState } from 'react';
import logoWhite from '../../images/ZFWHITE.png';
import '../../styles/AuthPages.css';

/** Brand panel on the left (stacks on top on phones), the page's card on the right. */
export const AuthLayout = ({ headline = 'Sign and send documents, wherever you work.', sub = 'Alignsys Digital Signing Service', below, children }) => (
  <div className="auth-page">
    <aside className="auth-brand">
      <img src={logoWhite} alt="Alignsys" />
      <div>
        <p className="auth-brand-headline">{headline}</p>
        <p className="auth-brand-sub">{sub}</p>
      </div>
      <p className="auth-brand-foot">© Alignsys</p>
    </aside>
    <main className="auth-main">
      {children}
      {below && <p className="auth-note-below">{below}</p>}
    </main>
  </div>
);

const svg = (children, size = 24, width = 2) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
export const Icons = {
  key: (s) => svg(<><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2 20 3" /><path d="m18 5 2 2" /><path d="m15 8 2 2" /></>, s),
  mail: (s) => svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>, s),
  check: (s) => svg(<path d="M20 6 9 17l-5-5" />, s, 2.5),
  clock: (s) => svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, s),
  info: (s) => svg(<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>, s),
  circle: (s) => svg(<circle cx="12" cy="12" r="9" />, s),
  back: (s) => svg(<><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>, s),
  eye: (s) => svg(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>, s),
  eyeOff: (s) => svg(<><path d="M3 3l18 18" /><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.8 17.8 0 0 1-3.2 4.1" /><path d="M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>, s),
};

export const Badge = ({ tone = 'blue', round = false, children }) => (
  <div className={`auth-badge ${tone}${round ? ' round' : ''}`}>{children}</div>
);

export const Heading = ({ title, children }) => (
  <div>
    <h1 className="auth-title">{title}</h1>
    {children && <p className="auth-lead">{children}</p>}
  </div>
);

/** Labelled input; `password` adds a show/hide button. Errors are announced and linked to the field. */
export const Field = ({ label, error, hint, password = false, value, onChange, onBlur, type = 'text', autoComplete, disabled, autoFocus, after }) => {
  const id = useId();
  const [shown, setShown] = useState(false);
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className={`auth-input-wrap${error ? ' invalid' : ''}`}>
        <input
          id={id} type={password ? (shown ? 'text' : 'password') : type} value={value} onChange={onChange} onBlur={onBlur}
          autoComplete={autoComplete} disabled={disabled} autoFocus={autoFocus}
          aria-invalid={Boolean(error)} aria-describedby={describedBy}
        />
        {password && (
          <button type="button" className="auth-eye" onClick={() => setShown((v) => !v)}
            aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
            {shown ? Icons.eyeOff(18) : Icons.eye(18)}
          </button>
        )}
      </div>
      {after}
      {error && <span id={`${id}-err`} className="auth-error" role="alert">{error}</span>}
      {hint && !error && <span id={`${id}-hint`} className="auth-hint">{hint}</span>}
    </div>
  );
};

// Client-side hints only; the server applies the real password rules.
export const passwordRules = (pw, confirm) => [
  { label: 'At least 8 characters', ok: pw.length >= 8 },
  { label: 'Not only numbers', ok: pw.length > 0 && !/^\d+$/.test(pw) },
  { label: 'Both passwords match', ok: confirm.length > 0 && pw === confirm },
];
export const rulesMet = (pw, confirm) => passwordRules(pw, confirm).every((r) => r.ok);

export const Checklist = ({ password, confirm, showServerRule = true }) => (
  <ul className="auth-checks" aria-label="Password requirements">
    {passwordRules(password, confirm).map((r) => (
      <li key={r.label} className={r.ok ? 'ok' : ''}>
        {r.ok ? Icons.check(16) : Icons.circle(16)}
        <span>{r.label}<span className="visually-hidden">{r.ok ? ' (done)' : ''}</span></span>
      </li>
    ))}
    {showServerRule && (
      <li className="info">{Icons.info(16)} Not a common password, and not like your name or email</li>
    )}
  </ul>
);

const STRENGTH = [
  { label: '', color: '#e5e7eb' },
  { label: 'Weak', color: '#b42318' },
  { label: 'Fair', color: '#b26a00' },
  { label: 'Good', color: '#2e7d32' },
  { label: 'Strong', color: '#1e6b30' },
];
export const strengthOf = (pw) => {
  if (!pw) return 0;
  let s = pw.length >= 8 ? 1 : 0;
  if (pw.length >= 12) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s += 1;
  return Math.max(1, Math.min(4, s));
};
export const StrengthMeter = ({ password }) => {
  const s = strengthOf(password);
  if (!password) return null;
  return (
    <div className="auth-strength" aria-live="polite">
      <div className="auth-strength-bars" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => <span key={i} style={{ background: i <= s ? STRENGTH[s].color : undefined }} />)}
      </div>
      <span className="auth-strength-label" style={{ color: STRENGTH[s].color }}>
        <span className="visually-hidden">Password strength: </span>{STRENGTH[s].label}
      </span>
    </div>
  );
};
