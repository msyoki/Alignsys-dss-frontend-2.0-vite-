import * as React from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Alerts from '../Alert.jsx';
import axios from 'axios';
import AuthContext from '../../context/Authcontext.jsx';
import * as constants from '../constants/constants.js';

const CompanyUpdateDialog = (props) => {
  let { authTokens } = useContext(AuthContext);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  let navigate = useNavigate();

  const [isActive, setIsActive] = React.useState(
    props.companyactive === 'True' || props.companyactive === true
  );

  const handleToggle = (event) => {
    setIsActive(event.target.checked);
  };

  let updateCompany = (e) => {
    e.preventDefault();

    var FormData = require('form-data');
    var data = new FormData();
    data.append('active', isActive);

    var config = {
      method: 'patch',
      url: `${constants.devApiBaseUrl}/api/company/${props.companyid}`,
      headers: { Authorization: `Bearer ${authTokens.access}` },
      data: data,
    };

    axios(config)
      .then(function (response) {
        props.setOpenAlert(true);
        props.setAlertMsg('Updated successfully !!!');
        props.setAlertSeverity('success');
        props.setOpenDialogUpdateCompany(false);
        setTimeout(function () {
          props.setOpenAlert(false);
          props.getCompanies();
          props.getNewCompanies();
          props.setOpenDialogUpdateCompany(false);
          document.getElementById('company-update-form').reset();
        }, 2000);
      })
      .catch(function (error) {
        props.setOpenAlert(true);
        props.setAlertMsg(`${error.response.data['message']}`);
        props.setAlertSeverity('error');
        setTimeout(function () {
          props.setOpenAlert(false);
          props.getCompanies();
          props.getNewCompanies();
          props.setOpenDialogUpdateCompany(false);
        }, 4000);
      });
  };

  const handleClose = () => {
    props.setOpenDialogUpdateCompany(false);
  };

  return (
    <Dialog
      open={props.opendialogupdatecompany}
      keepMounted
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle
        style={{ backgroundColor: '#1C4690', fontSize: '16px' }}
        className="shadow-lg text-white text-center"
      >
        <i className="fas fa-building m-1"></i> Edit Company :
        <small> {props.companyname}</small>
      </DialogTitle>
      <br />
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          <Alerts
            alertseverity={props.alertseverity}
            alertmsg={props.alertmsg}
            openalert={props.openalert}
            setOpenAlert={props.setOpenAlert}
          />
          <form onSubmit={updateCompany} id="company-update-form">
            <div className="form-group">
              <div className="form-group mb-2">
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive}
                      onChange={handleToggle}
                      color="primary"
                      name="is_active"
                    />
                  }
                  label={isActive ? 'Active' : 'Inactive'}
                />
              </div>

              <DialogActions>
                <Button onClick={handleClose}>CANCEL</Button>
                <Button type="submit">SUBMIT</Button>
              </DialogActions>
            </div>
          </form>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyUpdateDialog;
