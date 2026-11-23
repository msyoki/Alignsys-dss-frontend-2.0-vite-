import React from 'react';
import { Alert, Box, Button, LinearProgress, Link, Typography } from '@mui/material';
import { FaIdCard } from 'react-icons/fa';
import { StatusChip } from '../common/dialogKit';
import { supportEmail } from '../constants/constants';
import { daysUntil, expiryLabel, expiryTone, formatCalendarDate } from './licenseFormat';

const TONES = {
  normal: { bg: '#fafafa', border: '#e5e7eb' },
  warning: { bg: '#fff8e1', border: '#ffe082' },
  danger: { bg: '#fdecea', border: '#f5c2c0' },
};

// "Request more licences": an email to Alignsys with the numbers filled in, or plain text if no address is set.
const RequestLink = ({ companyName, status, reason }) => {
  const label = reason === 'expired' ? 'Request a renewal' : 'Request more licences';
  if (!supportEmail) return <Typography component="span" sx={{ fontSize: 12.5 }}>Contact Alignsys to {reason === 'expired' ? 'renew it' : 'get more'}.</Typography>;
  const subject = `${reason === 'expired' ? 'Licence renewal' : 'More licences'}: ${companyName || 'our organisation'}`;
  const body = [
    `Organisation: ${companyName || ''}`,
    status ? `Licences: ${status.allocatedLicenses} of ${status.numberOfLicenses} in use, ${status.remaining} left` : '',
    status ? `Expires: ${status.expiryDate}` : '',
    '',
    'We would like to:',
  ].filter((l) => l !== null).join('\n');
  return (
    <Link href={`mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
      sx={{ fontSize: 12.5, fontWeight: 600 }}>
      {label}
    </Link>
  );
};

/**
 * Organisation licence at a glance, above the users table: seats used / left, people
 * without a licence (with a "Show them" filter), and the expiry date. Turns amber when
 * licences run out or expiry is near, red once expired, with a link to request more.
 */
const LicenceSummaryBar = ({ licence, companyName, unlicensedCount, onlyUnlicensed, onToggleUnlicensed }) => {
  if (!licence) return null;
  const status = licence.status;
  if (!licence.has_license || !status) {
    return (
      <Alert severity="info" sx={{ fontSize: 12.5, py: 0 }}>
        Your organisation has no licence yet, so licences can&apos;t be assigned. <RequestLink companyName={companyName} reason="none" />
      </Alert>
    );
  }

  const days = daysUntil(status.expiryDate);
  const expired = days !== null && days < 0;
  const noneLeft = Number(status.remaining) <= 0;
  const soon = days !== null && days >= 0 && days <= 30;
  const tone = expired ? 'danger' : (noneLeft || soon) ? 'warning' : 'normal';
  const total = Number(status.numberOfLicenses) || 0;
  const used = Number(status.allocatedLicenses) || 0;

  return (
    <Box
      role="status"
      sx={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, px: 1.5, py: 1,
        border: `1px solid ${TONES[tone].border}`, borderRadius: 1.5, bgcolor: TONES[tone].bg,
      }}
    >
      <FaIdCard aria-hidden style={{ color: '#2757aa', flexShrink: 0 }} />
      <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.8 }}>
          Licences: <strong>{used}</strong> of {total} in use · {status.remaining} left
          {unlicensedCount > 0 && <> · {unlicensedCount} {unlicensedCount === 1 ? 'person' : 'people'} without one</>}
        </Typography>
        <LinearProgress
          variant="determinate" value={total ? Math.min(100, (used / total) * 100) : 0}
          color={noneLeft ? 'warning' : 'primary'}
          sx={{ mt: 0.5, height: 5, borderRadius: 3, maxWidth: 320 }}
          aria-label={`${used} of ${total} licences in use`}
        />
        {expired && (
          <Typography sx={{ fontSize: 12, color: '#b42318', mt: 0.5 }}>
            The licence expired, so licences can&apos;t be assigned or withdrawn until it&apos;s renewed.
          </Typography>
        )}
        {!expired && noneLeft && (
          <Typography sx={{ fontSize: 12, color: '#8a6100', mt: 0.5 }}>
            All licences are in use. Withdraw one to give it to someone else, or request more.
          </Typography>
        )}
      </Box>
      {(unlicensedCount > 0 || onlyUnlicensed) && (
        <Button size="small" variant="text" onClick={onToggleUnlicensed} aria-pressed={onlyUnlicensed}
          sx={{ textTransform: 'none', fontSize: 12.5, py: 0 }}>
          {onlyUnlicensed ? 'Show everyone' : 'Show them'}
        </Button>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 12.5, color: '#4b5563' }}>{expired ? 'Expired' : 'Expires'} {formatCalendarDate(status.expiryDate)}</Typography>
        <StatusChip tone={expiryTone(days)}>{expiryLabel(days)}</StatusChip>
        {(expired || noneLeft || soon) && <RequestLink companyName={companyName} status={status} reason={expired ? 'expired' : 'more'} />}
      </Box>
    </Box>
  );
};

export default LicenceSummaryBar;
