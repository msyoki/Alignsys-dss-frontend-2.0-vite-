import React, { useContext, useState } from 'react';
import autoSizeColumns from './common/autoSizeColumns';
import mergeActionColumns from './common/mergeActionColumns';
import TableIconButton from './common/TableIconButton';
import Box from '@mui/material/Box';
import { Alert } from '@mui/material';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
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
import { ADMIN_GRID_PROPS, Pill } from './admin/AdminTableKit';
import { accountError, approveIndividual, rejectIndividual } from '../api/accounts';

const fullName = (row) => `${row?.first_name || ''} ${row?.last_name || ''}`.trim();

/**
 * Super admin: individual accounts. Sign-ups arrive "Waiting for approval";
 * approving assigns a licence from the "Individual" organisation's licence and
 * emails a "Set your password" link. Rejecting deletes the request.
 */
function IndividualAccounts(props) {
  const { authTokens } = useContext(AuthContext);
  const [pending, setPending] = useState(null); // { row, approve }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { severity, text }

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
        props.getIndividualUsers?.();
      })
      .catch((err) => setMsg({ severity: 'error', text: accountError(err) }))
      .finally(() => { setBusy(false); setPending(null); });
  };

  const columns = [
    { field: 'first_name', headerName: 'First', width: 150 },
    { field: 'last_name', headerName: 'Last', width: 150 },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'phone', headerName: 'Phone', width: 140 },
    {
      field: 'status',
      headerName: 'Status',
      width: 170,
      valueGetter: (p) => (p.row.pending_approval ? 'Waiting for approval' : p.row.is_licensed ? 'Licensed' : 'No licence'),
      renderCell: (p) => (
        <Pill tone={p.row.pending_approval ? 'warning' : p.row.is_licensed ? 'success' : 'neutral'}>{p.value}</Pill>
      ),
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

      <Box sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%', fontSize: '12px' }}>
        {waiting > 0 && !msg && (
          <Alert severity="info" sx={{ mb: 1, fontSize: 12.5, py: 0, flexShrink: 0 }}>
            {waiting} sign-up request{waiting === 1 ? '' : 's'} waiting for approval.
          </Alert>
        )}
        {msg && <Alert severity={msg.severity} onClose={() => setMsg(null)} sx={{ mb: 1, fontSize: 12.5, py: 0, flexShrink: 0 }}>{msg.text}</Alert>}
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
