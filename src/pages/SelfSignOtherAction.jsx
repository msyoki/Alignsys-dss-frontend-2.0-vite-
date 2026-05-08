import React, { useEffect, useState, useContext } from 'react';
import { FaEye, FaEnvelopeOpen, FaDownload, FaHome } from 'react-icons/fa';
import Button from '@mui/material/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/Authcontext';

import AddSignersDialog2 from '../components/dialogs/AddSignersDialog2';
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
          {/* dialogs */}
          <PreviewerDialog2
            openpreviewerdialog={openpreviewerdialog}
            setOpenPreviewerDialog={setOpenPreviewerDialog}
            filepreviewurl={`${location.state.docguid}.pdf`}
          />

          <AddSignersDialog2
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

          {/* ---------------- MAIN UI ---------------- */}
          <Box
            sx={{
              minHeight: '100vh',
              backgroundColor: '#1C4690',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
            }}
          >
            <Grid
              container
              spacing={2}
              sx={{
                maxWidth: 1200,
                width: '100%',
              }}
            >
              {/* LEFT PANEL */}
              <Grid item xs={12} md={3}>
                <div
                  style={{
                    background: '#fff',
                    textAlign: 'center',
                    padding: '20px',
                    borderRadius: 10,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    height: '100%',
                  }}
                >
                  {/* Logo */}
                  <div style={{ marginBottom: 15 }}>
                    <a
                      href="https://alignsys.tech"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src={logo} width="180px" alt="Logo" />
                    </a>
                  </div>

                  {/* Title */}
                  <div style={{ color: '#2757aa', fontWeight: 600 }}>
                    Document Title
                  </div>

                  <p style={{ marginTop: 5 }}>{location.state.doctitle}</p>

                  <p style={{ fontSize: 13, color: '#666' }}>
                    Document {voided ? 'voided' : 'signed'} successfully.
                  </p>

                  {/* Preview */}
                  {/* <ActionButton
                    fullWidth
                    variant="contained"
                    color="inherit"
                    onClick={preview}
                    startIcon={<FaEye style={iconStyle} />}
                    sx={{ mt: 2 }}
                  >
                    Preview Document
                  </ActionButton> */}

                  {/* Actions */}
                  <div
                    style={{
                      marginTop: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
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
                  </div>
                </div>
              </Grid>

              {/* RIGHT PANEL - VIEWER */}
              <Grid item xs={12} md={9}>
                <Paper
                  elevation={6}
                  sx={{
                    height: '90vh',
                    // borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <PDFViewerPreviewLoader
                    height="100%"
                    document={`${location.state.docguid}.pdf`}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </>
  );
}

export default SelfSignOtherAction;