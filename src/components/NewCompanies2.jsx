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
         <>
          <i  onClick={handleClick} 
            style={{
              fontSize: '13.5px',
              color:'#403d39',
              borderRadius: '50%', // Making the button rounded
              cursor: 'pointer', // Adding pointer cursor for better UX
              padding: '8px', // Adding padding for better touch target
              backgroundColor: '#f0f0f0', // You can customize the background color
              transition: 'background-color 0.3s ease', // Adding transition for smooth hover effect
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#ffff')} // Change background on hover
            onMouseOut={(e) => (e.target.style.backgroundColor = '#f0f0f0')} // Reset background on mouse out
            className="fa-solid fa-check-to-slot mx-1 text-success"></i> 
           
         </>
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
  

  <Box sx={{ height: 400, width: '100%' ,fontSize:'10px'}}>
          <DataGrid
              rows={props.newcompanies}
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
            
              getRowId={getRowId} 
              style={{ fontSize: '12px' }}
              className='bg-light '
     
      
          />
      </Box>
    
  </>
  );
}

export default NewCompanies2;