import { useEffect } from 'react';

/** Widest common portrait page (US Letter, 612pt); A4 is 595pt, so both fit. */
const PAGE_WIDTH = 612;
/** Breathing room around the page inside the viewer. */
const MARGIN = 24;

/**
 * Fit-to-width starting zoom for a PDF viewer: the page fills the viewer's
 * width (capped at 100%, never below 25%) on phones, tablets and desktops.
 *
 * Re-fits only when the viewer's *width* changes (window resize, rotating a
 * tablet, opening/closing side panels), so a zoom the user picks is kept
 * while they work.
 */
export default function useFitWidthZoom(containerRef, setZoom) {
  useEffect(() => {
    let lastWidth = null;
    const fit = (width) => {
      if (!width || width === lastWidth) return;
      lastWidth = width;
      const z = (width - MARGIN) / PAGE_WIDTH;
      setZoom(Math.round(Math.min(1, Math.max(0.25, z)) * 100) / 100);
    };

    const el = containerRef.current;
    if (el && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(([entry]) => fit(Math.round(entry.contentRect.width)));
      ro.observe(el);
      fit(el.clientWidth);
      return () => ro.disconnect();
    }

    // Fallback (no element yet / no ResizeObserver): estimate from the window.
    const onResize = () => fit(containerRef.current?.clientWidth || window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
