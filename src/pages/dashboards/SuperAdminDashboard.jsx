import React, { useContext, useState, useEffect } from 'react';
import { FaHome, FaUserShield, FaBuilding, FaUsers, FaInbox } from 'react-icons/fa';
import { FaCircleUser, FaChartSimple } from 'react-icons/fa6';
import AuthContext from '../../context/Authcontext';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

import NewUserDialog from '../../components/NewUserDialog';
import UserUpdateDialog from '../../components/dialogs/UserUpdateDialog';
import CompanyUpdateDialog from '../../components/dialogs/CompanyUpdateDialog';
import ApproveCompanyDialog from '../../components/dialogs/ApproveCompanyDialog';
import { companyLogoUrl } from '../../utils/companyLogo'
import AppShell from '../../components/layout/AppShell'
import BrandLogo from '../../components/common/BrandLogo';
import '../../styles/AdminDashboard.css';
import * as constants from '../../components/constants/constants';
import IndividualAccounts from '../../components/IndividualAccounts';
import Users2 from '../../components/Users';
import Companies2 from '../../components/Companies2';
import NewCompanies2 from '../../components/NewCompanies2';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TimedAlert from '../../components/TimedAlert';
import OrganizationDocChart from '../../components/DocumentStats';

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
        <Box className="tabpanel-body" sx={{ p: { xs: 1, sm: 1.5 } }}>
          <Typography component="div" className="tabpanel-content">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const PanelHeader = ({ title, subtitle }) => (
  <div className="admin-panel-header">
    <h2 className="admin-panel-title">{title}</h2>
    {subtitle && <p className="admin-panel-subtitle">{subtitle}</p>}
  </div>
);

const isSmallScreen = () => typeof window !== 'undefined' && window.innerWidth < 992;

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function SuperAdminDashboard() {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [individualusers, setIndividualUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [newcompanies, setNewCompanies] = useState([]);
  const [companylogo, setCompanyLogo] = useState('');
  const [avatar, setAvatar] = useState('');
  const [openalert, setOpenAlert] = useState(false);
  const [alertseverity, setAlertSeverity] = useState('');
  const [alertmsg, setAlertMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => !isSmallScreen());

  // Dialog states
  const [opendialognewuser, setOpenDialogNewUser] = useState(false);
  const [opendialogupdatecompany, setOpenDialogUpdateCompany] = useState(false);
  const [opendialogupdateuser, setOpenDialogUpdateUser] = useState(false);
  const [opendialogapprovecompany, setOpenDialogApproveCompany] = useState(false);

  // Edit states
  const [currenteditcompany, setCurrentEditCompany] = useState(0);
  const [currenteditcompanyname, setCurrentEditCompanyName] = useState('');
  const [currenteditcompanyemail, setCurrentEditCompanyEmail] = useState('');
  const [currenteditcompanyactive, setCurrentEditCompanyActive] = useState('');
  const [currenteditcompanyapproved, setCurrentEditCompanyApproved] = useState('');
  const [currenteditcompanyapprovedregistereddate, setCurrentEditCompanyRegisteredDate] = useState('');
  const [currentedituser, setCurrentEditUser] = useState(0);
  const [currentedituseremail, setCurrentEditUserEmail] = useState('');
  const [currentedituseractive, setCurrentEditUserActive] = useState('');
  const [currentedituserfirst, setCurrentEditUserFirst] = useState('');
  const [currentedituserlast, setCurrentEditUserLast] = useState('');
  const [currentedituserphone, setCurrentEditUserPhone] = useState('');
  const [currentedituseradmin, setCurrentEditUserAdmin] = useState('');
  const [company4approval, setCompany4Approval] = useState('');
  const [company4approvalemail, setCompany4ApprovalEmail] = useState('');

  const location = useLocation();
  const { authTokens, logoutUser, user } = useContext(AuthContext);
  const navigate = useNavigate();


  // API Calls
  const getUser = () => {
    axios.get(`${constants.devApiBaseUrl}/api/user/${currentedituser}`, {
      headers: { 'Authorization': `Bearer ${authTokens.access}` }
    })
      .then((response) => {
        setCurrentEditUserEmail(response.data['email']);
        setCurrentEditUserLast(response.data['last_name']);
        setCurrentEditUserFirst(response.data['first_name']);
        setCurrentEditUserPhone(response.data['phone']);
        setCurrentEditUserActive(`${response.data['is_active']}`);
        setCurrentEditUserAdmin(`${response.data['is_admin']}`);
        setOpenDialogUpdateUser(true);
      })
      .catch((error) => {
        setOpenAlert(true);
        setAlertMsg(error.response?.data?.message || "Error loading user");
        setAlertSeverity('error');
        setTimeout(() => {
          setOpenAlert(false);
          getUsers();
          setOpenDialogUpdateUser(false);
        }, 4000);
      });
  };

  const getAvatar = () => {
    axios.get(`${constants.devApiBaseUrl}/api/avatar/`, {
      headers: { 'Authorization': `Bearer ${authTokens.access}` }
    })
      .then((response) => {
        let url = `${constants.devApiBaseUrl}${response.data['avatar_url']}`;
        setAvatar(url);
      })
      .catch(() => { });
  };

  const getUsers = () => {
    axios.get(`${constants.devApiBaseUrl}/api/admin/users/`, {
      headers: { 'Authorization': `Bearer ${authTokens.access}` }
    })
      .then((response) => setUsers(response.data))
      .catch(() => { });
  };

  const getIndividualUsers = () => {
    axios.get(`${constants.devApiBaseUrl}/api/individual/users/`, {
      headers: { 'Authorization': `Bearer ${authTokens.access}` }
    })
      .then((response) => setIndividualUsers(response.data))
      .catch(() => { });
  };

  const getCompanies = () => {
    axios.get(`${constants.devApiBaseUrl}/api/approved/companies/`, {
      headers: { 'Authorization': `Bearer ${authTokens.access}` }
    })
      .then((response) => setCompanies(response.data))
      .catch(() => { });
  };

  const getNewCompanies = () => {
    axios.get(`${constants.devApiBaseUrl}/api/new/companies/`, {
      headers: { 'Authorization': `Bearer ${authTokens.access}` }
    })
      .then((response) => setNewCompanies(response.data))
      .catch(() => { });
  };

  const getCompanyLogo = () => {
    axios.get(`${constants.devApiBaseUrl}/api/logo/`, {
      headers: { 'Authorization': `Bearer ${authTokens.access}` }
    })
      .then((response) => {
        setCompanyLogo(companyLogoUrl(response.data));
      })
      .catch(() => { });
  };

  // Navigation
  const homePage = () => navigate('/');
  const adminPage = () => navigate('/admin/dashboard');

  // Initial load
  useEffect(() => {
    if (!(user.is_admin === "True" || user.groups.includes("TechedgeAdmin"))) {
      navigate('/');
    }
    try {
      setOpenAlert(location.state.openalert);
      setAlertMsg(location.state.alertmsg);
      setAlertSeverity(location.state.alertseverity);
      setTimeout(() => setOpenAlert(false), 3000);
    } catch { }
    getCompanyLogo();
    getAvatar();
    getCompanies();
  }, []);

  return (
    <>
      <ApproveCompanyDialog
        getUsers={getUsers}
        getCompanies={getCompanies}
        getNewCompanies={getNewCompanies}
        setOpenDialogApproveCompany={setOpenDialogApproveCompany}
        opendialogapprovecompany={opendialogapprovecompany}
        setOpenAlert={setOpenAlert}
        setAlertMsg={setAlertMsg}
        setAlertSeverity={setAlertSeverity}
        company4approval={company4approval}
        company4approvalemail={company4approvalemail}
      />

      <NewUserDialog
        user={user}
        getUsers={getUsers}
        setOpenDialogNewUser={setOpenDialogNewUser}
        opendialognewuser={opendialognewuser}
        openalert={openalert}
        setOpenAlert={setOpenAlert}
        alertmsg={alertmsg}
        setAlertMsg={setAlertMsg}
        alertseverity={alertseverity}
        setAlertSeverity={setAlertSeverity}
      />

      <UserUpdateDialog
        useradmin={currentedituseradmin}
        userfirst={currentedituserfirst}
        userlast={currentedituserlast}
        userphone={currentedituserphone}
        userid={currentedituser}
        useractive={currentedituseractive}
        user={user}
        getUsers={getUsers}
        useremail={currentedituseremail}
        setOpenDialogUpdateUser={setOpenDialogUpdateUser}
        opendialogupdateuser={opendialogupdateuser}
        openalert={openalert}
        setOpenAlert={setOpenAlert}
        alertmsg={alertmsg}
        setAlertMsg={setAlertMsg}
        alertseverity={alertseverity}
        setAlertSeverity={setAlertSeverity}
      />

      <CompanyUpdateDialog
        companyregistered={currenteditcompanyapprovedregistereddate}
        companyapproved={currenteditcompanyapproved}
        companyname={currenteditcompanyname}
        companyid={currenteditcompany}
        companyactive={currenteditcompanyactive}
        getCompanies={getCompanies}
        getNewCompanies={getNewCompanies}
        companyemail={currenteditcompanyemail}
        setOpenDialogUpdateCompany={setOpenDialogUpdateCompany}
        opendialogupdatecompany={opendialogupdatecompany}
        openalert={openalert}
        setOpenAlert={setOpenAlert}
        alertmsg={alertmsg}
        setAlertMsg={setAlertMsg}
        alertseverity={alertseverity}
        setAlertSeverity={setAlertSeverity}
      />

      <div className="admin-dashboard">
          <AppShell
              caption="Super Admin Dashboard"
              orgName={user.company}
              // Top: Home. Bottom (just above "Signed in as"): the other dashboard (same as the Admin page).
              sections={[
                  { key: 'home', label: 'Home', icon: <FaHome /> },
              ]}
              footerSections={[
                  { key: 'admin', label: 'Admin Dashboard', icon: <FaUserShield /> },
              ]}
              onSelect={(key) => {
                  if (key === 'home') homePage()
                  else if (key === 'admin') adminPage()
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
                <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="super admin tabs"
                  variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
                  <Tab iconPosition='start' icon={<FaBuilding style={{ fontSize: 15 }} />}
                    onClick={getCompanies} label="Company Accounts" {...a11yProps(0)} />
                  <Tab iconPosition='start' icon={<FaUsers style={{ fontSize: 15 }} />}
                    onClick={getUsers} label="Admin Accounts" {...a11yProps(1)} />
                  <Tab iconPosition='start' icon={<FaCircleUser style={{ fontSize: 15 }} />}
                    onClick={getIndividualUsers} label="Individual Accounts" {...a11yProps(2)} />
                  <Tab iconPosition='start' icon={<FaInbox style={{ fontSize: 15 }} />}
                    onClick={getNewCompanies} label="Pending Approval" {...a11yProps(3)} />
                  <Tab iconPosition='start' icon={<FaChartSimple style={{ fontSize: 15 }} />}
                    label="Document Stats" {...a11yProps(4)} />
                </Tabs>
              </Box>
              <CustomTabPanel value={tab} index={0} className='admin-tabpanel'>
                <PanelHeader title="Company accounts" subtitle="Approved organisations using Alignsys DSS." />
                <div id='Company Accounts'>
                  <Companies2
                    getCompanies={getCompanies}
                    getNewCompanies={getNewCompanies}
                    setOpenAlert={setOpenAlert}
                    setAlertMsg={setAlertMsg}
                    setAlertSeverity={setAlertSeverity}
                    setCurrentEditCompany={setCurrentEditCompany}
                    setCompanies={setCompanies}
                    setOpenDialogUpdateCompany={setOpenDialogUpdateCompany}
                    setCurrentEditCompanyName={setCurrentEditCompanyName}
                    setCurrentEditCompanyEmail={setCurrentEditCompanyEmail}
                    setCurrentEditCompanyActive={setCurrentEditCompanyActive}
                    setCurrentEditCompanyApproved={setCurrentEditCompanyApproved}
                    setCurrentEditCompanyRegisteredDate={setCurrentEditCompanyRegisteredDate}
                    companies={companies}
                  />
                </div>
              </CustomTabPanel>
              <CustomTabPanel value={tab} index={1} className='admin-tabpanel' fill>
                <PanelHeader title="Admin accounts" subtitle="Organisation administrators across all companies." />
                <div id='Admin Users' className='admin-grid'>
                  <Users2
                    getUser={getUser}
                    setCurrentEditUserAdmin={setCurrentEditUserAdmin}
                    setCurrentEditUserPhone={setCurrentEditUserPhone}
                    setCurrentEditUserLast={setCurrentEditUserLast}
                    setCurrentEditUserFirst={setCurrentEditUserFirst}
                    setCurrentEditUser={setCurrentEditUser}
                    setCurrentEditUserEmail={setCurrentEditUserEmail}
                    setCurrentEditUserActive={setCurrentEditUserActive}
                    setOpenDialogUpdateUser={setOpenDialogUpdateUser}
                    companyid={user.companyid}
                    getUsers={getUsers}
                    setUsers={setUsers}
                    users={users}
                  />
                </div>
              </CustomTabPanel>
              <CustomTabPanel value={tab} index={2} className='admin-tabpanel'>
                <PanelHeader title="Individual accounts" subtitle="People using Alignsys DSS without an organisation." />
                <div id='Individual Accounts'>
                  <IndividualAccounts
                    getIndividualUsers={getIndividualUsers}
                    individualusers={individualusers}
                  />
                </div>
              </CustomTabPanel>
              <CustomTabPanel value={tab} index={3} className='admin-tabpanel'>
                <PanelHeader title="Pending approval" subtitle="Organisations that registered and are waiting to be approved." />
                <div id='Accounts Pending Approval'>
                  <NewCompanies2
                    newcompanies={newcompanies}
                    company4approval={company4approval}
                    company4approvalemail={company4approvalemail}
                    setOpenDialogApproveCompany={setOpenDialogApproveCompany}
                    setCompany4Approval={setCompany4Approval}
                    setCompany4ApprovalEmail={setCompany4ApprovalEmail}
                  />
                </div>
              </CustomTabPanel>
              <CustomTabPanel value={tab} index={4} className='admin-tabpanel'>
                <PanelHeader title="Document stats" subtitle="Document distribution across organisations." />
                <div id='Chart' className='admin-card' style={{ minHeight: 450 }}>
                  <OrganizationDocChart />
                </div>
              </CustomTabPanel>
            </Box>
          </div>
          </AppShell>
      </div>
    </>
  );
}

export default SuperAdminDashboard;