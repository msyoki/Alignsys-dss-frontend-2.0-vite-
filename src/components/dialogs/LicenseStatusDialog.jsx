import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FontStyle } from '@syncfusion/ej2-react-pdfviewer';

// Styled component to customize the dialog
const CustomDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        backgroundColor: '#1C4690',
        color: theme.palette.common.white, // Ensure text is readable on dark background
        borderRadius: '8px', // Add rounded corners
        padding: '16px', // Add padding around the content
    },
}));

const LicenseStatus = (props) => {
    // Handle dialog close
    const handleClose = () => {
        props.setOpen(false);
    };

    const reloadPage = () => {
        window.location.reload();
    };

    return (
        <div>
            <CustomDialog open={props.open} >
                <DialogTitle>
                    <i class="fas fa-ban mx-2" style={{ fontSize: '25px', color: '#ffda75' }}></i> Access Denied
                </DialogTitle>
                <DialogContent >
                    <Typography variant="body1" style={{ fontSize: '14px'}} >
                    It seems you have not been assigned a license to access your account. Please contact support to obtain a valid license or to address any issues related to your account access.
                    <br/> <br/>
                    </Typography>
                    <Typography variant="body1" style={{ fontSize: '14px'}} >
                        Thank you for your cooperation.
                    </Typography>

                </DialogContent>
                <DialogActions>
                    <Button onClick={props.logoutUser} color="inherit">
                        Logout
                    </Button>
                    <Button onClick={reloadPage} color="inherit">
                        Try Again
                    </Button>
                 

                </DialogActions>
            </CustomDialog>
        </div>
    );
};

export default LicenseStatus;
