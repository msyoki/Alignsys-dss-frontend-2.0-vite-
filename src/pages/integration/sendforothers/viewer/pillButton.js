/**
 * Shared look for pill (rounded) MUI Buttons, so every pill in the app has
 * the same height, padding, text size and icon spacing.
 *
 *   <Button sx={PILL}>…</Button>                       standard (dialogs, actions)
 *   <Button sx={{ ...PILL, width: '100%' }}>…</Button>  add layout/colour on top
 *   PILL_COMPACT  32px: next to 32px inputs (table filter bars)
 *   PILL_LARGE    40px: main form submit (login, register)
 *
 * Spacing between pills belongs to their container (`gap`), not to margins
 * on the buttons themselves.
 */
export const PILL = {
  textTransform: 'none',
  borderRadius: '999px',
  fontSize: '12.5px',
  fontWeight: 500,
  lineHeight: 1.2,
  minHeight: 34,
  px: 2,
  py: 0.75,
  whiteSpace: 'nowrap',
  boxShadow: 'none',
  '& .MuiButton-startIcon': { mr: '6px', ml: '-2px' },
  '& .MuiButton-endIcon': { ml: '6px', mr: '-2px' },
  '& .MuiButton-startIcon > svg, & .MuiButton-endIcon > svg': { fontSize: 14 },
  '&:hover': { boxShadow: 'none' },
};

/**
 * White buttons always carry a visible border, so they read as buttons on
 * white cards and dialogs (never just floating text).
 *   PILL_OUTLINE          blue text + blue border: secondary actions (Submit, Try again)
 *   PILL_OUTLINE_NEUTRAL  grey text + grey border: dismiss actions (Cancel, Close)
 * Use with the default (text) variant or variant="outlined".
 */
export const PILL_OUTLINE = {
  ...PILL,
  backgroundColor: '#fff',
  color: '#2757aa',
  border: '1px solid #2757aa',
  '&:hover': { backgroundColor: '#ecf4fc', borderColor: '#1a3a7a', boxShadow: 'none' },
  '&.Mui-disabled': { backgroundColor: '#fff', borderColor: '#d0d5dd', color: '#9ca3af' },
};

export const PILL_OUTLINE_NEUTRAL = {
  ...PILL,
  backgroundColor: '#fff',
  color: '#4b5563',
  border: '1px solid #b8c0cc',
  '&:hover': { backgroundColor: '#f5f7fa', borderColor: '#6b7280', boxShadow: 'none' },
  '&.Mui-disabled': { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#9ca3af' },
};

export const PILL_COMPACT = {
  ...PILL,
  fontSize: '12px',
  minHeight: 32,
  px: 1.75,
  py: 0.5,
};

/**
 * The look of the old Syncfusion `e-custom-*` buttons (App.css), for MUI
 * Buttons that replaced them: same fill, text colour, 12px light text and the
 * same hover (only the border darkens). Use with variant="contained":
 *   <Button variant="contained" sx={SF_PILL.warning}>Cancel</Button>
 */
const sfPill = (bg, fg, borderColor = bg) => ({
  ...PILL,
  fontSize: '12px',
  fontWeight: 400,
  backgroundColor: bg,
  color: fg,
  border: `1px solid ${borderColor}`,
  '&:hover': { backgroundColor: bg, color: fg, borderColor: '#495057', boxShadow: 'none' },
  '&.Mui-disabled': { opacity: 0.6, backgroundColor: bg, color: fg },
});

export const SF_PILL = {
  primary: sfPill('#2757aa', '#fff'),
  success: sfPill('#2CB34A', '#fff'),
  warning: sfPill('#ffda75', '#30343f'),
  danger: sfPill('#ff6b6b', '#fff'),
  // White button: visible blue border (a white border would vanish on white).
  light: sfPill('#ffffff', '#2757aa', '#2757aa'),
};

export const PILL_LARGE = {
  ...PILL,
  fontSize: '13.5px',
  minHeight: 40,
  px: 3,
  py: 1,
};
