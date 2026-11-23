import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import AuthContext from '../../context/Authcontext';
import Users from '../Users';
import UserUpdateDialog from '../dialogs/UserUpdateDialog';
import { listUsers } from '../../api/accounts';

/**
 * Super admin: one organisation's users at a time (including "Individual"), with the
 * same tools organisation admins have: licence switch and summary, admin rights,
 * delete, CSV import and edit. Pick the organisation at the top.
 */
const SuperAdminUsers = ({ companies = [], setAlertMsg, setAlertSeverity, setOpenAlert }) => {
  const { authTokens } = useContext(AuthContext);
  const options = useMemo(() => [...companies].sort((a, b) => String(a.name).localeCompare(String(b.name))), [companies]);
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // Start on the first organisation once the list arrives.
  useEffect(() => { if (!company && options.length) setCompany(options[0]); }, [options, company]);

  const load = useCallback(() => {
    if (!company) return;
    setLoading(true);
    setError('');
    listUsers(authTokens?.access, company.id)
      .then((rows) => setUsers(Array.isArray(rows) ? rows : []))
      .catch(() => { setUsers([]); setError('The users could not be loaded. Please try again.'); })
      .finally(() => setLoading(false));
  }, [company, authTokens?.access]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1.5, flexShrink: 0 }}>
        <Autocomplete
          options={options}
          value={company}
          onChange={(_, v) => v && setCompany(v)}
          getOptionLabel={(o) => o?.name || ''}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          disableClearable
          size="small"
          sx={{ width: 320, maxWidth: '100%' }}
          renderInput={(params) => <TextField {...params} label="Organisation" InputLabelProps={{ shrink: true }} />}
        />
        {error && <Typography sx={{ fontSize: 13, color: '#b42318' }}>{error}</Typography>}
      </Box>
      {company && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Users
            key={company.id}
            users={users}
            loading={loading}
            companyid={company.id}
            companyName={company.name}
            licensing
            canManageRoles
            canDelete
            canImport
            importCompany={company.id}
            onUsersChanged={load}
            setSelectedUserId={setSelectedUserId}
            setOpenDialogUpdateUser={setEditOpen}
            style={{ flex: 1, minHeight: 0, height: '100%' }}
          />
        </Box>
      )}
      <UserUpdateDialog
        users={users}
        selectedUserId={selectedUserId}
        opendialogupdateuser={editOpen}
        setOpenDialogUpdateUser={setEditOpen}
        getusers={load}
        setAlertMsg={setAlertMsg}
        setAlertSeverity={setAlertSeverity}
        setOpenAlert={setOpenAlert}
      />
    </Box>
  );
};

export default SuperAdminUsers;
