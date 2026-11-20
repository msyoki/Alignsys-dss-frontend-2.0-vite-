import React, { useRef, useContext, useState, useEffect, useCallback } from 'react'
import '../../styles/Dashboard.css'
import '../../styles/AdminDashboard.css'
import { FaUserPlus, FaPlusCircle, FaUserCircle, FaMobile, FaUserShield, FaTrashAlt, FaArrowRight, FaHome, FaUser, FaFolderOpen, FaList, FaProjectDiagram, FaCheckCircle, FaPen, FaImages, FaCog } from 'react-icons/fa';
import AuthContext from '../../context/Authcontext'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'

import NewUserDialog from '../../components/NewUserDialog'
import UserUpdateDialog from '../../components/dialogs/UserUpdateDialog'
import ActivityLogs from '../../components/ActivityLogs'
import OtpLogs from '../../components/admin/OtpLogs'
import ReportsOverview from '../../components/admin/ReportsOverview'
import useProfileEditor from '../../hooks/useProfileEditor'
import { TiArrowBack } from 'react-icons/ti'
import { FaShieldAlt, FaChartLine, FaGlobeAfrica } from 'react-icons/fa'
import { companyLogoUrl } from '../../utils/companyLogo'
import AppShell from '../../components/layout/AppShell'
import BrandLogo from '../../components/common/BrandLogo'
import Users from '../../components/Users'
import DocumentLogs from '../../components/DocumentLogs'
import CompanyEdits from '../../components/CompanyEdits'
import * as constants from "../../components/constants/constants"
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa';
import { List, ListItem, ListItemButton, Switch, Tooltip, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import LoadingMini from '../../components/loaders/LoadingMini';
import TimedAlert from '../../components/TimedAlert';
import { jsonPhoneCodesData } from '../../data/country-phone-codes';
import SmsProviderSettings from '../../components/admin/SmsProviderSettings';
import TimeZoneSettings from '../../components/admin/TimeZoneSettings';
import useOtpAvailability from '../../hooks/useOtpAvailability';
import { otpError } from '../../api/otp';
import { PILL } from '../../components/common/pillButton';
import { ConfirmDialog, PropertyRow, PropertyValue } from '../../components/common/dialogKit';

function CustomTabPanel({ children, value, index, fill = false, className = '', ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            className={`${className}${fill ? ' tabpanel-fill' : ''}`.trim() || undefined}
            {...other}
        >
            {value === index && (
                <Box className="tabpanel-body" sx={{ p: { xs: 1, sm: 1.5 }, backgroundColor: '#fff' }}>
                    <Typography component="div" className="tabpanel-content">{children}</Typography>
                </Box>
            )}
        </div>
    )
}

const PanelHeader = ({ title, subtitle }) => (
    <div className="admin-panel-header">
        <h2 className="admin-panel-title">{title}</h2>
        {subtitle && <p className="admin-panel-subtitle" title={subtitle}>{subtitle}</p>}
    </div>
)

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
    onSubmit, checked, setChecked, emailInputRef, phoneNumberRef, phoneCodeRef,
    otpAvailable = true, otpLoading = false, otpMessage = ''
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
                    style={{ flex: '1 1 220px', minWidth: 0, maxWidth: 360 }}
                />
                <label htmlFor="otpSwitch" className="text-dark mb-0" style={{ userSelect: 'none', whiteSpace: 'nowrap', fontSize: 13 }}>
                    Enable SMS OTP verification
                </label>
                <Tooltip title={!otpLoading && !otpAvailable ? otpMessage : ''} placement="top">
                    <span>
                        <Switch
                            id="otpSwitch"
                            checked={checked && otpAvailable}
                            disabled={otpLoading || !otpAvailable}
                            onChange={e => setChecked(e.target.checked)}
                            inputProps={{ 'aria-label': 'Enable SMS OTP verification' }}
                            className="ms-1"
                            size="small"
                        />
                    </span>
                </Tooltip>
            </div>
            {!otpLoading && !otpAvailable && (
                <div className="alert alert-warning py-1 px-2 mb-2" role="status" style={{ fontSize: 12 }}>
                    {otpMessage}
                </div>
            )}
            {checked && otpAvailable && (
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
                    sx={PILL}
                
                    startIcon={<FaPlusCircle />}>
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
                            <span style={{ display: 'inline-flex' }}><FaMobile className="text-primary me-2" /></span>
                        </Tooltip>
                    )}
                    {item.authenticate && (
                        <Tooltip title="Account verification enabled" placement="top">
                            <span style={{ display: 'inline-flex' }}><FaUserShield className="text-primary me-2" /></span>
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
    const otpAvailability = useOtpAvailability()
    const [avatar, setAvatar] = useState('')
    const [openalert, setOpenAlert] = useState(false)
    const [alertseverity, setAlertSeverity] = useState('')
    const [alertmsg, setAlertMsg] = useState('')
    // Same "Edit my profile" / "Reset password" as the home page's account menu.
    const profile = useProfileEditor({
        user, authTokens, avatar, setAvatar,
        notify: (msg, severity) => {
            setAlertMsg(msg); setAlertSeverity(severity); setOpenAlert(true)
            setTimeout(() => setOpenAlert(false), 3000)
        },
    })
    const [companylogs, setCompanyLogs] = useState([])
    const [companydocs, setCompanyDocs] = useState([])
    const [companylogo, setCompanyLogo] = useState('')
    const [smtpconfigs, setSMTPConfigs] = useState({})
    const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 992)
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
        if (checked && !otpAvailability.available) {
            setOpenAlert(true)
            setAlertMsg(otpAvailability.message)
            setAlertSeverity('error')
            setTimeout(() => setOpenAlert(false), 6000)
            return
        }
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
    }, [checked, value2, otpAvailability.available, otpAvailability.message])

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
            setCompanyLogo(companyLogoUrl(res.data))
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
        // The server scopes the log to this admin's organisation from the login token.
        let data = {}
        if (filters.startDate) data.start_date = filters.startDate
        if (filters.endDate) data.end_date = filters.endDate
        axios.post(`${constants.devApiBaseUrl}/api/logs/`, data, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` }
        }).then(res => {
            setCompanyLogs(res.data)
        }).catch(() => setCompanyLogs([]))
            .finally(() => setLoadingActivity(false))
    }, [authTokens, filters])

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
            const e = otpError(error, "Update failed, please try again later")
            setOpenAlert(true)
            setAlertMsg(e.code ? e.message : "Update failed, please try again later")
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

    // One list drives both the tab bar and the sidebar, grouped by purpose so
    // neither gets cluttered. `index` is the tab's panel (fixed); the order here
    // is only the display order. `load` fetches the tab's data (and selects it).
    const adminTabGroups = [
        {
            key: 'manage', label: 'Manage', tabs: [
                { index: 0, label: 'Users', Icon: FaUser, load: getusers },
                { index: 1, label: 'Documents', Icon: FaFolderOpen, load: getDocLogs },
                { index: 4, label: 'Workflows', Icon: FaProjectDiagram },
            ],
        },
        {
            key: 'insights', label: 'Reports & logs', tabs: [
                { index: 7, label: 'Reports', Icon: FaChartLine },
                { index: 2, label: 'Account Logs', Icon: FaList, load: getlogs },
                { index: 6, label: 'OTP Activity', Icon: FaShieldAlt },
            ],
        },
        {
            key: 'settings', label: 'Settings', tabs: [
                { index: 8, label: 'Time zone', Icon: FaGlobeAfrica },
                { index: 3, label: 'Email (SMTP)', Icon: FaCog },
                { index: 5, label: 'SMS / OTP Provider', Icon: FaMobile },
            ],
        },
    ].map((g) => ({
        ...g,
        tabs: g.tabs.map((t) => ({ ...t, icon: <t.Icon />, tabIcon: <t.Icon style={{ fontSize: 15 }} /> })),
    }))
    const adminTabs = adminTabGroups.flatMap((g) => g.tabs)

    const openAdminTab = (index) => {
        const tab = adminTabs.find((t) => t.index === index)
        if (!tab) return
        if (tab.load) tab.load()
        else setValue(index)
    }

    // --- Render ---
    return (
        <>
            <CompanyEdits getCompanyLogo={getCompanyLogo} setCompanyLogo={setCompanyLogo} companylogo={companylogo} opendialogcompanyedits={opendialogcompanyedits} setOpenDialogCompanyEdits={setOpenDialogCompanyEdits} />
            {profile.profileDialog}
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
            <ConfirmDialog
                open={openDeleteDialog}
                icon={<FaTrashAlt />}
                title="Delete workflow"
                tone="danger"
                message="Delete this workflow? This can't be undone."
                confirmLabel="Delete workflow"
                onConfirm={deleteOrganizationWorkflow}
                onCancel={handleCloseDeleteDialog}
            />

            {/* SMTP Confirmation Dialog */}
            <ConfirmDialog
                open={openConfirmDialog}
                icon={<FaExclamationTriangle />}
                title="Update mail (SMTP) settings"
                maxWidth="sm"
                message={
                    <>
                        This changes how the system sends email. Confirm the new settings:
                    </>
                }
                confirmLabel="Update settings"
                onConfirm={handleConfirmedSubmit}
                onCancel={handleCancelSubmit}
            >
                {pendingFormData && (
                    <>
                        {pendingFormData.smtpHost && <PropertyRow label="SMTP host"><PropertyValue mono>{pendingFormData.smtpHost}</PropertyValue></PropertyRow>}
                        {pendingFormData.smtpPort && <PropertyRow label="SMTP port"><PropertyValue mono>{pendingFormData.smtpPort}</PropertyValue></PropertyRow>}
                        {pendingFormData.smtpUsername && <PropertyRow label="Username"><PropertyValue>{pendingFormData.smtpUsername}</PropertyValue></PropertyRow>}
                        {pendingFormData.smtpDisplayName && <PropertyRow label="Display name"><PropertyValue>{pendingFormData.smtpDisplayName}</PropertyValue></PropertyRow>}
                        {pendingFormData.smtpPassword && <PropertyRow label="Password"><PropertyValue>••••••••</PropertyValue></PropertyRow>}
                    </>
                )}
            </ConfirmDialog>
            <div className="admin-dashboard">
                <AppShell
                    caption="Admin Dashboard"
                    orgName={user.company}
                    // Top: Home; then the dashboard's tabs (same list as the tab bar); then
                    // actions on this page. Bottom (just above "Signed in as"): the other dashboard.
                    sections={[
                        { key: 'home', label: 'Back home', icon: <TiArrowBack size={18} /> },
                        ...adminTabGroups.flatMap((g) => [
                            { key: `h-${g.key}`, type: 'heading', label: g.label },
                            ...g.tabs.map((t) => ({ key: `tab-${t.index}`, label: t.label, icon: t.icon })),
                            // Page actions sit with the group they belong to.
                            ...(g.key === 'manage' ? [{ key: 'new-user', label: 'Add new user', icon: <FaUserPlus /> }] : []),
                        ]),
                    ]}
                    // Account (profile) menu, top right: the same profile options as the home
                    // page, plus the organisation logo for admins only (the server also
                    // refuses logo changes from anyone else).
                    onOpenProfile={profile.openProfile}
                    accountMenuItems={[
                        profile.resetPasswordItem,
                        ...(user.is_admin === "True" ? [
                            { key: 'logo', label: 'Organization logo', icon: <FaImages size={14} />, onClick: () => setOpenDialogCompanyEdits(true) },
                            { key: 'timezone', label: 'Time zone', icon: <FaGlobeAfrica size={14} />, onClick: () => openAdminTab(8) },
                        ] : []),
                        // Super admins only: the platform-wide dashboard.
                        ...(user.is_superuser === 'True' ? [
                            { key: 'sadmin', label: 'Super Admin Dashboard', icon: <FaUserShield size={14} />, onClick: () => navigate('/super/admin/dashboard') },
                        ] : []),
                    ]}
                    activeKey={`tab-${value}`}
                    onSelect={(key) => {
                        if (key.startsWith('tab-')) openAdminTab(Number(key.slice(4)))
                        else if (key === 'home') navigate('/')
                        else if (key === 'new-user') setOpenDialogNewUser(true)
                        else if (key === 'logo') setOpenDialogCompanyEdits(true)
                        else if (key === 'timezone') openAdminTab(8)
                    }}
                    open={sidebarOpen}
                    onOpenChange={setSidebarOpen}
                    userName={[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username}
                    avatarSrc={avatar}
                    onLogout={logoutUser}
                    headerExtra={<BrandLogo src={companylogo} alt="Organization logo" className="admin-topbar-logo" />}
                    mainSx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
                    <div className='admin-main'>
                        <TimedAlert
                            open={openalert}
                            onClose={() => setOpenAlert(false)}
                            severity={alertseverity}
                            message={alertmsg}
                            setSeverity={setAlertSeverity}
                            setMessage={setAlertMsg}
                        />
                        <Box className='admin-tabs-shell'>
                            <Box className='admin-tabs-bar'>
                                <Tabs value={value} onChange={handleChange} aria-label="admin dashboard tabs" variant="standard" className="admin-tabs-wrap">
                                    {/* Same groups and order as the sidebar; a thin divider starts each group. */}
                                    {adminTabGroups.flatMap((g, gi) => g.tabs.map((t, ti) => (
                                        <Tab key={t.index} value={t.index} iconPosition='start' icon={t.tabIcon} onClick={t.load}
                                            label={t.label} className={gi > 0 && ti === 0 ? 'tab-group-start' : undefined}
                                            {...a11yProps(t.index)} />
                                    )))}
                                </Tabs>
                            </Box>
                            <CustomTabPanel value={value} index={0} className='admin-tabpanel' fill>
                                <PanelHeader title="Organization users" subtitle="People in your organisation who can sign in." />
                                <div id='companyUsers' className='admin-grid'>
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
                            <CustomTabPanel value={value} index={1} className='admin-tabpanel' fill>
                                <PanelHeader title="Organization documents" subtitle="Documents sent from your organisation and their signing status." />
                                <div id='companyDocuments' className='admin-grid'>
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
                            <CustomTabPanel value={value} index={2} className='admin-tabpanel' fill>
                                <PanelHeader title="Account logs" subtitle="Sign-in and activity history for your users." />
                                <div id='userLogs' className='admin-grid'>
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
                            <CustomTabPanel value={value} index={3} className='admin-tabpanel'>
                                <PanelHeader title="Mailer SMTP settings" subtitle="The mail server used to send signing emails from your organisation." />
                                <div id='SMT Settings'>
                                    <div>
                                        <form onSubmit={saveSettings} autoComplete="off">
                                            <div className='row g-3'>

                                                <div className='col-12 col-lg-6'>
                                                    <div className="admin-card h-100">
                                                        {loading ? <LoadingMini /> :
                                                            <>
                                                                <h3 className='admin-card-title'>Current configuration</h3>
                                                                <dl className='admin-kv'>
                                                                    <dt>SMTP port</dt><dd>{smtpconfigs.port || '—'}</dd>
                                                                    <dt>SMTP host</dt><dd>{smtpconfigs.url || '—'}</dd>
                                                                    <dt>SMTP username</dt><dd>{smtpconfigs.username || '—'}</dd>
                                                                    <dt>Mail from</dt><dd>{smtpconfigs.display_name || '—'}</dd>
                                                                    <dt>SMTP password</dt>
                                                                    <dd>
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
                                                                    </dd>
                                                                </dl>
                                                            </>
                                                        }
                                                    </div>
                                                </div>
                                                <div className='col-12 col-lg-6'>
                                                    <div className='admin-card h-100'>
                                                    <h3 className='admin-card-title'>Update configuration</h3>
                                                    <div className="form-group admin-form-grid">
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

                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </CustomTabPanel>
                            {/* --- Time zone Tab --- */}
                            <CustomTabPanel value={value} index={8} className='admin-tabpanel'>
                                <PanelHeader title="Time zone" subtitle="The time zone used for your organisation's dates, reports and signature stamps." />
                                <div className='admin-card'>
                                    {value === 8 && <TimeZoneSettings />}
                                </div>
                            </CustomTabPanel>
                            {/* --- SMS / OTP Provider Tab --- */}
                            <CustomTabPanel value={value} index={5} className='admin-tabpanel'>
                                <PanelHeader title="SMS / OTP provider" subtitle="The SMS provider used to send one-time codes to signers." />
                                <div className='admin-card'>
                                    {value === 5 && <SmsProviderSettings onSaved={otpAvailability.refresh} />}
                                </div>
                            </CustomTabPanel>
                            <CustomTabPanel value={value} index={6} className='admin-tabpanel' fill>
                                <PanelHeader title="OTP activity" subtitle="SMS one-time code events on your organisation's documents. Read-only; codes are never shown." />
                                <div className='admin-card admin-fill-card'>
                                    {value === 6 && <OtpLogs />}
                                </div>
                            </CustomTabPanel>
                            <CustomTabPanel value={value} index={7} className='admin-tabpanel'>
                                <PanelHeader title="Reports" subtitle="Signing activity, turnaround, SMS verification and sign-ins for your organisation." />
                                {value === 7 && <ReportsOverview />}
                            </CustomTabPanel>
                            {/* --- Organization Workflows Tab --- */}
                            <CustomTabPanel value={value} index={4} className='admin-tabpanel'>
                                <PanelHeader title="Organization workflows" subtitle="Reusable signer lists that anyone in your organisation can send documents to." />
                                <div className='row g-3'>
                                    <div className='col-12 col-lg-5'>
                                        <div id='Organization Workflows' className='admin-card h-100' style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>

                                            <Box sx={{ width: '100%' }}>
                                                <Box sx={{ borderColor: 'divider', backgroundColor: '#fff' }}>
                                                    <Tabs value={value2} onChange={handleChange2} aria-label="workflow tabs" variant="fullWidth">
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
                                                                otpAvailable={otpAvailability.available}
                                                                otpLoading={otpAvailability.loading}
                                                                otpMessage={otpAvailability.message}
                                                            />
                                                        </div>


                                                    </CustomTabPanel>

                                                </Box>

                                            </Box>
                                        </div>

                                    </div>
                                    <div className='col-12 col-lg-7'>
                                        <div className='admin-card h-100'>
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
                                                                sx={PILL}
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
                                                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2" style={{ color: '#2757aa' }}>
                                                            <h6 style={{ color: '#2757aa', fontSize: 15, fontFamily: 'inherit' }} className="d-flex align-items-center mb-0">
                                                                <span className="me-2">{selectedworkflowtitle}</span>
                                                                <FaPen
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
                                                            
                                                                startIcon={<FaTrashAlt />}>
                                                                Delete Selected Workflow
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
                                                        otpAvailable={otpAvailability.available}
                                                        otpLoading={otpAvailability.loading}
                                                        otpMessage={otpAvailability.message}
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
                                                                padding: '10px 24px',
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
                                </div>
                            </CustomTabPanel>
                        </Box>
                    </div>
                </AppShell>
            </div>
        </>
    )
}

export default AdminDashboard