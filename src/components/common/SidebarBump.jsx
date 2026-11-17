import { Tooltip } from '@mui/material';
import { FaCaretLeft, FaCaretRight } from 'react-icons/fa';

/**
 * Tab on the sidebar's edge that collapses and expands it.
 * Styled by `.bump-toggle` in styles/Dashboard.css; it slides with the
 * sidebar (`attached` = at the sidebar's edge, `moved` = at the screen edge).
 */
const SidebarBump = ({ open, onToggle }) => {
  const label = open ? 'Minimize sidebar' : 'Expand sidebar';
  return (
    <Tooltip title={label} placement="right">
      <button
        type="button"
        className={`bump-toggle ${open ? 'attached' : 'moved'}`}
        onClick={onToggle}
        aria-label={label}
        aria-expanded={!!open}
      >
        {open ? <FaCaretLeft size={14} aria-hidden /> : <FaCaretRight size={14} aria-hidden />}
      </button>
    </Tooltip>
  );
};

export default SidebarBump;
