import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, MenuItem, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { FaDownload, FaFilter, FaInfoCircle } from 'react-icons/fa';
import AuthContext from '../../context/Authcontext';
import { PILL_COMPACT } from '../common/pillButton';
import { downloadCsv, getOtpLogs, reportError } from '../../api/reports';
import { formatDateTime, localDateISO } from '../../utils/datetime';
import { ADMIN_GRID_PROPS } from './AdminTableKit';

// Read-only OTP audit trail. Organisation admins see their own organisation;
// super admins (showOrganization) see every organisation. Codes are never
// stored or shown, and phone numbers come masked from the server.

const isoDay = (d) => localDateISO(d); // the user's calendar day, not the UTC one
const defaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start_date: isoDay(start), end_date: isoDay(end) };
};

const EVENT_TONE = {
  'otp sent': { fg: '#1a3a7a', bg: '#e3edf7' },
  'otp verified': { fg: '#2e7d32', bg: '#e8f5e9' },
  'otp failed': { fg: '#8a6100', bg: '#fff8e1' },
  'otp send failed': { fg: '#b42318', bg: '#fdecea' },
  'otp blocked': { fg: '#4b5563', bg: '#f3f4f6' },
  'otp phone changed': { fg: '#5b3a9a', bg: '#f1ebfb' },
};

const Tile = ({ label, value, hint, tone = '#1C4690' }) => (
  <Box sx={{ flex: '1 1 140px', minWidth: 130, border: '1px solid #e5e7eb', borderRadius: 2, px: 1.75, py: 1.25, bgcolor: '#fff' }}>
    <Typography sx={{ fontSize: 11.5, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {label}
      {hint && <Tooltip title={hint}><span style={{ display: 'inline-flex' }}><FaInfoCircle size={10} /></span></Tooltip>}
    </Typography>
    <Typography sx={{ fontSize: 22, fontWeight: 600, color: tone, lineHeight: 1.3 }}>{value ?? '—'}</Typography>
  </Box>
);

export default function OtpLogs({ showOrganization = false }) {
  const { authTokens } = useContext(AuthContext);
  const isWide = useMediaQuery('(min-width:1400px)');
  const isMedium = useMediaQuery('(min-width:900px)');
  const isPhone = useMediaQuery('(max-width:575.98px)');
  // company: super admin only ('' = all organisations); the server ignores it for admins.
  const [filters, setFilters] = useState({ ...defaultRange(), event: '', company: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (f = filters) => {
    if (!authTokens?.access) return;
    setLoading(true);
    setError('');
    try {
      setData(await getOtpLogs(authTokens.access, f));
    } catch (err) {
      setError(reportError(err, 'Could not load OTP activity.'));
    } finally {
      setLoading(false);
    }
  }, [authTokens, filters]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const rows = data?.results || [];
  const s = data?.summary || {};

  // Columns share the available width (flex) so the table fits without a
  // sideways scroll on normal screens; minWidth keeps them readable.
  const columns = [
    {
      field: 'time', headerName: 'Time', flex: 1, minWidth: 150, type: 'dateTime',
      valueGetter: (p) => (p.row.time ? new Date(p.row.time) : null),
      renderCell: (p) => (p.value ? formatDateTime(p.value) : ''),
    },
    {
      field: 'event_label', headerName: 'Event', flex: 1, minWidth: 140,
      renderCell: (p) => {
        const t = EVENT_TONE[p.row.event] || EVENT_TONE['otp blocked'];
        return (
          <Box component="span" sx={{ px: 1.25, py: '2px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: t.fg, bgcolor: t.bg }}>
            {p.value}
          </Box>
        );
      },
    },
    { field: 'signer', headerName: 'Signer', flex: 1.4, minWidth: 170 },
    { field: 'phone', headerName: 'Phone', flex: 0.8, minWidth: 110 },
    { field: 'document_title', headerName: 'Document', flex: 1.4, minWidth: 150 },
    ...(showOrganization ? [{ field: 'organization', headerName: 'Organisation', flex: 1, minWidth: 130 }] : []),
    { field: 'ip', headerName: 'IP address', flex: 0.9, minWidth: 115 },
    { field: 'details', headerName: 'Details', flex: 2, minWidth: 200 },
  ];

  // Fewer columns on smaller screens (still in the CSV export).
  const columnVisibilityModel = {
    details: isWide,
    ip: isWide,
    organization: isMedium,
    document_title: isMedium,
    phone: !isPhone,
  };

  const exportCsv = () => downloadCsv(
    `otp_activity_${filters.start_date}_to_${filters.end_date}.csv`,
    ['Time', 'Event', 'Signer', 'Phone', 'Document', ...(showOrganization ? ['Organisation'] : []), 'IP address', 'Details', 'Document ID'],
    rows.map((r) => [
      r.time ? formatDateTime(r.time) : '', r.event_label, r.signer, r.phone, r.document_title,
      ...(showOrganization ? [r.organization] : []), r.ip, r.details, r.document_guid,
    ]),
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, minHeight: 0 }}>
      {/* Filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'flex-end', px: 0.5 }}>
        <TextField size="small" type="date" name="start_date" label="From" value={filters.start_date} onChange={set}
          InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} inputProps={{ style: { fontSize: 13 } }} />
        <TextField size="small" type="date" name="end_date" label="To" value={filters.end_date} onChange={set}
          InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} inputProps={{ style: { fontSize: 13 } }} />
        {showOrganization && (
          <TextField size="small" select name="company" label="Organisation" value={filters.company} onChange={set} sx={{ minWidth: 200 }}>
            <MenuItem value="">All organisations</MenuItem>
            {(data?.organizations || []).map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
          </TextField>
        )}
        <TextField size="small" select name="event" label="Event" value={filters.event} onChange={set} sx={{ minWidth: 190 }}>
          <MenuItem value="">All events</MenuItem>
          {(data?.events || []).map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
        </TextField>
        <Button variant="contained" disableElevation startIcon={<FaFilter size={11} />} sx={PILL_COMPACT} onClick={() => load()}>
          Apply
        </Button>
        <Button variant="outlined" startIcon={<FaDownload size={11} />} sx={{ ...PILL_COMPACT, ml: 'auto' }}
          onClick={exportCsv} disabled={!rows.length}>
          Export CSV
        </Button>
      </Box>

      {error && <div className="alert alert-danger py-2 mb-0" style={{ fontSize: 13 }}>{error}</div>}

      {/* Summary */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Tile label="Codes sent" value={s.sent} />
        <Tile label="Verified" value={s.verified} tone="#2e7d32" />
        <Tile label="Verification rate" value={s.verification_rate != null ? `${s.verification_rate}%` : null}
          hint="Successful verifications per code sent." tone="#2e7d32" />
        <Tile label="Wrong codes" value={s.wrong_code} tone="#8a6100" />
        <Tile label="Delivery failures" value={s.delivery_failed} tone="#b42318"
          hint="The SMS provider rejected or could not send the message." />
        <Tile label="Blocked" value={s.blocked} tone="#4b5563"
          hint="OTP was requested but no SMS provider was available for the organisation." />
      </Box>

      {data?.truncated && (
        <Typography sx={{ fontSize: 12, color: '#8a6100' }}>
          Showing the most recent 5,000 events. Narrow the date range to see older ones.
        </Typography>
      )}

      {/* Table: takes the remaining height and is the only thing that scrolls.
          On phones the panel scrolls instead and the table gets a fixed height. */}
      <Box sx={{ flex: { xs: 'none', sm: 1 }, height: { xs: 440, sm: 'auto' }, minHeight: { xs: 440, sm: 260 } }}>
        {loading && !data ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5 }}>
            <CircularProgress size={26} />
            <Typography sx={{ fontSize: 13 }}>Loading OTP activity…</Typography>
          </Box>
        ) : (
          <DataGrid
            {...ADMIN_GRID_PROPS}
            rows={rows}
            columns={columns}
            columnVisibilityModel={columnVisibilityModel}
            loading={loading}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: 'time', sort: 'desc' }] },
            }}
            pageSizeOptions={[25, 50, 100]}
            localeText={{ noRowsLabel: 'No OTP activity in this period' }}
            style={{ height: '100%' }}
          />
        )}
      </Box>

      <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
        Codes are never stored or shown. Phone numbers are masked. This log is read-only.
      </Typography>
    </Box>
  );
}
