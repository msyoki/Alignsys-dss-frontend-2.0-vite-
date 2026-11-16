import * as React from 'react';
import { FaImage } from 'react-icons/fa';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import {Button} from '@mui/material';
import { PILL } from '../common/pillButton';

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
        <DialogTitle className='text-center'><FaImage className="text-center mb-4" style={{ fontSize:'40px',color:'#1C4690', verticalAlign: '-0.125em' }} aria-hidden /></DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description" className='text-center'>
           
           <p  style={{fontWeight:'lighter',color:'#1C4690'}}>{"Signature Image Requirement"}</p> 
         
           <p style={{fontSize:'14.5px'}}> For quality purpose, the required signature image size must be at least ( 200 x 200 ) pixels .
            Your uploaded image size was <span className='text-danger'>( {props.signatureWidth} x {props.signatureHeight} ) pixels</span>, please upload another image as recommended. </p>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' color='primary' onClick={handleClose}         sx={{
            ...PILL,
          }}>Upload another image</Button>
          {/* <Button onClick={handleClose}>Agree</Button> */}
        </DialogActions>
      </Dialog>
    </div>
  );
}