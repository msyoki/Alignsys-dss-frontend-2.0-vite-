import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { PILL } from '../common/pillButton';


export default function SignSignatureBoxesDialog(props) {
  const handleClose = () => {
    props.setOpen(false);
  };

  const handleComplete = () => {
    props.handleAnnotation()
    props.setOpen(false);
    // Add your 'complete' logic here
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleClose}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      {/* <DialogTitle id="dialog-title">Confirm Action</DialogTitle> */}
      <DialogTitle style={{color:"#ffff",backgroundColor:"#1C4690",fontSize:"15px"}} className='text-center'>Sign on Assigned Areas</DialogTitle>
      <DialogContent>

        <p className=' text-center p-3' style={{fontSize:"13px"}}>Are you certain you want to finalize the signatures in the designated areas? </p>
        <div className="d-flex justify-content-center flex-wrap gap-2 pb-2">
                    <Button
                      variant="outlined"
                      color="warning"
                      sx={PILL}
                      startIcon={<FaTimes />}
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      sx={PILL}
                      startIcon={<FaCheck />}
                      onClick={handleComplete}
                    >
                      Proceed
                    </Button>
                  </div>
  
   
      </DialogContent>
      
    </Dialog>
  );
}
