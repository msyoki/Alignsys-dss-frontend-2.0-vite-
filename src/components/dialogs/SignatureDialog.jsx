import * as React from 'react';
import { useState, useRef } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import { SignatureComponent } from '@syncfusion/ej2-react-inputs';
import { getComponent } from '@syncfusion/ej2-base';
import { FaTimes, FaMapMarkerAlt, FaEraser, FaPenAlt, FaFileUpload, FaMousePointer, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';
import Switch from '@mui/material/Switch';
import axios from 'axios'
import Alerts from '../Alert.jsx';
import { CircularProgress, Button } from '@mui/material';
import imageCompression from 'browser-image-compression';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import FormControl from '@mui/material/FormControl';
import * as constants from '../constants/constants.js'
import SignatureUploadMsgDialog from './SignatureUploadMsgDialog.jsx';


const pillBtn = {
    textTransform: 'none',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '999px',
    px: 1.8,
    py: 0.8,
    minHeight: 34,
    boxShadow: 'none',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
};

/* All icons rendered at a consistent size and with no extra margin —
   the gap on pillBtn handles the spacing uniformly. */
const iconStyle = { fontSize: '13px', flexShrink: 0 };


const signaturePadStyle = {
    border: '1px dashed #00509d',
    width: '100%',
    height: '55%',
    backgroundPosition: 'center',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
};

const SignaturePad = () => (
    <SignatureComponent
        strokeColor="#03045e"
        maxStrokeWidth={3}
        minStrokeWidth={0.5}
        velocity={0.7}
        id="signature"
        style={signaturePadStyle}
    />
);

const SignatureDialog = (props) => {

    const [addEmail, setAddEmail] = useState(false);
    const [addDateStamp, setAddDateStamp] = useState(false);
    const [addTimeStamp, setAddTimeStamp] = useState(false);
    const [loading, setLoading] = useState(false)

    const selectRef = useRef();

    const [selectedsignature, setSelectedSignature] = React.useState('');

    const inputRef = React.useRef(null);

    let [openalert, setOpenAlert] = useState(false)
    let [alertseverity, setAlertSeverity] = useState('info')
    let [alertmsg, setAlertMsg] = useState('')
    let [checked, setChecked] = useState(false);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [signatureToDelete, setSignatureToDelete] = useState(null);

    let [badsignature, setBadSignature] = useState(false);
    let [signatureforsaving, setSignatureForSaving] = useState('')
    const [signaturetitle, setSignatureTitle] = useState('')
    const [fullWidth, setFullWidth] = React.useState(true);
    const [maxWidth, setMaxWidth] = React.useState('md');
    const [stamp, setStamp] = React.useState(false);
    const [value, setValue] = React.useState('1');

    const handleAddEmailChange = (event) => setAddEmail(event.target.checked);

    const handleAddDateStampChange = (event) => setAddDateStamp(event.target.checked);

    const handleAddTimeStampChange = (event) => {
        setAddTimeStamp(event.target.checked);
        setAddDateStamp(event.target.checked);
    };

    const handleChange = (event, newValue) => setValue(newValue);

    let changeSavedSwitch = (e) => setChecked(e.target.checked);

    function onSelect(e) {
        if (checked && signaturetitle === '') {
            setOpenAlert(true)
            setAlertMsg('please provide a title to save the signature')
            setAlertSeverity('error')
            setTimeout(() => setOpenAlert(false), 3000)
        } else {
            props.setHasAnnotations(true)
            let signature = getComponent(document.getElementById('signature'), 'signature');

            let annotate = addTimeStamp || addDateStamp || addEmail;

            let data = JSON.stringify({
                "signature": `${signature.signatureValue}`,
                "email": `${props.signeremail}`,
                "signerGuid": `${props.signerguid}`,
                "signerEmail": addEmail,
                "signTimestamp": addTimeStamp,
                "date": addDateStamp,
                "annotate": annotate
            });

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `${constants.devApiBaseUrl}/api/annotate/`,
                headers: { 'Content-Type': 'application/json' },
                data: data
            };
            setLoading(true)
            axios.request(config)
                .then((response) => {
                    setLoading(false)
                    props.setTempSignature(response.data.signature);
                    if (response.data.signature) {
                        props.setSaveSignature(signature.signatureValue)
                        props.pdskPlaceSignature(response.data.signature, "drawn", annotate)
                        props.setAddSignature(true)
                        props.setOpenDialogSignature(false)
                        if (props.clickedSignatureBox && !props.isStamp) props.setOpenDialogSignBoxes(true)

                        if (checked === true) {
                            let saveData = JSON.stringify({
                                "email": props.signeremail,
                                "signature": signature.signatureValue,
                                "titile": signaturetitle
                            });
                            axios.request({
                                method: 'post',
                                maxBodyLength: Infinity,
                                url: `${constants.devApi2BaseUrl}/api/${props.isStamp ? 'SaveStamp' : 'SaveSignature'}/Create`,
                                headers: { 'Content-Type': 'application/json' },
                                data: saveData
                            }).then(() => setChecked(false)).catch(console.log);
                        }
                    } else {
                        console.log('Failed to place signature, please try again')
                    }
                })
                .catch(console.log);
        }
    }

    let previewSaved = async (e, selectedValue) => {
        setSelectedSignature(e.target.value);

        if (selectedValue) {
            setStamp(true);
            const sigElem = document.getElementById('signature');
            let signature = sigElem ? getComponent(sigElem, 'signature') : null;
            if (!signature) return;

            const resizeImage = (base64String) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = selectedValue;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = 250;
                        const aspectRatio = img.width / img.height;
                        let height = width / aspectRatio;
                        canvas.width = width;
                        canvas.height = height;
                        props.setUploadedHeight(height / 2)
                        props.setUploadedWidth(width / 2)
                        props.setSignatureWidth(width / 2);
                        props.setSignatureHeight(height / 2);
                        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/png'));
                    };
                });
            };

            const resizedBase64 = await resizeImage(selectedValue);
            signature.load(resizedBase64);
            setSignatureForSaving(selectedValue)
            props.setTempSignature(selectedValue)
        }
    }

    const onSelect1 = async () => {
        if (checked && signaturetitle === '') {
            setOpenAlert(true)
            setAlertMsg('please provide a title for the new signature above')
            setAlertSeverity('error')
            setTimeout(() => setOpenAlert(false), 3000)
        } else {
            let annotate = addTimeStamp || addDateStamp || addEmail;
            props.setHasAnnotations(true)
            let data = JSON.stringify({
                "signature": `${props.tempUploadedsignature}`,
                "email": `${props.signeremail}`,
                "signerGuid": `${props.signerguid}`,
                "signerEmail": addEmail,
                "signTimestamp": addTimeStamp,
                "date": addDateStamp,
                "annotate": props.isStamp ? false : annotate
            });

            setLoading(true)
            axios.request({
                method: 'post',
                maxBodyLength: Infinity,
                url: `${constants.devApiBaseUrl}/api/annotate/`,
                headers: { 'Content-Type': 'application/json' },
                data: data
            }).then((response) => {
                setLoading(false)
                props.setTempSignature(response.data.signature)
                setStamp(false)

                if (props.tempUploadedsignature) {
                    props.pdskPlaceSignature(response.data.signature, "upload", annotate)
                    props.setAddSignature(true)
                    const sigElem = document.getElementById('signature');
                    let signature = sigElem ? getComponent(sigElem, 'signature') : null;
                    if (signature && !signature.disabled && !signature.isReadOnly) signature.clear();

                    setSelectedSignature('');
                    props.setOpenDialogSignature(false)
                    if (props.clickedSignatureBox && !props.isStamp) props.setOpenDialogSignBoxes(true)

                    if (checked === true) {
                        axios.request({
                            method: 'post',
                            maxBodyLength: Infinity,
                            url: `${constants.devApi2BaseUrl}/api/${props.isStamp ? 'SaveStamp' : 'SaveSignature'}/Create`,
                            headers: { 'Content-Type': 'application/json' },
                            data: JSON.stringify({ "email": props.signeremail, "signature": signatureforsaving, "titile": signaturetitle })
                        }).then(() => setChecked(false)).catch(console.log);
                    }
                }
            }).catch(console.log);
        }
    }

    const handleClose = () => {
        setSelectedSignature('');
        props.setOpenDialogSignature(false);
    };

    let uploadsignature = async (file) => {
        const sigElem = document.getElementById('signature');
        let signature = sigElem ? getComponent(sigElem, 'signature') : null;
        if (!signature) return;

        const compressImage = async (file) => {
            try {
                return await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 500, useWebWorker: true });
            } catch (error) {
                console.error("Error compressing image:", error);
            }
        };

        const convertBase64 = (file) => new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = reject;
        });

        const resizeImage = (base64String) => new Promise((resolve) => {
            const img = new Image();
            img.src = base64String;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = 250;
                const aspectRatio = img.width / img.height;
                let height = width / aspectRatio;
                canvas.width = width;
                canvas.height = height;
                props.setUploadedHeight(height / 2)
                props.setUploadedWidth(width / 2)
                props.setSignatureWidth(width / 2);
                props.setSignatureHeight(height / 2);
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png'));
            };
        });

        const compressedFile = await compressImage(file);
        const base64 = await convertBase64(compressedFile);
        const resizedBase64 = await resizeImage(base64);
        signature.load(resizedBase64);
        setSignatureForSaving(base64)
        props.setTempSignature(base64)
    };

    function clrBtnClick() {
        props.setSigningPadDisabled(false)
        const sigElem = document.getElementById('signature');
        let signature = sigElem ? getComponent(sigElem, 'signature') : null;
        if (signature && !signature.disabled && !signature.isReadOnly) signature.clear();
        props.setTempSignature("");
    }

    const handleUploadChange = (e) => {
        const selectedFile = e.target.files[0];
        if (e.target.files && e.target.files[0]) {
            if (selectedFile) {
                const image = new Image();
                image.src = URL.createObjectURL(selectedFile);
                image.onload = () => {
                    if (image.width < 200 || image.height < 200) {
                        setBadSignature(true)
                        inputRef.current.value = '';
                    } else {
                        uploadsignature(e.target.files[0])
                        e.target.value = null
                    }
                };
            }
        }
    };

    const browseFromComputer = () => inputRef.current.click();

    let showUploadForm = () => {
        props.setSigningPadDisabled(false)
        setSelectedSignature('');
        clrBtnClick()
        props.setSigningPadDisabled(true)
    }

    let showDrawForm = () => {
        props.setSigningPadDisabled(false)
        setSelectedSignature('');
        clrBtnClick()
    }

    let showSelectForm = () => {
        clrBtnClick()
        setSelectedSignature('');
        props.setSigningPadDisabled(true)
    }

    const handleDeleteClick = (signature) => {
        setSignatureToDelete(signature);
        setOpenDeleteDialog(true);
    };

    const handleCancelDelete = () => {
        setOpenDeleteDialog(false);
        setSignatureToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (signatureToDelete) {
            if (props.signersavedstamps && Array.isArray(props.signersavedstamps)) {
                const stamp = (props.isStamp ? props.signersavedstamps : props.signersavedsignatures).find(item => item.signature === signatureToDelete);
                try {
                    await axios.post(
                        `${constants.devApi2BaseUrl}/api/${props.isStamp ? 'SaveStamp' : 'SaveSignature'}/DeleteSignature`,
                        { id: stamp.id },
                        { headers: { 'Accept': '*/*', 'Content-Type': 'application/json' } }
                    );

                    setOpenAlert(true);
                    setAlertMsg(`${props.isStamp ? 'Stamp' : 'Signature'} deleted successfully`);
                    setAlertSeverity('success');
                    setTimeout(() => setOpenAlert(false), 3000);

                    setSelectedSignature('')
                    const sigElem = document.getElementById('signature');
                    let signature = sigElem ? getComponent(sigElem, 'signature') : null;
                    if (signature) signature.load('');

                    props.isStamp ? props.getSavedStamps() : props.getSavedSignatures();
                } catch (error) {
                    console.error('Error deleting signature:', error.response ? error.response.data : error.message);
                    setOpenAlert(true);
                    setAlertMsg('Failed to delete signature. Please try again.');
                    setAlertSeverity('error');
                    setTimeout(() => setOpenAlert(false), 3000);
                }
            }
        }
        setOpenDeleteDialog(false);
        setSignatureToDelete(null);
    };

    /* ─── Reusable button groups ─────────────────────────────────────── */

    const BtnCancel = () => (
        <Button variant="outlined" sx={pillBtn} onClick={handleClose}>
            <FaTimes style={iconStyle} />
            Cancel
        </Button>
    );

    const BtnClearPad = () => (
        <Button variant="outlined" color="warning" sx={pillBtn} onClick={clrBtnClick}>
            <FaEraser style={iconStyle} />
            Clear Pad
        </Button>
    );

    const BtnPlaceDrawn = () => (
        <Button variant="contained" color="primary" id="placeDrawn" sx={pillBtn} onClick={onSelect}>
            {loading ? <CircularProgress size={13} sx={{ color: '#fff', flexShrink: 0 }} /> : <FaMapMarkerAlt style={iconStyle} />}
            Place Drawn Signature
        </Button>
    );

    const BtnPlaceUploaded = ({ label = 'Place Uploaded Signature' }) => (
        <Button variant="contained" color="primary" sx={pillBtn} onClick={onSelect1}>
            {loading ? <CircularProgress size={13} sx={{ color: '#fff', flexShrink: 0 }} /> : <FaMapMarkerAlt style={iconStyle} />}
            {label}
        </Button>
    );

    const BtnDeleteSignature = () => selectedsignature ? (
        <Button
            variant="contained"
            sx={{
                ...pillBtn,
                backgroundColor: '#ff6b6b',
                color: '#fff',
                '&:hover': { backgroundColor: '#ff5a5a' },
            }}
            onClick={() => handleDeleteClick(selectedsignature)}
        >
            <FaTrashAlt style={iconStyle} />
            Delete Signature
        </Button>
    ) : null;

    const BtnBrowse = () => (
        <Button variant="contained" color="primary" sx={pillBtn} onClick={browseFromComputer}>
            Browse from Device
        </Button>
    );



    /* ─── Shared save-switch ─────────────────────────────────────────── */
    const SaveSwitch = ({ placeholder }) => (
        <FormControl component="fieldset" variant="standard" style={{ width: '100%' }}>
            {checked && (
                <input
                    type="text"
                    onChange={(e) => setSignatureTitle(e.target.value)}
                    className="form-control form-control-sm"
                    placeholder={placeholder}
                    required
                />
            )}
            <FormGroup style={{ fontSize: '12px' }}>
                <FormControlLabel
                    label={<span style={{ fontSize: '12px' }}>Save {props.isStamp ? 'Stamp' : 'Signature'}?</span>}
                    control={<Switch checked={checked} onChange={changeSavedSwitch} inputProps={{ 'aria-label': 'controlled' }} />}
                />
            </FormGroup>
        </FormControl>
    );

    /* ─── Shared select dropdown ─────────────────────────────────────── */
    const SavedSelect = ({ items, onClickFetch }) => (
        <FormControl variant="filled" style={{ width: '100%' }}>
            <select
                ref={selectRef}
                value={selectedsignature}
                onClick={onClickFetch}
                onChange={(e) => previewSaved(e, e.target.value)}
                className="form-control form-control-md form-select"
            >
                {items ? (
                    <>
                        <option value="" style={{ fontSize: '13px' }} className="text-muted" disabled>
                            {items.length > 0 ? 'Please select' : `No saved ${props.isStamp ? 'stamps' : 'signatures'}`}
                        </option>
                        {items.map((s, i) => (
                            <option key={i} value={s.signature} style={{ fontSize: '14px' }}>{s.title}</option>
                        ))}
                    </>
                ) : null}
            </select>
        </FormControl>
    );

    /* ─── Upload file input (hidden) ─────────────────────────────────── */
    const HiddenFileInput = () => (
        <input
            ref={inputRef}
            type="file"
            id="file-upload-form"
            multiple={false}
            accept="image/png"
            onChange={handleUploadChange}
            hidden
        />
    );

    const uploadHint = (
        <p style={{ fontSize: '11px' }}>
            ( Kindly upload an image with dimensions of at least 200 width x 200 height )
        </p>
    );

    /* ─── btn-row helper ─────────────────────────────────────────────── */
    const BtnRow = ({ children }) => (
        <div className="d-flex justify-content-center flex-wrap" style={{ gap: '8px', marginTop: '8px' }}>
            {children}
        </div>
    );

    return (
        <>
            <Dialog
                open={props.opendialogsignature}
                keepMounted
                fullWidth={fullWidth}
                maxWidth={maxWidth}
                onClose={handleClose}
                aria-describedby="alert-dialog-slide-description"
                className="text-center"
                style={{ height: '100%' }}
            >
                <div style={{ overflowX: 'hidden' }}>
                    {props.isStamp ? (
                        /* ══════════════ STAMP MODE ══════════════ */
                        <TabContext value={value}>
                            <DialogTitle className="text-center" style={{ backgroundColor: '#ffff', color: '#5555' }}>
                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="text-center">
                                    <TabList onChange={handleChange} aria-label="stamp tabs">
                                        <Tab label="Upload" selected value="1" style={{ fontSize: '13px' }} onClick={showUploadForm} />
                                        <Tab label="Select" value="2" style={{ fontSize: '13px' }} onClick={showSelectForm} />
                                    </TabList>
                                </Box>
                            </DialogTitle>

                            <DialogContent className="row text-center">
                                <div className="col-md-8 col-sm-12">
                                    <SignatureUploadMsgDialog
                                        signatureWidth={props.uploadedsignaturewidth}
                                        signatureHeight={props.uploadedsignatureheight}
                                        badsignature={badsignature}
                                        setBadSignature={setBadSignature}
                                    />
                                    <SignaturePad />

                                    <TabPanel value="1">
                                        <SaveSwitch placeholder="Enter stamp title here" />
                                        <BtnRow>
                                            {props.tempUploadedsignature !== '' && !stamp ? (
                                                <>
                                                    <BtnPlaceDrawn />
                                                    <BtnClearPad />
                                                    <BtnCancel />
                                                </>
                                            ) : (
                                                <BtnCancel />
                                            )}
                                        </BtnRow>
                                    </TabPanel>

                                    <TabPanel value="2">
                                        <BtnRow>
                                            {props.tempUploadedsignature !== '' && stamp ? (
                                                <>
                                                    <BtnPlaceUploaded label="Place Selected Stamp" />
                                                    <BtnCancel />
                                                </>
                                            ) : (
                                                <BtnCancel />
                                            )}
                                        </BtnRow>
                                    </TabPanel>
                                </div>

                                <div className="col-md-4 col-sm-12 shadow-lg">
                                    <TabPanel value="2">
                                        <p className="text-center text-muted" style={{ fontWeight: 200, fontSize: '14px' }}>
                                            <FaMousePointer style={{ ...iconStyle, fontSize: '22px', marginRight: '6px', verticalAlign: 'middle' }} />
                                            Select Stamp
                                        </p>
                                        <div className="input-group text-center">
                                            <SavedSelect items={props.signersavedstamps} />
                                        </div>
                                    </TabPanel>

                                    <TabPanel value="1">
                                        <HiddenFileInput />
                                        <p className="text-center text-muted" style={{ fontWeight: 200, fontSize: '14px' }}>
                                            <FaFileUpload style={{ ...iconStyle, fontSize: '22px', marginRight: '6px', verticalAlign: 'middle' }} />
                                            Upload Stamp
                                        </p>
                                        <BtnRow>
                                            <BtnBrowse />
                                        </BtnRow>
                                        {uploadHint}
                                    </TabPanel>

                                    <Alerts alertseverity={alertseverity} alertmsg={alertmsg} openalert={openalert} setOpenAlert={setOpenAlert} />
                                </div>
                            </DialogContent>
                        </TabContext>
                    ) : (
                        /* ══════════════ SIGNATURE MODE ══════════════ */
                        <TabContext value={value}>
                            <DialogTitle className="text-center" style={{ backgroundColor: '#ffff', color: '#5555' }}>
                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="text-center">
                                    <TabList onChange={handleChange} aria-label="signature tabs">
                                        <Tab label="Draw"   value="1" style={{ fontSize: '13px' }} onClick={showDrawForm} />
                                        <Tab label="Upload" value="2" style={{ fontSize: '13px' }} onClick={showUploadForm} />
                                        <Tab label="Select" value="3" style={{ fontSize: '13px' }} onClick={showSelectForm} />
                                    </TabList>
                                </Box>
                            </DialogTitle>

                            <DialogContent className="text-center">
                                <div className="row">
                                    <div className="col-md-8 col-sm-12">
                                        <SignatureUploadMsgDialog
                                            signatureWidth={props.uploadedsignaturewidth}
                                            signatureHeight={props.uploadedsignatureheight}
                                            badsignature={badsignature}
                                            setBadSignature={setBadSignature}
                                        />
                                        <SignaturePad />

                                        {/* ── Draw tab ── */}
                                        <TabPanel value="1">
                                            <SaveSwitch placeholder="Enter signature title here" />
                                            <BtnRow>
                                                <BtnPlaceDrawn />
                                                <BtnClearPad />
                                                <BtnCancel />
                                            </BtnRow>
                                        </TabPanel>

                                        {/* ── Upload tab ── */}
                                        <TabPanel value="2">
                                            <SaveSwitch placeholder="Enter signature title here" />
                                            <BtnRow>
                                                {props.tempUploadedsignature !== '' && stamp ? (
                                                    <>
                                                        <BtnCancel />
                                                        <BtnPlaceUploaded />
                                                    </>
                                                ) : (
                                                    <BtnCancel />
                                                )}
                                            </BtnRow>
                                        </TabPanel>

                                        {/* ── Select tab ── */}
                                        <TabPanel value="3">
                                            <BtnRow>
                                                {props.tempUploadedsignature !== '' && selectedsignature ? (
                                                    <>
                                                        <BtnPlaceUploaded label="Place Selected Signature" />
                                                        <BtnCancel />
                                                        <BtnDeleteSignature />
                                                    </>
                                                ) : (
                                                    <BtnCancel />
                                                )}
                                            </BtnRow>
                                        </TabPanel>
                                    </div>

                                    <div className="col-md-4 col-sm-12 shadow-lg">
                                        <TabPanel value="1">
                                            <p className="text-center text-muted" style={{ fontWeight: 200, fontSize: '14px' }}>
                                                <FaPenAlt style={{ ...iconStyle, fontSize: '22px', marginRight: '6px', verticalAlign: 'middle' }} />
                                                Draw Signature
                                            </p>
                                        </TabPanel>

                                        <TabPanel value="2">
                                            <HiddenFileInput />
                                            <p className="text-center text-muted" style={{ fontWeight: 200, fontSize: '14px' }}>
                                                <FaFileUpload style={{ ...iconStyle, fontSize: '22px', marginRight: '6px', verticalAlign: 'middle' }} />
                                                Upload Signature
                                            </p>
                                            <BtnRow>
                                                <BtnBrowse />
                                            </BtnRow>
                                            {uploadHint}
                                        </TabPanel>

                                        <TabPanel value="3">
                                            <p className="text-center text-muted" style={{ fontWeight: 200, fontSize: '14px' }}>
                                                <FaMousePointer style={{ ...iconStyle, fontSize: '22px', marginRight: '6px', verticalAlign: 'middle' }} />
                                                Select Signature
                                            </p>
                                            <div className="input-group my-2">
                                                <FormControl variant="filled" style={{ width: '100%' }}>
                                                    <select
                                                        ref={selectRef}
                                                        value={selectedsignature}
                                                        onFocus={() => props.getSavedSignatures()}
                                                        onChange={(e) => previewSaved(e, e.target.value)}
                                                        className="form-control form-control-md form-select"
                                                    >
                                                        {props.signersavedsignatures ? (
                                                            <>
                                                                <option value="" style={{ fontSize: '13px' }} className="text-muted" disabled>
                                                                    {props.signersavedsignatures.length > 0 ? 'Please select' : 'No saved signatures'}
                                                                </option>
                                                                {props.signersavedsignatures.map((s, i) => (
                                                                    <option key={i} value={s.signature} style={{ fontSize: '14px' }}>{s.title}</option>
                                                                ))}
                                                            </>
                                                        ) : null}
                                                    </select>
                                                </FormControl>
                                            </div>
                                        </TabPanel>

                                        <Alerts alertseverity={alertseverity} alertmsg={alertmsg} openalert={openalert} setOpenAlert={setOpenAlert} />

                                        <small className="my-1" style={{ color: '#00509d' }}>Signature Customization</small>
                                        <div className="d-flex justify-content-center">
                                            <FormGroup className="text-center">
                                                <FormControlLabel
                                                    style={{ fontSize: '12px' }}
                                                    control={<Checkbox checked={addEmail} onChange={handleAddEmailChange} />}
                                                    label={<span style={{ fontSize: '12px' }}>Add email stamp</span>}
                                                />
                                                <FormControlLabel
                                                    style={{ fontSize: '12px' }}
                                                    control={<Checkbox checked={addTimeStamp} onChange={handleAddTimeStampChange} />}
                                                    label={<span style={{ fontSize: '12px' }}>Add both date & time stamp</span>}
                                                />
                                            </FormGroup>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </TabContext>
                    )}
                </div>
            </Dialog>

            {/* ── Delete confirmation dialog ── */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCancelDelete}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle
                    id="delete-dialog-title"
                    style={{ color: '#d32f2f', fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em' }}
                >
                    <FaExclamationTriangle style={{ ...iconStyle, marginRight: '8px', verticalAlign: 'middle' }} />
                    Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText
                        id="delete-dialog-description"
                        style={{ fontSize: '15px', lineHeight: '1.6', color: '#424242', marginTop: '4px' }}
                    >
                        Are you sure you want to delete this saved {props.isStamp ? 'stamp' : 'signature'}?
                        This action is <strong style={{ fontWeight: 600, color: '#d32f2f' }}>irreversible</strong> and cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions style={{ padding: '16px 24px' }}>
                    <Button
                        onClick={handleCancelDelete}
                        variant="outlined"
                        sx={{ ...pillBtn, fontSize: '14px' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        sx={pillBtn}
                        startIcon={<FaTrashAlt style={iconStyle} />}
                    >
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default SignatureDialog