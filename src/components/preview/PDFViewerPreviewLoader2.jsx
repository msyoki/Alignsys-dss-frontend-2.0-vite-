import React, { useEffect, useRef ,useState} from "react";
import PropTypes from "prop-types";
import * as constants from '../constants/constants'
import axios from 'axios'
import LoadingMini from "../loaders/LoadingMini2";
import CustomViewer from "./PDFViewerPreview";
import PDFViewerSetSIgningAreas from "./PDFViewerSetSIgningAreas";


function PDFViewerPreviewLoader2(props) {

  const [document,setDocument]=useState('')
  const [loadingPercentage, setLoadingPercentage] = useState(0);

  let getDocument = async() => {

    try {
   
        // Add onDownloadProgress to the Axios configuration
        const response = await axios.get(`${constants.devApiBaseUrl}/api/base64/${props.document}/`, {
            onDownloadProgress: progressEvent => {
              const percentage = (progressEvent.loaded / progressEvent.total) * 100;
              displayPercentageWaitingTime(percentage);
            }
        });
        // console.log(response.data.base64_uri)
        // Handle the response data
        setDocument(response.data.base64_uri);
       
      return () => {
        // Unmount cleanup if needed
      };
       
    } catch (error) {
        // Handle errors
        console.error(error);
    }
  };


  // Function to display percentage waiting time
function displayPercentageWaitingTime(percentage) {
  // You can update your UI or // console.log the percentage
  let perce = parseFloat(percentage.toFixed(2));
  setLoadingPercentage(perce);

}

  useEffect(() => {
    // console.log(props.document)
    getDocument()
    
  }, [props.document]);

  return (
    <>
    
      {document?
      
      // <div ref={containerRef} style={{ width: "100%", height: `${props.height}` }} />
      <PDFViewerSetSIgningAreas  title={props.title}  complete={props.complete} uploadeddocument={document}  height={props.height} signer={props.signer} signatureBoxes={props.signatureBoxes} setSignatureBoxes={props.setSignatureBoxes} selectedAnnotationId={props.selectedAnnotationId} setSelectedAnnotationId={props.setSelectedAnnotationId}    addSignatureBox={props.addSignatureBox} 
      setAddSignatureBox={props.setAddSignatureBox}  handleSelectUser={props.handleSelectUser}
      signers={props.signers}/>
      :
        <LoadingMini percent={loadingPercentage}  />

      }
 
    </>
  );
}

PDFViewerPreviewLoader2.propTypes = {
  document: PropTypes.string.isRequired,
};

export default PDFViewerPreviewLoader2;
