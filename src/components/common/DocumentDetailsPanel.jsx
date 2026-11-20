import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import {
  FaBan, FaCheckCircle, FaComments, FaEnvelope, FaEnvelopeOpenText, FaMobileAlt, FaShieldAlt,
} from 'react-icons/fa';
import HumanizedDate from '../HumanizeDate';
import { StatusChip } from './dialogKit';
import { PILL } from './pillButton';
import alignsysLogo from '../../images/ZFBLU.webp';
import { formatDateTime } from '../../utils/datetime';

// "Document details" side panel, shared by the dashboard preview and the signing pages, in the
// same layout as "Who signs where?" (place signature boxes). Display only.
//
// signers: [{ uid?, email, signed: 'True'|'False', current_signer, signed_time_stamp?,
//             otp?, otp_verified?, otp_verified_at? }]
// status:  { signedcomplete, declined, trashed } (optional) -> status chip
// voidedBy: { by, role: 'owner'|'signer', at, reason } (optional) -> "Voided" box, decliner marked
// topLogo: node shown above the heading (the signing pages show the organisation's logo)
export default function DocumentDetailsPanel({
  title, owner, created, status, voidedBy, signers = [], instructions,
  commentsCount = 0, onComments, topLogo,
}) {
  // Long lists start collapsed: the first few signers plus the current one and any decliner.
  const COLLAPSE_AFTER = 8;
  const PREVIEW_COUNT = 5;
  const [showAll, setShowAll] = useState(false);
  const isDecliner = (s) => voidedBy?.role === 'signer'
    && String(voidedBy.by || '').toLowerCase() === String(s.email || '').toLowerCase();
  const signerState = (s) => {
    if (s.signed === 'True') return { label: 'Signed', color: '#2e7d32', badge: '#2e7d32' };
    if (isDecliner(s)) return { label: 'Declined', color: '#b42318', badge: '#b42318' };
    if (s.current_signer === 'True') return { label: 'Signing now', color: '#1a3a7a', badge: '#2757aa' };
    return { label: 'Queued', color: '#6D7386', badge: '#9aa3b2' };
  };
  const statusChip = status
    ? (status.declined ? { tone: 'danger', label: 'Voided' }
      : status.signedcomplete ? { tone: 'success', label: 'Signing completed' }
        : status.trashed ? { tone: 'neutral', label: 'In trash' }
          : { tone: 'warning', label: 'Pending signing' })
    : null;
  const signedCount = signers.filter((s) => s.signed === 'True').length;
  const collapsible = signers.length > COLLAPSE_AFTER;
  const indexed = signers.map((s, index) => ({ s, index }));
  const visible = collapsible && !showAll
    ? indexed.filter(({ s, index }) => index < PREVIEW_COUNT || isDecliner(s)
      || (s.current_signer === 'True' && s.signed !== 'True'))
    : indexed;
  const row = (label, value) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr)', gap: 1, alignItems: 'center', py: 0.5 }}>
      <Typography component="span" sx={{ fontSize: 12.5, color: '#6D7386' }}>{label}</Typography>
      <Box component="span" sx={{ fontSize: 12.8, color: '#1f2937', minWidth: 0, overflowWrap: 'anywhere' }}>{value}</Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: '#fff', textAlign: 'left' }}>
      {topLogo && (
        <Box sx={{ height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {topLogo}
        </Box>
      )}

      <Box sx={{ p: '18px 18px 8px', flexShrink: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Document details</Typography>
      </Box>

      <Box className="signing-details-list" sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', px: 2.25, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Box>
          {title && row('Title', title)}
          {row('Owner', owner || '—')}
          {row('Created', created ? <HumanizedDate dateStr={created} /> : '—')}
          {statusChip && row('Status', <StatusChip tone={statusChip.tone}>{statusChip.label}</StatusChip>)}
        </Box>

        {voidedBy && (
          <Box sx={{ fontSize: 12.5, bgcolor: '#fdecea', border: '1px solid #f5c2c0', borderRadius: 1.5, p: '8px 10px', color: '#374151', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Box sx={{ color: '#b42318', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <FaBan aria-hidden /> Voided
            </Box>
            <div>
              By: {voidedBy.by
                ? <>{voidedBy.by} <span style={{ color: '#6D7386' }}>({voidedBy.role === 'owner' ? 'sender, recalled it' : 'signer, declined to sign'})</span></>
                : <span style={{ color: '#6D7386' }}>not recorded</span>}
            </div>
            {voidedBy.at && <div>When: <HumanizedDate dateStr={voidedBy.at} /></div>}
            {voidedBy.reason && <div style={{ overflowWrap: 'anywhere' }}>Reason: {voidedBy.reason}</div>}
          </Box>
        )}

        {instructions && (
          <Box sx={{ bgcolor: '#f7faff', border: '1px solid #c5d9ed', borderRadius: 1.5, p: '8px 10px' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1a3a7a', mb: 0.25 }}>Instructions</Typography>
            <Typography sx={{ fontSize: 12.5, color: '#374151', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: '20vh', overflowY: 'auto' }}>
              {instructions}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 0.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Signers ({signers.length})</Typography>
          {signers.length > 1 && (
            <Typography sx={{ fontSize: 12, color: '#6D7386' }}>· {signedCount} signed</Typography>
          )}
        </Box>
        {signers.length === 0 ? (
          <Typography sx={{ fontSize: 12.5, color: '#9ca3af' }}>No signers on this document.</Typography>
        ) : (
          <Box>
            {/* One compact row per signer (about 36px), so long lists stay readable on any screen. */}
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, border: '1px solid #e5e7eb', borderRadius: 1.5, overflow: 'hidden' }}>
              {visible.map(({ s, index }) => {
                const st = signerState(s);
                const active = s.current_signer === 'True' && s.signed !== 'True' && !isDecliner(s);
                const signedTip = s.signed === 'True' && s.signed_time_stamp ? `Signed ${formatDateTime(s.signed_time_stamp)}` : undefined;
                const smsTip = s.otp_verified && s.otp_verified_at
                  ? `Phone verified by SMS code on ${formatDateTime(s.otp_verified_at)}`
                  : 'Must verify their phone with an SMS code before signing';
                return (
                  <Box
                    component="li"
                    key={s.uid || s.email || index}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: '7px', minHeight: 36, boxSizing: 'border-box',
                      borderTop: index === visible[0].index ? 'none' : '1px solid #f3f4f6',
                      bgcolor: active ? '#f0f6ff' : '#fff',
                    }}
                  >
                    <Box component="span" aria-hidden sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: st.badge, color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.signed === 'True' ? <FaCheckCircle size={10} /> : index + 1}
                    </Box>
                    <Typography noWrap title={s.email} sx={{ flex: '1 1 auto', minWidth: 0, fontSize: 12.8, fontWeight: active ? 600 : 500, color: '#111827' }}>
                      {s.email}
                    </Typography>
                    {/* SMS verification (only when the server reports it): icon, details on hover. */}
                    {s.otp && (
                      <Box component="span" title={smsTip} aria-label={s.otp_verified ? 'Verified by SMS' : 'SMS verification required'} sx={{ display: 'inline-flex', color: s.otp_verified ? '#2e7d32' : '#8a6100', flexShrink: 0 }}>
                        {s.otp_verified ? <FaShieldAlt size={11} /> : <FaMobileAlt size={11} />}
                      </Box>
                    )}
                    <Box component="span" title={signedTip} sx={{ fontSize: 11.5, color: st.color, display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {st.label === 'Declined' && <FaBan size={10} aria-hidden />}
                      {st.label === 'Signing now' && <FaEnvelopeOpenText size={10} aria-hidden />}
                      {st.label === 'Queued' && <FaEnvelope size={10} aria-hidden />}
                      {st.label === 'Signing now' ? 'Signing' : st.label}
                    </Box>
                  </Box>
                );
              })}
            </Box>
            {collapsible && (
              <Button
                size="small"
                onClick={() => setShowAll((v) => !v)}
                sx={{ mt: 0.75, textTransform: 'none', fontSize: 12.5, color: '#2757aa', px: 0.5, minWidth: 0 }}
              >
                {showAll ? 'Show fewer' : `Show all ${signers.length} signers`}
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Footer: comments + Alignsys logo */}
      <Box sx={{ borderTop: '1px solid #e5e7eb', p: '14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Button
          variant="contained"
          disableElevation
          startIcon={<FaComments />}
          onClick={onComments}
          sx={{ ...PILL, width: '100%', minHeight: 38, bgcolor: '#2757aa', '&:hover': { bgcolor: '#1a3a7a', boxShadow: 'none' } }}
        >
          Comments ({commentsCount})
        </Button>
        <a href="https://alignsys.tech" target="_blank" rel="noopener noreferrer">
          <img src={alignsysLogo} alt="Alignsys" style={{ height: 28, width: 'auto', maxWidth: 130, objectFit: 'contain', display: 'inline-block' }} />
        </a>
      </Box>
    </Box>
  );
}
