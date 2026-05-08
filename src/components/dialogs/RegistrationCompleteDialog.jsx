import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';

import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import '../../styles/App.css'
import useMediaQuery from '@mui/material/useMediaQuery';
import companylogo from '../../images/ZFBLU.webp'

import { useTheme } from '@mui/material/styles';

const RegistrationCompleteDialog = (props) => {
  let navigate = useNavigate()

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [fullWidth, setFullWidth] = React.useState(true);


  const handleClose = () => {
    props.setCompanyRegCompleteDialog(false);
    navigate('/login')

  };



  return (
    <div >
      <Dialog
        fullWidth={fullWidth}
        fullScreen={fullScreen}
        open={props.opendialogregcomplete}

        keepMounted
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"

      >
        <DialogContent >
          <DialogContentText id="alert-dialog-description" className='text-center'>
            <div className='d-flex justify-content-center m-0 bg-white  ' >
              <img src={companylogo} alt='Organization logo' width='50%' />

            </div>
            <p className='text-center text-dark my-3' style={{fontSize:'13px'}}>Thank you for completing the sign-up process. Your account is now awaiting approval, and you can anticipate receiving feedback via the email address you provided within the next 24 hours. Once again, we appreciate your registration !!!</p>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} >Close</Button>
          {/* <Button onClick={updateCompany} autoFocus>
            Agree
          </Button> */}
        </DialogActions>
      </Dialog>
    </div>
  );
}


export default RegistrationCompleteDialog