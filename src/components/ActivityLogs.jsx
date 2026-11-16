import * as React from 'react';
import autoSizeColumns from './common/autoSizeColumns';
import DateRangeFilter from './common/DateRangeFilter';
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
          <DateRangeFilter filters={props.filters} onChange={handleFilterChange} onApply={props.getLogs} />
          <DataGrid
            rows={props.logs}
            columns={autoSizeColumns(columns, props.logs)}
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
            className='app-table'
          />
        </>
      )}

    </Box>

  );
}

export default ActivityLogs;