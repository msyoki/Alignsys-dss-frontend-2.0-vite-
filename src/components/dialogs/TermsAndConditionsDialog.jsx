import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Slide from '@mui/material/Slide';
import { ButtonComponent,CheckBoxComponent  } from '@syncfusion/ej2-react-buttons';
import logo from '../../images/ZFWHITE.webp'

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
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >

            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div" style={{fontSize:'14px'}}>
            
              <img src={logo} height={'30px'}/>
            </Typography>
            <Button autoFocus color="inherit" onClick={handleClose}>
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
                <ButtonComponent  
                  cssClass='e-custom-primary' 
                  className='m-2 p-2' 
                  style={{textTransform: 'none',fontWeight:'lighter',fontSize:'12px'}}   
                  disabled={false} 
                  onClick={handleClose}
                  > <span className='mx-2'> I Agree</span> </ButtonComponent>
                                 
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