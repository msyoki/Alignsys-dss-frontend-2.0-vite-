// Dates and times in the user's time zone.
//
// The backend sends times in UTC (ISO 8601 with an offset). They are shown in
// the display time zone: the user's own setting, else their organisation's
// (the `timezone` claim in the login token, set by AuthProvider), else the
// browser's. Report and filter dates use the same zone as the backend.

export const browserTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
};

const isValidZone = (tz) => {
  if (!tz) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
};

let displayTimeZone = browserTimeZone();

export const setDisplayTimeZone = (tz) => { displayTimeZone = isValidZone(tz) ? tz : browserTimeZone(); };
export const getDisplayTimeZone = () => displayTimeZone;

const FALLBACK_ZONES = [
  'Africa/Nairobi', 'Africa/Kampala', 'Africa/Dar_es_Salaam', 'Africa/Kigali', 'Africa/Addis_Ababa',
  'Africa/Lagos', 'Africa/Accra', 'Africa/Cairo', 'Africa/Johannesburg', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'UTC',
];

/** All IANA time zone names the browser knows (a short list on very old browsers). */
export const listTimeZones = () => {
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    return zones.includes('UTC') ? zones : [...zones, 'UTC'];
  } catch { return FALLBACK_ZONES; }
};

/** "UTC+03:00" for a zone at a given moment (daylight saving aware). */
export const utcOffsetLabel = (tz, at = new Date()) => {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
      .formatToParts(at).find((p) => p.type === 'timeZoneName')?.value;
    return part === 'GMT' ? 'UTC+00:00' : (part || '').replace('GMT', 'UTC');
  } catch { return ''; }
};

const toDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const partsIn = (date, tz) => {
  const out = {};
  new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).forEach((p) => { out[p.type] = p.value; });
  const monthNum = new Intl.DateTimeFormat('en-GB', { timeZone: tz, month: '2-digit' }).format(date);
  return { ...out, monthNum };
};

/**
 * Format with a small pattern in the display time zone.
 * Tokens: YYYY, MMM (Nov), MM (11), DD, HH, mm, ss. Returns '' for empty or invalid values.
 *   formatPattern(value, 'DD/MMM/YYYY HH:mm') -> "20/Nov/2026 11:15"
 */
export const formatPattern = (value, pattern, tz = displayTimeZone) => {
  const d = toDate(value);
  if (!d) return '';
  const p = partsIn(d, tz);
  return pattern.replace(/YYYY|MMM|MM|DD|HH|mm|ss/g, (t) => ({
    YYYY: p.year, MMM: p.month, MM: p.monthNum, DD: p.day, HH: p.hour, mm: p.minute, ss: p.second,
  }[t]));
};

/** "Nairobi" for Africa/Nairobi, "New York" for America/New_York, "UTC" for UTC. */
export const zonePlace = (tz = displayTimeZone) => String(tz || 'UTC').split('/').pop().replace(/_/g, ' ');

/**
 * The app's date and time format, with the place and UTC offset of the zone:
 *   formatFull(value) -> "18/Nov/2026 :22:20:24 Nairobi (UTC+03:00)"
 * Same text as the signature stamp drawn by the backend.
 */
export const formatFull = (value, tz = displayTimeZone) => {
  const d = toDate(value);
  if (!d) return '';
  return `${formatPattern(d, 'DD/MMM/YYYY :HH:mm:ss', tz)} ${zonePlace(tz)} (${utcOffsetLabel(tz, d) || 'UTC+00:00'})`;
};

/**
 * Date and time in the display time zone. With no options, the app's format
 * (see formatFull); with Intl options, the browser's locale style.
 */
export const formatDateTime = (value, options = {}, tz = displayTimeZone) => {
  const d = toDate(value);
  if (!d) return '';
  return Object.keys(options).length ? d.toLocaleString(undefined, { timeZone: tz, ...options }) : formatFull(d, tz);
};

/** Locale date only in the display time zone (replaces Date#toLocaleDateString). */
export const formatDateOnly = (value, options = {}, tz = displayTimeZone) => {
  const d = toDate(value);
  return d ? d.toLocaleDateString(undefined, { timeZone: tz, ...options }) : '';
};

/** Zone in effect after the user saves their own setting ('' = organisation default). */
export const effectiveTimeZone = (userTimezone, user) =>
  userTimezone || user?.company_timezone || (user?.user_timezone ? '' : user?.timezone) || 'Africa/Nairobi';

/**
 * Signing time for the signing record, in the display time zone:
 *   signingTimestamp(new Date()) -> "18/Nov/2026 :22:20:24 Nairobi (UTC+03:00)"
 */
export const signingTimestamp = (value = new Date(), tz = displayTimeZone) => formatFull(toDate(value) || new Date(), tz);

/** "YYYY-MM-DD" for a moment in the display time zone (toISOString() gives the UTC date). */
export const localDateISO = (value = new Date(), tz = displayTimeZone) => formatPattern(value, 'YYYY-MM-DD', tz);
