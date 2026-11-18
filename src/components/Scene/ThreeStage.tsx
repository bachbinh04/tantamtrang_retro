import { useLayoutEffect, useRef, useState } from 'react';
import { SceneRenderer, sceneRef, screenTarget, type ScreenRect } from '../../three/SceneRenderer';
import { CRTScreen } from '../CRT/CRTScreen';
import { ScreenRouter } from '../Navigation/ScreenRouter';
import { inputBus } from '../../systems/input';
import { powerStore, togglePower } from '../../systems/power';
import { toggleSoundWithOSD } from '../../systems/actions';

/**
 * The real 3D room + TV (WebGL), with the interactive HTML CRT screen laid exactly
 * over the TV's glass. The 3D camera is solved so its screen projects onto `rect`.
 * The controller is the 3D model itself, held up facing the camera — click or tap it.
 */
export function ThreeStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rect, setRect] = useState<ScreenRect>(() => screenTarget(window.innerWidth, window.innerHeight));

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sr = new SceneRenderer(canvas);
    sceneRef.current = sr;
    if (import.meta.env.DEV) (window as unknown as { __scene: SceneRenderer }).__scene = sr;

    sr.onTvAction = (a) => {
      if (a === 'power') togglePower();
      else if (a === 'sound') toggleSoundWithOSD();
      else inputBus.emit(a);
    };
    sr.onPadAction = (a) => inputBus.emit(a);

    const layout = () => setRect(sr.layout(window.innerWidth, window.innerHeight));
    layout();
    window.addEventListener('resize', layout);
    void document.fonts?.ready.then(() => sr.requestRender());

    const syncPower = () => {
      const s = powerStore.get();
      sr.setPower(s === 'on' ? 1 : s === 'warming' ? 0.35 : 0);
    };
    syncPower();
    const offPower = powerStore.subscribe(syncPower);
    const offPress = inputBus.onPress((a) => sr.pressPad(a));

    return () => {
      window.removeEventListener('resize', layout);
      offPower();
      offPress();
      sr.dispose();
      if (sceneRef.current === sr) sceneRef.current = null;
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="three-canvas" aria-label="A dusty attic at night: an old CRT television, a console and a controller held up in front of you" role="img" />
      <div className="screen-anchor" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}>
        <CRTScreen>
          <ScreenRouter />
        </CRTScreen>
      </div>
    </>
  );
}
