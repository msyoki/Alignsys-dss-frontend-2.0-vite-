import React, { useId } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Tooltip, Typography,
} from '@mui/material';
import { FaTimes } from 'react-icons/fa';
import { PILL, PILL_OUTLINE_NEUTRAL } from './pillButton';
import { BRAND, NEUTRAL_COLORS } from '../layout/shellTheme';

/*
 * Dialog building blocks in the Alignsys EDMS style (title bar, property grid,
 * compact fields, Cancel + primary action), with DSS's pill buttons.
 */

/**
 * Blue title bar: icon, title and an optional "• subtitle" (usually the item's name).
 * `onClose` adds a close ✕; with `closeLabel` it becomes a labelled button ("Close preview ✕").
 */
export const DialogHeader = ({ id, icon, title, subtitle, onClose, closeLabel }) => (
  <DialogTitle id={id} sx={{ bgcolor: BRAND.primary, color: '#fff', py: 0.9, pl: 2, pr: onClose ? 1 : 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 30, minWidth: 0 }}>
      {icon && <Box component="span" aria-hidden sx={{ display: 'inline-flex', fontSize: 15, flexShrink: 0 }}>{icon}</Box>}
      <Typography component="span" sx={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.2, flexShrink: 0 }}>{title}</Typography>
      {subtitle && (
        <>
          <Typography component="span" aria-hidden sx={{ fontSize: 12, color: 'rgba(255,255,255,.75)', lineHeight: 1 }}>•</Typography>
          <Typography component="span" noWrap title={typeof subtitle === 'string' ? subtitle : undefined} sx={{ fontSize: 12.5, lineHeight: 1.2, minWidth: 0, opacity: 0.92 }}>
            {subtitle}
          </Typography>
        </>
      )}
      {onClose && closeLabel && (
        <Button
          onClick={onClose}
          endIcon={<FaTimes size={12} />}
          sx={{
            ...PILL, minHeight: 30, py: 0.25, px: 1.5, fontSize: '12.5px', ml: 'auto', flexShrink: 0,
            color: '#fff', border: '1px solid rgba(255,255,255,0.75)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: '#fff', boxShadow: 'none' },
          }}
        >
          {closeLabel}
        </Button>
      )}
      {onClose && !closeLabel && (
        <IconButton aria-label="Close" onClick={onClose} size="small" sx={{ color: '#fff', ml: 'auto', flexShrink: 0 }}>
          <FaTimes size={13} />
        </IconButton>
      )}
    </Box>
  </DialogTitle>
);

/**
 * One label : value row of the property grid (label right-aligned in muted
 * text, 35% / 60%). On phones the label sits above the value.
 */
export const PropertyRow = ({ label, required = false, htmlFor, children, alignTop = false }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '35% 60%' },
      gap: { xs: 0.25, sm: 1 },
      alignItems: alignTop ? 'flex-start' : 'center',
      py: 0.6,
      px: 1,
    }}
  >
    <Tooltip title={label} placement="top" enterDelay={400} describeChild>
      <Typography
        component={htmlFor ? 'label' : 'span'}
        htmlFor={htmlFor}
        sx={{
          fontSize: '12.8px',
          color: '#6D7386',
          textAlign: { xs: 'left', sm: 'right' },
          pr: { xs: 0, sm: 1 },
          pt: { xs: 0, sm: alignTop ? 1 : 0 },
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          m: 0,
        }}
      >
        {label}{required ? ' *' : ''}
      </Typography>
    </Tooltip>
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Box>
);

/** Read-only value for a PropertyRow; empty values show a muted "Not set". */
export const PropertyValue = ({ children, mono = false }) => (
  <Typography
    component="div"
    sx={{ fontSize: '12.8px', color: NEUTRAL_COLORS.strong, minHeight: 20, py: 0.5, wordBreak: 'break-word', fontFamily: mono ? 'ui-monospace, SFMono-Regular, Consolas, monospace' : undefined }}
  >
    {children || <Box component="span" sx={{ color: '#9ca3af' }}>Not set</Box>}
  </Typography>
);

/** Compact text field style for property-grid dialogs; read-only fields get a light blue fill. */
export const fieldSx = (readOnly = false) => ({
  '& .MuiInputBase-root': {
    minHeight: 36,
    fontSize: '12.8px',
    color: '#374151',
    bgcolor: readOnly ? BRAND.surfaceLight : '#fff',
  },
  '& .MuiInputBase-input': { py: '7px', px: '10px' },
  '& .MuiFormHelperText-root': { mx: 0, fontSize: 11 },
});

/** Leading icon inside a TextField: <TextField InputProps={fieldIcon(<FaEnvelope />)} /> */
export const fieldIcon = (icon) => ({
  startAdornment: (
    <InputAdornment position="start" sx={{ color: '#9aa3b2', '& svg': { fontSize: 13 } }}>{icon}</InputAdornment>
  ),
});

/** Contained primary pill (red with tone="danger"); shows a spinner while `loading`. */
export const PrimaryButton = ({ tone = 'primary', loading = false, disabled = false, startIcon, children, sx, ...props }) => {
  const color = tone === 'danger' ? '#d32f2f' : BRAND.primary;
  const hover = tone === 'danger' ? '#b71c1c' : BRAND.primaryDark;
  return (
    <Button
      variant="contained"
      disableElevation
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={14} color="inherit" /> : startIcon}
      sx={{ ...PILL, bgcolor: color, '&:hover': { bgcolor: hover, boxShadow: 'none' }, ...sx }}
      {...props}
    >
      {children}
    </Button>
  );
};

/** Cancel / Close: white pill with a visible border. */
export const SecondaryButton = ({ children, sx, ...props }) => (
  <Button sx={{ ...PILL_OUTLINE_NEUTRAL, ...sx }} {...props}>{children}</Button>
);

/** Footer of every dialog: right-aligned buttons with a gap. */
export const DialogFooter = ({ children }) => (
  <DialogActions sx={{ px: 3, py: 1.5, gap: 1, '& > :not(:first-of-type)': { ml: 0 } }}>{children}</DialogActions>
);

const CHIP = {
  success: { bg: '#e8f5e9', border: '#c8e6c9', fg: '#2e7d32' },
  warning: { bg: '#fff8e1', border: '#ffe082', fg: '#8a6100' },
  danger: { bg: '#fdecea', border: '#f5c2c0', fg: '#b42318' },
  info: { bg: '#e3edf7', border: '#c5d9ed', fg: '#1a3a7a' },
  neutral: { bg: '#f3f4f6', border: '#e5e7eb', fg: '#4b5563' },
};

/** Small status pill (EDMS chip palette). */
export const StatusChip = ({ tone = 'neutral', icon, children }) => {
  const c = CHIP[tone] || CHIP.neutral;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: '2px', borderRadius: 999,
        fontSize: 11.5, fontWeight: 500, lineHeight: 1.4, whiteSpace: 'nowrap',
        bgcolor: c.bg, color: c.fg, border: `1px solid ${c.border}`,
      }}
    >
      {icon}
      {children}
    </Box>
  );
};

/**
 * Confirmation dialog: title bar, message, Cancel + action.
 * `tone="danger"` colours the action button red.
 */
export const ConfirmDialog = ({
  open, title, icon, message, confirmLabel, tone = 'primary', busy = false, onConfirm, onCancel, cancelLabel = 'Cancel', maxWidth = 'xs', children,
}) => {
  const titleId = useId();
  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth={maxWidth} fullWidth aria-labelledby={titleId}>
      <DialogHeader id={titleId} icon={icon} title={title} />
      <DialogContent dividers sx={{ px: 3, py: 2 }}>
        {message && <Typography component="div" sx={{ fontSize: 13, color: '#374151', lineHeight: 1.55 }}>{message}</Typography>}
        {children && <Box sx={{ mt: message ? 1.5 : 0, mx: -1 }}>{children}</Box>}
      </DialogContent>
      <DialogFooter>
        <SecondaryButton onClick={onCancel} disabled={busy}>{cancelLabel}</SecondaryButton>
        <PrimaryButton tone={tone} loading={busy} onClick={onConfirm} autoFocus>{confirmLabel}</PrimaryButton>
      </DialogFooter>
    </Dialog>
  );
};
