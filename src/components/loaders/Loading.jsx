import React from "react";
import Box from '@mui/material/Box';
import { keyframes } from '@emotion/react';
import logo from "../../images/ZFWHITE.webp";
import { BRAND } from '../layout/shellTheme';

const pulse = keyframes`
  0%, 100% { opacity: .6; }
  50% { opacity: 1; }
`;
const slide = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
`;
const REDUCED = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

/**
 * App start / page load (same design as Alignsys EDMS): brand screen, a smaller
 * pulsing logo, a slim sliding bar and one status line.
 */
const Loading = ({ message = 'Loading…' }) => (
  <Box
    role="status"
    aria-live="polite"
    sx={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: "'Segoe UI', Tahoma, Geneva, sans-serif",
      bgcolor: BRAND.primary,
      backgroundImage: 'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 55%, rgba(0,0,0,.12) 100%)',
    }}
  >
    <Box
      component="img"
      src={logo}
      alt="Alignsys"
      sx={{ width: { xs: 140, sm: 170 }, height: 'auto', mb: 3.5, animation: `${pulse} 2.4s ease-in-out infinite`, ...REDUCED }}
    />

    <Box aria-hidden sx={{ width: 180, height: 3, borderRadius: 999, bgcolor: 'rgba(255,255,255,.22)', overflow: 'hidden' }}>
      <Box sx={{ width: '40%', height: '100%', borderRadius: 999, bgcolor: '#fff', animation: `${slide} 1.2s ease-in-out infinite`, ...REDUCED }} />
    </Box>

    <Box sx={{ mt: 1.75, fontSize: 12.5, color: 'rgba(255,255,255,.82)' }}>{message}</Box>

    <Box sx={{ position: 'absolute', bottom: 18, fontSize: 11, color: 'rgba(255,255,255,.55)' }}>
      Digital Signing Service
    </Box>
  </Box>
);

export default Loading;
