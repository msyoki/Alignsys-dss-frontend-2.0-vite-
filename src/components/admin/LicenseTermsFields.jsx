import React from 'react';
import { TextField } from '@mui/material';
import { FaCalendarAlt, FaUsers } from 'react-icons/fa';
import { PropertyRow, fieldIcon, fieldSx } from '../common/dialogKit';

/**
 * "Number of users" and "Number of years" for an organisation's licence.
 * value = { number_of_users, number_of_years } (strings while typing);
 * errors = per-field messages from the server.
 */
const LicenseTermsFields = ({ value, onChange, errors = {}, disabled = false, idPrefix = 'lic' }) => {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value.replace(/[^\d]/g, '') });
  return (
    <>
      <PropertyRow label="Number of users" required htmlFor={`${idPrefix}-users`}>
        <TextField
          id={`${idPrefix}-users`} size="small" fullWidth disabled={disabled}
          value={value.number_of_users} onChange={set('number_of_users')}
          inputProps={{ inputMode: 'numeric', 'aria-describedby': `${idPrefix}-users-help` }}
          InputProps={fieldIcon(<FaUsers />)} sx={fieldSx()}
          error={Boolean(errors.number_of_users)}
          helperText={errors.number_of_users || 'How many people in the organisation can hold a licence.'}
          FormHelperTextProps={{ id: `${idPrefix}-users-help` }}
        />
      </PropertyRow>
      <PropertyRow label="Number of years" required htmlFor={`${idPrefix}-years`}>
        <TextField
          id={`${idPrefix}-years`} size="small" fullWidth disabled={disabled}
          value={value.number_of_years} onChange={set('number_of_years')}
          inputProps={{ inputMode: 'numeric', 'aria-describedby': `${idPrefix}-years-help` }}
          InputProps={fieldIcon(<FaCalendarAlt />)} sx={fieldSx()}
          error={Boolean(errors.number_of_years)}
          helperText={errors.number_of_years || 'How long the licence is valid.'}
          FormHelperTextProps={{ id: `${idPrefix}-years-help` }}
        />
      </PropertyRow>
    </>
  );
};

export const termsReady = (v) => Number(v.number_of_users) >= 1 && Number(v.number_of_years) >= 1;
export const termsPayload = (v) => ({ number_of_users: Number(v.number_of_users), number_of_years: Number(v.number_of_years) });

export default LicenseTermsFields;
