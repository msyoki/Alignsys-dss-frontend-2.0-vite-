import * as React from 'react';
import { useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import * as constants from '../constants/constants';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import '../../styles/App.css';

const UserUpdateDialog = (props) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [fullWidth] = React.useState(true);

  const primaryColor = { color: "#2757aa" };

  const findUserById = (users, id) => {
    return users?.find(user => String(user.id) === String(id)) || null;
  };

  const selectedUser = findUserById(props.users, props.selectedUserId);

  const handleClose = () => {
    props.setOpenDialogUpdateUser(false);
  };

  const updateUser = (e) => {
    e.preventDefault();
    const FormData = require('form-data');
    const data = new FormData();

    if (e.target.fname.value) data.append('first_name', e.target.fname.value);
    if (e.target.lname.value) data.append('last_name', e.target.lname.value);
    if (e.target.phone.value) data.append('phone', e.target.phone.value);
    if (e.target.is_active.value) data.append('is_active', e.target.is_active.value);

    axios.patch(`${constants.devApiBaseUrl}/api/user/${selectedUser.id}`, data)
      .then(() => {
  
        props.setAlertMsg('Updated successfully!');
        props.setAlertSeverity('success');
        props.setOpenAlert(true);
        props.setOpenDialogUpdateUser(false);
        props.getusers();
        document.getElementById('user-update-form').reset();
      })
      .catch(error => {

        props.setAlertMsg(error.response?.data?.message || 'Update failed.');
        props.setAlertSeverity('error');
        props.setOpenAlert(true);
        props.setOpenDialogUpdateUser(false);
        props.getusers();
      });
  };

  useEffect(() => {
    console.log('Users:', props.users);
  }, [props.users]);

  if (!selectedUser) {
    return null; // or show a fallback UI if desired
  }

  return (
    <Dialog
      open={props.opendialogupdateuser}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
      fullWidth
      PaperProps={{
        style: {
          width: '90vw',
          maxWidth: '400px',
        },
      }}
    >
      <DialogTitle className="shadow-lg text-white text-center" style={{ backgroundColor: '#2757aa', fontSize: '14px' }}>
        <i className="fas fa-user-edit m-1"></i> Edit User
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          <form onSubmit={updateUser} id="user-update-form">
            <div className="form-group">

              {/* Email */}
              <div className="form-group mb-2 mt-2">
                <label><small>Email</small></label>
                <div className="input-group mt-1">
                  <span className="input-group-text"><i className="fas fa-envelope" style={primaryColor}></i></span>
                  <input type="email" className="form-control form-control-sm" disabled placeholder={selectedUser.email} />
                </div>
              </div>

              {/* First Name */}
              <div className="form-group mb-2">
                <label><small>First Name</small></label>
                <div className="input-group mt-1">
                  <span className="input-group-text"><i className="fas fa-user-edit" style={primaryColor}></i></span>
                  <input type="text" name="fname" className="form-control form-control-sm" placeholder={selectedUser.first_name} />
                </div>
              </div>

              {/* Last Name */}
              <div className="form-group mb-2">
                <label><small>Last Name</small></label>
                <div className="input-group mt-1">
                  <span className="input-group-text"><i className="fas fa-user-edit" style={primaryColor}></i></span>
                  <input type="text" name="lname" className="form-control form-control-sm" placeholder={selectedUser.last_name} />
                </div>
              </div>

              {/* Phone */}
              <div className="form-group mb-2">
                <label><small>Mobile Number</small></label>
                <div className="input-group mt-1">
                  <span className="input-group-text"><i className="fas fa-phone" style={primaryColor}></i></span>
                  <input type="text" name="phone" id="phone" pattern="[0]{1}[1-7]{1}[0-9]{2}[0-9]{3}[0-9]{3}" className="form-control form-control-sm" placeholder={selectedUser.phone || ''} />
                </div>
              </div>

              {/* Active */}
              <div className="form-group mb-2">
                <label><small>Active</small></label>
                <div className="input-group mt-1">
                  <span className="input-group-text"><i className="fas fa-plug" style={primaryColor}></i></span>
                  <select className="form-control form-control-sm" name="is_active" id="is_active" defaultValue={selectedUser.is_active === 'True' ? 'true' : 'false'}>
                    <option value="true">Active</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <br />
              <DialogActions>
                <ButtonComponent
                  cssClass='e-custom-warning'
                  className='m-2 p-2'
                  style={{ textTransform: 'none', fontWeight: 'lighter', fontSize: '13px' }}
                  onClick={handleClose}
                >
                  <span className='mx-2'>Cancel</span>
                </ButtonComponent>

                <ButtonComponent
                  cssClass='e-custom-primary'
                  className='m-2 p-2'
                  type='submit'
                  style={{ textTransform: 'none', fontWeight: 'lighter', fontSize: '13px' }}
                >
                  <span className='mx-2'>Submit</span>
                </ButtonComponent>
              </DialogActions>
            </div>
          </form>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default UserUpdateDialog;
