import React, { useContext, useState } from 'react';
import axios from 'axios';
import { FaKey } from 'react-icons/fa';
import ProfileDialog from '../components/dialogs/ProfileDialog.jsx';
import * as constants from '../components/constants/constants';
import AuthContext from '../context/Authcontext.jsx';
import { effectiveTimeZone } from '../utils/datetime';

/**
 * "Edit my profile" + "Reset password", shared by the home page and the
 * admin dashboards so every page's account menu offers the same options.
 *
 * Returns:
 *   openProfile      pass to AppShell's onOpenProfile
 *   profileDialog    render once in the page
 *   resetPasswordItem  an AppShell accountMenuItems entry
 */
export default function useProfileEditor({ user, authTokens, avatar, setAvatar, notify }) {
  const [open, setOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const { updateTimezones } = useContext(AuthContext);

  const submit = (e) => {
    e.preventDefault();
    const data = new FormData();
    if (avatarFile) {
      data.append('avatar', avatarFile);
      data.append('fileName', avatarFile.name);
    }
    if (e.target.first_name.value) data.append('first_name', e.target.first_name.value);
    if (e.target.last_name.value) data.append('last_name', e.target.last_name.value);
    if (e.target.phone.value) data.append('phone', e.target.phone.value);
    // Not edited here; send the current value so it is kept.
    data.append('mailtoall', user?.mailtoall === 'True');
    const timezone = e.target.timezone?.value ?? (user?.user_timezone || '');
    data.append('timezone', timezone);
    axios.patch(`${constants.devApiBaseUrl}/api/user/${user.id}`, data, {
      headers: { Authorization: `Bearer ${authTokens?.access}` },
    }).then((res) => {
      if (res.data?.avatar && setAvatar) setAvatar(res.data.avatar);
      // Time zone applies straight away; other changes on next login as before.
      updateTimezones?.({ user_timezone: timezone, timezone: effectiveTimeZone(timezone, user) });
      setAvatarFile(null);
      setOpen(false);
      notify?.('Profile updated, effective on next login', 'success');
    }).catch(() => {
      notify?.('Your profile could not be updated. Please try again.', 'error');
    });
  };

  return {
    openProfile: () => setOpen(true),
    profileDialog: (
      <ProfileDialog
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        avatarSrc={avatar}
        onSubmit={submit}
        onAvatarChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
      />
    ),
    resetPasswordItem: {
      key: 'reset',
      label: 'Reset password',
      icon: <FaKey size={14} />,
      onClick: () => { window.location.href = '/password-reset'; },
    },
  };
}
