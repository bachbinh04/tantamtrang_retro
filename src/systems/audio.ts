import { createStore } from '../lib/store';
import { safeStorage } from '../lib/motion';

/**
 * Retro sound engine. Every sound is synthesised with the Web Audio API at runtime —
 * no samples, no copyrighted audio, zero bytes of asset download.
 * Sound is OFF until the user turns it on; the preference is stored in localStorage.
 */
export type SoundName =
  | 'move'
  | 'confirm'
  | 'back'
  | 'click'
  | 'static'
  | 'transition'
  | 'powerOn'
  | 'powerOff'
  | 'error'
  | 'loading';

const KEY = 'crt.sound';
export const soundEnabled = createStore<boolean>(safeStorage.get('local', KEY) === '1');

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let hum: { stop: () => void } | null = null;
let humWanted = false;

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; to?: number; delay?: number; attack?: number } = {},
) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = opts.type ?? 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
  const peak = opts.gain ?? 0.05;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + (opts.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(
  dur: number,
  opts: { gain?: number; freq?: number; q?: number; type?: BiquadFilterType; sweepTo?: number; delay?: number } = {},
) {
  if (!ctx || !master || !noiseBuffer) return;
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = opts.type ?? 'bandpass';
  filter.frequency.setValueAtTime(opts.freq ?? 3000, t0);
  if (opts.sweepTo) filter.frequency.exponentialRampToValueAtTime(opts.sweepTo, t0 + dur);
  filter.Q.value = opts.q ?? 0.7;
  const g = ctx.createGain();
  const peak = opts.gain ?? 0.05;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + dur + 0.05);
}

const recipes: Record<SoundName, () => void> = {
  move: () => tone(880, 0.05, { gain: 0.035, to: 990 }),
  click: () => tone(1400, 0.025, { gain: 0.025, type: 'triangle' }),
  confirm: () => {
    tone(660, 0.06, { gain: 0.04 });
    tone(1320, 0.1, { gain: 0.035, delay: 0.06 });
  },
  back: () => tone(520, 0.1, { gain: 0.04, to: 300, type: 'triangle' }),
  error: () => tone(140, 0.14, { gain: 0.05, type: 'sawtooth' }),
  static: () => noise(0.12, { gain: 0.03, freq: 3200, q: 0.6 }),
  transition: () => {
    noise(0.38, { gain: 0.05, type: 'lowpass', freq: 7000, sweepTo: 300 });
    tone(90, 0.25, { gain: 0.05, type: 'sine', to: 45 });
  },
  loading: () => {
    [0, 0.09, 0.18, 0.27].forEach((d, i) => tone(440 + i * 110, 0.05, { gain: 0.025, delay: d }));
  },
  powerOn: () => {
    noise(0.07, { gain: 0.08, type: 'highpass', freq: 2000 });
    tone(55, 0.9, { gain: 0.09, type: 'sine', to: 48, attack: 0.02, delay: 0.05 });
    noise(0.6, { gain: 0.02, freq: 9000, q: 4, delay: 0.1 });
    tone(15600, 1.2, { gain: 0.004, type: 'sine', delay: 0.2 });
  },
  powerOff: () => {
    tone(1600, 0.28, { gain: 0.03, type: 'sine', to: 60 });
    noise(0.05, { gain: 0.05, type: 'highpass', freq: 2500 });
  },
};

function startHum() {
  if (!ctx || !master || hum) return;
  const g = ctx.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 1.2);
  const a = ctx.createOscillator();
  a.type = 'sine';
  a.frequency.value = 60;
  const b = ctx.createOscillator();
  b.type = 'triangle';
  b.frequency.value = 120;
  const bg = ctx.createGain();
  bg.gain.value = 0.25;
  a.connect(g);
  b.connect(bg).connect(g);
  g.connect(master);
  a.start();
  b.start();
  const c = ctx;
  hum = {
    stop: () => {
      g.gain.cancelScheduledValues(c.currentTime);
      g.gain.setValueAtTime(g.gain.value, c.currentTime);
      g.gain.linearRampToValueAtTime(0, c.currentTime + 0.3);
      a.stop(c.currentTime + 0.35);
      b.stop(c.currentTime + 0.35);
    },
  };
}

function stopHum() {
  hum?.stop();
  hum = null;
}

export const sound = {
  play(name: SoundName) {
    if (!soundEnabled.get() || !ctx) return;
    recipes[name]();
  },
  /** Must be called from a user gesture. */
  unlock() {
    if (!soundEnabled.get()) return;
    ensureContext();
    if (humWanted) startHum();
  },
  setHum(on: boolean) {
    humWanted = on;
    if (on && soundEnabled.get() && ctx) startHum();
    if (!on) stopHum();
  },
  toggle() {
    const next = !soundEnabled.get();
    soundEnabled.set(next);
    safeStorage.set('local', KEY, next ? '1' : '0');
    if (next) {
      ensureContext();
      recipes.confirm();
      if (humWanted) startHum();
    } else {
      stopHum();
    }
    return next;
  },
};
