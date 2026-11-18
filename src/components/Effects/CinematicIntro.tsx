import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useStore } from '../../lib/store';
import { cinematicStore, setCinePhase } from '../../systems/cinematic';
import { introStore } from '../../systems/intro';
import { inputBus } from '../../systems/input';
import { powerApi } from '../../systems/power';
import { triggerGlitch } from '../../systems/glitch';
import { sound } from '../../systems/audio';
import { demoGame } from '../../systems/demoGame';
import { sceneRef } from '../../three/SceneRenderer';
import { asset, prefersReducedMotion, safeStorage } from '../../lib/motion';
import { profile } from '../../data/profile';

/**
 * Plays on every load of the home page, right after the TANTAMTRANG title card:
 *   0–10s   one continuous camera move through the 3D room (high diagonal →
 *           dolly in → crane down → swing round to dead-centre on the TV)
 *   10–11s  the game on the TV flickers, a distortion band rolls, static
 *   11–14s  static clears into the cyan menu, items appear one by one
 * Any key / click / tap skips to the end. If `profile.cinematicVideo` is set,
 * that video plays instead of the live camera move.
 */
export function CinematicIntro() {
  const phase = useStore(cinematicStore);
  const [videoOn, setVideoOn] = useState(false);
  const afterVideo = useRef<() => void>(() => {});
  const video = profile.cinematicVideo;

  useLayoutEffect(() => {
    if (cinematicStore.get() === 'done') return;
    // always talk to the live renderer (StrictMode mounts twice in dev; the first one is disposed)
    const sc = () => sceneRef.current;
    const reduced = prefersReducedMotion();
    let tl: gsap.core.Timeline | null = null;
    let finished = false;
    let pointerTimer = 0;
    let continuous = false;

    const releaseScreen = () => {
      if (!continuous) return;
      continuous = false;
      sc()?.setGameCanvas(null);
      sc()?.setContinuous(false);
    };

    // TV is already on and playing the demo game when the room fades in.
    powerApi.instantOn();
    sc()?.showHeldPad(false, false); // controller stays out of shot during the fly-in
    safeStorage.set('session', 'crt.menu', '0'); // PORTFOLIO selected at the end
    demoGame.start();
    const scene = sc();
    if (scene) {
      scene.setGameCanvas(demoGame.canvas);
      scene.setContinuous(true);
      continuous = true;
      scene.setCameraProgress(reduced || video ? 1 : 0);
    }
    setCinePhase('pending');

    const finish = () => {
      if (finished) return;
      finished = true;
      sc()?.showHeldPad(true);
      tl?.kill();
      window.clearTimeout(pointerTimer);
      window.removeEventListener('pointerdown', finish);
      sc()?.setCameraProgress(1);
      releaseScreen();
      demoGame.stop();
      setVideoOn(false);
      setCinePhase('done');
      inputBus.setLock(null);
    };

    const screenSequence = (t: gsap.core.Timeline, at: number | string) => {
      t.add(() => {
        setCinePhase('signal'); // HTML screen takes over, game flickers
        sc()?.showHeldPad(true); // pick up the controller
      }, at)
        .add(() => triggerGlitch(1), '+=0.45') // horizontal band rolls through
        .add(() => {
          triggerGlitch(3);
          sound.play('static');
        }, '+=0.2')
        .add(() => {
          setCinePhase('static'); // full analog snow
          sound.play('transition');
          releaseScreen();
        }, '+=0.3')
        .add(() => setCinePhase('reveal'), '+=0.75') // snow clears into the menu
        .add(finish, '+=2.9'); // hold the final frame
    };

    const begin = () => {
      inputBus.setLock(() => finish());
      // ignore the click that dismissed the title card
      pointerTimer = window.setTimeout(() => window.addEventListener('pointerdown', finish), 350);

      if (video) {
        afterVideo.current = () => {
          setVideoOn(false);
          tl = gsap.timeline();
          screenSequence(tl, 0.2);
        };
        setCinePhase('camera');
        setVideoOn(true);
        return;
      }

      tl = gsap.timeline();
      setCinePhase('camera');
      if (!reduced && sc()) {
        const cam = { p: 0 };
        tl.to(cam, {
          p: 1,
          duration: 10,
          ease: 'power2.inOut',
          onUpdate: () => sc()?.setCameraProgress(cam.p),
        });
        screenSequence(tl, '+=0.15');
      } else {
        screenSequence(tl, 0.6);
      }
    };

    // start once the title card is gone AND the 3D scene's shaders are compiled
    let cancelled = false;
    const startWhenReady = () => {
      void (sc()?.ready ?? Promise.resolve()).then(() => {
        if (!cancelled && !finished) begin();
      });
    };
    let unsubscribe: (() => void) | undefined;
    if (introStore.get() === 'done') startWhenReady();
    else
      unsubscribe = introStore.subscribe(() => {
        if (introStore.get() !== 'done') return;
        unsubscribe?.();
        unsubscribe = undefined;
        startWhenReady();
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
      tl?.kill();
      window.clearTimeout(pointerTimer);
      window.removeEventListener('pointerdown', finish);
      releaseScreen();
      demoGame.stop();
    };
  }, [video]);

  if (phase === 'done') return null;

  return (
    <>
      {videoOn && video && (
        <video className="cine-video" src={asset(video)} autoPlay muted playsInline onEnded={() => afterVideo.current()} onError={() => afterVideo.current()} />
      )}
      <div className="cine-bars" aria-hidden>
        <div className="cine-bars__top" />
        <div className="cine-bars__bottom">
          <span>PRESS ANY KEY TO SKIP</span>
        </div>
      </div>
    </>
  );
}
