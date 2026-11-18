import { useStore } from '../lib/store';
import { sound, soundEnabled } from '../systems/audio';

export function useAudio() {
  const enabled = useStore(soundEnabled);
  return { enabled, play: sound.play, toggle: sound.toggle };
}
