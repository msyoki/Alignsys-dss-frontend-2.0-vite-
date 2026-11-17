
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import * as constants from "../../components/constants/constants"
import { FaCircle, FaBan, FaSave, FaTrashAlt, FaUserShield, FaKey } from 'react-icons/fa';
import AppShell from '../../components/layout/AppShell';
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Trashed from '../../components/dashboard/Trashed.jsx';
import LicenseStatus from '../../components/dialogs/LicenseStatusDialog.jsx';
import TimedAlert from '../../components/TimedAlert.jsx';
import AddSignersDialogMerged from '../../components/dialogs/AddSignersDialogMerged';
import CommentsDialog from '../../components/dialogs/CommentsDialog.jsx';
import ProfileDialog from '../../components/dialogs/ProfileDialog.jsx';
import PreviewerDialog from '../../components/dialogs/PreviewerDialog.jsx';
import FileUpload from '../../components/FileUpload.jsx';
import Complete from '../../components/dashboard/Complete'
import Inbox from '../../components/dashboard/Inbox'
import Voided from '../../components/dashboard/Voided'
import Outbox from '../../components/dashboard/Outbox'
import MyUploads from '../../components/dashboard/MyUploads'
import logo2 from '../../images/ZFBLU.png'
import BrandLogo from '../../components/common/BrandLogo'
import { companyLogoUrl } from '../../utils/companyLogo'


import AuthContext from '../../context/Authcontext.jsx';

function CustomTabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            style={value === index ? { height: '100%', minHeight: 0 } : undefined}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 1, height: '100%', boxSizing: 'border-box', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Typography component="div" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</Typography>
                </Box>
            )}
        </div>
    )
}

// Header caption for each document list (matches the tab index in `value`).
const SECTION_CAPTIONS = ['Inbox', 'Outbox', 'Completed', 'Voided', 'Saved for later', 'Trashed']

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
    // What the upload-step loader says (depends on the action the user picked).
    const [loadingMsg, setLoadingMsg] = useState('')
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
    const fullName = user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name || user.last_name || user.username
    const [files, setFiles] = useState([])
    const [title, setTitle] = useState('')

    const [activeForm, setActiveForm] = useState('file-upload') // 'file-upload', 'sign-type'
    const [openProfile, setOpenProfile] = useState(false)

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
            setCompanyLogo(companyLogoUrl(res.data))
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
            setOpenProfile(false)

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
        setLoadingMsg('Preparing your document for signing…');
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
        setLoadingMsg('Preparing your document for signers…');
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
        setLoadingMsg('Saving your document…');
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
    const showProfile = () => setOpenProfile(true)
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

                    <AddSignersDialogMerged
                        setAlertSeverity={setAlertSeverity}
                        setAlertMsg={setAlertMsg}
                        setOpenAlert={setOpenAlert}
                        loading={loading}
                        setLoading={setLoading}
                        getWorkflows={getWorkflows}
                        workflows={workflows}
                        organizationWorkflows={organizationWorkflows}
                        opendialogaddsigners={opendialogaddsigners}
                        setOpenDialogAddSigners={setOpenDialogAddSigners}
                        fileurl={uploadedfileurl}
                        refreshdata={refreshdata}
                        setActiveForm={setActiveForm}
                    />

                    <ProfileDialog
                        open={openProfile}
                        onClose={() => setOpenProfile(false)}
                        user={user}
                        avatarSrc={avatar}
                        onSubmit={updateUser}
                        onAvatarChange={handleAvatarFileChange}
                    />
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
                        <AppShell
                            caption={SECTION_CAPTIONS[value] ?? 'Dashboard'}
                            orgName={user.company}
                            sections={[
                                { key: 0, label: 'Inbox', hint: 'Waiting for me', count: inbox.length, icon: <FaCircle className="text-danger" /> },
                                { key: 1, label: 'Outbox', hint: 'Waiting for others', count: outbox.length, icon: <FaCircle className="text-warning" /> },
                                { key: 2, label: 'Completed', hint: 'Signed', count: complete.length, icon: <FaCircle className="text-success" /> },
                                { key: 3, label: 'Voided', count: voided.length, icon: <FaBan /> },
                                { key: 4, label: 'Saved for later', hint: 'Unsigned', count: myuploads.length, icon: <FaSave /> },
                                { key: 5, label: 'Trashed', hint: 'Deleted items', count: trashed.length, icon: <FaTrashAlt /> },
                            ]}
                            footerSections={user.is_admin === "True" ? [{ key: 'admin', label: 'Administration', hint: 'Manage settings', icon: <FaUserShield /> }] : []}
                            activeKey={value}
                            onSelect={(key) => {
                                if (key === 0) getInbox(filters.start_date, filters.end_date)
                                else if (key === 1) getOutbox(filters.start_date, filters.end_date)
                                else if (key === 2) getComplete(filters.start_date, filters.end_date)
                                else if (key === 3) getVoided()
                                else if (key === 4) getMyUploads()
                                else if (key === 5) getTrashed()
                                else if (key === 'admin') adminPage()
                            }}
                            open={sidebarOpen}
                            onOpenChange={setSidebarOpen}
                            userName={fullName}
                            avatarSrc={avatar}
                            onOpenProfile={showProfile}
                            onLogout={logoutUser}
                            accountMenuItems={[
                                { key: 'reset', label: 'Reset password', icon: <FaKey size={14} />, onClick: () => { window.location.href = '/password-reset' } },
                                // Super admins only: the platform-wide dashboard (kept out of the sidebar).
                                ...(user.is_superuser === 'True' ? [
                                    { key: 'sadmin', label: 'Super Admin Dashboard', icon: <FaUserShield size={14} />, onClick: () => navigate('/super/admin/dashboard') },
                                ] : []),
                            ]}
                            headerExtra={
                                <BrandLogo
                                    src={companylogo}
                                    fallback={logo2}
                                    alt="Organization logo"
                                    style={{ height: 40, maxWidth: 140, padding: 4, objectFit: 'contain' }}
                                />
                            }
                        >
                            <div id="container" ref={containerRef} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', backgroundColor: '#fff', minHeight: '100%' }}>
                                {/* Object List */}
                                <div id="col1" ref={col1Ref} style={{ width: isMobile ? '100%' : '35%', backgroundColor: '#fff', minWidth: '25%', minHeight: isMobile ? 'auto' : 'calc(100dvh - 64px)', display: 'flex', flexDirection: 'column' }}>
                                    <div className='container p-3' style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
                                        {activeForm === 'file-upload' && (
                                            <div className="text-center p-2  mx-2">
                                                {/* <h6 className='my-3' style={{ color: '#495057' }}> Welcome Back </h6> */}

                                                <FileUpload
                                                    setFiles={setFiles}
                                                    title={title}
                                                    setTitle={setTitle}
                                                    files={files}
                                                    loading={loadingmini}
                                                    loadingMessage={loadingMsg}
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
                                    }}></div>
                                )}
                                {/* Object View List */}
                                <div id="col2" ref={col2Ref} style={{ width: isMobile ? '100%' : '65%', backgroundColor: '#fff', minWidth: '35%', display: 'flex', flexDirection: 'column', height: isMobile ? '85dvh' : 'calc(100dvh - 64px)' }}>
                                    {/* Tab bar keeps its height; the active tab fills the rest so its table
                                        fits the screen and the logo under it stays in view. */}
                                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                        <Box sx={{ borderColor: 'divider', flexShrink: 0 }}>
                                            <Tabs style={{ overflowX: 'scroll' }} value={value} onChange={(_, nv) => setValue(nv)} aria-label="basic tabs example">
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Inbox" {...a11yProps(0)} />
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Outbox" {...a11yProps(1)} />
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Complete" {...a11yProps(2)} />
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Voided" {...a11yProps(3)} />
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Saved" {...a11yProps(4)} />
                                                <Tab sx={{ textTransform: 'none', fontSize: '13px', width: 'auto', height: '61px', minWidth: 'auto' }} label="Trashed" {...a11yProps(5)} />
                                            </Tabs>
                                        </Box>
                                        <Box sx={{ borderColor: 'divider', flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
                        </AppShell>
                </>
            }
        </>
    )
}

export default Dashboard