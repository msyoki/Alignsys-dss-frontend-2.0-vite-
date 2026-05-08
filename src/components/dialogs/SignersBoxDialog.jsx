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
        <div>

            <Dialog fullScreen open={props.open} onClose={handleClose} TransitionComponent={Transition}>
                <DialogContent >
                    <Box className='bg-dark' sx={{ margin: '0', padding: '0', display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', overflow: 'hidden' }}>
                        {/* Toggle Button for Mobile */}
                        {isMobile && (
                            <Button
                                onClick={toggleSidebar}
                                variant="contained"
                                sx={{
                                    position: 'fixed',
                                    top: '10px',
                                    left: '20px',
                                    zIndex: 1000,
                                    backgroundColor: '#1C4690',
                                }}
                            >
                                {sidebarOpen ? 'Hide Details' : 'Show Details'}
                            </Button>
                        )}

                        {/* PDF Viewer Content */}
                        <Box

                            sx={{
                                flex: sidebarOpen ? (isMobile ? '1' : isTablet ? 2 : 3) : 1,
                                mt: isMobile && sidebarOpen ? '50vh' : 0,
                                backgroundColor: '#666666'
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
                        </Box>

                        {/* Sidebar */}
                        {sidebarOpen && (
                            <div
                                className={`${isMobile ? 'col-12' : isTablet ? 'col-md-3' : 'col-lg-3'} text-center shadow-sm`}
                                style={{
                                    borderRadius: '0',
                                    borderTop: 'none',
                                    boxShadow: 'none',
                                    position: isMobile ? 'fixed' : 'relative',
                                    zIndex: isMobile ? 999 : 1,
                                    backgroundColor: 'white',
                                    height: isMobile ? '100vh' : 'auto',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {/* Header */}
                                <div
                                    className="card-header btn text-white shadow-lg"
                                    style={{
                                        backgroundColor: '#2757aa',
                                        width: '100%',
                                        margin: 0,
                                        padding: '0.5rem',
                                        border: '2px solid white', // 👈 Add this line
                                        borderRadius: '0.25rem', // Optional: smooth corners
                                    }}
                                >
                                    <p style={{ fontSize: isMobile ? '10px' : '12px', margin: 0 }}>ORDER OF SIGNERS</p>
                                    <p style={{ fontSize: isMobile ? '10px' : '12px', margin: 0 }}>
                                        Number of signers ({props.signers.length})
                                    </p>
                                </div>
                                <div className='p-3' style={{ backgroundColor: '#e9f2ff', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                                    <span style={{ color: '#2757aa' }}>Instructions</span>: Select a user from the list below, then click on the document to mark where their signature box should appear.
                                </div>

                                {/* Scrollable Signer List */}
                                <div style={{ flex: 1, overflowY: 'auto' }}>

                                    <ul style={{ listStyle: 'none' }} className='bg-white p-2'>
                                        {props.signers.map((item, index) => (
                                            <li
                                                key={index}
                                                onClick={() => handleSelectUser(index, item, true)}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: '#fff',
                                                    borderRadius: '25px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '4px',

                                                }}
                                            >
                                                {/* Flag icon */}
                                                <FaCheckSquare
                                                    className="mx-2"
                                                    style={{
                                                        color:
                                                            props.selectedUser?.id === index && addSignatureBox
                                                                ? userColors[index]
                                                                : '#ccc',
                                                        fontSize: '20px',
                                                        minWidth: '16px',
                                                    }}
                                                />

                                                {/* Signer button */}
                                                <small
                                                    className="btn m-1 shadow-lg"
                                                    style={{
                                                        fontSize: '12.5px',
                                                        borderRadius: '25px',
                                                        backgroundColor: 'white',
                                                        flex: 1,
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    {index + 1}.{" "}
                                                    <FaUserCircle
                                                        className="m-1"
                                                        style={{ color: userColors[index] || "#1C4690" }}
                                                    />{" "}

                                                    <small className="mx-1">{item.email}</small>

                                                    {props.selectedUser?.id === index && addSignatureBox && (

                                                        <FaPencilAlt style={{ fontSize: '14px' }} />

                                                    )}
                                                </small>

                                            </li>
                                        ))}
                                    </ul>

                                </div>

                                {/* Sticky Bottom Buttons */}
                                <div className="p-3" style={{ marginTop: 'auto' }}>

                                    <Button

                                        variant='contained'
                                        color='success'
                                        className='m-2 p-2'
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
                                        onClick={handleClose}
                                        disabled={false}
                                    >
                                        <span className='mx-2'> Back to Signers Window</span>
                                    </Button>
                                    <Button
                                        variant='contained'
                                        color='warning'
                                        className='m-2 p-2'
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
                                        onClick={handleClose}
                                        disabled={false}
                                    >
                                        <span className='mx-2'>Close Previewer</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                    </Box>
                </DialogContent>
            </Dialog>

        </div>
    );
}

export default SignersBoxDialog