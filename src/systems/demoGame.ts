
const W = 160;
const H = 120;
const GROUND = 96;

// 8×10 runner, two frames. . = clear, c = cyan, w = white, m = magenta, d = dark
const RUNNER = [
  [
    '..cccc..',
    '.cwwwwc.',
    '.cwdwdc.',
    '.cwwwwc.',
    '..cccc..',
    '.mmccmm.',
    'm.cccc.m',
    '..cccc..',
    '.cc..cc.',
    'cc....cc',
  ],
  [
    '..cccc..',
    '.cwwwwc.',
    '.cwdwdc.',
    '.cwwwwc.',
    '..cccc..',
    '.mmccmm.',
    '.mccccm.',
    '..cccc..',
    '..cccc..',
    '..c..c..',
  ],
];
const PAL: Record<string, string> = { c: '#75f5ff', w: '#e8ffff', m: '#f15c9c', d: '#10182b' };

const STARS = Array.from({ length: 28 }, (_, i) => ({ x: (i * 53) % W, y: (i * 29) % 56, p: i * 0.7 }));

interface Thing {
  x: number;
  kind: 'crate' | 'spike' | 'coin';
  y?: number;
  taken?: boolean;
}


const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : (null as unknown as HTMLCanvasElement);
if (canvas) { canvas.width = W; canvas.height = H; }
let stopFn: (() => void) | null = null;

/**
 * The game the TV is "playing" during the cinematic: an original low-res
 * side-scroller in attract/demo mode, drawn into one shared offscreen canvas.
 * The 3D screen uses it as a texture; the HTML screen mirrors it.
 */
export const demoGame = {
  canvas,
  start() {
    if (stopFn) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
      let raf = 0;
      let last = performance.now();
      let t = 0;
      let scroll = 0;
      let score = 4200;
      const player = { y: GROUND - 10, vy: 0 };
      const things: Thing[] = [];
      let nextSpawn = 60;
  
      const spawn = (x: number) => {
        const r = Math.random();
        if (r < 0.45) things.push({ x, kind: 'crate' });
        else if (r < 0.75) things.push({ x, kind: 'spike' });
        else things.push({ x, kind: 'coin', y: GROUND - 26 - Math.random() * 10 });
      };
  
      const frame = (now: number) => {
        // rAF timestamps can precede `last` on the first frame — never let time run backwards
        const dt = Math.max(0, Math.min(3, (now - last) / 16.67));
        last = now;
        t += dt;
        const speed = 1.25 * dt;
        scroll += speed;
  
        // world
        nextSpawn -= speed;
        if (nextSpawn <= 0) {
          spawn(W + 8);
          nextSpawn = 52 + Math.random() * 60;
        }
        for (const th of things) th.x -= speed;
        while (things.length && things[0].x < -12) things.shift();
  
        // auto-play: jump when something is just ahead
        const onGround = player.y >= GROUND - 10;
        const danger = things.find((th) => th.kind !== 'coin' && th.x > 30 && th.x < 52);
        if (onGround && danger) player.vy = -3.3;
        player.vy += 0.19 * dt;
        player.y = Math.min(GROUND - 10, player.y + player.vy * dt);
        if (player.y >= GROUND - 10) player.vy = 0;
        for (const th of things) {
          if (th.kind === 'coin' && !th.taken && Math.abs(th.x - 36) < 6 && Math.abs((th.y ?? 0) - player.y) < 10) {
            th.taken = true;
            score += 100;
          }
        }
        score += Math.round(dt);
  
        // ---- draw
        const bands = ['#0a0d26', '#100f34', '#1a1242', '#2a1550', '#3f1a5c', '#5a1f66'];
        bands.forEach((c, i) => {
          ctx.fillStyle = c;
          ctx.fillRect(0, i * 11, W, 11);
        });
        for (const s of STARS) {
          if (Math.sin(t * 0.08 + s.p) > -0.3) {
            ctx.fillStyle = '#c9e9ff';
            ctx.fillRect(s.x, s.y, 1, 1);
          }
        }
        // striped sun
        for (let y = -16; y < 16; y++) {
          const w = Math.sqrt(256 - y * y);
          if (y > 2 && (y + 16) % 5 < 2) continue;
          ctx.fillStyle = y < -4 ? '#ffd166' : y < 6 ? '#ffb36b' : '#f15c9c';
          ctx.fillRect(116 - w, 54 + y, w * 2, 1);
        }
        // parallax hills
        const ridge = (off: number, base: number, amp: number, color: string, period: number) => {
          ctx.fillStyle = color;
          for (let x = 0; x < W; x++) {
            const wx = x + off;
            const h = base - Math.abs(((wx % period) + period) % period - period / 2) * amp;
            ctx.fillRect(x, h, 1, GROUND - h);
          }
        };
        ridge(scroll * 0.25, 82, 0.55, '#24124a', 64);
        ridge(scroll * 0.55 + 20, 92, 0.35, '#170c33', 40);
  
        // ground
        ctx.fillStyle = '#0d1430';
        ctx.fillRect(0, GROUND, W, H - GROUND);
        ctx.fillStyle = '#75f5ff';
        ctx.fillRect(0, GROUND, W, 1);
        ctx.fillStyle = 'rgba(117,245,255,0.35)';
        for (let x = -((scroll * 1) % 12); x < W; x += 12) ctx.fillRect(Math.round(x), GROUND + 1, 1, H - GROUND);
        ctx.fillRect(0, GROUND + 8, W, 1);
        ctx.fillRect(0, GROUND + 17, W, 1);
  
        // obstacles & coins
        for (const th of things) {
          const x = Math.round(th.x);
          if (th.kind === 'crate') {
            ctx.fillStyle = '#9d5bff';
            ctx.fillRect(x, GROUND - 10, 10, 10);
            ctx.fillStyle = '#d6b8ff';
            ctx.fillRect(x, GROUND - 10, 10, 1);
            ctx.fillStyle = '#5a2fa0';
            ctx.fillRect(x + 2, GROUND - 8, 6, 6);
          } else if (th.kind === 'spike') {
            ctx.fillStyle = '#f15c9c';
            for (let i = 0; i < 6; i++) ctx.fillRect(x + i, GROUND - 1 - i * 1.2, 12 - i * 2, 1.2);
          } else if (!th.taken && Math.sin(t * 0.3) > -0.6) {
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(x, Math.round(th.y ?? 0), 4, 4);
            ctx.fillStyle = '#fff3c4';
            ctx.fillRect(x + 1, Math.round(th.y ?? 0) + 1, 1, 2);
          }
        }
  
        // runner
        const sprite = RUNNER[onGround ? Math.floor(t / 6) % 2 : 0];
        const py = Math.round(player.y);
        sprite.forEach((row, ry) =>
          row.split('').forEach((ch, rx) => {
            if (PAL[ch]) {
              ctx.fillStyle = PAL[ch];
              ctx.fillRect(32 + rx, py + ry, 1, 1);
            }
          }),
        );
  
        // HUD
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textBaseline = 'top';
        // kept inside the centre 120px so nothing is cropped on squarer (phone) screens
        ctx.fillStyle = '#e8ffff';
        ctx.fillText(`1UP ${String(score).padStart(6, '0')}`, 40, 6);
        if (Math.floor(t / 30) % 2 === 0) {
          ctx.fillStyle = '#ffd166';
          ctx.fillText('DEMO PLAY', 44, 106);
        }
  
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      stopFn = () => cancelAnimationFrame(raf);
  },
  stop() {
    stopFn?.();
    stopFn = null;
  },
};
