import * as React from 'react';
import { PreviewLoading } from './LoaderKit';

/**
 * Document on its way (same design as Alignsys EDMS): a placeholder page and a
 * card with the file name and real download progress (`percent`, 0-100).
 * Fills the window height, as the previous full-screen loader did.
 */
export default function LoadingMini({ filename, percent }) {
  const pct = typeof percent === 'number' ? percent : Number(percent);
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <PreviewLoading
        fileName={filename}
        percent={Number.isNaN(pct) ? undefined : pct}
        message="Fetching the document…"
        minHeight={0}
      />
    </div>
  );
}
