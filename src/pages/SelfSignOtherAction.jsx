import React, { useEffect, useState, useContext } from 'react';
import { FaEye, FaEnvelopeOpen, FaDownload, FaHome } from 'react-icons/fa';
import { Button, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/Authcontext';

import AddSignersDialogMerged from '../components/dialogs/AddSignersDialogMerged';
import PreviewerDialog2 from '../components/dialogs/PreviewerDialog2';
import Loading from '../components/loaders/Loading';
import PDFViewerPreviewLoader from '../components/preview/PDFViewerPreviewLoader';

import logo from '../images/ZFBLU.webp';
import * as constants from '../components/constants/constants';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

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

function SelfSignOtherAction() {
  const { authTokens } = useContext(AuthContext);

  const [fileurl, setFileUrl] = useState('');
  const [voided, setVoided] = useState(false);
  const [loading, setLoading] = useState(false);

  const [workflows, setWorkflows] = useState([]);
  const [organizationWorkflows, setOrganizationWorkflows] = useState([]);

  const [opendialogaddsigners, setOpenDialogAddSigners] = useState(false);
  const [openpreviewerdialog, setOpenPreviewerDialog] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const sendforSigning = () => setOpenDialogAddSigners(true);
  const preview = () => setOpenPreviewerDialog(true);

  const selfSignComplete = () => {
    const g = location.state.fileurl;

    function removeExtension(filename) {
      const x = filename.substring(0, filename.lastIndexOf('.')) || filename;
      const y = x.split('_');
      return y[1];
    }

    const newfilename = removeExtension(g);

    const data = JSON.stringify({ fileGuid: newfilename });

    axios.post(
      `${constants.devApiBaseUrl}/api/selfsign/closesigning/`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.access}`,
        },
      }
    ).catch(() => { });
  };

  const home = () => {
    navigate('/', {
      state: {
        openalert: true,
        alertmsg: voided
          ? 'Document voided successfully'
          : 'Document signed successfully',
        alertseverity: 'success',
      },
    });
  };

  const getWorkflows = async () => {
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
  };

  useEffect(() => {
    getWorkflows();
    setFileUrl(location.state.fileurl);
    setVoided(location.state.voided);

    if (!location.state.voided) {
      selfSignComplete();
    }
  }, []);

  const ActionButton = ({ children, ...props }) => (
    <Button sx={pillBtn} {...props}>
      {children}
    </Button>
  );

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <AddSignersDialogMerged
            getWorkflows={getWorkflows}
            workflows={workflows}
            setOrganizationWorkflows={setOrganizationWorkflows}
            organizationWorkflows={organizationWorkflows}
            opendialogaddsigners={opendialogaddsigners}
            setOpenDialogAddSigners={setOpenDialogAddSigners}
            file={location.state.docguid}
            loading={loading}
            setLoading={setLoading}
            docTitle={location.state.doctitle}
          />

          {/* dialogs */}
          <PreviewerDialog2
            openpreviewerdialog={openpreviewerdialog}
            setOpenPreviewerDialog={setOpenPreviewerDialog}
            filepreviewurl={`${location.state.docguid}.pdf`}
          />

          {/* ---------------- MAIN UI ---------------- */}
          {opendialogaddsigners?<></>:
          <Box
            sx={{
              minHeight: "100vh",
              bgcolor: "#1C4690",
              py: { xs: 2, md: 3 },
              px: { xs: 1.5, md: 3 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
                maxWidth: 1600,
                mx: "auto",
              }}
            >
              {/* LEFT PANEL */}
              <Paper
                elevation={3}
                sx={{
                  width: { xs: "100%", md: "25%" },
                  height: { xs: "auto", md: "90vh" },
                  display: "flex",
                  flexDirection: "column",
                  p: 3,
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                {/* Logo */}
                <Box sx={{ mb: 2 }}>
                  <a href="https://alignsys.tech" target="_blank" rel="noopener noreferrer">
                    <Box
                      component="img"
                      src={logo}
                      alt="Logo"
                      sx={{ width: 180, maxWidth: "100%", height: "auto" }}
                    />
                  </a>
                </Box>

                <Typography variant="subtitle1" fontWeight={600} color="primary">
                  Document Title
                </Typography>

                <Typography variant="body2" sx={{ mt: 1, wordBreak: "break-word" }}>
                  {location.state.doctitle}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Document {voided ? "voided" : "signed"} successfully.
                </Typography>

                <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1.25 }}>
                  {voided ? (
                    <ActionButton
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        window.open(
                          `${constants.devApi2BaseUrl}/api/Doc/FileDownload/${location.state.docguid}`
                        )
                      }
                      startIcon={<FaEnvelopeOpen style={iconStyle} />}
                    >
                      Download Voided Document
                    </ActionButton>
                  ) : (
                    <>
                      <ActionButton
                        variant="contained"
                        color="primary"
                        onClick={sendforSigning}
                        startIcon={<FaEnvelopeOpen style={iconStyle} />}
                      >
                        Send to Others to Sign
                      </ActionButton>

                      <ActionButton
                        variant="contained"
                        color="success"
                        onClick={() =>
                          window.open(
                            `${constants.devApi2BaseUrl}/api/Doc/FileDownload/${location.state.docguid}`
                          )
                        }
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

                <Box sx={{ flexGrow: 1 }} />
              </Paper>

              {/* RIGHT PANEL */}
              <Paper
                elevation={3}
                sx={{
                  width: { xs: "100%", md: "75%" },
                  height: { xs: "75vh", md: "90vh" },
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <PDFViewerPreviewLoader height="100%" document={`${location.state.docguid}.pdf`} />
              </Paper>
            </Box>
          </Box>
          }
        </>
      )}
    </>
  );
}

export default SelfSignOtherAction;