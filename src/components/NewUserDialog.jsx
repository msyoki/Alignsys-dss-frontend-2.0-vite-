import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import * as constants from './constants/constants.js';
import Alerts from './Alert.jsx';
import '../styles/App.css';

const NewUserDialog = (props) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const primaryColor = { color: '#2757aa' };

  const registerUser = async (e) => {
    e.preventDefault();

    const adminDomain = props.user.email.split('@')[1];
    const userEmail = e.target.email.value;
    const userDomain = userEmail.split('@')[1];

    if (userDomain !== adminDomain) {
      props.setAlertMsg(`Invalid domain. Use "${adminDomain}"`);
      props.setAlertSeverity('error');
      props.setOpenAlert(true);
      setTimeout(() => props.setOpenAlert(false), 5000);
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Authorization', `Bearer ${props.authTokens.access}`);

    const raw = JSON.stringify({
      email: userEmail,
      first_name: e.target.fname.value,
      last_name: e.target.lname.value,
      phone: e.target.phone.value,
    });

    try {
      const response = await fetch(`${constants.devApiBaseUrl}/api/new/user/${props.user.id}/`, {
        method: 'POST',
        headers: myHeaders,
        body: raw,
      });

      if (response.status === 201) {
        props.setAlertMsg('Account created successfully!');
        props.setAlertSeverity('success');
        props.setOpenAlert(true);
        props.setOpenDialogNewUser(false);
        props.getusers();
        document.getElementById('new-user-form').reset();
        setTimeout(() => props.setOpenAlert(false), 4000);
      } else if (response.status === 400) {
        props.setAlertMsg('Account with email already exists!');
        props.setAlertSeverity('error');
        props.setOpenAlert(true);
        setTimeout(() => props.setOpenAlert(false), 5000);
      } else {
        throw new Error('Unexpected error');
      }
    } catch (err) {
      props.setAlertMsg('Something went wrong. Please try again.');
      props.setAlertSeverity('error');
      props.setOpenAlert(true);
      setTimeout(() => props.setOpenAlert(false), 5000);
    }
  };

  const handleClose = () => {
    props.setOpenDialogNewUser(false);
  };

  return (
    <Dialog
      open={props.opendialognewuser}
      onClose={handleClose}
      fullWidth
      PaperProps={{
        style: {
          width: '90vw',
          maxWidth: '400px',
        },
      }}
    >
      <DialogTitle className="shadow-lg text-white text-center" style={{ backgroundColor: '#2757aa', fontSize: '14px' }}>
        <i className="fas fa-user-plus m-1"></i> Add New Account
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          <Alerts
            alertseverity={props.alertseverity}
            alertmsg={props.alertmsg}
            openalert={props.openalert}
            setOpenAlert={props.setOpenAlert}
          />

          <form onSubmit={registerUser} id="new-user-form">
            <div className="form-group">

              {/* Email */}
              <div className="form-group mb-2 mt-2">
                <label><small>Email Address</small></label>
                <div className="input-group mt-1">
                  <span className="input-group-text"><i className="fas fa-envelope" style={primaryColor}></i></span>
                  <input type="email" name="email" className="form-control form-control-sm" required placeholder="Email" />
                </div>
              </div>

              {/* First Name */}
              <div className="form-group mb-2">
                <label><small>First Name</small></label>
                <div className="input-group mt-1">
                  <span className="input-group-text"><i className="fas fa-user-edit" style={primaryColor}></i></span>
                  <input type="text" name="fname" className="form-control form-control-sm" required placeholder="First Name" />
                </div>
              </div>

              {/* Last Name */}
              <div className="form-group mb-2">
                <label><small>Last Name</small></label>
                <div className="input-group mt-1">
                  <span className="input-group-text"><i className="fas fa-user-edit" style={primaryColor}></i></span>
                  <input type="text" name="lname" className="form-control form-control-sm" required placeholder="Last Name" />
                </div>
              </div>

              {/* Phone */}
              <div className="form-group mb-2">
                <label><small>Mobile Number</small></label>
                <div className="input-group mt-1">
                  <span className="input-group-text"><i className="fas fa-phone" style={primaryColor}></i></span>
                  <input type="text" name="phone" id="phone" pattern="[0]{1}[1-7]{1}[0-9]{2}[0-9]{3}[0-9]{3}" className="form-control form-control-sm" required placeholder="07xx xxx xxx" />
                </div>
              </div>

              {/* Buttons */}
              <br />
              <DialogActions>
                <ButtonComponent
                  cssClass='e-custom-warning'
                  className='m-2 p-2'
                  style={{ textTransform: 'none', fontWeight: 'lighter', fontSize: '12px' }}
                  onClick={handleClose}
                >
                  <span className='mx-2'>Cancel</span>
                </ButtonComponent>

                <ButtonComponent
                  cssClass='e-custom-primary'
                  type='submit'
                  className='m-2 p-2'
                  style={{ textTransform: 'none', fontWeight: 'lighter', fontSize: '12px' }}
                >
                  <span className='mx-2'>Register New User</span>
                </ButtonComponent>
              </DialogActions>
            </div>
          </form>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default NewUserDialog;
