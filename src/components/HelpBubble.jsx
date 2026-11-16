import React, { useState } from 'react';
import {
  Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Button, Tooltip, Typography,
} from '@mui/material';
import { FaInfoCircle, FaTimes } from 'react-icons/fa';
import '../styles/HelpBubble.css'; // Import the CSS file for styling
import Chatbot from './Chatbot.jsx';
import { BRAND, NEUTRAL_COLORS } from './layout/shellTheme';

/** A button name as it appears on screen. */
const Btn = ({ children }) => (
  <Box component="strong" sx={{ fontWeight: 600, color: BRAND.primaryDark, whiteSpace: 'nowrap' }}>{children}</Box>
);

/** One numbered step: title line plus details. */
const Step = ({ n, title, children }) => (
  <Box component="li" sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
    <Box
      aria-hidden
      sx={{
        flexShrink: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: BRAND.primary, color: '#fff',
        fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: '1px',
      }}
    >
      {n}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: NEUTRAL_COLORS.strong, mb: 0.25 }}>{title}</Typography>
      <Box sx={{ fontSize: 13, color: NEUTRAL_COLORS.body, lineHeight: 1.55, '& ul': { pl: 2.25, my: 0.5 }, '& li': { mb: 0.25 } }}>
        {children}
      </Box>
    </Box>
  </Box>
);

const HelpBubble = ({ content, base64, filename }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => setModalOpen((open) => !open);
  const handleCloseModal = () => setModalOpen(false);

  return (
    <div className="help-bubble-container">
      <Tooltip placement="left-end" title="Help | How to sign the document?">
        <IconButton
          aria-label="How to sign the document"
          sx={{
            backgroundColor: '#2757aa',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            '&:hover': { backgroundColor: '#1C4690' }
          }}
          onClick={handleOpenModal}
        >
          <FaInfoCircle size={15} color="#fff" />
        </IconButton>
      </Tooltip>

      <Chatbot base64={base64} filename={filename} />

      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        scroll="paper"
        fullWidth
        maxWidth="sm"
        aria-labelledby="help-dialog-title"
      >
        <DialogTitle id="help-dialog-title" sx={{ bgcolor: BRAND.primary, color: '#fff', py: 1, pl: 2, pr: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FaInfoCircle size={16} aria-hidden />
            <Typography component="span" sx={{ fontSize: 14.5, fontWeight: 600, flex: 1 }}>How to sign this document</Typography>
            <IconButton aria-label="Close" onClick={handleCloseModal} size="small" sx={{ color: '#fff' }}>
              <FaTimes size={14} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            <Step n={1} title="Open the document">
              If the sender added your phone number, you&apos;ll first be asked for the one-time code (OTP) sent to
              your phone. Once the document loads, the toolbar at the top shows <Btn>Sign</Btn>, <Btn>Stamp</Btn> and{' '}
              <Btn>Decline</Btn>.
            </Step>

            <Step n={2} title="Click Sign">
              <ul>
                <li>If the sender marked where you should sign, you&apos;re taken straight to those signing boxes.</li>
                <li>Otherwise, choose <Btn>Sign current page</Btn> or <Btn>Sign all pages</Btn>.</li>
              </ul>
            </Step>

            <Step n={3} title="Create or choose your signature">
              In the signature window, pick a tab:
              <ul>
                <li><Btn>Draw</Btn> — draw it on the pad.</li>
                <li><Btn>Upload</Btn> — use an image from your device.</li>
                <li><Btn>Select</Btn> — pick one you saved before.</li>
              </ul>
              Optionally turn on <Btn>Save Signature?</Btn> to reuse it next time, and add an email stamp or the
              date &amp; time. Then click <Btn>Place … Signature</Btn> (for example <Btn>Place Drawn Signature</Btn>).
            </Step>

            <Step n={4} title="Put it on the page">
              Click the spot on the page where the signature should go. Drag it to move it and drag its corner to
              resize it.
              <ul>
                <li>Signing all pages? Place it on one page, then click <Btn>Sign All</Btn> to copy it to every page in
                  the same position (or <Btn>Abort</Btn> to cancel).</li>
                <li>Need it somewhere else too? Click <Btn>Place Signature Again</Btn>.</li>
                <li>Want to start over? <Btn>Replace Signature</Btn> removes the placed signature.</li>
              </ul>
            </Step>

            <Step n={5} title="Add a stamp or text (optional)">
              <Btn>Stamp</Btn> works the same way, using <Btn>Upload</Btn> or <Btn>Select</Btn>. To add text, click{' '}
              <Btn>Add Text</Btn>, click on the page, then double-click the text to edit it.
            </Step>

            <Step n={6} title="Click Finish">
              Check that everything is in place, then confirm. If the sender requires it, enter your account password
              to unlock signing. Your signed document is then submitted.
            </Step>
          </Box>

          <Box sx={{ mt: 0.5, p: 1.5, borderRadius: 1, bgcolor: BRAND.surfaceLight, fontSize: 12.5, color: NEUTRAL_COLORS.body, lineHeight: 1.55 }}>
            <strong>Don&apos;t want to sign?</strong> Click <Btn>Decline</Btn> and give a reason. You can also read and
            add <Btn>Comments</Btn> from the Document Details panel.
          </Box>

          {content && (
            <Typography sx={{ fontSize: 13, mt: 2, color: NEUTRAL_COLORS.body }}>{content}</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleCloseModal} variant="contained" disableElevation sx={{ textTransform: 'none', fontSize: 13, bgcolor: BRAND.primary }}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default HelpBubble;
