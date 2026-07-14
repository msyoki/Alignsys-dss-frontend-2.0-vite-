import * as React from 'react';
import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';

import Slide from '@mui/material/Slide';
import PropTypes from 'prop-types';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import PDFViewerPreviewLoader2 from '../preview/PDFViewerPreviewLoader2';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { FaPencilAlt, FaUserCircle, FaCheckSquare } from 'react-icons/fa';
import {
    Grid,
    Paper,
} from '@mui/material';
import { FaArrowLeft, FaTimes } from "react-icons/fa";

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

CustomTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function SignersBoxDialog(props) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [text, setText] = useState('');
    const [value, setValue] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    const [userColors, setUserColors] = useState({}); // Tracks color codes for users
    const [addSignatureBox, setAddSignatureBox] = useState(false)



    const generateRandomRGB = () => {
        // Generate random RGB values in the full range (0-255)
        const r = Math.floor(Math.random() * 256); // Random value between 0 and 255
        const g = Math.floor(Math.random() * 256); // Random value between 0 and 255
        const b = Math.floor(Math.random() * 256); // Random value between 0 and 255
        return { r, g, b };
    };

    const rgbToHex = (rgb) => {
        // Convert RGB values to hex format
        const toHex = (x) => x.toString(16).padStart(2, "0"); // Convert to 2-digit hex
        return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    };

    const hexToRgb = (hex) => {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    };

    const colorDifference = (c1, c2) => {
        const rgb1 = hexToRgb(c1);
        const rgb2 = hexToRgb(c2);
        return Math.sqrt(
            Math.pow(rgb1.r - rgb2.r, 2) +
            Math.pow(rgb1.g - rgb2.g, 2) +
            Math.pow(rgb1.b - rgb2.b, 2)
        );
    };

    // Helper function to determine if a color is a "shade of green"
    const isGreenShade = (rgb) => {
        // You can adjust the green threshold for different shades of green
        return rgb.g > rgb.r && rgb.g > rgb.b && rgb.g > 100;
    };

    // Ensures the new color is not similar to any existing color, and not too close to green
    const generateUniqueColor = (existingColors, threshold = 60) => {
        let newColor;
        let attempts = 0;

        do {
            // Generate a random RGB color
            let rgb = generateRandomRGB();
            newColor = rgbToHex(rgb);

            // Check if the generated color is too similar to any existing color
            const tooSimilar = Object.values(existingColors).some(
                (existingColor) => colorDifference(newColor, existingColor) < threshold
            );

            // Check if the color is a "shade of green"
            const isSimilarGreen = isGreenShade(hexToRgb(newColor));

            // If it's too similar or a shade of green, retry
            if (!tooSimilar && !isSimilarGreen) break;

            attempts++;
        } while (attempts < 20); // Retry up to 20 times

        return newColor;
    };

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
        console.log(index)
        console.log(user)
        if (addSignatureBox) {
            setAddSignatureBox(true);
        }

        const existingColor = userColors[index];

        const colorToUse = existingColor || generateUniqueColor(userColors);

        const newSigner = {
            id: index,
            email: user.email,
            color: colorToUse,
        };

        if (!existingColor) {
            setUserColors((prevColors) => ({
                ...prevColors,
                [index]: colorToUse,
            }));
        }

        props.setSelectedUser(newSigner);
        addOrUpdateSigner(newSigner);
    };

    ;



    const actionButtonSx = {
        textTransform: 'none',
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: '999px',
        boxShadow: 'none',
        margin: '20px'

    };



    const logostyle = {
        width: isMobile ? "100px" : "150px",
        backgroundColor: 'white'
    }



    const handleClose = () => {
        props.setOpen(false);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };



    useEffect(() => {
        setSidebarOpen(!isMobile);
    }, [isMobile]);


    // useEffect(() => {
    //     const handleBeforeUnload = (event) => {
    //         event.preventDefault();
    //         event.returnValue = "";
    //     };

    //     window.addEventListener("beforeunload", handleBeforeUnload);

    //     return () => {
    //         window.removeEventListener("beforeunload", handleBeforeUnload);
    //     };
    // }, []);


    return (


        <Dialog fullScreen open={props.open} onClose={handleClose} TransitionComponent={Transition}>
            <Dialog
                fullScreen
                open={props.open}
                onClose={handleClose}
                TransitionComponent={Transition}
            >
                <DialogContent sx={{ p: 0, height: '100%' }}>
                    <Grid
                        container
                        sx={{
                            height: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        {/* PDF Viewer */}
                        <Grid
                            item
                            xs={12}
                            md={8}
                            lg={9}
                            sx={{
                                height: '100%',
                                overflow: 'hidden',
                                p: 2,
                            }}
                        >
                            <PDFViewerPreviewLoader2
                                selectedAnnotationId={props.selectedAnnotationId}
                                setSelectedAnnotationId={props.setSelectedAnnotationId}
                                signer={props.selectedUser}
                                signatureBoxes={props.signatureBoxes}
                                setSignatureBoxes={props.setSignatureBoxes}
                                title={props.file}
                                complete={false}
                                height={isMobile ? '80vh' : '100vh'}
                                document={`${props.file}.pdf`}
                                addSignatureBox={addSignatureBox}
                                setAddSignatureBox={setAddSignatureBox}
                                handleSelectUser={handleSelectUser}
                                signers={props.signers}
                            />
                        </Grid>

                        {/* Metadata */}

                        <Grid
                            item
                            xs={12}
                            md={4}
                            lg={3}
                            className='shadow-lg'
                            sx={{
                                bgcolor: '#fff',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                padding: '20px'

                            }}
                        >
                            {/* Header */}
                            <Box
                                sx={{
                                    bgcolor: '#2757aa',
                                    color: '#fff',
                                    p: 1,
                                    textAlign: 'center',
                                }}
                            >
                                <Typography fontSize={isMobile ? 10 : 12}>
                                    ORDER OF SIGNERS
                                </Typography>

                                <Typography fontSize={isMobile ? 10 : 12}>
                                    Number of signers ({props.signers.length})
                                </Typography>
                            </Box>

                            {/* Instructions */}
                            <Box
                                sx={{
                                    bgcolor: '#e9f2ff',
                                    borderRadius: 1,
                                    m: 2,
                                    p: 1.5,
                                    fontSize: 12,
                                }}
                            >
                                <strong style={{ color: '#2757aa' }}>
                                    Instructions:
                                </strong>{' '}
                                Select a user, then click on the document to place assign a
                                signature box/ signing.
                            </Box>

                            {/* Signers */}
                            <Box
                                sx={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    px: 1,
                                }}
                            >
                                {props.signers.map((item, index) => {
                                    const isActive =
                                        props.selectedUser?.id === index &&
                                        addSignatureBox;

                                    return (
                                        <Box
                                            key={index}
                                            onClick={() =>
                                                handleSelectUser(index, item, true)
                                            }
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                mb: 1,
                                            }}
                                        >
                                            <FaCheckSquare
                                                style={{
                                                    color: isActive
                                                        ? userColors[index]
                                                        : '#ccc',
                                                    fontSize: 20,
                                                    minWidth: 20,
                                                }}
                                            />

                                            <Box
                                                sx={{
                                                    ml: 1,
                                                    flex: 1,
                                                    p: 1,
                                                    borderRadius: '25px',
                                                    boxShadow: 1,
                                                    bgcolor: '#fff',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {index + 1}.{' '}
                                                <FaUserCircle
                                                    style={{
                                                        color:
                                                            userColors[index] ||
                                                            '#1C4690',
                                                    }}
                                                />{' '}
                                                {item.email}

                                                {isActive && (
                                                    <FaPencilAlt
                                                        style={{
                                                            marginLeft: 8,
                                                            fontSize: 14,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>

                            {/* Footer */}
                            <Box
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Button
                                    variant="contained"
                                    color="success"
                                    className='rounded-pill'
                                    sx={{
                                        fontSize: '12px',
                                        textTransform: "none",
                                    }}
                                    onClick={handleClose}
                                >
                                    Go Back to Signers
                                </Button>

                                {/* <Button
                                    variant="contained"
                                    color="warning"
                                    sx={{
                                        ...actionButtonSx,
                                        width: "80%",
                                        maxWidth: 220,
                                        textTransform: "none",
                                    }}
                                    onClick={handleClose}
                                >
                                    Close Previewer
                                </Button> */}
                            </Box>
                        </Grid>

                    </Grid>
                </DialogContent>
            </Dialog>
        </Dialog>


    );
}

export default SignersBoxDialog





