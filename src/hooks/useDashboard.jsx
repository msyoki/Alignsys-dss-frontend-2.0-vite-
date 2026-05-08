import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { getWorkflows, getCompanyLogo, getAvatar, fetchList } from '../api/dashboard.js';
import { getDateRange, stringAvatar } from '../utils/dashboardUtils.jsx';
import AuthContext from '../context/Authcontext.jsx';

export function useDashboard() {
  // State
  const [value, setValue] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('inbox');
  const [opendialogaddsigners, setOpenDialogAddSigners] = useState(false);
  const [signeruid, setSignerUid] = useState('');
  const [trashed, setTrashed] = useState([]);
  const [myuploads, setMyUploads] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [complete, setComplete] = useState([]);
  const [voided, setVoided] = useState([]);
  const [count, setCount] = useState(null);
  const [avatar, setAvatar] = useState('');
  const [companylogo, setCompanyLogo] = useState('');
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingOutbox, setLoadingOutbox] = useState(false);
  const [filters, setFilters] = useState({ start_date: '', end_date: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const col1Ref = useRef(null);
  const col2Ref = useRef(null);
  const { authTokens } = useContext(AuthContext);

  // Responsive Layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      let newCol1Width = (e.clientX / containerWidth) * 100;
      newCol1Width = Math.max(10, Math.min(90, newCol1Width));
      col1Ref.current.style.width = `${newCol1Width}%`;
      col2Ref.current.style.width = `${100 - newCol1Width}%`;
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMobile]);

  // API Calls
  const loadWorkflows = useCallback(async () => {
    if (!authTokens) return;
    const { workflows, organizationWorkflows } = await getWorkflows(authTokens.access);
    setWorkflows(workflows);
    setOrganizationWorkflows(organizationWorkflows);
  }, [authTokens]);

  const loadCompanyLogo = useCallback(async () => {
    if (!authTokens) return;
    const logoUrl = await getCompanyLogo(authTokens.access);
    setCompanyLogo(logoUrl);
  }, [authTokens]);

  const loadAvatar = useCallback(async () => {
    if (!authTokens) return;
    const avatarUrl = await getAvatar(authTokens.access);
    setAvatar(avatarUrl);
  }, [authTokens]);

  const getInbox = async (startDate, endDate) => {
    setActiveLink('inbox');
    setValue(0);
    const { start_date, end_date } = getDateRange();
    setLoadingInbox(true);
    const data = await fetchList(
      `/api/inbox/?start_date=${startDate || start_date}&end_date=${endDate || end_date}`,
      authTokens.access
    );
    setInbox(data);
    setCount(data.length);
    setLoadingInbox(false);
  };

  // ...other fetchers (getOutbox, getTrashed, etc.)

  return {
    value, setValue,
    sidebarOpen, setSidebarOpen,
    activeLink, setActiveLink,
    opendialogaddsigners, setOpenDialogAddSigners,
    signeruid, setSignerUid,
    trashed, setTrashed,
    myuploads, setMyUploads,
    inbox, setInbox,
    outbox, setOutbox,
    complete, setComplete,
    voided, setVoided,
    count, setCount,
    avatar, setAvatar,
    companylogo, setCompanyLogo,
    loadingInbox, setLoadingInbox,
    loadingOutbox, setLoadingOutbox,
    filters, setFilters,
    isMobile, setIsMobile,
    isDragging, setIsDragging,
    containerRef, col1Ref, col2Ref,
    loadWorkflows, loadCompanyLogo, loadAvatar, getInbox,
    stringAvatar
  };
}
