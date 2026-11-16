// Read-only admin reporting: OTP activity log and super admin reports.
import axios from 'axios';
import * as constants from '../components/constants/constants';

const url = (path) => `${constants.devApiBaseUrl}/api/${path}`;
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// params: { start_date, end_date, event, company } (all optional, dates YYYY-MM-DD)
export const getOtpLogs = (accessToken, params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return axios.get(url('otp/logs/'), { ...auth(accessToken), params: clean }).then((r) => r.data);
};

// company: super admins only (narrow to one organisation); admins are always
// limited to their own organisation by the server.
export const getReportsOverview = (accessToken, months = 12, company = '') =>
  axios.get(url('reports/overview/'), {
    ...auth(accessToken),
    params: company ? { months, company } : { months },
  }).then((r) => r.data);

export const reportError = (err, fallback = 'Could not load the report.') =>
  err?.response?.data?.error || fallback;

// Download rows as a CSV file (Excel-friendly).
export const downloadCsv = (filename, headers, rows) => {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};
