import { useEffect, useRef, useState } from 'react';
import { nav, waLink } from '../content.js';
import { bus, heroBounds } from '../lib/bus.js';

export function Logo({ size = 40, wordmark = true }) {
  return (
    <span className="logo">
      <svg width={size} height={size * 0.56} viewBox="0 0 120 67" aria-hidden="true">
        <defs>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7d98b" />
            <stop offset="0.5" stopColor="#d9a441" />
            <stop offset="1" stopColor="#8f5f1f" />
          </linearGradient>
        </defs>
        <path d="M2 64 60 3l58 61h-13L60 17 15 64z" fill="url(#gold)" />
        <path d="M18 64 37 43l7 7-4 2 9-6-6 18zM102 64 83 43l-7 7 4 2-9-6 6 18z" fill="url(#gold)" opacity=".85" />
        <path d="M40 64 60 41l20 23h-9L60 52 49 64z" fill="url(#gold)" />
        <path d="M60 17 52 30l6-2-5 10 9-13-6 2z" fill="#0e0f12" opacity=".55" />
      </svg>
      {wordmark && (
        <span className="logo-words">
          <span className="logo-name">SUMMIT</span>
          <span className="logo-sub mono">
            <span className="sub-fit">FITNESS</span>
            <span className="sub-by"> · BY NASEEB</span>
          </span>
        </span>
      )}
    </span>
  );
}

const WA_ICON = (
  <svg viewBox="0 0 32 32" aria-hidden="true" className="wa-ico">
    <path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm5.9 15.7c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5.9-1.7a.6.6 0 0 0 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.8.9 3.8.8a3.3 3.3 0 0 0 2.1-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.4z" />
  </svg>
);

// The navbar has three moods:
//   over the film: transparent, letting the footage breathe
//   on the page: a floating glass capsule with a gold progress line
//   scrolling down: tucks away; any scroll up brings it straight back
// A gold pill slides under whichever section is on screen.
export function Nav() {
  const [mode, setMode] = useState('film'); // 'film' | 'float'
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const linksRef = useRef(null);
  const pillRef = useRef(null);
  const progRef = useRef(null);

  // Mood, hide-on-scroll-down and progress, all from one scroll handler.
  useEffect(() => {
    let lastY = window.scrollY;
    let last = { mode: '', hidden: null, prog: -1 };
    let raf = null;
    const update = () => {
      raf = null;
      const y = window.scrollY;
      const { exit, scrub } = heroBounds();
      const m = y > (scrub ? exit - 10 : 40) ? 'float' : 'film';
      const dy = y - lastY;
      let h = last.hidden ?? false;
      if (y < 120) h = false;
      else if (dy > 6) h = true;
      else if (dy < -6) h = false;
      lastY = y;
      if (m !== last.mode) setMode((last.mode = m));
      if (h !== last.hidden) setHidden((last.hidden = h));
      const doc = document.documentElement;
      const p = Math.round((y / Math.max(1, doc.scrollHeight - window.innerHeight)) * 500) / 500;
      if (p !== last.prog && progRef.current) {
        progRef.current.style.transform = `scaleX(${p})`;
        last.prog = p;
      }
    };
    const on = () => {
      if (raf === null) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Which section is on screen.
  useEffect(() => {
    const targets = nav.map((n) => document.querySelector(n.href)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive('#' + e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    targets.forEach((t) => io.observe(t));
    const hero = document.getElementById('hero');
    const heroIo = new IntersectionObserver(([e]) => e.isIntersecting && setActive(''), { rootMargin: '-45% 0px -50% 0px' });
    if (hero) heroIo.observe(hero);
    return () => {
      io.disconnect();
      heroIo.disconnect();
    };
  }, []);

  // Slide the gold pill under the active link.
  useEffect(() => {
    const pill = pillRef.current;
    const wrap = linksRef.current;
    if (!pill || !wrap) return;
    const place = () => {
      const a = active && wrap.querySelector(`a[href="${active}"]`);
      if (!a) {
        pill.style.opacity = '0';
        return;
      }
      pill.style.opacity = '1';
      pill.style.width = `${a.offsetWidth}px`;
      pill.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    place();
    window.addEventListener('resize', place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener('resize', place);
  }, [active, mode]);

  // Phone menu: lock the page and close on Escape.
  useEffect(() => {
    if (!open) return;
    bus.lenis?.stop();
    document.documentElement.classList.add('menu-open');
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => {
      bus.lenis?.start();
      document.documentElement.classList.remove('menu-open');
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  // Smooth anchor scrolling is handled once at the app level.
  const close = () => setOpen(false);
  const cls = ['nav', `is-${mode}`, hidden && !open ? 'is-hidden' : '', open ? 'is-open' : ''].filter(Boolean).join(' ');

  return (
    <header className={cls}>
      <div className="nav-shell">
        <a href="#hero" className="nav-brand" onClick={close} aria-label="Summit Fitness home">
          <Logo />
        </a>
        <nav className="nav-links" aria-label="Main" ref={linksRef}>
          <span className="nav-pill" ref={pillRef} aria-hidden="true" />
          {nav.map((item) => (
            <a key={item.href} href={item.href} aria-current={active === item.href ? 'true' : undefined}>
              <span className="roll" data-text={item.label}>
                <span>{item.label}</span>
              </span>
            </a>
          ))}
        </nav>
        <a href="#trial" className="btn btn-gold btn-sm nav-cta" onClick={close}>
          {WA_ICON}
          <span>Free trial</span>
        </a>
        <button className="nav-toggle" aria-expanded={open} aria-controls="nav-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
        </button>
        <span className="nav-progress" aria-hidden="true">
          <i ref={progRef} />
        </span>
      </div>

      <div className="nav-menu" id="nav-menu" aria-hidden={!open}>
        <nav aria-label="Menu">
          {nav.map((item, i) => (
            <a key={item.href} href={item.href} onClick={close} style={{ '--i': i }} tabIndex={open ? 0 : -1}>
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="nav-menu-foot" style={{ '--i': nav.length }}>
          <p className="mono">OPEN EVERY DAY · 5:30 AM TO 10 PM</p>
          <p className="mono">SINGTAM, SIKKIM</p>
          <a className="btn btn-gold" href={waLink("Hi Summit Fitness! I'd like to book a free trial session.")} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
            {WA_ICON}
            <span>Book a free trial</span>
          </a>
        </div>
      </div>
    </header>
  );
}

// The signature: an altitude readout that descends from Kanchenjunga to the gym floor,
// then becomes the section indicator for the rest of the page.
const ALT_STOPS = [
  [0, 8586],
  [0.09, 8586],
  [0.2, 2600],
  [0.45, 1500],
  [0.58, 1400],
  [1, 1400],
];
function altitudeAt(p) {
  for (let i = 1; i < ALT_STOPS.length; i++) {
    const [p1, a1] = ALT_STOPS[i];
    const [p0, a0] = ALT_STOPS[i - 1];
    if (p <= p1) {
      const t = (p - p0) / (p1 - p0);
      const e = t * t * (3 - 2 * t);
      return a0 + (a1 - a0) * e;
    }
  }
  return 1400;
}

export function AltitudeMeter() {
  const rootRef = useRef(null);
  const valueRef = useRef(null);
  const labelRef = useRef(null);
  const fillRef = useRef(null);

  useEffect(() => {
    let last = { v: '', l: '', f: -1, film: true };
    let lastAt = 0;
    let raf = null;
    let section = 'Summit';

    const sections = [...document.querySelectorAll('[data-section]')];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) section = en.target.dataset.section;
        });
        schedule();
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    sections.forEach((s) => io.observe(s));

    const render = (now) => {
      raf = null;
      const doc = document.documentElement;
      const pageFrac = window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight);
      const { film, exit } = heroBounds();
      let v;
      let l;
      const onFilm = window.scrollY < exit - window.innerHeight * 0.5;
      if (onFilm !== last.film) {
        rootRef.current?.classList.toggle('on-film', onFilm);
        last.film = onFilm;
      }
      if (onFilm) {
        const sp = Math.min(1, Math.max(0, window.scrollY / film));
        const p = bus.toFilm ? bus.toFilm(sp) : sp; // film position, same map as the hero
        const alt = Math.round(altitudeAt(p) / 10) * 10;
        v = `ALT ${alt.toLocaleString('en-IN')} M`;
        l = p > 0.58 ? 'GYM FLOOR · SINGTAM' : p > 0.09 ? 'DESCENDING' : 'THE SUMMIT';
      } else {
        v = 'ALT 1,400 M';
        l = section.toUpperCase();
      }
      if (now - lastAt >= 100 || v.endsWith('1,400 M')) {
        if (v !== last.v) valueRef.current.textContent = last.v = v;
        if (l !== last.l) labelRef.current.textContent = last.l = l;
        lastAt = now;
      }
      const f = Math.round(pageFrac * 400) / 400;
      if (f !== last.f) {
        fillRef.current.style.transform = `scaleY(${f})`;
        last.f = f;
      }
    };
    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(render);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    schedule();
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <aside className="altimeter on-film" ref={rootRef} aria-hidden="true">
      <span className="alt-value mono" ref={valueRef}>ALT 8,586 M</span>
      <span className="alt-track">
        <span className="alt-fill" ref={fillRef} />
      </span>
      <span className="alt-label mono" ref={labelRef}>THE SUMMIT</span>
    </aside>
  );
}

export function WhatsAppFab() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let last = null;
    // Hidden during the hero, so it never sits on the hero's own buttons.
    const on = () => {
      const hero = document.getElementById('hero');
      const s = !hero || window.scrollY > hero.offsetHeight - window.innerHeight * 0.6;
      if (s !== last) {
        last = s;
        setShown(s);
      }
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return (
    <a
      className={`wa-fab${shown ? '' : ' is-hidden'}`}
      href={waLink("Hi Summit Fitness! I'd like to know more about joining.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Naseeb on WhatsApp"
    >
      <img className="wa-avatar" src="/assets/naseeb-avatar.webp" alt="" width="96" height="96" />
      <span className="wa-badge" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm5.9 15.7c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5.9-1.7a.6.6 0 0 0 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.8.9 3.8.8a3.3 3.3 0 0 0 2.1-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.4z" />
        </svg>
      </span>
      <span className="wa-tip">Chat with Naseeb</span>
    </a>
  );
}
