import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Slide from '@mui/material/Slide';

import { FaStamp, FaSignature, FaCopy } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const pillBtn = {
  textTransform: 'none',
  borderRadius: '999px',
  px: 2,
  py: 1,
  fontSize: { xs: '12px', sm: '13px' },
  minHeight: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
};

function SigningOptionDialog(props) {

  const handleSignOnePage = (e) => {
    e.preventDefault();
    props.setOpen(false);
    props.signonePage();
  };

  const handleSignAllPages = (e) => {
    e.preventDefault();
    props.setOpen(false);
    props.signAllpages();
  };

  const handleClose = (event, reason) => {
    if (reason !== 'backdropClick') {
      props.setOpen(false);
    }
  };

  return (
    <div>
      <Dialog
        disableEscapeKeyDown
        open={props.open}
        onClose={handleClose}
        TransitionComponent={Transition}
      >

        {/* Header */}
        <DialogTitle
          sx={{
            color: "#fff",
            backgroundColor: "#1C4690",
            fontSize: "15px",
            textAlign: 'center',
            position: 'relative',
            py: 1.5,
          }}
        >
          {props.isStamp ? 'Stamp Document' : 'Sign Document'}

          {/* Close Icon */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#fff',
            }}
          >
            <IoClose size={22} />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <p
            className='mt-3 text-center'
            style={{ fontSize: '40px', color: '#1C4690' }}
          >
            {props.isStamp ? (
              <FaStamp className='mx-2' />
            ) : (
              <FaSignature className='mx-2' />
            )}
          </p>

          <p
            className='text-center'
            style={{ fontSize: "12px" }}
          >
            How would you like you to {props.isStamp ? 'stamp' : 'sign'} the document?
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-2">
            <Button
              variant="outlined"
              onClick={handleSignOnePage}
              startIcon={
                props.isStamp ? (
                  <FaStamp size={13}  />
                ) : (
                  <FaSignature size={13}  />
                )
              }
              sx={{
                ...pillBtn,
                px: { xs: 1.5, sm: 2 },
                py: 0.8,
                display: 'inline-flex',
                alignItems: 'center',
                width: 'auto',
                minWidth: 'unset',
                fontWeight: 500,
              }}
            >
              {props.isStamp ? 'Stamp' : 'Sign'} current page
            </Button>

            <Button
              variant="outlined"
              onClick={handleSignAllPages}
              startIcon={<FaCopy size={13}  />}
              sx={{
                ...pillBtn,
                px: { xs: 1.5, sm: 2 },
                py: 0.8,
                display: 'inline-flex',
                alignItems: 'center',
                width: 'auto',
                minWidth: 'unset',
                fontWeight: 500,
              }}
            >
              {props.isStamp ? 'Stamp' : 'Sign'} all pages
            </Button>
          </div>
        </DialogContent>

        {/* Removed Cancel Button */}
        <DialogActions />
      </Dialog>
    </div>
  );
}

export default SigningOptionDialog;