import React, { memo } from "react";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/system";
import { FaPenNib, FaInfoCircle } from "react-icons/fa";

import logo from "../../images/ZFBLU.webp";

const BRAND = "#2757aa";

// One set of dots that fades in turn (the message itself never carries dots).
const blink = keyframes`
  0%, 20% { opacity: 0.15; }
  50%     { opacity: 1; }
  100%    { opacity: 0.15; }
`;

const AnimatedDots = () => (
  <Box component="span" aria-hidden sx={{ display: "inline-flex", ml: "1px" }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        component="span"
        sx={{ animation: `${blink} 1.4s infinite`, animationDelay: `${i * 0.2}s` }}
      >
        .
      </Box>
    ))}
  </Box>
);

/**
 * Blocking "please wait" dialog (signing, loading, saving).
 *
 * Props: opendialogloading, msg (title, e.g. "Signing document"), detail (optional
 * one-line explanation), percentage (optional 0-100: shows real progress).
 */
function LoadingDialog({ opendialogloading = false, msg = "Processing", detail, percentage }) {
  const hasPercentage = typeof percentage === "number" && !Number.isNaN(percentage);
  // Callers sometimes pass "Signing Document..." - drop trailing dots/ellipsis, we animate our own.
  const title = (msg || "").replace(/[.…\s]+$/, "");

  return (
    <Dialog
      open={opendialogloading}
      keepMounted
      fullWidth
      maxWidth="xs"
      aria-labelledby="loading-dialog-title"
      aria-describedby="loading-dialog-description"
      PaperProps={{
        elevation: 8,
        sx: { borderRadius: 3, overflow: "hidden", mx: 2, maxWidth: 380 },
      }}
    >
      {/* Thin progress line along the top: real progress when known, otherwise animated. */}
      <LinearProgress
        variant={hasPercentage ? "determinate" : "indeterminate"}
        value={hasPercentage ? percentage : undefined}
        sx={{ height: 3, bgcolor: "#e3edf7", "& .MuiLinearProgress-bar": { bgcolor: BRAND } }}
      />

      <Box
        role="status"
        aria-live="polite"
        sx={{
          px: { xs: 3, sm: 4 },
          pt: { xs: 3.5, sm: 4 },
          pb: { xs: 2.5, sm: 3 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Spinner ring around a pen icon (or the percentage when known) */}
        <Box sx={{ position: "relative", width: 64, height: 64, mb: 2 }}>
          <CircularProgress
            variant={hasPercentage ? "determinate" : "indeterminate"}
            value={hasPercentage ? percentage : undefined}
            size={64}
            thickness={2.6}
            sx={{ color: BRAND, position: "absolute", inset: 0 }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 8,
              borderRadius: "50%",
              bgcolor: "#ecf4fc",
              color: BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasPercentage ? (
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: BRAND }}>
                {`${Math.round(percentage)}%`}
              </Typography>
            ) : (
              <FaPenNib size={18} aria-hidden />
            )}
          </Box>
        </Box>

        {!!title && (
          <Typography
            id="loading-dialog-title"
            sx={{ fontSize: { xs: 16, sm: 17 }, fontWeight: 600, color: "#1f2937", lineHeight: 1.35 }}
          >
            {title}
            <AnimatedDots />
          </Typography>
        )}

        {!!detail && (
          <Typography sx={{ mt: 0.75, fontSize: 13, color: "#4b5563", lineHeight: 1.5, maxWidth: 300 }}>
            {detail}
          </Typography>
        )}

        <Box
          id="loading-dialog-description"
          sx={{
            mt: 2.5,
            px: 1.5,
            py: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            borderRadius: 2,
            bgcolor: "#f8fafc",
            border: "1px solid #eef1f5",
            color: "#6b7280",
            fontSize: 12.5,
            lineHeight: 1.45,
          }}
        >
          <FaInfoCircle size={12} aria-hidden style={{ flexShrink: 0 }} />
          <span>Please keep this page open until it finishes.</span>
        </Box>

        <Box
          component="img"
          src={logo}
          alt="Alignsys"
          loading="lazy"
          sx={{ mt: 2.5, width: 84, height: "auto", objectFit: "contain", opacity: 0.85 }}
        />
      </Box>
    </Dialog>
  );
}

LoadingDialog.propTypes = {
  opendialogloading: PropTypes.bool,
  msg: PropTypes.string,
  detail: PropTypes.string,
  percentage: PropTypes.number,
};

export default memo(LoadingDialog);
