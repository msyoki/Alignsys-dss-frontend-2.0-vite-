import React, { useContext, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import AuthContext from '../../context/Authcontext.jsx';
import { getDocumentBase64 } from '../../api/documentFiles';

import LoadingMini from "../loaders/LoadingMini2";
import PDFViewerPreview from "./PDFViewerPreview";

// publicOnly: the QR verify page, which anyone may open, always uses the public endpoint.
function PDFViewerPreviewLoader({ document: docId, title, complete, height ,handleClose, fill = false, publicOnly = false}) {
  const [documentBase64, setDocumentBase64] = useState('');
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const { authTokens } = useContext(AuthContext) || {};
  // Read at fetch time, so a token refresh doesn't reload the document.
  const tokenRef = useRef(null);
  tokenRef.current = publicOnly ? null : authTokens?.access;

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const uri = await getDocumentBase64(docId, {
          token: tokenRef.current,
          onDownloadProgress: (progressEvent) => {
            const percentage = (progressEvent.loaded / progressEvent.total) * 100;
            setLoadingPercentage(parseFloat(percentage.toFixed(2)));
          },
        });

        setDocumentBase64(uri);
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
          fill={fill}
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
  publicOnly: PropTypes.bool,
};

export default PDFViewerPreviewLoader;
