import React, { useMemo, useState } from 'react';
import { Box, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { FaCheck, FaEraser, FaSearch, FaArrowRight } from 'react-icons/fa';
import { signerColor } from './signerColors';

// "Who signs where?" side panel of the place-signature-boxes screen (main app dialog and
// the M-Files integration page). Presentational: selection and placing stay with the
// caller (handleSelectUser / addSignatureBox), as before.
//
// signers: [{ email }]; signatureBoxes: [{ signer: { id, email, color }, annotations: [{ pageNumber }] }]
// activeIndex: the selected signer's index; placing: true while the next click places a box.
export const boxesFor = (signatureBoxes, email) => (signatureBoxes || [])
  .filter((b) => b.signer?.email === email)
  .flatMap((b) => b.annotations || []);

const pagesOf = (boxes) => [...new Set(boxes.map((a) => a.pageNumber))].sort((a, b) => a - b);

// With many signers: a search box, and a shortcut to the next signer still without a box.
const SEARCH_AFTER = 8;

export default function SignerBoxesPanel({
  signers = [], signatureBoxes = [], activeIndex = null, placing = false,
  onSelect, onRemoveBoxes, footer,
}) {
  const [query, setQuery] = useState('');
  const counts = useMemo(() => signers.map((s) => boxesFor(signatureBoxes, s.email)), [signers, signatureBoxes]);
  const withBoxes = counts.filter((b) => b.length > 0).length;
  const q = query.trim().toLowerCase();
  const rows = signers
    .map((s, index) => ({ s, index }))
    .filter(({ s }) => !q || s.email.toLowerCase().includes(q));

  // Next signer (after the selected one, wrapping round) who has no box yet.
  const nextWithout = (() => {
    const n = signers.length;
    if (!n || withBoxes === n) return null;
    const start = activeIndex == null ? -1 : activeIndex;
    for (let k = 1; k <= n; k += 1) {
      const i = (start + k) % n;
      if (!counts[i].length) return i;
    }
    return null;
  })();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: '#fff' }}>
      <Box sx={{ p: '18px 18px 10px', display: 'flex', flexDirection: 'column', gap: 0.75, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Who signs where?</Typography>
          <Typography sx={{ fontSize: 12, color: '#6D7386' }}>{signers.length} signer{signers.length === 1 ? '' : 's'}</Typography>
        </Box>
        <Typography sx={{ fontSize: 12.5, color: '#6D7386', lineHeight: 1.5 }}>
          Pick a signer, then click on the page to place a box. Pick them again for each extra box. Drag a box to move it.
        </Typography>
        {signers.length > SEARCH_AFTER && (
          <TextField
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a signer"
            inputProps={{ 'aria-label': 'Find a signer' }}
            InputProps={{ startAdornment: <FaSearch size={12} color="#9aa3b2" style={{ marginRight: 8 }} /> }}
            sx={{ mt: 0.5, '& .MuiInputBase-root': { fontSize: 12.8, minHeight: 34 }, '& .MuiInputBase-input': { py: '6px' } }}
          />
        )}
      </Box>

      <Box sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', px: 1.75, pb: 1 }}>
        {rows.length === 0 ? (
          <Typography sx={{ fontSize: 12.5, color: '#9ca3af', px: 0.5, py: 1 }}>No signer matches "{query}".</Typography>
        ) : (
          // One compact row per signer (about 38px) so long lists stay manageable.
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, border: '1px solid #e5e7eb', borderRadius: 1.5, overflow: 'hidden' }}>
            {rows.map(({ s, index }, i) => {
              const color = signerColor(index);
              const boxes = counts[index];
              const selected = activeIndex === index;
              const isPlacing = selected && placing;
              const pages = pagesOf(boxes);
              return (
                <Box
                  component="li"
                  key={s.email}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5, pr: 0.75,
                    borderTop: i ? '1px solid #f3f4f6' : 'none',
                    bgcolor: isPlacing ? `${color}14` : selected ? '#f7f8fa' : '#fff',
                    boxShadow: isPlacing ? `inset 0 0 0 2px ${color}` : 'none',
                  }}
                >
                  <Box
                    component="button"
                    type="button"
                    aria-pressed={isPlacing}
                    onClick={() => onSelect?.(index, s)}
                    title={isPlacing ? 'Click on the page to place a box' : `Place a box for ${s.email}`}
                    sx={{
                      font: 'inherit', flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: 1,
                      minHeight: 38, px: 1.25, border: 0, bgcolor: 'transparent', cursor: 'pointer', textAlign: 'left',
                      '&:focus-visible': { outline: '2px solid #2757aa', outlineOffset: -2 },
                    }}
                  >
                    <Box component="span" aria-hidden sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: color, color: '#fff', fontSize: 10.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {index + 1}
                    </Box>
                    <Box component="span" title={s.email} sx={{ flex: '1 1 auto', minWidth: 0, fontSize: 12.8, fontWeight: isPlacing ? 600 : 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.email}
                    </Box>
                    {isPlacing ? (
                      <Box component="span" sx={{ fontSize: 11, fontWeight: 600, color, whiteSpace: 'nowrap', flexShrink: 0 }}>Placing…</Box>
                    ) : (
                      <Box
                        component="span"
                        title={boxes.length ? `Page${pages.length === 1 ? '' : 's'} ${pages.join(', ')}` : undefined}
                        sx={{ fontSize: 11.5, color: boxes.length ? '#2e7d32' : '#8a6100', whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        {boxes.length ? `${boxes.length} box${boxes.length === 1 ? '' : 'es'}` : 'No boxes'}
                      </Box>
                    )}
                  </Box>
                  {boxes.length > 0 && onRemoveBoxes && (
                    <Tooltip title={`Remove ${s.email.split('@')[0]}'s boxes`}>
                      <IconButton
                        size="small"
                        aria-label={`Remove all boxes for ${s.email}`}
                        onClick={() => onRemoveBoxes(s.email)}
                        sx={{ width: 28, height: 28, color: '#b42318', flexShrink: 0, '&:hover': { bgcolor: '#fdecea' } }}
                      >
                        <FaEraser size={12} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        <Box sx={{ mt: 1.25, p: '8px 10px', borderRadius: 1.5, bgcolor: '#f7faff', border: '1px solid #c5d9ed', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
          <Box component="strong" sx={{ fontWeight: 600, color: '#1a3a7a' }}>Tips</Box>{' '}
          Click a box to select it, then use Remove or press Delete. The page list on the left shows where boxes are.
        </Box>
      </Box>

      <Box sx={{ borderTop: '1px solid #e5e7eb', p: '14px 18px', display: 'flex', flexDirection: 'column', gap: 1.25, flexShrink: 0 }}>
        {signers.length > 0 && (withBoxes === signers.length ? (
          <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 12.5, color: '#2e7d32' }}>
            <FaCheck size={12} aria-hidden /> Every signer has a box
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: 12.5, color: '#374151', flex: '1 1 auto' }}>
              <strong>{withBoxes} of {signers.length}</strong> signer{signers.length === 1 ? ' has' : 's have'} a box
            </Typography>
            {nextWithout != null && signers.length > 1 && (
              <Button
                size="small"
                endIcon={<FaArrowRight size={10} />}
                onClick={() => { setQuery(''); onSelect?.(nextWithout, signers[nextWithout]); }}
                sx={{ textTransform: 'none', fontSize: 12, color: '#2757aa', px: 0.75, minWidth: 0, whiteSpace: 'nowrap' }}
              >
                Next without a box
              </Button>
            )}
          </Box>
        ))}
        {footer}
      </Box>
    </Box>
  );
}
