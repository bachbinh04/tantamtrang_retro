import { useEffect } from 'react';
import { inputBus, type Action } from '../../systems/input';
import { sound, type SoundName } from '../../systems/audio';
import { powerStore } from '../../systems/power';

const PRESS_SOUND: Partial<Record<Action, SoundName>> = {
  up: 'move',
  down: 'move',
  left: 'move',
  right: 'move',
  confirm: 'confirm',
  start: 'confirm',
  back: 'back',
};

/**
 * Wires the sound engine to the rest of the system:
 *  - unlocks the AudioContext on the first user gesture (autoplay policy)
 *  - plays button blips for every controller / keyboard press
 *  - keeps the CRT hum running only while the TV is on
 */
export function AudioManager() {
  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);

    const offPress = inputBus.onPress((a) => {
      if (powerStore.get() !== 'on') return;
      sound.play(PRESS_SOUND[a] ?? 'click');
    });

    const syncHum = () => sound.setHum(powerStore.get() === 'on');
    syncHum();
    const offPower = powerStore.subscribe(syncHum);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      offPress();
      offPower();
    };
  }, []);

  return null;
}
