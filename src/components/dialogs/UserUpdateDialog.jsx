import * as React from 'react';
import { FaEnvelope, FaPen, FaPhone, FaUser } from 'react-icons/fa';
import { Alert, Box, Dialog, DialogContent, Switch, TextField, Typography } from '@mui/material';
import axios from 'axios';
import * as constants from '../constants/constants';
import AuthContext from '../../context/Authcontext.jsx';
import { isValidEmail } from '../../utils/email';
import { accountError, changeUserEmail } from '../../api/accounts';
import { DialogFooter, DialogHeader, PrimaryButton, PropertyRow, SecondaryButton, StatusChip, fieldIcon, fieldSx } from '../common/dialogKit';
import '../../styles/App.css';

const UserUpdateDialog = (props) => {
  const [busy, setBusy] = React.useState(false);
  const { authTokens } = React.useContext(AuthContext);

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

  // Correcting a mistyped email: only for someone who has never signed in
  // (has_signed_in === false). A new welcome email goes to the corrected address.
  const canFixEmail = selectedUser?.has_signed_in === false;
  const [emailDraft, setEmailDraft] = React.useState('');
  const [emailBusy, setEmailBusy] = React.useState(false);
  const [emailMsg, setEmailMsg] = React.useState(null); // { severity, text }
  React.useEffect(() => {
    if (props.opendialogupdateuser) { setEmailDraft(selectedUser?.email || ''); setEmailMsg(null); }
  }, [props.opendialogupdateuser, selectedUser?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const draft = emailDraft.trim();
  const draftChanged = draft.toLowerCase() !== String(selectedUser?.email || '').toLowerCase();
  const draftInvalid = draft !== '' && !isValidEmail(draft);

  const fixEmail = () => {
    setEmailBusy(true);
    setEmailMsg(null);
    changeUserEmail(authTokens?.access, selectedUser.id, draft)
      .then((res) => {
        setEmailMsg(res.email_sent === false
          ? { severity: 'warning', text: `Email changed to ${res.email}, but the welcome email could not be sent. Ask them to use "Forgot password" on the sign-in page.` }
          : { severity: 'success', text: `Email changed to ${res.email}. A new welcome email with a link to set their password was sent there.` });
        props.getusers?.();
      })
      .catch((err) => setEmailMsg({ severity: 'error', text: accountError(err) }))
      .finally(() => setEmailBusy(false));
  };

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
    // Access follows the licence (Users table > Licence), so there's no "active" switch here any more.

    setBusy(true);
    // Signed-in request: /api/user/<id> no longer accepts anonymous changes.
    axios.patch(`${constants.devApiBaseUrl}/api/user/${selectedUser.id}`, data, {
      headers: { Authorization: `Bearer ${authTokens?.access}` },
    })
      .then(() => {
        props.setAlertMsg('Updated successfully!');
        props.setAlertSeverity('success');
        props.setOpenAlert(true);
        props.setOpenDialogUpdateUser(false);
        props.getusers();
        document.getElementById('user-update-form').reset();
      })
      .catch(error => {
        props.setAlertMsg(error.response?.data?.message || error.response?.data?.detail || 'Update failed.');
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

          {emailMsg && <Alert severity={emailMsg.severity} sx={{ mb: 1.5, fontSize: 13 }}>{emailMsg.text}</Alert>}
          <PropertyRow label="Email" htmlFor="uu-email" alignTop={canFixEmail}>
            {canFixEmail ? (
              <>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <TextField
                    id="uu-email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} size="small" type="email"
                    disabled={emailBusy} error={draftInvalid}
                    InputProps={fieldIcon(<FaEnvelope />)} sx={{ ...fieldSx(), flex: '1 1 220px' }}
                    inputProps={{ 'aria-describedby': 'uu-email-help' }}
                  />
                  <SecondaryButton onClick={fixEmail} disabled={emailBusy || !draftChanged || draftInvalid || !draft}>
                    {emailBusy ? 'Saving…' : 'Correct email'}
                  </SecondaryButton>
                </Box>
                <Typography id="uu-email-help" sx={{ fontSize: 11.5, color: draftInvalid ? '#b42318' : '#6b7280', mt: 0.5 }}>
                  {draftInvalid
                    ? 'Enter a valid email address, e.g. name@company.com.'
                    : "They haven't signed in yet, so you can fix a mistyped email. A new welcome email goes to the corrected address."}
                </Typography>
              </>
            ) : (
              <TextField id="uu-email" value={selectedUser.email || ''} fullWidth size="small" InputProps={{ readOnly: true, ...fieldIcon(<FaEnvelope />) }} sx={fieldSx(true)} />
            )}
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
          <PropertyRow label="Access" alignTop>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
              {selectedUser.is_licensed
                ? <StatusChip tone="success">Licensed</StatusChip>
                : <StatusChip tone="neutral">No licence</StatusChip>}
            </Box>
            <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
              Someone can use Alignsys while they hold a licence. Assign or withdraw it with the Licence switch in the Users table.
            </Typography>
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
