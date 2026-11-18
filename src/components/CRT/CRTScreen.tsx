import { useEffect, useRef, type ReactNode } from 'react';
import { registerGlitchNodes, startAmbientGlitches } from '../../systems/glitch';
import { powerStore } from '../../systems/power';
import { useStore } from '../../lib/store';
import { CRTGlitch } from './CRTGlitch';
import { CRTNoise } from './CRTNoise';
import { CRTScanlines } from './CRTScanlines';
import { OSD } from './OSD';
import { ScreenFlicker } from '../Effects/ScreenFlicker';
import { BootSequence } from '../Effects/BootSequence';
import { GameplayDemo } from '../Effects/GameplayDemo';
import { cinematicStore } from '../../systems/cinematic';

/** The tube. Content goes in the "signal" layer; analog artefacts stack above it. */
export function CRTScreen({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const signal = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const turbulence = useRef<SVGFETurbulenceElement>(null);
  const displacement = useRef<SVGFEDisplacementMapElement>(null);
  const offsetR = useRef<SVGFEOffsetElement>(null);
  const offsetB = useRef<SVGFEOffsetElement>(null);
  const power = useStore(powerStore);
  const cine = useStore(cinematicStore);

  useEffect(() => {
    const [r, s, b, t, d, oR, oB] = [root.current, signal.current, band.current, turbulence.current, displacement.current, offsetR.current, offsetB.current];
    if (!r || !s || !b || !t || !d || !oR || !oB) return;
    registerGlitchNodes({ root: r, signal: s, band: b, turbulence: t, displacement: d, offsetR: oR, offsetB: oB });
    return () => registerGlitchNodes(null);
  }, []);

  useEffect(() => {
    if (power !== 'on') return;
    return startAmbientGlitches();
  }, [power]);

  return (
    <div className="crt-screen" ref={root}>
      <div className="crt-signal" ref={signal}>
        <div className="crt-content" ref={content} aria-hidden={power === 'off'}>
          {children}
        </div>
        {cine !== 'done' && <GameplayDemo phase={cine} />}
        <OSD />
        <BootSequence contentRef={content} />
      </div>
      <CRTScanlines />
      <div className="crt-layer crt-band" ref={band} aria-hidden />
      <CRTNoise />
      <div className="crt-layer crt-static" aria-hidden />
      <ScreenFlicker />
      <div className="crt-layer crt-vignette" aria-hidden />
      <div className="crt-layer crt-glass" aria-hidden />
      <CRTGlitch turbulenceRef={turbulence} displacementRef={displacement} offsetRRef={offsetR} offsetBRef={offsetB} />
    </div>
  );
}
