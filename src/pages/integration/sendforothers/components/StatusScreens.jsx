import React from 'react';
import { FaExclamationTriangle, FaRedoAlt } from 'react-icons/fa';
import logo from '../../../../images/ZFBLU.webp';

export const Spinner = ({ size = 36 }) => (
  <span className="sfo-spinner" style={{ width: size, height: size }} aria-hidden />
);

export function LoadingScreen({ text }) {
  return (
    <main className="status-screen" aria-busy="true">
      <img src={logo} alt="Alignsys" className="status-logo" />
      <Spinner />
      <p className="status-text" role="status">{text}</p>
    </main>
  );
}

export function ErrorScreen({ title, message, onRetry }) {
  return (
    <main className="status-screen">
      <img src={logo} alt="Alignsys" className="status-logo" />
      <div className="status-card" role="alert">
        <span className="status-badge warning" aria-hidden><FaExclamationTriangle /></span>
        <h1 className="status-title">{title}</h1>
        {message && <p className="status-text">{message}</p>}
        {onRetry && (
          <button type="button" className="ui-btn ui-btn-primary" onClick={onRetry}>
            <FaRedoAlt size={12} aria-hidden /> Try again
          </button>
        )}
      </div>
    </main>
  );
}
