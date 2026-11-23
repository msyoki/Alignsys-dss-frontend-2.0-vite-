import React, { useMemo } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { listTimeZones, utcOffsetLabel } from '../../utils/datetime';

const fieldSx = {
  '& .MuiInputBase-input': { fontSize: 13 },
  '& .MuiInputLabel-root': { fontSize: 13 },
};

/**
 * Searchable time zone picker. `value` is an IANA name, or '' for the
 * `emptyLabel` option (e.g. "Organisation default") when `emptyLabel` is given.
 * Renders a hidden input called `name`, so plain form handlers can read it.
 */
const TimeZoneSelect = ({ value, onChange, name = 'timezone', label = 'Time zone', emptyLabel, helperText, disabled }) => {
  const options = useMemo(() => {
    const zones = [...listTimeZones()];
    if (value && !zones.includes(value)) zones.unshift(value);
    return emptyLabel !== undefined ? ['', ...zones] : zones;
  }, [value, emptyLabel]);

  const optionLabel = (tz) => (tz === '' ? emptyLabel : `${tz.replace(/_/g, ' ')} (${utcOffsetLabel(tz)})`);

  return (
    <>
      <Autocomplete
        options={options}
        value={value ?? ''}
        onChange={(_, v) => onChange(v ?? (emptyLabel !== undefined ? '' : value))}
        getOptionLabel={optionLabel}
        disableClearable
        disabled={disabled}
        size="small"
        renderInput={(params) => (
          <TextField {...params} label={label} helperText={helperText} InputLabelProps={{ shrink: true }} sx={fieldSx} />
        )}
        ListboxProps={{ style: { fontSize: 13 } }}
      />
      <input type="hidden" name={name} value={value ?? ''} />
    </>
  );
};

export default TimeZoneSelect;
