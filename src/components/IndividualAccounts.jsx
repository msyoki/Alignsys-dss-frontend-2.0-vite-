import React, { useContext, useEffect, useState } from 'react';
import autoSizeColumns from './common/autoSizeColumns';
import mergeActionColumns from './common/mergeActionColumns';
import TableIconButton from './common/TableIconButton';
import Box from '@mui/material/Box';
import { Alert, CircularProgress } from '@mui/material';
import { FaCheckCircle, FaPen, FaTimesCircle, FaTrashAlt, FaUserSlash } from 'react-icons/fa';
import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import AuthContext from '../context/Authcontext';
import HumanizedDate from './HumanizeDate.jsx';
import { ConfirmDialog, PropertyRow, PropertyValue } from './common/dialogKit';
import { ADMIN_GRID_PROPS, AdminSwitch, Pill, StatusText } from './admin/AdminTableKit';
import { accountError, approveIndividual, deleteUser, rejectIndividual } from '../api/accounts';
import { assignUserLicense, licenseError, withdrawUserLicense } from '../api/licensing';
import UserUpdateDialog from './dialogs/UserUpdateDialog';

const fullName = (row) => `${row?.first_name || ''} ${row?.last_name || ''}`.trim();

/**
 * Super admin: individual accounts. Sign-ups arrive "Waiting for approval";
 * approving assigns a licence from the "Individual" organisation's licence and
 * emails a "Set your password" link. Rejecting deletes the request.
 * Approved accounts can be edited, have their licence withdrawn or assigned
 * (the Licence switch), or be deleted if they have sent no documents.
 */
function IndividualAccounts(props) {
  const { authTokens } = useContext(AuthContext);
  const [pending, setPending] = useState(null); // { row, approve }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { severity, text }

  // Licence switch: user id -> is_licensed after a change, until the list reloads.
  const [licenceOverrides, setLicenceOverrides] = useState({});
  const [licenceBusy, setLicenceBusy] = useState(null); // user id being changed
  const [withdrawing, setWithdrawing] = useState(null); // row waiting for "Withdraw licence" confirmation
  const [deleting, setDeleting] = useState(null); // row waiting for "Delete account" confirmation
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { setLicenceOverrides({}); }, [props.individualusers]); // fresh list from the server

  const reload = () => props.getIndividualUsers?.();
  const isLicensed = (row) => (row.id in licenceOverrides ? licenceOverrides[row.id] : Boolean(row.is_licensed));

  const decide = () => {
    const { row, approve } = pending;
    const name = fullName(row) || row.email;
    setBusy(true);
    setMsg(null);
    (approve ? approveIndividual : rejectIndividual)(authTokens?.access, row.id)
      .then((res) => {
        setMsg(approve
          ? { severity: res.email_sent === false ? 'warning' : 'success',
              text: res.email_sent === false
                ? `${name} is approved and licensed, but the email could not be sent. Ask them to use "Forgot password" on the sign-in page.`
                : `${name} is approved and licensed. They've been emailed a link to set their password.` }
          : { severity: 'success', text: `${name}'s sign-up request was rejected and removed.` });
        reload();
      })
      .catch((err) => setMsg({ severity: 'error', text: accountError(err) }))
      .finally(() => { setBusy(false); setPending(null); });
  };

  const changeLicence = (row, assign) => {
    const name = fullName(row) || row.email;
    setLicenceBusy(row.id);
    setMsg(null);
    (assign ? assignUserLicense : withdrawUserLicense)(authTokens?.access, row.id)
      .then((res) => {
        setLicenceOverrides((o) => ({ ...o, [row.id]: res.is_licensed }));
        setMsg({ severity: 'success', text: assign ? `Licence assigned to ${name}.` : `Licence withdrawn from ${name}. They can no longer sign in.` });
      })
      .catch((err) => setMsg({ severity: 'error', text: licenseError(err) }))
      .finally(() => { setLicenceBusy(null); setWithdrawing(null); });
  };

  const confirmDelete = () => {
    const row = deleting;
    setDeleteBusy(true);
    setMsg(null);
    deleteUser(authTokens?.access, row.id)
      .then(() => {
        setMsg({ severity: 'success', text: `${fullName(row) || row.email}'s account was deleted.` });
        reload();
      })
      // 409: they've sent documents; the message says to withdraw their licence instead.
      .catch((err) => setMsg({ severity: err?.response?.status === 409 ? 'warning' : 'error', text: accountError(err) }))
      .finally(() => { setDeleteBusy(false); setDeleting(null); });
  };

  const openEdit = (row) => { setEditingId(row.id); setEditOpen(true); };

  const columns = [
    { field: 'first_name', headerName: 'First', width: 150 },
    { field: 'last_name', headerName: 'Last', width: 150 },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'phone', headerName: 'Phone', width: 140 },
    {
      // Approved accounts: on = holds a licence (can sign in). Turning it on assigns at once; off asks first.
      field: 'is_licensed',
      headerName: 'Licence',
      width: 170,
      minWidth: 160,
      valueGetter: (p) => (p.row.pending_approval ? 'Waiting for approval' : isLicensed(p.row) ? 'Licensed' : 'No licence'),
      renderCell: (p) => {
        const row = p.row;
        if (row.pending_approval) return <Pill tone="warning">Waiting for approval</Pill>;
        const on = isLicensed(row);
        const name = fullName(row) || row.email;
        if (licenceBusy === row.id) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <CircularProgress size={16} aria-label={`Updating ${name}'s licence`} />
              <StatusText>{on ? 'Withdrawing…' : 'Assigning…'}</StatusText>
            </span>
          );
        }
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <AdminSwitch
              checked={on}
              onChange={(e) => (e.target.checked ? changeLicence(row, true) : setWithdrawing(row))}
              inputProps={{ 'aria-label': `${on ? 'Withdraw licence from' : 'Assign licence to'} ${name}` }}
            />
            <StatusText tone={on ? 'success' : 'neutral'}>{on ? 'Licensed' : 'No licence'}</StatusText>
          </span>
        );
      },
    },
    {
      field: 'registered',
      headerName: 'Registered',
      width: 150,
      renderCell: (p) => (p.row.registered ? <HumanizedDate dateStr={p.row.registered} /> : ''),
    },
    {
      field: 'action1',
      headerName: 'Approve',
      filterable: false,
      renderCell: (p) => (p.row.pending_approval ? (
        <TableIconButton title='Approve and assign a licence' color='#2e7d32' onClick={() => setPending({ row: p.row, approve: true })}>
          <FaCheckCircle />
        </TableIconButton>
      ) : null),
    },
    {
      field: 'action2',
      headerName: 'Reject',
      filterable: false,
      renderCell: (p) => (p.row.pending_approval ? (
        <TableIconButton title='Reject request' color='#b42318' onClick={() => setPending({ row: p.row, approve: false })}>
          <FaTimesCircle />
        </TableIconButton>
      ) : null),
    },
    {
      field: 'action3',
      headerName: 'Edit',
      filterable: false,
      renderCell: (p) => (
        <TableIconButton title='Edit account' onClick={() => openEdit(p.row)}><FaPen /></TableIconButton>
      ),
    },
    {
      field: 'action4',
      headerName: 'Delete',
      filterable: false,
      renderCell: (p) => (p.row.pending_approval ? null : (
        <TableIconButton title='Delete account' color='#b42318' onClick={() => setDeleting(p.row)}><FaTrashAlt /></TableIconButton>
      )),
    },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarQuickFilter />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const rows = props.individualusers || [];
  const waiting = rows.filter((r) => r.pending_approval).length;

  return (
    <>
      <ConfirmDialog
        open={Boolean(pending)}
        icon={pending?.approve ? <FaCheckCircle /> : <FaTimesCircle />}
        title={pending?.approve ? 'Approve sign-up' : 'Reject sign-up'}
        tone={pending?.approve ? 'primary' : 'danger'}
        busy={busy}
        message={pending?.approve
          ? 'This assigns them a licence from the "Individual" organisation\'s licence and emails a link to set their password.'
          : 'The request is deleted. They can register again later.'}
        confirmLabel={pending?.approve ? 'Approve' : 'Reject'}
        onConfirm={decide}
        onCancel={() => setPending(null)}
      >
        <PropertyRow label="Name"><PropertyValue>{fullName(pending?.row)}</PropertyValue></PropertyRow>
        <PropertyRow label="Email"><PropertyValue>{pending?.row?.email}</PropertyValue></PropertyRow>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(withdrawing)}
        icon={<FaUserSlash />}
        title="Withdraw licence"
        tone="danger"
        busy={Boolean(withdrawing) && licenceBusy === withdrawing?.id}
        message="Without a licence they can no longer sign in. Their documents and signatures are kept, and you can assign the licence back later."
        confirmLabel="Withdraw"
        onConfirm={() => changeLicence(withdrawing, false)}
        onCancel={() => setWithdrawing(null)}
      >
        <PropertyRow label="Name"><PropertyValue>{fullName(withdrawing)}</PropertyValue></PropertyRow>
        <PropertyRow label="Email"><PropertyValue>{withdrawing?.email}</PropertyValue></PropertyRow>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        icon={<FaTrashAlt />}
        title="Delete account"
        tone="danger"
        busy={deleteBusy}
        message={<>
          This permanently removes the account and frees its licence. It only works for people who haven&apos;t sent any documents.
          To keep someone&apos;s documents and signatures but stop them signing in, <strong>withdraw their licence</strong> instead (the Licence switch).
        </>}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      >
        <PropertyRow label="Name"><PropertyValue>{fullName(deleting)}</PropertyValue></PropertyRow>
        <PropertyRow label="Email"><PropertyValue>{deleting?.email}</PropertyValue></PropertyRow>
      </ConfirmDialog>

      <UserUpdateDialog
        users={rows.map((r) => ({ ...r, is_licensed: isLicensed(r) }))}
        selectedUserId={editingId}
        opendialogupdateuser={editOpen}
        setOpenDialogUpdateUser={setEditOpen}
        getusers={reload}
        setAlertMsg={(text) => setMsg((m) => ({ ...(m || {}), text }))}
        setAlertSeverity={(severity) => setMsg((m) => ({ ...(m || {}), severity }))}
        setOpenAlert={(open) => { if (!open) setMsg(null); }}
      />

      <Box sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%', fontSize: '12px' }}>
        {waiting > 0 && !msg && (
          <Alert severity="info" sx={{ mb: 1, fontSize: 12.5, py: 0, flexShrink: 0 }}>
            {waiting} sign-up request{waiting === 1 ? '' : 's'} waiting for approval.
          </Alert>
        )}
        {msg?.text && <Alert severity={msg.severity || 'info'} onClose={() => setMsg(null)} sx={{ mb: 1, fontSize: 12.5, py: 0, flexShrink: 0 }}>{msg.text}</Alert>}
        <DataGrid
          {...ADMIN_GRID_PROPS}
          rows={rows}
          columns={autoSizeColumns(mergeActionColumns(columns, { last: true }), rows)}
          components={{ Toolbar: CustomToolbar }}
          style={{ flex: 1, minHeight: 0 }}
          getRowId={(row) => row.id}
        />
      </Box>
    </>
  );
}

export default IndividualAccounts;
