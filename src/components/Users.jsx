import TableIconButton from './common/TableIconButton';
import mergeActionColumns from './common/mergeActionColumns';
import autoSizeColumns from './common/autoSizeColumns';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Switch, Tooltip } from '@mui/material';
import { FaPen, FaUserPlus, FaUserSlash } from 'react-icons/fa';
import { PILL_COMPACT } from './common/pillButton';
import { accountError, deleteUser, setUserRole } from '../api/accounts';
import { FaFileImport, FaTrashAlt, FaUserShield } from 'react-icons/fa';
import ImportUsersDialog from './admin/ImportUsersDialog';
import AuthContext from '../context/Authcontext';
import { ConfirmDialog, PropertyRow, PropertyValue, StatusChip } from './common/dialogKit';
import { assignUserLicense, getCompanyLicense, licenseError, withdrawUserLicense } from '../api/licensing';
import { daysUntil } from './admin/licenseFormat';
import LicenceSummaryBar from './admin/LicenceSummaryBar';

import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';


const fullName = (row) => `${row?.first_name || ''} ${row?.last_name || ''}`.trim();

/**
 * Organisation users table. With `licensing` (organisation admin dashboard) it also
 * shows the organisation's licence usage above the table and a Licence switch per user:
 * on = holds one of the organisation's licences. Turning it off asks first.
 */
function Users(props) {
  const { authTokens, user: me } = useContext(AuthContext);
  const [licence, setLicence] = useState(null); // { has_license, status } for the organisation
  const [licenceOverrides, setLicenceOverrides] = useState({}); // user id -> is_licensed after a change
  const [licenceBusy, setLicenceBusy] = useState(null); // user id being changed
  const [licenceMsg, setLicenceMsg] = useState(null); // { severity, text }
  const [withdrawing, setWithdrawing] = useState(null); // user row waiting for confirmation
  const [onlyUnlicensed, setOnlyUnlicensed] = useState(false);
  const [roleChange, setRoleChange] = useState(null); // { row, makeAdmin } waiting for confirmation
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleOverrides, setRoleOverrides] = useState({}); // user id -> is_admin after a change
  useEffect(() => { setRoleOverrides({}); }, [props.users]);
  const isAdminRow = (row) => (row.id in roleOverrides ? roleOverrides[row.id] : (String(row.is_admin) === 'True' || row.is_admin === true));
  const activeAdminCount = (props.users || []).filter((u) => isAdminRow(u) && u.is_active !== 'False').length;

  const changeRole = () => {
    const { row, makeAdmin } = roleChange;
    const name = fullName(row) || row.email;
    setRoleBusy(true);
    setUserRole(authTokens?.access, row.id, makeAdmin)
      .then((res) => {
        setRoleOverrides((o) => ({ ...o, [row.id]: res.is_admin }));
        setLicenceMsg({
          severity: 'success',
          text: makeAdmin
            ? `${name} is now an admin. It applies from their next sign-in.`
            : `${name} is no longer an admin. It applies from their next sign-in.`,
        });
      })
      .catch((err) => setLicenceMsg({ severity: 'error', text: accountError(err) }))
      .finally(() => { setRoleBusy(false); setRoleChange(null); });
  };
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState(null); // user row waiting for "Delete user" confirmation
  const [deleteBusy, setDeleteBusy] = useState(false);

  const removeUser = () => {
    const row = deleting;
    setDeleteBusy(true);
    deleteUser(authTokens?.access, row.id)
      .then(() => {
        setLicenceMsg({ severity: 'success', text: `${fullName(row) || row.email} was deleted.` });
        props.onUsersChanged?.();
        loadLicence(); // a licence may have been freed
      })
      // 409: they've sent documents; the message says to withdraw their licence instead.
      .catch((err) => setLicenceMsg({ severity: err?.response?.status === 409 ? 'warning' : 'error', text: accountError(err) }))
      .finally(() => { setDeleteBusy(false); setDeleting(null); });
  };


  const loadLicence = useCallback(() => {
    if (!props.licensing || !props.companyid) return;
    getCompanyLicense(authTokens?.access, props.companyid)
      .then(setLicence)
      .catch((err) => setLicenceMsg({ severity: 'warning', text: licenseError(err, 'Licence details could not be loaded.') }));
  }, [props.licensing, props.companyid, authTokens?.access]);

  useEffect(() => { loadLicence(); }, [loadLicence]);
  useEffect(() => { setLicenceOverrides({}); }, [props.users]); // fresh list from the server

  const isLicensed = (row) => (row.id in licenceOverrides ? licenceOverrides[row.id] : Boolean(row.is_licensed));
  const status = licence?.status;
  const noneLeft = status ? Number(status.remaining) <= 0 : false;
  const expired = status ? (daysUntil(status.expiryDate) ?? 0) < 0 : false;
  const isMe = (row) => row && me && String(row.id) === String(me.id);
  const users = props.users || [];
  const unlicensedCount = props.licensing ? users.filter((u) => !isLicensed(u)).length : 0;
  const rows = props.licensing && onlyUnlicensed ? users.filter((u) => !isLicensed(u)) : users;

  // Why a user's switch can't be used right now (shown on hover), or '' if it can.
  const lockReason = (row) => {
    if (!licence) return 'Loading licence details…';
    if (!licence.has_license) return 'Your organisation has no licence yet.';
    if (expired) return "The organisation's licence has expired. Licences can't be changed until it's renewed.";
    if (!isLicensed(row) && noneLeft) return 'No licences left. Withdraw one from someone else, or request more.';
    return '';
  };

  const changeLicence = (row, assign) => {
    const name = fullName(row) || row.email;
    const reason = lockReason(row);
    if (reason) {
      setLicenceMsg({ severity: 'error', text: reason });
      return;
    }
    setLicenceBusy(row.id);
    setLicenceMsg(null);
    (assign ? assignUserLicense : withdrawUserLicense)(authTokens?.access, row.id)
      .then((res) => {
        setLicenceOverrides((o) => ({ ...o, [row.id]: res.is_licensed }));
        if (res.company_status) setLicence((l) => ({ ...(l || {}), has_license: true, status: res.company_status }));
        else loadLicence();
        setLicenceMsg({ severity: 'success', text: assign ? `Licence assigned to ${name}.` : `Licence withdrawn from ${name}.` });
        props.onLicenceChange?.();
      })
      .catch((err) => setLicenceMsg({ severity: 'error', text: licenseError(err) }))
      .finally(() => { setLicenceBusy(null); setWithdrawing(null); });
  };

  const [opendialogdocdetails, setOpenDialogDocDetails] = useState(false)
  const [document, setDocument] = useState({})
  const [documentsigners, setDocumentSigners] = useState([])

  let ontableclick = (user) => {
    props.setSelectedUserId(user.id)
    // props.setCurrentEditUserActive(`${active}`)
    // props.setCurrentEditUserAdmin(`${admin}`)
    // props.setCurrentEditUser(Id)
    // props.setCurrentEditUserEmail(email)
    // props.setCurrentEditUserLast(last)
    // props.setCurrentEditUserFirst(first)
    // props.setCurrentEditUserPhone(phone)
    props.setOpenDialogUpdateUser(true)
    // alert('clicked')
  }


  const columns = [
    { field: 'first_name', headerName: 'First', width: 150 },

    { field: 'last_name', headerName: 'Last', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },

    { field: 'phone', headerName: 'Phone', width: 200 },
    {
      // Who can manage the organisation (add users, licences, settings) and who can't.
      field: 'is_admin',
      headerName: 'Role',
      width: 170,
      minWidth: 150,
      valueGetter: (params) => (isAdminRow(params.row) ? 'Admin' : 'Member'),
      // Same pattern as the Licence switch: on = Admin. Either way asks first.
      renderCell: (params) => {
        const row = params.row;
        const admin = isAdminRow(row);
        const you = isMe(row) && <span style={{ fontSize: 12, color: '#6b7280' }}>(you)</span>;
        if (!props.canManageRoles) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {admin ? <StatusChip tone="info">Admin</StatusChip> : <StatusChip tone="neutral">Member</StatusChip>}{you}
            </span>
          );
        }
        if (roleBusy && roleChange?.row?.id === row.id) {
          return <CircularProgress size={14} aria-label={`Updating ${fullName(row) || row.email}'s role`} />;
        }
        // Never leave the organisation without an admin.
        const lastAdmin = admin && activeAdminCount <= 1;
        const reason = lastAdmin ? "The organisation's only admin. Make someone else an admin first."
          : (!admin && row.is_active === 'False' ? 'This account is deactivated.' : '');
        return (
          <Tooltip title={reason}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Switch
                size="small"
                checked={admin}
                disabled={Boolean(reason)}
                onChange={(e) => setRoleChange({ row, makeAdmin: e.target.checked })}
                inputProps={{ 'aria-label': `${admin ? 'Remove admin rights from' : 'Make admin:'} ${fullName(row) || row.email}` }}
              />
              <span style={{ fontSize: 12.5, color: admin ? '#1a3a7a' : '#6b7280', fontWeight: admin ? 600 : 400 }}>{admin ? 'Admin' : 'Member'}</span>
              {you}
            </span>
          </Tooltip>
        );
      },
    },
    // { field: 'is_active', headerName: 'Active', width: 200 },
    {
      field: 'action2',
      headerName: 'Edit User',
      width: 130,
      renderCell: (params) => {
        const handleClick = () => {
          ontableclick(params.row)
          // alert(`ID: ${params.row.signers}`);
        };

        return (
          <TableIconButton title="Edit user" onClick={handleClick}><FaPen /></TableIconButton>
        );
      },
      filterable: false
    },
    ...(props.canDelete ? [
      {
        field: 'action5',
        headerName: 'Delete user',
        width: 60,
        filterable: false,
        renderCell: (params) => (isMe(params.row) ? null : (
          <TableIconButton title="Delete user" color="#b42318" onClick={() => setDeleting(params.row)}><FaTrashAlt /></TableIconButton>
        )),
      },
    ] : []),
    ...(props.licensing ? [
      {
        // One control for state and action (same pattern as the organisations' Active switch):
        // on = licensed. Turning it on assigns at once; turning it off asks first.
        field: 'is_licensed',
        headerName: 'Licence',
        width: 150,
        minWidth: 140,
        valueGetter: (params) => (isLicensed(params.row) ? 'Licensed' : 'Not licensed'),
        renderCell: (params) => {
          const row = params.row;
          const on = isLicensed(row);
          const name = fullName(row) || row.email;
          if (licenceBusy === row.id) {
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <CircularProgress size={14} aria-label={`Updating ${name}'s licence`} />
                <span style={{ fontSize: 12.5, color: '#6b7280' }}>{on ? 'Withdrawing…' : 'Assigning…'}</span>
              </span>
            );
          }
          const reason = lockReason(row);
          return (
            <Tooltip title={reason}>
              {/* span: tooltips need an enabled element to attach to */}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Switch
                  size="small"
                  checked={on}
                  disabled={Boolean(reason)}
                  onChange={(e) => (e.target.checked ? changeLicence(row, true) : setWithdrawing(row))}
                  inputProps={{ 'aria-label': `${on ? 'Withdraw licence from' : 'Assign licence to'} ${name}` }}
                />
                <span style={{ fontSize: 12.5, color: on ? '#2e7d32' : '#6b7280' }}>{on ? 'Licensed' : 'Not licensed'}</span>
              </span>
            </Tooltip>
          );
        },
      },
    ] : []),
  ];
  const visibleColumns = columns.filter((column) => column.field !== 'owner');
  // Actions (edit, delete) in the last column, after Role and Licence.
  const isAction = (c) => /^action\d*$/.test(c.field);
  const actionsLast = [...columns.filter((c) => !isAction(c)), ...columns.filter(isAction)];


  let CustomToolbar = () => {
    return (
      <GridToolbarContainer sx={{ flexWrap: 'wrap', gap: 1 }}>
        <GridToolbarQuickFilter

        />
        <GridToolbarFilterButton

        />
        {/* <GridToolbarDensitySelector /> */}
        <GridToolbarExport />
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {props.canImport && (
            <Button onClick={() => setImportOpen(true)} startIcon={<FaFileImport size={13} />} variant="outlined"
              sx={{ ...PILL_COMPACT }}>
              Import users
            </Button>
          )}
          {props.newUser && (
            // Same dialog as the sidebar's "Add new user".
            <Button onClick={props.newUser} startIcon={<FaUserPlus size={13} />} variant="contained" disableElevation
              sx={{ ...PILL_COMPACT, bgcolor: '#2757aa', color: '#fff', '&:hover': { bgcolor: '#1a3a7a' } }}>
              Add user
            </Button>
          )}
        </Box>
      </GridToolbarContainer>
    );
  }
  let viewDocDetails = (document, signers) => {
    setOpenDialogDocDetails(true)
    setDocument(document)
    setDocumentSigners(signers)
  }

  const getRowId = (row) => row.id;


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    props.setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  return (
    <>

      <ConfirmDialog
        open={Boolean(withdrawing)}
        icon={<FaUserSlash />}
        title="Withdraw licence"
        tone="danger"
        busy={Boolean(withdrawing) && licenceBusy === withdrawing?.id}
        message={isMe(withdrawing)
          ? <>This is <strong>your own</strong> licence. Without it you may lose access to features that need one. You can assign it back while licences are left.</>
          : "This person will no longer hold one of your organisation's licences. You can then assign it to someone else."}
        confirmLabel="Withdraw"
        onConfirm={() => changeLicence(withdrawing, false)}
        onCancel={() => setWithdrawing(null)}
      >
        <PropertyRow label="User"><PropertyValue>{fullName(withdrawing)}</PropertyValue></PropertyRow>
        <PropertyRow label="Email"><PropertyValue>{withdrawing?.email}</PropertyValue></PropertyRow>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(roleChange)}
        icon={<FaUserShield />}
        title={roleChange?.makeAdmin ? 'Make admin' : 'Remove admin rights'}
        tone={roleChange?.makeAdmin ? 'primary' : 'danger'}
        busy={roleBusy}
        message={roleChange?.makeAdmin
          ? 'Admins can add and delete users, assign licences and change organisation settings.'
          : (isMe(roleChange?.row)
            ? <>You&apos;re removing <strong>your own</strong> admin rights. After your next sign-in you won&apos;t see the admin dashboard.</>
            : 'They keep their account and documents, but can no longer manage the organisation.')}
        confirmLabel={roleChange?.makeAdmin ? 'Make admin' : 'Remove admin rights'}
        onConfirm={changeRole}
        onCancel={() => setRoleChange(null)}
      >
        <PropertyRow label="User"><PropertyValue>{fullName(roleChange?.row)}</PropertyValue></PropertyRow>
        <PropertyRow label="Email"><PropertyValue>{roleChange?.row?.email}</PropertyValue></PropertyRow>
      </ConfirmDialog>

      {props.canImport && (
        <ImportUsersDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onImported={() => props.onUsersChanged?.()}
          company={props.importCompany}
          companyName={props.companyName}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        icon={<FaTrashAlt />}
        title="Delete user"
        tone="danger"
        busy={deleteBusy}
        message={<>
          This permanently removes the account and frees their licence. It only works for people who haven&apos;t sent any documents.
          To keep someone&apos;s documents and signatures but stop them signing in, <strong>withdraw their licence</strong> instead (the Licence switch).
        </>}
        confirmLabel="Delete"
        onConfirm={removeUser}
        onCancel={() => setDeleting(null)}
      >
        <PropertyRow label="User"><PropertyValue>{fullName(deleting)}</PropertyValue></PropertyRow>
        <PropertyRow label="Email"><PropertyValue>{deleting?.email}</PropertyValue></PropertyRow>
      </ConfirmDialog>

      <Box sx={{ height: '100%', minHeight: 0, width: '100%', fontSize: '13px', display: 'flex', flexDirection: 'column' }} >
        {(props.licensing || props.canManageRoles || props.canDelete) && (
          <Box sx={{ mb: 1, flexShrink: 0 }}>
            <LicenceSummaryBar
              licence={licence}
              companyName={props.companyName || me?.company}
              unlicensedCount={unlicensedCount}
              onlyUnlicensed={onlyUnlicensed}
              onToggleUnlicensed={() => setOnlyUnlicensed((v) => !v)}
            />
            {licenceMsg && (
              <Alert severity={licenceMsg.severity} onClose={() => setLicenceMsg(null)} sx={{ mt: 1, fontSize: 12.5, py: 0 }}>{licenceMsg.text}</Alert>
            )}
          </Box>
        )}
        {/* Loading state check */}
        {props.loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <CircularProgress />
            <p className='text-dark p-2' style={{fontSize:'13px'}}>Fetching organization users, please wait...</p>
          </div>
        ) : (
          <>
    
            <DataGrid
              rows={rows}
              columns={autoSizeColumns(mergeActionColumns(actionsLast), rows)}
              density='compact'
              components={{
                Toolbar: CustomToolbar,
              }}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 15,
                  },
                },
              }}
              pageSizeOptions={[5, 15, 20, 100]}
              // checkboxSelection
              disableRowSelectionOnClick
              style={{ fontSize: '13px', fontWeight: "lighter", flex: 1, minHeight: 0, height: '100%' }}
              getRowId={getRowId}
              className='app-table'
            />
          </>
        )}


      </Box>

    </>
  );
}

export default Users;