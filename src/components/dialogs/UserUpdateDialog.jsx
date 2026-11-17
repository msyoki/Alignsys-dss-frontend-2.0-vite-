import * as React from 'react';
import { FaEnvelope, FaPen, FaPhone, FaUser } from 'react-icons/fa';
import { Box, Dialog, DialogContent, Switch, TextField, Typography } from '@mui/material';
import axios from 'axios';
import * as constants from '../constants/constants';
import { DialogFooter, DialogHeader, PrimaryButton, PropertyRow, SecondaryButton, StatusChip, fieldIcon, fieldSx } from '../common/dialogKit';
import '../../styles/App.css';

const UserUpdateDialog = (props) => {
  const [busy, setBusy] = React.useState(false);

  const findUserById = (users, id) => {
    return users?.find(user => String(user.id) === String(id)) || null;
  };

  const selectedUser = findUserById(props.users, props.selectedUserId);
  const userIsActive = selectedUser ? (selectedUser.is_active === 'True' || selectedUser.is_active === true) : false;
  const [active, setActive] = React.useState(userIsActive);
  // Show the selected user's status each time the dialog opens.
  React.useEffect(() => {
    if (props.opendialogupdateuser) setActive(userIsActive);
  }, [props.opendialogupdateuser, userIsActive]);

  const handleClose = () => {
    props.setOpenDialogUpdateUser(false);
  };

  const updateUser = (e) => {
    e.preventDefault();
    // Browser FormData (require('form-data') is not available in the Vite build).
    const data = new FormData();

    if (e.target.fname.value) data.append('first_name', e.target.fname.value);
    if (e.target.lname.value) data.append('last_name', e.target.lname.value);
    if (e.target.phone.value) data.append('phone', e.target.phone.value);
    if (e.target.is_active.value) data.append('is_active', e.target.is_active.value);

    setBusy(true);
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
      })
      .finally(() => setBusy(false));
  };

  if (!selectedUser) {
    return null;
  }

  const fullName = [selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') || selectedUser.email;

  return (
    <Dialog open={props.opendialogupdateuser} onClose={busy ? undefined : handleClose} fullWidth maxWidth="sm" aria-labelledby="user-update-title">
      <DialogHeader id="user-update-title" icon={<FaPen />} title="Edit user" subtitle={fullName} onClose={handleClose} />
      <form onSubmit={updateUser} id="user-update-form">
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Typography sx={{ fontSize: 12.5, color: '#6b7280', mb: 1, px: 1 }}>
            Leave a field blank to keep its current value.
          </Typography>

          <PropertyRow label="Email" htmlFor="uu-email">
            <TextField id="uu-email" value={selectedUser.email || ''} fullWidth size="small" InputProps={{ readOnly: true, ...fieldIcon(<FaEnvelope />) }} sx={fieldSx(true)} />
          </PropertyRow>
          <PropertyRow label="First name" htmlFor="uu-fname">
            <TextField id="uu-fname" name="fname" fullWidth size="small" placeholder={selectedUser.first_name || 'First name'} InputProps={fieldIcon(<FaUser />)} sx={fieldSx()} />
          </PropertyRow>
          <PropertyRow label="Last name" htmlFor="uu-lname">
            <TextField id="uu-lname" name="lname" fullWidth size="small" placeholder={selectedUser.last_name || 'Last name'} InputProps={fieldIcon(<FaUser />)} sx={fieldSx()} />
          </PropertyRow>
          <PropertyRow label="Mobile number" htmlFor="phone" alignTop>
            <TextField
              id="phone"
              name="phone"
              fullWidth
              size="small"
              placeholder={selectedUser.phone || '07xx xxx xxx'}
              helperText="10 digits, starting with 0"
              inputProps={{ pattern: '[0]{1}[1-7]{1}[0-9]{2}[0-9]{3}[0-9]{3}', inputMode: 'tel' }}
              InputProps={fieldIcon(<FaPhone />)}
              sx={fieldSx()}
            />
          </PropertyRow>
          <PropertyRow label="Account status" htmlFor="uu-active">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch id="uu-active" checked={active} onChange={(e) => setActive(e.target.checked)} size="small" color="primary" />
              <StatusChip tone={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Disabled'}</StatusChip>
              {/* Same field the form always sent: is_active = "true" | "false" */}
              <input type="hidden" name="is_active" value={active ? 'true' : 'false'} />
            </Box>
          </PropertyRow>
        </DialogContent>
        <DialogFooter>
          <SecondaryButton onClick={handleClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" loading={busy}>{busy ? 'Saving…' : 'Save changes'}</PrimaryButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default UserUpdateDialog;
