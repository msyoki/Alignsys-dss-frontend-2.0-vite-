/**
 * Colors for the app shell (sidebar + header) and data tables.
 * Same values as the Alignsys EDMS light theme, so both products look alike.
 */
export const BRAND = {
  primary: '#2757aa',
  primaryDark: '#1a3a7a',
  surface: '#ffffff',
  surfaceLight: '#ecf4fc',
  pageBg: '#eef2f7',
  error: '#d32f2f',
};

export const SIDEBAR_COLORS = {
  bg: '#2757aa',
  fg: '#edf4f7',
  activeBg: '#ffffff',
  activeFg: '#1a3a7a',
  hover: 'rgba(255,255,255,0.12)',
  divider: 'rgba(255,255,255,0.15)',
};

export const NEUTRAL_COLORS = {
  muted: '#6b7280',
  strong: '#111827',
  body: '#4b5563',
  borderSubtle: '#e5e7eb',
  rowDivider: '#f3f4f6',
  rowHover: '#f9fafb',
  fillSubtle: '#fafafa',
};

export const SIDEBAR_WIDTH = 210;
/** Shared by the header and the sidebar's logo section so their bottom edges line up. */
export const HEADER_HEIGHT = 64;
/** Below this width the sidebar slides over the page instead of sitting beside it. */
export const COMPACT_QUERY = '(max-width: 991.98px)';
