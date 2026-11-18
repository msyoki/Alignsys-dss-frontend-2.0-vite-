import React from 'react';
import { Button } from '@mui/material';
import { FaFilter } from 'react-icons/fa';
import { PILL_COMPACT } from './pillButton';
import CollapsibleFilters from './CollapsibleFilters';

const labelStyle = { fontSize: '12px', lineHeight: 1.1 };
const inputStyle = { minHeight: '32px', paddingTop: '2px', paddingBottom: '2px', fontSize: '12px' };

/**
 * Start date / End date / Filter bar above a table, same layout as the
 * dashboard Inbox: labels above the inputs, compact pill Filter button.
 * `onChange` receives the input change event (name = start_date | end_date).
 * `children` (optional) are extra fields shown before the Filter button.
 * On phones the bar folds behind a "Filters" toggle so the table gets the height;
 * `summaryExtra` is shown in the toggle next to the dates (e.g. the chosen stage).
 */
const DateRangeFilter = ({ filters, onChange, onApply, children, summaryExtra = '' }) => (
  <CollapsibleFilters
    startDate={filters.start_date}
    endDate={filters.end_date}
    label={children ? 'Filters' : 'Date filters'}
    summaryExtra={summaryExtra}
  >
  <div className="px-3 py-2">
    <div className="d-flex flex-column flex-md-row align-items-md-end gap-2 flex-wrap">
      <div className="d-flex flex-column" style={{ minWidth: '160px', flex: 1 }}>
        <label htmlFor="filter-start-date" className="mb-1 text-dark fw-medium" style={labelStyle}>Start Date</label>
        <input
          id="filter-start-date"
          type="date"
          name="start_date"
          value={filters.start_date}
          onChange={onChange}
          className="form-control form-control-sm"
          style={inputStyle}
        />
      </div>
      <div className="d-flex flex-column" style={{ minWidth: '160px', flex: 1 }}>
        <label htmlFor="filter-end-date" className="mb-1 text-dark fw-medium" style={labelStyle}>End Date</label>
        <input
          id="filter-end-date"
          type="date"
          name="end_date"
          value={filters.end_date}
          onChange={onChange}
          className="form-control form-control-sm"
          style={inputStyle}
        />
      </div>
      {children}
      <div className="d-flex align-items-end">
        <Button variant="contained" color="primary" disableElevation startIcon={<FaFilter />} sx={PILL_COMPACT} onClick={onApply}>
          Filter
        </Button>
      </div>
    </div>
  </div>
  </CollapsibleFilters>
);

export default DateRangeFilter;
