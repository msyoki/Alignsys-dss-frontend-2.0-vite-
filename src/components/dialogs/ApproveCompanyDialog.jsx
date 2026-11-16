import * as React from 'react';
import { useContext } from 'react';
import axios from 'axios';
import { FaCheckCircle } from 'react-icons/fa';
import AuthContext from '../../context/Authcontext';
import * as constants from '../constants/constants';
import { ConfirmDialog, PropertyRow, PropertyValue } from '../common/dialogKit';
import '../../styles/App.css';

const ApproveCompanyDialog = (props) => {
  const { authTokens } = useContext(AuthContext);

  const handleClose = () => {
    props.setOpenDialogApproveCompany(false);
  };

  const updateCompany = (e) => {
    e?.preventDefault?.();
    handleClose();

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${constants.devApiBaseUrl}/api/approve/company/${props.company4approval}`,
      headers: { Authorization: `Bearer ${authTokens.access}` },
      data: '',
    };

    axios(config)
      .then(function () {
        props.setOpenAlert(true);
        props.setAlertMsg('company approved successfully !!!');
        props.setAlertSeverity('success');
        setTimeout(function () {
          props.setOpenAlert(false);
          props.getCompanies();
          props.getNewCompanies();
          props.getUsers();
          props.setOpenDialogApproveCompany(false);
        }, 2000);
      })
      .catch(function (error) {
        props.setOpenAlert(true);
        props.setAlertMsg(`${error.response?.data?.['message'] || 'Approval failed.'}`);
        props.setAlertSeverity('error');
        setTimeout(function () {
          props.setOpenAlert(false);
          props.getCompanies();
          props.getNewCompanies();
          props.getUsers();
          props.setOpenDialogApproveCompany(false);
        }, 4000);
      });
  };

  return (
    <ConfirmDialog
      open={Boolean(props.opendialogapprovecompany)}
      icon={<FaCheckCircle />}
      title="Approve company"
      maxWidth="sm"
      message={
        <>
          Approve this company&apos;s account? An admin account will also be created, and its sign-in details
          sent to the company&apos;s admin email.
        </>
      }
      confirmLabel="Approve"
      onConfirm={updateCompany}
      onCancel={handleClose}
    >
      <PropertyRow label="Admin email">
        <PropertyValue>{props.company4approvalemail}</PropertyValue>
      </PropertyRow>
      <PropertyRow label="Company ID">
        <PropertyValue mono>{props.company4approval}</PropertyValue>
      </PropertyRow>
    </ConfirmDialog>
  );
};

export default ApproveCompanyDialog;
