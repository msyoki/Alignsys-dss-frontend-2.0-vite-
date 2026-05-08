import React, { useState, useEffect } from 'react';
import Logo from '../images/ZFWHITE.png';
import SignedImage from '../images/Signed.png';
import { useLocation } from 'react-router-dom';

function Complete() {
  const location = useLocation();
  const [doctitle, setDocTitle] = useState('');

  useEffect(() => {
    try {
      setDocTitle(location.state?.doctitle || '');
    } catch (err) {}
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1C4690',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 20,
          padding: '40px 32px 32px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Logo */}
        <img
          src={Logo}
          alt="logo"
          style={{ width: 180, objectFit: 'contain', marginBottom: 36 }}
        />

        {/* Signed stamp */}
        <img
          src={SignedImage}
          alt="Signed"
          style={{ width: 80, marginBottom: 20, opacity: 0.95 }}
        />

        <h6 style={{ color: '#fff', fontWeight: 600, fontSize: '16px', marginBottom: 6 }}>
          Signed Successfully
        </h6>

        {doctitle && (
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: 20, fontStyle: 'italic' }}>
            {doctitle}
          </p>
        )}

        {/* Info box */}
        <div
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 12,
            padding: '14px 18px',
            textAlign: 'left',
            marginTop: 8,
          }}
        >
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            What's next
          </p>
          <p style={{ fontSize: '13px', color: '#fff', margin: 0 }}>
            A final copy of the document will be shared on email once all signers have completed signing.
          </p>
        </div>

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: 24, marginBottom: 0 }}>
          You may now close this window.
        </p>
      </div>
    </div>
  );
}

export default Complete;