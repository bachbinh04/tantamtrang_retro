import { createStore } from '../lib/store';

/**
 * Camera fly-in that plays every time the home page is loaded, right after the
 * title/loading card:
 *   pending → camera (fly-in) → signal (game flickers) → static → reveal (menu) → done
 */
export type CinePhase = 'pending' | 'camera' | 'signal' | 'static' | 'reveal' | 'done';

const onHome = typeof window !== 'undefined' && window.location.pathname === '/';

export const cinematicStore = createStore<CinePhase>(onHome ? 'pending' : 'done');

export function setCinePhase(p: CinePhase) {
  cinematicStore.set(p);
  const root = document.documentElement;
  if (p === 'done') delete root.dataset.cine;
  else root.dataset.cine = p;
}

if (onHome) document.documentElement.dataset.cine = 'pending';
