import React, { useRef, useContext, useState, useEffect, useCallback } from 'react'
import '../../styles/Dashboard.css'
import { FaUserPlus, FaPlusCircle, FaUserCircle, FaMobile, FaUserShield, FaTrashAlt, FaArrowRight, FaBackward, FaSignOutAlt, FaUser, FaFolderOpen, FaList, FaProjectDiagram, FaCheckCircle, FaPencilAlt, FaImages, FaCog, FaCaretLeft, FaCaretRight } from 'react-icons/fa';
import AuthContext from '../../context/Authcontext'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'

import NewUserDialog from '../../components/NewUserDialog'
import UserUpdateDialog from '../../components/dialogs/UserUpdateDialog'
import ActivityLogs from '../../components/ActivityLogs'
import logo from '../../images/ZFBLU.webp'
import Users from '../../components/Users'
import DocumentLogs from '../../components/DocumentLogs'
import CompanyEdits from '../../components/CompanyEdits'
import * as constants from "../../components/constants/constants"
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { List, ListItem, ListItemButton, Switch, Tooltip, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import LoadingMini from '../../components/loaders/LoadingMini';
import TimedAlert from '../../components/TimedAlert';
import WarningIcon from '@mui/icons-material/Warning';
import { jsonPhoneCodesData } from '../../data/country-phone-codes';

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
                <Box sx={{ p: 1, mt: 1, backgroundColor: '#fff' }}>
                    <Typography component="div">{children}</Typography>
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

function a11yProps2(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    }
}

// --- Extracted Components ---
const AddSignerForm = ({
    onSubmit, checked, setChecked, emailInputRef, phoneNumberRef, phoneCodeRef
}) => (
    <form onSubmit={onSubmit}>
        <div className="rounded mb-2">
            <h5 className="mb-2" style={{ fontSize: 13, color: '#2757aa' }}>
                <FaUserPlus className="me-2" />Add new signer
            </h5>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap" style={{ fontSize: 13 }}>
                <input
                    ref={emailInputRef}
                    className="form-control form-control-sm"
                    type="email"
                    name="to"
                    placeholder="Enter email e.g. example@gmail.com"
                    required
                    aria-label="Signer email"
                    style={{ minWidth: 220, maxWidth: 260 }}
                />
                <label htmlFor="otpSwitch" className="text-dark mb-0" style={{ userSelect: 'none', whiteSpace: 'nowrap', fontSize: 13 }}>
                    Enable SMS OTP verification
                </label>
                <Switch
                    id="otpSwitch"
                    checked={checked}
                    onChange={e => setChecked(e.target.checked)}
                    inputProps={{ 'aria-label': 'Enable SMS OTP verification' }}
                    className="ms-1"
                    size="small"
                />
            </div>
            {checked && (
                <div className="d-flex gap-1 mb-2" style={{ maxWidth: 300 }}>
                    <select
                        ref={phoneCodeRef}
                        className="form-control form-control-sm"
                        name="phoneCode"
                        style={{ maxWidth: 100, padding: '0.25rem 0.5rem' }}
                        aria-label="Select country code"
                    >
                        <option value="+254">Kenya (+254)</option>
                        {jsonPhoneCodesData.map((item, index) => (
                            <option key={index} value={item.dial_code}>
                                {item.name} ({item.dial_code})
                            </option>
                        ))}
                    </select>
                    <input
                        ref={phoneNumberRef}
                        type="tel"
                        className="form-control form-control-sm"
                        maxLength={15}
                        name="phoneNumber"
                        placeholder="e.g. 722XXXXXX"
                        pattern="[1-9][0-9]{6,14}"
                        title="Enter a valid phone number without the country code"
                        aria-label="Phone number"
                        style={{ minWidth: 160, padding: '0.25rem 0.5rem' }}
                    />
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    style={{
                        textTransform: 'none',
                        fontWeight: 300,
                        padding: '0.625rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <FaPlusCircle />
                    Add Signer
                </Button>
            </div>



        </div>
    </form>
)

const SignersList = ({ signers, removeSigner }) => (
    <div className="d-flex flex-wrap align-items-center mt-2 my-2 shadow-lg p-3" style={{ maxHeight: '25vh', overflowY: 'auto' }}>
        {signers.map((item, index) => (
            <React.Fragment key={index}>
                <div
                    className="d-flex align-items-center shadow-sm px-3 py-2 me-2 mb-2"
                    style={{
                        borderRadius: 25,
                        backgroundColor: 'white',
                        fontSize: 13,
                        maxWidth: '100%',
                        flexShrink: 0,
                    }}
                >
                    <FaUserCircle className="me-1" style={{ color: '#2757aa' }} />
                    <span className="me-2 text-dark">{item.email}</span>
                    {item.phone && (
                        <Tooltip title="OTP authentication enabled" placement="top">
                            <FaMobile className="text-primary me-2" />
                        </Tooltip>
                    )}
                    {item.authenticate && (
                        <Tooltip title="Account verification enabled" placement="top">
                            <FaUserShield className="text-primary me-2" />
                        </Tooltip>
                    )}
                    <FaTrashAlt
                        className="text-danger"
                        style={{ cursor: 'pointer' }}
                        onClick={e => removeSigner(e, item.email)}
                    />
                </div>
                {index < signers.length - 1 && (
                    <FaArrowRight
                        className="me-2 text-nowrap"
                        style={{ color: '#2757aa', fontSize: 16 }}
                    />
                )}
            </React.Fragment>
        ))}
    </div>
);

function AdminDashboard() {
    // --- State ---
    const selectRef = useRef()
    const [value, setValue] = useState(0)
    const [value2, setValue2] = useState(0)
    const [showPassword, setShowPassword] = useState(false)
    const [opendialognewuser, setOpenDialogNewUser] = useState(false)
    const [opendialogupdateuser, setOpenDialogUpdateUser] = useState(false)
    const [users, setUsers] = useState([])
    const [currentedituseremail, setCurrentEditUserEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [opendialogcompanyedits, setOpenDialogCompanyEdits] = useState(false)
    const location = useLocation()
    const { authTokens, logoutUser, user } = useContext(AuthContext)
    const [avatar, setAvatar] = useState('')
    const [openalert, setOpenAlert] = useState(false)
    const [alertseverity, setAlertSeverity] = useState('')
    const [alertmsg, setAlertMsg] = useState('')
    const [companylogs, setCompanyLogs] = useState([])
    const [companydocs, setCompanyDocs] = useState([])
    const [companylogo, setCompanyLogo] = useState('')
    const [smtpconfigs, setSMTPConfigs] = useState({})
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [filters, setFilters] = useState({ start_date: '', end_date: '' })
    const [loadingDocs, setLoadingDocs] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [loadingActivity, setLoadingActivity] = useState(false)
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
    const [pendingFormData, setPendingFormData] = useState(null)
    const [organizationWorkflows, setOrganizationWorkflows] = useState([])
    const [workflow, setWorkflow] = useState('')
    const [signers, setSigners] = useState([])
    const [selectedworkflowtitle, setSelectedWorkflowTitle] = useState('')
    const [checked, setChecked] = useState(false)
    const [updateWorkflow, setUpdateWorkflow] = useState(false)
    const [wfTitleUpdated, setWfTitleUpdated] = useState(false)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [workflowLoading, setWorkflowLoading] = useState(false)
    const [editingTitle, setEditingTitle] = useState(false)
    const [editingTitleValue, setEditingTitleValue] = useState('')

    const emailInputRef = useRef()
    const phoneNumberRef = useRef()
    const wfTitleRef = useRef()
    const phoneCodeRef = useRef()
    const [formData, setFormData] = useState({
        smtpPort: '',
        smtpHost: '',
        smtpUsername: '',
        smtpPassword: '',
        smtpDisplayName: ''
    })

    // --- Handlers ---
    const handleChange = (_, newValue) => setValue(newValue)
    const handleChange2 = (_, newValue) => setValue2(newValue)
    const handleTogglePassword = () => setShowPassword(prev => !prev)
    const toggleSidebar = () => setSidebarOpen(prev => !prev)

    // --- Signer logic ---
    const validateEmail = email =>
        /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email)

    const removeSigner = useCallback((e, email) => {
        setSigners(prev => {
            const updated = prev.filter(item => item.email !== email)
            if (updated.length === 0) {
                setUpdateWorkflow(false)
                setWorkflow('')
                setSelectedWorkflowTitle('')
            } else if (value2 === 0) {
                setUpdateWorkflow(true)
            }
            return updated
        })
    }, [value2])

    const addMailList = useCallback((e) => {
        e.preventDefault()
        const email = emailInputRef.current.value
        if (checked && (!phoneNumberRef.current.value || !phoneCodeRef.current.value)) {
            setOpenAlert(true)
            setAlertMsg('phone number is required for otp')
            setAlertSeverity('error')
            setTimeout(() => setOpenAlert(false), 3000)
            return
        }
        if (!email) {
            setOpenAlert(true)
            setAlertMsg('Email is required')
            setAlertSeverity('error')
            setTimeout(() => setOpenAlert(false), 3000)
            return
        }
        if (!validateEmail(email)) {
            setOpenAlert(true)
            setAlertMsg(`email ${email} is invalid, enter a valid email address`)
            setAlertSeverity('error')
            setTimeout(() => setOpenAlert(false), 3000)
            return
        }
        const otp = checked
        const signer = {
            email,
            ...(otp && { phone: `${phoneCodeRef.current.value}${phoneNumberRef.current.value}` }),
        }
        setSigners(prev => {
            if (prev.some(item => item.email === email)) {
                setOpenAlert(true)
                setAlertMsg('email already exists, enter another signer or send to signers')
                setAlertSeverity('error')
                setTimeout(() => setOpenAlert(false), 3000)
                return prev
            }
            emailInputRef.current.value = ''
            if (checked) phoneNumberRef.current.value = ''
            setChecked(false)
            if (value2 === 0) setUpdateWorkflow(true)
            return [...prev, signer]
        })
    }, [checked, value2])

    // --- API Calls ---
    const navigate = useNavigate()

    const getSmtpConfigs = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${constants.devApiBaseUrl}/api/get/smtp/configs/`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authTokens.access}`
                }
            })
            setSMTPConfigs(res.data)
        } catch (error) { }
        setLoading(false)
    }, [authTokens])

    const saveSettings = async (e) => {
        e.preventDefault()
        setPendingFormData(formData)
        setOpenConfirmDialog(true)
    }

    const handleConfirmedSubmit = async () => {
        setLoading(true)
        setOpenConfirmDialog(false)
        let data = JSON.stringify({
            ...(pendingFormData.smtpPort && { "port": `${pendingFormData.smtpPort}` }),
            ...(pendingFormData.smtpHost && { "url": `${pendingFormData.smtpHost}` }),
            ...(pendingFormData.smtpUsername && { "username": `${pendingFormData.smtpUsername}` }),
            ...(pendingFormData.smtpDisplayName && { "display_name": `${pendingFormData.smtpDisplayName}` }),
            ...(pendingFormData.smtpPassword && { "password": `${pendingFormData.smtpPassword}` }),
        })
        try {
            await axios.post(`${constants.devApiBaseUrl}/api/update/smtp/configs/ `, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authTokens.access}`
                }
            })
            getSmtpConfigs()
            setOpenAlert(true)
            setAlertSeverity('success')
            setAlertMsg('SMTP settings updated successfully!')
            setFormData({
                smtpPort: '',
                smtpHost: '',
                smtpUsername: '',
                smtpPassword: '',
                smtpDisplayName: ''
            })
        } catch (error) {
            setOpenAlert(true)
            setAlertSeverity('error')
            setAlertMsg('Failed to update SMTP settings. Please try again.')
        }
        setLoading(false)
    }

    const handleCancelSubmit = () => {
        setOpenConfirmDialog(false)
        setPendingFormData(null)
    }

    const getCompanyLogo = useCallback(() => {
        axios.get(`${constants.devApiBaseUrl}/api/logo/`, {
            headers: { 'Authorization': `Bearer ${authTokens.access} ` }
        }).then(res => {
            setCompanyLogo(`${constants.devApiBaseUrl}${res.data['logo_url']}`)
        })
    }, [authTokens])

    const getAvatar = useCallback(() => {
        axios.get(`${constants.devApiBaseUrl}/api/avatar/`, {
            headers: { 'Authorization': `Bearer ${authTokens.access}` }
        }).then(res => {
            setAvatar(`${constants.devApiBaseUrl}${res.data['avatar_url']}`)
        })
    }, [authTokens])

    const getDocLogs = useCallback(() => {
        setLoadingDocs(true)
        setValue(1)
        const params = {}
        if (filters.start_date) params.start_date = filters.start_date
        if (filters.end_date) params.end_date = filters.end_date
        axios.get(`${constants.devApiBaseUrl}/api/doc/logs/`, {
            headers: { 'Authorization': `Bearer ${authTokens.access}` },
            params
        }).then(res => {
            setCompanyDocs(res.data)
        }).finally(() => setLoadingDocs(false))
    }, [authTokens, filters])

    const getlogs = useCallback(() => {
        setLoadingActivity(true)
        setValue(2)
        const admin_email = user.email
        const admin_domain = admin_email.substring(admin_email.indexOf("@") + 1)
        let data = { domain: admin_domain }
        if (filters.startDate) data.start_date = filters.startDate
        if (filters.endDate) data.end_date = filters.endDate
        axios.post(`${constants.devApiBaseUrl}/api/logs/`, data, {
            headers: { 'Content-Type': 'application/json' }
        }).then(res => {
            setCompanyLogs(res.data)
        }).finally(() => setLoadingActivity(false))
    }, [user, filters])

    const getusers = useCallback(() => {
        setLoadingUsers(true)
        setValue(0)
        axios.post(`${constants.devApiBaseUrl}/api/users/`, { company: user.companyid }, {
            headers: {
                'Authorization': `Bearer ${authTokens.access} `,
                'Content-Type': 'application/json'
            }
        }).then(res => {
            setUsers(res.data)
        }).finally(() => setLoadingUsers(false))
    }, [authTokens, user])

    const getWorkflows = useCallback(async () => {
        try {
            const res = await axios.get(`${constants.devApiBaseUrl}/api/organization/workflows/`, {
                headers: { 'Authorization': `Bearer ${authTokens.access}` }
            })
            setOrganizationWorkflows(res.data)
            console.log(res.data)
        } catch (error) { }
    }, [authTokens])

    const AddOrganizationWorkflow = (e, selectedValue) => {
        setWorkflow(e.target.value)
        const intValue = +selectedValue
        const selectedWorkflow = organizationWorkflows.find((wf) => wf.id === intValue)
        if (selectedWorkflow) {
            setSelectedWorkflowTitle(selectedWorkflow.title)
            setSigners(selectedWorkflow.signers || [])
        }
    }

    const createOrganizationWorkflow = async (e) => {
        e.preventDefault()
        setWorkflowLoading(true)
        const workflowData = {
            title: wfTitleRef.current.value,
            users: signers
        }
        try {
            await axios.post(
                `${constants.devApiBaseUrl}/api/organization/workflows/create/`,
                workflowData,
                {
                    headers: {
                        'Authorization': `Bearer ${authTokens.access}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            setOpenAlert(true)
            setAlertMsg("new workflow was created successfully")
            setAlertSeverity("success")
            setSigners([])
            getWorkflows()
        } catch (error) {
            setOpenAlert(true)
            setAlertMsg("Error creating workflow, please try again later")
            setAlertSeverity("error")
        }
        setWorkflowLoading(false)
    }

    const updateOrganizationWorkflow = async () => {
        setWorkflowLoading(true)
        const workflowData = {
            title: editingTitleValue || selectedworkflowtitle,
            users: signers
        }
        try {
            await axios.put(
                `${constants.devApiBaseUrl}/api/organization/workflows/${workflow}/update/`,
                workflowData,
                {
                    headers: {
                        'Authorization': `Bearer ${authTokens.access}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            setOpenAlert(true)
            setAlertMsg("workflow update successfully")
            setAlertSeverity("success")
            setUpdateWorkflow(false)
            setSelectedWorkflowTitle(workflowData.title)
            await getWorkflows()
        } catch (error) {
            setOpenAlert(true)
            setAlertMsg("Update failed, please try again later")
            setAlertSeverity("error")
        }
        setWorkflowLoading(false)
    }

    const handleOpenDeleteDialog = () => setOpenDeleteDialog(true)
    const handleCloseDeleteDialog = () => setOpenDeleteDialog(false)

    const deleteOrganizationWorkflow = async () => {
        setOpenDeleteDialog(false)
        try {
            await axios.delete(
                `${constants.devApiBaseUrl}/api/organization/workflow/${workflow}/delete/`,
                {
                    headers: {
                        'Authorization': `Bearer ${authTokens.access}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            setOpenAlert(true)
            setAlertMsg("Workflow was deleted successfully")
            setAlertSeverity("success")
            setUpdateWorkflow(false)
            setWorkflow('')
            setSelectedWorkflowTitle('')
            setSigners([])
            getWorkflows()
        } catch (error) {
            setOpenAlert(true)
            setAlertMsg("Error deleting workflow, please try again later")
            setAlertSeverity("error")
        }
    }

    // --- Effects ---
    useEffect(() => {
        getWorkflows()
        getSmtpConfigs()
        getDocLogs()
        getlogs()
        getusers()
        getAvatar()
        getCompanyLogo()
        if (user.is_admin !== "True") navigate('/')
        try {
            setOpenAlert(location.state.openalert)
            setAlertMsg(location.state.alertmsg)
            setAlertSeverity(location.state.alertseverity)
            setTimeout(() => setOpenAlert(false), 3000)
        } catch (err) { }
        // eslint-disable-next-line
    }, [])

    // --- Render ---
    return (
        <>
            <CompanyEdits getCompanyLogo={getCompanyLogo} setCompanyLogo={setCompanyLogo} companylogo={companylogo} opendialogcompanyedits={opendialogcompanyedits} setOpenDialogCompanyEdits={setOpenDialogCompanyEdits} />
            <NewUserDialog
                user={user}
                getusers={getusers}
                setOpenDialogNewUser={setOpenDialogNewUser}
                opendialognewuser={opendialognewuser}
                openalert={openalert}
                setOpenAlert={setOpenAlert}
                alertmsg={alertmsg}
                setAlertMsg={setAlertMsg}
                alertseverity={alertseverity}
                setAlertSeverity={setAlertSeverity}
                authTokens={authTokens}
            />
            <UserUpdateDialog
                user={user}
                getusers={getusers}
                useremail={currentedituseremail}
                setOpenDialogUpdateUser={setOpenDialogUpdateUser}
                opendialogupdateuser={opendialogupdateuser}
                openalert={openalert}
                setOpenAlert={setOpenAlert}
                alertmsg={alertmsg}
                setAlertMsg={setAlertMsg}
                alertseverity={alertseverity}
                setAlertSeverity={setAlertSeverity}
                selectedUserId={selectedUserId}
                users={users}
            />

            {/* Delete Workflow Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                aria-labelledby="delete-workflow-dialog-title"
                aria-describedby="delete-workflow-dialog-description"
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle id="delete-workflow-dialog-title">
                    <span style={{ color: '#2757aa' }}> Confirm Delete Workflow</span>
                </DialogTitle>
                <DialogContent>
                    Are you sure you want to delete this workflow? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} color="primary" variant="outlined" className='rounded-pill' style={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={deleteOrganizationWorkflow}
                        color="error"
                        variant="contained"
                        autoFocus
                        className="rounded-pill"
                        style={{ textTransform: 'none' }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* SMTP Confirmation Dialog */}
            <Dialog
                open={openConfirmDialog}
                onClose={handleCancelSubmit}
                aria-labelledby="smtp-confirm-dialog-title"
                aria-describedby="smtp-confirm-dialog-description"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle
                    id="smtp-confirm-dialog-title"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor: '#fff3cd',
                        color: '#856404'
                    }}
                >
                    <WarningIcon color="warning" />
                    Confirm SMTP Settings Update
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="smtp-confirm-dialog-description" sx={{ mt: 2, fontSize: '13px !important' }}>
                        <strong>Warning:</strong> You are about to update the SMTP configuration settings.
                        This will affect how emails are sent from the system.
                        <br /><br />
                        Please confirm that you want to proceed with updating the following settings:
                        <br /><br />
                        {pendingFormData && (
                            <Box component="ul" sx={{ mt: 1, mb: 1 }}>
                                {pendingFormData.smtpPort && <li><strong>SMTP Port:</strong> {pendingFormData.smtpPort}</li>}
                                {pendingFormData.smtpHost && <li><strong>SMTP Host:</strong> {pendingFormData.smtpHost}</li>}
                                {pendingFormData.smtpUsername && <li><strong>SMTP Username:</strong> {pendingFormData.smtpUsername}</li>}
                                {pendingFormData.smtpDisplayName && <li><strong>Display Name:</strong> {pendingFormData.smtpDisplayName}</li>}
                                {pendingFormData.smtpPassword && <li><strong>Password:</strong> ••••••••</li>}
                            </Box>
                        )}
                        <br />
                        Are you sure you want to continue?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={handleCancelSubmit}
                        variant="outlined"
                        color="warning"
                        size="small"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmedSubmit}
                        variant="contained"
                        color="primary"
                        size="small"
                        autoFocus
                    >
                        Yes, Update Settings
                    </Button>
                </DialogActions>
            </Dialog>
            <div className="dashboard">
                <nav className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                    {sidebarOpen && (
                        <div className="sidebar-content" style={{ marginTop: 0 }}>
                            <div className="d-flex flex-column justify-content-center align-items-center bg-white shadow-lg"
                                style={{
                                    height: 60,
                                    minHeight: 61,
                                    maxHeight: 61,
                                    overflow: "hidden",
                                }}>
                                <img
                                    src={companylogo || logo}
                                    alt="Organization logo"
                                    className="logo"
                                    style={{
                                        width: "auto",
                                        maxWidth: "80%",
                                        maxHeight: 48,
                                        objectFit: "contain",
                                    }}
                                />
                            </div>
                            <div className='text-center mt-0 mb-0 p-1 shadow-lg'>
                                <span className='mr-2' style={{ fontSize: 12 }}>{user.first_name} {user.last_name}</span>
                            </div>
                            <div className='text-center mt-0 mb-0 p-1 shadow-lg' style={{ textTransform: 'uppercase' }}>
                                <span className='mr-2' style={{ fontSize: 12 }}>
                                    {user.company}
                                </span>
                            </div>
                            <ul className="menu-items">
                                <li onClick={() => navigate('/')} className="menu-item main-li shadow-lg">
                                    <FaBackward style={{ fontSize: 18, marginRight: 10 }} />
                                    <span style={{ fontSize: 12 }}>Return Home</span>
                                </li>
                                <li className="menu-item main-li shadow-lg" onClick={() => setOpenDialogNewUser(true)}>
                                    <FaUserPlus style={{ fontSize: 18, marginRight: 10, verticalAlign: 'middle' }} />
                                    <span style={{ fontSize: 12, verticalAlign: 'middle' }}>Add New User </span>
                                </li>
                                <li className="menu-item main-li shadow-lg" onClick={() => setOpenDialogCompanyEdits(true)} >
                                    <FaImages style={{ fontSize: 18, marginRight: 10, verticalAlign: 'middle' }} />
                                    <span style={{ fontSize: 12, verticalAlign: 'middle' }}>Change Organization Logo</span>
                                </li>

                            </ul>
                            <div>
                                <ul className="bottom-buttons">

                                    {user.is_superuser === 'True' && (
                                        <li onClick={() => navigate('/super/admin/dashboard')} className="menu-item main-li shadow-lg">
                                            <FaUserShield style={{ fontSize: 18, marginRight: 10, verticalAlign: 'middle' }} />
                                            <span style={{ fontSize: 12, verticalAlign: 'middle' }}>SAdmin Dashboard</span>
                                        </li>
                                    )}
                                    <li onClick={logoutUser} className="menu-item main-li shadow-lg">
                                        <FaSignOutAlt style={{ fontSize: 18, marginRight: 10, verticalAlign: 'middle' }} />
                                        <span style={{ fontSize: 12, verticalAlign: 'middle' }}>Logout</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </nav>
                <main className={`content ${sidebarOpen ? 'shifted' : 'full-width'}`}>
                    <Tooltip title={sidebarOpen ? 'Minimize sidebar' : 'Expand sidebar'}>
                        <div className={`bump-toggle ${sidebarOpen ? 'attached' : 'moved'}`} onClick={toggleSidebar}>
                            {sidebarOpen ? <FaCaretLeft style={{ fontSize: 18 }} /> : <FaCaretRight style={{ fontSize: 18 }} />}
                        </div>
                    </Tooltip>
                    <div className='container-fluid' style={{ backgroundColor: '#e5e5e5', height: '100vh' }}>
                        <TimedAlert
                            open={openalert}
                            onClose={() => setOpenAlert(false)}
                            severity={alertseverity}
                            message={alertmsg}
                            setSeverity={setAlertSeverity}
                            setMessage={setAlertMsg}
                        />
                        <Box sx={{ width: '100%' }}>
                            <Box sx={{ borderColor: 'divider', backgroundColor: '#ffff' }}>
                                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                                    <Tab style={{ textTransform: 'none', fontSize: 13 }} icon={<FaUser style={{ fontSize: 15, marginRight: 8, verticalAlign: 'middle' }} />} onClick={getusers} label="Login Accounts" {...a11yProps(0)} />
                                    <Tab style={{ textTransform: 'none', fontSize: 13 }} icon={<FaFolderOpen style={{ fontSize: 15, marginRight: 8, verticalAlign: 'middle' }} />} onClick={getDocLogs} label="Documents" {...a11yProps(1)} />
                                    <Tab style={{ textTransform: 'none', fontSize: 13 }} icon={<FaList style={{ fontSize: 15, marginRight: 8, verticalAlign: 'middle' }} />} onClick={getlogs} label="Account Logs" {...a11yProps(2)} />
                                    <Tab style={{ textTransform: 'none', fontSize: 13 }} icon={<FaCog style={{ fontSize: 15, marginRight: 8, verticalAlign: 'middle' }} />} label='Mailer SMTP Settings' {...a11yProps(3)} />
                                    <Tab style={{ textTransform: 'none', fontSize: 13 }} icon={<FaProjectDiagram style={{ fontSize: 15, marginRight: 8, verticalAlign: 'middle' }} />} label='Manage Workflows' {...a11yProps(4)} />
                                </Tabs>
                            </Box>
                            <CustomTabPanel value={value} index={0} style={{ height: '85vh', backgroundColor: '#fff' }}>
                                <h6 className='text-center  p-3  card-header text-muted' style={{ fontSize: 14, borderRadius: 0, borderTop: 'none', boxShadow: 'none' }}>Organization Users</h6>
                                <div id='companyUsers' className='bg-white' style={{ height: 'calc(85vh - 60px)', minHeight: 200, maxHeight: 'calc(85vh - 60px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <Users
                                        newUser={() => setOpenDialogNewUser(true)}
                                        setOpenDialogUpdateUser={setOpenDialogUpdateUser}
                                        companyid={user.companyid}
                                        users={users}
                                        setSelectedUserId={setSelectedUserId}
                                        loading={loadingUsers}
                                        style={{ flex: 1, minHeight: 0, height: '100%' }}
                                    />
                                </div>
                            </CustomTabPanel>
                            <CustomTabPanel value={value} index={1} style={{ height: '85vh', backgroundColor: '#fff' }}>
                                <h6 className='text-center  p-3  card-header text-muted' style={{ fontSize: 14, borderRadius: 0, borderTop: 'none', boxShadow: 'none' }}>Organization Documents</h6>
                                <div id='companyDocuments' className='bg-white' style={{ height: 'calc(85vh - 60px)', minHeight: 200, maxHeight: 'calc(85vh - 60px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <DocumentLogs
                                        companydocs={companydocs}
                                        filters={filters}
                                        setFilters={setFilters}
                                        loading={loadingDocs}
                                        getDocLogs={getDocLogs}
                                        style={{ flex: 1, minHeight: 0, height: '100%' }}
                                    />
                                </div>
                            </CustomTabPanel>
                            <CustomTabPanel value={value} index={2} style={{ height: '85vh', backgroundColor: '#fff' }}>
                                <h6 className='text-center  p-3  card-header text-muted' style={{ fontSize: 14, borderRadius: 0, borderTop: 'none', boxShadow: 'none' }}>User Logs</h6>
                                <div id='userLogs' className='bg-white' style={{ height: 'calc(85vh - 60px)', minHeight: 200, maxHeight: 'calc(85vh - 60px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <ActivityLogs
                                        logs={companylogs}
                                        filters={filters}
                                        setFilters={setFilters}
                                        loading={loadingActivity}
                                        getLogs={getlogs}
                                        style={{ flex: 1, minHeight: 0, height: '100%' }}
                                    />
                                </div>
                            </CustomTabPanel>
                            <CustomTabPanel value={value} index={3} style={{ height: '85vh', width: "100%", backgroundColor: '#fff' }}>
                                <h6 className='text-center  p-3  card-header text-muted' style={{ fontSize: 14, borderRadius: 0, borderTop: 'none', boxShadow: 'none' }}>SMTP Settings</h6>
                                <div id='SMT Settings' className='bg-white'>
                                    {/* <h6 className='text-center p-3 card-header text-muted' style={{ fontSize: 15, borderRadius: 0, borderTop: 'none', boxShadow: 'none' }}> SMTP Settings </h6> */}
                                    <div className='bg-light'>
                                        <form onSubmit={saveSettings} autoComplete="off">
                                            <div className='row'>

                                                <div className='col-lg-6 col-md-6 col-sm-12'>
                                                    <div className="form-group card p-4">
                                                        {loading ? <LoadingMini /> :
                                                            <>
                                                                <h6 className='p-3 card-header text-dark text-center' style={{ backgroundColor: '#ffff', fontSize: 13, borderRadius: 0, borderTop: 'none', boxShadow: 'none', borderColor: '#e5e5e5' }}>Current Configurations </h6>
                                                                <label htmlFor="smtpPort"><small style={{ fontSize: 13 }}>SMTP Port  <span className='text-muted'>: {smtpconfigs.port} </span></small></label>
                                                                <label htmlFor="smtpHost"><small style={{ fontSize: 13 }}>SMTP Host <span className='text-muted'>: {smtpconfigs.url} </span></small></label>
                                                                <label htmlFor="smtpUsername"><small style={{ fontSize: 13 }}>SMTP Username <span className='text-muted'>: {smtpconfigs.username} </span></small></label>
                                                                <label htmlFor="smtpDisplayName"><small style={{ fontSize: 13 }}>SMTP Mail From <span className='text-muted'>: {smtpconfigs.display_name} </span></small></label>
                                                                <div className='input-group mt-2'>
                                                                    <label htmlFor="smtpPassword">
                                                                        <small style={{ fontSize: 13 }}>SMTP Password
                                                                            <span className='text-muted'>:
                                                                                <TextField
                                                                                    disabled
                                                                                    fullWidth
                                                                                    style={{ fontSize: 13 }}
                                                                                    variant="standard"
                                                                                    type={showPassword ? 'text' : 'password'}
                                                                                    InputProps={{
                                                                                        endAdornment: (
                                                                                            <InputAdornment position="end">
                                                                                                <IconButton onClick={handleTogglePassword} edge="end" style={{ fontSize: 10 }}>
                                                                                                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                                                                                                </IconButton>
                                                                                            </InputAdornment>
                                                                                        ),
                                                                                    }}
                                                                                    value={smtpconfigs.password}
                                                                                    autoComplete="off"
                                                                                    onChange={() => { }}
                                                                                />
                                                                            </span>
                                                                        </small>
                                                                    </label>
                                                                </div>
                                                            </>
                                                        }
                                                    </div>
                                                </div>
                                                <div className='col-lg-6 col-md-6 col-sm-12'>
                                                    <h6 className='bg-light card-header text-dark text-center mb-2' style={{ backgroundColor: '#ffff', fontSize: 12, borderRadius: 0, borderTop: 'none', boxShadow: 'none', borderColor: '#e5e5e5' }}>Update Form </h6>
                                                    <div className="form-group">
                                                        <label htmlFor="smtpPort"><small style={{ fontSize: 12 }}>SMTP Port </small></label>
                                                        <div className="input-group mt-2">
                                                            <FormControl variant="standard" fullWidth>
                                                                <Input
                                                                    style={{ fontSize: 13 }}
                                                                    id="smtpPort"
                                                                    name="smtpPort"
                                                                    placeholder='Enter new SMTP port'
                                                                    type='number'
                                                                    autoComplete="off"
                                                                    value={formData.smtpPort}
                                                                    onChange={e => setFormData({ ...formData, smtpPort: e.target.value })}
                                                                />
                                                            </FormControl>
                                                        </div>
                                                        <label htmlFor="smtpHost"><small style={{ fontSize: 13 }}>SMTP Host </small></label>
                                                        <div className="input-group mt-2">
                                                            <FormControl variant="standard" fullWidth>
                                                                <Input
                                                                    style={{ fontSize: 13 }}
                                                                    id="smtpHost"
                                                                    name="smtpHost"
                                                                    placeholder='Enter new SMTP host'
                                                                    type='text'
                                                                    autoComplete="off"
                                                                    value={formData.smtpHost}
                                                                    onChange={e => setFormData({ ...formData, smtpHost: e.target.value })}
                                                                />
                                                            </FormControl>
                                                        </div>
                                                        <label htmlFor="smtpUsername"><small style={{ fontSize: 13 }}>SMTP Username </small></label>
                                                        <div className="input-group mt-2">
                                                            <FormControl variant="standard" fullWidth>
                                                                <Input
                                                                    style={{ fontSize: 13 }}
                                                                    id="smtpUsername"
                                                                    name="smtpUsername"
                                                                    placeholder='Enter new SMTP username'
                                                                    type='email'
                                                                    autoComplete="off"
                                                                    value={formData.smtpUsername}
                                                                    onChange={e => setFormData({ ...formData, smtpUsername: e.target.value })}
                                                                />
                                                            </FormControl>
                                                        </div>
                                                        <label htmlFor="smtpDisplayname"><small style={{ fontSize: 13 }}>SMTP Mail From </small></label>
                                                        <div className="input-group mt-2">
                                                            <FormControl variant="standard" fullWidth>
                                                                <Input
                                                                    style={{ fontSize: 13 }}
                                                                    id="smtpDisplayName"
                                                                    name="smtpDisplayName"
                                                                    placeholder='Enter new SMTP display name'
                                                                    type='text'
                                                                    autoComplete="off"
                                                                    value={formData.smtpDisplayName}
                                                                    onChange={e => setFormData({ ...formData, smtpDisplayName: e.target.value })}
                                                                />
                                                            </FormControl>
                                                        </div>
                                                        <label htmlFor="smtpPassword"><small style={{ fontSize: 13 }}>SMTP Password </small></label>
                                                        <div className="input-group mt-2">
                                                            <FormControl variant="standard" fullWidth>
                                                                <TextField
                                                                    fullWidth
                                                                    style={{ fontSize: 13 }}
                                                                    variant="standard"
                                                                    type={showPassword ? 'text' : 'password'}
                                                                    id="smtpPassword"
                                                                    name="smtpPassword"
                                                                    autoComplete="off"
                                                                    value={formData.smtpPassword}
                                                                    onChange={e => setFormData({ ...formData, smtpPassword: e.target.value })}
                                                                />
                                                            </FormControl>
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <div className="text-center mt-2 pt-2 mb-4">
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                className='m-2 p-2'
                                                                style={{ textTransform: 'none', fontWeight: 'lighter', fontSize: 13 }}
                                                                disabled={loading}
                                                                type='submit'
                                                            > <span className='mx-2'> {loading ? 'Updating...' : 'Update Settings'}</span> </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </CustomTabPanel>
                            {/* --- Organization Workflows Tab --- */}
                            <CustomTabPanel value={value} index={4} style={{ height: '85vh', backgroundColor: '#fff' }}>
                                <div className='container row '>
                                    <div className='col-lg-5 col-md-5 col-sm-12'>
                                        <div id='Organization Workflows' className='bg-white' style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>

                                            <Box sx={{ width: '100%', height: '75vh', p: 2 }}>
                                                <Box sx={{ borderColor: 'divider', backgroundColor: '#fff' }}>
                                                    <Tabs value={value2} onChange={handleChange2} aria-label="workflow tabs">
                                                        <Tab
                                                            style={{ textTransform: 'none', fontSize: 14, fontFamily: 'inherit' }}
                                                            onClick={() => { setSigners([]); setWorkflow(''); setChecked(false); }}
                                                            label="Saved workflows"
                                                            {...a11yProps2(0)}
                                                        />
                                                        <Tab
                                                            style={{ textTransform: 'none', fontSize: 14, fontFamily: 'inherit' }}
                                                            onClick={() => { setSigners([]); setWorkflow(''); setUpdateWorkflow(false); setWfTitleUpdated(false); setChecked(false); }}
                                                            label="Create new workflow"
                                                            {...a11yProps2(1)}
                                                        />
                                                    </Tabs>
                                                    <CustomTabPanel value={value2} index={0}>

                                                        {/* <FormControl variant="filled" fullWidth className="bg-white my-4" size="small">
                                                            <InputLabel
                                                                id="workflow-select-label"
                                                                style={{ fontSize: 15, color: '#222', fontFamily: 'inherit' }}
                                                            >
                                                                Select Organization Workflow
                                                            </InputLabel>
                                                            <Select
                                                                ref={selectRef}
                                                                labelId="workflow-select-label"
                                                                id="owf"
                                                                value={workflow}
                                                                onClick={getWorkflows}
                                                                onChange={e => AddOrganizationWorkflow(e, e.target.value)}
                                                                name="wf"
                                                                sx={{
                                                                    backgroundColor: 'white',
                                                                    fontFamily: 'inherit',
                                                                    '& .MuiFilledInput-input': { backgroundColor: 'white' },
                                                                    '&.MuiFilledInput-root': { backgroundColor: 'white' }
                                                                }}
                                                            >
                                                                <MenuItem value="" disabled style={{ fontSize: 14 }}>
                                                                    <span style={{ color: '#2757aa' }}>
                                                                        {organizationWorkflows ? `Total saved (${organizationWorkflows.length})` : 'No Results Found'}
                                                                    </span>
                                                                </MenuItem>
                                                                {organizationWorkflows.map((wf) => (
                                                                    <MenuItem key={wf.id} value={wf.id} style={{ fontSize: 14, fontFamily: 'inherit' }}>
                                                                        {wf.title}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl> */}
                                                        <div style={{ fontSize: 13, color: '#2757aa', marginTop: 8 }}>
                                                            {organizationWorkflows ? `Total saved (${organizationWorkflows.length})` : ''}
                                                        </div>

                                                        <List
                                                            sx={{
                                                                width: '100%',
                                                                maxHeight: 300,
                                                                overflowY: 'auto',
                                                            }}
                                                        >
                                                            {organizationWorkflows && organizationWorkflows.length > 0 ? (
                                                                organizationWorkflows.map((wf) => (
                                                                    <ListItemButton
                                                                        key={wf.id}
                                                                        selected={+workflow === wf.id}
                                                                        onClick={() => {
                                                                            setWorkflow(wf.id);
                                                                            setSelectedWorkflowTitle(wf.title);
                                                                            setSigners(wf.signers || []);
                                                                        }}
                                                                        sx={{
                                                                            fontSize: 14,
                                                                            fontFamily: 'inherit',
                                                                            color: '#222',
                                                                            borderBottom: '1px solid #f0f0f0',
                                                                            '&.Mui-selected': {
                                                                                backgroundColor: '#e3f0ff',
                                                                                color: '#2757aa',
                                                                            },
                                                                        }}
                                                                    >
                                                                        <span style={{ flex: 1 }}>{wf.title}</span>
                                                                        {+workflow === wf.id && (
                                                                            <FaCheckCircle className="ms-2" style={{ color: '#2757aa', fontSize: 18 }} />
                                                                        )}
                                                                    </ListItemButton>
                                                                ))
                                                            ) : (
                                                                <ListItem>
                                                                    <span style={{ color: '#2757aa', fontSize: 14 }}>
                                                                        No Results Found
                                                                    </span>
                                                                </ListItem>
                                                            )}
                                                        </List>





                                                    </CustomTabPanel>
                                                    <CustomTabPanel value={value2} index={1}>

                                                        <div className='my-4'>
                                                            <AddSignerForm
                                                                onSubmit={addMailList}
                                                                checked={checked}
                                                                setChecked={setChecked}
                                                                emailInputRef={emailInputRef}
                                                                phoneNumberRef={phoneNumberRef}
                                                                phoneCodeRef={phoneCodeRef}
                                                            />
                                                        </div>


                                                    </CustomTabPanel>

                                                </Box>

                                            </Box>
                                        </div>

                                    </div>
                                    <div className='col-lg-7 col-md-7 col-sm-12 shadow-lg'>
                                        <CustomTabPanel value={value2} index={0}>
                                            {workflow && (
                                                <>
                                                    <p className=" text-center p-1" style={{ color: '#2757aa', fontSize: 14, fontWeight: '560' }}>
                                                        Edit Workflow
                                                    </p>
                                                    {editingTitle ? (
                                                        <div className="d-flex align-items-center mb-2" style={{ color: '#2757aa', gap: 8 }}>
                                                            <input
                                                                className="form-control form-control-sm"
                                                                type="text"
                                                                value={editingTitleValue}
                                                                onChange={e => setEditingTitleValue(e.target.value)}
                                                                style={{ maxWidth: 300, marginRight: 8, fontFamily: 'inherit', fontSize: 15 }}
                                                                autoFocus
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        if (editingTitleValue.trim() && editingTitleValue !== selectedworkflowtitle) {
                                                                            setSelectedWorkflowTitle(editingTitleValue.trim());
                                                                            setWfTitleUpdated(true);
                                                                            setEditingTitle(false);
                                                                            updateOrganizationWorkflow();
                                                                        } else {
                                                                            setEditingTitle(false);
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="contained"
                                                                color="success"
                                                                style={{
                                                                    textTransform: 'none',
                                                                    fontWeight: 'lighter',
                                                                    padding: '4px 16px',
                                                                    fontSize: 14,
                                                                    borderRadius: 8,
                                                                    fontFamily: 'inherit'
                                                                }}
                                                                onClick={() => {
                                                                    if (editingTitleValue.trim() && editingTitleValue !== selectedworkflowtitle) {
                                                                        setSelectedWorkflowTitle(editingTitleValue.trim());
                                                                        setWfTitleUpdated(true);
                                                                        setEditingTitle(false);
                                                                        updateOrganizationWorkflow();
                                                                    } else {
                                                                        setEditingTitle(false);
                                                                    }
                                                                }}
                                                            >
                                                                Save
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex justify-content-between align-items-center mb-2" style={{ color: '#2757aa' }}>
                                                            <h6 style={{ color: '#2757aa', fontSize: 15, fontFamily: 'inherit' }} className="d-flex align-items-center mb-0">
                                                                <span className="me-2">{selectedworkflowtitle}</span>
                                                                <FaPencilAlt
                                                                    className="mx-1"
                                                                    style={{ cursor: 'pointer', color: '#555', fontSize: 16 }}
                                                                    title="Edit title"
                                                                    onClick={() => {
                                                                        setEditingTitleValue(selectedworkflowtitle);
                                                                        setEditingTitle(true);
                                                                    }}
                                                                />
                                                            </h6>
                                                            <Button
                                                                type="button"
                                                                variant="contained"
                                                                color="error"
                                                                style={{
                                                                    textTransform: 'none',
                                                                    fontWeight: 'lighter',
                                                                    padding: '4px 16px',
                                                                    fontSize: 14,
                                                                    borderRadius: 8,
                                                                    fontFamily: 'inherit'
                                                                }}
                                                                onClick={handleOpenDeleteDialog}
                                                            >
                                                                <FaTrashAlt className="me-2" style={{ cursor: 'pointer' }} /> Delete Selected Workflow
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {signers?.length > 0 && (
                                                <p className="mb-2 text-center" style={{ color: '#555', fontSize: 14, fontFamily: 'inherit' }}>
                                                    Workflow signers
                                                </p>
                                            )}
                                            {signers?.length > 0 && (
                                                <SignersList signers={signers} removeSigner={removeSigner} />
                                            )}
                                            {workflow && (
                                                <div className='my-2'>
                                                    <AddSignerForm
                                                        onSubmit={addMailList}
                                                        checked={checked}
                                                        setChecked={setChecked}
                                                        emailInputRef={emailInputRef}
                                                        phoneNumberRef={phoneNumberRef}
                                                        phoneCodeRef={phoneCodeRef}
                                                    />
                                                </div>
                                            )}
                                            <div className="mt-auto d-flex justify-content-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                                                {workflow && (
                                                    (
                                                        (organizationWorkflows.find(wf => wf.id === workflow)?.signers?.length !== signers.length) ||
                                                        (organizationWorkflows.find(wf => wf.id === workflow)?.signers?.some((s, i) => s.email !== signers[i]?.email))
                                                    ) && (
                                                        <Button
                                                            type="button"
                                                            variant="contained"
                                                            color="success"
                                                            style={{
                                                                textTransform: 'none',
                                                                fontWeight: 'lighter',
                                                                width: '30%',
                                                                padding: '10px',
                                                                minWidth: '160px',
                                                                position: 'relative',
                                                                fontSize: 15,
                                                                fontFamily: 'inherit'
                                                            }}
                                                            onClick={updateOrganizationWorkflow}
                                                            disabled={workflowLoading}
                                                        >
                                                            {workflowLoading ? (
                                                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <CircularProgress size={18} color="inherit" style={{ marginRight: 8 }} />
                                                                    Processing...
                                                                </span>
                                                            ) : (
                                                                <>Update Workflow</>
                                                            )}
                                                        </Button>
                                                    )
                                                )}
                                            </div>

                                        </CustomTabPanel>
                                        <CustomTabPanel value={value2} index={1}>

                                            {signers?.length > 0 && (

                                                <p className=" text-center p-1" style={{ color: '#2757aa', fontSize: 14, fontWeight: '560' }}>
                                                    New Workflow
                                                </p>
                                            )}
                                            <form
                                                onSubmit={createOrganizationWorkflow}
                                                className="d-flex flex-column"
                                                style={{ position: 'relative' }}
                                            >
                                                {signers?.length > 0 && !workflow && (
                                                    <div className="mb-3">
                                                        <div className="d-flex flex-wrap align-items-center gap-2" style={{ color: '#2757aa', fontFamily: 'inherit' }}>

                                                            <input
                                                                ref={wfTitleRef}
                                                                className="form-control form-control-sm"
                                                                type="text"
                                                                placeholder="Add a title for the new workflow.."
                                                                required
                                                                style={{ flex: '1 1 250px', minWidth: 200, maxWidth: 300, fontFamily: 'inherit', fontSize: 15 }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {signers?.length > 0 && (
                                                    <p className="mb-2 text-center" style={{ color: '#555', fontSize: 14, fontFamily: 'inherit' }}>
                                                        Signers
                                                    </p>
                                                )}
                                                {signers?.length > 0 && (
                                                    <SignersList signers={signers} removeSigner={removeSigner} />
                                                )}
                                                <div className="mt-auto d-flex justify-content-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                                                    {signers?.length > 0 && !workflow && (
                                                        <Button
                                                            type="submit"
                                                            variant="contained"
                                                            color="success"
                                                            style={{
                                                                textTransform: 'none',
                                                                fontWeight: 'lighter',
                                                                padding: '8px 16px',
                                                                minWidth: '160px',
                                                                position: 'relative',
                                                                fontSize: 15,
                                                                fontFamily: 'inherit'
                                                            }}
                                                            disabled={workflowLoading}
                                                        >
                                                            {workflowLoading ? (
                                                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <CircularProgress size={18} color="inherit" style={{ marginRight: 8 }} />
                                                                    Processing...
                                                                </span>
                                                            ) : (
                                                                <>Save Workflow</>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </form>


                                        </CustomTabPanel>
                                    </div>
                                </div>


                            </CustomTabPanel>
                        </Box>
                    </div>
                </main>
            </div>
        </>
    )
}

export default AdminDashboard