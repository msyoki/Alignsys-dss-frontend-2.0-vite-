import * as React from 'react';
import { Alert } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';

export default function SimpleAlert(props) {
  return (
    <Alert icon={<CheckIcon fontSize="inherit" />} severity={props.alertSeverity || 'success'}>
      {props.alertMsg}
    </Alert>
  );
}
