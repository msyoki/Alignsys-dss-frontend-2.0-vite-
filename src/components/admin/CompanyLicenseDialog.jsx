import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Dialog, DialogContent, LinearProgress, Typography } from '@mui/material';
import { FaIdCard, FaSave } from 'react-icons/fa';
import AuthContext from '../../context/Authcontext';
import {
  DialogFooter, DialogHeader, PrimaryButton, PropertyRow, PropertyValue, SecondaryButton, StatusChip,
} from '../common/dialogKit';
import LicenseTermsFields, { termsPayload, termsReady } from './LicenseTermsFields';
import {
  changeCompanyLicense, getCompanyLicense, issueCompanyLicense, licenseError, licenseFieldErrors,
} from '../../api/licensing';
import { daysUntil, expiryLabel, expiryTone, formatCalendarDate, yearsBetween } from './licenseFormat';
import { formatDateOnly } from '../../utils/datetime';

/**
 * Super admin: an organisation's licence. Shows seats used and the expiry date,
 * and issues a licence (if it has none) or changes the number of users / years.
 * company = { id, name }
 */
const CompanyLicenseDialog = ({ open, company, onClose, onSaved }) => {
  const { authTokens } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [terms, setTerms] = useState({ number_of_users: '', number_of_years: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const fill = (payload) => {
    setData(payload);
    const s = payload?.status;
    setTerms(s
      ? { number_of_users: String(s.numberOfLicenses ?? ''), number_of_years: String(yearsBetween(s.licenseDate, s.expiryDate)) }
      : { number_of_users: '', number_of_years: '' });
  };

  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    setBanner(null);
    try {
      fill(await getCompanyLicense(authTokens?.access, company.id));
    } catch (err) {
      setData(null);
      setBanner({ severity: 'error', text: licenseError(err, 'The licence could not be loaded.') });
    } finally {
      setLoading(false);
    }
  }, [company?.id, authTokens?.access]);

  useEffect(() => {
    if (open) { setFieldErrors({}); load(); }
  }, [open, load]);

  const hasLicense = Boolean(data?.has_license);
  const status = data?.status;
  const days = status ? daysUntil(status.expiryDate) : null;
  const used = status ? Number(status.allocatedLicenses || 0) : 0;
  const total = status ? Number(status.numberOfLicenses || 0) : 0;

  const save = async () => {
    setSaving(true);
    setBanner(null);
    setFieldErrors({});
    try {
      const fn = hasLicense ? changeCompanyLicense : issueCompanyLicense;
      fill(await fn(authTokens?.access, company.id, termsPayload(terms)));
      setBanner({ severity: 'success', text: hasLicense ? 'Licence updated.' : 'Licence issued.' });
      onSaved?.();
    } catch (err) {
      setFieldErrors(licenseFieldErrors(err));
      setBanner({ severity: 'error', text: licenseError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="company-licence-title">
      <DialogHeader id="company-licence-title" icon={<FaIdCard />} title="Licence" subtitle={company?.name} onClose={saving ? undefined : onClose} />
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {banner && <Alert severity={banner.severity} sx={{ mb: 1.5, fontSize: 13 }}>{banner.text}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3, justifyContent: 'center', color: '#6b7280', fontSize: 13 }}>
            <CircularProgress size={16} /> Loading licence…
          </Box>
        ) : (
          <>
            {hasLicense ? (
              <>
                <PropertyRow label="Users">
                  <Box sx={{ py: 0.5 }}>
                    <Typography sx={{ fontSize: 12.8 }}>
                      <strong>{used}</strong> of {total} in use · {status.remaining ?? Math.max(total - used, 0)} left
                    </Typography>
                    <LinearProgress
                      variant="determinate" value={total ? Math.min(100, (used / total) * 100) : 0}
                      sx={{ mt: 0.75, height: 6, borderRadius: 3 }}
                      aria-label={`${used} of ${total} licences in use`}
                    />
                  </Box>
                </PropertyRow>
                <PropertyRow label="Issued"><PropertyValue>{formatDateOnly(status.licenseDate, { day: 'numeric', month: 'short', year: 'numeric' })}</PropertyValue></PropertyRow>
                <PropertyRow label="Expires">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    <Typography sx={{ fontSize: 12.8 }}>{formatCalendarDate(status.expiryDate)}</Typography>
                    <StatusChip tone={expiryTone(days)}>{expiryLabel(days)}</StatusChip>
                  </Box>
                </PropertyRow>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mt: 2, mb: 0.5 }}>Change licence</Typography>
              </>
            ) : (
              data && (
                <Alert severity="info" sx={{ mb: 1.5, fontSize: 13 }}>
                  This organisation has no licence yet. Issue one below.
                </Alert>
              )
            )}
            {data && (
              <LicenseTermsFields value={terms} onChange={setTerms} errors={fieldErrors} disabled={saving} idPrefix="company-lic" />
            )}
            {hasLicense && total > 0 && Number(terms.number_of_users) > 0 && Number(terms.number_of_users) < used && (
              <Alert severity="warning" sx={{ mt: 1, fontSize: 12.5 }}>
                {used} people already hold a licence, more than the {terms.number_of_users} you entered.
                Withdraw some licences first, or keep the number at {used} or more.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogFooter>
        <SecondaryButton onClick={onClose} disabled={saving}>Close</SecondaryButton>
        {data && (
          <PrimaryButton onClick={save} loading={saving} disabled={loading || !termsReady(terms)} startIcon={<FaSave />}>
            {hasLicense ? 'Save changes' : 'Issue licence'}
          </PrimaryButton>
        )}
      </DialogFooter>
    </Dialog>
  );
};

export default CompanyLicenseDialog;
