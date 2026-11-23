// Managing organisation users' access (through the dssauth API).
import axios from 'axios';
import * as constants from '../components/constants/constants';

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
const url = (userId, path) => `${constants.devApiBaseUrl}/api/users/${userId}/${path}/`;

// Correct the email of someone who has never signed in; a new welcome email goes to it.
// -> { email, email_sent }
export const changeUserEmail = (token, userId, email) =>
  axios.post(url(userId, 'email'), { email }, auth(token)).then((r) => r.data);

// Make someone an admin of the organisation, or remove admin rights. -> { user_id, is_admin }
export const setUserRole = (token, userId, isAdmin) =>
  axios.post(url(userId, 'role'), { is_admin: isAdmin }, auth(token)).then((r) => r.data);

// Delete a user who has sent no documents (else 409 with a "deactivate instead" message).
export const deleteUser = (token, userId) =>
  axios.delete(url(userId, 'delete'), auth(token)).then((r) => r.data);

export const accountError = (err, fallback = 'The request failed. Please try again.') =>
  err?.response?.data?.error || err?.response?.data?.fields?.email || err?.response?.data?.detail || fallback;

// Import users from a CSV (first_name, last_name, email, phone). Super admins pass `company`.
// -> { created, emails_not_sent } or 400 { error, rows: [{ row, email, problems }] }
export const importUsers = (token, file, company) => {
  const form = new FormData();
  form.append('file', file);
  if (company) form.append('company', company);
  return axios.post(`${constants.devApiBaseUrl}/api/users/import/`, form, auth(token)).then((r) => r.data);
};

// Organisation's users (admins: always their own; super admins choose `company`).
export const listUsers = (token, company) =>
  axios.post(`${constants.devApiBaseUrl}/api/users/`, { company }, auth(token)).then((r) => r.data);

// Super admins: individual sign-up requests.
export const approveIndividual = (token, userId) =>
  axios.post(`${constants.devApiBaseUrl}/api/individuals/${userId}/approve/`, {}, auth(token)).then((r) => r.data);
export const rejectIndividual = (token, userId) =>
  axios.post(`${constants.devApiBaseUrl}/api/individuals/${userId}/reject/`, {}, auth(token)).then((r) => r.data);
