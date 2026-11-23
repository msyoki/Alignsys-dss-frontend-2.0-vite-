import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, Typography } from '@mui/material';
import { FaDownload, FaFileCsv, FaFileImport, FaUpload } from 'react-icons/fa';
import AuthContext from '../../context/Authcontext';
import { DialogFooter, DialogHeader, PrimaryButton, PropertyRow, SecondaryButton } from '../common/dialogKit';
import { PILL_OUTLINE } from '../common/pillButton';
import { accountError, importUsers } from '../../api/accounts';

const TEMPLATE = 'first_name,last_name,email,phone\nJane,Doe,jane.doe@example.com,0712345678\n';

const downloadTemplate = () => {
  const blob = new Blob([`﻿${TEMPLATE}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'users-import-template.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

/**
 * Add many users from a CSV. Every row is checked first: if any has a problem,
 * nothing is imported and the problems are listed by row. New users get an email
 * with a link to set their password; licences are assigned separately.
 * `company` (super admins) chooses the organisation; admins always import into their own.
 */
const ImportUsersDialog = ({ open, onClose, onImported, company, companyName }) => {
  const { authTokens } = useContext(AuthContext);
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { severity, text, rows }

  useEffect(() => { if (open) { setFile(null); setResult(null); } }, [open]);

  const upload = () => {
    setBusy(true);
    setResult(null);
    importUsers(authTokens?.access, file, company)
      .then((res) => {
        const missed = res.emails_not_sent || [];
        setResult({
          severity: missed.length ? 'warning' : 'success',
          text: `${res.created} user(s) added. Each gets an email with a link to set their password.`
            + (missed.length ? ` The email could not be sent to: ${missed.join(', ')}. They can use "Forgot password" on the sign-in page.` : ''),
        });
        setFile(null);
        onImported?.();
      })
      .catch((err) => setResult({ severity: 'error', text: accountError(err), rows: err?.response?.data?.rows || [] }))
      .finally(() => setBusy(false));
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="import-users-title">
      <DialogHeader id="import-users-title" icon={<FaFileImport />} title="Import users" subtitle={companyName} onClose={busy ? undefined : onClose} />
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {result && (
          <Alert severity={result.severity} sx={{ mb: 1.5, fontSize: 13 }}>
            {result.text}
            {result.rows?.length > 0 && (
              <Box component="ul" sx={{ m: '6px 0 0', pl: 2.5, maxHeight: 180, overflowY: 'auto' }}>
                {result.rows.map((r) => (
                  <li key={r.row}>Row {r.row}{r.email ? ` (${r.email})` : ''}: {r.problems.join('; ')}</li>
                ))}
              </Box>
            )}
          </Alert>
        )}
        <Typography sx={{ fontSize: 13, color: '#374151', mb: 1.5, lineHeight: 1.55 }}>
          Use a CSV file with the columns <strong>first_name, last_name, email, phone</strong>. Every row is checked
          first; if any row has a problem nothing is imported, so you can fix the file and try again.
        </Typography>
        <PropertyRow label="Template">
          <Button onClick={downloadTemplate} startIcon={<FaDownload />} sx={PILL_OUTLINE}>Download template</Button>
        </PropertyRow>
        <PropertyRow label="CSV file" alignTop>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden
            onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); e.target.value = ''; }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Button onClick={() => fileRef.current?.click()} startIcon={<FaUpload />} sx={PILL_OUTLINE} disabled={busy}>Choose file</Button>
            <Typography noWrap title={file?.name} sx={{ fontSize: 12.5, color: file ? '#111827' : '#9ca3af', minWidth: 0, maxWidth: 240, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {file && <FaFileCsv aria-hidden />}{file ? file.name : 'No file chosen'}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.75 }}>
            Up to 500 users at a time. Licences are assigned afterwards in the Users table.
          </Typography>
        </PropertyRow>
      </DialogContent>
      <DialogFooter>
        <SecondaryButton onClick={onClose} disabled={busy}>Close</SecondaryButton>
        <PrimaryButton onClick={upload} loading={busy} disabled={!file} startIcon={<FaFileImport />}>
          {busy ? 'Importing…' : 'Import users'}
        </PrimaryButton>
      </DialogFooter>
    </Dialog>
  );
};

export default ImportUsersDialog;
