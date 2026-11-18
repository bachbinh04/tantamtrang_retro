import { useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { inputBus } from '../../systems/input';
import { powerApi, powerStore, type PowerState } from '../../systems/power';
import { triggerGlitch } from '../../systems/glitch';
import { introStore } from '../../systems/intro';
import { cinematicStore } from '../../systems/cinematic';
import { sound } from '../../systems/audio';
import { prefersReducedMotion, safeStorage } from '../../lib/motion';

// Decided once per page load (outside React so StrictMode double-effects can't flip it).
const firstVisit = !safeStorage.get('session', 'crt.booted');
safeStorage.set('session', 'crt.booted', '1');

/**
 * CRT power-on / power-off choreography.
 * Full boot (first visit in a session, ~2.3s):
 *   dark room + hum → thin horizontal line → line expands to a bright raster →
 *   flicker → RGB glitch → stabilise → menu fades in, room lights up.
 * Later visits in the same session get a 0.6s warm-up. Any input skips.
 */
export function BootSequence({ contentRef }: { contentRef: RefObject<HTMLDivElement> }) {
  const bootRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const boot = bootRef.current;
    const beam = beamRef.current;
    const dot = dotRef.current;
    const content = contentRef.current;
    if (!boot || !beam || !dot || !content) return;

    let tl: gsap.core.Timeline | null = null;
    const setPower = (s: PowerState) => {
      powerStore.set(s);
      root.dataset.power = s;
    };
    const kill = () => {
      tl?.kill();
      tl = null;
    };

    const powerOn = (full = true) => {
      kill();
      setPower('warming');
      sound.play('powerOn');
      inputBus.setLock(() => {
        tl?.progress(1);
      });
      tl = gsap.timeline({
        onComplete: () => {
          setPower('on');
          inputBus.setLock(null);
          gsap.set(boot, { autoAlpha: 0 });
        },
      });
      tl.set(boot, { autoAlpha: 1 })
        .set(content, { opacity: 0 })
        .set(dot, { opacity: 0 })
        .set(beam, { opacity: 0, scaleX: 0, scaleY: 0.006 });

      if (prefersReducedMotion()) {
        tl.to(root, { '--dim': 0, duration: 0.35 }).to(content, { opacity: 1, duration: 0.35 }, 0);
      } else if (!full) {
        tl.set(root, { '--dim': 1 })
          .set(beam, { opacity: 1 })
          .to(beam, { scaleX: 1, duration: 0.14, ease: 'power2.out' })
          .to(beam, { scaleY: 1, duration: 0.16, ease: 'expo.in' })
          .to(root, { '--dim': 0, duration: 0.5 }, '<')
          .add(() => triggerGlitch(3))
          .to(beam, { opacity: 0, duration: 0.22 })
          .to(content, { opacity: 1, duration: 0.25 }, '<');
      } else {
        tl.set(root, { '--dim': 1 })
          .to({}, { duration: 0.45 }) // darkness: LED warming, glass static charge, hum
          .set(beam, { opacity: 1 })
          .to(beam, { scaleX: 1, duration: 0.26, ease: 'power3.out' })
          .to(beam, { scaleY: 1, duration: 0.3, ease: 'expo.in' }, '+=0.08')
          .to(root, { '--dim': 0.35, duration: 0.3 }, '<')
          .to(beam, { opacity: 0.35, duration: 0.05, repeat: 3, yoyo: true, ease: 'none' })
          .add(() => triggerGlitch(4))
          .to(beam, { opacity: 0, duration: 0.4, ease: 'power2.in' })
          .to(content, { opacity: 1, duration: 0.45 }, '-=0.2')
          .to(root, { '--dim': 0, duration: 0.7 }, '<');
      }
    };

    const powerOff = () => {
      kill();
      setPower('off');
      sound.play('powerOff');
      inputBus.setLock((a) => {
        if (a === 'start' || a === 'confirm') powerOn(true);
      });
      tl = gsap.timeline();
      tl.set(boot, { autoAlpha: 1 })
        .set(content, { opacity: 0 })
        .set(beam, { opacity: 1, scaleX: 1, scaleY: 1 })
        .to(beam, { scaleY: 0.008, duration: 0.16, ease: 'power3.in' })
        .to(beam, { scaleX: 0, duration: 0.14, ease: 'power3.in' })
        .set(dot, { opacity: 1, scale: 1 }, '-=0.05')
        .to(dot, { opacity: 0, scale: 0.3, duration: 0.7, ease: 'power1.out' })
        .to(root, { '--dim': 1, duration: 0.6 }, 0.1);
    };

    powerApi.powerOn = powerOn;
    powerApi.powerOff = powerOff;
    powerApi.skip = () => {
      tl?.progress(1);
    };
    // Used by the cinematic fly-in: the TV is already on (playing a game) when the camera arrives.
    powerApi.instantOn = () => {
      kill();
      setPower('on');
      gsap.set(boot, { autoAlpha: 0 });
      gsap.set(content, { opacity: 1 });
      gsap.set(root, { '--dim': 0 });
    };

    // The TV powers on once the black intro card has finished — unless the
    // cinematic fly-in is about to play, which handles the TV itself.
    const start = () => {
      if (cinematicStore.get() === 'done') powerOn(firstVisit);
    };
    let unsubscribe: (() => void) | undefined;
    if (introStore.get() === 'done') start();
    else
      unsubscribe = introStore.subscribe(() => {
        if (introStore.get() !== 'done') return;
        unsubscribe?.();
        unsubscribe = undefined;
        start();
      });

    return () => {
      unsubscribe?.();
      kill();
      inputBus.setLock(null);
    };
  }, [contentRef]);

  return (
    <div className="crt-boot" ref={bootRef} aria-hidden>
      <div className="crt-boot__beam" ref={beamRef} />
      <div className="crt-boot__dot" ref={dotRef} />
    </div>
  );
}
