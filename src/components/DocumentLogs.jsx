import React, { useState } from 'react';
import { Box, CircularProgress, Button } from '@mui/material';
import { FaInfoCircle, FaFilter } from 'react-icons/fa';

import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import DocDetailsDialog from './dialogs/DocDetailsDialog';



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
          <span
            onClick={handleClick}
            style={{
              fontSize: '16px',
              color: '#403d39',
              borderRadius: '50%',
              cursor: 'pointer',
              padding: '8px',
              backgroundColor: '#f0f0f0',
              transition: 'background-color 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#ffff')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
          >
            <FaInfoCircle className="mx-1" />
          </span>
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
            <div className='col-lg-12 col-md-12 col-sm-12 p-3' style={{ display: 'flex', gap: '16px' }}>
              <div className='input-group'>
                <label className='mx-3 text-dark'>Start Date:</label>
                <input
                  type="date"
                  name="start_date"
                  value={props.filters.start_date}
                  onChange={handleFilterChange}
                  className="form-control form-control-sm"
                />

                <label className='mx-3 text-dark'>End Date:</label>
                <input
                  type="date"
                  name="end_date"
                  value={props.filters.end_date}
                  onChange={handleFilterChange}
                  className="form-control form-control-sm"
                />
                <Button
                  style={{
                    backgroundColor: '#2757aa',
                    color: '#fff',
                    border: 'none',           // To remove any default border
                    padding: '4px 8px',      // Adjust the padding to make the button look better
                    fontSize: '14px',        // Adjust font size if needed
                    display: 'flex',         // Use flexbox to align the text and icon
                    alignItems: 'center',    // Vertically center the text and icon
                    gap: '5px'               // Add space between text and icon
                  }}
                  className="btn btn-sm rounded mx-2"
                  onClick={props.getDocLogs}
                >
                  <FaFilter /> Filter
                </Button>

              </div>



            </div>
            <DataGrid
              rows={sortedCompanydocs}
              columns={columns}
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
              className='bg-light '
            />
          </>
        )}

      </Box>
    </div>
  );
}

export default DocumentLogs;