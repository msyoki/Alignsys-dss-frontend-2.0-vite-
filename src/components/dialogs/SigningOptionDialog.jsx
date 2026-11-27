import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { Box, ButtonBase, Typography } from '@mui/material';
import { FaInfoCircle, FaSignature, FaStamp } from 'react-icons/fa';

import { DialogHeader } from '../common/dialogKit';
import { BRAND } from '../layout/shellTheme';

/*
 * First step of Sign / Stamp: put it on the current page or on all pages.
 * Next comes the signature dialog (it offers the default signature first).
 */

// A page outline with a small signature bar in the corner.
const PageIcon = ({ stacked }) => (
  <Box aria-hidden sx={{ position: 'relative', width: 64, height: 64 }}>
    {stacked && (
      <>
        <Box sx={{ position: 'absolute', left: 12, top: 0, width: 46, height: 56, boxSizing: 'border-box', border: '1.5px solid #9fb3d6', borderRadius: '6px', bgcolor: '#fff' }} />
        <Box sx={{ position: 'absolute', left: 6, top: 4, width: 46, height: 56, boxSizing: 'border-box', border: '1.5px solid #6f8cc0', borderRadius: '6px', bgcolor: '#fff' }} />
      </>
    )}
    <Box sx={{
      position: 'absolute', left: 0, top: stacked ? 8 : 0, width: 46, height: 56, boxSizing: 'border-box',
      border: `1.5px solid ${BRAND.primary}`, borderRadius: '6px', bgcolor: '#fff',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', p: '7px',
    }}>
      <Box sx={{ width: 20, height: 7, borderRadius: '2px', bgcolor: BRAND.primary }} />
    </Box>
  </Box>
);

const Choice = ({ title, detail, stacked, onClick }) => (
  <ButtonBase
    onClick={onClick}
    sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5, p: 2, textAlign: 'left',
      border: '1px solid #d0d7e2', borderRadius: '12px', bgcolor: '#fff',
      transition: 'border-color .15s ease, background-color .15s ease',
      '&:hover': { borderColor: BRAND.primary, bgcolor: '#f7faff' },
      '&.Mui-focusVisible': { outline: `2px solid ${BRAND.primary}`, outlineOffset: 2 },
    }}
  >
    <PageIcon stacked={stacked} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
      <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, color: BRAND.primaryDark }}>{title}</Typography>
      <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, color: '#4b5563' }}>{detail}</Typography>
    </Box>
  </ButtonBase>
);

function SigningOptionDialog(props) {
  const verb = props.isStamp ? 'Stamp' : 'Sign';
  const kind = props.isStamp ? 'stamp' : 'signature';
  const pages = Number(props.numPages) || 0;

  const handleSignOnePage = () => {
    props.setOpen(false);
    props.signonePage();
  };

  const handleSignAllPages = () => {
    props.setOpen(false);
    props.signAllpages();
  };

  const handleClose = () => props.setOpen(false);

  return (
    <Dialog open={!!props.open} onClose={handleClose} fullWidth maxWidth="xs" aria-labelledby="signing-option-title"
      PaperProps={{ sx: { maxWidth: 480 } }}>
      <DialogHeader
        id="signing-option-title"
        icon={props.isStamp ? <FaStamp /> : <FaSignature />}
        title={`${verb} document`}
        onClose={handleClose}
      />
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pt: '20px !important', pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography component="h3" sx={{ m: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
            Where should the {kind} go?
          </Typography>
          {(props.docname || pages > 0) && (
            <Typography sx={{ mt: 0.25, fontSize: 13, color: '#4b5563' }}>
              {[props.docname, pages > 0 ? `${pages} page${pages === 1 ? '' : 's'}` : null].filter(Boolean).join(' · ')}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
          <Choice title={`${verb} current page`} detail="Only the page you are viewing." onClick={handleSignOnePage} />
          <Choice
            title={`${verb} all pages`}
            detail={pages > 1 ? `The same spot on all ${pages} pages.` : 'The same spot on every page.'}
            stacked
            onClick={handleSignAllPages}
          />
        </Box>

        <Typography component="p" sx={{ m: 0, display: 'flex', alignItems: 'flex-start', gap: 1, px: 1.5, py: 1.25, borderRadius: '8px', bgcolor: '#f3f5f8', fontSize: 12, lineHeight: 1.45, color: '#4b5563' }}>
          <FaInfoCircle size={13} color={BRAND.primary} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
          Next you can use your default {kind} or choose another one.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default SigningOptionDialog;
