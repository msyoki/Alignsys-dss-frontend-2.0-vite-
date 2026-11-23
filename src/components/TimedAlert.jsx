// TimedAlert: top-right toast used across the app (dashboard, admin, login, dialogs).
//
//   <TimedAlert open onClose severity message setSeverity setMessage duration? />
//
// - Stays up long enough to read: errors and warnings 6 s, success and info 4 s, or `duration`.
//   A new message while one is showing restarts the timer.
// - Closes with its X or when the time is up; a click elsewhere on the page does not close it.
// - Keeps its text and colour while it fades out (they were cleared at once, so the toast
//   flashed empty); `setSeverity` / `setMessage` are reset after it has gone.
// - Soft, light colours (EDMS chip palette) instead of the strong filled ones.
import React, { useEffect, useRef } from 'react';
import { Snackbar, Alert } from '@mui/material';

const DEFAULT_MS = { error: 6000, warning: 6000, success: 4000, info: 4000 };

const TONES = {
  success: { bg: '#edf7ee', border: '#c8e6c9', fg: '#1e4620', icon: '#2e7d32' },
  error: { bg: '#fdeeec', border: '#f5c2c0', fg: '#7a1a12', icon: '#d32f2f' },
  warning: { bg: '#fff8e5', border: '#ffe082', fg: '#5f4400', icon: '#ed6c02' },
  info: { bg: '#edf4fc', border: '#c5d9ed', fg: '#1a3a7a', icon: '#2757aa' },
};

const TimedAlert = ({ open, onClose, severity = 'info', message = '', setSeverity, setMessage, duration }) => {
  // Callers pass a new onClose function on every render; keep the latest without restarting the timer.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const close = () => onCloseRef.current?.();

  // What is on screen: the latest message while open, kept as it was during the fade-out.
  const shownRef = useRef({ severity: 'info', message: '' });
  if (open && message) {
    shownRef.current = { severity: TONES[severity] ? severity : 'info', message };
  }
  const shown = shownRef.current;

  useEffect(() => {
    if (!open || !message) return undefined;
    const ms = duration ?? DEFAULT_MS[severity] ?? 4000;
    const timer = setTimeout(close, ms);
    return () => clearTimeout(timer);
  }, [open, message, severity, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const tone = TONES[shown.severity] || TONES.info;

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(open && message)}
      onClose={(_, reason) => { if (reason !== 'clickaway') close(); }}
      TransitionProps={{
        onExited: () => {
          setSeverity?.('');
          setMessage?.('');
        },
      }}
    >
      <Alert
        onClose={close}
        severity={shown.severity}
        variant="standard"
        sx={{
          bgcolor: tone.bg,
          color: tone.fg,
          border: `1px solid ${tone.border}`,
          borderRadius: 2,
          boxShadow: '0 6px 16px rgba(17, 24, 39, 0.12)',
          fontSize: 13,
          lineHeight: 1.5,
          alignItems: 'flex-start',
          maxWidth: 440,
          '& .MuiAlert-icon': { color: tone.icon, py: '9px' },
          '& .MuiAlert-message': { py: '8px', whiteSpace: 'pre-line', overflowWrap: 'anywhere' },
          '& .MuiAlert-action': { color: tone.fg, pt: '4px' },
        }}
      >
        {shown.message}
      </Alert>
    </Snackbar>
  );
};

export default TimedAlert;
