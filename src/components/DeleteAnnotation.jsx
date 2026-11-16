import * as React from 'react';
import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import { FaTimes, FaTrash } from 'react-icons/fa';
import { PILL } from './common/pillButton';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function DeleteAnnotationDialog(props) {
    const [annotation, setAnnotation] = useState(null);

    const handleClose = () => {
        props.setDeleteAnnotationDialog(false);
    };

    const handleCloseAgree = () => {
        props.deleteAnnotation(props.selectedAnnotationId);
        props.setDeleteAnnotationDialog(false);
    };

    useEffect(() => {
        if (props.selectedAnnotationId && props.findAnnotationById) {
            const foundAnnotation = props.findAnnotationById(props.selectedAnnotationId);
            setAnnotation(foundAnnotation || null);
        }
    }, [props.selectedAnnotationId, props.findAnnotationById]);


    
const pillBtn = {
  ...PILL,
  display: 'flex',
  alignItems: 'center',
};

    return (
        <div>
            <Dialog
                open={props.deleteAnnotationDialog}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleClose}
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle className='text-white text-center' style={{ fontWeight: '400', fontSize: '12px', backgroundColor: '#1C4690' }}>
                    {annotation?.type ? `${annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)} Annotation` : 'Annotation'}
                </DialogTitle>
                <DialogContent style={{maxWidth: '450px'}}>
                    <DialogContentText 
                        id="alert-dialog-slide-description" 
                        className="text-center"
                    >
                        <p className="my-3 text-dark" style={{ fontSize: "14px" }}>
                            Are you sure you want to delete this annotation?
                        </p>
                    </DialogContentText>

                    <div className="text-center my-2">
                        {annotation && annotation.src ? (
                      
                                    <img
                                        width="40%"
                                        height="40%"
                                        src={annotation.src}
                                        alt="Annotation"
                                       
                                    />
                      
                          
                        ) : (
                            <>
                                {annotation && annotation.type === 'text' ? (
                                    <>
                                        
                                        <div className='text-dark mt-2 p-3' style={{ fontSize: "12px" }}>
                                            Text Content: 
                                            <span className='mx-2' style={{ color: "blue" }}>"{annotation.content}"</span>
                                        </div>
                                    </>
                                ) : (
                                    annotation && (
                                        <span className='text-capitalize'>
                                            No Annotation
                                        </span>
                                    )
                                )}
                            </>
                        )}
                    </div>
                    <div className='d-flex justify-content-center flex-wrap gap-2 mt-3'>
                        <Button
                            variant="outlined"
                            color="warning"
                            sx={pillBtn}
                            onClick={handleClose}
                            startIcon={<FaTimes />}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            sx={pillBtn}
                            onClick={handleCloseAgree}
                            startIcon={<FaTrash />}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default DeleteAnnotationDialog;