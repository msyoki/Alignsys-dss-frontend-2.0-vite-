import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Slide from '@mui/material/Slide';

import { FaInfoCircle, FaCheck } from 'react-icons/fa';
import { PILL } from '../common/pillButton';

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

                    <div className='d-flex justify-content-center mt-3'>
                        <Button
                            variant="contained"
                            color='inherit'
                            onClick={handleClose}
                            startIcon={<FaCheck />}
                            sx={{
                              ...PILL,
                              color: '#1C4690',
                            }}
                        >
                            I understand, proceed!
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default MultipageInfoDialog;