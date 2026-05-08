import * as React from 'react';
import { FaFilter } from 'react-icons/fa';
import { Box, CircularProgress } from '@mui/material';
import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';


function ActivityLogs(props) {


  const columns = [
    { field: 'user', headerName: 'User', width: 200 },
    { field: 'created', headerName: 'TimeStatmp', width: 160, filterable: false, sortable: false },
    { field: 'activity', headerName: 'Activity', width: 100 },
    { field: 'description', headerName: 'Description', width: 500 },
    { field: 'ip', headerName: 'IP', width: 130 },
    { field: 'guid', headerName: 'Document Guid', width: 300 },
    { field: 'otpnumber', headerName: 'OTP Number', width: 200 },



  ];


  let CustomToolbar = () => {
    return (
      <GridToolbarContainer>
        <GridToolbarQuickFilter />
        <GridToolbarFilterButton />
        {/* <GridToolbarDensitySelector /> */}
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    props.setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };


  return (

    <Box sx={{ height: '100%', minHeight: 0, width: '100%', fontSize: '10px', display: 'flex', flexDirection: 'column' }}>
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
          <p className='text-dark p-2' style={{fontSize:'13px'}}>Fetching activity logs, please wait...</p>
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
              <button
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
                onClick={props.getLogs}
              >
                <FaFilter /> Filter
              </button>

            </div>



          </div>
          <DataGrid
            rows={props.logs}
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
            style={{ fontSize: '12px', flex: 1, minHeight: 0, height: '100%' }}
            className='bg-light '
          />
        </>
      )}

    </Box>

  );
}

export default ActivityLogs;