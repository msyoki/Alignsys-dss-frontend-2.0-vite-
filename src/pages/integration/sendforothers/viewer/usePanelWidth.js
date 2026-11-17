import { useEffect, useState } from 'react';

/** Room left around each thumbnail for the active highlight border. */
const INSET = 24;

/**
 * Width to draw page thumbnails at so they always fit their side panel
 * (no sideways scroll): the panel's inner width minus a small inset.
 * Pass `active` (e.g. "panel is open") so it re-measures when the panel
 * mounts; it also follows resizes. Returns undefined until measured.
 */
export default function usePanelWidth(panelRef, active = true) {
  const [width, setWidth] = useState(undefined);

  useEffect(() => {
    const el = panelRef.current;
    if (!active || !el) return undefined;
    const measure = (w) => {
      const next = Math.max(60, Math.floor(w - INSET));
      setWidth((prev) => (prev === next ? prev : next));
    };
    measure(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => measure(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [panelRef, active]);

  return width;
}
