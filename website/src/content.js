// Every visitor-facing line lives here, so copy changes never touch layout code.
// Lines marked CONFIRM are best guesses from Instagram; check them with Naseeb.

export const WHATSAPP_NUMBER = '916296138079';
export const PHONE_DISPLAY = '+91 62961 38079';
export const INSTAGRAM_GYM = 'https://www.instagram.com/summit_fitness_naseeb/';
export const INSTAGRAM_NASEEB = 'https://www.instagram.com/naseebtamangofficial/';
export const YOUTUBE_NASEEB = 'https://www.youtube.com/channel/UChv0cqrwDpgkAq73D0-Qyeg';
export const MAPS_QUERY = 'Summit Fitness by Naseeb, Singtam, Sikkim';

export const waLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const nav = [
  { href: '#naseeb', label: 'Naseeb' },
  { href: '#gym', label: 'The Gym' },
  { href: '#programs', label: 'Programs' },
  { href: '#membership', label: 'Membership' },
  { href: '#faq', label: 'FAQ' },
];

// Hero bands: [start, end] as FILM position (0..1). The hero converts them to scroll
// progress through its speed map (hero/speedMap.js), so they stay on the same scenes.
// Footage map (cartoon v2, 11.6s): 0 to 0.1 Naseeb on the summit, 0.08 to 0.17 the dive into
// the clouds, 0.17 to 0.23 the Singtam valley, 0.23 to 0.56 the swoop to the gym, 0.56 to 0.59
// light flash, 0.59 to 0.83 inside the gym (slowed), 0.83 to 0.86 light flash, 0.86 to 1 Naseeb.
// Keep captions off the two flashes: they are pure light and no scrim can hold text on them.
export const heroBands = [
  {
    id: 'summit',
    range: [0, 0.12],
    fx: 'blur',
    place: 'left-low',
    kicker: 'ALT 8,586 M · KANCHENJUNGA',
    title: 'Every summit starts on the floor.',
  },
  {
    id: 'dive',
    range: [0.19, 0.32],
    fx: 'drift',
    place: 'center',
    title: 'No shortcuts. No elevators.',
    sub: 'Just you, the bar, and the work.',
  },
  {
    id: 'gym',
    range: [0.36, 0.54],
    fx: 'snap',
    place: 'left',
    kicker: 'SINGTAM · SIKKIM',
    title: 'This is where the work happens.',
  },
  {
    id: 'champion',
    range: [0.6, 0.82],
    fx: 'punch',
    place: 'left',
    kicker: 'HIMALAYA ROADIES · SEASON 4',
    title: 'Built by a champion.',
    sub: 'Naseeb Tamang won it. Now he coaches you.',
  },
  {
    id: 'settle',
    range: [0.88, 1],
    fx: 'rise',
    place: 'split',
    title: 'Summit Fitness',
    byline: 'by Naseeb',
    sub: 'Rise higher. Live stronger.',
  },
];

export const staticHero = {
  kicker: 'HIMALAYA ROADIES S4 WINNER',
  title: 'Summit Fitness',
  byline: 'by Naseeb',
  sub: 'Every summit starts on the floor. Train with Naseeb Tamang in Singtam.',
};

export const naseeb = {
  kicker: '01 · THE COACH',
  title: 'Meet Naseeb.',
  lead: 'Himalaya Roadies Season 4 winner. Entrepreneur. The guy who opens the doors at 5:30 every morning.',
  // CONFIRM: replace with Naseeb's own words when he sends them.
  body: [
    'Roadies tests everything: your body, your head, your patience. Naseeb came out on top by doing the boring things every single day.',
    'Summit Fitness is that same idea with the lights on. A clean, serious gym in Singtam where beginners get coached properly and lifters get room to push.',
  ],
  stats: [
    { value: 4, prefix: 'S', suffix: '', label: 'Himalaya Roadies winner' },
    { value: 29.8, decimals: 1, suffix: 'K', label: 'people follow his journey' },
    { value: 16.5, decimals: 1, suffix: ' hrs', label: 'open every day' },
  ],
  timeline: [
    { tag: 'THE GRIND', text: 'Years of early mornings and heavy sessions, long before anyone was watching.' },
    { tag: 'ROADIES', text: 'Wins Himalaya Roadies Season 4.' },
    { tag: '2026', text: 'Opens Summit Fitness by Naseeb in Singtam, Sikkim.' },
  ],
};

export const gym = {
  kicker: '02 · THE GYM',
  title: 'Built for the work.',
  lead: 'Free weights, racks, machines and a lifting platform under warm light. Clean, cooled, and never sloppy.',
  shots: [
    { src: '/assets/gym-rows.webp', label: 'Dumbbell wall', note: 'Full hex dumbbell range' },
    { src: '/assets/gym-platform.webp', label: 'The platform', note: 'Deadlifts, with Naseeb on the floor' },
    { src: '/assets/gym-rack.webp', label: 'Strength floor', note: 'Racks, benches, mirrors' },
    { src: '/assets/gym-mirrors.webp', label: 'The building', note: 'Big windows, morning light, Singtam' },
    { src: '/assets/gym-floor.webp', label: 'The whole floor', note: 'Air-conditioned, open 5:30 AM to 10 PM' },
  ],
};

// CONFIRM the programme list with Naseeb.
export const programs = {
  kicker: '03 · PROGRAMS',
  title: 'Pick your climb.',
  items: [
    { id: 'strength', name: 'Strength', line: 'Squat, bench, deadlift. Get stronger every month and see it on the bar.', tag: 'BARBELL · RACKS' },
    { id: 'fatloss', name: 'Fat Loss', line: 'Training plus simple food habits that fit Sikkim life. No crash diets.', tag: 'CONDITIONING · HABITS' },
    { id: 'pt', name: 'Personal Training', line: 'One coach, one plan, every session checked. The fastest way to results.', tag: '1 ON 1' },
    { id: 'beginner', name: 'First Steps', line: 'Never trained before? We teach you every machine and every lift from zero.', tag: 'BEGINNERS' },
  ],
};

export const finder = {
  kicker: 'FIND YOUR PROGRAM',
  title: 'Where are you starting from?',
  goals: [
    { id: 'strong', label: 'Get stronger' },
    { id: 'lean', label: 'Lose fat' },
    { id: 'fit', label: 'Feel fit again' },
    { id: 'sport', label: 'Train for a sport' },
  ],
  levels: [
    { id: 'new', label: 'Never trained' },
    { id: 'some', label: 'Trained a bit' },
    { id: 'regular', label: 'Train regularly' },
  ],
  // goal -> level -> recommendation
  pick(goal, level) {
    if (level === 'new') return { program: 'beginner', plan: 'First 4 weeks: 3 coached sessions a week. Learn the lifts, build the habit.' };
    if (goal === 'strong') return { program: 'strength', plan: level === 'regular' ? '4 days a week on a strength block. Track your lifts, beat them monthly.' : '3 full-body strength days a week. Add weight every week.' };
    if (goal === 'lean') return { program: 'fatloss', plan: '4 sessions a week: 3 strength, 1 conditioning, plus a daily step target.' };
    if (goal === 'sport') return { program: 'pt', plan: 'A coach builds your plan around your sport, season and schedule.' };
    return { program: level === 'regular' ? 'strength' : 'fatloss', plan: '3 to 4 sessions a week mixing strength and conditioning. Feel the change in a month.' };
  },
};

// Prices from the gym's Instagram post (valid from 1 October 2026). CONFIRM before launch.
export const membership = {
  kicker: '04 · MEMBERSHIP',
  title: 'Simple prices. No surprises.',
  note: 'All prices in rupees. One-time admission fee on monthly, quarterly and half-yearly plans.',
  plans: [
    { name: 'Monthly', price: 2500, per: '/ month', extra: '+ ₹3,000 to ₹5,000 admission' },
    { name: 'Quarterly', price: 7000, per: '/ 3 months', extra: '+ ₹3,000 admission' },
    { name: 'Half-Yearly', price: 12000, per: '/ 6 months', extra: '+ ₹3,000 admission' },
    { name: 'Yearly', price: 18000, per: '/ year', extra: 'No admission fee', best: true },
  ],
};

export const faq = {
  kicker: '05 · QUESTIONS',
  title: 'Before you walk in.',
  items: [
    { q: "I've never been to a gym. Will I feel out of place?", a: 'No. Most people start exactly there. On day one a coach walks you through the floor, shows you every machine, and gives you a plan you can actually follow.' },
    { q: 'Does Naseeb train people himself?', a: 'Naseeb runs the floor and sets the standard for every plan. For one on one coaching with him, ask about personal training on WhatsApp.' },
    { q: 'What are the timings?', a: 'Every day from 5:30 AM to 10:00 PM. Early mornings and late evenings are the quietest.' },
    { q: 'Is there an admission fee?', a: 'Monthly, quarterly and half-yearly plans have a one-time admission fee. The yearly plan has none.' },
    { q: 'Can I try it before I pay?', a: 'Yes. Book a free trial session below and come see the gym, meet the team and train once.' },
    { q: 'Is it OK for women?', a: 'Absolutely. The floor is clean, well lit and coached, and everyone trains with respect.' },
    { q: 'What should I bring?', a: 'Gym clothes, clean indoor shoes, a towel and a water bottle. That is it.' },
  ],
};

export const trial = {
  kicker: '06 · FREE TRIAL',
  title: 'Your first session is on us.',
  lead: 'Tell us a little about you. It opens WhatsApp with your message ready to send to Summit Fitness.',
  goals: ['Get stronger', 'Lose fat', 'Feel fit again', 'Train for a sport', 'Not sure yet'],
  times: ['Early morning (5:30 to 9)', 'Midday (9 to 4)', 'Evening (4 to 10)'],
  button: 'Send on WhatsApp',
  bubble: "Come say hi. First one's on me!",
  bubbleSent: 'See you on the floor!',
  success: 'WhatsApp is opening with your message. Hit send and we will reply with your trial slot.',
};

export const footer = {
  address: 'Singtam, Sikkim', // CONFIRM: full street address
  hours: 'Every day · 5:30 AM to 10:00 PM',
  disclosure: 'Gym and hero visuals are AI-enhanced renders based on Summit Fitness.',
};
