import React from "react";
import loading from "../../images/ZFBLU.png";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

const LoadingMini = ({ msg = "Please wait, processing request...", msg2 }) => (
  <Box
    className="p-4"
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      backgroundColor: "#fff",

    }}
  >
    {/* Logo */}
    <img src={loading} alt="Loading" style={{ width: "150px", marginBottom: "15px" }} />

    {/* Circular Progress */}
    <CircularProgress size={50} thickness={4} sx={{ color: "#1976d2", mb: 2 }} />

    {/* Message */}
    <Typography variant="body2" sx={{ fontSize: "12px", mt: 1 , color:'#555'}}>
      {msg}
    </Typography>

    {/* Optional Secondary Message */}
    {msg2 && (
      <Typography variant="body2" sx={{ fontSize: "12px" }}>
        {msg2}
      </Typography>
    )}
  </Box>
);

export default LoadingMini;
