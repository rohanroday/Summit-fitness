import { useEffect, useMemo, useRef, useState } from 'react';
import {
  naseeb, gym, programs, finder, membership, faq, trial, footer,
  waLink, PHONE_DISPLAY, INSTAGRAM_GYM, INSTAGRAM_NASEEB, YOUTUBE_NASEEB, MAPS_QUERY,
} from '../content.js';
import { Logo } from '../components/Chrome.jsx';
import GalleryGL from '../gl/GalleryGL.jsx';
import MountainGL from '../gl/MountainGL.jsx';
import DumbbellGL from '../gl/DumbbellGL.jsx';

const inr = (n) => '₹' + n.toLocaleString('en-IN');

function SectionHead({ kicker, title, lead, align = 'left' }) {
  return (
    <div className={`section-head align-${align}`}>
      <p className="kicker mono" data-reveal>{kicker}</p>
      <h2 className="section-title" data-split-reveal>
        {title.split(' ').map((w, i) => (
          <span className="sw" key={i}>
            <span>{w}</span>
          </span>
        ))}
      </h2>
      {lead && <p className="section-lead" data-reveal>{lead}</p>}
    </div>
  );
}

// A ridge line that draws itself as the section scrolls in.
function Ridge({ className = '' }) {
  return (
    <svg className={`ridge ${className}`} viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
      <path
        data-draw
        d="M0 110 L140 70 L210 92 L330 30 L420 78 L520 52 L600 8 L690 60 L780 40 L880 86 L980 46 L1080 80 L1200 58"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Naseeb() {
  // The timeline track runs exactly from the first dot's centre to the last dot's centre.
  const tlRef = useRef(null);
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    const size = () => {
      const items = tl.querySelectorAll('li');
      tl.style.setProperty('--tl-h', `${items[items.length - 1].offsetTop - items[0].offsetTop}px`);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(tl);
    return () => ro.disconnect();
  }, []);

  return (
    <section id="naseeb" className="section naseeb" data-section="The coach">
      <div className="wrap naseeb-grid">
        <div className="naseeb-media" data-naseeb-media>
          <div className="portrait-frame">
            <div className="portrait-card" />
            <span className="portrait-glow" aria-hidden="true" />
            <div className="portrait-cast-wrap">
              <img
                className="portrait-cast"
                src="/assets/naseeb-cartoon.webp"
                alt="Cartoon of Naseeb Tamang standing with his arms crossed"
                loading="lazy"
                width="388"
                height="1000"
              />
            </div>
            <span className="portrait-tag mono" aria-label="Naseeb Tamang, Roadies Season 4 winner">
              {['NASEEB TAMANG', 'ROADIES S4 WINNER'].map((line, li) => (
                <span className="tag-line" key={li} aria-hidden="true">
                  {line.split('').map((ch, i) => (
                    <span className="ch" key={i}>{ch}</span>
                  ))}
                </span>
              ))}
            </span>
          </div>
          <div className="portrait-inset">
            <img src="/assets/naseeb-real.webp" alt="Naseeb Tamang flexing in a dark gym" loading="lazy" width="447" height="447" />
            <span className="mono">THE REAL THING</span>
          </div>
        </div>
        <div className="naseeb-copy" data-naseeb-copy>
          <SectionHead kicker={naseeb.kicker} title={naseeb.title} lead={naseeb.lead} />
          {naseeb.body.map((p, i) => (
            <p className="body" key={i} data-reveal>{p}</p>
          ))}
          <div className="stats">
            {naseeb.stats.map((s) => (
              <div className="stat" key={s.label} data-reveal>
                <span className="stat-num">
                  {s.prefix}
                  <span data-count={s.value} data-decimals={s.decimals || 0}>
                    {s.value.toFixed(s.decimals || 0)}
                  </span>
                  {s.suffix}
                </span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="timeline" ref={tlRef}>
            <span className="timeline-track" aria-hidden="true">
              <i className="timeline-fill" />
            </span>
            <ol>
            {naseeb.timeline.map((t) => (
              <li key={t.tag} data-reveal>
                <span className="mono">{t.tag}</span>
                <p>{t.text}</p>
              </li>
            ))}
            </ol>
          </div>
          <div className="naseeb-links" data-reveal>
            <a href={INSTAGRAM_NASEEB} target="_blank" rel="noreferrer" className="link-arrow">Follow on Instagram</a>
            <a href={YOUTUBE_NASEEB} target="_blank" rel="noreferrer" className="link-arrow">Watch on YouTube</a>
          </div>
        </div>
      </div>
      <Ridge />
    </section>
  );
}

export function Gym() {
  const gridRef = useRef(null);
  return (
    <section id="gym" className="section gym" data-section="The gym">
      <div className="wrap">
        <SectionHead kicker={gym.kicker} title={gym.title} lead={gym.lead} />
      </div>
      <div className="wrap gym-wrap" ref={gridRef}>
        <GalleryGL hostRef={gridRef} />
        <div className="gym-track">
          {gym.shots.map((s, i) => (
            <figure className={`gym-card${i === 0 ? ' is-hero' : ''}`} key={s.src} data-reveal style={{ '--i': i }}>
              <div className="gym-img">
                <img src={s.src} alt={s.label} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
              </div>
              <figcaption>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <strong>{s.label}</strong>
                <em>{s.note}</em>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const line = 'Rise higher · Live stronger · Every summit starts on the floor · ';
  return (
    <div className="marquee" aria-hidden="true">
      {[0, 1].map((r) => (
        <div className={`marquee-row${r ? ' is-outline' : ''}`} data-marquee key={r}>
          <div className="marquee-inner">
            <span>{line.repeat(3)}</span>
            <span>{line.repeat(3)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TiltCard({ children, className = '', ...rest }) {
  const ref = useRef(null);
  const raf = useRef(null);
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      el.style.setProperty('--rx', `${((0.5 - y) * 7).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((x - 0.5) * 9).toFixed(2)}deg`);
    });
  };
  const onLeave = () => {
    const el = ref.current;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return (
    <div ref={ref} className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave} {...rest}>
      {children}
    </div>
  );
}

export function Programs() {
  return (
    <section id="programs" className="section programs" data-section="Programs">
      <div className="wrap">
        <div className="programs-head">
          <SectionHead kicker={programs.kicker} title={programs.title} />
          <div className="dumbbell-wrap">
            <DumbbellGL />
            <span className="dumbbell-hint mono" aria-hidden="true">DRAG TO SPIN</span>
          </div>
        </div>
        <div className="program-grid" data-flip-group>
          {programs.items.map((p, i) => (
            <TiltCard className="program-card" key={p.id} style={{ '--i': i }}>
              <span className="program-num mono">{String(i + 1).padStart(2, '0')}</span>
              <svg className="program-peak" viewBox="0 0 60 30" aria-hidden="true">
                <path d={`M0 30 L${18 + i * 6} ${14 - i * 3} L${30 + i * 2} ${20 - i * 2} L${42 + i} ${6 - i} L60 30`} />
              </svg>
              <h3>{p.name}</h3>
              <p>{p.line}</p>
              <span className="program-tag mono">{p.tag}</span>
            </TiltCard>
          ))}
        </div>
        <Finder />
      </div>
    </section>
  );
}

function Finder() {
  const [goal, setGoal] = useState(null);
  const [level, setLevel] = useState(null);
  const result = useMemo(() => (goal && level ? finder.pick(goal, level) : null), [goal, level]);
  const program = result && programs.items.find((p) => p.id === result.program);
  const goalLabel = goal && finder.goals.find((g) => g.id === goal).label;

  return (
    <div className="finder" data-reveal>
      <div className="finder-ask">
        <p className="kicker mono">{finder.kicker}</p>
        <h3 className="finder-title">{finder.title}</h3>
        <p className="finder-step mono">1 · YOUR GOAL</p>
        <div className="chips" role="group" aria-label="Your goal">
          {finder.goals.map((g) => (
            <button key={g.id} className={`chip${goal === g.id ? ' is-on' : ''}`} aria-pressed={goal === g.id} onClick={() => setGoal(g.id)}>
              {g.label}
            </button>
          ))}
        </div>
        <p className="finder-step mono">2 · YOUR EXPERIENCE</p>
        <div className="chips" role="group" aria-label="Your experience">
          {finder.levels.map((l) => (
            <button key={l.id} className={`chip${level === l.id ? ' is-on' : ''}`} aria-pressed={level === l.id} onClick={() => setLevel(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`finder-result${program ? ' has-result' : ''}`} aria-live="polite">
        {program ? (
          <div className="finder-card" key={`${goal}-${level}`}>
            <span className="mono">YOUR CLIMB</span>
            <h4>{program.name}</h4>
            <p>{result.plan}</p>
            <a
              className="btn btn-gold"
              href={waLink(`Hi Summit Fitness! I want to ${goalLabel.toLowerCase()} and I'm interested in ${program.name}. Can I book a free trial?`)}
              target="_blank"
              rel="noreferrer"
            >
              Book a trial for this
            </a>
          </div>
        ) : (
          <div className="finder-empty">
            <svg viewBox="0 0 120 70" aria-hidden="true">
              <path d="M2 68 60 4l58 64" />
              <path d="M30 68 60 36l30 32" />
            </svg>
            <p>Pick a goal and a level. Your plan shows up here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Membership() {
  return (
    <section id="membership" className="section membership" data-section="Membership">
      <div className="wrap">
        <SectionHead kicker={membership.kicker} title={membership.title} lead={membership.note} />
        <div className="plans" data-flip-group>
          {membership.plans.map((p, i) => (
            <div className={`plan${p.best ? ' is-best' : ''}`} key={p.name} style={{ '--i': i }}>
              {p.best && <span className="plan-badge mono">BEST VALUE</span>}
              <h3>{p.name}</h3>
              <p className="plan-price">
                {inr(p.price)}
                <span>{p.per}</span>
              </p>
              <p className="plan-extra">{p.extra}</p>
              <a
                className={`btn ${p.best ? 'btn-gold' : 'btn-ghost'}`}
                href={waLink(`Hi Summit Fitness! I'm interested in the ${p.name} membership (${inr(p.price)}). Can you tell me how to join?`)}
                target="_blank"
                rel="noreferrer"
              >
                Join {p.name}
              </a>
            </div>
          ))}
        </div>
        <div className="hours" data-reveal>
          <div>
            <span className="mono">OPEN EVERY DAY</span>
            <strong>5:30 AM to 10:00 PM</strong>
          </div>
          <div>
            <span className="mono">FIND US</span>
            <strong>{footer.address}</strong>
          </div>
          <div>
            <span className="mono">CALL OR WHATSAPP</span>
            <strong>
              <a href={`tel:+${PHONE_DISPLAY.replace(/\D/g, '')}`}>{PHONE_DISPLAY}</a>
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section faq" data-section="Questions">
      <div className="wrap faq-grid">
        <SectionHead kicker={faq.kicker} title={faq.title} />
        <div className="faq-list">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className={`faq-item${isOpen ? ' is-open' : ''}`} key={item.q} data-reveal>
                <h3>
                  <button aria-expanded={isOpen} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                    <span>{item.q}</span>
                    <span className="faq-plus" aria-hidden="true" />
                  </button>
                </h3>
                <div className="faq-a" id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                  <div>
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Trial() {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(trial.goals[0]);
  const [time, setTime] = useState(trial.times[0]);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please add your name so we know who to expect.');
      return;
    }
    setError('');
    const lines = [
      `Hi Summit Fitness! I'd like to book a free trial session.`,
      `Name: ${name.trim()}`,
      `Goal: ${goal}`,
      `Best time: ${time}`,
      note.trim() ? `Note: ${note.trim()}` : null,
    ].filter(Boolean);
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
    setSent(true);
  };

  return (
    <section id="trial" className="section trial" data-section="Free trial">
      <div className="trial-bg" style={{ backgroundImage: "url('/assets/hero-ending.webp')" }} aria-hidden="true" />
      <div className="wrap trial-grid">
        <div>
          <SectionHead kicker={trial.kicker} title={trial.title} lead={trial.lead} />
          <ul className="trial-points" data-reveal>
            <li>Tour the floor with the team</li>
            <li>One full coached session</li>
            <li>No payment, no pressure</li>
          </ul>
          <div className="trial-buddy" aria-hidden="true">
            <p className={`bubble${sent ? ' is-sent' : ''}`} key={sent ? 'sent' : 'idle'} data-pop>
              {sent ? trial.bubbleSent : trial.bubble}
            </p>
            <img src="/assets/naseeb-thumbs.webp" alt="" loading="lazy" width="537" height="820" />
          </div>
        </div>
        <form className="trial-form" onSubmit={submit} noValidate data-reveal>
          {sent ? (
            <div className="trial-success" role="status">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <circle cx="24" cy="24" r="21" />
                <path d="M15 25l6 6 12-13" />
              </svg>
              <p>{trial.success}</p>
              <button type="button" className="link-arrow" onClick={() => setSent(false)}>Edit my details</button>
            </div>
          ) : (
            <>
              <label className="field">
                <span className="mono">YOUR NAME</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pema Sherpa" autoComplete="name" aria-invalid={!!error} />
              </label>
              {error && <p className="field-error" role="alert">{error}</p>}
              <fieldset className="field">
                <legend className="mono">YOUR GOAL</legend>
                <div className="chips">
                  {trial.goals.map((g) => (
                    <button type="button" key={g} className={`chip${goal === g ? ' is-on' : ''}`} aria-pressed={goal === g} onClick={() => setGoal(g)}>
                      {g}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="field">
                <legend className="mono">BEST TIME FOR YOU</legend>
                <div className="chips">
                  {trial.times.map((t) => (
                    <button type="button" key={t} className={`chip${time === t ? ' is-on' : ''}`} aria-pressed={time === t} onClick={() => setTime(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="field">
                <span className="mono">ANYTHING WE SHOULD KNOW? (OPTIONAL)</span>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Injuries, questions, a friend joining you..." />
              </label>
              <button className="btn btn-gold btn-lg" type="submit">
                {trial.button}
              </button>
              <p className="trial-fine">Your message goes straight to Summit Fitness on WhatsApp. Nothing is stored on this site.</p>
            </>
          )}
        </form>
      </div>
    </section>
  );
}

export function FindUs() {
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`;
  return (
    <section id="find-us" className="section find-us" data-section="Find us">
      <div className="wrap find-grid">
        <div className="find-copy">
          <SectionHead kicker="07 · FIND US" title="Come see the floor." lead="Right here in Singtam. Walk in any day, or message us first and we'll have your trial ready." />
          <dl className="find-facts" data-reveal>
            <div>
              <dt className="mono">ADDRESS</dt>
              <dd>{footer.address}</dd>
            </div>
            <div>
              <dt className="mono">OPEN</dt>
              <dd>{footer.hours}</dd>
            </div>
            <div>
              <dt className="mono">CALL OR WHATSAPP</dt>
              <dd>
                <a href={`tel:+${PHONE_DISPLAY.replace(/\D/g, '')}`}>{PHONE_DISPLAY}</a>
              </dd>
            </div>
          </dl>
          <div className="find-cta" data-reveal>
            <a className="btn btn-gold" href={mapsLink} target="_blank" rel="noreferrer">Get directions</a>
            <a className="btn btn-ghost" href={waLink("Hi Summit Fitness! I'm on my way for a visit.")} target="_blank" rel="noreferrer">WhatsApp us</a>
          </div>
        </div>
        <div className="find-map" data-curtain>
          <iframe
            title="Summit Fitness on Google Maps"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&z=15&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer" data-section="Singtam">
      <Ridge className="ridge-footer" />
      <div className="wrap footer-grid">
        <div className="footer-brand">
          {/* phones get the crisp flat logo; the 3D one is a desktop flourish */}
          {window.matchMedia('(min-width: 768px)').matches && <MountainGL mode="footer" className="footer-gl" />}
          <Logo size={64} />
          <p className="footer-tag">Elevate your limits.</p>
        </div>
        <div>
          <span className="mono">VISIT</span>
          <p>{footer.address}</p>
          <p>{footer.hours}</p>
          <a className="link-arrow" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`} target="_blank" rel="noreferrer">
            Open in Google Maps
          </a>
        </div>
        <div>
          <span className="mono">CONTACT</span>
          <p>
            <a href={waLink('Hi Summit Fitness!')} target="_blank" rel="noreferrer">WhatsApp {PHONE_DISPLAY}</a>
          </p>
          <p>
            <a href={INSTAGRAM_GYM} target="_blank" rel="noreferrer">@summit_fitness_naseeb</a>
          </p>
          <p>
            <a href={INSTAGRAM_NASEEB} target="_blank" rel="noreferrer">@naseebtamangofficial</a>
          </p>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>© 2026 Summit Fitness by Naseeb · Singtam, Sikkim</span>
        <span>{footer.disclosure}</span>
      </div>
    </footer>
  );
}
