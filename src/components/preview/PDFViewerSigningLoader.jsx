import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import SignatureDialog from "../dialogs/SignatureDialog";
import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import { FaSignature, FaStamp, FaMapMarkerAlt, FaPenNib, FaBan, FaTimes } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import ConfirmCompleteDialog from "../dialogs/ConfirmCompleteDialog";
import SigningOptionDialog from "../dialogs/SigningOptionDialog";
import OtpDialog from "../OtpDialog";
import { TiArrowBack } from "react-icons/ti";


// Custom compoenent imports

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import '../../styles/CustomViewer.css';
import LoadingDialog from "../loaders/LoadingDialog";
import PDFViewerSigning from "./PDFViewerSigning";
// Custom compoenent end


function PDFViewerSigningLoader(props) {
    const navigate = useNavigate();
    // const containerRef = useRef(null);
    const [textAnnotation, setTextAnnotations] = useState([])
    const [isStamp, setIsStamp] = useState(false)
    const [openSignatureOptions, setOpenSignatureOptions] = React.useState(false);
    const [hasSignature, setSignatureExists] = useState(false)

    // custom viewer constants start 
    const [numPages, setNumPages] = useState(0);
    const [annotations, setAnnotations] = useState([]);
    const [selectedTool, setSelectedTool] = useState(null);
    const [customImage, setCustomImage] = useState(null);
    const [loading, setLoading] = useState(true); // New state for document loading
    const [pagesLoaded, setPagesLoaded] = useState(0); // Track loaded pages
    const [signatureHasAnnotations, setSignatureHasAnnotations] = useState(false)
    const [annotatingDocument, setAnnotatingDocument] = useState(false)
    const [clickedPlaceAgain, setClickedPlaceAgain] = useState(false)
    const [landscape, setLandscape] = useState(false)
    const [isRotated, setIsRotated] = useState(false);
    const [pendingMultipage, setPendingMultipage] = useState(false);
    const [loadingPercentage, setLoadingPercentage] = useState(0);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [openDialogSignBoxes, setOpenDialogSignBoxes] = useState(false)
    const [pageDimensions, setPageDimensions] = useState({})


    // Add window resize listener
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Configure PDF.js worker
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

    const updateAnnotations = (updatedAnnotations) => {
        viewAnnotations()
        setAnnotations(updatedAnnotations);
        // saveAnnotations(updatedAnnotations);
        // logAnnotations(updatedAnnotations);
    };

    const viewAnnotations = () => {

        const imageAnnotations = [];
        const textAnnotations = [];

        const hexToRgb = (hex) => {
            // Remove the '#' if it exists
            hex = hex.replace(/^#/, "");

            // Convert shorthand hex (e.g., #abc) to full format (e.g., #aabbcc)
            if (hex.length === 3) {
                hex = hex.split("").map(char => char + char).join("");
            }

            // Convert hex to RGB
            const bigint = parseInt(hex, 16);
            const r = (bigint >> 16) & 255;  // Extract red component
            const g = (bigint >> 8) & 255;   // Extract green component
            const b = bigint & 255;          // Extract blue component

            return { r, g, b, transparent: false };
        };

        annotations.map(annotation => {
            // Adjust structure for text or image types

            if (annotation.type === 'text') {
                let fontColor = hexToRgb(annotation.color);
                if (annotation.content !== "Double click to edit text") {


                    let formattedAnnotation = {
                        id: `${annotation.id}`,
                        type: annotation.type,
                        text: {
                            value: annotation.content,
                            format: "plain"
                        },
                        pageIndex: annotation.pageNumber - 1,
                        pageWidth: annotation.pageWidth,
                        pageHeight: annotation.pageHeight,
                        font: "Helvetica",
                        fontColor: fontColor,
                        fontSize: 10,

                        boundingBox: {
                            left: annotation.x,
                            top: annotation.y,
                            width: 0,
                            height: 0,
                        },
                        opacity: 1,
                        isBold: false,
                        isItalic: false,
                        horizontalAlign: "left",
                        verticalAlign: "top",
                        callout: null,
                        borderStyle: null,
                        borderWidth: null,
                        borderColor: null,
                        isFitting: true,
                        lineHeightFactor: null
                    };
                    textAnnotations.push(formattedAnnotation);
                }
            } else if (annotation.type === 'image') {
                // console.log(`PgWidth: ${annotation.pageWidth}`)
                // console.log(`PgHeight: ${annotation.pageHeight}`)
                let formattedAnnotation = {
                    id: `${annotation.id}`,
                    type: annotation.type,
                    description: annotation.isSignature ? "Signature" : "Stamp",
                    isSignature: annotation.isSignature,
                    locked: false,
                    contentType: 'image/png',
                    signature: annotation.src,
                    pageIndex: annotation.pageNumber - 1,
                    pageWidth: annotation.pageWidth,
                    pageHeight: annotation.pageHeight,
                    boundingBox: {
                        left: annotation.x,
                        top: annotation.y,
                        width: annotation.width,
                        height: annotation.height,
                    },

                };
                imageAnnotations.push(formattedAnnotation);

            }
        });

        const checkSignatureExists = () => {
            const signatureExists = annotations.some(annotation => annotation.isSignature === true);
            setSignatureExists(signatureExists);
        };

        checkSignatureExists()


        setTextAnnotations(textAnnotations)
        props.setAnnotationList(imageAnnotations)
        // console.log('Image Annotations:', imageAnnotations);
        // console.log('Text Annotations:', textAnnotations);
    };

    function handleSign() {
        setPendingMultipage(false);
        const signatureExists = annotations.some(annotation => annotation.isSignature === true);
        if (signatureExists) {
            // Clear all signature annotations before proceeding
            const nonSignatureAnnotations = annotations.filter(a => !a.isSignature);
            setAnnotations(nonSignatureAnnotations);
            setSignatureExists(false);
        }
        setIsStamp(false);
        // console.log(props.signerAnnotations);

        if (props.signerAnnotations && props.signerAnnotations.length > 0) { // Check if the list is defined and not empty
            props.setClickedSignatureBox(true);
            props.SignSignatureBoxes();
        } else {
            props.newSignature();
            setOpenSignatureOptions(true);
            props.setSinglepage(false);
            props.setMultipage(false);
            props.setAllPgebtnCssClass('e-custom-light');
            props.setOnePgebtnCssClass('e-custom-light');
            setOpenSignatureOptions(true);
        }
    }




    async function handleStamp() {
        setPendingMultipage(false);
        const signatureExists = annotations.some(annotation => annotation.isSignature === true);
        if (signatureExists) {
            setSignatureExists(true);
        }

        setIsStamp(true);
        props.newSignature();
        props.setSinglepage(false);
        props.setMultipage(false);
        props.setAllPgebtnCssClass('e-custom-light');
        props.setOnePgebtnCssClass('e-custom-light');
        setOpenSignatureOptions(true);
    }

    const completeSigning = async () => {
        if (props.authenticateUser) {
            viewAnnotations()
            props.setFileLocked(true)
            props.setOpenDialogAuthGuest(true)
        } else {
            viewAnnotations()
            props.setOpenConfirmCompleteDialog(true);
        }



    };

    let placeSignature = async (combinedBase64String, signatureType, annotations) => {

        setClickedPlaceAgain(false)
        props.setPlacedSignature(combinedBase64String)

        // if (props.authenticateUser) {
        //     props.setFileLocked(true)
        //     props.setOpenDialogAuthGuest(true)
        // }


        // Set signature type and base64 string

        setSelectedTool('image')
        // console.log(combinedBase64String)
        setCustomImage(combinedBase64String)
        if (annotations) {
            setSignatureHasAnnotations(true)
        }
        else {
            setSignatureHasAnnotations(false)
        }


    };

    const placeSignatureAgain = async () => {
        setClickedPlaceAgain(true)
        props.setPlacedSignature(props.tempUploadedsignature)

        // if (props.authenticateUser) {
        //     props.setFileLocked(true)
        //     props.setOpenDialogAuthGuest(true)
        // }

        setSelectedTool('image')
        setCustomImage(props.tempUploadedsignature)
        viewAnnotations()


    }

    return (
        <>
            <LoadingDialog opendialogloading={annotatingDocument} msg={`Updating Document`} />
            <LoadingDialog percentage={loadingPercentage} opendialogloading={loading} msg={`Loading ${numPages} pages...`} />
            <OtpDialog
                time={props.time}
                setTime={props.setTime}
                setResetTimer={props.setResetTimer}
                timerClock={props.timerClock}
                alertseverity={props.alertseverity}
                alertmsg={props.alertmsg}
                openalert={props.openalert}
                maskedotpphone={props.maskedotpphone}
                otpphone={props.currentsignerphone}
                trialcount={props.trialcount}
                setTrialCount={props.setTrialCount}
                setAlertMsg={props.setAlertMsg}
                setAlertSeverity={props.setAlertSeverity}
                setOpenAlert={props.setOpenAlert}
                setOTP={props.setOTP}
                setOpenDialogOtp={props.setOpenDialogOtp}
                opendialogotp={props.opendialogotp}
                completeSigning={props.completeSigning}
                user={props.user}
            />

            <ConfirmCompleteDialog
                opendialogloading={props.opendialogloading}
                setOpenDialogLoading={props.setOpenDialogLoading}
                openconfirmcompletedialog={props.openconfirmcompletedialog}
                setOpenConfirmCompleteDialog={props.setOpenConfirmCompleteDialog}
                completeSigning={props.handleClickOpenDialogOtp}
                textAnnotation={textAnnotation}
                fileurl={props.fileurl}
                signerguid={props.signerguid}
                ip={props.ip}
                checkSigning={props.checkSigning}
                setOpenDialogSignature={props.setOpenDialogSignature}
                docname={props.docname}
                pagetype={props.pagetype}
                guid={props.guid}

                annotationList={props.annotationList}
                displayPercentageWaitingTime={props.displayPercentageWaitingTime}
                setAnnotatingDocument={setAnnotatingDocument}
                authenticateUser={props.authenticateUser}
                setFileLocked={props.setFileLocked}
                setOpenDialogAuthGuest={props.setOpenDialogAuthGuest}




            />
            <SigningOptionDialog
                open={openSignatureOptions}
                setOpen={setOpenSignatureOptions}
                onepagebtncssclass={props.onepagebtncssclass}
                allpagebtncssclass={props.allpagebtncssclass}
                signonePage={props.signonePage}
                signAllpages={props.signAllpages}
                isStamp={isStamp}
            />

            <SignatureDialog
                getSavedSignatures={props.getSavedSignatures}
                getSavedStamps={props.getSavedStamps}

                opendialogsignature={props.opendialogsignature}
                setOpenDialogSignature={props.setOpenDialogSignature}
                user={props.user}
                savedsignature={props.savedsignature}
                setSaveSignature={props.setSaveSignature}
                setAddSignature={props.setAddSignature}
                tempUploadedsignature={props.tempUploadedsignature}
                setTempSignature={props.setTempSignature}
                signersavedsignatures={props.signersavedsignatures}
                signersavedstamps={props.signersavedstamps}
                signeremail={props.currentsignerEmail}
                pagetype={props.pagetype}
                isstamp={props.isstampuload}
                signingpaddidabled={props.signingpaddidabled}
                setSigningPadDisabled={props.setSigningPadDisabled}
                signerguid={props.signerguid}
                setSignatureHeight={props.setSignatureHeight}
                setSignatureWidth={props.setSignatureWidth}
                signaturewidth={props.signaturewidth}
                signatureheight={props.signatureheight}
                uploadedsignatureheight={props.uploadedsignatureheight}
                uploadedsignaturewidth={props.uploadedsignaturewidth}
                setUploadedHeight={props.setUploadedHeight}
                setUploadedWidth={props.setUploadedWidth}
                setHasAnnotations={props.setHasAnnotations}

                pdskPlaceSignature={placeSignature}
                isStamp={isStamp}
                setOpenDialogSignBoxes={setOpenDialogSignBoxes}
                clickedSignatureBox={props.clickedSignatureBox}
            />

            <div className="row bg-white shadow-lg p-2 align-items-center">
                {(() => {
                    const pillBtn = {
                        textTransform: 'none',
                        borderRadius: '999px',
                        px: { xs: 1.5, sm: 1.8 },
                        py: { xs: 0.6, sm: 0.8 },
                        fontSize: { xs: '11px', sm: '12px' },
                        fontWeight: 500,
                        minHeight: 36,
                        whiteSpace: 'nowrap',
                        boxShadow: 'none',
                        gap: 0.8,
                        transition: 'all 0.2s ease',
                        '& .MuiButton-startIcon': {
                            marginRight: '4px',
                        },
                        '&:hover': {
                            boxShadow: 'none',
                            transform: 'translateY(-1px)',
                        },
                    };

                    const iconSize = 13;

                    return (
                        <>
                            {/* Signature / Stamp */}
                            <div className="col-12 col-md-6 d-flex flex-wrap justify-content-center justify-content-md-start gap-2 mb-2 mb-md-0">

                                {/* Primary actions first (most important on mobile) */}
                                {props.tempUploadedsignature ? (
                                    <>
                                        <Tooltip title="Place signature on current page">
                                            <Button
                                                variant="contained"
                                                color={hasSignature ? 'warning' : 'primary'}
                                                onClick={handleSign}
                                                startIcon={<FaSignature size={iconSize} />}
                                                sx={pillBtn}
                                            >
                                                {hasSignature ? 'Replace Signature' : 'Sign'}
                                            </Button>
                                        </Tooltip>

                                        <Tooltip title="Place stamp on current page">
                                            <Button
                                                variant="contained"
                                                onClick={handleStamp}
                                                startIcon={<FaStamp size={iconSize} />}
                                                sx={pillBtn}
                                            >
                                                Stamp
                                            </Button>
                                        </Tooltip>

                                        {/* Secondary action LAST on mobile */}
                                        {!props.clickedSignatureBox &&
                                            !pendingMultipage &&
                                            hasSignature && (
                                                <Tooltip title="Place again">
                                                    <Button
                                                        variant="outlined"
                                                        color="inherit"
                                                        onClick={placeSignatureAgain}
                                                        startIcon={<FaMapMarkerAlt size={iconSize} />}
                                                        sx={pillBtn}
                                                    >
                                                        Place {isStamp ? 'Stamp' : 'Signature'} Again
                                                    </Button>
                                                </Tooltip>
                                            )}
                                    </>
                                ) : (
                                    <>
                                        <Tooltip title="Place signature on current page">
                                            <Button
                                                variant="contained"
                                                onClick={handleSign}
                                                startIcon={<FaSignature size={iconSize} />}
                                                sx={pillBtn}
                                            >
                                                Sign
                                            </Button>
                                        </Tooltip>

                                        <Tooltip title="Place stamp on current page">
                                            <Button
                                                variant="contained"
                                                onClick={handleStamp}
                                                startIcon={<FaStamp size={iconSize} />}
                                                sx={pillBtn}
                                            >
                                                Stamp
                                            </Button>
                                        </Tooltip>
                                    </>
                                )}
                            </div>

                            {/* Complete (make it visually centered & dominant on mobile) */}
                            <div className="col-12 col-md-2 d-flex justify-content-center mb-2 mb-md-0">
                                {hasSignature && !pendingMultipage && (
                                    <Tooltip title="Complete signing">
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="success"
                                            onClick={completeSigning}
                                            startIcon={<FaPenNib size={iconSize} />}
                                            sx={{
                                                ...pillBtn,
                                                fontWeight: 700,
                                                maxWidth: { xs: 150, md: 150 },
                                            }}
                                        >
                                            Finish
                                        </Button>
                                    </Tooltip>
                                )}
                            </div>

                            {/* Void / Cancel (secondary cluster grouped better) */}
                            <div className="col-12 col-md-4 d-flex flex-wrap justify-content-center justify-content-md-end gap-2">

                                <Tooltip title="Void the document">
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={props.setOpenDialogVoid}
                                        startIcon={<FaBan size={iconSize} />}
                                        sx={pillBtn}
                                    >
                                        Decline
                                    </Button>
                                </Tooltip>

                                {props.user && (
                                    <Tooltip title="Cancel">
                                        <Button
                                            variant="outlined"
                                            color="warning"
                                            onClick={() => navigate('/')}
                                            startIcon={<TiArrowBack size={iconSize} />}
                                            sx={pillBtn}
                                        >
                                            Back Home
                                        </Button>
                                    </Tooltip>
                                )}
                            </div>
                        </>
                    );
                })()}
            </div>


            <PDFViewerSigning hasSignature={hasSignature} pendingMultipage={pendingMultipage} signerAnnotations={props.signerAnnotations} setLoadingPercentage={setLoadingPercentage} setPendingMultipage={setPendingMultipage} isRotated={isRotated} setIsRotated={setIsRotated} setLandscape={setLandscape} clickedPlaceAgain={clickedPlaceAgain} signatureHasAnnotations={signatureHasAnnotations} multipage={props.multipage} setCustomImage={setCustomImage} customImage={customImage} setSelectedTool={setSelectedTool} selectedTool={selectedTool} setAnnotations={setAnnotations} annotations={annotations} updateAnnotations={updateAnnotations} isStamp={isStamp} setAnnotationList={props.setAnnotationList} setTextAnnotations={setTextAnnotations} setSignatureExists={setSignatureExists} setLoading={setLoading} pagesLoaded={pagesLoaded} setNumPages={setNumPages} setPagesLoaded={setPagesLoaded} document={props.document} handleSign={handleSign}
                setClickedSignatureBox={props.setClickedSignatureBox}
                SignSignatureBoxes={props.SignSignatureBoxes} clickedSignatureBox={props.clickedSignatureBox} openDialogSignBoxes={openDialogSignBoxes} setOpenDialogSignBoxes={setOpenDialogSignBoxes} />







        </>
    );
}

PDFViewerSigningLoader.propTypes = {
    document: PropTypes.string.isRequired,
};

export default PDFViewerSigningLoader;
