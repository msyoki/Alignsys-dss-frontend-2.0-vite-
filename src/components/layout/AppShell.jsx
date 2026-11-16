import React, { useState } from 'react';
import {
  Avatar, Box, Divider, Drawer, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { FaBars, FaChevronDown, FaPen, FaCaretLeft, FaCaretRight, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import alignsysWhiteLogo from '../../images/ZFWHITE.webp';
import {
  BRAND, COMPACT_QUERY, HEADER_HEIGHT, NEUTRAL_COLORS, SIDEBAR_COLORS, SIDEBAR_WIDTH,
} from './shellTheme';

/** Look of a sidebar row. */
const sidebarRowSx = (active = false) => ({
  all: 'unset',
  boxSizing: 'border-box',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  px: 2,
  py: 1.25,
  cursor: 'pointer',
  fontSize: 13,
  whiteSpace: 'nowrap',
  bgcolor: active ? SIDEBAR_COLORS.activeBg : 'transparent',
  color: active ? SIDEBAR_COLORS.activeFg : 'inherit',
  fontWeight: active ? 600 : 400,
  transition: 'background-color 0.3s, color 0.3s',
  '&:hover': { bgcolor: active ? SIDEBAR_COLORS.activeBg : SIDEBAR_COLORS.hover },
  '&:focus-visible': { outline: `2px solid ${SIDEBAR_COLORS.fg}`, outlineOffset: -2 },
});

const initials = (name = '') =>
  name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

/** Photo when there is one, otherwise the user's initials. */
const UserAvatar = ({ name, src, size = 32, bgcolor = BRAND.primary }) => (
  <Avatar
    aria-hidden
    src={src || undefined}
    sx={{
      width: size,
      height: size,
      minWidth: size,
      // Never let a flex row squash it into an oval.
      flexShrink: 0,
      aspectRatio: '1 / 1',
      borderRadius: '50%',
      fontSize: Math.round(size * 0.42),
      bgcolor,
      color: '#fff',
      fontWeight: 400,
      '& img': { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' },
    }}
  >
    {initials(name)}
  </Avatar>
);

/** One sidebar link: icon, label, and an optional second line (e.g. "Waiting for me"). */
const SidebarRow = ({ item, active, onClick }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    title={item.hint ? `${item.label} (${item.hint})` : item.label}
    sx={sidebarRowSx(active)}
  >
    <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0, fontSize: 16 }}>{item.icon}</Box>
    <Box component="span" sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</Box>
      {item.hint && (
        <Box component="span" sx={{ fontSize: 10.5, opacity: 0.7, fontWeight: 400, lineHeight: 1.3 }}>{item.hint}</Box>
      )}
    </Box>
    {item.count != null && (
      <Box
        component="span"
        sx={{
          flexShrink: 0,
          minWidth: 22,
          px: 0.75,
          py: '1px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'center',
          bgcolor: active ? 'rgba(39,87,170,0.12)' : 'rgba(255,255,255,0.18)',
        }}
      >
        {item.count}
      </Box>
    )}
  </Box>
);

/**
 * Page frame for signed-in users, matching the Alignsys EDMS layout: a
 * collapsible brand-blue sidebar (logo, sections, the signed-in user and
 * Sign out) and a header with the page name, an optional slot (e.g. the
 * organisation logo) and an account menu.
 *
 * The page owns the state and the actions: `open`/`onOpenChange` for the
 * sidebar, `onSelect` for the sections, `onOpenProfile`/`onLogout` for the
 * account. Phones and tablets get an overlay drawer that closes after a pick.
 *
 * sections / footerSections: [{ key, label, icon, hint?, count? }]
 * accountMenuItems: [{ key, label, icon, onClick }] extra entries in the account menu
 */
const AppShell = ({
  caption,
  orgName,
  navLabel = 'Main',
  sections = [],
  footerSections = [],
  activeKey,
  onSelect,
  open,
  onOpenChange,
  userName = '',
  avatarSrc,
  onOpenProfile,
  onLogout,
  accountMenuItems = [],
  headerExtra,
  mainSx,
  children,
}) => {
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const toggleSidebar = () => onOpenChange(!open);

  const closeOnCompact = () => { if (isCompact) onOpenChange(false); };

  const select = (key) => {
    closeOnCompact();
    onSelect?.(key);
  };

  const openProfile = () => {
    setUserMenuAnchor(null);
    closeOnCompact();
    onOpenProfile?.();
  };

  const logout = () => {
    setUserMenuAnchor(null);
    onLogout?.();
  };

  const sidebarSx = {
    bgcolor: SIDEBAR_COLORS.bg,
    backgroundImage: 'none',
    color: SIDEBAR_COLORS.fg,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  // Desktop pins the content to SIDEBAR_WIDTH so it doesn't reflow while the
  // sidebar animates closed; the drawer sizes itself to its content.
  const contentWidthSx = isCompact ? {} : { minWidth: SIDEBAR_WIDTH, width: SIDEBAR_WIDTH };

  const sidebarContent = (
    <>
      {/* Same height as the header, with a divider on the header's bottom border line. */}
      <Box
        sx={{
          height: HEADER_HEIGHT,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          boxSizing: 'border-box',
          borderBottom: `1px solid ${SIDEBAR_COLORS.divider}`,
          ...contentWidthSx,
        }}
      >
        <img
          src={alignsysWhiteLogo}
          alt="Alignsys"
          style={{ height: HEADER_HEIGHT - 32, maxWidth: 140, objectFit: 'contain', display: 'block' }}
        />
      </Box>

      {/* The user's organisation, under the logo. */}
      {orgName && (
        <Box
          title={orgName}
          sx={{
            flexShrink: 0,
            px: 2,
            py: 1.25,
            boxSizing: 'border-box',
            borderBottom: `1px solid ${SIDEBAR_COLORS.divider}`,
            ...contentWidthSx,
          }}
        >
          <Typography sx={{ fontSize: 10.5, opacity: 0.7, lineHeight: 1.2 }}>Organization</Typography>
          <Typography
            sx={{ fontSize: 12.5, fontWeight: 400, lineHeight: 1.35, textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {orgName}
          </Typography>
        </Box>
      )}

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', ...contentWidthSx }}>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {sections.map((item) => (
            <li key={item.key}>
              <SidebarRow item={item} active={item.key === activeKey} onClick={() => select(item.key)} />
            </li>
          ))}
        </Box>

        {/* Bottom: extra links, the signed-in user (click to edit the profile) and Sign out. */}
        <Box sx={{ mt: 'auto', borderTop: `1px solid ${SIDEBAR_COLORS.divider}`, pb: 1 }}>
          {footerSections.length > 0 && (
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, borderBottom: `1px solid ${SIDEBAR_COLORS.divider}` }}>
              {footerSections.map((item) => (
                <li key={item.key}>
                  <SidebarRow item={item} active={item.key === activeKey} onClick={() => select(item.key)} />
                </li>
              ))}
            </Box>
          )}
          {onOpenProfile ? (
            <Tooltip title="Edit my profile" placement="right">
              <Box
                component="button"
                type="button"
                onClick={openProfile}
                aria-label={`Signed in as ${userName}. Edit my profile`}
                sx={{ ...sidebarRowSx(), py: 1.5 }}
              >
                <UserAvatar name={userName} src={avatarSrc} size={32} bgcolor="rgba(255,255,255,0.18)" />
                <UserLines userName={userName} />
                <FaPen size={11} aria-hidden style={{ opacity: 0.7, flexShrink: 0 }} />
              </Box>
            </Tooltip>
          ) : (
            <Box sx={{ ...sidebarRowSx(), cursor: 'default', py: 1.5, '&:hover': {} }}>
              <UserAvatar name={userName} src={avatarSrc} size={32} bgcolor="rgba(255,255,255,0.18)" />
              <UserLines userName={userName} />
            </Box>
          )}
          <Box component="button" type="button" onClick={logout} sx={sidebarRowSx()}>
            <FaSignOutAlt size={16} aria-hidden />
            Sign out
          </Box>
        </Box>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden', bgcolor: BRAND.surface }}>
      {isCompact ? (
        <Drawer
          open={open}
          onClose={() => onOpenChange(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            component: 'nav',
            'aria-label': navLabel,
            sx: { ...sidebarSx, width: 'max-content', minWidth: SIDEBAR_WIDTH, maxWidth: '85vw', overflowX: 'hidden', border: 0 },
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Box
          component="nav"
          aria-label={navLabel}
          sx={{
            ...sidebarSx,
            width: open ? SIDEBAR_WIDTH : 0,
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 0.3s ease',
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {/* Desktop: tab on the sidebar's edge that collapses and expands it. */}
      {!isCompact && (
        <Tooltip title={open ? 'Minimize sidebar' : 'Expand sidebar'} placement="right">
          <Box
            component="button"
            type="button"
            aria-label={open ? 'Minimize sidebar' : 'Expand sidebar'}
            aria-expanded={!!open}
            onClick={toggleSidebar}
            sx={{
              all: 'unset',
              boxSizing: 'border-box',
              position: 'fixed',
              top: '45%',
              left: open ? SIDEBAR_WIDTH : 0,
              width: 10,
              height: 80,
              bgcolor: SIDEBAR_COLORS.bg,
              color: SIDEBAR_COLORS.fg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1100,
              clipPath: 'polygon(0% 0%, 100% 8px, 100% calc(100% - 8px), 0% 100%)',
              boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
              transition: 'left 0.3s ease',
              '&:focus-visible': { outline: `2px solid ${BRAND.primaryDark}`, outlineOffset: 2 },
            }}
          >
            {open ? <FaCaretLeft size={14} aria-hidden /> : <FaCaretRight size={14} aria-hidden />}
          </Box>
        </Tooltip>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            height: HEADER_HEIGHT,
            boxSizing: 'border-box',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 1, sm: 2 },
            bgcolor: BRAND.surface,
            borderBottom: `1px solid ${NEUTRAL_COLORS.borderSubtle}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: '1 1 auto' }}>
            <Tooltip title={open ? 'Hide menu' : 'Show menu'}>
              <IconButton
                size="small"
                aria-label={open ? 'Hide menu' : 'Show menu'}
                onClick={toggleSidebar}
                sx={{ color: BRAND.primary }}
              >
                <FaBars size={20} />
              </IconButton>
            </Tooltip>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h1"
                sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: BRAND.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {caption}
              </Typography>
            </Box>
          </Box>

          {/* Right side: one pill with the organisation logo, greeting, avatar and menu arrow. */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 }, flexShrink: 0, ml: { xs: 1, sm: 2 }, '& img': { maxWidth: { xs: 96, sm: 140 } } }}>
            <Box
              component="button"
              type="button"
              aria-label={`Account menu for ${userName}`}
              aria-haspopup="menu"
              aria-expanded={Boolean(userMenuAnchor)}
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{
                all: 'unset',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 0,
                py: 0.5,
                pl: { xs: 0.5, sm: 1.25 },
                pr: 0.5,
                borderRadius: 999,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                '&:hover': { bgcolor: BRAND.surfaceLight },
                '&:focus-visible': { outline: `2px solid ${BRAND.primary}`, outlineOffset: 2 },
              }}
            >
              {/* Organisation logo first, then a thin divider; the avatar + arrow stay together at the end. */}
              {headerExtra && (
                <>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', '& img': { height: 32, maxHeight: 32, padding: 0 } }}>
                    {headerExtra}
                  </Box>
                  <Box component="span" aria-hidden sx={{ width: '1px', alignSelf: 'stretch', my: 0.5, bgcolor: NEUTRAL_COLORS.borderSubtle, flexShrink: 0 }} />
                </>
              )}
              <Typography
                component="span"
                sx={{
                  display: { xs: 'none', md: 'block' },
                  minWidth: 0,
                  fontSize: 13,
                  color: NEUTRAL_COLORS.muted,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { md: 260 },
                }}
              >
                Welcome,{' '}
                <Box component="span" sx={{ fontWeight: 400, color: NEUTRAL_COLORS.strong }}>{userName}</Box>
              </Typography>
              <UserAvatar name={userName} src={avatarSrc} />
              <FaChevronDown size={10} color={NEUTRAL_COLORS.muted} aria-hidden style={{ flexShrink: 0 }} />
            </Box>
          </Box>
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { minWidth: 200, mt: 0.5 } }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography sx={{ fontSize: 11, color: NEUTRAL_COLORS.muted }}>Signed in as</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 400, color: NEUTRAL_COLORS.strong }}>{userName}</Typography>
            </Box>
            <Divider />
            {onOpenProfile && (
              <MenuItem onClick={openProfile} sx={{ fontSize: 13, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}><FaUserCircle size={15} /></ListItemIcon>
                My profile
              </MenuItem>
            )}
            {accountMenuItems.map((item) => (
              <MenuItem
                key={item.key}
                onClick={() => { setUserMenuAnchor(null); item.onClick(); }}
                sx={{ fontSize: 13, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>{item.icon}</ListItemIcon>
                {item.label}
              </MenuItem>
            ))}
            <MenuItem onClick={logout} sx={{ fontSize: 13, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}><FaSignOutAlt size={15} /></ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Box>

        <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: 'auto', ...mainSx }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

const UserLines = ({ userName }) => (
  <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
    <Typography sx={{ fontSize: 10.5, opacity: 0.7, lineHeight: 1.2 }}>Signed in as</Typography>
    <Typography title={userName} sx={{ fontSize: 13, fontWeight: 400, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {userName}
    </Typography>
  </Box>
);

export default AppShell;
