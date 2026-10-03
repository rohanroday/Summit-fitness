// One shared source of scroll truth for GSAP, Lenis and the WebGL layers.
// Lenis writes y and velocity every frame; everything else only reads.
export const bus = {
  y: 0,
  velocity: 0, // px per frame, smoothed, signed (positive = scrolling down)
  lenis: null,
  introDone: false,
};

const reducedQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
export const prefersReduced = () => !!reducedQuery?.matches;

// The scrub hero is taller than its film: the last 100vh is a "tail" during which the
// next section slides up over the resting final frame.
//   film: scroll distance that plays the whole film (progress 0..1)
//   exit: scrollY at which the next section fully covers the hero
export function heroBounds() {
  const hero = document.getElementById('hero');
  const vh = window.innerHeight;
  if (!hero) return { scrub: false, film: 1, exit: 0 };
  const scrub = hero.classList.contains('hero-scrub');
  const film = Math.max(1, hero.offsetHeight - (scrub ? 2 : 1) * vh);
  return { scrub, film, exit: scrub ? hero.offsetHeight - vh : hero.offsetHeight };
}

export function onIntroDone(fn) {
  if (bus.introDone) {
    fn();
    return () => {};
  }
  const h = () => fn();
  window.addEventListener('summit:intro-done', h, { once: true });
  return () => window.removeEventListener('summit:intro-done', h);
}

export function finishIntro() {
  if (bus.introDone) return;
  bus.introDone = true;
  window.dispatchEvent(new Event('summit:intro-done'));
}
