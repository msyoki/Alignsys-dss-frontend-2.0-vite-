import React, { useContext, useState } from 'react';
import autoSizeColumns from './common/autoSizeColumns';
import Box from '@mui/material/Box';
import { FaToggleOn, FaToggleOff, FaIdCard } from 'react-icons/fa';
import TableIconButton from './common/TableIconButton';
import CompanyLicenseDialog from './admin/CompanyLicenseDialog';
import { formatCalendarDate } from './admin/licenseFormat';
import { licenseError, setCompanySuspended } from '../api/licensing';
import Switch from '@mui/material/Switch';

import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import HumanizedDate from './HumanizeDate.jsx';
import AuthContext from '../context/Authcontext.jsx';
import axios from 'axios';
import * as constants from './constants/constants.js';


import { ConfirmDialog, PropertyRow, PropertyValue, StatusChip } from './common/dialogKit';
function Companies2(props) {
  let { authTokens } = useContext(AuthContext);
  const isTrue = (v) => v === 'True' || v === true || v === 'true';

  // Suspend / restore waiting for confirmation: { row, suspend }.
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const confirmSuspend = () => {
    const { row, suspend } = pending;
    setBusy(true);
    setCompanySuspended(authTokens?.access, row.id, suspend)
      .then(() => {
        alertUser(suspend
          ? `${row.name} is suspended: nobody in it can sign in until you switch it back on.`
          : `${row.name} is restored.`, 'success', 4000);
        props.getCompanies?.();
      })
      .catch((err) => alertUser(licenseError(err, 'The change could not be saved.'), 'error', 5000))
      .finally(() => { setBusy(false); setPending(null); });
  };
  // Organisation whose licence dialog is open: { id, name }
  const [licenceFor, setLicenceFor] = useState(null);

  const alertUser = (msg, severity, ms) => {
    if (!props.setOpenAlert) return;
    props.setAlertMsg(msg);
    props.setAlertSeverity(severity);
    props.setOpenAlert(true);
    setTimeout(() => props.setOpenAlert(false), ms);
  };

  const columns = [
    { field: 'name', headerName: 'Company Name', width: 200 },

    { field: 'email', headerName: 'Admin Email', width: 250 },



    {
      field: 'approved',
      headerName: 'Approved',
      width: 110,
      renderCell: (params) => (isTrue(params.row.approved)
        ? <StatusChip tone="success">Approved</StatusChip>
        : <StatusChip tone="warning">Pending</StatusChip>),
    },
    {
      // Licence switch (same pattern as the users' Licence switch): on = licensed and not suspended.
      // On: restores a suspended organisation, or opens "issue licence" if it has none / it expired.
      // Off: suspends it (asks first); dsscall's licence is left as it is.
      field: 'active',
      headerName: 'Licence',
      width: 230,
      minWidth: 210,
      valueGetter: (params) => {
        const r = params.row;
        if (isTrue(r.suspended)) return 'Suspended';
        if (!isTrue(r.active)) return r.licence_expires ? 'Licence expired' : 'No licence';
        return r.licence_expires ? `Licensed to ${formatCalendarDate(r.licence_expires)}` : 'Licensed';
      },
      renderCell: (params) => {
        const r = params.row;
        const suspended = isTrue(r.suspended);
        const on = isTrue(r.active) && !suspended;
        const approved = isTrue(r.approved);
        const color = suspended ? '#8a4b00' : on ? '#2e7d32' : r.licence_expires ? '#b42318' : '#6b7280';
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Switch
              size="small"
              checked={on}
              disabled={!approved || busy}
              onChange={(e) => {
                if (!e.target.checked) setPending({ row: r, suspend: true });
                else if (suspended) setPending({ row: r, suspend: false });
                else setLicenceFor({ id: r.id, name: r.name }); // no licence yet, or expired
              }}
              inputProps={{ 'aria-label': `${on ? 'Suspend' : 'Activate'} ${r.name || 'organisation'}` }}
            />
            <span style={{ fontSize: 12.5, color }}>{params.value}</span>
          </span>
        );
      },
      sortable: true,
      filterable: true,
    },
    {
      field: 'registered_date',
      headerName: 'Registered',
      width: 140,
      renderCell: (params) => <HumanizedDate dateStr={params.row.registered_date || params.row.docdate} />,
      filterable: true,
      sortable: true,
    },
    {
      field: 'licence',
      headerName: 'Licence details',
      width: 110,
      sortable: false,
      filterable: false,
      disableExport: true,
      // Approved organisations only: approval issues the first licence.
      renderCell: (params) => (isTrue(params.row.approved) ? (
        <TableIconButton title={`Licence for ${params.row.name || 'this organisation'}`} onClick={() => setLicenceFor({ id: params.row.id, name: params.row.name })}>
          <FaIdCard />
        </TableIconButton>
      ) : null),
    },


  ];
  const visibleColumns = columns.filter((column) => column.field !== 'owner');


  let CustomToolbar = () => {
    return (
      <GridToolbarContainer>
        <GridToolbarQuickFilter

        />
        <GridToolbarFilterButton

        />
        {/* <GridToolbarDensitySelector /> */}
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  }
  let viewDocDetails = (document, signers) => {
    setOpenDialogDocDetails(true)
    setDocument(document)
    setDocumentSigners(signers)
  }

  const getRowId = (row) => row.id;


  return (
    <>


      <CompanyLicenseDialog open={Boolean(licenceFor)} company={licenceFor} onClose={() => setLicenceFor(null)} onSaved={() => props.getCompanies?.()} />

      <ConfirmDialog
        open={Boolean(pending)}
        icon={pending?.suspend ? <FaToggleOff /> : <FaToggleOn />}
        title={pending?.suspend ? 'Suspend organisation' : 'Restore organisation'}
        tone={pending?.suspend ? 'danger' : 'primary'}
        busy={busy}
        message={pending?.suspend
          ? 'Nobody in this organisation, including its admins, will be able to sign in. Its licence and documents are kept, and switching it back on restores access straight away.'
          : 'Its members can sign in again (as long as its licence is valid).'}
        confirmLabel={pending?.suspend ? 'Suspend' : 'Restore'}
        onConfirm={confirmSuspend}
        onCancel={() => setPending(null)}
      >
        <PropertyRow label="Organisation"><PropertyValue>{pending?.row?.name}</PropertyValue></PropertyRow>
        <PropertyRow label="Admin email"><PropertyValue>{pending?.row?.email}</PropertyValue></PropertyRow>
      </ConfirmDialog>

      <Box sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%', fontSize: '10px' }}>
        <DataGrid
          rows={props.companies}
          columns={autoSizeColumns(columns, props.companies)}
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
          style={{ fontSize: '12px', fontWeight: "lighter", flex: 1, minHeight: 0 }}
          getRowId={getRowId}
          className='app-table'

        />
      </Box>

    </>
  );
}

export default Companies2;