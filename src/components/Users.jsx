import React, { useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { FaUserEdit } from 'react-icons/fa';

import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';


function Users(props) {
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
            <FaUserEdit className="mx-1" />
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

      <Box sx={{ height: '100%', minHeight: 0, width: '100%', fontSize: '13px', display: 'flex', flexDirection: 'column' }} >
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

    </>
  );
}

export default Users;