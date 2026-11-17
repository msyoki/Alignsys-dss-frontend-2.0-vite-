import { createTheme } from '@mui/material/styles';

/**
 * App-wide MUI theme. Only adds the modern switch from Alignsys EDMS; every
 * other component keeps MUI's defaults (same as having no theme provider).
 */
const BRAND = '#2757aa';

const muiTheme = createTheme({
  components: {
    // Modern pill switch: the thumb sits inside a filled track, slides smoothly,
    // no ripple, and shows a focus ring for keyboard users. size="small" is 34x20.
    MuiSwitch: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          const small = ownerState.size === 'small';
          const width = small ? 34 : 42;
          const height = small ? 20 : 24;
          const thumb = height - 4;
          const key = ownerState.color && ownerState.color !== 'default' ? ownerState.color : 'primary';
          const onColor = key === 'primary' ? BRAND : theme.palette[key]?.main || BRAND;
          return {
            width,
            height,
            padding: 0,
            margin: theme.spacing(0, 1, 0, 0),
            overflow: 'visible',
            '& .MuiSwitch-switchBase': {
              padding: 2,
              transitionDuration: '200ms',
              '&:hover': { backgroundColor: 'transparent' },
              '&.Mui-checked': {
                transform: `translateX(${width - height}px)`,
                color: '#fff',
                '& + .MuiSwitch-track': { backgroundColor: onColor, opacity: 1 },
              },
              '&.Mui-focusVisible .MuiSwitch-thumb': {
                outline: `2px solid ${BRAND}`,
                outlineOffset: 2,
              },
              '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.45 },
              '&.Mui-disabled .MuiSwitch-thumb': { color: '#f3f4f6' },
            },
            '& .MuiSwitch-thumb': {
              width: thumb,
              height: thumb,
              color: '#fff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
            },
            '& .MuiSwitch-track': {
              borderRadius: height / 2,
              opacity: 1,
              backgroundColor: '#d1d5db',
              transition: theme.transitions.create('background-color', { duration: 200 }),
            },
          };
        },
      },
    },
    // A label next to a switch lines up with the field's left edge (MUI offsets
    // it -11px for the old switch's padding, which the pill switch doesn't have).
    MuiFormControlLabel: {
      styleOverrides: {
        root: { '&:has(> .MuiSwitch-root)': { marginLeft: 0 } },
      },
    },
  },
});

export default muiTheme;
