import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { FaTimes, FaCheck, FaSignature } from 'react-icons/fa';
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Authcontext from '../../context/Authcontext';
import * as constants from "../constants/constants";

// Transition for dialog slide
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function ConfirmCompleteDialog(props) {
  const { user } = React.useContext(Authcontext);
  const [fullWidth, setFullWidth] = React.useState(true);
  const [maxWidth, setMaxWidth] = React.useState('sm');
  let navigate = useNavigate();

  // Close the dialog
  const handleClose = () => {
    props.setOpenConfirmCompleteDialog(false);
  };

  // Append annotations
  async function appendAnnotations() {
    props.setAnnotatingDocument(true)


    // Ensure all text annotation content has \n for line breaks
    let processedTextAnnotations = Array.isArray(props.textAnnotation)
      ? props.textAnnotation.map(ann => ({
          ...ann,
          content: typeof ann.content === 'string' ? ann.content.replace(/\r?\n/g, '\\n') : ann.content
        }))
      : props.textAnnotation;

    let payload = JSON.stringify({
      "fileName": `${props.fileurl}`,
      "ipAddress": `${props.ip}`,
      "signersGuid": `${props.signerguid}`,
      "imageAnnotations": props.annotationList,
      "textAnnotations": processedTextAnnotations
    });

    //console.log(props.textAnnotation)

    console.log(payload);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.annotationsurl}/api/Values`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload
    };



    // console.log(payload)

    await axios.request(config)
      .then((response) => {
        props.setAnnotatingDocument(false);
        // console.log("success")
        if (props.pagetype === "redirectsign") {
          if (user) {
            navigate('/', { state: { openalert: true, alertmsg: `${props.docname} signed successfully`, alertseverity: 'success' } });
          } else {
            navigate('/complete', { state: { doctitle: props.docname } });
          }
        } else {
       
          navigate('/selfsign/otheractions', { state: { user: user, voided: false, signed: true, fileurl: props.fileurl, docguid: props.guid, doctitle: props.docname } });
        }
      })
      .catch((error) => {
        // console.log(payload);
        props.setAnnotatingDocument(false);
        
        // Create a detailed error message
        const errorMessage = error.response
            ? `Error: ${error.response.data.message || error.message}`
            : "Something went wrong, please contact admin or try later";
        
        alert(errorMessage); // Display the error message in an alert
        // console.log(error);  Log the error details for further debugging
      });
    
  }

  // Confirm and proceed
  const handleCloseAgree = () => {
    // console.log(props.annotationList);
    props.setOpenConfirmCompleteDialog(false);
    props.setOpenDialogLoading(true);

    appendAnnotations();
    props.setOpenDialogLoading(false);

 
  };

  // Return dialog JSX
  return (
    <div>
      <Dialog
        open={props.openconfirmcompletedialog}
        TransitionComponent={Transition}
        keepMounted
        // onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle
          className="text-center"
          style={{ color: "#ffff", backgroundColor: "#1C4690", fontSize: "14px" }}
        >
          <FaSignature style={{ marginRight: 6, verticalAlign: 'middle' }} /> {"Complete Signing"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description" className="text-center">
            <p className="m-4 text-dark" style={{ fontSize: "14px" }}>
              I confirm the placed signature is in order. Let's proceed.
            </p>
          </DialogContentText>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleClose}
              sx={{
                borderRadius: '25px',
                textTransform: 'none',
                fontSize: '12px',
                px: 2.5,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                m: 1,
                minWidth: 100,
              }}
              startIcon={<FaTimes style={{ fontSize: 14, marginRight: 2 }} />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCloseAgree}
              sx={{
                borderRadius: '25px',
                textTransform: 'none',
                fontSize: '12px',
                px: 2.5,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                m: 1,
                minWidth: 100,
                boxShadow: '0 2px 8px rgba(28,70,144,0.08)',
              }}
              startIcon={<FaCheck style={{ fontSize: 14, marginRight: 2 }} />}
            >
              Proceed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ConfirmCompleteDialog;
