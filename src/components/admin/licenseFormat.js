// Display helpers for licence data from dsscall
// ({ numberOfLicenses, allocatedLicenses, remaining, expiryDate: 'YYYY-MM-DD', licenseDate: ISO }).
import { formatDateOnly } from '../../utils/datetime';

// 'YYYY-MM-DD' is a calendar date: show it as that day everywhere (no time zone shift).
export const formatCalendarDate = (value) => {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!m) return formatDateOnly(value);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    .toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

// Whole days from today to the expiry date (negative once expired), or null.
export const daysUntil = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!m) return null;
  const end = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86400000);
};

// 'success' | 'warning' | 'danger' for a status chip about the expiry date.
export const expiryTone = (days) => {
  if (days === null) return 'neutral';
  if (days < 0) return 'danger';
  if (days <= 30) return 'warning';
  return 'success';
};

export const expiryLabel = (days) => {
  if (days === null) return '';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  return days <= 60 ? `${days} day${days === 1 ? '' : 's'} left` : 'Active';
};

// Years between issue and expiry, to pre-fill the "years" field when changing a licence.
export const yearsBetween = (start, end) => {
  const a = new Date(start);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(end || ''));
  if (Number.isNaN(a.getTime()) || !m) return '';
  const years = Number(m[1]) - a.getUTCFullYear();
  return years > 0 ? years : '';
};
