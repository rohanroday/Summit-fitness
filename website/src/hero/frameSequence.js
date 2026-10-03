// A scroll-scrubbed film drawn from still frames on a canvas: no video seeking, so every
// scroll step paints instantly. Frames arrive coarse to fine (every 32nd, then 16th, ...),
// so the whole journey is scrubbable after the first few files; gaps show the nearest frame.
// Only frames near the playhead are kept decoded (ImageBitmap); the rest stay compressed.
// Between two neighbouring frames the canvas cross-blends for sub-frame smoothness.

const RADIUS = 16; // frames kept decoded around the playhead (~0.7s of film)
const EVICT = RADIUS + 6;
const CONCURRENCY = 6;

function loadOrder(n) {
  const seen = new Set();
  const order = [];
  for (const step of [64, 32, 16, 8, 4, 2, 1]) {
    for (let i = 0; i < n; i += step) if (!seen.has(i)) seen.add(i), order.push(i);
    if (!seen.has(n - 1)) seen.add(n - 1), order.push(n - 1); // the ending is always early
  }
  return order;
}

export function createFrameSequence({ canvas, count, src, focusY = 0.4, onProgress, onReady, onFail }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const blobs = new Array(count);
  const bitmaps = new Map();
  const decoding = new Set();
  let loaded = 0;
  let failed = 0;
  let ready = false;
  let disposed = false;
  let target = 0; // fractional frame index
  let lastKey = '';
  let iw = 1600;
  const ctrl = new AbortController();

  // ---- sizing: the canvas backs the stage at up to 1.5x, never above the source size
  const size = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(Math.min(r.width * dpr, iw * 1.25)));
    const h = Math.max(1, Math.round(w * (r.height / Math.max(1, r.width))));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingQuality = 'high';
      lastKey = '';
      draw();
    }
  };
  const ro = new ResizeObserver(size);
  ro.observe(canvas);

  // object-fit: cover, anchored like the poster (50% horizontally, focusY vertically)
  const paint = (bmp, alpha) => {
    const cw = canvas.width;
    const ch = canvas.height;
    const s = Math.max(cw / bmp.width, ch / bmp.height);
    const dw = bmp.width * s;
    const dh = bmp.height * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(bmp, (cw - dw) / 2, (ch - dh) * focusY, dw, dh);
  };

  const nearest = (i) => {
    for (let d = 0; d < count; d++) {
      if (bitmaps.has(i - d)) return i - d;
      if (bitmaps.has(i + d)) return i + d;
    }
    return -1;
  };

  function draw() {
    if (disposed || !ready) return;
    const i0 = Math.max(0, Math.min(count - 1, Math.floor(target)));
    const frac = Math.min(1, target - i0);
    const a = bitmaps.get(i0);
    const b = bitmaps.get(i0 + 1);
    let key;
    if (a && b && frac > 0.02) key = `${i0}|${Math.round(frac * 40)}`;
    else if (a) key = `${i0}`;
    else key = `n${nearest(i0)}`;
    if (key === lastKey) return;
    lastKey = key;
    if (window.__seqTrace) window.__seqTrace.push([performance.now(), target, key]); // test hook
    if (a && b && frac > 0.02) {
      paint(a, 1);
      paint(b, frac);
    } else {
      const n = a ? i0 : nearest(i0);
      if (n >= 0) paint(bitmaps.get(n), 1);
    }
    ctx.globalAlpha = 1;
  }

  // ---- keep a decoded window around the playhead
  const decode = (i) => {
    if (i < 0 || i >= count || !blobs[i] || bitmaps.has(i) || decoding.has(i)) return;
    decoding.add(i);
    createImageBitmap(blobs[i])
      .then((bmp) => {
        decoding.delete(i);
        if (disposed) return bmp.close();
        if (Math.abs(i - target) > EVICT) return bmp.close(); // the playhead moved on
        bitmaps.set(i, bmp);
        iw = bmp.width;
        if (!ready) {
          ready = true;
          size();
          onReady?.();
        }
        if (Math.abs(i - target) <= 2 || lastKey.startsWith('n')) {
          lastKey = '';
          draw();
        }
      })
      .catch(() => decoding.delete(i));
  };
  const keepWindow = () => {
    const c = Math.round(target);
    decode(c);
    decode(c + 1);
    for (let d = 1; d <= RADIUS; d++) {
      decode(c + d + 1);
      decode(c - d);
    }
    for (const [i, bmp] of bitmaps) {
      if (Math.abs(i - c) > EVICT) {
        bmp.close();
        bitmaps.delete(i);
      }
    }
  };

  // ---- network: coarse to fine, a few at a time, with a stall watchdog
  const order = loadOrder(count);
  let next = 0;
  let inFlight = 0;
  let watchdog = setTimeout(() => ctrl.abort(), 20000);
  const pump = () => {
    while (next < order.length && inFlight < CONCURRENCY) {
      const i = order[next++];
      inFlight++;
      fetch(src(i), { signal: ctrl.signal, priority: next < 12 ? 'high' : 'low' })
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.blob();
        })
        .then((blob) => {
          blobs[i] = blob;
          loaded++;
          clearTimeout(watchdog);
          watchdog = setTimeout(() => ctrl.abort(), 20000);
          onProgress?.(loaded / count);
          if (Math.abs(i - target) <= RADIUS + 1 || !ready) decode(i);
        })
        .catch(() => {
          failed++;
          if (!ready && (failed > 3 || ctrl.signal.aborted)) onFail?.();
        })
        .finally(() => {
          inFlight--;
          if (loaded + failed === order.length) clearTimeout(watchdog);
          if (!disposed && !ctrl.signal.aborted) pump();
        });
    }
  };
  pump();

  return {
    get count() {
      return count;
    },
    // p is 0..1 through the film
    render(p) {
      target = Math.max(0, Math.min(count - 1, p * (count - 1)));
      keepWindow();
      draw();
    },
    dispose() {
      disposed = true;
      ctrl.abort();
      clearTimeout(watchdog);
      ro.disconnect();
      for (const bmp of bitmaps.values()) bmp.close();
      bitmaps.clear();
    },
  };
}
