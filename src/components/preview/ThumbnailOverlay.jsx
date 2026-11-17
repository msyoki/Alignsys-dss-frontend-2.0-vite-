import React from 'react';

// Read-only copy of a page's annotations, drawn over its thumbnail.
// Coordinates are PDF points (page at scale 1, origin top-left), the same values the
// main viewer uses, so `scale` is just thumbnail width / page width.
// items: [{ id, kind: 'box' | 'text' | 'image', x, y, width, height, color?, content?, size?, src? }]
export default function ThumbnailOverlay({ items, scale, pageWidth, pageHeight }) {
  if (!items?.length || !scale) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {items.map((a) => {
        const w = Math.min(a.width, pageWidth || a.width) * scale;
        const h = Math.min(a.height, pageHeight || a.height) * scale;
        const left = Math.max(0, Math.min(a.x * scale, (pageWidth || Infinity) * scale - w));
        const top = Math.max(0, Math.min(a.y * scale, (pageHeight || Infinity) * scale - h));
        const base = { position: 'absolute', left, top, width: w, height: h, boxSizing: 'border-box' };
        // Placed items get the same dashed frame as on the page (.annotation in CustomViewer.css),
        // thinned to 1px for the thumbnail.
        const placedFrame = { border: '1px dashed rgba(0, 0, 0, 0.35)', boxShadow: '0 0 2px rgba(0, 0, 0, 0.2)' };

        if (a.kind === 'image') {
          return a.src ? (
            <div key={a.id} style={{ ...base, ...placedFrame }}>
              <img src={a.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            </div>
          ) : null;
        }
        if (a.kind === 'text') {
          const px = parseFloat(a.size) || 10;
          return (
            <div
              key={a.id}
              style={{
                ...base,
                ...placedFrame,
                color: a.color || '#000',
                fontSize: Math.max(px * scale, 2),
                lineHeight: 1.15,
                overflow: 'hidden',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {a.content}
            </div>
          );
        }
        // Signature box (not signed yet): signer colour, dashed outline and "Sign Here".
        // At thumbnail size the main page's 11px label would be ~3px, so the label is sized
        // to fill the box instead (about 70% of its height, never wider than the box).
        return (
          <div
            key={a.id}
            style={{
              ...base,
              border: `1px dashed ${a.color || 'rgba(120,120,120,0.9)'}`,
              backgroundColor: a.color ? `${a.color}40` : 'rgba(255,235,59,0.25)',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              color: '#1f2937',
              fontSize: Math.max(Math.min(h * 0.7, w / 5.2), 4),
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            Sign Here
          </div>
        );
      })}
    </div>
  );
}
