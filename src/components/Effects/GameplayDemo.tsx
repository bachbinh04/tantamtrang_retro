import { useEffect, useRef } from 'react';
import type { CinePhase } from '../../systems/cinematic';
import { demoGame } from '../../systems/demoGame';

/**
 * HTML-screen copy of the demo game. While the camera flies in, the 3D TV shows the
 * game as a texture; once the camera stops, this layer takes over (same pixels)
 * and runs the flicker → static → menu handover.
 */
export function GameplayDemo({ phase }: { phase: CinePhase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    cv.width = demoGame.canvas.width;
    cv.height = demoGame.canvas.height;
    let raf = 0;
    const copy = () => {
      ctx.drawImage(demoGame.canvas, 0, 0);
      raf = requestAnimationFrame(copy);
    };
    raf = requestAnimationFrame(copy);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`cine-demo cine-demo--${phase}`} aria-hidden>
      <canvas ref={canvasRef} className="cine-demo__game" />
      <div className="cine-demo__static" />
    </div>
  );
}
