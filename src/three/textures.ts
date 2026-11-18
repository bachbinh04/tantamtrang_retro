import * as THREE from 'three';

/**
 * Procedural textures, drawn once into small canvases — no image downloads.
 */
function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

export function woodTexture() {
  return canvasTexture(512, 256, (g, w, h) => {
    const r = rng(7);
    g.fillStyle = '#6a4127';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const wave = Math.sin(y * 0.09) * 0.5 + Math.sin(y * 0.31 + 2) * 0.3;
      const l = 30 + wave * 7 + r() * 4;
      g.fillStyle = `hsl(24, 42%, ${l}%)`;
      g.fillRect(0, y, w, 1);
    }
    g.globalAlpha = 0.22;
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = r() > 0.5 ? '#3d2414' : '#8a5a36';
      g.lineWidth = 0.6 + r() * 1.4;
      g.beginPath();
      const y0 = r() * h;
      g.moveTo(0, y0);
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y0 + Math.sin(x * 0.02 + i) * 3 + (r() - 0.5) * 1.5);
      g.stroke();
    }
    g.globalAlpha = 1;
  });
}

export function carpetTexture() {
  return canvasTexture(
    256,
    256,
    (g, w, h) => {
      const r = rng(11);
      g.fillStyle = '#26363f';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const v = r();
        g.fillStyle = v > 0.5 ? `rgba(120,150,165,${0.08 + r() * 0.1})` : `rgba(5,10,14,${0.15 + r() * 0.2})`;
        g.fillRect(r() * w, r() * h, 1 + r(), 1 + r());
      }
    },
    [10, 10],
  );
}

export function wallpaperTexture() {
  return canvasTexture(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = '#6d8a90';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.05)';
      for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 14, h);
      g.fillStyle = 'rgba(30,50,58,0.28)';
      for (let y = 8; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) g.fillRect(x + 7, y, 2, 2);
    },
    [14, 7],
  );
}

export function grilleTexture() {
  return canvasTexture(256, 64, (g, w, h) => {
    g.fillStyle = '#6f6a60';
    g.fillRect(0, 0, w, h);
    for (let y = 4; y < h - 2; y += 5) {
      g.fillStyle = '#1b1a18';
      g.fillRect(2, y, w - 4, 2.4);
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.fillRect(2, y + 2.4, w - 4, 0.8);
    }
  });
}

export function textTexture(text: string, color = '#c9c3b6', font = '700 46px Orbitron, sans-serif', w = 512, h = 96) {
  return canvasTexture(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.font = font;
    g.fillStyle = color;
    g.textBaseline = 'middle';
    g.fillText(text, 6, h / 2);
  });
}

/** Original synthwave poster art. */
export function posterTexture() {
  return canvasTexture(256, 320, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, '#120a2a');
    sky.addColorStop(1, '#6a1f5c');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    for (let y = -46; y < 46; y++) {
      if (y > 6 && (y + 46) % 9 < 3) continue;
      const half = Math.sqrt(46 * 46 - y * y);
      g.fillStyle = y < -10 ? '#ffd166' : y < 14 ? '#ffb36b' : '#f15c9c';
      g.fillRect(w / 2 - half, 150 + y, half * 2, 1);
    }
    g.fillStyle = '#0d0820';
    g.fillRect(0, 190, w, h - 190);
    g.strokeStyle = 'rgba(241,92,156,0.75)';
    g.lineWidth = 1.2;
    for (let i = -10; i <= 10; i++) {
      g.beginPath();
      g.moveTo(w / 2 + i * 6, 190);
      g.lineTo(w / 2 + i * 40, h);
      g.stroke();
    }
    for (let j = 0; j < 8; j++) {
      const y = 190 + Math.pow(j / 7, 1.8) * (h - 190);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    g.font = '700 22px Orbitron, sans-serif';
    g.fillStyle = '#75f5ff';
    g.textAlign = 'center';
    g.fillText('NIGHT DRIVE', w / 2, 44);
    g.font = '10px "Press Start 2P", monospace';
    g.fillStyle = '#f15c9c';
    g.fillText('1997', w / 2, 66);
  });
}

export function cartLabelTexture(seed: number, a: string, b: string) {
  return canvasTexture(64, 64, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = a;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = r() > 0.5 ? b : '#10182b';
      g.fillRect(Math.floor(r() * 8) * 8, Math.floor(r() * 8) * 8, 8, 8);
    }
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(0, h - 14, w, 14);
    g.fillStyle = '#ffffff';
    g.fillRect(6, h - 9, 30, 3);
  });
}

/** Top face of a controller face button: dark cap with a coloured symbol. */
export function symbolTexture(kind: 'triangle' | 'circle' | 'cross' | 'square', color: string) {
  return canvasTexture(64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(26, 24, 4, 32, 32, 34);
    grad.addColorStop(0, '#55555e');
    grad.addColorStop(1, '#202025');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = color;
    g.lineWidth = 5;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.beginPath();
    if (kind === 'triangle') {
      g.moveTo(32, 16);
      g.lineTo(47, 43);
      g.lineTo(17, 43);
      g.closePath();
    } else if (kind === 'circle') g.arc(32, 32, 14, 0, Math.PI * 2);
    else if (kind === 'square') g.rect(18, 18, 28, 28);
    else {
      g.moveTo(19, 19);
      g.lineTo(45, 45);
      g.moveTo(45, 19);
      g.lineTo(19, 45);
    }
    g.stroke();
  });
}

/** Worn attic floorboards (planks run along the texture's v axis). */
export function planksTexture(repeat: [number, number] = [3, 3], tone = 0) {
  return canvasTexture(
    1024,
    1024,
    (g, w, h) => {
      const r = rng(97 + tone);
      const planks = 8;
      const pw = w / planks;
      for (let p = 0; p < planks; p++) {
        const x0 = p * pw;
        const l = 15 + r() * 9 - tone;
        const hue = 22 + r() * 8;
        g.fillStyle = `hsl(${hue}, 32%, ${l}%)`;
        g.fillRect(x0, 0, pw, h);
        // grain
        g.globalAlpha = 0.3;
        for (let i = 0; i < 26; i++) {
          g.strokeStyle = r() > 0.5 ? `hsl(${hue}, 30%, ${l - 6}%)` : `hsl(${hue}, 30%, ${l + 6}%)`;
          g.lineWidth = 0.6 + r() * 1.6;
          const gx = x0 + r() * pw;
          g.beginPath();
          g.moveTo(gx, 0);
          for (let y = 0; y <= h; y += 32) g.lineTo(gx + Math.sin(y * 0.01 + i) * 4 + (r() - 0.5) * 2, y);
          g.stroke();
        }
        g.globalAlpha = 1;
        // knots, nails, scuffs
        for (let k = 0; k < 2; k++) {
          if (r() > 0.55) {
            g.fillStyle = `hsla(${hue}, 35%, ${l - 9}%, 0.8)`;
            g.beginPath();
            g.ellipse(x0 + pw * (0.3 + r() * 0.4), r() * h, 4 + r() * 5, 9 + r() * 10, 0, 0, Math.PI * 2);
            g.fill();
          }
        }
        const joint = r() * h;
        g.fillStyle = 'rgba(0,0,0,0.75)';
        g.fillRect(x0, joint, pw, 3);
        g.fillStyle = 'rgba(20,14,10,0.9)';
        for (const ny of [joint - 14, joint + 16]) {
          g.fillRect(x0 + pw * 0.25, ny, 4, 4);
          g.fillRect(x0 + pw * 0.72, ny, 4, 4);
        }
        // seam
        g.fillStyle = 'rgba(0,0,0,0.85)';
        g.fillRect(x0, 0, 3, h);
      }
      // dust & wear
      for (let i = 0; i < 5000; i++) {
        g.fillStyle = r() > 0.5 ? 'rgba(255,230,200,0.035)' : 'rgba(0,0,0,0.08)';
        g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
      }
    },
    repeat,
  );
}

export function cardboardTexture() {
  return canvasTexture(128, 128, (g, w, h) => {
    const r = rng(5);
    g.fillStyle = '#7a5a36';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(255,220,160,0.06)' : 'rgba(40,25,10,0.1)';
      g.fillRect(r() * w, r() * h, 1, 1);
    }
    g.fillStyle = 'rgba(200,180,140,0.35)';
    g.fillRect(0, h * 0.46, w, h * 0.08); // packing tape
  });
}

/** Lava-lamp glass: hot pink at the bottom fading to orange-red up top. */
export function lavaTexture() {
  return canvasTexture(64, 256, (g, w, h) => {
    const lin = g.createLinearGradient(0, h, 0, 0);
    lin.addColorStop(0, '#ff2d7a');
    lin.addColorStop(0.5, '#ff4f6b');
    lin.addColorStop(1, '#ff8a4a');
    g.fillStyle = lin;
    g.fillRect(0, 0, w, h);
  });
}

/** Alpha ramp for fake light beams: opaque at the source (v = 1), clear at the far end. */
export function fadeTexture() {
  return canvasTexture(4, 128, (g, w, h) => {
    const lin = g.createLinearGradient(0, 0, 0, h);
    lin.addColorStop(0, '#ffffff');
    lin.addColorStop(1, '#000000');
    g.fillStyle = lin;
    g.fillRect(0, 0, w, h);
  });
}

/** Diagonal glass glare for the CRT (additive, mostly black = invisible). */
export function glareTexture() {
  return canvasTexture(256, 192, (g, w, h) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);
    const lin = g.createLinearGradient(0, 0, w * 0.55, h * 0.7);
    lin.addColorStop(0, 'rgba(255,255,255,0.16)');
    lin.addColorStop(0.45, 'rgba(255,255,255,0.04)');
    lin.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lin;
    g.fillRect(0, 0, w, h);
    const rad = g.createRadialGradient(w * 0.28, h * 0.16, 2, w * 0.28, h * 0.16, w * 0.3);
    rad.addColorStop(0, 'rgba(255,255,255,0.12)');
    rad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rad;
    g.fillRect(0, 0, w, h);
  });
}

/** Night sky + distant city behind the window. */
export function nightTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    const r = rng(23);
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#071433');
    sky.addColorStop(0.6, '#163a8a');
    sky.addColorStop(1, '#3a6fe0');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#0a1532';
    let x = 0;
    while (x < w) {
      const bw = 12 + r() * 26;
      const bh = 30 + r() * 80;
      g.fillRect(x, h - bh, bw, bh);
      for (let wy = h - bh + 6; wy < h - 4; wy += 8)
        for (let wx = x + 3; wx < x + bw - 4; wx += 6)
          if (r() > 0.6) {
            g.fillStyle = r() > 0.5 ? '#ffd9a0' : '#9fd0ff';
            g.fillRect(wx, wy, 2, 3);
            g.fillStyle = '#0a1532';
          }
      x += bw + 2;
    }
  });
}
