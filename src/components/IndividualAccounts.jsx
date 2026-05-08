import React , {useState} from 'react';
import Box from '@mui/material/Box';
import { ButtonComponent  } from '@syncfusion/ej2-react-buttons';

import { 
  DataGrid, 
  GridToolbarFilterButton,
  GridToolbarExport, 
  GridToolbarQuickFilter,
  GridToolbarContainer, 
} from '@mui/x-data-grid';


function IndividualAccounts(props) {
  

const columns= [
    { field: 'first_name', headerName: 'First', width: 150  },

    { field: 'last_name', headerName: 'Last', width: 150},
    { field: 'email', headerName: 'Email', width: 200 },

    { field: 'phone', headerName: 'Phone', width: 200 },
    { field: 'company', headerName: 'Company', width: 200 },
    

    
    
 
  ];


  let  CustomToolbar=()=> {
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

const getRowId = (row) => row.id;


  return (
  <>

        <Box sx={{height:400, width: '100%' ,fontSize:'12px'}}>
            <DataGrid
                rows={props.individualusers}
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
                pageSizeOptions={[5,15,20,100]}
                // checkboxSelection
                disableRowSelectionOnClick
                style={{ fontSize: '12px',fontWeight:"lighter"}}
                getRowId={getRowId} 
                className='bg-light '
       
            />
        </Box>
   
  </>
  );
}

export default IndividualAccounts;