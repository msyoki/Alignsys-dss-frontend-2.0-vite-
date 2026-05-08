import * as React from 'react';
import { useState, useRef } from 'react';

import Dialog from '@mui/material/Dialog';

import DialogContent from '@mui/material/DialogContent';

import DialogTitle from '@mui/material/DialogTitle';
import { SignatureComponent } from '@syncfusion/ej2-react-inputs';
import { getComponent } from '@syncfusion/ej2-base';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import Switch from '@mui/material/Switch';
import axios from 'axios'
import Alerts from './Alert';
import { CircularProgress } from '@mui/material';
import imageCompression from 'browser-image-compression';

//Tabs imports
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

//checkbox
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import FormControl from '@mui/material/FormControl';
import * as constants from '../components/constants/constants'
import SignatureUploadMsgDialog from './SignatureUploadMsgDialog';


const SignatureDialog = (props) => {

    const [addEmail, setAddEmail] = useState(true);
    const [addDateStamp, setAddDateStamp] = useState(true);
    const [addTimeStamp, setAddTimeStamp] = useState(true);
    const [loading, setLoading] = useState(false)

    const selectRef = useRef();

    const [selectedsignature, setSelectedSignature] = React.useState('');

    const inputRef = React.useRef(null);

    let [openalert, setOpenAlert] = useState(false)
    let [alertseverity, setAlertSeverity] = useState('info')
    let [alertmsg, setAlertMsg] = useState('')
    let [checked, setChecked] = useState(false);

    // let [signatureWidth,setSignatureWidth]=useState('');
    // let [signatureHeight,setSignatureHeight]=useState('');

    let [badsignature, setBadSignature] = useState(false);
    let [signatureforsaving, setSignatureForSaving] = useState('')
    const [signaturetitle, setSignatureTitle] = useState('')
    const [fullWidth, setFullWidth] = React.useState(true);
    const [maxWidth, setMaxWidth] = React.useState('md');
    const [stamp, setStamp] = React.useState(false);
    const [value, setValue] = React.useState('1');

    // Handler functions for checkbox changes
    const handleAddEmailChange = (event) => {
        setAddEmail(event.target.checked);
    };

    const handleAddDateStampChange = (event) => {
        setAddDateStamp(event.target.checked);
    };

    const handleAddTimeStampChange = (event) => {
        setAddTimeStamp(event.target.checked);
        setAddDateStamp(event.target.checked);
    };
   
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    let changeSavedSwitch = (e) => {
        setChecked(e.target.checked);

    }

    function onSelect(e) {
   

        if (checked && signaturetitle === '') {
            setOpenAlert(true)
            setAlertMsg('please provide a title to save the signature')
            setAlertSeverity('error')
            setTimeout(
                function () {
                    setOpenAlert(false);
                }, 3000)
        }
        else {

            props.setHasAnnotations(true)
            let signature = getComponent(document.getElementById('signature'), 'signature');


            let annotate = false
            if (addTimeStamp || addDateStamp || addEmail) {

                annotate = true
            }

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
                // url: `${constants.devApi2BaseUrl}/api/Timestamp`,
                url: `${constants.devApiBaseUrl}/api/annotate/`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: data
            };
            setLoading(true)
            axios.request(config)
                .then((response) => {
                    // console.log(JSON.stringify(response.data));
                    setLoading(false)
                    props.setTempSignature(response.data.signature);
                    if (response.data.signature) {
                        props.setSaveSignature(signature.signatureValue)
                        let signaturetype = "drawn"
                        props.pdskPlaceSignature(response.data.signature, signaturetype, annotate)
                       
                        props.setAddSignature(true)
                        props.setOpenDialogSignature(false)
                        if(props.clickedSignatureBox && !props.isStamp){
                            props.setOpenDialogSignBoxes(true)
                        }
                
                        // signature.save(text, 'Signature');
                        if (checked === true) {
                            let data = JSON.stringify({
                                "email": props.signeremail,
                                "signature": signature.signatureValue,
                                "titile": signaturetitle
                            });

                            let config = {
                                method: 'post',
                                maxBodyLength: Infinity,
                                url: `${constants.devApi2BaseUrl}/api/${props.isStamp ? 'SaveStamp' : 'SaveSignature'}/Create`,
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                data: data
                            };

                            axios.request(config)
                                .then((response) => {
                                    //console.log(JSON.stringify(response.data));
                                    setChecked(false)
                                })
                                .catch((error) => {
                                    console.log(error);
                                });

                        }
                    }
                    else {
                        console.log('Failed to place signature, please try again')
                        console.log(config)
                    }
                })
                .catch((error) => {
                    console.log(error);
                    // console.log(data)
                });



        }
   

    }

    let previewSaved = async (e, selectedValue) => {
        setSelectedSignature(e.target.value);

        if (selectedValue) {
            let signature = getComponent(document.getElementById('signature'), 'signature');



            const resizeImage = (base64String) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = selectedValue;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = 250;
                        let height = 500;
                        const aspectRatio = img.width / img.height;


                        // if (aspectRatio > 1.5) {
                        height = width / aspectRatio;
                        // } else {
                        //     width = height * aspectRatio;
                        // }
                        canvas.width = width;
                        canvas.height = height;
                        props.setUploadedHeight(height / 2)
                        props.setUploadedWidth(width / 2)
                        props.setSignatureWidth(width / 2);
                        props.setSignatureHeight(height / 2);
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
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
            setTimeout(
                function () {
                    setOpenAlert(false);
                }, 3000)
        }
        else {
            let annotate = false
            if (addTimeStamp || addDateStamp || addEmail) {

                annotate = true
            }
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


            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                // url: `${constants.devApi2BaseUrl}/api/Timestamp`,
                url: `${constants.devApiBaseUrl}/api/annotate/`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: data
            };
            setLoading(true)
            // console.log(data)
            axios.request(config)
                .then((response) => {
                    setLoading(false)
                    // console.log(response.data.signature)

                    props.setTempSignature(response.data.signature)
                    setStamp(false)
                    //copy
                    if (props.tempUploadedsignature) {
                        let signaturetype = "upload"
                        props.pdskPlaceSignature(response.data.signature, signaturetype, annotate)


                        props.setAddSignature(true)
                        let signature = getComponent(document.getElementById('signature'), 'signature');
                        if (!signature.disabled && !signature.isReadOnly) {
                            signature.clear();
                        }

                        setSelectedSignature('');
                        props.setOpenDialogSignature(false)
                        if(props.clickedSignatureBox && !props.isStamp){
                            props.setOpenDialogSignBoxes(true)
                        }
                        // signature.save(text, 'Signature');
                        if (checked === true) {
                            let data = JSON.stringify({
                                "email": props.signeremail,
                                "signature": signatureforsaving,
                                "titile": signaturetitle
                            });

                            let config = {
                                method: 'post',
                                maxBodyLength: Infinity,
                                url: `${constants.devApi2BaseUrl}/api/${props.isStamp ? 'SaveStamp' : 'SaveSignature'}/Create`,
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                data: data
                            };

                            axios.request(config)
                                .then((response) => {
                                    // console.log(JSON.stringify(response.data));
                                    setChecked(false)
                                })
                                .catch((error) => {
                                    // console.log(error);
                                });

                        }



                    }
                })
                .catch((error) => {
                    console.log(error);
                });


        }
     
        
    }
    const handleClose = () => {
        clrBtnClick()

        setSelectedSignature('');
        props.setOpenDialogSignature(false);



    };

    let uploadsignature = async (file) => {
        let signature = getComponent(document.getElementById('signature'), 'signature');

        const compressImage = async (file) => {
            const options = {
                maxSizeMB: 1, // Maximum size in MB
                maxWidthOrHeight: 500, // Maximum width or height in pixels
                useWebWorker: true,
            };
            try {
                const compressedFile = await imageCompression(file, options);
                return compressedFile;
            } catch (error) {
                console.error("Error compressing image:", error);
            }
        };

        const convertBase64 = (file) => {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.readAsDataURL(file);

                fileReader.onload = () => {
                    resolve(fileReader.result);
                };

                fileReader.onerror = (error) => {
                    reject(error);
                };
            });
        };

        const resizeImage = (base64String) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = base64String;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = 250;
                    let height = 500;
                    const aspectRatio = img.width / img.height;

                    // if (aspectRatio > 1.5) {
                    height = width / aspectRatio;
                    // } else {
                    //     width = height * aspectRatio;
                    // }
                    canvas.width = width;
                    canvas.height = height;
                    props.setUploadedHeight(height / 2)
                    props.setUploadedWidth(width / 2)
                    props.setSignatureWidth(width / 2);
                    props.setSignatureHeight(height / 2);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/png'));
                };
            });
        };

        const compressedFile = await compressImage(file);
        const base64 = await convertBase64(compressedFile);
        const resizedBase64 = await resizeImage(base64);
        signature.load(resizedBase64);
        setSignatureForSaving(base64)
        props.setTempSignature(base64)
    };

    function clrBtnClick() {
        props.setSigningPadDisabled(false)
        let signature = getComponent(document.getElementById('signature'), 'signature');
        if (!signature.disabled && !signature.isReadOnly) {
            signature.clear();

        }
        props.setTempSignature("");
        // document.getElementById('annotationtext').value=""
    }

    // triggers when file is selected with click
    const handleUploadChange = function (e) {
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

                        const file = e.target.files[0];
                        uploadsignature(file)
                        e.target.value = null

                    }
                };


            }


        }


    };

    // triggers the input when the button is clicked
    const browseFromComputer = () => {
        inputRef.current.click();
    };

    let showUploadForm = () => {
        props.setSigningPadDisabled(false)
        setSelectedSignature('');

        clrBtnClick()

        props.setSigningPadDisabled(true)
    }

    let showDrawForm = () => {
        props.setSigningPadDisabled(false)

        setSelectedSignature('');

        // setAnnotationsButtonColor('e-custom-light')
        clrBtnClick()

    }

    let showSelectForm = () => {
        clrBtnClick()

        setSelectedSignature('');


        props.setSigningPadDisabled(true)



    }

    // Handler function
    const handleDeleteSignature = async (signature) => {
        if (signature) {
            if (props.signersavedstamps && Array.isArray(props.signersavedstamps)) {
                // Use find to locate the stamp with the specified signature

                const stamp = (props.isStamp ? props.signersavedstamps : props.signersavedsignatures).find(item => item.signature === signature);

              
                try {
                    const response = await axios.post(
                        `${constants.devApi2BaseUrl}/api/${props.isStamp ? 'SaveStamp' : 'SaveSignature'}/DeleteSignature`,
                        {
                            id: stamp.id // Replace with the actual signature ID you want to delete
                        },
                        {
                            headers: {
                                'Accept': '*/*',
                                'Content-Type': 'application/json'
                            }
                        }
                    );


                    alert(`${props.isStamp ? 'Stamp':'Signature'} Signature deleted successfully`);
                    setSelectedSignature('')
                    let signature = getComponent(document.getElementById('signature'), 'signature');
                    signature.load('');

                    if (props.isStamp) {
                        props.getSavedStamps()
                    } else {
                        props.getSavedSignatures()
                    }



                } catch (error) {
                    console.error('Error deleting signature:', error.response ? error.response.data : error.message);

                }
            }
        } else {
            alert('Please select a signature to delete.');
        }
    };

    return (
        <Dialog
            open={props.opendialogsignature}
            keepMounted
            fullWidth={fullWidth}
            maxWidth={maxWidth}
            onClose={handleClose}
            aria-describedby="alert-dialog-slide-description"
            className='text-center'
            style={{ height: '100%' }}
        >
            <div style={{ overflowX: 'hidden' }}>
                {props.isStamp ?
                    <TabContext value={value}>
                        <DialogTitle className="text-center" style={{ backgroundColor: '#ffff', color: "#5555" }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="text-center">
                                <TabList onChange={handleChange} aria-label="lab API tabs example">
                                    <Tab
                                        label="Upload"
                                        selected
                                        value="1"
                                        style={{ fontSize: '13px' }}
                                        onClick={showUploadForm}
                                    />
                                    <Tab
                                        label="Select"
                                        value="2"
                                        style={{ fontSize: '13px' }}
                                        onClick={showSelectForm}
                                    />
                                </TabList>
                            </Box>
                        </DialogTitle>

                        <DialogContent className='row text-center'>
                            <div className='col-md-8 col-sm-12'>
                                <SignatureUploadMsgDialog
                                    signatureWidth={props.uploadedsignaturewidth}
                                    signatureHeight={props.uploadedsignatureheight}
                                    badsignature={badsignature}
                                    setBadSignature={setBadSignature}
                                />
                                <SignatureComponent
                                    strokeColor='#03045e'
                                    maxStrokeWidth={3}
                                    minStrokeWidth={0.5}
                                    velocity={0.7}
                                    id='signature'
                                    style={{
                                        borderStyle: 'dashed',
                                        borderColor: '#00509d',
                                        width: '100%',
                                        height: '55%',
                                        backgroundPosition: 'center',
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                    }}
                                />
                                <TabPanel value="1">
                                    <FormControl component="fieldset" variant="standard" style={{ width: '100%' }}>
                                        {checked ? <input
                                            type='text'
                                            onChange={(e) => setSignatureTitle(e.target.value)}
                                            className='form-control form-control-sm'
                                            placeholder='Enter stamp title here'
                                            required
                                        /> : <></>}

                                        <FormGroup style={{ fontSize: '12px' }}>
                                            <FormControlLabel
                                                label={<span style={{ fontSize: '12px' }}>Save Stamp?</span>}
                                                control={<Switch checked={checked} onChange={changeSavedSwitch} inputProps={{ 'aria-label': 'controlled' }} />}
                                            />
                                        </FormGroup>
                                    </FormControl>

                                    <div className='button-group'>
                                        <ButtonComponent
                                            cssClass='e-custom-light'
                                            className='m-2 p-2'
                                            style={{ textTransform: 'none',  fontSize: '12px' }}
                                            onClick={handleClose}
                                        >
                                            <i className="fas fa-times mx-1"></i>
                                            <span className='mx-2'>Cancel</span>
                                        </ButtonComponent>
                                        {props.tempUploadedsignature !== '' && !stamp ? (
                                            <ButtonComponent
                                                cssClass='e-custom-primary'
                                                className='m-2 p-2'
                                                style={{ textTransform: 'none',  fontSize: '12px' }}
                                                onClick={onSelect1}
                                            >
                                                {loading ? (
                                                    <CircularProgress className='text-white' size={15} />
                                                ) : (
                                                    <i className="fas fa-map-marker-alt mx-1"></i>
                                                )}
                                                <span className='mx-2'>Place Uploaded Stamp</span>
                                            </ButtonComponent>
                                        ) : null}
                                    </div>
                                </TabPanel>

                                <TabPanel value="2">
                                    {props.tempUploadedsignature !== '' && !stamp ? (
                                        <div className='button-group'>
                                            <ButtonComponent
                                                cssClass='e-custom-light'
                                                className='m-2 p-2'
                                                style={{ textTransform: 'none',  fontSize: '12px' }}
                                                onClick={handleClose}
                                            >
                                                <i className="fas fa-times mx-1"></i>
                                                <span className='mx-2'>Cancel</span>
                                            </ButtonComponent>
                                            <ButtonComponent
                                                cssClass='e-custom-primary'
                                                className='m-2 p-2'
                                                style={{ textTransform: 'none', fontSize: '12px' }}
                                                onClick={onSelect1}
                                            >
                                                {loading ? (
                                                    <CircularProgress className='text-white' size={15} />
                                                ) : (
                                                    <i className="fas fa-map-marker-alt mx-1"></i>
                                                )}
                                                <span className='mx-2'>Place Selected Stamp</span>
                                            </ButtonComponent>
                                        </div>
                                    ) : (
                                        <div className='col-md-12 col-sm-12'>
                                            <ButtonComponent
                                                cssClass='e-custom-light'
                                                className='m-2 p-2'
                                                style={{ textTransform: 'none',  fontSize: '12px' }}
                                                onClick={handleClose}
                                            >
                                                <i className="fas fa-times mx-1"></i>
                                                <span className='mx-2'>Cancel</span>
                                            </ButtonComponent>
                                        </div>
                                    )}
                                </TabPanel>
                            </div>

                            <div className='col-md-4 col-sm-12 shadow-lg'>
                                <TabPanel value="2">
                                    <div>

                                        <p className='text-center  text-muted' style={{ fontWeight: '200', fontSize: '14px' }}>
                                            <i className="fas fa-mouse-pointer mx-2 " style={{ fontSize: '25px' }}></i>
                                            Select Stamp
                                        </p>
                                        <div className='input-group text-center'>
                                            <FormControl variant="filled" style={{ width: "100%" }}>
                                                <select
                                                    ref={selectRef}
                                                    labelId="ss"
                                                    id="s"
                                                    value={selectedsignature}
                                                    onChange={(e) => previewSaved(e, e.target.value)}
                                                    name="s"
                                                    className='form-control form-control-md form-select'
                                                >
                                                    {props.signersavedstamps ? (
                                                        <>
                                                            <option value="" style={{ fontSize: "13px" }} className='text-muted' disabled>
                                                                {props.signersavedstamps.length > 0 ? `Please select` : "No saved stamps"}
                                                            </option>
                                                            {props.signersavedstamps.map((s, index) => (
                                                                <option key={index} value={s.signature} style={{ fontSize: "14px" }}>
                                                                    {s.title}
                                                                </option>
                                                            ))}
                                                        </>
                                                    ) : null}
                                                </select>
                                            </FormControl>


                                        </div>
                                        {/* Delete Button */}
                                        {selectedsignature ?
                                            <div className='d-flex justify-content-center '>
                                                <ButtonComponent
                                                    cssClass='e-custom-danger'
                                                    className='my-3 p-2'
                                                    onClick={() => handleDeleteSignature(selectedsignature)}
                                                    disabled={!selectedsignature} // Disable if no signature is selected
                                                >
                                                    <i className="fas fa-trash-alt mx-1"></i> Delete Selected Stamp
                                                </ButtonComponent>
                                            </div>
                                            : <></>}

                                    </div>
                                </TabPanel>

                                <TabPanel value="1">
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        id="file-upload-form"
                                        multiple={false}
                                        accept="image/png"
                                        onChange={handleUploadChange}
                                        hidden
                                    />
                                    <p className='text-center text-muted' style={{ fontWeight: '200', fontSize: '14px' }}>
                                        <i className="fas fa-file-upload mx-2 " style={{ fontSize: '25px' }}></i>
                                        Upload Stamp
                                    </p>
                                    <div className='d-flex justify-content-center'>
                                        <ButtonComponent
                                            cssClass='e-custom-primary'
                                            className='m-2 p-2'
                                            style={{ textTransform: 'none',  fontSize: '12px' }}
                                            onClick={browseFromComputer}
                                        >
                                            <span className='mx-2'>Browse from Device</span>
                                        </ButtonComponent>
                                    </div>
                                    <p style={{ fontSize: '11px' }}>
                                        ( Kindly upload an image with dimensions of at least 200 width x 200 height )
                                    </p>
                                </TabPanel>

                                <Alerts
                                    alertseverity={alertseverity}
                                    alertmsg={alertmsg}
                                    openalert={openalert}
                                    setOpenAlert={setOpenAlert}
                                />
                            </div>
                        </DialogContent>
                    </TabContext>

                    :
                    <TabContext value={value} >

                        <DialogTitle className="text-center" style={{ backgroundColor: '#ffff', color: "#5555" }}>

                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="text-center">
                                <TabList onChange={handleChange} aria-label="lab API tabs example">


                                    <Tab label="Draw " value="1" style={{ fontSize: '13px' }} onClick={showDrawForm} />



                                    <Tab label="Upload " value="2" style={{ fontSize: '13px' }} onClick={showUploadForm} />

                                    <Tab label="Select " value="3" style={{ fontSize: '13px' }} onClick={showSelectForm} />

                                </TabList>
                            </Box>

                        </DialogTitle>

                        <DialogContent className=' text-center'   >

                            <div className='row'>
                                <div className='col-md-8 col-sm-12'>
                                    <SignatureUploadMsgDialog
                                        signatureWidth={props.uploadedsignaturewidth}
                                        signatureHeight={props.uploadedsignatureheight}
                                        badsignature={badsignature}
                                        setBadSignature={setBadSignature}
                                    />

                                    <SignatureComponent
                                        strokeColor='#03045e'
                                        maxStrokeWidth={3}
                                        minStrokeWidth={0.5}
                                        velocity={0.7}
                                        id='signature'
                                        style={{
                                            borderStyle: 'dashed',
                                            borderColor: '#00509d',
                                            width: '100%', // Adjust width to match the dimensions of the uploaded images
                                            height: '55%', // Adjust height to match the dimensions of the uploaded images
                                            backgroundPosition: 'center', // Center the background image
                                            backgroundSize: 'contain', // Ensure the image fits within the signature pad
                                            backgroundRepeat: 'no-repeat', // Prevent the image from repeating
                                        }}
                                    />

                                    <TabPanel value="1">
                                        {checked ? (
                                            <FormControl component="fieldset" variant="standard" style={{ width: '100%' }}>
                                                <input
                                                    type='text'
                                                    onChange={(e) => setSignatureTitle(e.target.value)}
                                                    className='form-control form-control-sm'
                                                    placeholder='Enter signature title here'
                                                    required
                                                />
                                                <FormGroup style={{ fontSize: '12px' }}>
                                                    <FormControlLabel
                                                        label={<span style={{ fontSize: '12px' }}>Save Signature?</span>}
                                                        control={
                                                            <Switch checked={checked} onChange={changeSavedSwitch} inputProps={{ 'aria-label': 'controlled' }} />
                                                        }
                                                    />
                                                </FormGroup>
                                            </FormControl>
                                        ) : (
                                            <FormControl component="fieldset" variant="standard" style={{ width: '100%' }}>
                                                <FormGroup style={{ fontSize: '12px' }}>
                                                    <FormControlLabel
                                                        control={<Switch checked={checked} onChange={changeSavedSwitch} inputProps={{ 'aria-label': 'controlled' }} />}
                                                        label={<span style={{ fontSize: '12px' }}>Save Signature?</span>}
                                                    />
                                                </FormGroup>
                                            </FormControl>
                                        )}

                                        <ButtonComponent
                                            id='clear'
                                            cssClass='e-custom-warning'
                                            className='m-2 p-2'
                                            style={{ textTransform: 'none', fontSize: '12px' }}
                                            onClick={clrBtnClick}
                                        >
                                            <i className="fas fa-eraser mx-1"></i><span className='mx-2'>Clear Pad</span>
                                        </ButtonComponent>

                                        <ButtonComponent
                                            cssClass='e-custom-light'
                                            className='m-2 p-2'
                                            style={{ textTransform: 'none', fontSize: '12px' }}
                                            onClick={handleClose}
                                        >
                                            <i className="fas fa-times mx-1"></i><span className='mx-2'>Cancel</span>
                                        </ButtonComponent>

                                        <ButtonComponent
                                            cssClass='e-custom-primary'
                                            id='placeDrawn'
                                            className='m-2 p-2'
                                            style={{ textTransform: 'none', fontSize: '12px' }}
                                            onClick={onSelect}
                                        >
                                            {loading ? <CircularProgress className='text-white' size={15} /> : <i className="fas fa-map-marker-alt mx-1"></i>}
                                            <span className='mx-2'>Place Drawn Signature</span>
                                        </ButtonComponent>
                                    </TabPanel>

                                    <TabPanel value="2">
                                        {checked ? (
                                            <FormControl component="fieldset" variant="standard" style={{ width: '100%' }}>
                                                <input
                                                    type='text'
                                                    onChange={(e) => setSignatureTitle(e.target.value)}
                                                    className='form-control form-control-sm'
                                                    placeholder='Enter signature title here'
                                                    required
                                                />
                                                <FormGroup style={{ fontSize: '12px' }}>
                                                    <FormControlLabel
                                                        label={<span style={{ fontSize: '12px' }}>Save Signature?</span>}
                                                        control={
                                                            <Switch checked={checked} onChange={changeSavedSwitch} inputProps={{ 'aria-label': 'controlled' }} />
                                                        }
                                                    />
                                                </FormGroup>
                                            </FormControl>
                                        ) : (
                                            <FormControl component="fieldset" variant="standard" style={{ width: '100%' }}>
                                                <FormGroup style={{ fontSize: '12px' }}>
                                                    <FormControlLabel
                                                        label={<span style={{ fontSize: '12px' }}>Save Signature?</span>}
                                                        control={
                                                            <Switch checked={checked} onChange={changeSavedSwitch} inputProps={{ 'aria-label': 'controlled' }} />
                                                        }
                                                    />
                                                </FormGroup>
                                            </FormControl>
                                        )}

                                        {props.tempUploadedsignature !== '' && !stamp ? (
                                            <>
                                                <ButtonComponent
                                                    cssClass='e-custom-light'
                                                    className='m-2 p-2'
                                                    style={{ textTransform: 'none', fontSize: '12px' }}
                                                    onClick={handleClose}
                                                >
                                                    <i className="fas fa-times mx-1"></i> <span className='mx-2'>Cancel</span>
                                                </ButtonComponent>
                                                <ButtonComponent
                                                    cssClass='e-custom-primary'
                                                    className='m-2 p-2'
                                                    style={{ textTransform: 'none',fontSize: '12px' }}
                                                    onClick={onSelect1}
                                                >
                                                    {loading ? <CircularProgress className='text-white' size={15} /> : <i className="fas fa-map-marker-alt mx-1"></i>}
                                                    <span className='mx-2'>Place Uploaded Signature</span>
                                                </ButtonComponent>
                                            </>
                                        ) : (
                                            <div className='col-md-12 col-sm-12'>
                                                <ButtonComponent
                                                    cssClass='e-custom-light'
                                                    className='m-2 p-2'
                                                    style={{ textTransform: 'none', fontSize: '12px' }}
                                                    onClick={handleClose}
                                                >
                                                    <i className="fas fa-times mx-1"></i><span className='mx-2'>Cancel</span>
                                                </ButtonComponent>
                                            </div>
                                        )}
                                    </TabPanel>

                                    <TabPanel value="3">
                                        {props.tempUploadedsignature !== '' && !stamp ? (
                                            <>
                                                <ButtonComponent
                                                    cssClass='e-custom-light'
                                                    className='m-2 p-2'
                                                    style={{ textTransform: 'none', fontSize: '12px' }}
                                                    onClick={handleClose}
                                                >
                                                    <i className="fas fa-times mx-1"></i><span className='mx-2'>Cancel</span>
                                                </ButtonComponent>
                                                <ButtonComponent
                                                    cssClass='e-custom-primary'
                                                    className='m-2 p-2'
                                                    style={{ textTransform: 'none',fontSize: '12px' }}
                                                    onClick={onSelect1}
                                                >
                                                    {loading ? <CircularProgress className='text-white' size={15} /> : <i className="fas fa-map-marker-alt mx-1"></i>}
                                                    <span className='mx-2'>Place Selected Signature</span>
                                                </ButtonComponent>
                                            </>
                                        ) : (
                                            <div className='col-md-12 col-sm-12'>
                                                <ButtonComponent
                                                    cssClass='e-custom-light'
                                                    className='m-2 p-2'
                                                    style={{ textTransform: 'none', fontSize: '12px' }}
                                                    onClick={handleClose}
                                                >
                                                    <i className="fas fa-times mx-1"></i> <span className='mx-2'>Cancel</span>
                                                </ButtonComponent>
                                            </div>
                                        )}
                                    </TabPanel>
                                </div>

                                <div className='col-md-4 col-sm-12 shadow-lg'>
                                    <TabPanel value="1">
                                        {/* Draw Signature */}
                                        <p className='text-center  text-muted' style={{ fontWeight: 200, fontSize: '14px' }}>
                                            <i className="fas fa-pen-alt mx-2 " style={{ fontSize: '25px' }}></i>
                                            Draw Signature
                                        </p>
                                    </TabPanel>

                                    <TabPanel value="2">
                                        <input
                                            ref={inputRef}
                                            type="file"
                                            id="file-upload-form"
                                            multiple={false}
                                            accept="image/png"
                                            onChange={handleUploadChange}
                                            hidden
                                        />
                                        <p className='text-center text-muted' style={{ fontWeight: 200, fontSize: '14px' }}>
                                            <i className="fas fa-file-upload mx-2 " style={{ fontSize: '25px' }}></i>
                                            Upload Signature
                                        </p>

                                        <div className='d-flex justify-content-center'>
                                            <ButtonComponent
                                                cssClass='e-custom-primary'
                                                className='m-2 p-2'
                                                style={{ textTransform: 'none',  fontSize: '12px' }}
                                                onClick={browseFromComputer}
                                            >
                                                <span className='mx-2'>Browse from Device</span>
                                            </ButtonComponent>
                                        </div>

                                        <p style={{ fontSize: '11px' }}>( Kindly upload an image with dimensions of at least 200 width x 200 height )</p>
                                    </TabPanel>

                                    <TabPanel value="3">
                                        {/* Select Signature */}
                                        <div>
                                            <p className='text-center  text-muted ' style={{ fontWeight: 200, fontSize: '14px' }}>
                                                <i className="fas fa-mouse-pointer mx-2" style={{ fontSize: '25px' }}></i>
                                                Select Signature
                                            </p>
                                            <div className='input-group my-2'>
                                                <FormControl variant="filled" style={{ width: "100%" }}>
                                                    <select
                                                        ref={selectRef}
                                                        labelId="ss"
                                                        id="s"
                                                        value={selectedsignature}
                                                        onChange={(e) => previewSaved(e, e.target.value)}
                                                        name="s"
                                                        className='form-control form-control-md form-select'
                                                    >
                                                        {props.signersavedsignatures ? (
                                                            <>
                                                                <option value="" style={{ fontSize: "13px" }} className='text-muted' disabled>
                                                                    {props.signersavedsignatures.length > 0 ? "Please select" : "No saved signatures"}
                                                                </option>
                                                                {props.signersavedsignatures.length > 0 && props.signersavedsignatures.map((s, index) => (
                                                                    <option key={index} value={s.signature} style={{ fontSize: "14px" }}>{s.title}</option>
                                                                ))}
                                                            </>
                                                        ) : null}
                                                    </select>
                                                </FormControl>
                                            </div>
                                            {/* Delete Button */}
                                            {selectedsignature ?
                                                <div className='d-flex justify-content-center '>
                                                    <ButtonComponent
                                                        cssClass='e-custom-danger'
                                                        className='my-1 p-2'
                                                        onClick={() => handleDeleteSignature(selectedsignature)}
                                                        disabled={!selectedsignature} // Disable if no signature is selected
                                                    >
                                                        <i className="fas fa-trash-alt mx-1"></i> Delete Selected Signature
                                                    </ButtonComponent>
                                                </div>
                                                : <></>}


                                        </div>
                                    </TabPanel>

                                    <Alerts alertseverity={alertseverity} alertmsg={alertmsg} openalert={openalert} setOpenAlert={setOpenAlert} />

                                    <small className='my-1' style={{ color: '#00509d' }}>
                                        Signature Customization
                                    </small>

                                    <div className='d-flex justify-content-center'>
                                        <FormGroup className='text-center'>
                                            <FormControlLabel style={{ fontSize: '12px' }}
                                                control={<Checkbox checked={addEmail} onChange={handleAddEmailChange} />}
                                                label={<span style={{ fontSize: '12px' }}>Add email stamp</span>}
                                            />
                                            {/*
                                            <FormControlLabel style={{ fontSize: '12px' }}
                                                control={<Checkbox checked={addDateStamp} onChange={handleAddDateStampChange} />}
                                                label={<span style={{ fontSize: '12px' }}>Add date stamp</span>}
                                            />
                                            }*/}
                                            <FormControlLabel style={{ fontSize: '12px' }}
                                                control={<Checkbox checked={addTimeStamp} onChange={handleAddTimeStampChange} />}
                                                label={<span style={{ fontSize: '12px' }}>Add both date & time stamp</span>}
                                            />
                                        </FormGroup>
                                    </div>
                                </div>

                            </div>
                        </DialogContent>

                    </TabContext>
                }

            </div>
        </Dialog>
    );
}


export default SignatureDialog

