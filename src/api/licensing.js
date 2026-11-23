// Licences. All calls go through this backend (which checks permissions and
// passes them on to dsscall); the browser never calls dsscall directly.
import axios from 'axios';
import * as constants from '../components/constants/constants';

const url = (path) => `${constants.devApiBaseUrl}/api/licensing/${path}`;
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// -> { company_id, company_name, has_license, status: { numberOfLicenses, allocatedLicenses, remaining, expiryDate, licenseDate } | null }
export const getCompanyLicense = (token, companyId) =>
  axios.get(url(`company/${companyId}/`), auth(token)).then((r) => r.data);

// Super admins only. terms = { number_of_users, number_of_years }
export const issueCompanyLicense = (token, companyId, terms) =>
  axios.post(url(`company/${companyId}/`), terms, auth(token)).then((r) => r.data);

export const changeCompanyLicense = (token, companyId, terms) =>
  axios.put(url(`company/${companyId}/`), terms, auth(token)).then((r) => r.data);

// Organisation admins (own users) and super admins. -> { user_id, is_licensed, company_status }
export const assignUserLicense = (token, userId) =>
  axios.post(url(`user/${userId}/assign/`), {}, auth(token)).then((r) => r.data);

export const withdrawUserLicense = (token, userId) =>
  axios.post(url(`user/${userId}/withdraw/`), {}, auth(token)).then((r) => r.data);

export const licenseError = (err, fallback = 'The licence request failed. Please try again.') =>
  err?.response?.data?.error || err?.response?.data?.message || fallback;

// Per-field messages from a 400 answer: { number_of_users: '...', number_of_years: '...' }
export const licenseFieldErrors = (err) => err?.response?.data?.fields || {};
