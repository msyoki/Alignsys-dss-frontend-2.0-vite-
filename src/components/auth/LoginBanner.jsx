// Brand panel on the right of the sign-in and registration pages (hidden on phones).
import React from 'react';
import logo from '../../images/ZFWHITE.png';

const LoginBanner = () => (
  <div
    className="d-none d-md-flex right-side w-100 w-md-50 flex-column justify-content-center align-items-center"
    style={{
      backgroundColor: '#2757aa',
      padding: '40px 20px',
      textAlign: 'center',
    }}
  >
    <img
      src={logo}
      alt="Banner Logo"
      style={{
        width: '300px',
        maxWidth: '80%',
        filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.25))',
      }}
    />

    <p
      className="text-white mt-4"
      style={{
        fontSize: '18px',
        fontWeight: 500,
        opacity: 0.9,
        letterSpacing: '0.5px',
      }}
    >
      <strong style={{ fontSize: '20px' }}>DSS</strong> Digital Signing Service
    </p>

    <div
      style={{
        width: '60px',
        height: '4px',
        backgroundColor: 'white',
        opacity: 0.5,
        borderRadius: '2px',
        marginTop: '10px',
      }}
    />

    <p
      className="text-white mt-4"
      style={{
        fontSize: '14px',
        maxWidth: '340px',
        lineHeight: '1.6',
        opacity: 0.85,
      }}
    >
      Sign and manage documents digitally with secure, seamless workflow automation.
    </p>
  </div>
);

export default LoginBanner;
