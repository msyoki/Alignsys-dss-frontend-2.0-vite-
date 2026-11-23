import TableIconButton from './common/TableIconButton';
import mergeActionColumns from './common/mergeActionColumns';
import autoSizeColumns from './common/autoSizeColumns';
import { FaCheckToSlot } from 'react-icons/fa6';
import React , {useState} from 'react';
import Box from '@mui/material/Box';

import { 
  DataGrid, 
  GridToolbarFilterButton,
  GridToolbarExport, 
  GridToolbarQuickFilter,
  GridToolbarContainer, 
} from '@mui/x-data-grid';


function NewCompanies2(props) {
    const[opendialogdocdetails,setOpenDialogDocDetails]=useState(false)
    const[document,setDocument]=useState({})
    const[documentsigners,setDocumentSigners]=useState([])
   
    let approveAccount=(id,email)=>{
        props.setOpenDialogApproveCompany(true)
        props.setCompany4Approval(id)
        props.setCompany4ApprovalEmail(email)
        // alert(`${id} - ${email}`)
    }

     

const columns= [
    { field: 'name', headerName: 'Company Name', width: 200  },

      { field: 'email', headerName: 'Admin Email', width: 250},
  
      { field: 'registered_date', headerName: 'Registered', width: 250 },
      {
        field: 'action2',
        headerName: 'Approve Company',
        width: 200,
        renderCell: (params) => {
          const handleClick = () => {
            approveAccount(
                params.row.id,
                params.row.email,
            )
          
          };
    
          return (
         <TableIconButton title="Approve company" onClick={handleClick} color="#2e7d32"><FaCheckToSlot /></TableIconButton>
            );
        },
        filterable: false
      },
   
  ];
  const visibleColumns = columns.filter((column) => column.field !== 'owner'); 
 

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
  let viewDocDetails=(document,signers)=>{
    setOpenDialogDocDetails(true)
    setDocument(document)
    setDocumentSigners(signers)
}

const getRowId = (row) => row.id;


  return (
  <>
  

  <Box sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%', fontSize: '10px' }}>
          <DataGrid
              rows={props.newcompanies}
              columns={autoSizeColumns(mergeActionColumns(columns), props.newcompanies)}
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
            
              getRowId={getRowId} 
              style={{ fontSize: '12px', flex: 1, minHeight: 0 }}
              className='app-table'
     
      
          />
      </Box>
    
  </>
  );
}

export default NewCompanies2;