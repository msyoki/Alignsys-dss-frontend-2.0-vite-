import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocument, getOtpAvailability } from './api';
import { adoptTokensFromUrl, hasSession, readTokens, startSessionKeepAlive } from './auth';
import { LoadingScreen, ErrorScreen } from './components/StatusScreens';
import SentScreen from './components/SentScreen';
import Editor from './components/Editor';
import Overview from './components/Overview';
import './SendForOthers.css';

// M-Files "send for others" integration page (public route, no DSS app login).
// Link format (values URL-encoded):
//   /integration/sendforothers/{guid}?token=<DSS access jwt>[&refresh=<DSS refresh jwt>]&signers=a@x.com,b@y.com&name=<document name>
// ?signer=a@x.com&signer=b@y.com also works. The tokens are moved to sessionStorage and removed from the URL.
// Optional SMS verification (OTP) per signer is off until the sender switches it on.
// The link may suggest numbers, used to pre-fill the field when they do:
//   &phones=a@x.com:+254712345678,b@y.com:+254733000000   (or repeated &phone=a@x.com:+254712345678)
// All styles are scoped under .sfo-app so nothing leaks into the rest of the DSS app.

const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

// Returns { emails, invalid }: trimmed, de-duplicated (case-insensitive), in link order.
const readSigners = () => {
  const params = new URLSearchParams(window.location.search);
  const raw = [...(params.get('signers') || '').split(','), ...params.getAll('signer')];
  const seen = new Set();
  const emails = [];
  const invalid = [];
  for (const item of raw) {
    const email = item.trim();
    const key = email.toLowerCase();
    if (!email || seen.has(key)) continue;
    seen.add(key);
    (EMAIL_RE.test(email) ? emails : invalid).push(email);
  }
  return { emails, invalid };
};

// { email: phone } from the link (see above); only for signers in the link.
const readPhones = (emails) => {
  const params = new URLSearchParams(window.location.search);
  const raw = [...(params.get('phones') || '').split(','), ...params.getAll('phone')];
  const byKey = new Map(emails.map((e) => [e.toLowerCase(), e]));
  const phones = {};
  for (const item of raw) {
    const i = item.lastIndexOf(':');
    if (i <= 0) continue;
    const email = byKey.get(item.slice(0, i).trim().toLowerCase());
    const phone = item.slice(i + 1).trim().replace(/[\s-]/g, '');
    if (email && phone) phones[email] = phone.startsWith('+') ? phone : `+${phone}`;
  }
  return phones;
};

// Document name for display. A name sent without URL-encoding is cut at its first '#'
// (e.g. "AP#18"); the rest lands in the fragment, so it is joined back on.
const readName = () => {
  let name = new URLSearchParams(window.location.search).get('name') || '';
  const hash = window.location.hash.replace(/^#/, '');
  if (name && hash && !hash.includes('=')) {
    try { name += `#${decodeURIComponent(hash)}`; } catch { name += `#${hash}`; }
  }
  return name.trim();
};

// Remembered per tab so a reload after sending shows the confirmation instead of the editor.
const sentKey = (guid) => `dss_sent_${guid}`;
const readSent = (guid) => {
  try { return JSON.parse(sessionStorage.getItem(sentKey(guid)) || 'null'); } catch { return null; }
};
const saveSent = (guid, data) => {
  try { sessionStorage.setItem(sentKey(guid), JSON.stringify(data)); } catch { /* storage unavailable */ }
};

const initialState = (guid, signers) => {
  if (!guid) return { status: 'error', title: 'This link is incomplete', message: 'The document reference is missing from the link. Open it again from M-Files.' };
  const sent = readSent(guid);
  if (sent) return { status: 'sent', sent };
  if (signers.invalid.length) {
    return { status: 'error', title: 'Some signer addresses are not valid', message: `Check these in M-Files and open the link again: ${signers.invalid.join(', ')}` };
  }
  if (!signers.emails.length) {
    return { status: 'error', title: 'No signers found', message: 'The link has no signers. Add signers in M-Files and open the link again.' };
  }
  // No sign-in page: sending uses the DSS token M-Files put in the link. Check it before any work is done.
  if (!hasSession()) {
    return readTokens()?.access
      ? { status: 'error', title: 'This link has expired', message: 'Open the document again from M-Files to get a fresh link.' }
      : { status: 'error', title: 'This link is missing its DSS sign-in', message: 'Open the document again from M-Files. If this keeps happening, ask your administrator to check the M-Files integration.' };
  }
  return { status: 'loading' };
};

export default function SendForOthersPage() {
  // First: take the DSS tokens out of the link (before anything else reads the URL or the session).
  useState(() => { adoptTokensFromUrl(); return true; });
  const { guid: routeGuid } = useParams();
  const [guid] = useState(() => (routeGuid || '').trim());
  const [signers] = useState(readSigners);
  const [name] = useState(readName);
  const [state, setState] = useState(() => initialState(guid, signers));
  const [attempt, setAttempt] = useState(0);
  // 'overview' first; 'editor' once they choose to set signing areas. The editor stays mounted
  // (hidden) after that, so going back and forth keeps the boxes they placed.
  const [view, setView] = useState('overview');
  const [editorOpened, setEditorOpened] = useState(false);
  const [message, setMessage] = useState('');
  const [boxTotal, setBoxTotal] = useState(0);
  // SMS verification: { email: phone } for signers the sender switched it on for (off for
  // everyone until they do); shared by both screens. Numbers from the link are only
  // suggestions that pre-fill the field when the sender turns it on.
  const [phones, setPhones] = useState({});
  const [suggestedPhones] = useState(() => readPhones(signers.emails));
  // available: true | false | null (couldn't tell: SMS codes stay allowed, the server checks on send)
  const [otp, setOtp] = useState({ loading: true, available: null, code: null });

  // Keep the DSS session from the link alive until the document is sent (or the page fails).
  const keepAlive = state.status === 'loading' || state.status === 'ready';
  useEffect(() => (keepAlive ? startSessionKeepAlive() : undefined), [keepAlive]);

  // Can this organisation use SMS verification? (Checked once the session is known to be valid.)
  useEffect(() => {
    if (state.status !== 'ready' || !otp.loading) return;
    getOtpAvailability().then((info) => {
      setOtp({ loading: false, ...info });
      if (info.available === false) setPhones({});
    });
  }, [state.status, otp.loading]);

  // Load the PDF from DSS; the signers come from the link.
  useEffect(() => {
    if (!guid || state.status !== 'loading') return undefined;
    const ctrl = new AbortController();
    getDocument(guid, ctrl.signal)
      .then((pdfBase64) => {
        setState({ status: 'ready', signers: signers.emails, pdfBase64 });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setState({ status: 'error', title: "Couldn't load the document", message: err.message, retry: true });
      });
    return () => ctrl.abort();
  }, [guid, signers, state.status, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);

  const onSent = useCallback((signers) => {
    const sent = { signers, at: new Date().toISOString() };
    saveSent(guid, sent);
    setState({ status: 'sent', sent });
  }, [guid]);

  let content;
  switch (state.status) {
    case 'loading': content = <LoadingScreen text="Loading document…" />; break;
    case 'error': content = <ErrorScreen title={state.title} message={state.message} onRetry={state.retry ? retry : undefined} />; break;
    case 'sent': content = <SentScreen signers={state.sent.signers} />; break;
    default: {
      const shared = {
        guid, name, signerEmails: state.signers, pdfBase64: state.pdfBase64, message, onMessageChange: setMessage, onSent,
        phones, onPhonesChange: setPhones, suggestedPhones, otp,
      };
      content = (
        <>
          <div hidden={view !== 'overview'}>
            <Overview
              {...shared}
              boxTotal={boxTotal}
              onSetAreas={() => { setEditorOpened(true); setView('editor'); }}
            />
          </div>
          {editorOpened && (
            <div hidden={view !== 'editor'}>
              <Editor {...shared} onBoxesChange={setBoxTotal} onBack={() => setView('overview')} />
            </div>
          )}
        </>
      );
    }
  }
  return <div className="sfo-app">{content}</div>;
}
