// Scroll position -> film position, so the camera seems to move at an even pace.
// The cartoon footage is very uneven: the summit and the final pose barely move, while the
// swoop over the town into the gym window moves ~20x faster. A plain linear map rushes that
// swoop past in a blur. Here each frame-to-frame step gets scroll distance in proportion to
// a blend of time (holds still moments a little) and measured camera motion (motion.json,
// from ffmpeg). Captions are authored in film fractions and converted with toProgress().

const MOTION_WEIGHT = 0.5; // 0 = plain time, 1 = pure constant visual speed

export function createSpeedMap() {
  let cum = null; // cumulative scroll share at each frame, cum[0] = 0 ... cum[n-1] = 1

  // holds: [[filmStart, filmEnd, minShare], ...] - caption stretches that must keep at least
  // minShare of the scroll even when the footage there barely moves, so text stays readable.
  const build = ({ frames, motion }, holds = []) => {
    const steps = frames - 1;
    const total = motion.reduce((a, b) => a + b, 0) || 1;
    const w = new Float64Array(frames); // w[i]: share of the step from frame i-1 to i
    for (let i = 1; i < frames; i++) w[i] = (1 - MOTION_WEIGHT) / steps + (MOTION_WEIGHT * (motion[i - 1] ?? 0)) / total;
    const inRange = (i, [fa, fb]) => i / steps > fa && i / steps <= fb;
    for (let pass = 0; pass < 4; pass++) {
      const sum = w.reduce((a, b) => a + b, 0);
      for (const h of holds) {
        let share = 0;
        for (let i = 1; i < frames; i++) if (inRange(i, h)) share += w[i];
        share /= sum;
        if (share > 0 && share < h[2]) for (let i = 1; i < frames; i++) if (inRange(i, h)) w[i] *= h[2] / share;
      }
    }
    const c = new Float64Array(frames);
    for (let i = 1; i < frames; i++) c[i] = c[i - 1] + w[i];
    for (let i = 1; i < frames; i++) c[i] /= c[frames - 1];
    cum = c;
  };

  return {
    load(url, holds) {
      return fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((data) => build(data, holds))
        .catch(() => {}); // no profile: stay linear
    },
    get ready() {
      return !!cum;
    },
    // 0..1 scroll progress -> 0..1 film position
    toFilm(p) {
      if (!cum) return p;
      const n = cum.length;
      let lo = 0;
      let hi = n - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] <= p) lo = mid;
        else hi = mid;
      }
      const span = cum[hi] - cum[lo] || 1;
      return (lo + Math.min(1, Math.max(0, (p - cum[lo]) / span))) / (n - 1);
    },
    // 0..1 film position -> 0..1 scroll progress
    toProgress(f) {
      if (!cum) return f;
      const x = Math.min(1, Math.max(0, f)) * (cum.length - 1);
      const i = Math.min(cum.length - 2, Math.floor(x));
      return cum[i] + (cum[i + 1] - cum[i]) * (x - i);
    },
  };
}
