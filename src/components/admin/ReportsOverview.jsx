import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, MenuItem, TextField, Tooltip as MuiTooltip, Typography, useMediaQuery } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { FaDownload, FaInfoCircle, FaSyncAlt } from 'react-icons/fa';
import AuthContext from '../../context/Authcontext';
import { PILL_COMPACT } from '../common/pillButton';
import { downloadCsv, getReportsOverview, reportError } from '../../api/reports';

// Super admin reports. Colours: the first three slots of the validated
// categorical palette (distinct for colour-blind viewers in every pairing);
// every chart has a legend, tooltips and a single y-axis, and the numbers are
// also available as a table / CSV.
const SERIES = { blue: '#2a78d6', orange: '#eb6834', green: '#16a34a', red: '#dc2626' };
const INK = { primary: '#1f2937', secondary: '#52514e', muted: '#6b7280', grid: '#eceae6' };
const axisProps = { tick: { fontSize: 11, fill: INK.muted }, tickLine: false, axisLine: { stroke: INK.grid } };

const monthLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};
const dayLabel = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const hours = (h) => {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} days`;
};
const pct = (v) => (v == null ? '—' : `${v}%`);

const Tile = ({ label, value, hint }) => (
  <Box sx={{ flex: '1 1 150px', minWidth: 140, border: '1px solid #e5e7eb', borderRadius: 2, px: 1.75, py: 1.25, bgcolor: '#fff' }}>
    <Typography sx={{ fontSize: 11.5, color: INK.muted, display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {label}
      {hint && <MuiTooltip title={hint}><span style={{ display: 'inline-flex' }}><FaInfoCircle size={10} /></span></MuiTooltip>}
    </Typography>
    <Typography sx={{ fontSize: 22, fontWeight: 600, color: INK.primary, lineHeight: 1.3 }}>{value ?? '—'}</Typography>
  </Box>
);

const Card = ({ title, subtitle, children, action }) => (
  <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, bgcolor: '#fff', p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: INK.primary }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: 12, color: INK.muted }}>{subtitle}</Typography>}
      </Box>
      {action}
    </Box>
    {children}
  </Box>
);

const tooltipStyle = { fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' };

export default function ReportsOverview() {
  const { authTokens } = useContext(AuthContext);
  const isWide = useMediaQuery('(min-width:1400px)');
  const isMedium = useMediaQuery('(min-width:900px)');
  const isPhone = useMediaQuery('(max-width:575.98px)');
  const [months, setMonths] = useState(12);
  const [company, setCompany] = useState(''); // super admin: '' = all organisations
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (m = months, c = company) => {
    if (!authTokens?.access) return;
    setLoading(true);
    setError('');
    try {
      setData(await getReportsOverview(authTokens.access, m, c));
    } catch (err) {
      setError(reportError(err));
    } finally {
      setLoading(false);
    }
  }, [authTokens, months, company]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 8 }}>
        <CircularProgress size={26} /><Typography sx={{ fontSize: 13 }}>Building reports…</Typography>
      </Box>
    );
  }

  const t = data?.totals || {};
  const scope = data?.scope || {};
  const bySender = scope.group_by === 'sender';      // one organisation: breakdown per sender
  const canPick = !!scope.can_pick_company;           // super admin
  const groupLabel = bySender ? 'Sender' : 'Organisation';
  const monthly = (data?.monthly || []).map((r) => ({ ...r, label: monthLabel(r.month) }));
  const logins = (data?.logins || []).map((r) => ({ ...r, label: dayLabel(r.day) }));
  const orgRows = (data?.breakdown || data?.by_organization || [])
    .map((r, i) => ({ id: i, ...r, name: r.name ?? r.organization }));

  // Columns share the width (flex) so the table fits without a sideways scroll.
  const orgColumns = [
    { field: 'name', headerName: groupLabel, flex: 1.6, minWidth: 150 },
    { field: 'total', headerName: 'Documents', type: 'number', flex: 0.8, minWidth: 90 },
    { field: 'completed', headerName: 'Completed', type: 'number', flex: 0.8, minWidth: 90 },
    { field: 'pending', headerName: 'Pending', type: 'number', flex: 0.7, minWidth: 80 },
    { field: 'declined', headerName: 'Declined', type: 'number', flex: 0.7, minWidth: 80 },
    { field: 'completion_rate', headerName: 'Completion', type: 'number', flex: 0.8, minWidth: 95, renderCell: (p) => pct(p.value) },
    { field: 'avg_turnaround_hours', headerName: 'Avg turnaround', type: 'number', flex: 1, minWidth: 115, renderCell: (p) => hours(p.value) },
    { field: 'median_turnaround_hours', headerName: 'Median turnaround', type: 'number', flex: 1, minWidth: 130, renderCell: (p) => hours(p.value) },
    { field: 'otp_sent', headerName: 'SMS sent', type: 'number', flex: 0.8, minWidth: 85 },
    { field: 'otp_verified', headerName: 'SMS verified', type: 'number', flex: 0.8, minWidth: 100 },
    { field: 'otp_failed', headerName: 'SMS failures', type: 'number', flex: 0.8, minWidth: 100 },
  ];

  // Fewer columns on smaller screens (all still in the CSV).
  const orgColumnVisibility = {
    median_turnaround_hours: isWide,
    otp_failed: isWide,
    pending: isMedium,
    declined: isMedium,
    otp_verified: isMedium,
    completion_rate: !isPhone,
  };

  // File names say what was exported (organisation + period).
  const slug = (scope.company_name || 'all_organisations').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  const today = new Date().toISOString().slice(0, 10);

  const exportOrgs = () => downloadCsv(
    `${bySender ? 'senders' : 'organisations'}_${slug}_${months}m_${today}.csv`,
    [groupLabel, 'Documents', 'Completed', 'Pending', 'Declined/voided', 'Completion %',
      'Avg turnaround (h)', 'Median turnaround (h)', 'SMS codes sent', 'SMS verified', 'SMS failures'],
    orgRows.map((r) => [r.name, r.total, r.completed, r.pending, r.declined, r.completion_rate ?? '',
      r.avg_turnaround_hours ?? '', r.median_turnaround_hours ?? '', r.otp_sent, r.otp_verified, r.otp_failed]),
  );

  const exportMonthly = () => downloadCsv(
    `signing_activity_${slug}_${months}m_${today}.csv`, ['Month', 'Sent', 'Completed', 'Declined/voided'],
    monthly.map((r) => [r.month, r.created, r.completed, r.declined]),
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Filter row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        {canPick && (
          <TextField size="small" select label="Organisation" value={company} sx={{ minWidth: 220 }}
            onChange={(e) => { setCompany(e.target.value); load(months, e.target.value); }}>
            <MenuItem value="">All organisations</MenuItem>
            {(data?.organizations || []).map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
          </TextField>
        )}
        <TextField size="small" select label="Period" value={months} sx={{ minWidth: 170 }}
          onChange={(e) => { setMonths(e.target.value); load(e.target.value, company); }}>
          {[3, 6, 12, 24].map((m) => <MenuItem key={m} value={m}>Last {m} months</MenuItem>)}
        </TextField>
        {scope.company_name && (
          <Typography sx={{ fontSize: 12.5, color: INK.muted }}>
            Showing <b style={{ color: INK.primary }}>{scope.company_name}</b> only
          </Typography>
        )}
        <Button variant="outlined" startIcon={loading ? <CircularProgress size={11} /> : <FaSyncAlt size={11} />}
          sx={PILL_COMPACT} onClick={() => load()} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {error && <div className="alert alert-danger py-2 mb-0" style={{ fontSize: 13 }}>{error}</div>}

      {/* Headline numbers */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Tile label="Documents sent" value={t.documents?.toLocaleString()} />
        <Tile label="Completion rate" value={pct(t.completion_rate)} hint="Fully signed documents out of all sent in the period." />
        <Tile label="Avg turnaround" value={hours(t.avg_turnaround_hours)} hint="Average time from sending a document to it being fully signed." />
        <Tile label="SMS codes sent" value={t.otp_sent?.toLocaleString()} />
        <Tile label="SMS verification rate" value={pct(t.otp_verification_rate)} hint="Successful verifications per SMS code sent." />
        <Tile label={bySender ? 'Active senders' : 'Active organisations'} value={t.groups ?? t.organizations}
          hint={bySender ? 'People who sent at least one document in the period.' : 'Organisations that sent at least one document in the period.'} />
      </Box>

      {/* Signing activity over time */}
      <Card
        title="Signing activity"
        subtitle="Documents sent, completed and declined per month."
        action={<Button size="small" startIcon={<FaDownload size={10} />} sx={PILL_COMPACT} onClick={exportMonthly} disabled={!monthly.length}>CSV</Button>}
      >
        <Box sx={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={INK.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: INK.muted, strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: INK.secondary }} iconType="plainline" />
              <Line type="monotone" dataKey="created" name="Sent" stroke={SERIES.blue} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke={SERIES.green} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="declined" name="Declined / voided" stroke={SERIES.red} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* Per organisation (all) or per sender (one organisation) */}
      <Card
        title={bySender ? 'By sender' : 'By organisation'}
        subtitle={bySender
          ? 'Documents each person sent: status, how fast they were signed, and SMS verification usage.'
          : 'Status, turnaround and SMS verification usage per organisation in the period.'}
        action={<Button size="small" startIcon={<FaDownload size={10} />} sx={PILL_COMPACT} onClick={exportOrgs} disabled={!orgRows.length}>CSV</Button>}
      >
        {/* Sized to its rows (10 per page): the page scrolls, not the table. */}
        <Box sx={{ width: '100%' }}>
          <DataGrid
            autoHeight
            rows={orgRows}
            columns={orgColumns}
            columnVisibilityModel={orgColumnVisibility}
            density="compact"
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 10 } }, sorting: { sortModel: [{ field: 'total', sort: 'desc' }] } }}
            pageSizeOptions={[10, 25, 50]}
            localeText={{ noRowsLabel: 'No documents in this period' }}
            sx={{ fontSize: 12.5 }}
          />
        </Box>
      </Card>

      {/* Login security */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
        <Card title="Sign-ins" subtitle="Successful and failed sign-ins per day, last 30 days.">
          <Box sx={{ height: 260 }}>
            {logins.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={logins} margin={{ top: 8, right: 16, bottom: 0, left: -12 }} barGap={2} barCategoryGap="20%">
                  <CartesianGrid stroke={INK.grid} vertical={false} />
                  <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} {...axisProps} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: INK.secondary }} />
                  <Bar dataKey="successful" name="Successful" fill={SERIES.blue} radius={[4, 4, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="failed" name="Failed" fill={SERIES.orange} radius={[4, 4, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography sx={{ fontSize: 13, color: INK.muted, pt: 4, textAlign: 'center' }}>No sign-in activity recorded.</Typography>
            )}
          </Box>
        </Card>
        <Card title="Most failed sign-ins" subtitle="Accounts with the most failed attempts, last 30 days.">
          {(data?.top_failed_logins || []).length ? (
            <Box component="table" sx={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <tbody>
                {data.top_failed_logins.map((r) => (
                  <tr key={r.user} style={{ borderBottom: '1px solid #f0efec' }}>
                    <td style={{ padding: '6px 4px', color: INK.primary, wordBreak: 'break-all' }}>{r.user}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', color: INK.secondary, whiteSpace: 'nowrap' }}>{r.failed} failed</td>
                  </tr>
                ))}
              </tbody>
            </Box>
          ) : (
            <Typography sx={{ fontSize: 13, color: INK.muted }}>No failed sign-ins in the last 30 days.</Typography>
          )}
        </Card>
      </Box>
    </Box>
  );
}
