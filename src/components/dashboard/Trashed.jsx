import React, { useState } from 'react';
const ICON_COLOR = '#2757aa';
import { FaEye, FaInfoCircle, FaTrashRestore, FaTrash } from 'react-icons/fa';
import Box from '@mui/material/Box';
import DocDetailsDialog2 from '../dialogs/DocDetailsDialog2';

import logo from '../../images/ZFBLU.webp';
import * as constants from '../constants/constants';
import axios from 'axios';

import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import HumanizedDate from '../HumanizeDate';

function Trashed(props) {
  const [opendialogdocdetails, setOpenDialogDocDetails] = useState(false);
  const [document, setDocument] = useState({});
  const [documentsigners, setDocumentSigners] = useState([]);

  // Sort the inbox data based on docdate in descending order
  const sortedTrashed = [...props.trashed].sort((a, b) => new Date(b.docdate) - new Date(a.docdate));

  const untrashDocument = async (row) => {
    let data = JSON.stringify({
      "docGuid": `${row.guid}`,
      "signer_uid": `${row.uid}`
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/untrash/document/`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    await axios.request(config)
      .then((response) => {
        props.refreshdata();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const columns = [
    { field: 'title', headerName: 'Title', width: 470, cellClassName: 'overflow-cell' },

    {
      field: 'action2',
      headerName: 'Preview',
      width: 60,
      renderCell: (params) => {
        const handleClick = () => {
          props.previewFile(params.row.guid, params.row.signedcomplete, params.row.declined, params.row.title);
        };

        return (
          <FaEye
            onClick={handleClick}
            size={15}
            color='#2757aa'
          />
        );
      },
      filterable: false,
      sortable: false
    },

    {
      field: 'action3',
      headerName: 'More Details',
      width: 80,
      renderCell: (params) => {
        const handleClick = () => {
          viewDocDetails(params.row, params.row.signers);
        };

        return (
          <FaInfoCircle
            onClick={handleClick}
            size={15}
            color='#2757aa'
          />
        );
      },
      filterable: false,
      sortable: false
    },

    {
      field: 'action4',
      headerName: 'Restore',
      width: 80,
      className: 'text-center',
      renderCell: (params) => {
        const handleClick = () => {
          props.setTrashed(prevTrashed => prevTrashed.filter(item => item.guid !== params.row.guid));
          untrashDocument(params.row);
          props.refreshdata();
          props.setOpenAlert(true);
          props.setAlertMsg("Document trashed successfully");
          props.setAlertSeverity('success');
          setTimeout(() => {
            props.setOpenAlert(false);
          }, 3000);
        };

        return (
          <FaTrashRestore
            onClick={handleClick}
            size={15}
            color='#2757aa'
          />
        );
      },
      filterable: false,
      sortable: false
    },

    {
      field: 'docdate',
      headerName: 'Created',
      width: 140,
      renderCell: (params) => <HumanizedDate dateStr={params.row.docdate} />,
      filterable: false,
      sortable: false,
    },

    { field: 'guid', headerName: 'Guid', width: 300 },
  ];

  const visibleColumns = columns.filter((column) => column.field !== 'owner');

  let CustomToolbar = () => {
    return (
      <GridToolbarContainer>
        <GridToolbarQuickFilter />
        <GridToolbarFilterButton />
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  };

  let viewDocDetails = (document, signers) => {
    setOpenDialogDocDetails(true);
    setDocument(document);
    setDocumentSigners(signers);
  };

  const getRowId = (row) => row.guid;

  return (
    <div>
      <DocDetailsDialog2
        setOpenDialogDocDetails={setOpenDialogDocDetails}
        opendialogdocdetails={opendialogdocdetails}
        document={document}
        documentsigners={documentsigners}
        refreshdata={props.refreshdata}
        type={'upload'}
      />


      <Box sx={{ height: '72vh', width: '100%', fontSize: '12px' }}>
        {/*
        <h6  className='text-dark p-1 mx-3' style={{ fontSize: '12.5px', backgroundColor:'#ecf4fc' }}>
          <FaTrash className='dot text-secondary shadow-lg mx-2' aria-hidden='true' size={13} color='#2757aa' /> Trashed
          <span style={{ fontSize: '13.5px' }}> ( {props.trashed.length} )</span>
        </h6>
        */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ecf4fc', padding: '5px 5px' }}>
          <div className='row '>
            <h6 className='text-dark col-lg-12 col-md-12 col-sm-12 p-1 mx-3' style={{ fontSize: '12.8px' }}>
              <FaTrash className="dot text-secondary shadow-lg mx-2" aria-hidden="true" size={13} color='#2757aa' />
              Trashed <span style={{ fontSize: '13.5px' }}>({props.trashed ? <>{props.trashed.length}</> : <></>})</span>
            </h6>
          </div>
        </div>
        <DataGrid
          rows={sortedTrashed}
          columns={columns}
          density='compact'
          className="App-header5"
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

export default Trashed;
