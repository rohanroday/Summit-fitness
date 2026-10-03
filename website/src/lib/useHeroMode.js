import { useEffect, useState } from 'react';

// Which hero to serve, kept live with change listeners:
//   'scrub'      the scroll film, widescreen frames (laptops, landscape tablets)
//   'static'     the light looping clip: phones/portrait screens (the user preferred the loop to
//                the scroll film there), reduced motion, Data Saver, or opened from a file
const REDUCED = '(prefers-reduced-motion: reduce)';
const TALL = '(max-aspect-ratio: 4/5)';
const queries = [REDUCED, TALL];

function decide() {
  if (typeof window === 'undefined') return 'static';
  if (window.location.protocol === 'file:') return 'static';
  if (navigator.connection && navigator.connection.saveData) return 'static';
  if (window.matchMedia(REDUCED).matches) return 'static';
  return window.matchMedia(TALL).matches ? 'static' : 'scrub';
}

export function useHeroMode() {
  const [mode, setMode] = useState(decide);
  useEffect(() => {
    const mqs = queries.map((q) => window.matchMedia(q));
    const onChange = () => setMode(decide());
    mqs.forEach((m) => m.addEventListener('change', onChange));
    return () => mqs.forEach((m) => m.removeEventListener('change', onChange));
  }, []);
  return mode;
}

export function usePrefersReducedMotion() {
  const q = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setReduced(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduced;
}
