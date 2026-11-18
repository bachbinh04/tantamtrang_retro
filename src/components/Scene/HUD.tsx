import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';
import { useStore } from '../../lib/store';
import { powerStore, togglePower } from '../../systems/power';
import { toggleSoundWithOSD } from '../../systems/actions';
import { pad } from '../../lib/motion';

function Timecode() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => setT(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span>
      {Math.floor(t / 3600)}:{pad(Math.floor(t / 60) % 60)}:{pad(t % 60)}
    </span>
  );
}

/** VHS-style overlay around the room: play status, sound toggle, key hints, tape counter. */
export function HUD() {
  const { enabled } = useAudio();
  const power = useStore(powerStore);

  return (
    <div className="hud">
      <div className="hud__tl">
        {power === 'off' ? (
          <button type="button" className="hud__standby" onClick={togglePower}>
            ■ STANDBY — PRESS POWER
          </button>
        ) : (
          <span>
            <b className="hud__play">▶</b> PLAY <small>SP</small>
          </span>
        )}
      </div>

      <button
        type="button"
        className={`hud__sound ${enabled ? 'is-on' : ''}`}
        onClick={toggleSoundWithOSD}
        aria-pressed={enabled}
        aria-label={enabled ? 'Mute sound effects' : 'Enable sound effects'}
      >
        {enabled ? <Volume2 size={16} strokeWidth={2.2} /> : <VolumeX size={16} strokeWidth={2.2} />}
        <span>SOUND {enabled ? 'ON' : 'OFF'}</span>
      </button>

      <div className="hud__bl" aria-hidden>
        <span><kbd>↑↓←→</kbd> MOVE</span>
        <span><kbd>ENTER</kbd> ✕ SELECT</span>
        <span><kbd>ESC</kbd> ○ BACK</span>
        <span><kbd>SHIFT</kbd> SOUND</span>
      </div>

      <div className="hud__br" aria-hidden>
        <Timecode />
      </div>
    </div>
  );
}
