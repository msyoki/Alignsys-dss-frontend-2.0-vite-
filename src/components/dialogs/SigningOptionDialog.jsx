import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { FaStamp, FaSignature, FaCopy } from 'react-icons/fa';
import Slide from '@mui/material/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />
})


const pillBtn = {
  textTransform: 'none',
  borderRadius: '999px',
  px: 2,
  py: 1,
  fontSize: { xs: '12px', sm: '13px' },
  minHeight: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 1.5, // more space between icon and text
};


function SigningOptionDialog(props) {

  const handleSignOnePage = (e) => {
    e.preventDefault()
    props.setOpen(false);
    props.signonePage();
  };

  const handleSignAllPages = (e) => {
    e.preventDefault()
    props.setOpen(false);
    props.signAllpages()
  };
  const handleClose = (event, reason) => {
    if (reason !== 'backdropClick') {
      props.setOpen(false);
    }
  };
  return (
    <div>

      <Dialog disableEscapeKeyDown open={props.open} onClose={handleClose} TransitionComponent={Transition}>
        <DialogTitle style={{ color: "#ffff", backgroundColor: "#1C4690", fontSize: "15px" }} className='text-center'>{props.isStamp ? <>Stamp Document</> : <>Sign Document</>}</DialogTitle>
        <DialogContent  >
          <p className='mt-3 text-center' style={{ fontSize: '40px', color: '#1C4690' }}>
            {props.isStamp ? <FaStamp className='mx-2' /> : <FaSignature className='mx-2' />}
          </p>
          <p className=' text-center' style={{ fontSize: "12px" }}>How would you like you to {props.isStamp ? <>stamp</> : <>sign</>} the document ? </p>

          <div className="d-flex flex-wrap justify-content-center gap-2">
            <Button
              variant="outlined"
              onClick={handleSignOnePage}
              startIcon={
                props.isStamp ? (
                  <FaStamp size={13}  color='#555' />
                ) : (
                  <FaSignature size={13} color='#555' />
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
              startIcon={<FaCopy size={13} color='#555' />}
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
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {/* <Button onClick={handleClose}>Ok</Button> */}
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default SigningOptionDialog;
