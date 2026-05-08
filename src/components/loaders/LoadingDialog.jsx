import React from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import logo from "../../images/ZFBLU.webp";

// --- Circular Progress with Percentage Label ---
function CircularProgressWithLabel({ value }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: 1,
      }}
    >
      <CircularProgress
        variant="determinate"
        value={value}
        size={60}
        thickness={4}
        sx={{ color: "primary.main" }}
      />
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mt: 1, fontWeight: 500 }}
      >
        {`${Math.round(value)}%`}
      </Typography>
    </Box>
  );
}

CircularProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
};

// --- Loading Dialog Component ---
const LoadingDialog = ({ opendialogloading = false, msg, percentage }) => {
  return (
    <Dialog
      keepMounted
      open={opendialogloading}
      aria-describedby="loading-dialog-description"
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          m: 2,
          width: "100%",
          maxWidth: 400,
          borderRadius: 3,
          boxShadow: 6,
        },
      }}
    >
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          fontFamily: "Roboto, Arial, sans-serif",
          color: "#333",
          width: { xs: "90vw", sm: 400 },
          maxWidth: "100vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src={logo}
          alt="logo"
          sx={{
            width: { xs: 120, sm: 150 }, // smaller on phones, larger on tablets/desktop
            mb: 2,
          }}
        />


        {/* Optional message */}
        {msg && (
          <Typography
           className="loading-indicator-text"
            sx={{
              fontSize: "15px",
              color: "text.primary",
              mb: 2,
              fontWeight: 'normal',
            }}
          >
            
            {msg}<span>.</span><span>.</span><span>.</span>
            
          </Typography>
        )}

        {/* Loader */}
        <Box sx={{ mb: 1 }}>
          {percentage !== undefined ? (
            <CircularProgressWithLabel value={percentage} />
          ) : (
            <CircularProgress
              size={40}
              thickness={4}
              sx={{ color: "primary.main" }}
            />
          )}
        </Box>

        {/* Footer / Processing message */}
        <Typography
          variant="body2"
          sx={{ fontSize: "13px", color: "text.secondary", mt: 2 }}
        >
          Please do not reload or close this page.
          <br />
          Thank you for your patience.
        </Typography>
      </Box>
    </Dialog>
  );
};

LoadingDialog.propTypes = {
  opendialogloading: PropTypes.bool,
  msg: PropTypes.string,
  percentage: PropTypes.number,
};

export default LoadingDialog;
