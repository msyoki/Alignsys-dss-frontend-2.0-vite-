import React from 'react';
import { Tooltip } from '@mui/material';
import { FaShieldAlt, FaMobileAlt } from 'react-icons/fa';
import HumanizedDate from '../HumanizeDate.jsx';

// "+254712345678" -> "••• 678"
export const maskPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 3 ? `••• ${digits.slice(-3)}` : '';
};

// SMS OTP status for a signer entry from the document's signer list
// ({ otp, otpnumber, otp_verified, otp_verified_at }). Renders nothing for signers without OTP.
export default function SignerOtpBadge({ signer, style }) {
  if (!signer?.otp) return null;
  const verified = signer.otp_verified === true;
  const masked = maskPhone(signer.otpnumber);
  const tip = verified
    ? `Phone verified by SMS code${signer.otp_verified_at ? ` on ${new Date(signer.otp_verified_at).toLocaleString()}` : ''}${masked ? ` (${masked})` : ''}`
    : `Must enter an SMS code before signing${masked ? `. Code is sent to ${masked}` : ''}`;
  return (
    <Tooltip title={tip}>
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11px', fontWeight: 500,
          padding: '1px 8px', borderRadius: 999, whiteSpace: 'nowrap',
          color: verified ? '#1b5e20' : '#7a5600',
          backgroundColor: verified ? '#e8f5e9' : '#fff6e0',
          border: `1px solid ${verified ? '#c8e6c9' : '#f5e1a4'}`,
          ...style,
        }}
      >
        {verified ? <FaShieldAlt size={10} aria-hidden /> : <FaMobileAlt size={10} aria-hidden />}
        {verified ? (
          <>SMS verified{signer.otp_verified_at && <>&nbsp;·&nbsp;<HumanizedDate dateStr={signer.otp_verified_at} /></>}</>
        ) : (
          <>SMS code required{masked && <>&nbsp;·&nbsp;{masked}</>}</>
        )}
      </span>
    </Tooltip>
  );
}
