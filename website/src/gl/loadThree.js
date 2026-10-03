// three.js is ~150 KB gzipped, so it is never in the first bundle. Every WebGL layer
// asks for it here; the first call starts the download, later calls share it.
let promise = null;

export function loadThree() {
  if (!promise) {
    promise = Promise.all([
      import('three'),
      import('three/addons/loaders/SVGLoader.js'),
      import('three/addons/environments/RoomEnvironment.js'),
    ]).then(([THREE, { SVGLoader }, { RoomEnvironment }]) => ({ THREE, SVGLoader, RoomEnvironment }));
  }
  return promise;
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// Renders only while the element is on screen and the tab is visible.
export function visibilityGate(el, onChange) {
  let inView = false;
  const emit = () => onChange(inView && !document.hidden);
  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    emit();
  }, { rootMargin: '120px 0px' });
  io.observe(el);
  document.addEventListener('visibilitychange', emit);
  return () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', emit);
  };
}

// Do the one-time GPU work (shader compile, texture upload) while the browser is idle,
// so it never lands as a hitch in the middle of a scroll when the layer comes into view.
export function warmUp(fn) {
  const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
  const id = ric(() => {
    try {
      fn();
    } catch {
      /* warm-up is an optimisation only */
    }
  }, { timeout: 3000 });
  return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
}
