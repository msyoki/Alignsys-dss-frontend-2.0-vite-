import React from 'react';
import { FaPaperPlane, FaEnvelope } from 'react-icons/fa';
import logo from '../../../../images/ZFWHITE.png';

// Same look as the DSS "Signed Successfully" page.
export default function SentScreen({ signers = [] }) {
  return (
    <main className="sent-screen">
      <div className="sent-card">
        <img src={logo} alt="Alignsys" className="sent-logo" />
        <span className="sent-icon" aria-hidden><FaPaperPlane /></span>
        <h1 className="sent-title">Document sent successfully</h1>
        <p className="sent-sub">
          Sent to {signers.length} signer{signers.length === 1 ? '' : 's'}
        </p>

        {signers.length > 0 && (
          <ul className="sent-list">
            {signers.map((email) => (
              <li key={email}><FaEnvelope size={11} aria-hidden /> <span>{email}</span></li>
            ))}
          </ul>
        )}

        <div className="sent-info">
          <p className="sent-info-label">What's next</p>
          <p className="sent-info-text">
            Each signer will get an e-mail with a link to sign. A final copy of the document will be
            shared on e-mail once all signers have completed signing.
          </p>
        </div>

        <p className="sent-close">You may now close this window.</p>
      </div>
    </main>
  );
}
