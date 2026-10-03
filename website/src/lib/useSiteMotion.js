import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { bus } from './bus.js';

gsap.registerPlugin(ScrollTrigger);

// Smooth scroll plus every below-the-hero entrance. One clock drives it all: GSAP's ticker
// steps Lenis, Lenis feeds ScrollTrigger and the shared bus that the WebGL layers read.
// With reduced motion nothing runs and every element simply sits in its final state.
export function useSiteMotion(heroMode) {
  const lenisRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onNative = () => {
      bus.y = window.scrollY;
    };
    if (reduced) {
      window.addEventListener('scroll', onNative, { passive: true });
      return () => window.removeEventListener('scroll', onNative);
    }

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    // lerp (not duration) keeps the glide speed constant however hard the wheel is flicked.
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      smoothWheel: true,
      syncTouch: false, // phones keep their own native momentum
    });
    lenisRef.current = lenis;
    bus.lenis = lenis;
    lenis.on('scroll', (e) => {
      bus.y = e.scroll;
      bus.velocity = e.velocity;
      ScrollTrigger.update();
    });
    const raf = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    if (!bus.introDone && document.documentElement.classList.contains('is-intro')) lenis.stop();

    // Entrances always state both ends. A plain gsap.from() reads the element's *current*
    // look as the end state, which breaks when CSS transitions are mid-flight (React dev
    // double-mount, hot reload): cards then animate from tilted to tilted and stay stuck.
    const enter = (targets, from, to, trigger, start = 'top 85%') =>
      gsap.fromTo(targets, { ...from, transition: 'none' }, {
        ...to,
        clearProps: 'transform,opacity,transition,clipPath,translate,rotate,scale',
        scrollTrigger: { trigger, start, once: true },
      });

    // Meet Naseeb runs its own directed sequence below, so the generic entrances skip it.
    const notNaseeb = (el) => !el.closest('#naseeb');

    const offs = []; // listeners and ticker callbacks that gsap.context does not own
    const ctx = gsap.context(() => {
      // ---- Hero exit: the coach section slides up over the film like a stacked card.
      const stage = document.querySelector('.hero-scrub .stage-film');
      const dim = document.querySelector('.hero-scrub .stage-dim');
      if (stage && dim) {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: '#naseeb', start: 'top bottom', end: 'top top', scrub: true },
        });
        tl.fromTo(stage, { scale: 1, yPercent: 0 }, { scale: 0.9, yPercent: -6, ease: 'none' }, 0).fromTo(dim, { opacity: 0 }, { opacity: 0.85, ease: 'none' }, 0);
      }


      // ---- Meet Naseeb: one directed sequence instead of many separate fades.
      //  picture side: the card opens, a gold glow blooms, Naseeb rises out of the card
      //  with a small bounce (the hero's arrival motif), his name tag types out, and the
      //  real photo drops in like a polaroid.
      //  story side: kicker, title words, lead, story, numbers, timeline, links, in order.
      const media = document.querySelector('[data-naseeb-media]');
      if (media) {
        const q = (sel) => media.querySelectorAll(sel);
        const done = { clearProps: 'transform,opacity,clipPath,translate,rotate,scale' };
        gsap
          .timeline({ scrollTrigger: { trigger: media, start: 'top 72%', once: true } })
          .fromTo(q('.portrait-card'), { clipPath: 'inset(100% 0% 0% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.1, ease: 'expo.inOut', ...done })
          .fromTo(q('.portrait-glow'), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out', ...done }, 0.45)
          .fromTo(q('.portrait-cast'), { yPercent: 46, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.15, ease: 'back.out(1.5)', ...done }, 0.55)
          .fromTo(q('.portrait-tag .ch'), { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.035, ...done }, 1.25)
          .fromTo(q('.portrait-inset'), { y: -90, rotate: 16, opacity: 0 }, { y: 0, rotate: -4, opacity: 1, duration: 1, ease: 'back.out(1.6)', clearProps: 'transform,opacity,translate,rotate,scale' }, 1.35);

        // Desktop: the card tilts toward the mouse; Naseeb sits forward in 3D, so he moves more.
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          const frame = media.querySelector('.portrait-frame');
          const rx = gsap.quickTo(frame, 'rotateX', { duration: 0.8, ease: 'power3' });
          const ry = gsap.quickTo(frame, 'rotateY', { duration: 0.8, ease: 'power3' });
          const tilt = (e) => {
            const r = media.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 14);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
          };
          const reset = () => {
            rx(0);
            ry(0);
          };
          media.addEventListener('pointermove', tilt);
          media.addEventListener('pointerleave', reset);
          offs.push(() => {
            media.removeEventListener('pointermove', tilt);
            media.removeEventListener('pointerleave', reset);
          });
        }
      }
      const copy = document.querySelector('[data-naseeb-copy]');
      if (copy) {
        const q = (sel) => copy.querySelectorAll(sel);
        const done = { clearProps: 'transform,opacity,translate,rotate,scale' };
        gsap
          .timeline({ scrollTrigger: { trigger: copy, start: 'top 72%', once: true } })
          .fromTo(q('.kicker'), { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', ...done })
          .fromTo(q('.section-title .sw > span'), { yPercent: 110, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, ...done }, 0.1)
          .fromTo(q('.section-lead'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', ...done }, 0.45)
          .fromTo(q('.body'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12, ...done }, 0.6)
          .fromTo(q('.stat'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, ...done }, 0.85)
          .fromTo(q('.timeline li'), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12, ...done }, 1.1)
          .fromTo(q('.naseeb-links'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', ...done }, 1.4);
      }

      // ---- Plain fades rising into place.
      gsap.utils.toArray('[data-reveal]').filter(notNaseeb).forEach((el) => {
        enter(el, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: (Number(getComputedStyle(el).getPropertyValue('--i')) || 0) * 0.08 }, el, 'top 88%');
      });

      // ---- Cards flip up out of the floor, in a stagger.
      gsap.utils.toArray('[data-flip-group]').forEach((group) => {
        enter(
          group.children,
          { rotateX: -28, y: 70, opacity: 0, transformOrigin: '50% 100%' },
          { rotateX: 0, y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09 },
          group,
        );
      });

      // ---- Image curtains: a clip-path wipe with a slow settle of the image inside.
      gsap.utils.toArray('[data-curtain]').forEach((el) => {
        enter(el, { clipPath: 'inset(100% 0% 0% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.4, ease: 'expo.inOut' }, el);
      });

      // ---- Section titles: each word rises out of its own mask.
      gsap.utils.toArray('[data-split-reveal]').filter(notNaseeb).forEach((el) => {
        enter(el.querySelectorAll('.sw > span'), { yPercent: 110, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07 }, el);
      });

      // ---- Naseeb's timeline: a gold fill grows down a dim track as you scroll, and each
      //      milestone's dot lights up the moment the fill reaches it (and dims going back up).
      const tl = document.querySelector('.timeline');
      if (tl) {
        const fill = tl.querySelector('.timeline-fill');
        const items = [...tl.querySelectorAll('li')];
        const first = items[0];
        const last = items[items.length - 1];
        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: first, endTrigger: last, start: 'top 62%', end: 'top 62%', scrub: 0.4 },
          },
        );
        items.forEach((li) => {
          ScrollTrigger.create({
            trigger: li,
            start: 'top 62%', // the same line the fill's tip travels on, so dot and fill meet
            onEnter: () => li.classList.add('is-lit'),
            onLeaveBack: () => li.classList.remove('is-lit'),
          });
        });
      }

      // ---- Lines that draw themselves with scroll.
      gsap.utils.toArray('[data-draw]').forEach((path) => {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: path.closest('section, footer') || path, start: 'top 75%', end: 'bottom 60%', scrub: 0.6 },
        });
      });

      // ---- Count-ups.
      gsap.utils.toArray('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count);
        const dec = Number(el.dataset.decimals) || 0;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end,
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            const s = obj.v.toFixed(dec);
            if (el.textContent !== s) el.textContent = s;
          },
        });
      });

      // ---- Speech bubbles pop in like a cartoon.
      gsap.utils.toArray('[data-pop]').forEach((el) => {
        enter(el, { scale: 0.4, rotate: -8, opacity: 0, transformOrigin: '12% 100%' }, { scale: 1, rotate: 0, opacity: 1, duration: 0.8, ease: 'back.out(2.2)' }, el);
      });

      // ---- Depth: the cartoon drifts faster than his card; the card slower than the page.
      gsap.utils.toArray('[data-pop-parallax]').forEach((el) => {
        gsap.fromTo(el, { yPercent: 6 }, { yPercent: -4, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.utils.toArray('[data-parallax]').forEach((el) => {
        gsap.fromTo(el, { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      // ---- The marquee: drifts with scroll, races and leans with scroll speed.
      gsap.utils.toArray('[data-marquee]').forEach((row, i) => {
        const dir = i % 2 ? 1 : -1;
        const inner = row.querySelector('.marquee-inner');
        let x = 0;
        let skew = 0;
        const half = () => inner.scrollWidth / 2;
        const tick = () => {
          const v = bus.velocity;
          x += dir * (0.6 + Math.min(18, Math.abs(v)) * 0.55);
          const h = half();
          if (h) x = ((x % h) + h) % h - h; // loop seamlessly over one copy
          skew += (Math.max(-12, Math.min(12, v * -0.6)) - skew) * 0.1;
          gsap.set(inner, { x, skewX: skew });
        };
        ScrollTrigger.create({
          trigger: row,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
        });
        offs.push(() => gsap.ticker.remove(tick));
      });

      // ---- Magnetic gold buttons (mouse only).
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('.btn-gold, .nav-cta').forEach((btn) => {
          const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
          const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
          const move = (e) => {
            const r = btn.getBoundingClientRect();
            xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
            yTo((e.clientY - (r.top + r.height / 2)) * 0.36);
          };
          const leave = () => {
            xTo(0);
            yTo(0);
          };
          btn.addEventListener('pointermove', move);
          btn.addEventListener('pointerleave', leave);
          offs.push(() => {
            btn.removeEventListener('pointermove', move);
            btn.removeEventListener('pointerleave', leave);
          });
        });
      }

    });

    // Re-measure once images and fonts settle.
    ScrollTrigger.sort(); // trigger order follows the page, so pin spacing lands before what sits below
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);

    return () => {
      window.removeEventListener('load', refresh);
      offs.forEach((off) => off());
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
      bus.lenis = null;
    };
  }, [heroMode]);

  // Anchor links glide through Lenis when it is running.
  const navigate = (e, href) => {
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: href === '#hero' ? 0 : -10, duration: 1.6 });
    else target.scrollIntoView();
    history.replaceState(null, '', href);
  };

  return navigate;
}
