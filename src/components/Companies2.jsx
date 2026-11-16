import React, { useContext, useState } from 'react';
import autoSizeColumns from './common/autoSizeColumns';
import Box from '@mui/material/Box';
import { FaToggleOn, FaToggleOff } from 'react-icons/fa';
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

  // Status change waiting for confirmation: { row, next } (next = true to activate).
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const alertUser = (msg, severity, ms) => {
    if (!props.setOpenAlert) return;
    props.setAlertMsg(msg);
    props.setAlertSeverity(severity);
    props.setOpenAlert(true);
    setTimeout(() => props.setOpenAlert(false), ms);
  };

  // Same request the Edit company dialog sent: PATCH /api/company/{id} with `active`.
  const confirmStatusChange = () => {
    if (!pending) return;
    const { row, next } = pending;
    const data = new FormData();
    data.append('active', next);
    setBusy(true);
    axios({
      method: 'patch',
      url: `${constants.devApiBaseUrl}/api/company/${row.id}`,
      headers: { Authorization: `Bearer ${authTokens.access}` },
      data,
    })
      .then(() => {
        alertUser(`${row.name || 'Company'} ${next ? 'activated' : 'deactivated'}.`, 'success', 3000);
        props.getCompanies?.();
        props.getNewCompanies?.();
      })
      .catch((error) => {
        alertUser(error.response?.data?.message || 'The status could not be changed.', 'error', 4000);
      })
      .finally(() => { setBusy(false); setPending(null); });
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
      field: 'active',
      headerName: 'Status',
      width: 150,
      minWidth: 140, // switch + label
      // Switch right in the table; changing it asks for confirmation first.
      renderCell: (params) => {
        const on = isTrue(params.row.active);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Switch
              size="small"
              checked={on}
              onChange={(e) => setPending({ row: params.row, next: e.target.checked })}
              inputProps={{ 'aria-label': `${on ? 'Deactivate' : 'Activate'} ${params.row.name || 'company'}` }}
            />
            <span style={{ fontSize: 12.5, color: on ? '#2e7d32' : '#6b7280' }}>{on ? 'Active' : 'Inactive'}</span>
          </span>
        );
      },
      sortable: true,
      filterable: false,
    },
    {
      field: 'registered_date',
      headerName: 'Registered',
      width: 140,
      renderCell: (params) => <HumanizedDate dateStr={params.row.registered_date || params.row.docdate} />,
      filterable: true,
      sortable: true,
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
      <ConfirmDialog
        open={Boolean(pending)}
        icon={pending?.next ? <FaToggleOn /> : <FaToggleOff />}
        title={pending?.next ? 'Activate company' : 'Deactivate company'}
        tone={pending?.next ? 'primary' : 'danger'}
        busy={busy}
        message={pending?.next
          ? 'Activate this company account?'
          : 'Deactivate this company account?'}
        confirmLabel={pending?.next ? 'Activate' : 'Deactivate'}
        onConfirm={confirmStatusChange}
        onCancel={() => setPending(null)}
      >
        <PropertyRow label="Company"><PropertyValue>{pending?.row?.name}</PropertyValue></PropertyRow>
        <PropertyRow label="Admin email"><PropertyValue>{pending?.row?.email}</PropertyValue></PropertyRow>
      </ConfirmDialog>


      <Box sx={{ height: 'max(400px, calc(100dvh - 230px))', width: '100%', fontSize: '10px' }}>
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
          style={{ fontSize: '12px', fontWeight: "lighter" }}
          getRowId={getRowId}
          className='app-table'

        />
      </Box>

    </>
  );
}

export default Companies2;