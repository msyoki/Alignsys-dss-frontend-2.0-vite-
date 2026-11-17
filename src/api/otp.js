// Signer OTP API service.
// Public calls (signing page) send no auth header; admin calls need the JWT.
import axios from 'axios';
import * as constants from '../components/constants/constants';

const url = (path) => `${constants.devApiBaseUrl}/api/${path}`;
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// --- Signing page ----------------------------------------------------------
export const getOtpStatus = (signerUid, token) =>
  axios.post(url('otp/status/'), { signer_uid: signerUid, token: token || '' }).then((r) => r.data);

export const sendOtp = (signerUid, { resend = false } = {}) =>
  axios.post(url('sms/otp/'), { signer_uid: signerUid, resend }).then((r) => r.data);

export const verifyOtp = (signerUid, otp) =>
  axios.post(url('verify/otp/'), { signer_uid: signerUid, otp }).then((r) => r.data);

// "Verified" token: lets a signer reload without a new SMS. Kept per tab only.
const tokenKey = (signerUid) => `otp_verified_${signerUid}`;
export const getVerifiedToken = (signerUid) => {
  try { return sessionStorage.getItem(tokenKey(signerUid)) || ''; } catch { return ''; }
};
export const saveVerifiedToken = (signerUid, token) => {
  try { sessionStorage.setItem(tokenKey(signerUid), token); } catch { /* storage unavailable */ }
};

// --- Logged-in users / admins ----------------------------------------------
export const getOtpAvailability = (accessToken) =>
  axios.get(url('otp/availability/'), auth(accessToken)).then((r) => r.data);

export const getOtpConfig = (accessToken) =>
  axios.get(url('otp/config/'), auth(accessToken)).then((r) => r.data);

export const saveOtpConfig = (accessToken, payload) =>
  axios.post(url('otp/config/'), payload, auth(accessToken)).then((r) => r.data);

export const testOtpConfig = (accessToken, payload) =>
  axios.post(url('otp/config/test/'), payload, auth(accessToken)).then((r) => r.data);

// Pull the server's message/code out of an axios error.
export const otpError = (err, fallback = 'Something went wrong. Please try again.') => {
  const data = err?.response?.data || {};
  return {
    message: data.error || data.msg || data.detail || fallback,
    code: data.code || null,
    status: err?.response?.status || null,
    data,
  };
};
