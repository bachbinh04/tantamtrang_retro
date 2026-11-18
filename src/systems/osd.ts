import { createStore } from '../lib/store';

/** On-screen display — the green TV overlay ("CH 03", "VOLUME ▮▮▮"). */
export interface OSDMessage {
  id: number;
  text: string;
  sub?: string;
  bars?: number; // 0..10 volume-style bars
}

export const osdStore = createStore<OSDMessage | null>(null);
let timer: number | undefined;
let id = 0;

export function showOSD(text: string, opts: { sub?: string; bars?: number; ms?: number } = {}) {
  window.clearTimeout(timer);
  osdStore.set({ id: ++id, text, sub: opts.sub, bars: opts.bars });
  timer = window.setTimeout(() => osdStore.set(null), opts.ms ?? 1700);
}
