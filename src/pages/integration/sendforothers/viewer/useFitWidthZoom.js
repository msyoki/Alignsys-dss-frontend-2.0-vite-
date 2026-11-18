import { useEffect } from 'react';

/** Widest common portrait page (US Letter, 612pt); A4 is 595pt, so both fit. */
const PAGE_WIDTH = 612;
/** Breathing room around the page inside the viewer, plus room for a scrollbar. */
const MARGIN = 24;
const SCROLLBAR = 16;
/**
 * Ignore width changes smaller than this. One zoom step (1%) is ~6px of page width,
 * so a layout that grows or shrinks by a few pixels when the page size changes
 * (a scrollbar appearing, a column sized by its content) would otherwise flip the
 * zoom back and forth forever (e.g. 74% ⇄ 75%).
 */
const MIN_CHANGE = 24;
/** If the fit keeps changing anyway, stop re-fitting until the window itself resizes. */
const MAX_FITS = 4;
const FIT_WINDOW_MS = 1500;

/**
 * Fit-to-width starting zoom for a PDF viewer: the page fills the viewer's
 * width (capped at 100%, never below 25%) on phones, tablets and desktops.
 *
 * Re-fits only when the viewer's width really changes (window resize, rotating a
 * tablet, opening/closing side panels), so a zoom the user picks is kept
 * while they work.
 */
export default function useFitWidthZoom(containerRef, setZoom) {
  useEffect(() => {
    let lastWidth = null;
    let lastZoom = null;
    let recent = [];
    let paused = false;
    let frame = 0;

    const fit = (width, force = false) => {
      if (!width) return;
      if (!force && lastWidth !== null && Math.abs(width - lastWidth) < MIN_CHANGE) return;
      if (!force && paused) return;

      const now = Date.now();
      recent = recent.filter((t) => now - t < FIT_WINDOW_MS);
      recent.push(now);
      if (!force && recent.length > MAX_FITS) {
        paused = true; // a resize loop: keep the current zoom
        return;
      }

      lastWidth = width;
      // Border-box width minus a fixed scrollbar allowance: the result is the same
      // whether or not a scrollbar is showing at this moment.
      const z = Math.round(Math.min(1, Math.max(0.25, (width - SCROLLBAR - MARGIN) / PAGE_WIDTH)) * 100) / 100;
      if (z !== lastZoom) {
        lastZoom = z;
        setZoom(z);
      }
    };

    const measure = () => Math.round(containerRef.current?.offsetWidth || 0);
    const schedule = (force = false) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fit(measure(), force));
    };

    // The window really changed size (rotation, resize): fit again even after a pause.
    const onWindowResize = () => {
      paused = false;
      recent = [];
      schedule(true);
    };
    window.addEventListener('resize', onWindowResize);

    const el = containerRef.current;
    let ro;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => schedule());
      ro.observe(el);
    }
    fit(measure() || window.innerWidth, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onWindowResize);
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
