import React from 'react';

// Section colours for the dashboard dots (sidebar and page headers).
export const DOT_COLORS = {
  inbox: '#fb8c00', // orange: needs your action
  outbox: '#ffc107', // Bootstrap warning, as before
  complete: '#198754', // Bootstrap success, as before
  voided: '#e53935',
};

// A round status dot. `ring` adds a thin white ring (used in page headers);
// the sidebar shows plain dots.
export default function StatusDot({ color, size = 12, ring = true, style }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: ring ? '0 0 0 2px rgba(255,255,255,0.9), 0 1px 2px rgba(0,0,0,0.25)' : 'none',
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
}
