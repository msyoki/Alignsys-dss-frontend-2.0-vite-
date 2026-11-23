import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Dialog, DialogContent, Typography } from '@mui/material';
import { FaCheckCircle } from 'react-icons/fa';
import AuthContext from '../../context/Authcontext';
import * as constants from '../constants/constants';
import { DialogFooter, DialogHeader, PrimaryButton, PropertyRow, PropertyValue, SecondaryButton } from '../common/dialogKit';
import LicenseTermsFields, { termsPayload, termsReady } from '../admin/LicenseTermsFields';
import '../../styles/App.css';

const EMPTY_TERMS = { number_of_users: '', number_of_years: '1' };

/**
 * Approve an organisation: creates its admin account and issues its licence
 * (number of users and years) in one step. If the licence can't be issued,
 * nothing is approved and the reason is shown here.
 */
const ApproveCompanyDialog = (props) => {
  const { authTokens } = useContext(AuthContext);
  const [terms, setTerms] = useState(EMPTY_TERMS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const open = Boolean(props.opendialogapprovecompany);

  useEffect(() => {
    if (open) { setTerms(EMPTY_TERMS); setError(''); setFieldErrors({}); }
  }, [open]);

  const refresh = () => {
    props.getCompanies?.();
    props.getNewCompanies?.();
    props.getUsers?.();
  };

  const handleClose = () => {
    if (!busy) props.setOpenDialogApproveCompany(false);
  };

  const approve = (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setError('');
    setFieldErrors({});
    axios({
      method: 'post',
      url: `${constants.devApiBaseUrl}/api/approve/company/${props.company4approval}`,
      headers: { Authorization: `Bearer ${authTokens.access}` },
      data: termsPayload(terms),
    })
      .then(() => {
        props.setOpenDialogApproveCompany(false);
        props.setAlertMsg(`Organisation approved with a licence for ${terms.number_of_users} users, ${terms.number_of_years} year(s).`);
        props.setAlertSeverity('success');
        props.setOpenAlert(true);
        setTimeout(() => props.setOpenAlert(false), 3000);
        refresh();
      })
      .catch((err) => {
        // Stay open so the super admin can correct the numbers or retry.
        const data = err.response?.data || {};
        setFieldErrors(data.fields || {});
        setError(data.message || data.error || 'Approval failed. Please try again.');
      })
      .finally(() => setBusy(false));
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" aria-labelledby="approve-company-title">
      <form onSubmit={approve}>
        <DialogHeader id="approve-company-title" icon={<FaCheckCircle />} title="Approve organisation" onClose={busy ? undefined : handleClose} />
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 1.5, fontSize: 13 }}>{error}</Alert>}
          <Typography sx={{ fontSize: 13, color: '#374151', lineHeight: 1.55, mb: 1.5 }}>
            Approving creates the organisation&apos;s admin account, emails its sign-in details, and issues its licence.
          </Typography>
          <PropertyRow label="Admin email"><PropertyValue>{props.company4approvalemail}</PropertyValue></PropertyRow>
          <PropertyRow label="Company ID"><PropertyValue mono>{props.company4approval}</PropertyValue></PropertyRow>
          <LicenseTermsFields value={terms} onChange={setTerms} errors={fieldErrors} disabled={busy} idPrefix="approve-lic" />
        </DialogContent>
        <DialogFooter>
          <SecondaryButton onClick={handleClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" loading={busy} disabled={!termsReady(terms)} startIcon={<FaCheckCircle />}>
            {busy ? 'Approving…' : 'Approve and issue licence'}
          </PrimaryButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default ApproveCompanyDialog;
