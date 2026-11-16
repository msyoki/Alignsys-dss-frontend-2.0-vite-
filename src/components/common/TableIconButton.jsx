import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { BRAND } from '../layout/shellTheme';

/**
 * Row action in a data table: a plain icon with a light tint on hover,
 * a tooltip and keyboard focus. `title` is also the accessible name.
 */
const TableIconButton = ({ title, onClick, color = BRAND.primary, children }) => (
  <Tooltip title={title}>
    <IconButton
      size="small"
      aria-label={title}
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      sx={{
        width: 30,
        height: 30,
        borderRadius: '6px',
        color,
        fontSize: 15,
        '&:hover': { bgcolor: '#ecf4fc' },
        '&:focus-visible': { outline: `2px solid ${BRAND.primary}`, outlineOffset: 1 },
      }}
    >
      {children}
    </IconButton>
  </Tooltip>
);

export default TableIconButton;
