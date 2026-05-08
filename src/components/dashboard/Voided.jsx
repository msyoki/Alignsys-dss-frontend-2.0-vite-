import React, { useState } from 'react';
const ICON_COLOR = '#2757aa';
import { FaEye, FaInfoCircle, FaCircle } from 'react-icons/fa';
import Box from '@mui/material/Box';
import DocDetailsDialog2 from '../dialogs/DocDetailsDialog2';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import logo from '../../images/ZFBLU.webp'

import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import HumanizedDate from '../HumanizeDate';


function Voided(props) {
  const [opendialogdocdetails, setOpenDialogDocDetails] = useState(false)
  const [document, setDocument] = useState({})
  const [documentsigners, setDocumentSigners] = useState([])
  // Sort the inbox data based on docdate in descending order
  const sortedVoided = [...props.voided].sort((a, b) => new Date(b.docdate) - new Date(a.docdate));



  const columns = [
    { field: 'title', headerName: 'Title', width: 500, cellClassName: 'overflow-cell', },


    {
      field: 'action1',
      headerName: 'Preview',
      width: 80,
      renderCell: (params) => {
        const handleClick = () => {
          props.previewFile(params.row.guid, params.row.signedcomplete, params.row.declined, params.row.title)
        };

        return (
          // <ButtonComponent cssClass='e-custom-light' onClick={handleClick} style={{textTransform: 'none',fontWeight:'lighter',fontSize:'10.5px',width:'100%',textAlign:'center'}}   disabled={false}> <i className="fas fa-eye mx-1" ></i> Preview</ButtonComponent>
          <FaEye
            onClick={handleClick}
            size={15}
            color={ICON_COLOR}
          />
        );
      },
      filterable: false,
      sortable: false
    },


    {
      field: 'action2',
      headerName: 'More Details',
      width: 100,
      renderCell: (params) => {
        const handleClick = () => {
          viewDocDetails(params.row, params.row.signers)
          // alert(`ID: ${params.row.signers}`);
        };

        return (
          // <ButtonComponent cssClass='e-custom-primary' onClick={handleClick} style={{textTransform: 'none',fontWeight:'lighter',fontSize:'10.5px',width:'100%',textAlign:'center'}}  disabled={false}> <i class="fas fa-info-circle mx-1"></i> More Details </ButtonComponent> 
          <FaInfoCircle
            onClick={handleClick}
            size={15}
            color={ICON_COLOR}
          />
        );
      },
      filterable: false,
      sortable: false
    },



    // { field: 'docdate', headerName: 'Created', width: 230,filterable: false,sortable: false},
    {
      field: 'docdate',
      headerName: 'Created',
      width: 140,
      renderCell: (params) => <HumanizedDate dateStr={params.row.docdate} />,
      filterable: false,
      sortable: false,
    },


    // { field: 'owner', headerName: 'Owner', width: 200 },

    { field: 'guid', headerName: 'Guid', width: 300 },




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


  return (
    <div >
      <DocDetailsDialog2
        setOpenDialogDocDetails={setOpenDialogDocDetails}
        opendialogdocdetails={opendialogdocdetails}
        document={document}
        documentsigners={documentsigners}
        refreshdata={props.refreshdata}
        type={'voided'}

      />

      <Box sx={{ height: '72vh', width: '100%', fontSize: '12px' }}>
        {/* <h6  className='text-dark p-1 mx-3' style={{ fontSize: '12.5px', backgroundColor:'#ecf4fc' }} >
          <i className='fas dot fa-circle text-secondary shadow-lg  mx-2' aria-hidden="true" style={{ fontSize: '11px' }}> </i> 
          Voided 
          <span style={{ fontSize: '13.5px' }}> ( {props.voided.length} )</span>
        </h6> */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ecf4fc', padding: '5px 5px' }}>
          <div className='row '>
            <h6 className='text-dark col-lg-12 col-md-12 col-sm-12 p-1 mx-3' style={{ fontSize: '12.8px' }}>
              <FaCircle className="dot text-secondary shadow-lg mx-2" aria-hidden="true" size={13} color={ICON_COLOR} />
              Voided <span style={{ fontSize: '13.5px' }}>({props.voided ? <>{props.voided.length}</> : <></>})</span>
            </h6>
          </div>
        </div>

        <DataGrid
          rows={sortedVoided}
          columns={columns}
          density='compact'
          className=" App-header5"
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
          pageSizeOptions={[15, 20, 100]}
          // checkboxSelection
          disableRowSelectionOnClick
          sx={{
            fontSize: "12px",
            fontWeight: "lighter",
            backgroundColor: "#fff",
            borderRadius: "0 !important", // Removes border-radius
          }}
          getRowId={getRowId}

        />
        <div className="d-flex justify-content-end card-footer  mx-3 mt-2 bg-white mb-0">
          <a href="https://alignsys.tech" target="_blank" rel="noopener noreferrer">
            <img src={logo} width="auto" height='30' alt="TechEdge Logo" />
          </a>
        </div>
      </Box>
    </div>
  );
}

export default Voided;