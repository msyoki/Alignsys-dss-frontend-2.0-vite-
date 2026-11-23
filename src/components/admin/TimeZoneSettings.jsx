import React, { useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Button, CircularProgress } from '@mui/material';
import { FaCheckCircle, FaClock, FaInfoCircle, FaSave } from 'react-icons/fa';
import AuthContext from '../../context/Authcontext';
import * as constants from '../constants/constants';
import TimeZoneSelect from '../common/TimeZoneSelect';
import { browserTimeZone, formatDateTime, formatPattern, utcOffsetLabel } from '../../utils/datetime';

// Admin page: the organisation's time zone. It is the default for members who
// have not picked their own (My profile), and for the signature stamps on the
// documents they send.

const small = { fontSize: 13 };
const pretty = (tz) => (tz || '').replace(/_/g, ' ');

const TimeZoneSettings = () => {
  const { authTokens, user, updateTimezones } = useContext(AuthContext);
  const [saved, setSaved] = useState(user?.company_timezone || 'Africa/Nairobi');
  const [zone, setZone] = useState(user?.company_timezone || 'Africa/Nairobi');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null);
  const [now, setNow] = useState(() => new Date());

  // Read the saved value from the server (another admin may have changed it since login).
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${constants.devApiBaseUrl}/api/company/${user.companyid}`, {
        headers: { Authorization: `Bearer ${authTokens?.access}` },
      });
      if (res.data.timezone) { setSaved(res.data.timezone); setZone(res.data.timezone); }
    } catch {
      setBanner({ severity: 'warning', text: 'The current time zone could not be loaded. Showing the one from your sign-in.' });
    } finally {
      setLoading(false);
    }
  }, [user?.companyid, authTokens?.access]);

  useEffect(() => { load(); }, [load]);

  // Keep the "time now" preview current.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setBanner(null);
    try {
      const res = await axios.patch(
        `${constants.devApiBaseUrl}/api/company/${user.companyid}`,
        { timezone: zone },
        { headers: { Authorization: `Bearer ${authTokens?.access}` } },
      );
      const value = res.data.timezone;
      setSaved(value);
      // Apply on screen now; members who chose their own zone keep it.
      updateTimezones?.({ company_timezone: value, ...(user?.user_timezone ? {} : { timezone: value }) });
      setBanner({ severity: 'success', text: `Time zone saved: ${pretty(value)}. New documents, dates and reports use it from now on.` });
    } catch (error) {
      const detail = error.response?.data?.timezone?.[0] || error.response?.data?.detail;
      setBanner({ severity: 'danger', text: detail || 'The time zone could not be saved. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const shown = zone || saved;
  const changed = !!zone && zone !== saved;
  const device = browserTimeZone();

  return (
    <form onSubmit={save} autoComplete="off" style={{ maxWidth: 720 }}>
      <div className="alert alert-info py-2 mb-3 d-flex align-items-center flex-wrap gap-2" style={small}>
        <FaClock aria-hidden />
        <span>
          Your organisation uses <strong>{pretty(saved)}</strong> ({utcOffsetLabel(saved, now)}).
          Time there now: <strong>{formatDateTime(now, { dateStyle: 'medium', timeStyle: 'short' }, saved)}</strong>.
        </span>
      </div>

      {banner && (
        <div className={`alert alert-${banner.severity} py-2 mb-3`} style={small} role="status">
          {banner.severity === 'success' && <FaCheckCircle className="me-2" />}{banner.text}
        </div>
      )}

      <h3 className="admin-card-title mb-2">Organisation time zone</h3>
      <div className="d-flex align-items-start flex-wrap gap-2">
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <TimeZoneSelect name="company_timezone" label="Time zone" value={zone} onChange={setZone} disabled={busy} />
        </div>
        <Button type="submit" variant="contained" disableElevation disabled={busy || loading || !changed}
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <FaSave />}
          style={{ textTransform: 'none', fontSize: 13, height: 40, whiteSpace: 'nowrap' }}>
          {busy ? 'Saving…' : 'Save time zone'}
        </Button>
      </div>
      {device !== shown && (
        <Button size="small" variant="text" onClick={() => setZone(device)} disabled={busy}
          style={{ textTransform: 'none', fontSize: 12, padding: '2px 6px', marginTop: 4 }}>
          Use this device's time zone ({pretty(device)})
        </Button>
      )}

      <h3 className="admin-card-title mt-4 mb-2">What it changes</h3>
      <ul className="text-muted mb-3" style={{ ...small, paddingLeft: 18 }}>
        <li>Dates and times on the dashboards, reports and date filters for your members.</li>
        <li>The date and time printed on signatures for documents your members send.</li>
        <li>Members who picked their own time zone in <em>My profile</em> keep theirs.</li>
      </ul>

      <div className="p-2 px-3" style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa', fontSize: 12.5 }}>
        <div className="text-muted mb-1">A signature stamped now{changed ? ' with this change' : ''} would read:</div>
        <div style={{ fontFamily: 'monospace' }}>
          Date: {formatPattern(now, 'YYYY-MM-DD', shown)}<br />
          Time: {formatPattern(now, 'HH:mm:ss', shown)} {utcOffsetLabel(shown, now)}
        </div>
      </div>

      <p className="text-muted mt-3 mb-0" style={{ fontSize: 12 }}>
        <FaInfoCircle className="me-1" aria-hidden />
        Documents already being signed keep the time zone they started with, so all their signatures match.
      </p>
    </form>
  );
};

export default TimeZoneSettings;
