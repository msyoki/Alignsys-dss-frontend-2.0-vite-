import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Tooltip } from '@mui/material';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { useNavigate } from "react-router-dom";
import * as constants from '../constants/constants';
import axios from 'axios';

import LoadingMini from "../loaders/LoadingMini2";
import PDFViewerPreview from "./PDFViewerPreview";

function PDFViewerPreviewLoader({ document: docId, title, complete, height ,handleClose}) {
  const [documentBase64, setDocumentBase64] = useState('');
  const [loadingPercentage, setLoadingPercentage] = useState(0);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axios.get(`${constants.devApiBaseUrl}/api/base64/${docId}/`, {
          onDownloadProgress: (progressEvent) => {
            const percentage = (progressEvent.loaded / progressEvent.total) * 100;
            setLoadingPercentage(parseFloat(percentage.toFixed(2)));
          },
        });
     
        setDocumentBase64(response.data.base64_uri);
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };

    if (docId) {
      fetchDocument();
    }
  }, [docId]);

  return (
    <>
      {documentBase64 ? (
        <PDFViewerPreview
          title={title}
          complete={complete}
          document={documentBase64}
          height={height}
          handleClose={handleClose}
        />
      ) : (
        <LoadingMini percent={loadingPercentage} />
      )}
    </>
  );
}

PDFViewerPreviewLoader.propTypes = {
  document: PropTypes.string.isRequired,
  title: PropTypes.string,
  complete: PropTypes.bool,
  height: PropTypes.string,
};

export default PDFViewerPreviewLoader;
