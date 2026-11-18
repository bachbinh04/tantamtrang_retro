import * as THREE from 'three';

/**
 * Detail textures for the "make it look real" pass: plastic grain, the
 * controller face plate, cartridge label art, socket faces, knurling and
 * soft contact shadows. All procedural — no image files.
 */
function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** Fine speckle for molded plastic (use as bumpMap, tiled). */
let plasticBumpCache: THREE.Texture | null = null;
export function plasticBump() {
  if (plasticBumpCache) return plasticBumpCache;
  const t = tex(
    256,
    256,
    (g, w, h) => {
      const r = rng(3);
      g.fillStyle = '#808080';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 14000; i++) {
        const v = 110 + r() * 40;
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(r() * w, r() * h, 1, 1);
      }
    },
    false,
  );
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  plasticBumpCache = t;
  return t;
}

/** Plastic material with molded micro-texture and environment reflections. */
export function plasticMat(color: number, roughness = 0.5, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.0, bumpMap: plasticBump(), bumpScale: 0.25, ...extra });
}

// ---------------------------------------------------------------- controller
/**
 * Face plate of the rectangular pad (0.112 × 0.046 m), drawn at 2048×841:
 * black plate · grey stripes · dark well for SELECT/START · two light-grey
 * square wells for the red buttons · red legends. (No brand logo.)
 */
export const PAD_FACE = { W: 0.112, D: 0.046 };
export function padFaceTexture() {
  const W = 2048;
  const H = Math.round((W * PAD_FACE.D) / PAD_FACE.W);
  const mx = (m: number) => ((m + PAD_FACE.W / 2) / PAD_FACE.W) * W; // metres → px (x)
  const mz = (m: number) => ((m + PAD_FACE.D / 2) / PAD_FACE.D) * H; // metres → px (z, top = far edge)
  const s = W / PAD_FACE.W; // px per metre
  return tex(W, H, (g) => {
    // black plate with a faint sheen
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1d1d1f');
    bg.addColorStop(1, '#121213');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    // D-pad shadow well
    g.fillStyle = 'rgba(0,0,0,0.55)';
    const dc = { x: mx(-0.0385), z: mz(0.002) };
    const arm = 0.0082 * s;
    const len = 0.024 * s;
    g.fillRect(dc.x - arm / 2 - 6, dc.z - len / 2 - 6, arm + 12, len + 12);
    g.fillRect(dc.x - len / 2 - 6, dc.z - arm / 2 - 6, len + 12, arm + 12);

    // centre: grey stripes (upper) …
    const cx0 = mx(-0.0205);
    const cx1 = mx(0.0115);
    const stripes = [-0.0185, -0.0145, -0.0105];
    stripes.forEach((z) => {
      const y = mz(z);
      const grad = g.createLinearGradient(0, y, 0, y + 0.0026 * s);
      grad.addColorStop(0, '#b9b6af');
      grad.addColorStop(1, '#9d9a93');
      g.fillStyle = grad;
      g.fillRect(cx0, y, cx1 - cx0, 0.0026 * s);
    });
    // … red legends …
    g.fillStyle = '#c4192b';
    g.font = `700 ${0.0029 * s}px Arial, Helvetica, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('SELECT', mx(-0.011), mz(-0.0045));
    g.fillText('START', mx(0.003), mz(-0.0045));
    // … and the dark grey rounded well holding the two rubber pills
    const wx0 = mx(-0.0195);
    const wx1 = mx(0.0105);
    const wz0 = mz(-0.0015);
    const wz1 = mz(0.0105);
    const rr = 0.0045 * s;
    g.fillStyle = '#3c3c3e';
    g.beginPath();
    g.roundRect(wx0, wz0, wx1 - wx0, wz1 - wz0, rr);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)';
    g.lineWidth = 6;
    g.stroke();
    // lower stripe under the well
    const y4 = mz(0.0135);
    g.fillStyle = '#a9a6a0';
    g.fillRect(cx0, y4, cx1 - cx0, 0.0026 * s);

    // right: two light-grey square wells
    for (const x of [0.0215, 0.0425]) {
      const sz = 0.0168 * s;
      const x0 = mx(x) - sz / 2;
      const z0 = mz(0.0025) - sz / 2;
      const grad = g.createLinearGradient(x0, z0, x0, z0 + sz);
      grad.addColorStop(0, '#d2cfc8');
      grad.addColorStop(1, '#b4b1aa');
      g.fillStyle = grad;
      g.beginPath();
      g.roundRect(x0, z0, sz, sz, 0.0018 * s);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.35)';
      g.lineWidth = 5;
      g.stroke();
    }
    // B / A legends
    g.fillStyle = '#c4192b';
    g.font = `700 ${0.0042 * s}px Arial, Helvetica, sans-serif`;
    g.fillText('B', mx(0.0285), mz(0.0175));
    g.fillText('A', mx(0.0495), mz(0.0175));

    // very fine scuffs
    const r = rng(9);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(255,255,255,${0.015 + r() * 0.03})`;
      g.fillRect(r() * W, r() * H, 1 + r() * 4, 1);
    }
  });
}

// --------------------------------------------------------------- cartridges
const TITLES = ['STAR RUNNER', 'NEON KNIGHT', 'PIXEL QUEST', 'MOON DRIFT', 'CHROME CITY', 'TURBO TAIL', 'DEEP SIGNAL'];
/** Original box-art style label: sky gradient, pixel scenery, title band. */
export function gameLabelTexture(seed: number, a: string, b: string) {
  return tex(256, 256, (g, w, h) => {
    const r = rng(seed);
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0d1030');
    sky.addColorStop(0.65, a);
    sky.addColorStop(1, b);
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    // stars
    for (let i = 0; i < 40; i++) {
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.fillRect(Math.floor(r() * w), Math.floor(r() * h * 0.5), 2, 2);
    }
    // pixel hills / buildings
    g.fillStyle = '#10121e';
    let x = 0;
    while (x < w) {
      const bw = 12 + Math.floor(r() * 24);
      const bh = 30 + Math.floor(r() * 70);
      g.fillRect(x, h - 40 - bh, bw, bh + 40);
      x += bw;
    }
    // hero sprite (blocky)
    const hx = 60 + r() * 120;
    g.fillStyle = b;
    g.fillRect(hx, 120, 24, 30);
    g.fillStyle = '#ffffff';
    g.fillRect(hx + 6, 126, 6, 6);
    // title band
    g.fillStyle = 'rgba(0,0,0,0.75)';
    g.fillRect(0, 0, w, 52);
    g.fillStyle = '#ffffff';
    g.font = '700 26px Orbitron, Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(TITLES[seed % TITLES.length], w / 2, 27);
    // worn edges
    g.strokeStyle = 'rgba(255,255,255,0.25)';
    g.lineWidth = 3;
    g.strokeRect(2, 2, w - 4, h - 4);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(255,255,255,${r() * 0.12})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 3, 1);
    }
  });
}

// ------------------------------------------------------------- misc details
export function socketTexture() {
  return tex(128, 128, (g, w, h) => {
    g.fillStyle = '#dcd8cf';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9c4ba';
    g.beginPath();
    g.arc(w / 2, h / 2, 46, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2a2826';
    g.beginPath();
    g.arc(w / 2 - 16, h / 2, 7, 0, Math.PI * 2);
    g.arc(w / 2 + 16, h / 2, 7, 0, Math.PI * 2);
    g.fill();
  });
}

export function knurlTexture() {
  const t = tex(
    64,
    64,
    (g, w, h) => {
      g.fillStyle = '#808080';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#303030';
      g.lineWidth = 2;
      for (let i = -h; i < w + h; i += 6) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i + h, h);
        g.moveTo(i + h, 0);
        g.lineTo(i, h);
        g.stroke();
      }
    },
    false,
  );
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 2);
  return t;
}

/** Soft radial blob for contact shadows (alpha). */
let shadowTex: THREE.Texture | null = null;
export function contactShadow(w: number, d: number, opacity = 0.75) {
  if (!shadowTex) {
    shadowTex = tex(
      128,
      128,
      (g, W, H) => {
        // alphaMap reads the green channel: white = opaque shadow, black = clear
        g.fillStyle = '#000';
        g.fillRect(0, 0, W, H);
        const grad = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.55, '#8c8c8c');
        grad.addColorStop(1, '#000000');
        g.fillStyle = grad;
        g.fillRect(0, 0, W, H);
      },
      false,
    );
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: shadowTex, transparent: true, opacity, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.0012;
  m.renderOrder = -1;
  return m;
}
