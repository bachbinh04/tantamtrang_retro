import { useCallback } from 'react';
import { triggerGlitch, type GlitchLevel } from '../systems/glitch';

export function useGlitch() {
  return useCallback((level: GlitchLevel) => triggerGlitch(level), []);
}
