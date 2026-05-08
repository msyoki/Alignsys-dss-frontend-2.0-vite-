import React from "react";
import logo from "../../images/ZFWHITE.webp";
import '../../styles/Loading.css'
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Loading = () => (
  <div className='loading d-flex flex-column align-items-center main-loader' style={{ margin: '15%' }}>
    <img src={logo} alt="logo" width='250px' />
    <br />

    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
      <CircularProgress size={50} thickness={4} style={{color:'#fff'}}/>
    </Box>
    
    <p className="mt-2 text-white" style={{ fontSize: '12px',color:'#555' }}>Please wait, loading resources ...</p>
  </div>
);

export default Loading;
