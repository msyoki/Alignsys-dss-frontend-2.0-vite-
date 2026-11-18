import React, { useMemo, useState } from 'react';
import mergeActionColumns from './common/mergeActionColumns';
import autoSizeColumns from './common/autoSizeColumns';
import { Box, CircularProgress, Button } from '@mui/material';
import { FaInfoCircle } from 'react-icons/fa';

import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import DocDetailsDialog from './dialogs/DocDetailsDialog';



import TableIconButton from './common/TableIconButton';
import DateRangeFilter from './common/DateRangeFilter';
import { StatusChip } from './common/dialogKit';

// Document stages, as on the dashboard tabs. The server sends `stage`; the fallback
// works it out from the flags for an older backend (which doesn't send `trashed`).
export const STAGES = [
  { value: 'pending', label: 'Pending', tone: 'warning' },
  { value: 'saved', label: 'Saved for later', tone: 'neutral' },
  { value: 'completed', label: 'Completed', tone: 'success' },
  { value: 'voided', label: 'Voided', tone: 'danger' },
  { value: 'trashed', label: 'Trashed', tone: 'neutral' },
];
const isTrue = (v) => v === true || v === 'True';
export const docStage = (d) => d.stage || (
  isTrue(d.trashed) ? 'trashed'
    : isTrue(d.declined) ? 'voided'
      : isTrue(d.signedcomplete) ? 'completed'
        : (d.signers || []).length ? 'pending' : 'saved'
);

function DocumentLogs(props) {
  const [opendialogdocdetails, setOpenDialogDocDetails] = useState(false)
  const [document, setDocument] = useState({})
  const [documentsigners, setDocumentSigners] = useState([])
  const [stage, setStage] = useState('')
  // Newest first, then narrowed to the chosen stage (client-side, within the date range).
  const allDocs = useMemo(
    () => [...props.companydocs].sort((a, b) => new Date(b.docdate) - new Date(a.docdate)),
    [props.companydocs],
  );
  const stageCounts = useMemo(() => allDocs.reduce((acc, d) => {
    const k = docStage(d); acc[k] = (acc[k] || 0) + 1; return acc;
  }, {}), [allDocs]);
  const sortedCompanydocs = useMemo(
    () => (stage ? allDocs.filter((d) => docStage(d) === stage) : allDocs),
    [allDocs, stage],
  );


  let ontableclick = async (e, active, admin, Id, email, first, last, phone) => {
    await props.setCurrentEditUserActive(`${active}`)
    await props.setCurrentEditUserAdmin(`${admin}`)
    await props.setCurrentEditUser(Id)
    await props.setCurrentEditUserEmail(email)
    await props.setCurrentEditUserLast(last)
    await props.setCurrentEditUserFirst(first)
    await props.setCurrentEditUserPhone(phone)
    await props.setOpenDialogUpdateUser(true)
    // alert('clicked')
  }


  const columns = [
    { field: 'guid', headerName: 'Document Guid', width: 300 },

    { field: 'title', headerName: 'Title', width: 200 },

    { field: 'owner', headerName: 'Owner', width: 200 },

    {
      field: 'stage',
      headerName: 'Status',
      width: 130,
      valueGetter: (params) => STAGES.find((x) => x.value === docStage(params.row))?.label || '',
      renderCell: (params) => {
        const st = STAGES.find((x) => x.value === docStage(params.row));
        return st ? <StatusChip tone={st.tone}>{st.label}</StatusChip> : null;
      },
    },
    { field: 'docdate', headerName: 'Created', width: 200 },
    {
      field: 'action2',
      headerName: 'More Details',
      width: 130,
      renderCell: (params) => {
        const handleClick = () => {
          viewDocDetails(params.row, params.row.signers)
          // alert(`ID: ${params.row.signers}`);
        };

        return (
          <TableIconButton title="Document details" onClick={handleClick}><FaInfoCircle /></TableIconButton>
        );
      },
      filterable: false
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

  const getRowId = (row) => row.guid;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    props.setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };



  return (
    // Fills the tab so only the rows scroll; the filters and the table footer stay put.
    <div style={{ flex: 1, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DocDetailsDialog
        setOpenDialogDocDetails={setOpenDialogDocDetails}
        opendialogdocdetails={opendialogdocdetails}
        document={document}
        onChanged={props.getDocLogs}

      />

      <Box sx={{ height: '100%', minHeight: 0, width: '100%', fontSize: '13px', display: 'flex', flexDirection: 'column' }}>


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
            <p className='text-dark p-2' style={{fontSize:'13px'}}>Fetching document logs, please wait...</p>
          </div>
        ) : (
          <>
            <DateRangeFilter filters={props.filters} onChange={handleFilterChange} onApply={props.getDocLogs}
              summaryExtra={STAGES.find((st) => st.value === stage)?.label || ''}>
              <div className="d-flex flex-column" style={{ minWidth: '180px', flex: 1 }}>
                <label htmlFor="filter-stage" className="mb-1 text-dark fw-medium" style={{ fontSize: '12px', lineHeight: 1.1 }}>Stage</label>
                <select
                  id="filter-stage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="form-select form-select-sm"
                  style={{ minHeight: '32px', paddingTop: '2px', paddingBottom: '2px', fontSize: '12px' }}
                >
                  <option value="">All stages ({allDocs.length})</option>
                  {STAGES.map((st) => (
                    <option key={st.value} value={st.value}>{st.label} ({stageCounts[st.value] || 0})</option>
                  ))}
                </select>
              </div>
            </DateRangeFilter>
            <DataGrid
              rows={sortedCompanydocs}
              columns={autoSizeColumns(mergeActionColumns(columns), sortedCompanydocs)}
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
    </div>
  );
}

export default DocumentLogs;