import React from 'react';

// The look of one signature box on the page (place-signature-boxes viewers). Fills the
// draggable box it sits in; position, size, dragging and deleting stay in the viewer.
// The "Remove" button carries `sa-no-drag` so the viewer's <Draggable cancel> lets it click.
export default function SignBoxVisual({ color, email, selected, scale = 1, onRemove }) {
  const c = color || '#6b7280';
  const name = String(email || '').split('@')[0];
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxSizing: 'border-box',
          border: selected ? `2px solid ${c}` : `1.5px dashed ${c}`,
          background: `${c}24`,
          borderRadius: 3,
          boxShadow: selected ? `0 0 0 3px ${c}33` : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          textAlign: 'center',
          lineHeight: 1.1,
          color: '#1f2937',
          userSelect: 'none',
        }}
      >
        {/* Same label and size as the boxes on the signing page (PDFViewerSigning). */}
        <span title={email} style={{ fontSize: `${11 * scale}px` }}>Sign Here</span>
        {selected && [{ left: -5, top: -5 }, { right: -5, top: -5 }, { left: -5, bottom: -5 }, { right: -5, bottom: -5 }].map((pos, i) => (
          <span key={i} aria-hidden style={{ position: 'absolute', width: 8, height: 8, background: '#fff', border: `2px solid ${c}`, borderRadius: 2, ...pos }} />
        ))}
      </div>
      {selected && onRemove && (
        <div
          className="sa-no-drag"
          style={{
            position: 'absolute', left: 0, bottom: '100%', marginBottom: 6, zIndex: 5,
            display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px 3px 9px',
            borderRadius: 999, background: '#1f2937', color: '#fff', fontSize: 11.5, whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0,0,0,.25)', cursor: 'default',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          {name}
          <button
            type="button"
            className="sa-box-remove"
            aria-label={`Remove this box for ${email}`}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{ font: 'inherit', fontSize: 11.5, fontWeight: 600, padding: '2px 10px', borderRadius: 999, border: 0, background: '#fecaca', color: '#7f1d1d', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      )}
    </>
  );
}
