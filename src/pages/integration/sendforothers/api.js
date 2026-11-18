// All network calls live here. Base URLs come from .env only, never from the link.
import { AUTH_URL, authFetch } from './auth';

const trimSlash = (s) => (s || '').replace(/\/+$/, '');
// DSS document API (dsscall): GET {VITE_CORP_URL}/api/Doc/FileDownload/{guid} returns the PDF file.
const DSS_URL = trimSlash(import.meta.env.VITE_CORP_URL);

const toBase64 = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};

// The PDF from the authenticated endpoint (token from the M-Files link), or null when that
// isn't possible (backend without it, session expired, not found there) so the caller can
// fall back to the public download.
async function getSecureDocument(guid, signal) {
  try {
    const res = await authFetch(`${AUTH_URL}/api/secure/download/${encodeURIComponent(guid)}/`, { headers: { accept: 'application/pdf' }, signal });
    if (res.ok) return new Uint8Array(await res.arrayBuffer());
    console.warn(`[integration] secure download answered ${res.status}; using the public endpoint`);
  } catch (err) {
    // authFetch turns network errors (aborts included) into its own Error, so check the signal.
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    console.warn(`[integration] secure download failed (${err.message}); using the public endpoint`);
  }
  return null;
}

// Returns the PDF as plain base64 (what the viewer uses).
export async function getDocument(guid, signal) {
  const secure = await getSecureDocument(guid, signal);
  if (secure && secure.length >= 5 && String.fromCharCode(...secure.subarray(0, 4)) === '%PDF') return toBase64(secure);

  let res;
  try {
    res = await fetch(`${DSS_URL}/api/Doc/FileDownload/${encodeURIComponent(guid)}`, { headers: { accept: 'application/pdf, */*' }, signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Could not reach the document server. Check your connection and try again.');
  }
  if (res.status === 404 || res.status === 500) throw new Error('This document was not found. Open the link again from M-Files.');
  if (!res.ok) throw new Error(`The document server answered ${res.status}${res.statusText ? ` ${res.statusText}` : ''}.`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  // Every PDF starts with "%PDF".
  if (bytes.length < 5 || String.fromCharCode(...bytes.subarray(0, 4)) !== '%PDF') {
    throw new Error('The document could not be read.');
  }
  return toBase64(bytes);
}

const errorMessage = async (res, fallback) => {
  try {
    const data = await res.json();
    const msg = data?.error || data?.detail || data?.message || data?.title;
    if (typeof msg === 'string' && msg) return msg;
  } catch { /* not JSON */ }
  return fallback;
};

// --- Send for signing: POST {VITE_AUTH_URL}/api/othersigners/ with the token from the link ---
// dssauth saves the signature boxes and message, then calls dsscall /api/signers itself.
// The document is already in DSS under the guid from the link, so there is no upload step.
// Body, exactly as AddSignersDialogMerged builds it:
//   { documentid, signers: [{ email }], assignmentd?, annotations? }
//   annotations = [{ signer: { id, email, color }, annotations: [{ id, pageNumber, x, y, width, height, text, color }] }]
// phones: { email: '+254712345678' } for signers who must confirm an SMS code (OTP)
// before opening the document; same { email, phone } shape the main app sends.
export function buildSendPayload({ documentid, signers, signatureBoxes, message, phones = {} }) {
  const annotations = signatureBoxes.filter((b) => b.annotations.length > 0);
  return {
    documentid,
    signers: signers.map((email) => (phones[email] ? { email, phone: phones[email].trim() } : { email })),
    ...(message ? { assignmentd: message } : {}),
    ...(annotations.length ? { annotations } : {}),
  };
}

// --- SMS verification (OTP) ---------------------------------------------------
// International format, e.g. +254712345678.
export const PHONE_RE = /^\+[1-9]\d{7,14}$/;

// Signers with SMS verification switched on but no valid number yet.
export const phoneProblems = (phones) =>
  Object.entries(phones).filter(([, p]) => !PHONE_RE.test((p || '').trim())).map(([email]) => email);

// Can the sender's organisation use SMS verification? (Its SMS provider must be set up and enabled.)
// Returns { available: true | false | null, code }. null = couldn't tell (network, old server,
// session problem): the page then still lets the sender add SMS codes, and the server
// checks again when the document is sent.
export async function getOtpAvailability() {
  try {
    const res = await authFetch(`${AUTH_URL}/api/otp/availability/`);
    if (!res.ok) {
      console.warn(`[DSS integration] SMS availability check returned HTTP ${res.status}; allowing SMS codes, the server checks on send.`);
      return { available: null, code: null };
    }
    const data = await res.json();
    return { available: !!data.available, code: data.code || null };
  } catch (err) {
    console.warn('[DSS integration] SMS availability check failed; allowing SMS codes, the server checks on send.', err);
    return { available: null, code: null };
  }
}

// What to tell the sender when their organisation can't use SMS codes.
export const otpUnavailableText = (code) => {
  switch (code) {
    case 'otp_provider_disabled':
      return "SMS codes are turned off for your organisation. Ask your DSS administrator to turn on the SMS provider (Admin Dashboard → Settings → SMS / OTP Provider).";
    case 'no_company':
      return 'SMS codes are only available for organisation accounts.';
    default:
      return "SMS codes aren't set up for your organisation yet. Ask your DSS administrator to set up an SMS provider (Admin Dashboard → Settings → SMS / OTP Provider).";
  }
};

export async function sendToSigners(payload) {
  const res = await authFetch(`${AUTH_URL}/api/othersigners/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Failed to send the document (${res.status}). Please try again.`));
  return res.json().catch(() => ({}));
}
