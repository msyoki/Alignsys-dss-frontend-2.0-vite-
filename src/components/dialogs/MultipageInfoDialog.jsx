import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Slide from '@mui/material/Slide';

import { FaInfoCircle, FaCheck } from 'react-icons/fa';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function MultipageInfoDialog(props) {

    const handleClose = () => {
        props.addMultipageAnnotation()
        props.setOpen(false);
    };

    return (
        <div>
            <Dialog
                open={props.open}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleClose}
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogContent>
                    <DialogContentText
                        id="alert-dialog-slide-description"
                        className='text-center'
                    >
                        <FaInfoCircle
                            style={{
                                fontSize: "40px",
                                color: '#1C4690'
                            }}
                        />

                        <p
                            className='m-4 text-dark'
                            style={{ fontSize: "12px" }}
                        >
                            You have selected multipage {props.isStamp ? 'stamping' : 'signing'}.
                            Once you're satisfied with the placement of the {props.stamp ? "stamp" : "signature"},
                            click the '{props.stamp ? "Stamping" : "Sign"} All Pages' button to apply it to all pages,
                            or use the 'Abort Multipage {props.isStamp ? 'Stamp' : 'Signing'}'
                            button to discard option.
                        </p>
                    </DialogContentText>

                    <div className='d-flex justify-content-center'>
                        <Button
                            variant="contained"
                            color='inherit'
                            className='m-2'
                            onClick={handleClose}
                            sx={{
                                textTransform: 'none',
                                fontSize: '12px',
                                fontWeight: 500,
                                borderRadius: '999px',
                                px: 1.8,
                                py: 0.8,
                                minHeight: 34,
                                boxShadow: 'none',
                                

                            }}
                        >
                            <span className='mx-2 d-flex align-items-center' style={{ color: '#1C4690' }}>
                                <FaCheck style={{ marginRight: '6px' }} />
                                I understand, proceed!
                            </span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default MultipageInfoDialog;