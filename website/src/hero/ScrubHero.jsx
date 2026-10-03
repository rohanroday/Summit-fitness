import { useEffect, useRef } from 'react';
import { heroBands, staticHero, waLink } from '../content.js';
import { SplitText } from '../lib/split.jsx';
import { useHeroMode, usePrefersReducedMotion } from '../lib/useHeroMode.js';
import { bus, onIntroDone } from '../lib/bus.js';
import { createFrameSequence } from './frameSequence.js';
import { createSpeedMap } from './speedMap.js';

// Every frame of the master cut, 1600px WebP. Phones get the looping clip instead (StaticHero).
const FRAMES = { count: 264, dir: 'hero-frames', poster: '/assets/hero-poster.jpg', focusY: 0.4, vh: 1150 };
const POSTER_URL = '/assets/hero-poster.jpg';
const TAIL_VH = 100; // then the next section slides up over the resting final frame

// Still frames that carry the journey if the film never arrives.
const FALLBACK_STILLS = [
  [0, POSTER_URL],
  [0.17, '/assets/valley.webp'],
  [0.59, '/assets/gym-rows.webp'],
  [0.86, '/assets/hero-ending.webp'],
];

const TRIAL_TEXT = "Hi Summit Fitness! I'd like to book a free trial session.";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (p, e0, e1) => {
  const t = clamp((p - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

function BandContent({ band }) {
  const { fx, title, sub, kicker, byline } = band;

  if (fx === 'rise') {
    return (
      <>
        <div className="settle-col">
          <h1 className="settle-title">
            <SplitText text={title} order="word" spread={0.4} />
          </h1>
          <p className="settle-by mono">{byline}</p>
          <p className="settle-sub">{sub}</p>
          <p className="settle-meta mono">HIMALAYA ROADIES S4 WINNER · SINGTAM</p>
          <div className="settle-cta">
            <a className="btn btn-gold" href="#trial">Book a free trial</a>
            <a className="btn btn-ghost" href="#naseeb">Meet Naseeb</a>
          </div>
        </div>
      </>
    );
  }

  const heading =
    fx === 'blur' ? (
      <span className="blur-stack">
        <span className="soft" aria-hidden="true">{title}</span>
        <span className="sharp">{title}</span>
      </span>
    ) : fx === 'drift' || fx === 'punch' ? (
      <SplitText text={title} order="word" spread={0.45} emphasis={fx === 'punch' ? [2] : [1, 3]} />
    ) : (
      <SplitText text={title} order={fx === 'snap' ? 'reading' : 'random'} spread={0.5} jitter={fx === 'snap' ? 70 : 60} />
    );

  return (
    <div className="band-inner">
      {kicker && <p className="band-kicker mono">{kicker}</p>}
      <h2 className="band-title">{heading}</h2>
      {sub && <p className="band-sub">{sub}</p>}
    </div>
  );
}

function ScrubStage() {
  const set = FRAMES;
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const posterRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const posterLayer = posterRef.current;
    const ring = ringRef.current;
    const bands = [...section.querySelectorAll('.band')].map((el, i) => ({
      el,
      // authored in film fractions; converted to scroll progress once the speed map loads
      fa: heroBands[i].range[0],
      fb: heroBands[i].range[1],
      a: heroBands[i].range[0],
      b: heroBands[i].range[1],
      first: i === 0,
      last: i === heroBands.length - 1,
      lastOpacity: -1,
      lastK: -1,
      lastActive: null,
    }));

    const speed = createSpeedMap();
    const remapBands = () => {
      for (const band of bands) {
        band.a = band.first ? 0 : speed.toProgress(band.fa);
        band.b = band.last ? 1 : speed.toProgress(band.fb);
      }
    };
    bus.toFilm = (p) => speed.toFilm(p);

    let disposed = false;
    let videoReady = false;
    let videoFailed = false;
    let heroOnScreen = true;
    let target = 0;
    let shown = 0;
    let rafId = null;
    let lastTick = 0;
    let loadK = 0;
    let loadStart = Infinity; // band one assembles once the intro curtain opens
    let lastStill = '';
    let lastEnd = null;

    let vh = window.innerHeight;
    const onResize = () => {
      vh = window.innerHeight;
      onScroll();
    };
    // Progress runs over the film only; the 100vh tail after it holds the final frame.
    const heroProgress = () => {
      const rect = section.getBoundingClientRect();
      const range = section.offsetHeight - 2 * vh;
      return clamp(-rect.top / range, 0, 1);
    };

    // Bands: opacity eased at the edges, --k assembly progress. Delta-gated writes only.
    const updateBands = (p) => {
      for (const band of bands) {
        const { a, b } = band;
        const f = Math.min(0.02, (b - a) / 3);
        const fadeIn = band.first ? 1 : smoothstep(p, a, a + f);
        const fadeOut = band.last ? 1 : 1 - smoothstep(p, b - f, b);
        const opacity = fadeIn * fadeOut;
        const ramp = band.last ? Math.min(0.095, (b - a) * 0.55) : Math.min(0.025, (b - a) * 0.35);
        let k = clamp((p - a) / ramp, 0, 1);
        if (band.first) k = Math.max(k, loadK);

        const o = Math.round(opacity * 1000) / 1000;
        if (o !== band.lastOpacity) {
          band.el.style.opacity = o;
          band.lastOpacity = o;
        }
        if (Math.abs(k - band.lastK) > 0.008 || (k === 1 && band.lastK !== 1) || (k === 0 && band.lastK !== 0)) {
          band.el.style.setProperty('--k', k.toFixed(3));
          band.lastK = k;
        }
        const active = o > 0.5;
        if (active !== band.lastActive) {
          band.el.classList.toggle('is-active', active);
          band.lastActive = active;
        }
      }
      const film = speed.toFilm(p);
      const end = film > 0.86;
      if (end !== lastEnd) {
        stage.classList.toggle('is-end', end);
        lastEnd = end;
      }
      if (!videoReady) {
        let still = FALLBACK_STILLS[0][1];
        for (const [at, src] of FALLBACK_STILLS) if (film >= at) still = src;
        if (videoFailed && still !== lastStill) {
          posterLayer.style.backgroundImage = `url('${still}')`;
          lastStill = still;
        }
      }
    };

    // The rAF loop: lerp the displayed progress, rest when converged.
    const tick = (now) => {
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;
      // Lenis already eases the scroll and frames paint instantly, so this is only a light
      // extra glide; it also keeps the caption entrances from snapping on a hard flick.
      const k = 0.3;
      shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
      if (loadK < 1) loadK = clamp((now - loadStart) / 1100, 0, 1);
      const settled = Math.abs(target - shown) < 0.0004 && loadK >= 1;
      if (settled) shown = target;
      if (videoReady) seq.render(speed.toFilm(shown));
      updateBands(shown);
      if (settled || !heroOnScreen) {
        rafId = null;
        lastTick = 0;
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };
    const wake = () => {
      if (rafId === null && heroOnScreen && !disposed) rafId = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = heroProgress();
      wake();
    };

    const offIntro = onIntroDone(() => {
      loadStart = performance.now();
      wake();
    });

    const io = new IntersectionObserver(([entry]) => {
      heroOnScreen = entry.isIntersecting;
      if (heroOnScreen) onScroll();
    });
    io.observe(section);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Loading: the poster paints first; then the frames stream in coarse to fine behind an
    // honest progress ring. If they never arrive, still images carry the journey.
    let seq = null;
    const failVideo = () => {
      if (disposed || videoFailed) return;
      videoFailed = true;
      stage.classList.add('video-failed');
      lastStill = '';
      updateBands(shown);
    };
    let lastRing = 0;
    const startFrames = () => {
      if (seq || disposed) return;
      seq = createFrameSequence({
        canvas,
        count: set.count,
        src: (i) => `/assets/${set.dir}/f${String(i + 1).padStart(3, '0')}.webp`,
        focusY: set.focusY,
        onProgress: (frac) => {
          const now = performance.now();
          if (now - lastRing > 100 || frac === 1) {
            lastRing = now;
            ring.style.setProperty('--ld', Math.round(126 * (1 - frac)));
          }
        },
        onReady: () => {
          if (disposed) return;
          videoReady = true;
          seq.render(speed.toFilm(shown));
          stage.classList.add('video-ready');
        },
        onFail: failVideo,
      });
    };
    // every caption keeps at least 16% of the scroll, however still its footage is
    const holds = heroBands.map((b) => [b.range[0], b.range[1], 0.16]);
    speed.load('/assets/hero-frames/motion.json', holds).then(() => {
      if (disposed) return;
      remapBands();
      lastTick = 0;
      bands.forEach((b) => (b.lastOpacity = b.lastK = -1));
      onScroll();
      updateBands(shown);
    });
    posterLayer.style.backgroundImage = `url('${set.poster}')`;
    const posterImg = new Image();
    posterImg.onload = startFrames;
    posterImg.onerror = startFrames;
    posterImg.src = set.poster;
    const safety = setTimeout(startFrames, 4000);

    onScroll();

    return () => {
      disposed = true;
      offIntro();
      seq?.dispose();
      bus.toFilm = null;
      clearTimeout(safety);
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [set]);

  return (
    <section id="hero" ref={sectionRef} className="hero hero-scrub" style={{ height: `${set.vh + TAIL_VH}vh` }} data-section="Summit">
      <div className="stage" ref={stageRef}>
        <div className="stage-film">
        <div className="poster" ref={posterRef} />
        <canvas ref={canvasRef} className="hero-video" aria-hidden="true" />
        <div className="scrim" />
        {heroBands.map((band) => (
          <div key={band.id} className={`band band-${band.place} fx-${band.fx}`} data-band={band.id}>
            <BandContent band={band} />
          </div>
        ))}
        <div className="scroll-cue" aria-hidden="true">
          <svg className="ring" viewBox="0 0 48 48" ref={ringRef}>
            <circle cx="24" cy="24" r="20" className="ring-track" />
            <circle cx="24" cy="24" r="20" className="ring-fill" />
          </svg>
          <svg className="chevron" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span className="mono">SCROLL TO DESCEND</span>
        </div>
        </div>
        <div className="stage-dim" />
      </div>
    </section>
  );
}

function StaticHero() {
  const reduced = usePrefersReducedMotion();
  // Landscape tablets and reduced-motion laptops: the wide thumbs-up loop, full-bleed.
  // Phones and portrait screens: the whole journey UNCROPPED in a cinematic card, with the
  // copy below. (Cropping 16:9 footage to a tall screen left too few pixels: it looked soft.)
  const wide = window.matchMedia('(min-aspect-ratio: 1/1)').matches;
  const copy = (
    <>
      <p className="band-kicker mono">{staticHero.kicker}</p>
      <h1 className="static-title">
        {staticHero.title}
        <span className="static-by mono">{staticHero.byline}</span>
      </h1>
      <p className="static-sub">{staticHero.sub}</p>
      <div className="settle-cta">
        <a className="btn btn-gold" href="#trial">Book a free trial</a>
        <a className="btn btn-ghost" href={waLink(TRIAL_TEXT)} target="_blank" rel="noreferrer">WhatsApp us</a>
      </div>
    </>
  );

  if (!wide) {
    return (
      <section id="hero" className="hero hero-static hero-card" data-section="Summit">
        <div className="card-glow" aria-hidden="true" />
        <figure className="card-film">
          {reduced ? (
            <img src="/assets/hero-ending.jpg" alt="" aria-hidden="true" />
          ) : (
            <video src="/assets/hero-card.mp4" poster="/assets/hero-card-poster.jpg" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
          )}
          <figcaption className="card-tag mono">SUMMIT · VALLEY · GYM</figcaption>
        </figure>
        <div className="card-copy">{copy}</div>
      </section>
    );
  }

  return (
    <section id="hero" className="hero hero-static" data-section="Summit">
      {reduced ? (
        <div className="static-media" style={{ backgroundImage: "url('/assets/hero-ending.jpg')" }} />
      ) : (
        <video className="static-media" src="/assets/hero-wide-loop.mp4" poster="/assets/hero-ending.jpg" autoPlay muted loop playsInline aria-hidden="true" />
      )}
      <div className="static-scrim" />
      <div className="static-copy">{copy}</div>
    </section>
  );
}

export default function Hero() {
  const mode = useHeroMode();
  return mode === 'scrub' ? <ScrubStage /> : <StaticHero />;
}
