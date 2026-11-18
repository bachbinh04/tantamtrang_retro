import { prefersReducedMotion } from '../lib/motion';

/**
 * Global glitch system.
 *
 *  L1 ambient    – VHS band sweep + tiny jolt. Pure CSS, no filters.
 *  L2 hover      – brief RGB split, small horizontal displacement, light static.
 *  L3 selection  – stronger displacement, flicker, horizontal tearing.
 *  L4 transition – full-screen distortion, static interruption, wide channel split.
 *
 * L2–L4 drive a single SVG filter (#crt-glitch) that is attached to the screen's
 * signal layer ONLY while a glitch is running, so the idle cost is zero.
 */
export type GlitchLevel = 1 | 2 | 3 | 4;

interface Nodes {
  root: HTMLElement; // .crt-screen
  signal: HTMLElement; // layer the filter is applied to
  band: HTMLElement;
  turbulence: SVGFETurbulenceElement;
  displacement: SVGFEDisplacementMapElement;
  offsetR: SVGFEOffsetElement;
  offsetB: SVGFEOffsetElement;
}

const config: Record<2 | 3 | 4, { dur: number; disp: number; split: number; staticMax: number; bright: number }> = {
  2: { dur: 200, disp: 7, split: 2.2, staticMax: 0.16, bright: 0.06 },
  3: { dur: 340, disp: 24, split: 4.5, staticMax: 0.38, bright: 0.16 },
  4: { dur: 520, disp: 46, split: 8, staticMax: 0.75, bright: 0.28 },
};

let nodes: Nodes | null = null;
let running: { level: GlitchLevel; raf: number } | null = null;
let safety: number | undefined;

export function registerGlitchNodes(n: Nodes | null) {
  nodes = n;
}

function restartClass(el: HTMLElement, cls: string) {
  el.classList.remove(cls);
  void el.offsetWidth; // reflow so the CSS animation restarts
  el.classList.add(cls);
}

function stop() {
  if (!nodes || !running) return;
  cancelAnimationFrame(running.raf);
  running = null;
  nodes.signal.style.filter = '';
  nodes.root.style.setProperty('--glitch', '0');
  delete nodes.root.dataset.glitch;
  nodes.displacement.setAttribute('scale', '0');
}

export function triggerGlitch(level: GlitchLevel) {
  if (!nodes) return;
  const n = nodes;

  if (level === 1) {
    if (running || prefersReducedMotion()) return;
    restartClass(n.band, 'is-sweeping');
    restartClass(n.root, 'is-jolting');
    return;
  }

  // Reduced motion: no displacement, just a soft brightness blink.
  if (prefersReducedMotion()) {
    restartClass(n.root, 'is-blinking');
    return;
  }

  // Never let a weaker glitch interrupt a stronger one.
  if (running && running.level > level) return;
  stop();

  const c = config[level];
  const start = performance.now();
  n.root.dataset.glitch = String(level);
  n.root.style.setProperty('--static-max', String(c.staticMax));
  n.root.style.setProperty('--bright-max', String(c.bright));
  n.signal.style.filter = 'url(#crt-glitch)';
  // rAF pauses in background tabs — never leave the picture stuck mid-glitch.
  window.clearTimeout(safety);
  safety = window.setTimeout(stop, c.dur + 120);

  const frame = (now: number) => {
    const p = (now - start) / c.dur;
    if (p >= 1) {
      stop();
      return;
    }
    // fast attack, ragged decay
    const env = p < 0.18 ? p / 0.18 : 1 - (p - 0.18) / 0.82;
    const jag = Math.random() < 0.25 ? 0.15 : 0.6 + Math.random() * 0.8;
    n.displacement.setAttribute('scale', (c.disp * env * jag).toFixed(2));
    n.turbulence.setAttribute('seed', String((Math.random() * 999) | 0));
    n.turbulence.setAttribute('baseFrequency', `0.00001 ${(0.015 + Math.random() * 0.12).toFixed(3)}`);
    const split = c.split * env * (0.7 + Math.random() * 0.6);
    n.offsetR.setAttribute('dx', split.toFixed(2));
    n.offsetB.setAttribute('dx', (-split).toFixed(2));
    n.root.style.setProperty('--glitch', env.toFixed(3));
    running = { level, raf: requestAnimationFrame(frame) };
  };
  running = { level, raf: requestAnimationFrame(frame) };
}

/** Ambient L1 scheduler — occasional analog hiccups while idle. */
export function startAmbientGlitches() {
  let t: number;
  const loop = () => {
    t = window.setTimeout(() => {
      if (document.visibilityState === 'visible') triggerGlitch(1);
      loop();
    }, 4500 + Math.random() * 7000);
  };
  loop();
  return () => window.clearTimeout(t);
}
