import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { inputBus } from '../../systems/input';
import { firstSession, introStore } from '../../systems/intro';
import { prefersReducedMotion } from '../../lib/motion';
import { profile } from '../../data/profile';

const SEGMENTS = 20;

// Full intro on the first load of a browser session, a faster cut on later reloads.
const firstIntro = firstSession;

function fontReady(timeout = 1200) {
  const load = document.fonts?.load('32px "Press Start 2P"').catch(() => undefined) ?? Promise.resolve();
  return Promise.race([load, new Promise((r) => setTimeout(r, timeout))]);
}

/**
 * Retro boot intro:
 *   black screen → title types/flickers in → holds → slowly fades away →
 *   NOW LOADING bar fills → READY → curtain lifts onto the room.
 * Any key, click or tap skips straight to the end.
 */
export function IntroScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const loadRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const readyRef = useRef<HTMLParagraphElement>(null);
  const [gone, setGone] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const title = titleRef.current;
    const load = loadRef.current;
    const bar = barRef.current;
    const pct = pctRef.current;
    const ready = readyRef.current;
    if (!root || !title || !load || !bar || !pct || !ready) return;

    const letters = title.querySelectorAll('span');
    const segs = Array.from(bar.querySelectorAll('i'));
    const quick = !firstIntro || prefersReducedMotion();
    const progress = { v: 0 };
    const render = () => {
      const lit = Math.floor(progress.v * SEGMENTS + 0.0001);
      segs.forEach((s, i) => s.classList.toggle('on', i < lit));
      pct.textContent = `${String(Math.round(progress.v * 100)).padStart(3, '0')}%`;
    };

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        inputBus.setLock(null);
        introStore.set('done');
        setGone(true);
      },
    });

    tl.set(load, { autoAlpha: 0 })
      .set(ready, { autoAlpha: 0 })
      .set(letters, { autoAlpha: 0 })
      .to({}, { duration: quick ? 0.15 : 0.45 })
      // letters flicker on one by one
      .to(letters, { autoAlpha: 1, duration: 0.02, stagger: quick ? 0.035 : 0.075, ease: 'steps(1)' })
      .to(title, { opacity: 0.55, duration: 0.05, repeat: 3, yoyo: true, ease: 'steps(1)' })
      .to({}, { duration: quick ? 0.35 : 0.95 })
      // ...then simply fade away (no expanding / blurring)
      .to(title, {
        autoAlpha: 0,
        duration: quick ? 0.6 : 1.4,
        ease: 'sine.inOut',
      })
      .to(load, { autoAlpha: 1, duration: 0.25 }, '+=0.15')
      .to(progress, { v: 1, duration: quick ? 0.7 : 1.5, ease: 'power1.inOut', onUpdate: render })
      .set(ready, { autoAlpha: 1 })
      .to(ready, { opacity: 0.2, duration: 0.08, repeat: 3, yoyo: true, ease: 'steps(1)' })
      .to({}, { duration: 0.2 })
      .to(root, { autoAlpha: 0, duration: quick ? 0.35 : 0.6, ease: 'power2.inOut' });

    const skip = () => {
      tl.progress(1);
    };
    inputBus.setLock(skip);
    root.addEventListener('pointerdown', skip);

    let alive = true;
    void fontReady().then(() => {
      if (alive) tl.play();
    });

    return () => {
      alive = false;
      root.removeEventListener('pointerdown', skip);
      tl.kill();
      inputBus.setLock(null);
    };
  }, []);

  if (gone) return null;

  return (
    <div className="intro" ref={rootRef} role="presentation">
      <h1 className="intro__title" ref={titleRef} aria-label={profile.siteTitle}>
        {profile.siteTitle.split('').map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </h1>

      <div className="intro__loading" ref={loadRef}>
        <p className="intro__label">
          NOW LOADING<span className="intro__dots" />
        </p>
        <div className="intro__bar" ref={barRef}>
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <span className="intro__pct" ref={pctRef}>
          000%
        </span>
        <p className="intro__ready" ref={readyRef}>
          READY
        </p>
      </div>

      <p className="intro__skip">PRESS ANY KEY</p>
    </div>
  );
}
