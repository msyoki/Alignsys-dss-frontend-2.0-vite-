import React, { useState, useContext } from 'react';
const ICON_COLOR = '#2757aa';
import { FaEye, FaInfoCircle, FaCircle } from 'react-icons/fa';
import { FaPenNib, FaTrash, FaFilter } from 'react-icons/fa';
import Box from '@mui/material/Box';
import DocDetailsDialog2 from '../dialogs/DocDetailsDialog2';
import logo from '../../images/ZFBLU.webp';
import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import DocExpiryDate from '../GetExpiryDate';
import HumanizedDate from '../HumanizeDate';
import CircularProgress from '@mui/material/CircularProgress';
import TimedAlert from '../TimedAlert';
import { Button } from '@mui/material';


function Outbox(props) {
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


  // Sort the outbox data based on docdate in descending order
  const sortedOutbox = [...props.outbox].sort((a, b) => new Date(b.docdate) - new Date(a.docdate));

  const columns = [
    { field: 'title', headerName: 'Title', width: 500, cellClassName: 'overflow-cell' },
    {
      field: 'action1',
      headerName: 'Preview',
      width: 80,
      renderCell: (params) => {
        const handleClick = () => {
          // console.log(params.row)
          props.previewFile(params.row.guid, params.row.signedcomplete, params.row.declined, params.row.title);
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
      sortable: false,
    },
    {
      field: 'action2',
      headerName: 'More Details',
      width: 100,
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
      sortable: false,
    },
    {
      field: 'docdate',
      headerName: 'Created',
      width: 140,
      renderCell: (params) => <HumanizedDate dateStr={params.row.docdate} />,
      filterable: false,
      sortable: false,
    },
    {
      field: 'expirydate',
      headerName: 'Days to expiry',
      width: 120,
      renderCell: (params) => <DocExpiryDate expirydate={params.row.expirydate} />,
      filterable: false,
      sortable: false,
    },
    { field: 'guid', headerName: 'Guid', width: 300 },
  ];

  const visibleColumns = columns.filter((column) => column.field !== 'owner');

  const CustomToolbar = () => {
    return (
      <GridToolbarContainer>
        <GridToolbarQuickFilter />
        <GridToolbarFilterButton />
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  };

  const viewDocDetails = (document, signers) => {
    setOpenDialogDocDetails(true);
    setDocument(document);
    setDocumentSigners(signers);
  };

  const getRowId = (row) => row.guid;

  return (
    <div>
      <TimedAlert
        open={props.openAlert}
        onClose={() => props.setOpenAlert(false)}
        severity={props.alertSeverity}
        message={props.alertMsg}
        setSeverity={props.setAlertSeverity}
        setMessage={props.setAlertMsg}
      />
      <DocDetailsDialog2
        setOpenDialogDocDetails={setOpenDialogDocDetails}
        opendialogdocdetails={opendialogdocdetails}
        document={document}
        documentsigners={documentsigners}
        refreshdata={props.refreshdata}
        getSignerUid={props.getSignerUid}
        type={'outbox'}
        setAlertMsg={props.setAlertMsg}
        setAlertSeverity={props.setAlertSeverity}
        setOpenAlert={props.setOpenAlert}
      />

      <Box sx={{ height: '60vh', width: '100%', fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ecf4fc', padding: '5px 5px' }}>
          <div className='row '>
            <h6 className='text-dark col-lg-12 col-md-12 col-sm-12 p-1 mx-3' style={{ fontSize: '12.8px' }}>
              <FaCircle className="dot text-warning shadow-lg mx-2" aria-hidden="true" size={13} color={ICON_COLOR} />
              Outbox <span style={{ fontSize: '13.5px' }}>({props.outbox ? <>{props.outbox.length}</> : <></>})</span>
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
                  onClick={() => props.getOutbox(props.filters.start_date, props.filters.end_date)}
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
            <p className='text-dark p-2'>Fetching outbox items, please wait...</p>
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
        onClick={() =>
          props.getOutbox(
            props.filters.start_date,
            props.filters.end_date
          )
        }
      >
        Filter
      </Button>
    </div>
  </div>
</div>
            <DataGrid
              rows={sortedOutbox}
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

export default Outbox;
