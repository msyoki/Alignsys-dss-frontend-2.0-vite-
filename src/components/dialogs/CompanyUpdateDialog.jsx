import * as React from 'react';
import { useContext } from 'react';
import { FaBuilding } from 'react-icons/fa';
import { Box, Dialog, DialogContent, Switch, Typography } from '@mui/material';
import axios from 'axios';
import Alerts from '../Alert.jsx';
import AuthContext from '../../context/Authcontext.jsx';
import * as constants from '../constants/constants.js';
import { DialogFooter, DialogHeader, PrimaryButton, PropertyRow, PropertyValue, SecondaryButton, StatusChip } from '../common/dialogKit';

const isTrue = (v) => v === 'True' || v === true || v === 'true';

const CompanyUpdateDialog = (props) => {
  const { authTokens } = useContext(AuthContext);
  const [isActive, setIsActive] = React.useState(isTrue(props.companyactive));
  const [busy, setBusy] = React.useState(false);

  // The dialog stays mounted between uses: show the selected company's status each time it opens.
  React.useEffect(() => {
    if (props.opendialogupdatecompany) setIsActive(isTrue(props.companyactive));
  }, [props.opendialogupdatecompany, props.companyactive]);

  const handleToggle = (event) => {
    setIsActive(event.target.checked);
  };

  const updateCompany = (e) => {
    e.preventDefault();

    // Browser FormData (require('form-data') is not available in the Vite build).
    const data = new FormData();
    data.append('active', isActive);

    const config = {
      method: 'patch',
      url: `${constants.devApiBaseUrl}/api/company/${props.companyid}`,
      headers: { Authorization: `Bearer ${authTokens.access}` },
      data,
    };

    setBusy(true);
    axios(config)
      .then(function () {
        props.setOpenAlert(true);
        props.setAlertMsg('Updated successfully !!!');
        props.setAlertSeverity('success');
        props.setOpenDialogUpdateCompany(false);
        setTimeout(function () {
          props.setOpenAlert(false);
          props.getCompanies();
          props.getNewCompanies();
          props.setOpenDialogUpdateCompany(false);
          document.getElementById('company-update-form')?.reset();
        }, 2000);
      })
      .catch(function (error) {
        props.setOpenAlert(true);
        props.setAlertMsg(`${error.response?.data?.['message'] || 'Update failed.'}`);
        props.setAlertSeverity('error');
        setTimeout(function () {
          props.setOpenAlert(false);
          props.getCompanies();
          props.getNewCompanies();
          props.setOpenDialogUpdateCompany(false);
        }, 4000);
      })
      .finally(() => setBusy(false));
  };

  const handleClose = () => {
    props.setOpenDialogUpdateCompany(false);
  };

  return (
    <Dialog open={props.opendialogupdatecompany} keepMounted onClose={busy ? undefined : handleClose} fullWidth maxWidth="sm" aria-labelledby="company-update-title">
      <DialogHeader id="company-update-title" icon={<FaBuilding />} title="Edit company" subtitle={props.companyname} onClose={handleClose} />
      <form onSubmit={updateCompany} id="company-update-form">
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Alerts
            alertseverity={props.alertseverity}
            alertmsg={props.alertmsg}
            openalert={props.openalert}
            setOpenAlert={props.setOpenAlert}
          />
          <PropertyRow label="Company">
            <PropertyValue>{props.companyname}</PropertyValue>
          </PropertyRow>
          <PropertyRow label="Account status" alignTop>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
              <StatusChip tone={isActive ? 'success' : 'neutral'}>{isActive ? 'Active (licensed)' : 'Inactive (no valid licence)'}</StatusChip>
            </Box>
            <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
              An organisation is active while it has a licence that hasn&apos;t expired. Change it with the Licence button in the Organisations table.
            </Typography>
          </PropertyRow>
        </DialogContent>
        <DialogFooter>
          <SecondaryButton onClick={handleClose} disabled={busy}>Close</SecondaryButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default CompanyUpdateDialog;
