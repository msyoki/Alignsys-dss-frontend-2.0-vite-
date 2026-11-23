// Loading and downloading document files.
//
// Callers that have a login token use the authenticated endpoints:
//   GET {VITE_AUTH_URL}/api/secure/base64/<file>/   -> { base64_uri }   (owner or signer only)
//   GET {VITE_AUTH_URL}/api/secure/download/<guid>/ -> the PDF
// Pages without a token (guest signing link, QR verify page) keep the public endpoints:
//   GET {VITE_AUTH_URL}/api/base64/<file>/
//   GET {VITE_CORP_URL}/api/Doc/FileDownload/<guid>
//
// If the secure call fails (backend not updated yet, token expired, a file name the
// secure endpoint doesn't recognise), the public endpoint is used instead so no page
// breaks. A console warning shows when that happens.
import axios from 'axios';
import * as constants from '../components/constants/constants.js';

const AUTH_URL = constants.devApiBaseUrl;
const CORP_URL = constants.devApi2BaseUrl;

const isAbort = (err) => axios.isCancel(err) || err?.name === 'AbortError' || err?.name === 'CanceledError';

const warnFallback = (what, err) =>
  console.warn(`[documentFiles] secure ${what} failed (${err?.response?.status ?? err?.message}); using the public endpoint`);

// Returns the file as a data URI ("data:application/pdf;base64,...").
export async function getDocumentBase64(file, { token, onDownloadProgress, signal } = {}) {
  if (token) {
    try {
      const res = await axios.get(`${AUTH_URL}/api/secure/base64/${file}/`, {
        headers: { Authorization: `Bearer ${token}` },
        onDownloadProgress,
        signal,
      });
      if (res.data?.base64_uri) return res.data.base64_uri;
      throw new Error('empty response');
    } catch (err) {
      if (isAbort(err)) throw err;
      warnFallback('preview', err);
    }
  }
  const res = await axios.get(`${AUTH_URL}/api/base64/${file}/`, { onDownloadProgress, signal });
  return res.data.base64_uri;
}

// Returns the document's PDF as a Blob.
export async function getDocumentBlob(guid, { token, signal } = {}) {
  if (token) {
    try {
      const res = await axios.get(`${AUTH_URL}/api/secure/download/${encodeURIComponent(guid)}/`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
        signal,
      });
      return res.data;
    } catch (err) {
      if (isAbort(err)) throw err;
      warnFallback('download', err);
    }
  }
  const res = await axios.get(`${CORP_URL}/api/Doc/FileDownload/${encodeURIComponent(guid)}`, { responseType: 'blob', signal });
  return res.data;
}

const pdfName = (name, fallback) => {
  const base = String(name || '').trim() || fallback;
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`;
};

// Downloads the document's PDF and saves it as "<title>.pdf".
export async function downloadDocument(guid, { token, title } = {}) {
  const blob = await getDocumentBlob(guid, { token });
  const url = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type: 'application/pdf' }));
  const a = window.document.createElement('a');
  a.href = url;
  a.download = pdfName(title, guid);
  window.document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
