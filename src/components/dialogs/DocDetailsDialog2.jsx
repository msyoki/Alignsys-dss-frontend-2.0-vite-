import React from 'react';
import DocumentDetailsDialog from './DocumentDetailsDialog.jsx';

// Dashboard tabs (Inbox, Outbox, Completed, Voided, Trashed, My uploads).
// Kept under this name so the pages that open it don't change.
const DocDetailsDialog2 = ({
  opendialogdocdetails,
  setOpenDialogDocDetails,
  document = {},
  documentsigners = [],
  refreshdata = () => { },
  type = '',
}) => (
  <DocumentDetailsDialog
    open={opendialogdocdetails}
    onClose={() => setOpenDialogDocDetails(false)}
    document={document}
    signers={documentsigners}
    type={type}
    onChanged={refreshdata}
  />
);

export default DocDetailsDialog2;
