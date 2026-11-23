import TableIconButton from './common/TableIconButton';
import mergeActionColumns from './common/mergeActionColumns';
import autoSizeColumns from './common/autoSizeColumns';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, LinearProgress, Typography } from '@mui/material';
import { FaIdCard, FaPen, FaUserSlash } from 'react-icons/fa';
import AuthContext from '../context/Authcontext';
import { ConfirmDialog, PropertyRow, PropertyValue, StatusChip } from './common/dialogKit';
import { assignUserLicense, getCompanyLicense, licenseError, withdrawUserLicense } from '../api/licensing';
import { daysUntil, expiryLabel, expiryTone, formatCalendarDate } from './admin/licenseFormat';

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
 * shows the organisation's licence usage, each user's licence, and Assign/Withdraw.
 */
function Users(props) {
  const { authTokens } = useContext(AuthContext);
  const [licence, setLicence] = useState(null); // { has_license, status } for the organisation
  const [licenceOverrides, setLicenceOverrides] = useState({}); // user id -> is_licensed after a change
  const [licenceBusy, setLicenceBusy] = useState(null); // user id being changed
  const [licenceMsg, setLicenceMsg] = useState(null); // { severity, text }
  const [withdrawing, setWithdrawing] = useState(null); // user row waiting for confirmation

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

  const changeLicence = (row, assign) => {
    const name = fullName(row) || row.email;
    if (assign && !licence?.has_license) {
      setLicenceMsg({ severity: 'error', text: 'Your organisation has no licence yet. Contact Alignsys to get one.' });
      return;
    }
    if (assign && noneLeft) {
      setLicenceMsg({ severity: 'error', text: 'All licences are in use. Withdraw one from another user, or contact Alignsys for more.' });
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
    ...(props.licensing ? [
      {
        field: 'is_licensed',
        headerName: 'Licence',
        width: 120,
        valueGetter: (params) => (isLicensed(params.row) ? 'Licensed' : 'Not licensed'),
        renderCell: (params) => (isLicensed(params.row)
          ? <StatusChip tone="success">Licensed</StatusChip>
          : <StatusChip tone="neutral">Not licensed</StatusChip>),
      },
      {
        field: 'action3',
        headerName: 'Licence',
        width: 90,
        filterable: false,
        renderCell: (params) => {
          if (licenceBusy === params.row.id) return <CircularProgress size={16} aria-label="Updating licence" />;
          return isLicensed(params.row) ? (
            <TableIconButton title="Withdraw licence" color="#b42318" onClick={() => setWithdrawing(params.row)}><FaUserSlash /></TableIconButton>
          ) : (
            <TableIconButton title="Assign licence" onClick={() => changeLicence(params.row, true)}><FaIdCard /></TableIconButton>
          );
        },
      },
    ] : []),
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
        message="This person will no longer hold one of your organisation's licences. You can then assign it to someone else."
        confirmLabel="Withdraw"
        onConfirm={() => changeLicence(withdrawing, false)}
        onCancel={() => setWithdrawing(null)}
      >
        <PropertyRow label="User"><PropertyValue>{fullName(withdrawing)}</PropertyValue></PropertyRow>
        <PropertyRow label="Email"><PropertyValue>{withdrawing?.email}</PropertyValue></PropertyRow>
      </ConfirmDialog>

      <Box sx={{ height: '100%', minHeight: 0, width: '100%', fontSize: '13px', display: 'flex', flexDirection: 'column' }} >
        {props.licensing && (
          <Box sx={{ mb: 1, flexShrink: 0 }}>
            {licence && (licence.has_license && status ? (
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, px: 1.5, py: 1, border: '1px solid #e5e7eb', borderRadius: 1.5, bgcolor: '#fafafa' }}>
                <FaIdCard aria-hidden style={{ color: '#2757aa' }} />
                <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12.8 }}>
                    Licences: <strong>{status.allocatedLicenses}</strong> of {status.numberOfLicenses} in use · {status.remaining} left
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={status.numberOfLicenses ? Math.min(100, (status.allocatedLicenses / status.numberOfLicenses) * 100) : 0}
                    sx={{ mt: 0.5, height: 5, borderRadius: 3, maxWidth: 320 }}
                    aria-label={`${status.allocatedLicenses} of ${status.numberOfLicenses} licences in use`}
                  />
                </Box>
                <Typography sx={{ fontSize: 12.5, color: '#4b5563' }}>Expires {formatCalendarDate(status.expiryDate)}</Typography>
                <StatusChip tone={expiryTone(daysUntil(status.expiryDate))}>{expiryLabel(daysUntil(status.expiryDate))}</StatusChip>
              </Box>
            ) : (
              <Alert severity="info" sx={{ fontSize: 12.5, py: 0 }}>Your organisation has no licence yet. Contact Alignsys to get one.</Alert>
            ))}
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
              rows={props.users}
              columns={autoSizeColumns(mergeActionColumns(columns), props.users)}
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