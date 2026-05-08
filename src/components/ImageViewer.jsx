import React from 'react';

const ImageViewer = ({ base64 }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <img 
        src={base64} 
        alt="Base64 Image" 
        style={{ width: '60%', height: '60%', border: '1px solid #ddd', padding: '5px', borderRadius: '4px' }}
      />
    </div>
  );
};

export default ImageViewer;
