import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { Box, Typography } from '@mui/material';
import { FaCheck, FaSignature } from 'react-icons/fa';

import { DialogFooter, DialogHeader, PrimaryButton, SecondaryButton } from '../common/dialogKit';
import { BRAND } from '../layout/shellTheme';

// "1", "1 and 4", "1, 4 and 6"
const joinPages = (pages) => (pages.length <= 1
  ? `${pages[0] ?? ''}`
  : `${pages.slice(0, -1).join(', ')} and ${pages[pages.length - 1]}`);

/**
 * Confirm placing the signature in every area the sender assigned to this signer.
 * `areas`: the signer's assigned boxes ({ page_number, ... }); used for the count and pages.
 */
export default function SignSignatureBoxesDialog(props) {
  const areas = Array.isArray(props.areas) ? props.areas : [];
  const count = areas.length;
  const pages = [...new Set(areas.map((a) => a?.page_number).filter((p) => p != null))].sort((a, b) => a - b);

  const handleClose = () => props.setOpen(false);

  const handleComplete = () => {
    props.handleAnnotation();
    props.setOpen(false);
  };

  const question = count > 1 ? `Sign all ${count} assigned areas?` : 'Sign the assigned area?';
  const detail = count > 0
    ? `Your signature will be placed in ${count > 1 ? 'every area' : 'the area'} the sender marked for you${pages.length ? `, on page${pages.length > 1 ? 's' : ''} ${joinPages(pages)}` : ''}.`
    : 'Your signature will be placed in the areas the sender marked for you.';

  return (
    <Dialog open={!!props.open} onClose={handleClose} fullWidth maxWidth="xs" aria-labelledby="sign-areas-title" aria-describedby="sign-areas-desc">
      <DialogHeader id="sign-areas-title" icon={<FaSignature />} title="Sign assigned areas" onClose={handleClose} />
      <DialogContent sx={{ px: 3, pt: '22px !important', pb: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box aria-hidden sx={{ width: 52, height: 52, flexShrink: 0, borderRadius: '50%', bgcolor: BRAND.surfaceLight, color: BRAND.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          <FaSignature />
        </Box>
        <Box id="sign-areas-desc" sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{question}</Typography>
          <Typography sx={{ mt: 0.5, fontSize: 13, lineHeight: 1.5, color: '#4b5563' }}>{detail}</Typography>
        </Box>
      </DialogContent>
      <Box sx={{ borderTop: '1px solid #e5e7eb' }}>
        <DialogFooter>
          <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleComplete} startIcon={<FaCheck />} autoFocus>
            {count > 1 ? `Sign ${count} areas` : 'Sign area'}
          </PrimaryButton>
        </DialogFooter>
      </Box>
    </Dialog>
  );
}
