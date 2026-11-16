import * as React from 'react';
import { FaCheckCircle, FaEnvelopeOpenText, FaEnvelope, FaComments, FaEye } from 'react-icons/fa';
import { DialogHeader } from '../common/dialogKit';
import alignsysLogo from '../../images/ZFBLU.webp';
import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Slide from '@mui/material/Slide';

import axios from 'axios'
import CommentsDialog from './CommentsDialog';
import * as constants from '../constants/constants'
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import HumanizedDate from '../HumanizeDate';
import PDFViewerPreviewLoader from '../preview/PDFViewerPreviewLoader';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { PILL } from '../common/pillButton';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function PreviewerDialog(props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  let [opendialogcomments, setOpenDialogComments] = useState(false)
  const [text, setText] = useState('');
  const [value, setValue] = useState(0);
  const [mainDoc, setMainDoc] = useState('');
  const [reportDocument, setReportDocument] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  let mainDocName = `${props.filepreviewurl}.pdf`
  let ReportDocName = `${props.filepreviewurl}_Report.pdf`

  const logostyle = {
    width: isMobile ? "100px" : "150px",
    backgroundColor: 'white'
  }

  let handleComments = () => {
    setOpenDialogComments(true)
  }

  const handleClose = () => {
    props.setOpenPreviewerDialog(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  let addComment = (comment, signer) => {
    let data = JSON.stringify({
      "signer": `${signer}`,
      "comment": `${comment}`
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/new/comments/`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    axios.request(config)
      .then((response) => {
        setText('')
        props.getComments(props.ccdocguid, props.ccdoctitle)
      })
      .catch((error) => {
        console.log(error);
      });
  }

  

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div>
      <CommentsDialog setText={setText} text={text} addComment={addComment} signerguid={props.signeruid} comments={props.comments} opendialogcomments={opendialogcomments} setOpenDialogComments={setOpenDialogComments} />

      <Dialog
        fullScreen
        open={props.openpreviewerdialog}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <DialogContent sx={{ backgroundColor: '#fff', p: 0 }}>
          <DialogContent sx={{ backgroundColor: '#fff', p: 0 }}>
            <DialogContentText
              id="alert-dialog-description"
              sx={{ m: 0, p: 0 }}
            >
              <div
                className="container-fluid p-0 m-0 "
                style={{ maxHeight: '100%', overflowY: 'hidden' }} // enable full scroll
              >
                <div className="row g-0">
                  {/* Main Content */}
                  <div
                    className='col-md-9 col-12 bg-white px-2 order-lg-1 order-sm-1'
                    style={{

                      order: 1, // Document first; on small screens the details panel follows below it
                    }}
                  >
                    {/* Close is always reachable here (on phones the details panel, with its
                        own Close Preview button, sits below the document). */}
                    <Box sx={{ mx: -1, mb: 1 }}>
                      <DialogHeader icon={<FaEye />} title="Preview" subtitle={props.filepreviewtitle} onClose={handleClose} closeLabel="Close preview" />
                    </Box>
                    {props.previewComplete ? (
                      <Box sx={{ width: '100%' }}>
                        <Tabs
                          value={value}
                          onChange={handleChange}
                          aria-label="basic tabs"
                          variant={isMobile ? "fullWidth" : "standard"}
                          TabIndicatorProps={{ sx: { height: 2 } }}
                          sx={{ minHeight: '40px' }}
                         
                        >
                          <Tab label="Signed Document" {...a11yProps(0)} sx={{ minHeight: '40px', py: 0.5, px: 1, textTransform: 'none' }} />
                          <Tab label="Summary Report" {...a11yProps(1)} sx={{ minHeight: '40px', py: 0.5, px: 1, textTransform: 'none' }} />
                        </Tabs>

                        <CustomTabPanel value={value} index={0}>
                          <PDFViewerPreviewLoader
                            title={props.filepreviewtitle}
                            complete={props.previewComplete}
                            height={isMobile ? '70vh' : '85vh'}
                            document={mainDocName}
                            handleClose={handleClose}
                          />
                        </CustomTabPanel>

                        <CustomTabPanel value={value} index={1}>
                          <PDFViewerPreviewLoader
                            title={`summary_${props.filepreviewtitle}`}
                            complete={props.previewComplete}
                            height={isMobile ? '70vh' : '85vh'}
                            document={ReportDocName}
                            handleClose={handleClose}
                          />
                        </CustomTabPanel>
                      </Box>
                    ) : (
                      <PDFViewerPreviewLoader
                        title={props.filepreviewtitle}
                        complete={props.previewComplete}
                        height="90vh"
                        document={`${props.filepreviewurl}.pdf`}
                        handleClose={handleClose}
                      />
                    )}
                  </div>

                  {/* Sidebar */}
                  <div
                    className={`col-md-3 col-12 px-3 text-center order-lg-2 order-sm-2 shadow-lg`}
                    style={{
                      order: 2, // Details always after the document (beside it on desktop, below it on small screens)
                      backgroundColor: '#fff',
                      paddingTop: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: isMobile ? 'auto' : '100dvh',
                    }}
                  >
                    {/* Sidebar Header */}
                    <div
                      className="my-3 p-2 text-white"
                      style={{
                        fontSize: isMobile ? '10px' : '12px',
                        backgroundColor: '#2757aa',
                        width: '100%',
                        overflow:'hidden'
                      }}
                    >
                      Document Preview
                    </div>

                    {/* Sidebar Content */}
                    <div className="d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
                      <ul className="list-unstyled m-0 p-0 flex-grow-1" style={{ overflowY: 'auto' }}>
                        <li className="mb-2" style={{ fontSize: '12px', fontWeight: 450, color: '#1C4690' }}>
                          Title
                        </li>
                        <li className="my-2" style={{ fontSize: '12px', fontWeight: 440 }}>
                          {props.filepreviewtitle}
                        </li>
                        <li className="my-2" style={{ fontSize: '12px', color: '#1C4690' }}>
                          Owner: <span style={{ color: '#595959' }}>{props.docowner}</span>
                        </li>
                        <li className="my-2" style={{ fontSize: '12px', color: '#1C4690' }}>
                          Created:{' '}
                          <span style={{ color: '#595959' }}>
                            <HumanizedDate dateStr={props.doccreated} />
                          </span>
                        </li>
                        <li className="my-2" style={{ fontSize: '12px', color: '#1C4690' }}>
                          Signers ({props.signers.length}):
                        </li>

                        {props.signers.length > 0 && (
                          <div
                            className="border rounded p-2"
                            style={{ maxHeight: '20vh', overflowY: 'auto', backgroundColor: '#ecf4fc' }}
                          >
                            {props.signers.map((s, index) => (
                              <div
                                key={index}
                                className={`d-flex justify-content-between align-items-center ${props.signers.length > 1 && index !== props.signers.length - 1
                                  ? 'border-bottom'
                                  : ''
                                  }`}
                                style={{ fontSize: '12px', padding: '5px 0' }}
                              >
                                <span>{s.email}</span>
                                <span className="text-muted">
                                  {s.signed === 'True' ? (
                                    <>
                                      Signed <FaCheckCircle className="text-success mx-1" />
                                    </>
                                  ) : (
                                    <>
                                      {s.current_signer === 'True' ? 'Signing' : 'Queued'}
                                      {s.current_signer === 'True' ? (
                                        <FaEnvelopeOpenText className="text-danger mx-1" />
                                      ) : (
                                        <FaEnvelope className="text-warning mx-1" />
                                      )}
                                    </>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </ul>
                    </div>

                    {/* Footer: Comments + Alignsys logo, at the bottom of the panel (as on the signing page) */}
                    <div className="d-flex flex-column align-items-center gap-3 pt-3 pb-4" style={{ marginTop: 'auto' }}>
                      <Button
                        variant="contained"
                        color='primary'
                        startIcon={<FaComments />}
                        onClick={handleComments}
                        sx={PILL}
                      >
                        Comments ({props.comments.length})
                      </Button>
                      <a href="https://alignsys.tech" target="_blank" rel="noopener noreferrer">
                        <img src={alignsysLogo} alt="Alignsys" style={{ height: 32, width: 'auto', maxWidth: 140, objectFit: 'contain', display: 'inline-block' }} />
                      </a>
                    </div>


                  </div>

                </div>
              </div>

            </DialogContentText>
          </DialogContent>

        </DialogContent>

      </Dialog>
    </div >
  );
}

export default PreviewerDialog