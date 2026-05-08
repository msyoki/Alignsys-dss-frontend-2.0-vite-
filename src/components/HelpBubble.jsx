import React, { useState } from 'react';
import { Tooltip, IconButton, Modal, Box } from '@mui/material';
import { FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import helplogo from '../images/help2.png';
import '../styles/HelpBubble.css'; // Import the CSS file for styling
import Chatbot from './Chatbot.jsx';

const HelpBubble = ({ content, base64, filename }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    if(isModalOpen){
      setModalOpen(false);
    }else{
      setModalOpen(true);
    }
    
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  };

  const handleExitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  return (
    <div className="help-bubble-container">
      <Tooltip placement="left-end" title="Help | How to sign the document?">
        <IconButton
          sx={{
            backgroundColor: '#2757aa',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            '&:hover': { backgroundColor: '#1C4690' }
          }}
          onClick={handleOpenModal}
        >
          <FaInfoCircle size={15} color="#fff" />
        </IconButton>
      </Tooltip>
    
      <Chatbot base64={base64} filename={filename} />
     

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="help-modal-title"
        aria-describedby="help-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: 3,
            borderRadius: '8px',
            boxShadow: 24,
            maxWidth: '600px',
            width: '100%',
            outline: 'none',
          }}
        >
          <IconButton
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              color: '#1C4690',
              fontSize: '25px',
            }}
            onClick={handleCloseModal}
          >
            <FaTimesCircle size={22} color="#1C4690" />
          </IconButton>
          <p className="help-bubble-text" style={{ fontSize: '16px', color: '#1C4690' }}>
            To sign the document
          </p>
          <div style={{ fontSize: '12px' }}>
            <ol>
              <li>Once the document loads, use the options at the top of the screen to either,</li>
              <ul>
                <li>Sign on the current page,</li>
                <li>Sign on all pages,</li>
                <li>Decline to sign,</li>
              </ul>
              <li>Should you choose “Sign on the current page” or “Sign on all pages”, a pop-up window will appear that allows you to either choose from a list of saved signatures, upload a signature from your computer, or draw a new signature.</li>
              <li>Once you have selected your preferred signing option, the signature appears on the signature pad.</li>
              <li>Click on ‘Place Signature’ below where your signature appears. The document will then appear on the previewer.</li>
              <li>Place your cursor where you would like to place the signature and click. Use your cursor to position and resize the signature as you prefer.</li>
              <li>Click on “Complete Signing” at the top right of the previewer.</li>
            </ol>
            <p style={{ fontSize: '12px' }}>
              Congratulations on successfully signing the document. We thank you for using our service. We hope you enjoyed the experience.
            </p>
          </div>
          <p className="help-bubble-text" style={{ fontSize: '13px' }}>{content}</p>
        </Box>
      </Modal>
    </div>
  );
};

export default HelpBubble;
