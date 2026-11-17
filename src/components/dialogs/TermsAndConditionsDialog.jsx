import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { PILL, SF_PILL } from '../common/pillButton';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Slide from '@mui/material/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

function TermsAndConditionsDialog(props) {
 


  const handleClose = () => {
    props.setOpenTAndCDialog(false);
  };

  return (
    <div>

      <Dialog
        fullScreen
        open={props.opentandcdialog}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' ,backgroundColor:'#1C4690'}}>
          <Toolbar>
            <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 600 }} component="h2">
              Terms and Conditions
            </Typography>
            <Button
              autoFocus
              color="inherit"
              onClick={handleClose}
              sx={{ ...PILL, color: '#fff', border: '1px solid rgba(255,255,255,0.75)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: '#fff', boxShadow: 'none' } }}
            >
              Close
            </Button>
          </Toolbar>
        </AppBar>
        <DialogContent >
          <DialogContentText id="alert-dialog-description"  className='p-5 text-center' style={{fontSize:'12px'}}>
            
            <h5 className='text-center m-4 ' style={{color:'#1C4690'}}>Terms & Conditions</h5> 
            <hr/> 
            <h6 className='text-center m-4' style={{color:'#1C4690'}}>Corporate Digital Signing Service</h6>  
            <div className='row'>
              <div className='col-2'>   </div>
              <div className='col-xl-8 col-lg-8 col-md-12 col-sm-12'>
                
                <p>Please note that by checking the T&C check box and signing any document generated on the Alignsys Digital Signing Service (DSS), I agree that I have reviewed the following disclosure and consent to:</p>
                <ol style={{listStyle:'none'}}>
                  <li>(i) Transact business by electronic means;</li>
                  <li>(ii) Receive documents electronically, and;</li>
                  <li>(iii) Use the Alignsys DSS system. I understand that this service is provided on behalf of registered Alignsys DSS users (the “sending party”) who are sending electronic documents to me.
                      By proceeding to utilize the service, I acknowledge that the eligibility of electronic signatures placed through this service may or may not be legally binding and/or admissible within all jurisdictions in which it is presented.</li>
                </ol>
                {/* <button className='mt-2 btn btn-primary' onClick={handleClose}>I Agree</button> */}
                <Button variant="contained" disableElevation sx={SF_PILL.primary} onClick={handleClose}>I Agree</Button>
                                 
              </div>
              <div className='col-2'>   </div>
            </div>
      
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TermsAndConditionsDialog