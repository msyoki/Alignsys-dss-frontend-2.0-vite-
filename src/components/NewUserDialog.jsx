import * as React from 'react';
import { FaEnvelope, FaPhone, FaUser, FaUserPlus } from 'react-icons/fa';
import { Dialog, DialogContent, TextField, Typography } from '@mui/material';
import * as constants from './constants/constants.js';
import Alerts from './Alert.jsx';
import { isValidEmail } from '../utils/email';
import { DialogFooter, DialogHeader, PrimaryButton, PropertyRow, SecondaryButton, fieldIcon, fieldSx } from './common/dialogKit';
import '../styles/App.css';

const NewUserDialog = (props) => {
  const [busy, setBusy] = React.useState(false);

  const registerUser = async (e) => {
    e.preventDefault();

    const adminDomain = (props.user.email.split('@')[1] || '').toLowerCase();
    const userEmail = e.target.email.value.trim();
    const userDomain = (userEmail.split('@')[1] || '').toLowerCase();

    if (!isValidEmail(userEmail)) {
      props.setAlertMsg('Enter a valid email address, e.g. name@company.com.');
      props.setAlertSeverity('error');
      props.setOpenAlert(true);
      setTimeout(() => props.setOpenAlert(false), 5000);
      return;
    }
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

    setBusy(true);
    try {
      const response = await fetch(`${constants.devApiBaseUrl}/api/new/user/${props.user.id}/`, {
        method: 'POST',
        headers: myHeaders,
        body: raw,
      });

      const result = await response.json().catch(() => ({}));
      if (response.status === 201) {
        // If the welcome email doesn't arrive, they use "Forgot password" on the sign-in page.
        props.setAlertMsg(result.email_sent === false
          ? `Account created, but the welcome email to ${result.email || 'the user'} could not be sent. Ask them to use "Forgot password" on the sign-in page to set their password.`
          : `Account created. ${result.email || 'The user'} will get an email with a link to set their password. If it doesn't arrive, they can use "Forgot password" on the sign-in page.`);
        props.setAlertSeverity(result.email_sent === false ? 'warning' : 'success');
        props.setOpenAlert(true);
        props.setOpenDialogNewUser(false);
        props.getusers();
        document.getElementById('new-user-form').reset();
        setTimeout(() => props.setOpenAlert(false), 8000);
      } else if (response.status === 400) {
        props.setAlertMsg(result.error || 'Account with email already exists!');
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
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    props.setOpenDialogNewUser(false);
  };

  const domain = props.user?.email?.split('@')[1];

  return (
    <Dialog open={props.opendialognewuser} onClose={busy ? undefined : handleClose} fullWidth maxWidth="sm" aria-labelledby="new-user-title">
      <DialogHeader id="new-user-title" icon={<FaUserPlus />} title="Add new user" subtitle={props.user?.company} onClose={handleClose} />
      <form onSubmit={registerUser} id="new-user-form">
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Alerts
            alertseverity={props.alertseverity}
            alertmsg={props.alertmsg}
            openalert={props.openalert}
            setOpenAlert={props.setOpenAlert}
          />
          <Typography sx={{ fontSize: 12.5, color: '#6b7280', mb: 1, px: 1 }}>
            The new user signs in with their email{domain ? <> (must end in <strong>@{domain}</strong>)</> : ''}.
          </Typography>

          <PropertyRow label="Email address" required htmlFor="nu-email">
            <TextField id="nu-email" name="email" type="email" required fullWidth size="small" placeholder={domain ? `name@${domain}` : 'name@company.com'} InputProps={fieldIcon(<FaEnvelope />)} sx={fieldSx()} />
          </PropertyRow>
          <PropertyRow label="First name" required htmlFor="nu-fname">
            <TextField id="nu-fname" name="fname" required fullWidth size="small" placeholder="First name" InputProps={fieldIcon(<FaUser />)} sx={fieldSx()} />
          </PropertyRow>
          <PropertyRow label="Last name" required htmlFor="nu-lname">
            <TextField id="nu-lname" name="lname" required fullWidth size="small" placeholder="Last name" InputProps={fieldIcon(<FaUser />)} sx={fieldSx()} />
          </PropertyRow>
          <PropertyRow label="Mobile number" required htmlFor="phone" alignTop>
            <TextField
              id="phone"
              name="phone"
              required
              fullWidth
              size="small"
              placeholder="07xx xxx xxx"
              helperText="10 digits, starting with 0"
              inputProps={{ pattern: '[0]{1}[1-7]{1}[0-9]{2}[0-9]{3}[0-9]{3}', inputMode: 'tel' }}
              InputProps={fieldIcon(<FaPhone />)}
              sx={fieldSx()}
            />
          </PropertyRow>
        </DialogContent>
        <DialogFooter>
          <SecondaryButton onClick={handleClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" loading={busy} startIcon={<FaUserPlus />}>{busy ? 'Creating…' : 'Create user'}</PrimaryButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default NewUserDialog;
