import React, { useId, useState } from 'react';
import { Box, Collapse, useMediaQuery } from '@mui/material';
import { FaChevronDown, FaFilter } from 'react-icons/fa';

const fmt = (d) => {
  if (!d) return '';
  const date = new Date(`${d}T00:00:00`);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/**
 * Date filter bar for the document lists. On small screens it is collapsed by
 * default behind a "Date filters" toggle (showing the current range), so the
 * table gets the height; on larger screens the filters are always shown.
 */
const CollapsibleFilters = ({ startDate, endDate, children }) => {
  const isSmall = useMediaQuery('(max-width: 767.98px)');
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!isSmall) return children;

  const range = startDate || endDate ? `${fmt(startDate) || '…'} – ${fmt(endDate) || '…'}` : 'All dates';

  return (
    <Box sx={{ borderBottom: '1px solid #e5e7eb' }}>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        sx={{
          all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.1,
          fontSize: 13, color: '#2757aa',
          '&:focus-visible': { outline: '2px solid #2757aa', outlineOffset: -2 },
        }}
      >
        <FaFilter size={12} aria-hidden />
        <span style={{ fontWeight: 600 }}>Date filters</span>
        <span style={{ color: '#6b7280', fontSize: 12.5, marginLeft: 4 }}>{range}</span>
        <FaChevronDown
          size={11}
          aria-hidden
          style={{ marginLeft: 'auto', transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </Box>
      <Collapse in={open} id={panelId}>
        {children}
      </Collapse>
    </Box>
  );
};

export default CollapsibleFilters;
