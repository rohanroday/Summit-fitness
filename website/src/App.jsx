import Hero from './hero/ScrubHero.jsx';
import { Nav, AltitudeMeter, WhatsAppFab } from './components/Chrome.jsx';
import Intro from './components/Intro.jsx';
import GoldDust from './gl/GoldDust.jsx';
import { Naseeb, Gym, Marquee, Programs, Membership, Faq, Trial, FindUs, Footer } from './sections/Sections.jsx';
import { useHeroMode } from './lib/useHeroMode.js';
import { useSiteMotion } from './lib/useSiteMotion.js';

export default function App() {
  const heroMode = useHeroMode();
  const navigate = useSiteMotion(heroMode);

  // Hero links (inside the film) glide too.
  const onClickCapture = (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a && !e.defaultPrevented) navigate(e, a.getAttribute('href'));
  };

  return (
    <div className="app" onClickCapture={onClickCapture}>
      <a className="skip" href="#naseeb">Skip the intro</a>
      <Nav />
      <AltitudeMeter />
      <GoldDust />
      <main>
        <Hero />
        <Naseeb />
        <Gym />
        <Marquee />
        <Programs />
        <Membership />
        <Faq />
        <Trial />
        <FindUs />
      </main>
      <Footer />
      <WhatsAppFab />
      <Intro />
    </div>
  );
}
