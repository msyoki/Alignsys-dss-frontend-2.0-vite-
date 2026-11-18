import React from 'react';
import { Switch, Tooltip } from '@mui/material';
import { jsonPhoneCodesData } from '../../data/country-phone-codes';

// "Enable SMS OTP verification" for a substitute signer, the same fields as the
// add-signers form: a switch, a country code and the number without it.
// value: { enabled, code, number }; availability: from useOtpAvailability().
export const EMPTY_SUBSTITUTE_OTP = { enabled: false, code: '+254', number: '' };

export const substitutePhone = (otp) => (otp?.enabled ? `${otp.code}${otp.number.trim()}` : '');

// '' when fine, otherwise the problem to show.
export const substituteOtpProblem = (otp) => {
  if (!otp?.enabled) return '';
  if (!/^[1-9][0-9]{6,14}$/.test(otp.number.trim())) {
    return 'Enter the phone number without the country code or leading 0, e.g. 722123456';
  }
  return '';
};

export default function SubstituteOtpFields({ value, onChange, availability, disabled }) {
  const available = !availability.loading && availability.available;
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div style={{ width: '100%', fontSize: 13 }}>
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <label htmlFor="substituteOtpSwitch" className="text-dark mb-0" style={{ userSelect: 'none', fontSize: 13 }}>
          Enable SMS OTP verification
        </label>
        <Tooltip title={!availability.loading && !availability.available ? availability.message : ''} placement="top">
          <span>
            <Switch
              id="substituteOtpSwitch"
              size="small"
              checked={value.enabled && available}
              disabled={disabled || !available}
              onChange={(e) => set({ enabled: e.target.checked })}
              inputProps={{ 'aria-label': 'Enable SMS OTP verification for the new signer' }}
            />
          </span>
        </Tooltip>
      </div>
      {!availability.loading && !availability.available && availability.message && (
        <div className="text-muted" role="status" style={{ fontSize: 12 }}>{availability.message}</div>
      )}
      {value.enabled && available && (
        <div className="d-flex gap-1 mt-1" style={{ maxWidth: 320 }}>
          <select
            className="form-control form-control-sm"
            value={value.code}
            onChange={(e) => set({ code: e.target.value })}
            disabled={disabled}
            style={{ maxWidth: 110, padding: '0.25rem 0.5rem', fontSize: 13 }}
            aria-label="Country code"
          >
            <option value="+254">Kenya (+254)</option>
            {jsonPhoneCodesData.map((item, index) => (
              <option key={index} value={item.dial_code}>
                {item.name} ({item.dial_code})
              </option>
            ))}
          </select>
          <input
            type="tel"
            className="form-control form-control-sm"
            maxLength={15}
            value={value.number}
            onChange={(e) => set({ number: e.target.value.replace(/[^0-9]/g, '') })}
            disabled={disabled}
            placeholder="e.g. 722XXXXXX"
            aria-label="Phone number"
            style={{ minWidth: 150, padding: '0.25rem 0.5rem', fontSize: 13 }}
          />
        </div>
      )}
    </div>
  );
}
