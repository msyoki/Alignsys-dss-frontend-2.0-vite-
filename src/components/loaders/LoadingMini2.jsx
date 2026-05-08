import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import logo from '../../images/ZFBLU.webp';

function CircularProgressWithLabel(props) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" size={70} {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" component="div" color="text.secondary" fontSize="12px">
          {`${props.value}%`}
        </Typography>
      </Box>
    </Box>
  );
}

export default function LoadingMini(props) {
  let logostyle = {
    width: '200px',
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
      <div className="text-center p-3">
        <div className="p-2 ">
          <a href="https://techedge.co.ke" target="_blank" rel="noopener noreferrer">
        
              <img src={logo} style={logostyle} alt="Default Logo" />
         
          </a>
        </div>

        {props.filename ? (
          <>
         
            <CircularProgressWithLabel value={props.percent} />
            <p className="my-4 " style={{ fontSize: '14px', color: '#555' }}>
              <span style={{ color: '#1C4690' }} className="my-2">
                {props.filename}
              </span>
            </p>
            <p className="my-4 " style={{ fontSize: '14px', color: '#555' }}>
              Almost there! We're fetching the document. <br /> Please wait a moment...
            </p>
            
          </>
        ) : (
          <>
            <CircularProgressWithLabel value={props.percent} />
            <p className="my-4 " style={{ fontSize: '13px', color: '#555' }}>
              Almost there! We're fetching the document. <br /> Please wait a moment...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
