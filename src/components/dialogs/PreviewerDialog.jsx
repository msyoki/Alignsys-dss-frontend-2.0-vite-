import * as React from 'react';
import { FaCheckCircle, FaEnvelopeOpenText, FaEnvelope, FaComments, FaEye, FaShieldAlt, FaMobileAlt, FaBan, FaTimes } from 'react-icons/fa';
import DocumentDetailsPanel from '../common/DocumentDetailsPanel';
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

  // Same structure as "Place signature boxes": blue top bar, the document on the left
  // (shared viewer toolbar, original backgrounds), details on the right.
  return (
    <div>
      <CommentsDialog setText={setText} text={text} addComment={addComment} signerguid={props.signeruid} canComment={!!props.signeruid} comments={props.comments} opendialogcomments={opendialogcomments} setOpenDialogComments={setOpenDialogComments} />

      <Dialog
        fullScreen
        open={props.openpreviewerdialog}
        onClose={handleClose}
        TransitionComponent={Transition}
        aria-labelledby="previewer-title"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

          {/* Top bar */}
          <Box sx={{ height: 52, flexShrink: 0, bgcolor: '#2757aa', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.25, pl: 2.25, pr: 1.5 }}>
            <FaEye size={15} aria-hidden />
            <Typography id="previewer-title" component="h2" sx={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>Preview</Typography>
            {props.filepreviewtitle && (
              <>
                <Box component="span" aria-hidden sx={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>•</Box>
                <Typography noWrap title={props.filepreviewtitle} sx={{ fontSize: 13, opacity: 0.92, minWidth: 0 }}>{props.filepreviewtitle}</Typography>
              </>
            )}
            <Box sx={{ flex: '1 1 auto' }} />
            <Button
              onClick={handleClose}
              startIcon={<FaTimes size={12} />}
              sx={{ ...PILL, minHeight: 32, bgcolor: '#fff', color: '#2757aa', '&:hover': { bgcolor: '#e9f2ff', boxShadow: 'none' } }}
            >
              Close
            </Button>
          </Box>

          <Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: { xs: 'auto', md: 'hidden' } }}>

            {/* Document */}
            <Box sx={{ flex: '1 1 auto', minWidth: 0, minHeight: { xs: '75vh', md: 0 }, display: 'flex', flexDirection: 'column', bgcolor: '#bfc0be' }}>
              {props.previewComplete && (
                <Box sx={{ flexShrink: 0, bgcolor: '#fff', borderBottom: '1px solid #e5e7eb', px: 1.5 }}>
                  <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="Document or summary report"
                    variant={isMobile ? 'fullWidth' : 'standard'}
                    TabIndicatorProps={{ sx: { height: 2 } }}
                    sx={{ minHeight: 40 }}
                  >
                    <Tab label="Signed Document" {...a11yProps(0)} sx={{ minHeight: 40, py: 0.5, px: 1.5, textTransform: 'none', fontSize: 13 }} />
                    <Tab label="Summary Report" {...a11yProps(1)} sx={{ minHeight: 40, py: 0.5, px: 1.5, textTransform: 'none', fontSize: 13 }} />
                  </Tabs>
                </Box>
              )}
              <Box
                role={props.previewComplete ? 'tabpanel' : undefined}
                id={props.previewComplete ? `simple-tabpanel-${value}` : undefined}
                aria-labelledby={props.previewComplete ? `simple-tab-${value}` : undefined}
                sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}
              >
                <PDFViewerPreviewLoader
                  key={props.previewComplete && value === 1 ? 'report' : 'document'}
                  title={props.previewComplete && value === 1 ? `summary_${props.filepreviewtitle}` : props.filepreviewtitle}
                  complete={props.previewComplete}
                  height="100%"
                  document={props.previewComplete && value === 1 ? ReportDocName : mainDocName}
                  handleClose={handleClose}
                  fill
                />
              </Box>
            </Box>

            {/* Document details (shared with the signing pages) */}
            <Box sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0, borderLeft: { md: '1px solid #e5e7eb' }, borderTop: { xs: '1px solid #e5e7eb', md: 0 }, minHeight: 0 }}>
              <DocumentDetailsPanel
                owner={props.docowner}
                created={props.doccreated}
                status={props.docinfo?.status}
                voidedBy={props.docinfo?.voidedBy}
                signers={props.signers}
                commentsCount={props.comments.length}
                onComments={handleComments}
              />
            </Box>
          </Box>
        </Box>
      </Dialog>
    </div>
  );
}

export default PreviewerDialog
