import { sound } from './audio';
import { showOSD } from './osd';

export function toggleSoundWithOSD() {
  const on = sound.toggle();
  showOSD(on ? 'SOUND ON' : 'MUTE', { bars: on ? 7 : 0 });
  return on;
}
