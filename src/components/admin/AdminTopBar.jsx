import React from 'react';
import { Tooltip } from '@mui/material';
import { FaBars } from 'react-icons/fa';
import BrandLogo from '../common/BrandLogo';

// Header of the admin / super admin content area, like the home page's top
// bar: sidebar toggle and the page name on the left, the organisation's
// logo (Alignsys logo if none uploaded) on the far right.
const AdminTopBar = ({ companylogo, title, subtitle, sidebarOpen, onToggleSidebar }) => (
  <header className="admin-topbar">
    {onToggleSidebar && (
      <Tooltip title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
        <button
          type="button"
          className="admin-topbar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          aria-expanded={!!sidebarOpen}
        >
          <FaBars />
        </button>
      </Tooltip>
    )}
    <div className="admin-topbar-text">
      <span className="admin-topbar-title">{title}</span>
      {subtitle && <span className="admin-topbar-subtitle">{subtitle}</span>}
    </div>
    <BrandLogo
      src={companylogo}
      alt="Organization logo"
      className="admin-topbar-logo shadow-sm"
    />
  </header>
);

export default AdminTopBar;
