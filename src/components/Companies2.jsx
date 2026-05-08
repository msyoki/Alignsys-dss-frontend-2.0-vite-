import React, { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import { FaPenToSquare } from 'react-icons/fa6';

import {
  DataGrid,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import HumanizedDate from './HumanizeDate.jsx';
import AuthContext from '../context/Authcontext.jsx';
import axios from 'axios';
import * as constants from './constants/constants.js';


function Companies2(props) {
  const [opendialogdocdetails, setOpenDialogDocDetails] = useState(false)
  const [document, setDocument] = useState({})
  const [documentsigners, setDocumentSigners] = useState([])
  let { authTokens } = useContext(AuthContext);
  let ontableclick = async (name, email, id, approved, active, registered_date) => {
    // console.log(name)
    await props.setCurrentEditCompanyName(name)
    await props.setCurrentEditCompanyEmail(email)
    await props.setCurrentEditCompany(id)
    await props.setCurrentEditCompanyActive(`${active}`)
    await props.setCurrentEditCompanyApproved(`${approved}`)
    await props.setCurrentEditCompanyRegisteredDate(registered_date)
    await props.setOpenDialogUpdateCompany(true)

  }

  const [isActive, setIsActive] = React.useState(
    props.companyactive === 'True' || props.companyactive === true
  );

  const handleToggle = (event) => {
    setIsActive(event.target.checked);
  };

  let updateCompany = (e) => {
    e.preventDefault();

    var FormData = require('form-data');
    var data = new FormData();
    data.append('active', isActive);

    var config = {
      method: 'patch',
      url: `${constants.devApiBaseUrl}/api/company/${props.companyid}`,
      headers: { Authorization: `Bearer ${authTokens.access}` },
      data: data,
    };

    axios(config)
      .then(function (response) {
        props.setOpenAlert(true);
        props.setAlertMsg('Updated successfully !!!');
        props.setAlertSeverity('success');
        props.setOpenDialogUpdateCompany(false);
        setTimeout(function () {
          props.setOpenAlert(false);
          props.getCompanies();
          props.getNewCompanies();
          props.setOpenDialogUpdateCompany(false);
          document.getElementById('company-update-form').reset();
        }, 2000);
      })
      .catch(function (error) {
        props.setOpenAlert(true);
        props.setAlertMsg(`${error.response.data['message']}`);
        props.setAlertSeverity('error');
        setTimeout(function () {
          props.setOpenAlert(false);
          props.getCompanies();
          props.getNewCompanies();
          props.setOpenDialogUpdateCompany(false);
        }, 4000);
      });
  };



  const columns = [
    { field: 'name', headerName: 'Company Name', width: 200 },

    { field: 'email', headerName: 'Admin Email', width: 250 },



    { field: 'approved', headerName: 'Approved', width: 100 },
    { field: 'active', headerName: 'Active', width: 50 },
    {
      field: 'action2',
      headerName: 'Edit Company',
      width: 130,
      renderCell: (params) => {
        const handleClick = () => {
          ontableclick(
            params.row.name,
            params.row.email,
            params.row.id,
            params.row.approved,
            params.row.active,
            params.row.registered_date
          )

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
            <FaPenToSquare className="mx-1" />
          </span>
        );
      },
      filterable: false
    },
    {
      field: 'registered_date',
      headerName: 'Registered',
      width: 140,
      renderCell: (params) => <HumanizedDate dateStr={params.row.docdate} />,
      filterable: true,
      sortable: true,
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


  return (
    <>


      <Box sx={{ height: 400, width: '100%', fontSize: '10px' }}>
        <DataGrid
          rows={props.companies}
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
          style={{ fontSize: '12px', fontWeight: "lighter" }}
          getRowId={getRowId}
          className='bg-light '

        />
      </Box>

    </>
  );
}

export default Companies2;