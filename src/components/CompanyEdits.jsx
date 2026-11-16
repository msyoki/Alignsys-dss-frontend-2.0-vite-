import React, { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Alert, Box, Button, Dialog, DialogContent, Typography } from '@mui/material';
import { FaImage, FaUpload, FaSave } from 'react-icons/fa';
import BrandLogo from './common/BrandLogo';
import AuthContext from '../context/Authcontext.jsx';
import * as constants from './constants/constants.js';
import { DialogFooter, DialogHeader, PrimaryButton, PropertyRow, SecondaryButton } from './common/dialogKit';
import { PILL_OUTLINE } from './common/pillButton';

const CompanyEdits = ({ opendialogcompanyedits, setOpenDialogCompanyEdits, companylogo, setCompanyLogo }) => {
  const { authTokens, user } = useContext(AuthContext);
  const fileRef = useRef(null);

  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({ open: false, severity: '', message: '' });

  // Start clean each time the dialog opens; free the preview URL.
  useEffect(() => {
    if (opendialogcompanyedits) { setLogoFile(null); setPreview(''); setAlert({ open: false, severity: '', message: '' }); }
  }, [opendialogcompanyedits]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // Close the dialog
  const handleClose = () => setOpenDialogCompanyEdits(false);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setLogoFile(file || null);
    setPreview(file ? URL.createObjectURL(file) : '');
  };

  // Update company logo
  const handleUpdateLogo = async (e) => {
    e.preventDefault();
    if (!logoFile) return;

    const formData = new FormData();
    formData.append('logo', logoFile);
    formData.append('fileName', logoFile.name);

    setBusy(true);
    try {
      const response = await axios.patch(
        `${constants.devApiBaseUrl}/api/company/${user.companyid}`,
        formData,
        { headers: { Authorization: `Bearer ${authTokens.access}` } }
      );

      setCompanyLogo(response.data.logo);
      setAlert({ open: true, severity: 'success', message: 'Logo updated. It shows for everyone from their next sign-in.' });
      setTimeout(() => setAlert((a) => ({ ...a, open: false })), 3000);
    } catch (error) {
      setAlert({ open: true, severity: 'error', message: 'The logo could not be updated. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={opendialogcompanyedits} onClose={busy ? undefined : handleClose} fullWidth maxWidth="sm" aria-labelledby="company-logo-title">
      <DialogHeader id="company-logo-title" icon={<FaImage />} title="Organization logo" subtitle={user?.company} onClose={handleClose} />
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {alert.open && (
          <Alert severity={alert.severity || 'info'} sx={{ mb: 1.5, fontSize: 13 }}>{alert.message}</Alert>
        )}

        <PropertyRow label={preview ? 'New logo' : 'Current logo'} alignTop>
          <Box
            sx={{
              height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
              border: '1px solid #e5e7eb', borderRadius: 1.5, bgcolor: '#fafafa',
            }}
          >
            {preview ? (
              <img src={preview} alt="New organization logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
              <BrandLogo src={companylogo} alt="Organization logo" style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain' }} />
            )}
          </Box>
        </PropertyRow>

        <PropertyRow label="Upload image" alignTop>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={handleFileChange} hidden />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Button onClick={() => fileRef.current?.click()} startIcon={<FaUpload />} sx={PILL_OUTLINE} disabled={busy}>
              Choose image
            </Button>
            <Typography noWrap title={logoFile?.name} sx={{ fontSize: 12.5, color: logoFile ? '#111827' : '#9ca3af', minWidth: 0, maxWidth: 220 }}>
              {logoFile ? logoFile.name : 'No file chosen'}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.75 }}>
            PNG or JPG, at least 1752 × 572 px for a sharp result.
          </Typography>
        </PropertyRow>
      </DialogContent>
      <DialogFooter>
        <SecondaryButton onClick={handleClose} disabled={busy}>Cancel</SecondaryButton>
        <PrimaryButton onClick={handleUpdateLogo} loading={busy} disabled={!logoFile} startIcon={<FaSave />}>
          {busy ? 'Saving…' : 'Save logo'}
        </PrimaryButton>
      </DialogFooter>
    </Dialog>
  );
};

export default CompanyEdits;
