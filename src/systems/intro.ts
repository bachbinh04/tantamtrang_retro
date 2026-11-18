import { createStore } from '../lib/store';
import { safeStorage } from '../lib/motion';

/** True on the first page load of a browser session (full intro + cinematic); false on reloads. */
export const firstSession = !safeStorage.get('session', 'crt.intro');
safeStorage.set('session', 'crt.intro', '1');

/** 'playing' while the black title / loading intro is on screen; the TV only powers on after 'done'. */
export const introStore = createStore<'playing' | 'done'>('playing');
