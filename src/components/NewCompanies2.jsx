import autoSizeColumns from './common/autoSizeColumns';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import HumanizedDate from './HumanizeDate.jsx';
import { ADMIN_GRID_PROPS, Pill, RowButton } from './admin/AdminTableKit';

/** Super admin: organisations waiting for approval. */
function NewCompanies2(props) {
  const approveAccount = (id, email) => {
    props.setOpenDialogApproveCompany(true);
    props.setCompany4Approval(id);
    props.setCompany4ApprovalEmail(email);
  };

  const columns = [
    { field: 'name', headerName: 'Company Name', width: 200 },
    { field: 'email', headerName: 'Admin Email', width: 250 },
    {
      field: 'status',
      headerName: 'Status',
      width: 170,
      valueGetter: () => 'Waiting for approval',
      renderCell: () => <Pill tone="warning">Waiting for approval</Pill>,
    },
    {
      field: 'registered_date',
      headerName: 'Registered',
      width: 150,
      renderCell: (params) => (params.row.registered_date ? <HumanizedDate dateStr={params.row.registered_date} /> : ''),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      align: 'right',
      headerAlign: 'right',
      width: 120,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      disableExport: true,
      renderCell: (params) => (
        <RowButton aria-label={`Approve ${params.row.name || 'organisation'}`} onClick={() => approveAccount(params.row.id, params.row.email)}>
          Approve
        </RowButton>
      ),
    },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarQuickFilter />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const rows = props.newcompanies || [];

  return (
    <Box sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
      <DataGrid
        {...ADMIN_GRID_PROPS}
        rows={rows}
        columns={autoSizeColumns(columns, rows)}
        components={{ Toolbar: CustomToolbar }}
        localeText={{ noRowsLabel: 'No organisations waiting for approval' }}
        getRowId={(row) => row.id}
        style={{ flex: 1, minHeight: 0 }}
      />
    </Box>
  );
}

export default NewCompanies2;
