import React, { useContext, useState, useEffect } from 'react';
import { FaHome, FaUserShield, FaSignOutAlt, FaCaretLeft, FaCaretRight, FaBuilding, FaUsers, FaInbox } from 'react-icons/fa';
import { FaCircleUser, FaChartSimple } from 'react-icons/fa6';
import AuthContext from '../../context/Authcontext';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

import NewUserDialog from '../../components/NewUserDialog';
import UserUpdateDialog from '../../components/dialogs/UserUpdateDialog';
import CompanyUpdateDialog from '../../components/dialogs/CompanyUpdateDialog';
import ApproveCompanyDialog from '../../components/dialogs/ApproveCompanyDialog';
import logo from '../../images/ZFWHITE.webp';
import * as constants from '../../components/constants/constants';
import IndividualAccounts from '../../components/IndividualAccounts';
import Users2 from '../../components/Users';
import Companies2 from '../../components/Companies2';
import NewCompanies2 from '../../components/NewCompanies2';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Tooltip } from '@mui/material';
import TimedAlert from '../../components/TimedAlert';
import OrganizationDocChart from '../../components/DocumentStats';

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
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Sidebar toggle
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

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
        let url = `${constants.devApiBaseUrl}${response.data['logo_url']}`;
        setCompanyLogo(url);
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

      <div className="dashboard">
        <nav className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          {sidebarOpen && (
            <div className="sidebar-content" style={{ marginTop: '0%' }}>
              {/* Logo Section */}
              <div className="d-flex flex-column justify-content-center align-items-center bg-white shadow-lg"
                style={{ height: "60px", minHeight: "61px", maxHeight: "61px", overflow: "hidden" }}>
                <img
                  src={companylogo || logo}
                  alt="Organization logo"
                  className="logo"
                  style={{ width: "auto", maxWidth: "80%", maxHeight: "48px", objectFit: "contain" }}
                />
              </div>
              <div className='text-center mt-0 mb-0 p-1 shadow-lg'>
                <span className='mr-2' style={{ fontSize: '12px' }}>{user.first_name} {user.last_name}</span>
              </div>
              <div className='text-center mt-0 mb-0 p-1 shadow-lg' style={{ textTransform: 'uppercase' }}>
                <span className='mr-2' style={{ fontSize: '12px' }}>{user.company}</span>
              </div>
              <ul className="menu-items"></ul>
              {/* Bottom Buttons */}
              <div>
                <ul className="bottom-buttons">
                  <li onClick={homePage} className="menu-item main-li shadow-lg">
                    <FaHome style={{ fontSize: "18px" }} />
                    <span style={{ fontSize: "12px" }}>Home</span>
                  </li>
                  <li onClick={adminPage} className="menu-item main-li shadow-lg">
                    <FaUserShield style={{ fontSize: "18px" }} />
                    <span style={{ fontSize: "12px" }}>Admin Dashboard</span>
                  </li>
                  <li onClick={logoutUser} className="menu-item main-li shadow-lg">
                    <FaSignOutAlt style={{ fontSize: "18px" }} />
                    <span style={{ fontSize: "12px" }}>Logout</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </nav>

        <main className={`content ${sidebarOpen ? 'shifted' : 'full-width'}`}>
          <Tooltip title={sidebarOpen ? 'Minimize sidebar' : 'Expand sidebar'}>
            <div className={`bump-toggle ${sidebarOpen ? 'attached' : 'moved'}`} onClick={toggleSidebar}>
              {sidebarOpen ? <FaCaretLeft style={{ fontSize: '18px' }} /> : <FaCaretRight style={{ fontSize: '18px' }} />}
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
              <Box sx={{ borderColor: 'divider' }} className='bg-white'>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="basic tabs example">
                  <Tab style={{ textTransform: 'none', fontSize: '13px' }} className='shadow-lg'
                    icon={<FaBuilding style={{ fontSize: '15px' }} />}
                    onClick={getCompanies}
                    label=" Company Accounts " {...a11yProps(0)} />
                  <Tab style={{ textTransform: 'none', fontSize: '13px' }}
                    icon={<FaUsers style={{ fontSize: '15px' }} />}
                    onClick={getUsers}
                    label=" Admin Accounts" {...a11yProps(1)} />
                  <Tab style={{ textTransform: 'none', fontSize: '13px' }}
                    icon={<FaCircleUser style={{ fontSize: '15px' }} />}
                    onClick={getIndividualUsers}
                    label=" Individual Accounts" {...a11yProps(2)} />
                  <Tab style={{ textTransform: 'none', fontSize: '13px' }}
                    icon={<FaInbox style={{ fontSize: '15px' }} />}
                    onClick={getNewCompanies}
                    label=" Pending Approval" {...a11yProps(3)} />
                    <Tab style={{ textTransform: 'none', fontSize: '13px' }}
                    icon={<FaChartSimple style={{ fontSize: '15px' }} />}
             
                    label="  Document Stats" {...a11yProps(4)} />
                </Tabs>
              </Box>
              <CustomTabPanel value={tab} index={0}>
                <div id='Company Accounts'className='bg-white'>

                  <h6 className='text-center p-3 card-header text-muted' style={{ fontSize: 15, borderRadius: 0, borderTop: 'none', boxShadow: 'none' }}> Company Accounts</h6>
                  <Companies2
                    getCompanies={getCompanies}
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
              <CustomTabPanel value={tab} index={1}>
                <div id='Admin Users' className='bg-white'>

                   <h6 className='text-center p-3 card-header text-muted' style={{ fontSize: 15, borderRadius: 0, borderTop: 'none', boxShadow: 'none' }}> Admin Accounts</h6>
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
              <CustomTabPanel value={tab} index={2}>
                <div id='Individual Accounts' className='bg-white'>
 
                    <h6 className='text-center p-3 card-header text-muted' style={{ fontSize: 15, borderRadius: 0, borderTop: 'none', boxShadow: 'none' }}> Individual Accounts</h6>
                  <IndividualAccounts
                    getIndividualUsers={getIndividualUsers}
                    individualusers={individualusers}
                  />
                </div>
              </CustomTabPanel>
              <CustomTabPanel value={tab} index={3}>
                <div id='Accounts Pending Approval' className='bg-white'>

                   <h6 className='text-center p-3 card-header text-muted' style={{ fontSize: 15, borderRadius: 0, borderTop: 'none', boxShadow: 'none' }}> Accounts Pending Approval </h6>
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

              <CustomTabPanel value={tab} index={4}>
                <div id='Chart' className='bg-white container-fluid' style={{height: '450px'}}>
                  <h6 className='text-center  p-3  card-header text-muted' style={{ fontSize: 14, borderRadius: 0, borderTop: 'none', boxShadow: 'none' }}> Document Distribution Across Organizations</h6>
                  <OrganizationDocChart/>
                </div>
              </CustomTabPanel>
            </Box>
          </div>
        </main>
      </div>
    </>
  );
}

export default SuperAdminDashboard;