
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import * as constants from "../../components/constants/constants"
import { FaEdit, FaCircle, FaBan, FaSave, FaTrashAlt, FaUserShield, FaSignOutAlt, FaCaretLeft, FaCaretRight, FaBars, FaUser, FaPhone, FaIdBadge } from 'react-icons/fa';
import Avatar from '@mui/material/Avatar'
import { Tooltip } from '@mui/material'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import FormControl from '@mui/material/FormControl'
import Input from '@mui/material/Input'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Trashed from '../../components/dashboard/Trashed.jsx';
import LicenseStatus from '../../components/dialogs/LicenseStatusDialog.jsx';
import TimedAlert from '../../components/TimedAlert.jsx';
import UserAvatarMenu from '../../components/UserAvatr.jsx';
import defaultAvatar from '../../images/default_avatar.png';
import AddSignersDialog from '../../components/dialogs/AddSignersDialog.jsx';
import CommentsDialog from '../../components/dialogs/CommentsDialog.jsx';
import PreviewerDialog from '../../components/dialogs/PreviewerDialog.jsx';
import FileUpload from '../../components/FileUpload.jsx';
import Complete from '../../components/dashboard/Complete'
import Inbox from '../../components/dashboard/Inbox'
import Voided from '../../components/dashboard/Voided'
import Outbox from '../../components/dashboard/Outbox'
import MyUploads from '../../components/dashboard/MyUploads'
import logo from '../../images/ZFWHITE.png'
import logo2 from '../../images/ZFBLU.png'


import AuthContext from '../../context/Authcontext.jsx';

function CustomTabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ mt: 1, backgroundColor: '#fff' }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    )
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    }
}

function Dashboard() {
    // --- State ---
    const [value, setValue] = useState(0)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeLink, setActiveLink] = useState('inbox')
    const [opendialogaddsigners, setOpenDialogAddSigners] = useState(false)
    const [signeruid, setSignerUid] = useState('')
    const [trashed, setTrashed] = useState([])
    const [myuploads, setMyUploads] = useState([])
    const [inbox, setInbox] = useState([])
    const [outbox, setOutbox] = useState([])
    const [complete, setComplete] = useState([])
    const [voided, setVoided] = useState([])
    const [count, setCount] = useState(null)
    const [avatar, setAvatar] = useState('')
    const [avatarfile, setAvatarFile] = useState()
    const [loading, setLoading] = useState(false)
    const [loadingmini, setLoadingMini] = useState(false)
    const [openalert, setOpenAlert] = useState(false)
    const [alertseverity, setAlertSeverity] = useState('info')
    const [alertmsg, setAlertMsg] = useState('')
    const [openpreviewerdialog, setOpenPreviewerDialog] = useState(false)
    const [filepreviewurl, setFilePreviewUrl] = useState('')
    const [previewComplete, setPreviewComplete] = useState(false)
    const [filepreviewtitle, setFilePreviewTitle] = useState('')
    const [opendialogcomments, setOpenDialogComments] = useState(false)
    const [comments, setComments] = useState([])
    const [ccdocguid, setCCDocGuid] = useState('')
    const [ccdoctitle, setCCDocTitle] = useState('')
    const [uploadedfileurl, setUploadedFileUrl] = useState('')
    const [signers, setSigners] = useState([])
    const [doccreated, setDocCreated] = useState('')
    const [docowner, setDocOwner] = useState('')
    const [assdescription, setDocAssdescription] = useState('')
    const [checked, setChecked] = useState(false)
    const [workflows, setWorkflows] = useState([])
    const [organizationWorkflows, setOrganizationWorkflows] = useState([])
    const [companylogo, setCompanyLogo] = useState('')
    const [loadingComplete, setLoadingComplete] = useState(false)
    const [loadingInbox, setLoadingInbox] = useState(false)
    const [loadingOutbox, setLoadingOutbox] = useState(false)
    const [openlicensedialog, setOpenLicenseDialog] = useState(false)
    const [filters, setFilters] = useState({ start_date: '', end_date: '' })
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    const [isDragging, setIsDragging] = useState(false)
    const [isOnline, setIsOnline] = useState(window.navigator.onLine)


    const col1Ref = useRef(null)
    const col2Ref = useRef(null)
    const dividerRef = useRef(null)
    const containerRef = useRef(null)
    const navigate = useNavigate()
    const location = useLocation()
    const { authTokens, logoutUser, user } = useContext(AuthContext)
    const [files, setFiles] = useState([])
    const [title, setTitle] = useState('')

    const [activeForm, setActiveForm] = useState('file-upload') // 'profile', 'file-upload', 'sign-type'

    // --- Responsive Layout ---
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (isMobile) return
        const handleMouseMove = (e) => {
            if (!isDragging) return
            const containerWidth = containerRef.current.getBoundingClientRect().width
            let newCol1Width = (e.clientX / containerWidth) * 100
            newCol1Width = Math.max(10, Math.min(90, newCol1Width))
            col1Ref.current.style.width = `${newCol1Width}%`
            col2Ref.current.style.width = `${100 - newCol1Width}%`
        }
        const handleMouseUp = () => setIsDragging(false)
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, isMobile])

    const handleMouseDown = () => { if (!isMobile) setIsDragging(true) }
    const toggleSidebar = () => setSidebarOpen(prev => !prev)
    const changeSavedSwitch = (e) => setChecked(e.target.checked)

    // --- Utility Functions ---
    function formatDateLocal(date) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }
    function getDateRange() {
        const now = new Date()
        const endDate = new Date(now)
        const startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        endDate.setDate(endDate.getDate() + 1)
        return {
            start_date: formatDateLocal(startDate),
            end_date: formatDateLocal(endDate)
        }
    }

    // --- API Calls ---
    const getWorkflows = useCallback(async () => {
        const headers = { 'Authorization': `Bearer ${authTokens.access}` }
        const endpoints = [
            `${constants.devApiBaseUrl}/api/workflows/`,
            `${constants.devApiBaseUrl}/api/organization/workflows/`
        ]
        try {
            const [workflowsRes, orgWorkflowsRes] = await Promise.all(
                endpoints.map(url => axios.get(url, { headers, maxBodyLength: Infinity }))
            )
            setWorkflows(workflowsRes.data)
            setOrganizationWorkflows(orgWorkflowsRes.data)
        } catch (error) {
            // console.error("Error fetching workflows:", error)
        }
    }, [authTokens])

    const getCompanyLogo = useCallback(() => {
        axios.get(`${constants.devApiBaseUrl}/api/logo/`, {
            headers: { 'Authorization': `Bearer ${authTokens.access} ` }
        }).then(res => {
            setCompanyLogo(`${constants.devApiBaseUrl}${res.data['logo_url']}`)
        }).catch(error => {
            // Optionally log or handle the error
            // console.error("Error fetching company logo:", error);
        });
    }, [authTokens])

    const getAvatar = useCallback(() => {
        axios.get(`${constants.devApiBaseUrl}/api/avatar/`, {
            headers: { 'Authorization': `Bearer ${authTokens.access} ` }
        }).then(res => {
            setAvatar(`${constants.devApiBaseUrl}${res.data['avatar_url']}`)
        })
    }, [authTokens])

    const stringAvatar = useCallback((name) => {
        const nameParts = name.split(' ');
        const firstInitial = nameParts[0] ? nameParts[0][0] : '';
        const secondInitial = nameParts[1] ? nameParts[1][0] : '';
        return { children: `${firstInitial}${secondInitial}` };
    }, []);

    // --- Data Fetchers ---
    const fetchList = async (url, setter, setLoading) => {
        setLoading && setLoading(true)
        try {
            const config = { headers: { 'Authorization': `Bearer ${authTokens.access}` } }
            const res = await axios.get(url, config)
            setter(res.data)
            setCount(res.data.length)
            console.log(`Fetched data from ${url}:`, res.data) // Debug log for fetched data    
        } catch { }
        setLoading && setLoading(false)
    }

    const getInbox = async (startDate, endDate) => {
        setActiveLink('inbox')
        setValue(0)
        const { start_date, end_date } = getDateRange()
        await fetchList(
            `${constants.devApiBaseUrl}/api/inbox/?start_date=${startDate || start_date}&end_date=${endDate || end_date}`,
            setInbox,
            setLoadingInbox
        )
    }
    const getOutbox = async (startDate, endDate) => {
        setValue(1)
        const { start_date, end_date } = getDateRange()
        await fetchList(
            `${constants.devApiBaseUrl}/api/outbox/?start_date=${startDate || start_date}&end_date=${endDate || end_date}`,
            setOutbox,
            setLoadingOutbox
        )
    }
    const getComplete = async (startDate, endDate) => {
        setLoadingComplete(true)
        setValue(2)
        const { start_date, end_date } = getDateRange()
        await fetchList(
            `${constants.devApiBaseUrl}/api/complete/?start_date=${startDate || start_date}&end_date=${endDate || end_date}`,
            setComplete,
            setLoadingComplete
        )
    }
    const getVoided = async () => {
        setValue(3)
        await fetchList(`${constants.devApiBaseUrl}/api/voided/`, setVoided)
    }
    const getMyUploads = async () => {
        setValue(4)
        await fetchList(`${constants.devApiBaseUrl}/api/myuploads/`, setMyUploads)
    }
    const getTrashed = async () => {
        setValue(5)
        await fetchList(`${constants.devApiBaseUrl}/api/trashed/`, setTrashed)
    }

    // --- Profile & File Actions ---
    const updateUser = (e) => {
        e.preventDefault()
        const FormData = require('form-data')
        const data = new FormData()
        if (avatarfile) {
            data.append('avatar', avatarfile)
            data.append('fileName', avatarfile.name)
        }
        if (e.target.first_name.value) data.append('first_name', e.target.first_name.value)
        if (e.target.last_name.value) data.append('last_name', e.target.last_name.value)
        if (e.target.phone.value) data.append('phone', e.target.phone.value)
        data.append('mailtoall', checked)
        axios.patch(`${constants.devApiBaseUrl}/api/user/${user.id}`, data, {
            headers: { 'Authorization': `Bearer ${authTokens.access} ` }
        }).then(res => {
            setAvatar(res.data['avatar'])
            setOpenAlert(true)
            setAlertMsg('Profile updated, effective on next login')
            setAlertSeverity('success')
            setTimeout(() => setOpenAlert(false), 2000)
            // Correct logic for setting active form after profile update

            setActiveForm('file-upload')

        })
    }

    const handleAvatarFileChange = (event) => setAvatarFile(event.target.files[0])
    const backHome = () => setActiveForm('file-upload')
    const signFromInbox = (row) => {
        let documentUrl = `${row.uid}_${row.guid}.pdf/${row.uid}`
        if (row.selfsign) {
            navigate('/sign', { state: { 'fileurl': `${row.uid}_${row.guid}.pdf`, 'originalfilename': row.title, 'avatar': avatar } })
        } else {
            navigate(`/mail/sign/${documentUrl}`, { state: { guid: `${row.guid}` } })
        }
    }

    // --- Preview & Logging ---
    const getComments = (documentguid, documenttitle) => {
        setCCDocGuid(documentguid)
        setCCDocTitle(documenttitle)
        axios.post(`${constants.devApiBaseUrl}/api/comments/`, { guid: documentguid }, {
            headers: { 'Content-Type': 'application/json' }
        }).then(res => setComments(res.data))
    }

    const getSignerUid = async (documentguid) => {
        try {
            const res = await axios.post(`${constants.devApiBaseUrl}/api/signer/selfsign/`, { docguid: documentguid }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authTokens.access}`
                }
            })
            setSignerUid(res.data.uid)
            setSigners(res.data.signers)
            setDocCreated(res.data.created)
            setDocAssdescription(res.data.assignmentd)
            setDocOwner(res.data.owner)
            getComments(documentguid)
        } catch { }
    }

    const previewFile = async (guid, signedStatus, voidedStatus, title) => {
        getComments(guid, title)
        getSignerUid(guid)
        let previewUrl = guid
        let previewComplete = signedStatus === 'True'
        setFilePreviewUrl(previewUrl)
        setPreviewComplete(previewComplete)
        setFilePreviewTitle(title)
        setOpenPreviewerDialog(true)
        try {
            let userip = "hidden"
            try {
                const ipResponse = await axios.get('https://api.ipify.org?format=json');
                userip = ipResponse.data.ip
            } catch { }
            await axios.post(`${constants.devApiBaseUrl}/api/new/log/`, {
                activity: "preview",
                description: `previewed ${title}`,
                guid,
                ip: userip,
                user: user.email
            }, { headers: { 'Content-Type': 'application/json' } })
        } catch { }
    }

    const previewFileInbox = async (row) => {
        getComments(row.guid, row.title)
        getSignerUid(row.guid)
        setFilePreviewUrl(`${row.uid}_${row.guid}`)
        setPreviewComplete(false)
        setFilePreviewTitle(row.title)
        setOpenPreviewerDialog(true)
        try {
            let userIp = "hidden"
            try {
                const { data } = await axios.get('https://api.ipify.org?format=json');
                userIp = data.ip
            } catch { }
            await axios.post(`${constants.devApiBaseUrl}/api/new/log/`, {
                activity: "preview",
                description: `previewed ${row.title}`,
                guid: row.guid,
                ip: userIp,
                user: user.email
            }, { headers: { 'Content-Type': 'application/json' } })
        } catch { }
    }


    const selfSign = async () => {
        setLoadingMini(true);

        try {
            if (!files || files.length === 0) {
                alert("Please select at least one file to upload");
                setLoadingMini(false);
                return;
            }

            const formData = new FormData();

            // Append all files in order and include index
            files.forEach((f, index) => {
                const fileObj = f.file || f;
                formData.append("formFile", fileObj);
                formData.append("title", fileObj.name || "untitled");
                formData.append("fileIndex", index.toString());
            });

            if (files.length > 1 && title) {
                formData.append("title", title);
            }
            console.log(formData)

            console.log("Files before upload:", files);
            console.log(
                "Payload before upload:",
                Array.from(formData.entries()).map(([key, value]) => [
                    key,
                    value instanceof File ? value.name : value,
                ])
            );

            const url = `${constants.devApiBaseUrl}/api/upload/multi-file/`;
            const uploadResponse = await axios.post(url, formData, {
                headers: {
                    Authorization: `Bearer ${authTokens.access}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (uploadResponse.status === 200) {
                const fileguid = uploadResponse.data.fileguid;
                console.log("Upload successful, fileguid:", fileguid);

                setLoadingMini(false);
                navigate("/sign", {
                    state: {
                        fileurl: fileguid,
                        originalfilename: files.length > 1
                            ? `${files.length} files`
                            : files[0].name,
                        files: files.map(f => f.name),
                        avatar: avatar,
                    },
                });
            } else {
                alert("File upload failed");
                setLoadingMini(false);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert(error.response?.data?.error || "An error occurred during upload");
            setLoadingMini(false);
        }
    };


    const mailtoSigners = async () => {
        setLoadingMini(true);
        getWorkflows();

        try {
            if (!files || files.length === 0) {
                alert("Please select at least one file to upload");
                setLoadingMini(false);
                return;
            }

            const url = `${constants.devApiBaseUrl}/api/uploadOthers/multi-files/`;
            const formData = new FormData();
            let computedTitle = title?.trim(); // what user typed

            files.forEach((f, index) => {
                const fileObj = f.file || f;
                formData.append("formFile", fileObj);

                // Extract filename without extension
                const filename = fileObj.filename || fileObj.name || "untitled";
                const nameWithoutExtension = filename.includes('.')
                    ? filename.substring(0, filename.lastIndexOf('.'))
                    : filename;

                // If no title provided by user → use name of FIRST FILE ONLY
                if (!computedTitle) {
                    if (index === 0) computedTitle = nameWithoutExtension;
                }
            });

            // Ensure backend never receives an empty title
            if (!computedTitle) {
                const firstFile = files[0];
                const fileObj = firstFile.file || firstFile;
                const filename = fileObj.filename || fileObj.name || "untitled";
                computedTitle = filename.includes('.')
                    ? filename.substring(0, filename.lastIndexOf('.'))
                    : filename;
            }

            // Final append
            formData.append("title", computedTitle);

            // console.log(
            //     "Payload before upload:",
            //     Array.from(formData.entries()).map(([key, value]) => [
            //         key,
            //         value instanceof File ? value.name : value,
            //     ])
            // );

            const uploadResponse = await axios.post(url, formData, {
                headers: {
                    Authorization: `Bearer ${authTokens.access}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (uploadResponse.status === 200 || uploadResponse.status === 201) {
                const fileurl = uploadResponse.data.docGuid;
                setUploadedFileUrl(fileurl);
                setOpenDialogAddSigners(true);
                setFiles([]);
                setTitle(''); // ✅ Reset title state after successful upload
            } else {
                alert("File upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert(error.response?.data?.error || "An error occurred during upload");
        } finally {
            setLoadingMini(false);
        }
    };








    const saveToMyFolder = async () => {
        setLoadingMini(true);
        const uploadTitle = "Batched Upload";

        try {
            if (!files || files.length === 0) {
                alert("Please select at least one file to upload");
                setLoadingMini(false);
                return;
            }

            const url = `${constants.devApiBaseUrl}/api/uploadOthers/multi-files/`;
            const formData = new FormData();

            // Append all files
            files.forEach((f) => {
                // handle both { file } and raw File objects
                const fileObj = f.file || f;
                formData.append("formFile", fileObj);
            });

            // Append title
            formData.append("title", uploadTitle);


            // Upload to backend
            const uploadResponse = await axios.post(url, formData, {
                headers: {
                    Authorization: `Bearer ${authTokens.access}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (uploadResponse.status === 200 || uploadResponse.status === 201) {
                const fileurl = uploadResponse.data.docGuid;
                setLoadingMini(false);

                // Post-upload actions
                setUploadedFileUrl(fileurl);
                setFiles([]); // Clear selected files after upload
            } else {
                alert("File upload failed");
            }
        } catch (error) {
            setLoadingMini(false);
        } finally {
            setLoadingMini(false);
        }
    };


    const resetForm = () => {


        setActiveForm('file-upload')
    }

    // --- Misc ---
    const showProfile = () => { activeForm === 'file-upload' ? setActiveForm('profile') : setActiveForm('file-upload') }
    const adminPage = () => navigate('/admin/dashboard')
    const changePassword = () => window.open(`/password-reset`, '_blank')
    const selfSignSaved = (saveddocguid, savedfilename) => {
        axios.post(`${constants.devApiBaseUrl}/api/saved/selfsign/`, { documentid: saveddocguid }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authTokens.access} `
            }
        }).then(res => {
            navigate('/sign', { state: { 'fileurl': res.data.fileName, 'originalfilename': savedfilename, 'avatar': avatar } })
        })
    }
    const sendUploadForSigning = (guid) => {
        getWorkflows()
        setUploadedFileUrl(guid)
        setOpenDialogAddSigners(true)
    }

    // --- Data Refresh ---
    const refreshdata = () => {
        let dateRange = getDateRange()
        setFilters(dateRange)
        getAvatar()
        getTrashed()
        getMyUploads()
        getVoided()
        getComplete(dateRange.start_date, dateRange.end_date)
        getOutbox(dateRange.start_date, dateRange.end_date)
        getInbox(dateRange.start_date, dateRange.end_date)
        setCount(complete.length)
    }

    // --- Initial Data Load ---
    useEffect(() => {
        const fetchData = async () => {
            let dateRange = getDateRange()
            setFilters(dateRange)
            await Promise.all([
                getAvatar(),
                getCompanyLogo(),
                getTrashed(),
                getMyUploads(),
                getVoided(),
                getComplete(dateRange.start_date, dateRange.end_date),
                getOutbox(dateRange.start_date, dateRange.end_date),
                getInbox(dateRange.start_date, dateRange.end_date),
            ])
            setCount(complete.length)
            setChecked(user.mailtoall === 'True')

            if (location.state) {
                setOpenAlert(location.state.openalert)
                setAlertMsg(location.state.alertmsg)
                setAlertSeverity(location.state.alertseverity)
                setTimeout(() => setOpenAlert(false), 3000)
            }
        }
        fetchData()
        setActiveForm('file-upload')
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
        // eslint-disable-next-line
    }, [])

    // --- Render ---
    return (
        <>
            {loading ? <Loading /> :
                <>
                    <TimedAlert
                        open={openalert}
                        onClose={() => setOpenAlert(false)}
                        severity={alertseverity}
                        message={alertmsg}
                        setSeverity={setAlertSeverity}
                        setMessage={setAlertMsg}
                    />
                    <LicenseStatus logoutUser={logoutUser} open={openlicensedialog} setOpen={setOpenLicenseDialog} />
                    <AddSignersDialog setAlertSeverity={setAlertSeverity} setAlertMsg={setAlertMsg} setOpenAlert={setOpenAlert} loading={loading} setLoading={setLoading} getWorkflows={getWorkflows} workflows={workflows} organizationWorkflows={organizationWorkflows} opendialogaddsigners={opendialogaddsigners} setOpenDialogAddSigners={setOpenDialogAddSigners} fileurl={uploadedfileurl} refreshdata={refreshdata} setActiveForm={setActiveForm} />
                    <CommentsDialog opendialogcomments={opendialogcomments} setOpenDialogComments={setOpenDialogComments} comments={comments} ccdocguid={ccdocguid} ccdoctitle={ccdoctitle} />
                    <PreviewerDialog
                        signers={signers}
                        doccreated={doccreated}
                        assdescription={assdescription}
                        docowner={docowner}
                        user={user}
                        avatar={avatar}
                        getComments={getComments}
                        openpreviewerdialog={openpreviewerdialog}
                        setOpenPreviewerDialog={setOpenPreviewerDialog}
                        comments={comments}
                        ccdocguid={ccdocguid}
                        ccdoctitle={ccdoctitle}
                        filepreviewurl={filepreviewurl}
                        filepreviewtitle={filepreviewtitle}
                        signeruid={signeruid}
                        previewComplete={previewComplete}
                    />
                    <div className="dashboard">
                        <nav className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{ borderRight: "3px solid #ddd" }}>
                            {sidebarOpen && (
                                <div className="sidebar-content" style={{ marginTop: 0, width: '200px' }}>
                                    {/* Logo */}
                                    {/* <div
                                        className="d-flex flex-column align-items-center bg-white shadow-lg p-2"
                                        style={{ height: '61px', justifyContent: 'center' }}
                                    >
                                        <img
                                            src={companylogo || logo}
                                            alt="Organization logo"
                                            style={{ maxHeight: '40px', objectFit: 'contain' }}
                                        />
                                    </div> */}
                                    {/* Logo Section */}
                                    <div
                                        className="d-flex justify-content-center align-items-center shadow-lg"
                                        style={{
                                            height: "58px",
                                            minHeight: "56px",
                                            maxHeight: "56px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <img
                                            src={logo}
                                            alt="Organization logo"
                                            className="logo"
                                            style={{
                                                width: "auto",
                                                maxHeight: "33px",
                                                objectFit: "contain",
                                                marginRight: "20px",
                                            }}
                                        />
                                    </div>


                                    {/* User Profile */}



                                    {/* Menu Items */}
                                    <ul className="menu-items" style={{ padding: 0, margin: 0 }}>
                                        <li
                                            className="menu-item main-li shadow-lg"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '140px',
                                                    fontWeight: 'bold',
                                                }}
                                                title={`${user.first_name} ${user.last_name}`}
                                            >
                                                {user.first_name} {user.last_name}
                                            </span>
                                            <FaEdit
                                                className="mx-2"
                                                onClick={showProfile}
                                                style={{ color: '#ffda75', cursor: 'pointer', fontSize: '16px' }}
                                            />
                                        </li>
                                        <li
                                            className="menu-item main-li shadow-lg"
                                            onClick={() => getInbox(filters.start_date, filters.end_date)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 10px', minHeight: '40px' }}
                                        >
                                            <FaCircle className="dot text-danger" style={{ fontSize: '16px', flexShrink: 0 }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
                                                <span style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Inbox ({inbox.length})
                                                </span>
                                                <span style={{
                                                    fontSize: '9px',
                                                    color: 'rgba(255, 255, 255, 0.65)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Waiting for me
                                                </span>
                                            </div>
                                        </li>

                                        <li
                                            className="menu-item main-li shadow-lg"
                                            onClick={() => getOutbox(filters.start_date, filters.end_date)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 10px', minHeight: '40px' }}
                                        >
                                            <FaCircle className="dot text-warning" style={{ fontSize: '16px', flexShrink: 0 }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
                                                <span style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Outbox ({outbox.length})
                                                </span>
                                                <span style={{
                                                    fontSize: '9px',
                                                    color: 'rgba(255, 255, 255, 0.65)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Waiting for Others
                                                </span>
                                            </div>
                                        </li>

                                        <li
                                            className="menu-item main-li shadow-lg"
                                            onClick={() => getComplete(filters.start_date, filters.end_date)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 10px', minHeight: '40px' }}
                                        >
                                            <FaCircle className="dot text-success" style={{ fontSize: '16px', flexShrink: 0 }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
                                                <span style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Completed ({complete.length})
                                                </span>
                                                <span style={{
                                                    fontSize: '9px',
                                                    color: 'rgba(255, 255, 255, 0.65)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Signed
                                                </span>
                                            </div>
                                        </li>

                                        <li
                                            className="menu-item main-li shadow-lg"
                                            onClick={getVoided}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 10px', minHeight: '40px' }}
                                        >
                                            <FaBan style={{ fontSize: '16px', flexShrink: 0 }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
                                                <span style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Voided ({voided.length})
                                                </span>
                                                <span style={{
                                                    fontSize: '9px',
                                                    color: 'rgba(255, 255, 255, 0.65)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Voided
                                                </span>
                                            </div>
                                        </li>

                                        <li
                                            className="menu-item main-li shadow-lg"
                                            onClick={getMyUploads}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 10px', minHeight: '40px' }}
                                        >
                                            <FaSave style={{ fontSize: '16px', flexShrink: 0 }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
                                                <span style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Saved for Later ({myuploads.length})
                                                </span>
                                                <span style={{
                                                    fontSize: '9px',
                                                    color: 'rgba(255, 255, 255, 0.65)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Unsigned
                                                </span>
                                            </div>
                                        </li>

                                        <li
                                            className="menu-item main-li shadow-lg"
                                            onClick={getTrashed}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 10px', minHeight: '40px' }}
                                        >
                                            <FaTrashAlt style={{ fontSize: '16px', flexShrink: 0 }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
                                                <span style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Trashed ({trashed.length})
                                                </span>
                                                <span style={{
                                                    fontSize: '9px',
                                                    color: 'rgba(255, 255, 255, 0.65)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    lineHeight: '1.2'
                                                }}>
                                                    Deleted items
                                                </span>
                                            </div>
                                        </li>


                                    </ul>

                                    {/* Bottom Logout */}
                                    <div style={{ marginTop: 'auto' }}>
                                        <ul className="bottom-buttons" style={{ padding: 0, margin: 0 }}>
                                            {user.is_admin === "True" && (
                                                <li
                                                    onClick={adminPage}
                                                    className="menu-item main-li shadow-lg"
                                                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 10px', minHeight: '40px' }}
                                                >
                                                    <FaUserShield style={{ fontSize: '16px', flexShrink: 0 }} />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
                                                        <span style={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            fontSize: '13px',
                                                            fontWeight: '500',
                                                            lineHeight: '1.2'
                                                        }}>
                                                            Administration
                                                        </span>
                                                        <span style={{
                                                            fontSize: '9px',
                                                            color: 'rgba(255, 255, 255, 0.65)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            lineHeight: '1.2'
                                                        }}>
                                                            Manage settings
                                                        </span>
                                                    </div>
                                                </li>
                                            )}
                                            <li
                                                onClick={logoutUser}
                                                className="menu-item main-li shadow-lg"
                                                title="Logout"
                                                style={{ display: 'flex', alignItems: 'left', gap: 1, fontSize: 13 }}
                                            >
                                                <FaSignOutAlt style={{ fontSize: '16px' }} />
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                                    Logout
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                            )}
                        </nav>
                        <main className={`content ${sidebarOpen ? 'shifted' : 'full-width'}`}>
                            <Tooltip title={sidebarOpen ? 'Minimize sidebar' : 'Expand sidebar'}>
                                <div className={`bump-toggle ${sidebarOpen ? 'attached' : 'moved'}`} onClick={toggleSidebar}>
                                    {sidebarOpen ? (
                                        <FaCaretLeft style={{ fontSize: '16px' }} className="mx-2" />
                                    ) : (
                                        <FaCaretRight style={{ fontSize: '16px' }} className="mx-2" />
                                    )}
                                </div>
                            </Tooltip>
                            <div id="container" ref={containerRef} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', backgroundColor: '#fff' }}>
                                {/* Object List */}
                                <div id="col1" ref={col1Ref} style={{ width: isMobile ? '100%' : '35%', backgroundColor: '#fff', minWidth: '25%', minHeight: '100vh' }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" py={1} bgcolor="#fff" color="#1C4690"
                                        sx={{ boxShadow: '0px 4px 4px -2px rgba(0, 0, 0, 0.1)', position: 'relative', zIndex: 10 }}>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                onClick={toggleSidebar}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 40,
                                                    height: 40,
                                                    cursor: 'pointer',
                                                    borderRadius: 1,
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        backgroundColor: '#fff',
                                                        transform: 'scale(1.05)',
                                                    },
                                                }}
                                            >
                                                <FaBars style={{ fontSize: '25px', color: '#2757aa' }} />
                                            </Box>
                                            <img
                                                src={companylogo || logo2}
                                                alt="Logo"
                                                className="shadow-sm"
                                                style={{
                                                    height: "40px",
                                                    cursor: "pointer",
                                                    padding: "5px",
                                                    transition: "transform 0.2s ease-in-out",
                                                }}
                                            />

                                        </Box>
                                        <Box display="flex" px={1} alignItems="center">
                                            <Tooltip title={`${user.first_name} ${user.last_name}`}>
                                                {/* <Avatar
                                                    onClick={showProfile}
                                                    alt={`${user.first_name} ${user.last_name}`}
                                                    className="card-avatar"
                                                    src={avatar || defaultAvatar}
                                                    sx={{
                                                        width: 45,
                                                        height: 45,
                                                        backgroundColor: avatar ? 'transparent' : 'transparent',
                                                        color: 'white',

                                                    }}
                                                /> */}
                                                {/* <Avatar
                                                    onClick={showProfile}
                                                    alt={
                                                        user.first_name && user.last_name
                                                            ? `${user.first_name} ${user.last_name}`
                                                            : user.first_name || user.last_name || user.username
                                                    }
                                                    src={avatar || defaultAvatar}
                                                    {...stringAvatar(
                                                        user.first_name && user.last_name
                                                            ? `${user.first_name} ${user.last_name}`
                                                            : user.first_name || user.last_name || user.username
                                                    )}
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        backgroundColor: '#2757aa',
                                                        fontSize: '12.5px',
                                                    }}
                                                /> */}
                                                <UserAvatarMenu
                                                    user={user}
                                                    stringAvatar={stringAvatar}
                                                    onLogout={logoutUser}
                                                    src={avatar || defaultAvatar}
                                                    showprofile={showProfile}
                                                />

                                            </Tooltip>


                                        </Box>
                                    </Box>
                                    <div className='container p-3' style={{ minHeight: '90vh', backgroundColor: '#f8f9fa' }}>
                                        {activeForm === 'profile' && (
                                            <div className="text-center p-2" style={{ maxWidth: '360px', margin: '0 auto' }}>
                                                <div className="bg-white shadow-sm rounded px-3 py-3">

                                                    {/* Title Row - Tight and compact */}
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: '#2757aa',
                                                            mb: 0.3,
                                                            fontSize: '15px',
                                                        }}
                                                    >
                                                        Profile
                                                    </Typography>

                                                    {/* Email on one line, tighter spacing */}
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontSize: '12px',
                                                            color: '#555',
                                                            mb: 1.5,
                                                        }}
                                                    >
                                                        Email: <strong>{user.email}</strong>
                                                    </Typography>

                                                    <form onSubmit={updateUser}>
                                                        <Grid container spacing={1.5}>

                                                            {/* First Name */}
                                                            <Grid item xs={12} sm={6}>
                                                                <FormControl fullWidth variant="standard">
                                                                    <Input
                                                                        id="first_name"
                                                                        name="first_name"
                                                                        placeholder={user.first_name}
                                                                        startAdornment={
                                                                            <InputAdornment position="start">
                                                                                <FaUser style={{ fontSize: '13px', color: '#555' }} />
                                                                            </InputAdornment>
                                                                        }
                                                                        sx={{
                                                                            fontSize: '12px',
                                                                            borderBottom: '1px solid #ddd',
                                                                            py: 0.6,
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                            </Grid>

                                                            {/* Last Name */}
                                                            <Grid item xs={12} sm={6}>
                                                                <FormControl fullWidth variant="standard">
                                                                    <Input
                                                                        id="last_name"
                                                                        name="last_name"
                                                                        placeholder={user.last_name}
                                                                        startAdornment={
                                                                            <InputAdornment position="start">
                                                                                <FaUser style={{ fontSize: '13px', color: '#555' }} />
                                                                            </InputAdornment>
                                                                        }
                                                                        sx={{
                                                                            fontSize: '12px',
                                                                            borderBottom: '1px solid #ddd',
                                                                            py: 0.6,
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                            </Grid>

                                                            {/* Phone */}
                                                            <Grid item xs={12}>
                                                                <FormControl fullWidth variant="standard">
                                                                    <Input
                                                                        id="phone"
                                                                        name="phone"
                                                                        placeholder={user.phone ?? 'Enter phone number'}
                                                                        startAdornment={
                                                                            <InputAdornment position="start">
                                                                                <FaPhone style={{ fontSize: '13px', color: '#555' }} />
                                                                            </InputAdornment>
                                                                        }
                                                                        sx={{
                                                                            fontSize: '12px',
                                                                            borderBottom: '1px solid #ddd',
                                                                            py: 0.6,
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                            </Grid>

                                                            {/* Avatar */}
                                                            <Grid item xs={12}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography sx={{ fontSize: '12px', color: '#555', minWidth: '60px' }}>
                                                                        <FaIdBadge className="me-1" /> Avatar
                                                                    </Typography>

                                                                    <Input
                                                                        id="avatar"
                                                                        name="avatar"
                                                                        type="file"
                                                                        onChange={handleAvatarFileChange}
                                                                        inputProps={{ accept: 'image/png' }}
                                                                        sx={{
                                                                            fontSize: '12px',
                                                                            border: '1px solid #ddd',
                                                                            borderRadius: '6px',
                                                                            py: 0.4,
                                                                            px: 1,
                                                                            flexGrow: 1,
                                                                        }}
                                                                    />
                                                                </Box>
                                                            </Grid>

                                                            {/* Buttons - Very compact */}
                                                            <Grid item xs={12}>
                                                                <Box display="flex" justifyContent="space-between" mt={1}>

                                                                    {/* <ButtonComponent
                                                                        cssClass="e-custom-primary"
                                                                        style={{ width: '32%', padding: '6px', textTransform: 'none' }}
                                                                        onClick={changePassword}
                                                                    >
                                                                        Reset
                                                                    </ButtonComponent> */}
                                                                    {/* <Button
                                                                                      type="submit"
                                                                                      variant="contained"
                                                                                      className="mb-3 rounded-pill"
                                                                                      disabled={miniLoader}
                                                                                      startIcon={miniLoader ? <CircularProgress size={14} color="inherit" /> : null}
                                                                    
                                                                                      style={{
                                                                                        fontSize: '13px',
                                                                                        textTransform: 'none',
                                                                                        px: 2,
                                                                                        py: 1,
                                                                                        width: '100%',
                                                                                        backgroundColor: miniLoader ? '#ccc' : '#2757aa',
                                                                                        color: '#fff',
                                                                                        '&:hover': {
                                                                                          backgroundColor: miniLoader ? '#ccc' : '#1e4794',
                                                                                        },
                                                                                      }}
                                                                                    >
                                                                    
                                                                                      {miniLoader ? 'Logging in ...' : 'LOGIN'}
                                                                                    </Button> */}

                                                                    <Button
                                                                        variant="contained"
                                                                        color="warning"
                                                                        style={{ width: '32%', padding: '6px', textTransform: 'none' }}
                                                                        onClick={backHome}
                                                                    >
                                                                        Cancel
                                                                    </Button>

                                                                    <Button
                                                                        variant="contained"
                                                                        color="success"
                                                                        style={{ width: '32%', padding: '6px', textTransform: 'none' }}
                                                                        type="submit"
                                                                    >
                                                                        Save
                                                                    </Button>

                                                                </Box>
                                                            </Grid>

                                                        </Grid>
                                                    </form>
                                                </div>
                                            </div>


                                        )}
                                        {activeForm === 'file-upload' && (
                                            <div className="text-center p-2  mx-2">
                                                {/* <h6 className='my-3' style={{ color: '#495057' }}> Welcome Back </h6> */}

                                                <FileUpload
                                                    setFiles={setFiles}
                                                    title={title}
                                                    setTitle={setTitle}
                                                    files={files}
                                                    loading={loadingmini}
                                                    onFileSelected={() => setActiveForm('sign-type')}
                                                    selfSign={selfSign}
                                                    mailtoSigners={mailtoSigners}
                                                    saveToMyFolder={saveToMyFolder}
                                                />
                                            </div>
                                        )}

                                    </div>
                                </div>
                                {!isMobile && (
                                    <div id="divider" ref={dividerRef} onMouseDown={handleMouseDown} style={{
                                        width: '3px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#ddd',
                                        cursor: 'ew-resize',
                                        transition: 'width 0.2s ease',
                                        height: '100vh'
                                    }}></div>
                                )}
                                {/* Object View List */}
                                <div id="col2" ref={col2Ref} style={{ width: isMobile ? '100%' : '65%', backgroundColor: '#fff', minWidth: '35%', minHeight: '100vh' }}>
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ borderColor: 'divider', height: '40px' }}>
                                            <Tabs style={{ overflowX: 'scroll' }} value={value} onChange={(_, nv) => setValue(nv)} aria-label="basic tabs example">
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Inbox" {...a11yProps(0)} />
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Outbox" {...a11yProps(1)} />
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Complete" {...a11yProps(2)} />
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Voided" {...a11yProps(3)} />
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Saved" {...a11yProps(4)} />
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Trashed" {...a11yProps(5)} />
                                            </Tabs>
                                        </Box>
                                        <Box sx={{ borderColor: 'divider', marginTop: '25px' }}>
                                            <CustomTabPanel value={value} index={0}>

                                                <Inbox
                                                    previewFile={previewFileInbox}
                                                    inbox={inbox}
                                                    setInbox={setInbox}
                                                    signFromInbox={signFromInbox}
                                                    getSignerUid={getSignerUid}
                                                    refreshdata={refreshdata}

                                                    setOpenAlert={setOpenAlert}
                                                    setAlertMsg={setAlertMsg}
                                                    setAlertSeverity={setAlertSeverity}
                                                    alertMsg={alertmsg}
                                                    alertSeverity={alertseverity}
                                                    openAlert={openalert}

                                                    filters={filters}
                                                    setFilters={setFilters}
                                                    loading={loadingInbox}
                                                    getInbox={getInbox}
                                                />
                                            </CustomTabPanel>
                                            <CustomTabPanel value={value} index={1}>
                                                <Outbox
                                                    previewFile={previewFile}
                                                    refreshdata={refreshdata}
                                                    getSignerUid={getSignerUid}
                                                    signeruid={signeruid}
                                                    outbox={outbox}
                                                    filters={filters}
                                                    setFilters={setFilters}
                                                    loading={loadingOutbox}
                                                    getOutbox={getOutbox}

                                                    setOpenAlert={setOpenAlert}
                                                    setAlertMsg={setAlertMsg}
                                                    setAlertSeverity={setAlertSeverity}

                                                    alertMsg={alertmsg}
                                                    alertSeverity={alertseverity}
                                                    openAlert={openalert}
                                                />
                                            </CustomTabPanel>
                                            <CustomTabPanel value={value} index={2}>
                                                <Complete
                                                    previewFile={previewFile}
                                                    complete={complete}
                                                    getSignerUid={getSignerUid}
                                                    authTokens={authTokens}
                                                    filters={filters}
                                                    setFilters={setFilters}
                                                    getComplete={getComplete}
                                                    loading={loadingComplete}

                                                />
                                            </CustomTabPanel>
                                            <CustomTabPanel value={value} index={3}>
                                                <Voided
                                                    previewFile={previewFile}
                                                    getComments={getComments}
                                                    refreshdata={refreshdata}
                                                    voided={voided}
                                                />
                                            </CustomTabPanel>
                                            <CustomTabPanel value={value} index={4}>
                                                <MyUploads
                                                    previewFile={previewFile}
                                                    signFromInbox={signFromInbox}
                                                    sendUploadForSigning={sendUploadForSigning}
                                                    selfSignSaved={selfSignSaved}
                                                    myuploads={myuploads}
                                                />
                                            </CustomTabPanel>
                                            <CustomTabPanel value={value} index={5}>
                                                <Trashed
                                                    previewFile={previewFile}
                                                    signFromInbox={signFromInbox}
                                                    sendUploadForSigning={sendUploadForSigning}
                                                    selfSignSaved={selfSignSaved}
                                                    trashed={trashed}
                                                    setTrashed={setTrashed}
                                                    refreshdata={refreshdata}
                                                    setOpenAlert={setOpenAlert}
                                                    setAlertMsg={setAlertMsg}
                                                    setAlertSeverity={setAlertSeverity}
                                                    user={user}
                                                />
                                            </CustomTabPanel>

                                        </Box>

                                    </Box>
                                </div>
                            </div>
                        </main>
                    </div>
                </>
            }
        </>
    )
}

export default Dashboard