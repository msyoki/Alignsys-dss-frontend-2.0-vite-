import React from 'react';
import { Box, Button, Switch, Tooltip } from '@mui/material';

/**
 * Seats used of an organisation's licence: "12 / 20" over a small bar, amber
 * from 90% full. usage = { users, allocated, has_license, error } from
 * GET /api/licensing/companies/.
 */
export const SeatsCell = ({ usage, loading }) => {
  if (!usage) return <Box component="span" sx={{ color: '#9ca3af' }}>{loading ? 'Loading…' : '—'}</Box>;
  if (usage.error) {
    return (
      <Tooltip title={usage.error}>
        <Box component="span" sx={{ color: '#9ca3af' }}>Unavailable</Box>
      </Tooltip>
    );
  }
  if (!usage.has_license || !usage.users) return <Box component="span" sx={{ color: '#9ca3af' }}>—</Box>;
  const used = Number(usage.allocated) || 0;
  const total = Number(usage.users);
  const pct = Math.min(100, Math.round((used / total) * 100));
  const full = pct >= 90;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px', lineHeight: 1.2 }}>
      <Box component="span" sx={{ fontSize: 12.5, color: full ? '#8a4b00' : '#374151', fontWeight: 400 }}>
        {used} / {total}
      </Box>
      <Box
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${used} of ${total} seats used`}
        sx={{ width: 110, height: 5, borderRadius: 3, bgcolor: '#e5e7eb', overflow: 'hidden' }}
      >
        <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 3, bgcolor: full ? '#d97706' : '#2757aa' }} />
      </Box>
    </Box>
  );
};

/*
 * Cell pieces shared by the admin and super admin tables, so every table there
 * reads the same: status pills, a switch and an outlined text action. Use with ADMIN_GRID_PROPS, which
 * adds the "admin-table" look (styles/DataTable.css) on top of "app-table".
 * Only the column headers are bold; everything inside the rows is normal weight
 * (tones are told apart by colour).
 */

const PILL = {
  neutral: { bg: '#f3f4f6', fg: '#374151' },
  info: { bg: '#e8eef9', fg: '#1a3a7a' },
  success: { bg: '#e8f5e9', fg: '#1e6b30' },
  warning: { bg: '#fff4e5', fg: '#8a4b00' },
  danger: { bg: '#fdecea', fg: '#b42318' },
};

/** Small rounded status label, e.g. "Never signed in". */
export const Pill = ({ tone = 'neutral', children }) => {
  const t = PILL[tone] || PILL.neutral;
  return (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center', px: 1.25, py: '2px', borderRadius: 999,
      fontSize: 12, lineHeight: 1.5, whiteSpace: 'nowrap', bgcolor: t.bg, color: t.fg, fontWeight: 400,
    }}>
      {children}
    </Box>
  );
};

/** Coloured text next to a switch ("Licensed", "Expires in 12 days"). */
export const StatusText = ({ tone = 'neutral', children }) => {
  const t = PILL[tone] || PILL.neutral;
  return (
    <Box component="span" sx={{ fontSize: 12.5, color: tone === 'neutral' ? '#4b5563' : t.fg, fontWeight: 400, whiteSpace: 'nowrap' }}>
      {children}
    </Box>
  );
};

const SWITCH_SX = {
  width: 40,
  height: 22,
  p: 0,
  '& .MuiSwitch-switchBase': {
    p: '3px',
    '&.Mui-checked': {
      transform: 'translateX(18px)',
      color: '#fff',
      '& + .MuiSwitch-track': { bgcolor: '#2757aa', opacity: 1 },
    },
    '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.45 },
    '&.Mui-disabled .MuiSwitch-thumb': { color: '#f3f4f6' },
    '&.Mui-focusVisible .MuiSwitch-thumb': { outline: '2px solid #2757aa', outlineOffset: 2 },
  },
  '& .MuiSwitch-thumb': { width: 16, height: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.2)', color: '#fff' },
  '& .MuiSwitch-track': { borderRadius: 11, bgcolor: '#c3c9d4', opacity: 1 },
};

/** On/off switch in the admin tables' style. Takes the usual MUI Switch props. */
export const AdminSwitch = (props) => <Switch disableRipple {...props} sx={{ ...SWITCH_SX, ...(props.sx || {}) }} />;

/** Outlined text action in a row, e.g. "Licence". */
export const RowButton = ({ children, onClick, ...rest }) => (
  <Button
    variant="outlined"
    size="small"
    onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
    {...rest}
    sx={{
      height: 28, px: 1.25, minWidth: 0, borderRadius: '8px', borderColor: '#c3c9d4', bgcolor: '#fff',
      color: '#2757aa', fontSize: 13, fontWeight: 400, textTransform: 'none', whiteSpace: 'nowrap',
      '&:hover': { borderColor: '#2757aa', bgcolor: '#ecf4fc' },
      ...(rest.sx || {}),
    }}
  >
    {children}
  </Button>
);

/** Grid props every admin table shares (spread before table-specific props). */
export const ADMIN_GRID_PROPS = {
  className: 'app-table admin-table',
  density: 'compact', // original row heights
  disableRowSelectionOnClick: true,
  pageSizeOptions: [10, 15, 25, 50, 100],
  initialState: { pagination: { paginationModel: { pageSize: 15 } } },
};

