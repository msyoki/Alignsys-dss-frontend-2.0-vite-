import React, { useEffect, useState, useContext, useCallback } from 'react';
import { FaEnvelopeOpen, FaDownload, FaHome, FaCheckCircle } from 'react-icons/fa';
import { Button, Typography, Box, Paper, Alert, AlertTitle } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/Authcontext';

import AddSignersDialogMerged from '../components/dialogs/AddSignersDialogMerged';
import PreviewerDialog2 from '../components/dialogs/PreviewerDialog2';
import Loading from '../components/loaders/Loading';
import PDFViewerPreviewLoader from '../components/preview/PDFViewerPreviewLoader';

import logo from '../images/ZFBLU.webp';
import * as constants from '../components/constants/constants';

/* ---------------- PILL BUTTON STYLE ---------------- */
const pillBtn = {
  textTransform: 'none',
  fontSize: '13px',
  fontWeight: 500,
  borderRadius: '999px',
  px: 2,
  py: 0.8,
  minHeight: 36,
  boxShadow: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

/* icon consistency */
const iconStyle = { fontSize: '13px', flexShrink: 0 };

/* Defined outside the component so it isn't recreated/remounted on every render */
const ActionButton = ({ children, ...props }) => (
  <Button sx={pillBtn} {...props}>
    {children}
  </Button>
);

/* "prefix_guid.ext" -> "guid" */
const getFileGuid = (filename = '') => {
  const base = filename.substring(0, filename.lastIndexOf('.')) || filename;
  return base.split('_')[1];
};

function SelfSignOtherAction() {
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const { docguid, doctitle, fileurl, voided = false } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [organizationWorkflows, setOrganizationWorkflows] = useState([]);
  const [opendialogaddsigners, setOpenDialogAddSigners] = useState(false);
  const [openpreviewerdialog, setOpenPreviewerDialog] = useState(false);

  const pdfPath = `${docguid}.pdf`;
  const download = () =>
    window.open(`${constants.devApi2BaseUrl}/api/Doc/FileDownload/${docguid}`);

  const handleSendSuccess = () => {
    if (location.pathname === '/selfsign/otheractions') {
      navigate('/', {
        state: {
          openalert: true,
          alertmsg: 'Document sent for signing successfully',
          alertseverity: 'success',
        },
      });
    }
  };

  const home = () => {
    navigate('/', {
      state: {
        openalert: true,
        alertmsg: voided ? 'Document voided successfully' : 'Document signed successfully',
        alertseverity: 'success',
      },
    });
  };

  const getWorkflows = useCallback(async () => {
    const headers = { Authorization: `Bearer ${authTokens.access}` };
    try {
      const [w, ow] = await Promise.all([
        axios.get(`${constants.devApiBaseUrl}/api/workflows/`, { headers }),
        axios.get(`${constants.devApiBaseUrl}/api/organization/workflows/`, { headers }),
      ]);
      setWorkflows(w.data);
      setOrganizationWorkflows(ow.data);
    } catch (err) {
      console.error(err);
    }
  }, [authTokens.access]);

  useEffect(() => {
    getWorkflows();

    if (!voided && fileurl) {
      axios
        .post(
          `${constants.devApiBaseUrl}/api/selfsign/closesigning/`,
          { fileGuid: getFileGuid(fileurl) },
          { headers: { Authorization: `Bearer ${authTokens.access}` } }
        )
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      <AddSignersDialogMerged
        getWorkflows={getWorkflows}
        workflows={workflows}
        setOrganizationWorkflows={setOrganizationWorkflows}
        organizationWorkflows={organizationWorkflows}
        opendialogaddsigners={opendialogaddsigners}
        setOpenDialogAddSigners={setOpenDialogAddSigners}
        file={docguid}
        loading={loading}
        setLoading={setLoading}
        docTitle={doctitle}
        onSuccess={handleSendSuccess}
      />

      <PreviewerDialog2
        openpreviewerdialog={openpreviewerdialog}
        setOpenPreviewerDialog={setOpenPreviewerDialog}
        filepreviewurl={pdfPath}
      />

      {/* ---------------- MAIN UI ---------------- */}
      {!opendialogaddsigners && (
        <Box sx={{ minHeight: '100vh', bgcolor: '#1C4690' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              maxWidth: 1600,
              mx: 'auto',
              height: { md: '100vh' },
            }}
          >
            {/* LEFT PANEL - VIEWER */}
            <Paper
              elevation={3}
              square
              sx={{
                flex: { md: 1 },
                minWidth: 0,
                minHeight: { xs: '60vh', md: 0 },
                overflow: 'hidden',
              }}
            >
              <PDFViewerPreviewLoader height="100%" document={pdfPath} />
            </Paper>

            {/* RIGHT PANEL - BUTTONS */}
            <Paper
              elevation={3}
              square
              sx={{
                width: { md: '25%' },
                minWidth: { md: 300 },
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                p: 3,
                textAlign: 'center',
                overflowY: 'auto',
              }}
            >
              {/* Logo */}
              <Box sx={{ mb: 2 }}>
                <a href="https://alignsys.tech" target="_blank" rel="noopener noreferrer">
                  <Box
                    component="img"
                    src={logo}
                    alt="Logo"
                    sx={{ width: 180, maxWidth: '100%', height: 'auto' }}
                  />
                </a>
              </Box>

              <Typography variant="subtitle1" fontWeight={600} color="primary">
                Document Title
              </Typography>

              <Typography variant="body2" sx={{ mt: 1, wordBreak: 'break-word' }}>
                {doctitle}
              </Typography>

              {voided ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Document voided successfully.
                </Typography>
              ) : (
                <Alert
                  severity="success"
                  icon={<FaCheckCircle style={{ fontSize: '18px' }} />}
                  sx={{
                    mt: 2,
                    borderRadius: '12px',
                    alignItems: 'center',
                    textAlign: 'left',
                  }}
                >
                  <AlertTitle sx={{ mb: 0.25, fontSize: '14px', fontWeight: 600 }}>
                    Signed successfully
                  </AlertTitle>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    You've self-signed this document. Download it or send it to others to sign.
                  </Typography>
                </Alert>
              )}

              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {voided ? (
                  <ActionButton
                    variant="contained"
                    color="primary"
                    onClick={download}
                    startIcon={<FaEnvelopeOpen style={iconStyle} />}
                  >
                    Download Voided Document
                  </ActionButton>
                ) : (
                  <>
                    <ActionButton
                      variant="contained"
                      color="primary"
                      onClick={() => setOpenDialogAddSigners(true)}
                      startIcon={<FaEnvelopeOpen style={iconStyle} />}
                    >
                      Send to Others to Sign
                    </ActionButton>

                    <ActionButton
                      variant="contained"
                      color="success"
                      onClick={download}
                      startIcon={<FaDownload style={iconStyle} />}
                    >
                      Download Signed Document
                    </ActionButton>
                  </>
                )}

                <ActionButton
                  variant="outlined"
                  color="warning"
                  onClick={home}
                  startIcon={<FaHome style={iconStyle} />}
                >
                  Go Back Home
                </ActionButton>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}
    </>
  );
}

export default SelfSignOtherAction;