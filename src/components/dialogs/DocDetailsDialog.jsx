import React from 'react';
import DocumentDetailsDialog from './DocumentDetailsDialog.jsx';

// Admin document log. Same dialog as the dashboard; type "admin" lets the organisation
// admin manage signers (the server checks the admin belongs to the document's organisation).
const DocDetailsDialog = ({ opendialogdocdetails, setOpenDialogDocDetails, document = {}, onChanged }) => (
  <DocumentDetailsDialog
    open={opendialogdocdetails}
    onClose={() => setOpenDialogDocDetails(false)}
    document={document}
    signers={document.signers || []}
    type="admin"
    onChanged={onChanged}
  />
);

export default DocDetailsDialog;
