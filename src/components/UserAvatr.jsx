import { useState } from "react";
import {
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  Typography,
  ListItemIcon,
  Box,
} from "@mui/material";
import { FaEnvelope, FaBuilding, FaEdit, FaKey, FaSignOutAlt } from 'react-icons/fa';

export default function UserAvatarMenu(props) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    handleCloseMenu();
    props.onLogout();
  };

  const handlePasswordReset = () => {
    handleCloseMenu();
    window.location.href = "/password-reset"; // redirect to password reset page
  };

  const fullName =
    props.user.first_name && props.user.last_name
      ? `${props.user.first_name} ${props.user.last_name}`
      : props.user.first_name || props.user.last_name || props.user.username;

  return (
    <>
      <Tooltip title={fullName} placement="right" arrow>
        <IconButton onClick={handleOpenMenu} size="small">
          <Avatar
            alt={fullName}
            src={props.src}
            {...props.stringAvatar(fullName)}
            sx={{
              width: 36,
              height: 36,
              backgroundColor: "#2757aa",
              fontSize: "12.8px",
            }}
          />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            minWidth: 180,
            borderRadius: 2,
            mt: 1.2,
            py: 0.3,
            overflow: "visible",
            "&::before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              left: 18,
              width: 8,
              height: 8,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      >
        {/* User Info Section */}
        <Box sx={{ px: 1.5, py: 0.8, bgcolor: "grey.100", borderRadius: "0 0 6px 6px" }}>
          <Typography
            variant="subtitle2"
            component="div"
            fontWeight={600}
            sx={{ color: "#2757aa", fontSize: "12px" }}
          >
            <span className="mr-2" style={{ fontWeight: "lighter" }}>Hi!</span> {fullName}
          </Typography>


          <Box sx={{ backgroundColor: '#2757aa', color: '#fff', borderRadius: 1.5, p: 0.8, mt: 0.6 }}>
            <Box display="flex" alignItems="center">
              <FaEnvelope size={10} color="#fff" style={{ marginRight: 6 }} />
              <Typography variant="caption" component="div" sx={{ fontSize: "10px" }}>
                {props.user?.email}
              </Typography>

            </Box>

            <Box display="flex" alignItems="center" mt={0.4}>
              <FaBuilding size={10} color="#fff" style={{ marginRight: 6 }} />
              <Typography variant="caption" sx={{ fontSize: "10px" }}>
                {props.user?.company}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />
        <MenuItem onClick={() => { props.showprofile(); setAnchorEl(false) }} sx={{ py: 0.6 }}>
          <ListItemIcon sx={{ minWidth: 26 }}>
            <FaEdit size={12} color="#2757aa" />
          </ListItemIcon>
          <Typography variant="body2" component="span" sx={{ fontSize: "12px" }}>
            Edit Profile
          </Typography>

        </MenuItem>

        {/* Reset Password */}
        <MenuItem onClick={handlePasswordReset} sx={{ py: 0.6 }}>
          <ListItemIcon sx={{ minWidth: 26 }}>
            <FaKey size={12} color="#2757aa" />
          </ListItemIcon>
          <Typography variant="body2" sx={{ fontSize: "12px" }}>Reset Password</Typography>
        </MenuItem>

        {/* Logout */}
        <MenuItem onClick={handleLogout} sx={{ py: 0.6 }}>
          <ListItemIcon sx={{ minWidth: 26 }}>
            <FaSignOutAlt size={12} color="#2757aa" />
          </ListItemIcon>
          <Typography variant="body2" sx={{ fontSize: "12px" }}>Logout</Typography>
        </MenuItem>
      </Menu>

    </>
  );
}
