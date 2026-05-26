import React, { memo } from "react";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import logo from "../../images/ZFBLU.webp";

// -------------------- Progress With Label --------------------
const CircularProgressWithLabel = memo(({ value = 0 }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 1,
    }}
  >
    <CircularProgress
      variant="determinate"
      value={value}
      size={58}
      thickness={4}
    />

    <Typography
      variant="body2"
      sx={{
        fontWeight: 600,
        color: "text.secondary",
        fontSize: "13px",
      }}
    >
      {`${Math.round(value)}%`}
    </Typography>
  </Box>
));

CircularProgressWithLabel.displayName = "CircularProgressWithLabel";

CircularProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
};

// -------------------- Loading Dialog --------------------
function LoadingDialog({
  opendialogloading = false,
  msg = "Processing",
  percentage,
}) {
  const hasPercentage =
    typeof percentage === "number" && !Number.isNaN(percentage);

  return (
    <Dialog
      open={opendialogloading}
      keepMounted
      fullWidth
      maxWidth="xs"
      aria-describedby="loading-dialog-description"
      PaperProps={{
        elevation: 6,
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          mx: 2,
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 3, sm: 4 },
          py: { xs: 4, sm: 5 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src={logo}
          alt="logo"
          loading="lazy"
          sx={{
            width: { xs: 110, sm: 140 },
            height: "auto",
            mb: 2.5,
            objectFit: "contain",
          }}
        />

        {/* Message */}
        {!!msg && (
          <Typography
            className="loading-indicator-text"
            sx={{
              fontSize: { xs: "14px", sm: "15px" },
              color: "text.primary",
              fontWeight: 500,
              mb: 3,
              lineHeight: 1.5,
            }}
          >
            {msg}
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </Typography>
        )}

        {/* Loader */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 70,
          }}
        >
          {hasPercentage ? (
            <CircularProgressWithLabel value={percentage} />
          ) : (
            <CircularProgress size={42} thickness={4} />
          )}
        </Box>

        {/* Footer */}
        <Typography
          variant="body2"
          sx={{
            mt: 3,
            fontSize: "12px",
            color: "text.secondary",
            lineHeight: 1.6,
          }}
        >
          Please do not reload or close this page.
          <br />
          Thank you for your patience.
        </Typography>
      </Box>
    </Dialog>
  );
}

LoadingDialog.propTypes = {
  opendialogloading: PropTypes.bool,
  msg: PropTypes.string,
  percentage: PropTypes.number,
};

export default memo(LoadingDialog);