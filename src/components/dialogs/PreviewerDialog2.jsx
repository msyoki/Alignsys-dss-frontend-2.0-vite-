import React from 'react';

import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Slide from '@mui/material/Slide';

import { FaTimes } from 'react-icons/fa';

import PDFViewerPreviewLoader from '../preview/PDFViewerPreviewLoader';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function PreviewerDialog2(props) {
  const handleClose = () => {
    props.setOpenPreviewerDialog(false);
  };

  return (
    <Dialog
      fullScreen
      open={props.openpreviewerdialog}
      onClose={handleClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // 🚫 prevents scroll bleed
        },
      }}
    >
      {/* ---------------- HEADER ---------------- */}
      <AppBar
        position="static"
        elevation={2}
        sx={{
          backgroundColor: '#1C4690',
          color: '#fff',
          flexShrink: 0, // keeps header fixed
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            minHeight: '48px !important',
          }}
        >
          <IconButton
            onClick={handleClose}
            aria-label="close"
            sx={{
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.15)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.25)',
              },
            }}
          >
            <FaTimes />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ---------------- VIEWER (FITS REMAINING HEIGHT) ---------------- */}
      <div
        style={{
          flex: 1,              // 👈 takes remaining space
          overflow: 'hidden',   // 🚫 no internal scroll container
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <PDFViewerPreviewLoader
          height="100%"
          document={props.filepreviewurl}
        />
      </div>
    </Dialog>
  );
}

export default PreviewerDialog2;