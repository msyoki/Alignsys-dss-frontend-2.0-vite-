import React, { useState } from 'react';
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
function DocumentLogs(props) {
  const [opendialogdocdetails, setOpenDialogDocDetails] = useState(false)
  const [document, setDocument] = useState({})
  const [documentsigners, setDocumentSigners] = useState([])
  // Sort the inbox data based on docdate in descending order
  const sortedCompanydocs = [...props.companydocs].sort((a, b) => new Date(b.docdate) - new Date(a.docdate));


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

    // { field: 'signedcomplete', headerName: 'Complete', width: 100 },
    // { field: 'declined', headerName: 'Voided', width: 100 },
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
    <div >
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
            <DateRangeFilter filters={props.filters} onChange={handleFilterChange} onApply={props.getDocLogs} />
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