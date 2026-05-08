import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import Slide from '@mui/material/Slide';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';


const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />
})

function MultipageInfoDialog(props) {

    const handleClose = () => {
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
   

                    <DialogContentText id="alert-dialog-slide-description" className='text-center'>
                    <i class="fas fa-info-circle " style={{ fontSize: "50px" ,color:'#1C4690'}}></i>
                        <p className='m-4 text-dark' style={{ fontSize: "12px" }}>
                         You have selected multipage {props.isStamp?'stamping':'signing'}. Once you're satisfied with the placement of the {props.stamp ? "stamp" : "signature"}, click the '{props.stamp ? "Stamping" : "Sign"} All Pages' button to apply it to all pages, or use the 'Abort Mutipage {props.isStamp?'Stamp':'Signing'}' button to discard option.
                        </p>
                    </DialogContentText>
                    <div className='d-flex justify-content-center'>
                        <ButtonComponent
                            cssClass="e-custom-light"
                            className='m-2 p-2'
                            style={{ textTransform: 'none', fontWeight: 'lighter', fontSize: '15px' }}
                            onClick={handleClose}
                        >
                            <span className='mx-2'>
                                <i className="fas fa-check mx-1"></i> i understand, proceed !
                            </span>
                        </ButtonComponent>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default MultipageInfoDialog;
