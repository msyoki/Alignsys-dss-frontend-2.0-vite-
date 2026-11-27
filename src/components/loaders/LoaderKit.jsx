import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import { BRAND } from '../layout/shellTheme';

/*
 * One loader family, sized to the wait (same design as Alignsys EDMS):
 *  - TopProgress / StatusCard: an action is running (blocking overlay)
 *  - PreviewLoading: a document is being fetched
 *  - InlineLoader: small waits inside dialogs and panels
 * Every animation stops when the OS asks for reduced motion.
 */

const shimmer = keyframes`
  0% { background-position: -300px 0; }
  100% { background-position: 300px 0; }
`;
const slide = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(340%); }
`;
const spin = keyframes`
  to { transform: rotate(360deg); }
`;
// Signing card loop (3s): the signature draws itself on the page, then a lock
// seal pops onto the corner ("securing the document"), both fade, repeat.
const draw = keyframes`
  0% { stroke-dashoffset: 520; opacity: 1; }
  45% { stroke-dashoffset: 0; opacity: 1; }
  90% { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
`;
const seal = keyframes`
  0%, 48% { transform: scale(0); opacity: 0; }
  58% { transform: scale(1.15); opacity: 1; }
  64%, 90% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
`;

export const REDUCED = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

/** A grey placeholder bar with a soft shimmer. */
export const Shimmer = ({ width = '100%', height = 10, radius = 4, sx }) => (
  <Box
    component="span"
    aria-hidden
    sx={{
      display: 'block', width, height, borderRadius: `${radius}px`, flexShrink: 0,
      background: 'linear-gradient(90deg, #e9edf2 0, #f6f8fa 40px, #e9edf2 80px) no-repeat #e9edf2',
      backgroundSize: '300px 100%',
      animation: `${shimmer} 1.3s linear infinite`,
      ...REDUCED,
      ...sx,
    }}
  />
);

/** Small ring spinner in the brand colour. */
export const Spinner = ({ size = 20, thickness = 2.5, color = BRAND.primary, track = '#e3edf7' }) => (
  <Box
    component="span"
    aria-hidden
    sx={{
      display: 'inline-block', width: size, height: size, flexShrink: 0, borderRadius: '50%',
      border: `${thickness}px solid ${track}`, borderTopColor: color,
      animation: `${spin} .8s linear infinite`,
      ...REDUCED,
    }}
  />
);

/**
 * Thin progress bar. Without `value` it slides (indeterminate); with a 0–100
 * `value` it fills. `fixed` pins it to the top edge of the window.
 */
export const TopProgress = ({ fixed = false, height = 3, value }) => {
  const determinate = typeof value === 'number' && !Number.isNaN(value);
  return (
    <Box
      aria-hidden
      sx={{
        position: fixed ? 'fixed' : 'relative', top: 0, left: 0, right: 0, width: '100%', height,
        overflow: 'hidden', bgcolor: '#e3edf7', zIndex: fixed ? 1 : 'auto',
      }}
    >
      <Box
        sx={determinate
          ? { width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', bgcolor: BRAND.primary, transition: 'width .3s ease' }
          : { width: '30%', height: '100%', bgcolor: BRAND.primary, animation: `${slide} 1.1s ease-in-out infinite`, ...REDUCED }}
      />
    </Box>
  );
};

/** White card saying what is happening: spinner (or %), title, optional detail. */
// `logo`: optional image URL shown centred above the status line (e.g. the Alignsys logo while signing).
export const StatusCard = ({ title, subtitle, percentage, logo }) => {
  const hasPct = typeof percentage === 'number' && !Number.isNaN(percentage);
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'flex', flexDirection: 'column', gap: 1.5, px: 2.25, py: 1.75,
        minWidth: { xs: 'auto', sm: 300 }, maxWidth: 'min(420px, calc(100vw - 32px))', boxSizing: 'border-box',
        bgcolor: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: '12px',
        boxShadow: '0 12px 32px rgba(17, 24, 39, 0.16)',
      }}
    >
      {logo && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1.25, borderBottom: '1px solid #f0f1f3' }}>
          <Box component="img" src={logo} alt="Alignsys" sx={{ height: 34, width: 'auto', maxWidth: '70%', objectFit: 'contain', display: 'block' }} />
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {hasPct ? (
        <Box sx={{ minWidth: 40, height: 22, px: 0.75, borderRadius: 999, bgcolor: BRAND.surfaceLight, color: BRAND.primary, fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {`${Math.round(percentage)}%`}
        </Box>
      ) : (
        <Spinner size={22} />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.35 }}>
        <Typography component="span" sx={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{title}</Typography>
        {subtitle && (
          <Typography component="span" sx={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4, mt: 0.25 }}>{subtitle}</Typography>
        )}
      </Box>
      </Box>
    </Box>
  );
};

// Placeholder text line on the little document page.
const PageLine = ({ width, height = 4, mb = 6, color = '#eef1f5' }) => (
  <Box component="span" sx={{ display: 'block', width, height, borderRadius: 2, bgcolor: color, mb: `${mb}px` }} />
);

/**
 * "Signing document…" card: a small document page where the signature draws
 * itself onto the signature line, then a green lock seal pops onto the corner;
 * beside it the title, file name and explanation; a footer with "Please keep this
 * page open" and the Alignsys logo; a sliding bar along the bottom edge.
 * With reduced motion the signature and seal are shown still.
 */
export const SigningCard = ({ title, subtitle, fileName, logo }) => (
  <Box
    role="status"
    aria-live="polite"
    sx={{
      width: 'min(420px, calc(100vw - 32px))', boxSizing: 'border-box', overflow: 'hidden',
      bgcolor: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: '14px',
      boxShadow: '0 16px 40px rgba(17, 24, 39, 0.18)',
    }}
  >
    <Box sx={{
      display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: { xs: 2, sm: 2.5 },
      px: 3, pt: 3, pb: 2.5, textAlign: { xs: 'center', sm: 'left' },
    }}>
      {/* The document being signed */}
      <Box aria-hidden sx={{
        position: 'relative', width: 112, height: 144, flexShrink: 0, boxSizing: 'border-box', p: '14px 12px',
        bgcolor: '#fff', border: '1px solid #dfe3ea', borderRadius: '6px', boxShadow: '0 4px 12px rgba(17, 24, 39, 0.08)',
      }}>
        <PageLine width="60%" height={6} mb={10} color="#e3e8f0" />
        <PageLine width="92%" />
        <PageLine width="84%" />
        <PageLine width="88%" />
        <PageLine width="56%" mb={0} />
        <Box component="svg" width="84" height="30" viewBox="0 0 240 80" sx={{ position: 'absolute', left: 12, bottom: 20 }}>
          <Box
            component="path"
            d="M12 58 C 26 14, 48 10, 44 52 S 68 78, 88 42 S 118 18, 128 52 C 138 74, 158 28, 172 44 S 206 60, 228 28"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            sx={{
              strokeDasharray: 520,
              animation: `${draw} 3s ease-in-out infinite`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none', strokeDashoffset: 0 },
            }}
          />
        </Box>
        <Box component="span" sx={{ position: 'absolute', left: 12, right: 12, bottom: 18, height: '1px', bgcolor: '#c7d0de' }} />
        <Box component="span" sx={{
          position: 'absolute', right: -12, top: -12, width: 32, height: 32, borderRadius: '50%',
          bgcolor: '#2e7d32', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(46, 125, 50, 0.35)',
          animation: `${seal} 3s ease-out infinite`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Typography component="h2" sx={{ m: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.35 }}>{title}</Typography>
        {fileName && (
          <Typography noWrap title={fileName} sx={{ fontSize: 12.5, fontWeight: 500, color: BRAND.primary }}>{fileName}</Typography>
        )}
        {subtitle && (
          <Typography sx={{ m: 0, mt: 0.25, fontSize: 13, lineHeight: 1.5, color: '#4b5563' }}>{subtitle}</Typography>
        )}
      </Box>
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, px: 3, py: 1.25, borderTop: '1px solid #f0f1f3' }}>
      <Typography component="span" sx={{ fontSize: 11.5, color: '#6b7280' }}>Please keep this page open</Typography>
      {logo && <Box component="img" src={logo} alt="Alignsys" sx={{ height: 20, width: 'auto', display: 'block' }} />}
    </Box>
    <Box aria-hidden sx={{ height: 4, bgcolor: '#e3edf7', overflow: 'hidden' }}>
      <Box sx={{ width: '30%', height: '100%', bgcolor: BRAND.primary, animation: `${slide} 1.2s ease-in-out infinite`, ...REDUCED }} />
    </Box>
  </Box>
);

/** A small PDF badge (DSS documents are PDFs). */
const PdfBadge = () => (
  <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: '#d32f2f', color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    PDF
  </Box>
);

/**
 * Document on its way: a faint placeholder page behind a light wash, with a
 * centred dialog-style card (same look as the "Signing document…" overlay):
 * title, file name, a progress bar (fills with `percent` when known, otherwise
 * slides) and a line saying what is happening. It stays inside the viewer, so
 * the surrounding page (e.g. the previewer's Close button) still works.
 */
export const PreviewLoading = ({ fileName, percent, message = 'Opening document…', minHeight = 420 }) => {
  const hasPct = typeof percent === 'number' && !Number.isNaN(percent) && percent > 0;
  return (
    <Box
      sx={{ position: 'relative', width: '100%', height: '100%', minHeight, bgcolor: '#eef0f3', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', pt: 3, overflow: 'hidden', boxSizing: 'border-box' }}
    >
      {/* Placeholder page, then a wash so the card reads as a dialog on top. */}
      <Box aria-hidden sx={{ width: 'min(420px, calc(100% - 32px))', aspectRatio: '1 / 1.3', bgcolor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,.1)', p: '40px 38px', boxSizing: 'border-box' }}>
        <Shimmer width="55%" height={12} sx={{ mb: 2.75 }} />
        {['92%', '86%', '90%', '60%'].map((w, i) => <Shimmer key={`a${i}`} width={w} height={8} sx={{ mb: i === 3 ? 3.25 : 1.25 }} />)}
        {['94%', '82%', '72%'].map((w, i) => <Shimmer key={`b${i}`} width={w} height={8} sx={{ mb: 1.25 }} />)}
      </Box>
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(238, 242, 247, 0.6)' }} />

      <Box
        role="status"
        aria-live="polite"
        aria-busy="true"
        sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 'min(380px, calc(100% - 32px))',
          bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 16px 40px rgba(17, 24, 39, 0.18)',
          boxSizing: 'border-box', overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, bgcolor: BRAND.primary, color: '#fff' }}>
          <Spinner size={16} color="#fff" track="rgba(255, 255, 255, 0.35)" />
          <Typography component="span" sx={{ fontSize: 14, fontWeight: 600 }}>Opening document</Typography>
        </Box>
        <Box sx={{ px: 2, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PdfBadge />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Typography noWrap title={fileName || undefined} sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: '#111827' }}>
                {fileName || 'Document'}
              </Typography>
              {hasPct && <Typography sx={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>{`${Math.round(percent)}%`}</Typography>}
            </Box>
            <Box sx={{ mt: 0.9, borderRadius: 999, overflow: 'hidden' }}>
              <TopProgress height={5} value={hasPct ? percent : undefined} />
            </Box>
            <Typography sx={{ mt: 0.75, fontSize: 12, color: '#6b7280' }}>{message}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

/** Small wait inside a dialog or panel: spinner + one line (+ optional second line). */
export const InlineLoader = ({ msg = 'Loading…', msg2, minHeight = 150 }) => (
  <Box role="status" aria-live="polite" sx={{ minHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.75, p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Spinner size={18} />
      <Typography component="span" sx={{ fontSize: 13, color: '#4b5563' }}>{msg}</Typography>
    </Box>
    {msg2 && <Typography component="span" sx={{ fontSize: 12, color: '#6b7280' }}>{msg2}</Typography>}
  </Box>
);

Shimmer.propTypes = { width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), height: PropTypes.number, radius: PropTypes.number, sx: PropTypes.object };
Spinner.propTypes = { size: PropTypes.number, thickness: PropTypes.number, color: PropTypes.string, track: PropTypes.string };
TopProgress.propTypes = { fixed: PropTypes.bool, height: PropTypes.number, value: PropTypes.number };
StatusCard.propTypes = { title: PropTypes.node, subtitle: PropTypes.node, percentage: PropTypes.number };
SigningCard.propTypes = { title: PropTypes.node, subtitle: PropTypes.node, fileName: PropTypes.string, logo: PropTypes.string };
PreviewLoading.propTypes = { fileName: PropTypes.string, percent: PropTypes.number, message: PropTypes.string, minHeight: PropTypes.number };
InlineLoader.propTypes = { msg: PropTypes.string, msg2: PropTypes.string, minHeight: PropTypes.number };
