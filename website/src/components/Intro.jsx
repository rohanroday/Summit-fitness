import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Logo } from './Chrome.jsx';
import { bus, finishIntro, prefersReduced } from '../lib/bus.js';

// One splash, one motion. On a cream screen the gold mountain draws itself and fills,
// SUMMIT and FITNESS rise beside it, "by Naseeb" is signed underneath, then everything
// lifts and fades in place while the cream dissolves into the page. No curtain, no
// second logo. Click to skip; skipped for reduced motion or when reopened mid-scroll.
export default function Intro() {
  const [show] = useState(() => !prefersReduced() && window.scrollY < 40);
  const [gone, setGone] = useState(!show);
  const root = useRef(null);
  const lock = useRef(null);
  const skip = useRef(() => {});

  // Layout effect: GSAP owns every starting state before the first paint.
  useLayoutEffect(() => {
    if (!show) {
      finishIntro();
      return;
    }
    const html = document.documentElement;
    html.classList.add('is-intro');
    const el = root.current;
    const lockup = lock.current;
    const target = document.querySelector('.nav-brand .logo');
    const paths = lockup.querySelectorAll('svg path');
    const sign = el.querySelector('.intro-sign text');

    // The lockup is the navbar's <Logo>, positioned from the navbar logo's box and scaled up
    // into the centre of the screen.
    const place = () => {
      const t = target.getBoundingClientRect();
      gsap.set(lockup, { left: t.left, top: t.top }); // same <Logo>, same natural size as the navbar's
      const S = Math.min(3.2, (window.innerWidth * 0.7) / t.width);
      // the signature sits just under the scaled-up lockup, whatever the screen size
      // (on phones the FITNESS line hangs below the logo, so leave room for it too)
      const hang = getComputedStyle(lockup.querySelector('.logo-sub')).position === 'absolute' ? lockup.querySelector('.logo-sub').offsetHeight + 4 : 0;
      el.querySelector('.intro-sign').style.top = `${window.innerHeight * 0.44 + ((t.height + hang * 2) * S) / 2 - 2}px`;
      return {
        x: window.innerWidth / 2 - (t.left + t.width / 2),
        y: window.innerHeight * 0.44 - (t.top + t.height / 2),
        scale: S,
      };
    };
    gsap.set(lockup, { ...place(), transformOrigin: '50% 50%' });
    gsap.set(paths, { strokeDasharray: 420, strokeDashoffset: 420, fillOpacity: 0 });
    const name = lockup.querySelector('.logo-name');
    const fit = lockup.querySelector('.sub-fit');
    const sub = lockup.querySelector('.sub-by');
    gsap.set([name, fit], { clipPath: 'inset(0% 0% 100% 0%)', y: 6 });
    gsap.set(sub, { opacity: 0 }); // the signature says "by Naseeb" here instead
    gsap.set(sign, { strokeDasharray: 1400, strokeDashoffset: 1400, fillOpacity: 0 });

    let left = false;
    let intro = null;
    const leave = (fast) => {
      if (left) return;
      left = true;
      intro?.kill();
      if (fast) {
        gsap.set([paths, sign], { strokeDashoffset: 0, fillOpacity: 1 });
        gsap.set([name, fit], { clipPath: 'inset(0% 0% 0% 0%)', y: 0 });
      }
      // Finish in place: the lockup and signature lift a little and fade while the cream
      // dissolves into the page. (No flight to the navbar.)
      gsap
        .timeline({
          onComplete: () => {
            html.classList.remove('is-intro');
            setGone(true);
          },
        })
        .to([lockup, el.querySelector('.intro-sign')], { yPercent: -18, opacity: 0, duration: 0.7, ease: 'power3.in', stagger: 0.06 }, 0)
        .to(el.querySelector('.intro-bg'), { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, 0.35)
        .add(() => {
          bus.lenis?.start();
          finishIntro(); // the hero's first caption starts as the page appears
        }, 0.6);
    };
    skip.current = () => leave(true);

    intro = gsap
      .timeline({ delay: 0.15, onComplete: () => leave(false) })
      .to(paths, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut', stagger: 0.06 })
      .to(paths, { fillOpacity: 1, duration: 0.4, ease: 'power1.out' }, 0.55)
      .to([name, fit], { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.14 }, 0.6)
      .to(sign, { strokeDashoffset: 0, duration: 0.95, ease: 'power1.inOut' }, 0.95)
      .to(sign, { fillOpacity: 1, duration: 0.35 }, 1.6)
      .to({}, { duration: 0.35 }); // a short beat to read the full line

    const onResize = () => {
      if (!left) gsap.set(lockup, place());
    };
    window.addEventListener('resize', onResize);
    const lockLenis = setInterval(() => {
      if (bus.lenis) {
        if (!left) bus.lenis.stop();
        clearInterval(lockLenis);
      }
    }, 30);

    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(lockLenis);
      intro?.kill();
    };
  }, [show]);

  if (gone) return null;
  return (
    <div className="intro" ref={root} onClick={() => skip.current()} role="presentation">
      <div className="intro-bg" />
      <div className="intro-lockup" ref={lock} aria-label="Summit Fitness by Naseeb">
        <Logo />
      </div>
      <svg className="intro-sign" viewBox="70 22 380 108" aria-hidden="true">
        <text x="260" y="98" textAnchor="middle">by Naseeb</text>
      </svg>
    </div>
  );
}
