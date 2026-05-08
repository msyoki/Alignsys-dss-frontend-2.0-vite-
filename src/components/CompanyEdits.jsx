import React, { useContext, useState } from 'react';
import axios from 'axios';
import AuthContext from '../context/Authcontext.jsx';
import * as constants from './constants/constants.js';

import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { FaTimes, FaSave } from 'react-icons/fa';

const CompanyEdits = ({ opendialogcompanyedits, setOpenDialogCompanyEdits, companylogo, setCompanyLogo }) => {
  const { authTokens, user } = useContext(AuthContext);

  const [logoFile, setLogoFile] = useState(null);
  const [alert, setAlert] = useState({ open: false, severity: '', message: '' });

  // Close the dialog
  const handleClose = () => setOpenDialogCompanyEdits(false);

  // Handle file selection
  const handleFileChange = (event) => {
    setLogoFile(event.target.files[0]);
  };

  // Update company logo
  const handleUpdateLogo = async (e) => {
    e.preventDefault();
    if (!logoFile) return;

    const formData = new FormData();
    formData.append('logo', logoFile);
    formData.append('fileName', logoFile.name);

    try {
      const response = await axios.patch(
        `${constants.devApiBaseUrl}/api/company/${user.companyid}`,
        formData,
        { headers: { Authorization: `Bearer ${authTokens.access}` } }
      );

      setCompanyLogo(response.data.logo);
      setAlert({ open: true, severity: 'success', message: 'Profile updated, effective on next login' });

      setTimeout(() => setAlert({ ...alert, open: false }), 2000);
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: 'Failed to update logo' });
    }
  };

  return (
    <Dialog open={opendialogcompanyedits} onClose={handleClose} aria-describedby="alert-dialog-slide-description">
      <Card>
        <div className="card-content-wrapper p-4 text-center">
          {/* Organization Logo */}
          {/* <CardMedia component="img" alt="Organization Logo" image={companylogo} sx={{ maxWidth: '50%', margin: 'auto' }} /> */}
          <div className="bg-white shadow-lg d-flex justify-content-center align-items-center p-3">
            <div className="d-flex flex-column align-items-center">
              <img
                src={companylogo}
                alt="Organization logo"

                style={{
                  width: "150px",  // Default width
                  maxWidth: "200px", // Ensures it does not exceed 130px
                  height: "auto", // Maintain aspect ratio
                  objectFit: "contain"
                }}
              />
              
            </div>
          </div>
          <CardContent>
            <Typography variant="body2" color="text.primary" className="p-3">
              Upload Organization Logo
              <div className="form-group mb-2 p-3">
                <input type="file" className="form-control form-control-sm" accept="image/png,image/jpeg" onChange={handleFileChange} />
              </div>
              <small>Recommended dimensions: (min 1752 x 572) | File Type: PNG/JPG</small>
            </Typography>

            {/* Buttons */}
            <div className="button-section">
              <Button
                variant="outlined"
                color="inherit"
                className="m-2 p-2"
                style={{ textTransform: 'none', fontWeight: '400', fontSize: '13px', borderRadius: 8, minWidth: 120 }}
                onClick={handleClose}
                startIcon={<FaTimes className="mx-1" />}
              >
                <span className="mx-2">Cancel</span>
              </Button>
              <Button
                variant="contained"
                color="primary"
                className="m-2 p-2"
                style={{ textTransform: 'none', fontWeight: '400', fontSize: '13px', borderRadius: 8, minWidth: 120 }}
                onClick={handleUpdateLogo}
                startIcon={<FaSave className="mx-1" />}
              >
                <span className="mx-2">Save Update</span>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </Dialog>
  );
};

export default CompanyEdits;
