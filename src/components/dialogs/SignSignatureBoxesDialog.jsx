import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { FaCheck, FaTimes } from 'react-icons/fa';


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
        <div className="d-flex justify-content-center">
                    <Button
                      variant="outlined"
                      color="warning"
                      className="m-2 p-2"
                      sx={{
                      textTransform: 'none',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: '999px',
                      px: 1.8,
                      py: 0.8,
                      minHeight: 34,
                      boxShadow: 'none',
                     
                    }}
                      onClick={handleClose}
                    >
                      <FaTimes size={15} className="mx-1" /> <span className="mx-2">Cancel</span>
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      className="m-2 p-2"
                      sx={{
                      textTransform: 'none',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: '999px',
                      px: 1.8,
                      py: 0.8,
                      minHeight: 34,
                      boxShadow: 'none',
                     
                    }}
                      onClick={handleComplete}
                    >
                      <FaCheck size={15} className="mx-1" /> <span className="mx-2">Proceed</span>
                    </Button>
                  </div>
  
   
      </DialogContent>
      
    </Dialog>
  );
}
