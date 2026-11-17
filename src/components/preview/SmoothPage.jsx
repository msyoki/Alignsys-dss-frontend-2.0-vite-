import React, { useEffect, useRef, useState } from 'react';
import { Page } from 'react-pdf';

/** How long zooming must pause before the page is re-drawn sharp at the new size. */
const SETTLE_MS = 150;

/**
 * Drop-in replacement for react-pdf's <Page> in the main viewer column, made
 * for zooming without flicker.
 *
 * A plain <Page> clears and re-draws its canvas on every `scale` change, so
 * each zoom step (slider, buttons, pinch) blanks the page for a moment. Here:
 *   - the last fully drawn canvas stays on screen and is stretched with a CSS
 *     transform to the requested `scale` immediately (no blank frame), so it
 *     always lines up with overlays positioned at that scale;
 *   - once zooming pauses for SETTLE_MS, a sharp copy is drawn off-screen at
 *     the new scale and swapped in only when it has finished drawing.
 *
 * `onLoadSuccess` keeps react-pdf's contract: it fires once the page loads and
 * again on every `scale` change, with `width`/`height` at the requested scale.
 * `className` goes on the outer element, which has the page's full size.
 */
const SmoothPage = ({ scale = 1, className, onLoadSuccess, loading, ...pageProps }) => {
  const [rendered, setRendered] = useState(scale); // scale of the canvas on screen
  const [target, setTarget] = useState(scale); // scale being drawn off-screen
  const [page, setPage] = useState(null); // pdf.js page proxy
  const onLoadRef = useRef(onLoadSuccess);
  onLoadRef.current = onLoadSuccess;

  // Ask for a sharp re-draw once the requested scale stops changing.
  useEffect(() => {
    if (scale === target) return undefined;
    const t = setTimeout(() => setTarget(scale), SETTLE_MS);
    return () => clearTimeout(t);
  }, [scale, target]);

  // Same contract as react-pdf: report the page at the *requested* scale.
  useEffect(() => {
    if (!page || !onLoadRef.current) return;
    Object.defineProperty(page, 'width', { get() { return this.view[2] * scale; }, configurable: true });
    Object.defineProperty(page, 'height', { get() { return this.view[3] * scale; }, configurable: true });
    Object.defineProperty(page, 'originalWidth', { get() { return this.view[2]; }, configurable: true });
    Object.defineProperty(page, 'originalHeight', { get() { return this.view[3]; }, configurable: true });
    onLoadRef.current(page);
  }, [page, scale]);

  // Natural (scale 1, rotation applied) size, for sizing the outer element.
  const natural = page ? page.getViewport({ scale: 1 }) : null;
  const outerStyle = natural
    ? { position: 'relative', width: Math.floor(natural.width * scale), height: Math.floor(natural.height * scale) }
    : { position: 'relative' };

  const layers = rendered === target ? [rendered] : [rendered, target];

  return (
    <div className={className} style={outerStyle}>
      {layers.map((s) => {
        const onScreen = s === rendered;
        const style = !natural
          ? undefined // first load: let the page size the wrapper normally
          : onScreen
            ? { position: 'absolute', top: 0, left: 0, transform: `scale(${scale / s})`, transformOrigin: '0 0' }
            : { position: 'absolute', top: 0, left: 0, visibility: 'hidden', pointerEvents: 'none' };
        return (
          <div key={s} style={style}>
            <Page
              {...pageProps}
              scale={s}
              loading={onScreen ? loading : null}
              onLoadSuccess={setPage}
              onRenderSuccess={() => { if (s === target) setRendered(target); }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default SmoothPage;
