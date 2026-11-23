import React, { useId } from 'react';
import { Slider, Tooltip } from '@mui/material';
import { FaMagnifyingGlassMinus, FaMagnifyingGlassPlus } from 'react-icons/fa6';

// Toolbar shared by the PDF viewers (place signature boxes, signing, preview): page list
// toggle, page navigation, zoom (magnifiers + slider), fit width, optional clear all, and
// `children` for a viewer's own buttons. Presentational: every action is the viewer's own.
const scopeBtn = {
  width: 30, height: 30, borderRadius: '50%', border: 0, background: 'transparent', color: '#2757aa',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0,
};
const iconBtn = (disabled) => ({
  width: 32, height: 32, borderRadius: 6, border: '1px solid #d0d5dd', background: '#fff',
  color: disabled ? '#c0c5cf' : '#4b5563', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  cursor: disabled ? 'default' : 'pointer', flexShrink: 0, padding: 0,
});
const pillBtn = { font: 'inherit', fontSize: 12, minHeight: 32, padding: '2px 12px', borderRadius: 999, border: '1px solid #d0d5dd', background: '#fff', color: '#4b5563', cursor: 'pointer', whiteSpace: 'nowrap' };
const divider = <span aria-hidden style={{ width: 1, height: 22, background: '#e5e7eb', flexShrink: 0 }} />;

export default function ViewerToolbar({
  asideOpen, onToggleAside, asideIcon,
  pageNumber, numPages, onPageInput, onPrev, onNext, prevIcon, nextIcon,
  zoom, setZoom, onZoomIn, onZoomOut, onResetZoom, zoomInIcon, zoomOutIcon,
  canClear, onClear, className = '', children,
}) {
  const pageInputId = useId();
  const atFirst = !numPages || pageNumber <= 1;
  const atLast = !numPages || pageNumber >= numPages;
  return (
    <div
      className={`sa-toolbar ${className}`}
      style={{
        minHeight: 48, flexShrink: 0, background: '#fff', borderBottom: '1px solid #e5e7eb', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '6px 14px', fontSize: 12.5, color: '#374151',
      }}
    >
      <Tooltip title={asideOpen ? 'Hide page list' : 'Show page list'}>
        <button type="button" onClick={onToggleAside} aria-pressed={asideOpen} style={{ ...pillBtn, display: 'inline-flex', alignItems: 'center', gap: 6, background: asideOpen ? '#eef4ff' : '#fff', color: asideOpen ? '#2757aa' : '#4b5563' }}>
          {asideIcon}
          Pages
        </button>
      </Tooltip>
      {divider}
      {/* Page navigation and zoom are groups that wrap as a whole on narrow screens. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', flexShrink: 0 }}>
      <button type="button" aria-label="Previous page" onClick={onPrev} disabled={atFirst} style={iconBtn(atFirst)}>{prevIcon}</button>
      <label htmlFor={pageInputId} style={{ fontSize: 12.5 }}>Page</label>
      <input
        id={pageInputId}
        type="number"
        value={pageNumber}
        onChange={onPageInput}
        min={1}
        max={numPages || 1}
        style={{ font: 'inherit', width: 52, height: 30, boxSizing: 'border-box', textAlign: 'center', fontSize: 12.5, border: '1px solid #d0d5dd', borderRadius: 6 }}
      />
      <span style={{ color: '#6D7386' }}>of {numPages || '–'}</span>
      <button type="button" aria-label="Next page" onClick={onNext} disabled={atLast} style={iconBtn(atLast)}>{nextIcon}</button>
      </div>

      <span style={{ flex: '1 1 auto' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', flexShrink: 0 }}>
      <Tooltip title="Zoom out">
        <button type="button" aria-label="Zoom out" onClick={onZoomOut} className="sa-scope-btn" style={scopeBtn}>{zoomOutIcon || <FaMagnifyingGlassMinus size={16} />}</button>
      </Tooltip>
      <Slider
        size="small"
        value={zoom * 100}
        onChange={(_, v) => setZoom(v / 100)}
        min={25}
        max={200}
        aria-label="Zoom"
        sx={{ width: 100, color: '#2757aa' }}
      />
      <Tooltip title="Zoom in">
        <button type="button" aria-label="Zoom in" onClick={onZoomIn} className="sa-scope-btn" style={scopeBtn}>{zoomInIcon || <FaMagnifyingGlassPlus size={16} />}</button>
      </Tooltip>
      <span style={{ width: 42, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
      <Tooltip title="Reset zoom: fit the page to the width">
        <button type="button" onClick={onResetZoom} style={pillBtn}>Fit width</button>
      </Tooltip>
      </div>
      {canClear && (
        <>
          {divider}
          <Tooltip title="Remove every signature box">
            <button type="button" onClick={onClear} style={{ ...pillBtn, fontWeight: 500, color: '#b42318', borderColor: '#f5c2c0' }}>Clear all boxes</button>
          </Tooltip>
        </>
      )}
      {children && (
        <>
          {divider}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{children}</div>
        </>
      )}
    </div>
  );
}
