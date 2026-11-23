import React, { useEffect, useRef, useState } from 'react';
import { PILL, PILL_OUTLINE, PILL_OUTLINE_NEUTRAL } from '../common/pillButton';
import {
  Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, TextField, Typography,
} from '@mui/material';
import { FaCamera, FaPhone, FaUser, FaUserCircle } from 'react-icons/fa';
import { BRAND, NEUTRAL_COLORS } from '../layout/shellTheme';
import TimeZoneSelect from '../common/TimeZoneSelect';
import { browserTimeZone } from '../../utils/datetime';

const fieldSx = {
  '& .MuiInputBase-input': { fontSize: 13 },
  '& .MuiInputLabel-root': { fontSize: 13 },
};

const initials = (first = '', last = '') => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';

/**
 * Edit my profile. The form keeps the field names the dashboard's
 * `onSubmit` handler reads (first_name, last_name, phone); blank fields are
 * left unchanged. The photo goes through `onAvatarChange` as before.
 * The time zone is sent as `timezone` ('' = use the organisation's).
 */
const ProfileDialog = ({ open, onClose, user, avatarSrc, onSubmit, onAvatarChange }) => {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('');
  const [timezone, setTimezone] = useState(user?.user_timezone || '');

  // Start clean each time the dialog opens.
  useEffect(() => {
    if (open) { setPreview(''); setFileName(''); setTimezone(user?.user_timezone || ''); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const defaultZone = user?.company_timezone || (user?.user_timezone ? '' : user?.timezone) || 'Africa/Nairobi';
  const browserZone = browserTimeZone();
  const shownZone = timezone || defaultZone;

  // Free the preview URL when it is replaced or the dialog unmounts.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    onAvatarChange(e);
    setFileName(file?.name ?? '');
    setPreview(file ? URL.createObjectURL(file) : '');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="profile-dialog-title">
      <DialogTitle id="profile-dialog-title" sx={{ bgcolor: BRAND.primary, color: '#fff', py: 0.75, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 28 }}>
          <FaUserCircle size={16} aria-hidden />
          <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>My profile</Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: '20px !important' }}>
          {/* Photo and account email */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
            <Avatar
              src={preview || avatarSrc || undefined}
              alt=""
              sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: BRAND.primary, fontSize: 22, fontWeight: 400 }}
            >
              {initials(user.first_name, user.last_name)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 11, color: NEUTRAL_COLORS.muted }}>Email</Typography>
              <Typography noWrap title={user.email} sx={{ fontSize: 13, color: NEUTRAL_COLORS.strong, mb: 1 }}>
                {user.email}
              </Typography>
              <input
                ref={fileRef}
                id="avatar"
                name="avatar"
                type="file"
                accept="image/png"
                onChange={pickFile}
                hidden
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<FaCamera size={12} />}
                onClick={() => fileRef.current?.click()}
                sx={{ ...PILL_OUTLINE, fontSize: '12px', minHeight: 28, py: 0.25, px: 1.5 }}
              >
                Change photo
              </Button>
              {fileName && (
                <Typography noWrap title={fileName} sx={{ fontSize: 11, color: NEUTRAL_COLORS.muted, mt: 0.5, maxWidth: 220 }}>
                  {fileName}
                </Typography>
              )}
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="first_name"
                name="first_name"
                label="First name"
                placeholder={user.first_name}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
                sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><FaUser size={12} color={NEUTRAL_COLORS.muted} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="last_name"
                name="last_name"
                label="Last name"
                placeholder={user.last_name}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
                sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><FaUser size={12} color={NEUTRAL_COLORS.muted} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="phone"
                name="phone"
                label="Phone"
                placeholder={user.phone ?? 'Enter phone number'}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
                sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><FaPhone size={12} color={NEUTRAL_COLORS.muted} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TimeZoneSelect
                value={timezone}
                onChange={setTimezone}
                emptyLabel={`${user?.company_timezone ? 'Organisation default' : 'Default'} (${defaultZone.replace(/_/g, ' ')})`}
                helperText={shownZone !== browserZone
                  ? `Dates and signature stamps use this zone. Your device is set to ${browserZone.replace(/_/g, ' ')}.`
                  : 'Dates and signature stamps on your documents use this zone.'}
              />
            </Grid>
          </Grid>
          <Typography sx={{ fontSize: 11.5, color: NEUTRAL_COLORS.muted, mt: 1.5 }}>
            Leave a field blank to keep it as it is.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} sx={PILL_OUTLINE_NEUTRAL}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disableElevation sx={{ ...PILL, bgcolor: BRAND.primary, '&:hover': { bgcolor: BRAND.primaryDark, boxShadow: 'none' } }}>
            Save changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProfileDialog;
