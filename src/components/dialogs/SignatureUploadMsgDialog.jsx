import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import {Button} from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SignatureUploadMsgDialog(props) {

  const handleClose = () => {
    props.setBadSignature(false)
    
  };

  return (
    <div>

      <Dialog
        open={props.badsignature}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle className='text-center'><i className="fas fa-image text-center mb-4"  style={{fontSize:'40px',color:'#1C4690'}}></i></DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description" className='text-center'>
           
           <p  style={{fontWeight:'lighter',color:'#1C4690'}}>{"Signature Image Requirement"}</p> 
         
           <p style={{fontSize:'14.5px'}}> For quality purpose, the required signature image size must be at least ( 200 x 200 ) pixels .
            Your uploaded image size was <span className='text-danger'>( {props.signatureWidth} x {props.signatureHeight} ) pixels</span>, please upload another image as recommended. </p>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' color='primary' onClick={handleClose}         sx={{
                      textTransform: 'none',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: '999px',
                      px: 1.8,
                      py: 0.8,
                      minHeight: 34,
                      boxShadow: 'none',
                    
                    }}>Upload another image</Button>
          {/* <Button onClick={handleClose}>Agree</Button> */}
        </DialogActions>
      </Dialog>
    </div>
  );
}