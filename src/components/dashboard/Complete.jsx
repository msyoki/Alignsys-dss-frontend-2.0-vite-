import React, { useState } from 'react';
const ICON_COLOR = '#2757aa';
import { FaDownload, FaEye, FaInfoCircle, FaCircle } from 'react-icons/fa';
import Box from '@mui/material/Box';
import DocDetailsDialog2 from '../dialogs/DocDetailsDialog2';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
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
import CircularProgress from '@mui/material/CircularProgress';
import { FaFilter } from 'react-icons/fa';
import { Button } from '@mui/material';

function Complete(props) {
  const [opendialogdocdetails, setOpenDialogDocDetails] = useState(false);
  const [document, setDocument] = useState({});
  const [documentsigners, setDocumentSigners] = useState([]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    props.setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleDownload = async (document) => {
    alert(`${constants.devApiBaseUrl}/api/base64/${document.guid}.pdf/`)
    alert(`${document.title}.pdf`)
    try {
      const response = await axios.get(`${constants.devApiBaseUrl}/api/base64/${document.guid}.pdf/`);
      let bas64 = response.data.base64_uri;

      if (typeof window !== 'undefined') {
        const link = window.document.createElement('a');
        link.href = bas64;
        link.download = `${document.title}.pdf`;
        link.click();
      } else {
        console.error('No valid base64 URI found in the response');
      }
    } catch (error) {
      console.error('Download failed', error);
      alert('An error occurred while downloading the document. Please try again.');
    }
  };



  const sortedComplete = [...props.complete].sort((a, b) => new Date(b.docdate) - new Date(a.docdate));

  const columns = [
    { field: 'title', headerName: 'Title', width: 600, cellClassName: 'overflow-cell' },
    {
      field: 'action',
      headerName: 'Download',
      width: 80,
      renderCell: (params) => {
        const handleClick = () => {
          handleDownload(params.row);
        };
        return (
          <FaDownload
            onClick={handleClick}
            size={15}
            color={ICON_COLOR}
          />
        );
      },
      filterable: false,
    },
    {
      field: 'action1',
      headerName: 'Preview',
      width: 80,
      renderCell: (params) => {
        const handleClick = () => {
          props.previewFile(params.row.guid, params.row.signedcomplete, params.row.declined, params.row.title, 'False');
        };

        return (
          <FaEye
            onClick={handleClick}
            size={15}
            color={ICON_COLOR}
          />
        );
      },
      filterable: false,
    },
    {
      field: 'action2',
      headerName: 'More Details',
      width: 100,
      className: 'text-center',
      renderCell: (params) => {
        const handleClick = () => {

          viewDocDetails(params.row, params.row.signers);
        };

        return (
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
    {
      field: 'docdate',
      headerName: 'Created',
      width: 180,
      renderCell: (params) => <HumanizedDate dateStr={params.row.docdate} />,
      filterable: true,
      sortable: true,
    },
    { field: 'guid', headerName: 'Guid', width: 300 },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarQuickFilter />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const viewDocDetails = (document, signers) => {
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
        type={'complete'}
      />



      <Box sx={{ height: '60vh', width: '100%', fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ecf4fc', padding: '5px 5px' }}>
          <div className='row '>
            <h6 className='text-dark col-lg-12 col-md-12 col-sm-12 p-1 mx-3' style={{ fontSize: '12.8px' }}>
              <FaCircle className="dot text-success shadow-lg mx-2" aria-hidden="true" size={13} color={ICON_COLOR} />
              Completed <span style={{ fontSize: '13.5px' }}>({props.complete ? <>{props.complete.length}</> : <></>})</span>
            </h6>
            {/* <div className='col-lg-9 col-md-9 col-sm-12 p-2' style={{ display: 'flex', gap: '16px' }}>
              <div className='input-group'>
                <label className='mx-1'>Start Date:</label>
                <input
                  type="date"
                  name="start_date"
                  value={props.filters.start_date}
                  onChange={handleFilterChange}
                  className="form-control form-control-sm"
                />

                <label className='mx-2'>End Date:</label>
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
                  onClick={() => props.getComplete(props.filters.start_date, props.filters.end_date)}
                >
                  <i className="fa-solid fa-filter"></i> Filter
                </button>

              </div>



            </div> */}
          </div>
        </div>

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
            <p className='text-dark p-2'>Fetching complete items, please wait...</p>
          </div>
        ) : (
          <>
   

              <div className="col-12 px-3 py-2">
              <div
                className="d-flex flex-column flex-md-row align-items-md-end gap-2 flex-wrap"
              >
                {/* Start Date */}
                <div
                  className="d-flex flex-column"
                  style={{ minWidth: '160px', flex: 1 }}
                >
                  <label
                    className="mb-1 text-dark fw-medium"
                    style={{ fontSize: '12px', lineHeight: 1.1 }}
                  >
                    Start Date
                  </label>

                  <input
                    type="date"
                    name="start_date"
                    value={props.filters.start_date}
                    onChange={handleFilterChange}
                    className="form-control form-control-sm"
                    style={{
                      minHeight: '32px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      fontSize: '12px',
                    }}
                  />
                </div>

                {/* End Date */}
                <div
                  className="d-flex flex-column"
                  style={{ minWidth: '160px', flex: 1 }}
                >
                  <label
                    className="mb-1 text-dark fw-medium"
                    style={{ fontSize: '12px', lineHeight: 1.1 }}
                  >
                    End Date
                  </label>

                  <input
                    type="date"
                    name="end_date"
                    value={props.filters.end_date}
                    onChange={handleFilterChange}
                    className="form-control form-control-sm"
                    style={{
                      minHeight: '32px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      fontSize: '12px',
                    }}
                  />
                </div>

                {/* Filter Button */}
                <div className="d-flex align-items-end">
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<FaFilter size={12} />}
                    sx={{
                      textTransform: 'none',
                      fontSize: '11px',
                      fontWeight: 500,
                      borderRadius: '999px',
                      px: 1.8,
                      py: 0.5,
                      minHeight: 32,
                      boxShadow: 'none',
                      whiteSpace: 'nowrap',
                    }}
                     onClick={() => props.getComplete(props.filters.start_date, props.filters.end_date)}
                  >
                    Filter
                  </Button>
                </div>
              </div>
            </div>
            <DataGrid
              rows={sortedComplete}
              columns={columns}
              density="compact"
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
              style={{ fontSize: '12px', fontWeight: 'lighter', backgroundColor: '#fff' }}
              getRowId={getRowId}
            />
          </>
        )}

        <div className="d-flex justify-content-end card-footer  mx-3 mt-2 bg-white mb-0">
          <a href="https://alignsys.tech" target="_blank" rel="noopener noreferrer">
            <img src={logo} width="auto" height='30' alt="TechEdge Logo" />
          </a>
        </div>
      </Box>
    </div>
  );
}

export default Complete;
