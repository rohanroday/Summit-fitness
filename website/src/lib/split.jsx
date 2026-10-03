// Splits a line into word and character spans with seeded "random" offsets,
// so every entrance looks identical on every load. Screen readers get the plain text.
import { Fragment } from 'react';

export function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

const seedFrom = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

// order: 'random' (scatter), 'reading' (left to right), 'word' (per word only)
export function SplitText({ text, order = 'random', spread = 0.5, jitter = 60, className = '', emphasis = [] }) {
  const r = rng(seedFrom(text));
  const words = text.split(' ');
  const totalChars = text.replace(/ /g, '').length;
  let charIndex = 0;

  return (
    <span className={`split ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, wi) => {
          const wordTh = (wi / Math.max(1, words.length)) * spread;
          return (
            <Fragment key={wi}>
            <span
              className={`w${emphasis.includes(wi) ? ' em' : ''}`}
              style={{ '--th': wordTh.toFixed(3), '--wi': wi }}
            >
              {order === 'word'
                ? word
                : [...word].map((ch, ci) => {
                    const th =
                      order === 'reading'
                        ? (charIndex / totalChars) * spread + r() * 0.06
                        : r() * spread;
                    charIndex++;
                    const style = {
                      '--th': th.toFixed(3),
                      '--jx': `${((r() - 0.5) * jitter * 2).toFixed(1)}px`,
                      '--jy': order === 'reading' ? '0px' : `${((r() - 0.5) * jitter * 1.4).toFixed(1)}px`,
                      '--jr': order === 'reading' ? '0deg' : `${((r() - 0.5) * 40).toFixed(1)}deg`,
                    };
                    return (
                      <span key={ci} className="c" style={style}>
                        {ch}
                      </span>
                    );
                  })}
            </span>
            {wi < words.length - 1 ? ' ' : null}
            </Fragment>
          );
        })}
      </span>
    </span>
  );
}
