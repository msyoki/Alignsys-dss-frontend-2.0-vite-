import * as React from 'react';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import Box from '@mui/material/Box';
import { Button, Typography } from '@mui/material';
import { FaPen } from 'react-icons/fa';

import PDFViewerPreviewLoader2 from '../preview/PDFViewerPreviewLoader2';
import SignerBoxesPanel from '../preview/SignerBoxesPanel';
import { signerColor } from '../preview/signerColors';
import { PILL } from '../common/pillButton';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Full-screen "Place signature boxes": the document on the left (thumbnails, page
// navigation, zoom, boxes) and "Who signs where?" on the right.
function SignersBoxDialog(props) {
    const [addSignatureBox, setAddSignatureBox] = useState(false);

    const addOrUpdateSigner = (newSigner) => {
        props.setSignatureBoxes((prevState) => {
            const signerExists = prevState.some((box) => box.signer.id === newSigner.id);

            if (signerExists) {
                return prevState; // Return current state if signer exists
            }

            // Add new signer if not already present
            return [
                ...prevState,
                {
                    signer: newSigner,
                    annotations: [], // Initialize annotations
                },
            ];
        });
    };

    const handleSelectUser = (index, user, addSignatureBox) => {
        if (addSignatureBox) {
            setAddSignatureBox(true);
        }

        // Fixed colour by signing position (was random per session).
        const newSigner = {
            id: index,
            email: user.email,
            color: signerColor(index),
        };

        props.setSelectedUser(newSigner);
        addOrUpdateSigner(newSigner);
    };

    // Remove every box of one signer (same effect as deleting them one by one).
    const removeSignerBoxes = (email) => {
        props.setSignatureBoxes((prev) => prev.map((box) => (
            box.signer.email === email ? { ...box, annotations: [] } : box
        )));
        props.setSelectedAnnotationId?.(null);
    };

    const handleClose = () => {
        props.setOpen(false);
    };

    return (
        <Dialog fullScreen open={props.open} onClose={handleClose} TransitionComponent={Transition} aria-labelledby="sbd-title">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

                {/* Top bar */}
                <Box sx={{ height: 52, flexShrink: 0, bgcolor: '#2757aa', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.25, pl: 2.25, pr: 1.5 }}>
                    <FaPen size={14} aria-hidden />
                    <Typography id="sbd-title" component="h2" sx={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>Place signature boxes</Typography>
                    {props.docTitle && (
                        <>
                            <Box component="span" aria-hidden sx={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>•</Box>
                            <Typography noWrap title={props.docTitle} sx={{ fontSize: 13, opacity: 0.92, minWidth: 0 }}>{props.docTitle}</Typography>
                        </>
                    )}
                    <Box sx={{ flex: '1 1 auto' }} />
                    <Button
                        onClick={handleClose}
                        sx={{ ...PILL, minHeight: 32, bgcolor: '#fff', color: '#2757aa', '&:hover': { bgcolor: '#e9f2ff', boxShadow: 'none' } }}
                    >
                        Done
                    </Button>
                </Box>

                <Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: { xs: 'auto', md: 'hidden' } }}>
                    {/* Document */}
                    <Box sx={{ flex: '1 1 auto', minWidth: 0, minHeight: 0, overflow: 'hidden', bgcolor: '#bfc0be' }}>
                        <PDFViewerPreviewLoader2
                            selectedAnnotationId={props.selectedAnnotationId}
                            setSelectedAnnotationId={props.setSelectedAnnotationId}
                            signer={props.selectedUser}
                            signatureBoxes={props.signatureBoxes}
                            setSignatureBoxes={props.setSignatureBoxes}
                            title={props.file}
                            complete={false}
                            height="100%"
                            document={`${props.file}.pdf`}
                            addSignatureBox={addSignatureBox}
                            setAddSignatureBox={setAddSignatureBox}
                            handleSelectUser={handleSelectUser}
                            signers={props.signers}
                        />
                    </Box>

                    {/* Who signs where? */}
                    <Box sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0, borderLeft: { md: '1px solid #e5e7eb' }, borderTop: { xs: '1px solid #e5e7eb', md: 0 }, minHeight: 0 }}>
                        <SignerBoxesPanel
                            signers={props.signers}
                            signatureBoxes={props.signatureBoxes}
                            activeIndex={props.selectedUser?.id ?? null}
                            placing={addSignatureBox}
                            onSelect={(index, item) => { props.setSelectedAnnotationId?.(null); handleSelectUser(index, item, true); }}
                            onRemoveBoxes={removeSignerBoxes}
                            footer={(
                                <Button
                                    variant="contained"
                                    disableElevation
                                    onClick={handleClose}
                                    sx={{ ...PILL, width: '100%', minHeight: 38, bgcolor: '#2757aa', '&:hover': { bgcolor: '#1a3a7a', boxShadow: 'none' } }}
                                >
                                    Done, back to signers
                                </Button>
                            )}
                        />
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
}

export default SignersBoxDialog;
