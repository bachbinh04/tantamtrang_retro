import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Action } from '../systems/input';
import { fadeTexture, lavaTexture } from './textures';
import { contactShadow, gameLabelTexture, knurlTexture, PAD_FACE, padFaceTexture, plasticMat, socketTexture } from './detailTextures';

/** Floor props for the attic scene, modelled for close-up realism. All sit on y = 0. */

const shadowy = <T extends THREE.Object3D>(o: T) => {
  o.traverse((c) => {
    const mesh = c as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.Material & { alphaMap?: THREE.Texture | null };
    if (!Array.isArray(mat) && mat.alphaMap) return; // contact-shadow decals don't cast
    c.castShadow = true;
    c.receiveShadow = true;
  });
  return o;
};
const cast = <T extends THREE.Object3D>(o: T) => {
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
};

const rubberBlack = () => new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.78 });
const metalDark = (color = 0x2b2b2e, roughness = 0.32) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.85 });

// ===================================================================== pad
export interface BrickPad {
  group: THREE.Group;
  buttons: Map<Action, THREE.Object3D>;
  plug: THREE.Vector3; // local point where the cord leaves the far edge
}

/**
 * Rectangular 8-bit controller matching the reference photo: light-grey body,
 * black face plate framed in grey, black D-pad, grey stripes with two rubber
 * SELECT/START pills, and two red buttons in light-grey square wells.
 * Variants only change how yellowed/dusty the grey plastic is.
 */
let faceTex: THREE.Texture | null = null;
export function buildBrickPad(variant: 'cream' | 'grey' | 'dark' = 'grey'): BrickPad {
  const g = new THREE.Group();
  const buttons = new Map<Action, THREE.Object3D>();
  const tint = { cream: 0xc2baa6, grey: 0xbab7b0, dark: 0xaaa79f }[variant];

  const W = 0.12;
  const D = 0.054;
  const H = 0.016;
  const body = cast(new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 4, 0.0028), plasticMat(tint, 0.58)));
  body.position.y = H / 2;
  g.add(body);
  // seam line where the two shell halves meet
  const seam = new THREE.Mesh(new THREE.BoxGeometry(W + 0.0004, 0.0006, D + 0.0004), new THREE.MeshStandardMaterial({ color: 0x7d7a74, roughness: 0.8 }));
  seam.position.y = H * 0.42;
  g.add(seam);

  // black face plate
  faceTex ??= padFaceTexture();
  const plateSide = new THREE.MeshStandardMaterial({ color: 0x141415, roughness: 0.5 });
  const plateTop = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.62, metalness: 0, envMapIntensity: 0.35 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(PAD_FACE.W, 0.0007, PAD_FACE.D), [plateSide, plateSide, plateTop, plateSide, plateSide, plateSide]);
  plate.position.y = H + 0.00005;
  plate.receiveShadow = true;
  g.add(plate);
  const top = H + 0.0004;

  const reg = (a: Action, o: THREE.Object3D) => {
    o.userData = { action: a, rest: o.position.y, axis: 'y' };
    buttons.set(a, o);
    g.add(o);
  };
  // invisible, oversized hit targets so buttons are easy to click / tap
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const addHit = (o: THREE.Object3D, geo: THREE.BufferGeometry, offset = new THREE.Vector3()) => {
    const h = new THREE.Mesh(geo, hitMat);
    h.position.copy(offset);
    o.add(h);
  };

  // D-pad: four arms + hub, slightly glossy black
  const dMat = new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.32 });
  const dc = new THREE.Vector3(-0.0385, top, 0.002);
  const arm = 0.0079;
  const hub = cast(new THREE.Mesh(new RoundedBoxGeometry(arm, 0.0042, arm, 2, 0.0008), dMat));
  hub.position.set(dc.x, top + 0.0021, dc.z);
  g.add(hub);
  const dimple = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.0004, 20), new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.5 }));
  dimple.position.set(dc.x, top + 0.0043, dc.z);
  g.add(dimple);
  (
    [
      ['up', 0, -1],
      ['down', 0, 1],
      ['left', -1, 0],
      ['right', 1, 0],
    ] as [Action, number, number][]
  ).forEach(([a, dx, dz]) => {
    const m = cast(new THREE.Mesh(new RoundedBoxGeometry(dx ? arm * 1.02 : arm, 0.0042, dz ? arm * 1.02 : arm, 2, 0.0009), dMat));
    m.position.set(dc.x + dx * arm, top + 0.0021, dc.z + dz * arm);
    // embossed direction arrow
    const tri = new THREE.Mesh(new THREE.CircleGeometry(0.0016, 3), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.6 }));
    tri.rotation.x = -Math.PI / 2;
    tri.rotation.z = Math.atan2(-dz, dx); // point outward
    tri.position.set(dx * 0.0012, 0.00215, dz * 0.0012);
    m.add(tri);
    addHit(m, new THREE.BoxGeometry(0.0125, 0.012, 0.0125), new THREE.Vector3(dx * 0.003, 0.003, dz * 0.003));
    reg(a, m);
  });

  // rubber SELECT / START pills
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1a1a1b, roughness: 0.82 });
  (
    [
      ['select', -0.011],
      ['start', 0.003],
    ] as [Action, number][]
  ).forEach(([a, x]) => {
    const pill = cast(new THREE.Mesh(new THREE.CapsuleGeometry(0.0016, 0.0058, 4, 12), rubber));
    pill.rotation.z = Math.PI / 2;
    pill.scale.set(0.72, 1, 1); // flatter, like a rubber key
    pill.position.set(x, top + 0.0011, 0.0045);
    // (pill is rotated 90° about z: local y = world x)
    addHit(pill, new THREE.BoxGeometry(0.016, 0.0135, 0.013));
    reg(a, pill);
  });

  // red B (back) and A (confirm)
  const red = new THREE.MeshStandardMaterial({ color: 0xc8262d, roughness: 0.34, metalness: 0.02 });
  (
    [
      ['back', 0.0215],
      ['confirm', 0.0425],
    ] as [Action, number][]
  ).forEach(([a, x]) => {
    const b = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.0056, 0.0059, 0.0042, 40), red));
    b.position.set(x, top + 0.0021, 0.0025);
    // slightly concave top
    const dish = new THREE.Mesh(new THREE.CircleGeometry(0.0045, 32), new THREE.MeshStandardMaterial({ color: 0xa81d24, roughness: 0.45 }));
    dish.rotation.x = -Math.PI / 2;
    dish.position.y = 0.00212;
    b.add(dish);
    addHit(b, new THREE.CylinderGeometry(0.0105, 0.0105, 0.012, 20), new THREE.Vector3(0, 0.003, 0));
    reg(a, b);
  });

  // cord strain relief on the far edge (left of centre, like the original)
  const relief = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0042, 0.012, 16), rubberBlack()));
  relief.rotation.x = Math.PI / 2;
  relief.position.set(-0.03, H * 0.5, -D / 2 - 0.005);
  g.add(relief);

  g.add(contactShadow(0.15, 0.08, 0.8));
  return { group: g, buttons, plug: new THREE.Vector3(-0.03, H * 0.5, -D / 2 - 0.011) };
}

// =============================================================== cartridge
/** Grey game cartridge lying flat (label up); ridged grip at the far end. */
export function buildCartridge(seed: number, a: string, b: string, shellColor = 0x8f8e8b) {
  const g = new THREE.Group();
  const W = 0.12;
  const T = 0.02;
  const L = 0.133;
  const shellMat = plasticMat(shellColor, 0.62);
  const shell = cast(new THREE.Mesh(new RoundedBoxGeometry(W, T, L, 3, 0.0028), shellMat));
  shell.position.y = T / 2;
  g.add(shell);

  // label recess frame + label
  const recess = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.0006, 0.095), plasticMat(shellColor - 0x101010, 0.7));
  recess.position.set(0, T + 0.0001, 0.012);
  g.add(recess);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.092, 0.089), new THREE.MeshStandardMaterial({ map: gameLabelTexture(seed, a, b), roughness: 0.38 }));
  label.rotation.x = -Math.PI / 2;
  label.position.set(0, T + 0.0005, 0.012);
  g.add(label);

  // grip ridges at the far end
  for (let i = 0; i < 7; i++) {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.0012, 0.0016), shellMat);
    ridge.position.set(0, T + 0.0004, -0.045 - i * 0.0034);
    g.add(ridge);
  }
  // edge connector slot + side grooves
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.094, 0.009, 0.0016), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.6 }));
  slot.position.set(0, T / 2, L / 2 + 0.0002);
  g.add(slot);
  for (const sx of [-1, 1]) {
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.0008, 0.003, L * 0.8), new THREE.MeshStandardMaterial({ color: 0x4a4a4a }));
    groove.position.set((sx * W) / 2 + sx * 0.0002, T * 0.55, 0);
    g.add(groove);
  }
  g.add(contactShadow(0.15, 0.16, 0.7));
  return g;
}

// ================================================================= console
/** Generic 80s top-loading console (no branding) with a cartridge pushed in. */
export function buildConsole() {
  const g = new THREE.Group();
  const lower = plasticMat(0x2c2c2f, 0.6);
  const upper = plasticMat(0x8e8c88, 0.55);
  const dark = new THREE.MeshStandardMaterial({ color: 0x0f0f10, roughness: 0.6 });

  const base = cast(new THREE.Mesh(new RoundedBoxGeometry(0.27, 0.048, 0.2, 4, 0.006), lower));
  base.position.y = 0.026;
  const cover = cast(new THREE.Mesh(new RoundedBoxGeometry(0.262, 0.02, 0.192, 4, 0.006), upper));
  cover.position.y = 0.058;
  g.add(base, cover);

  // moulded grooves on the cover
  for (let i = 0; i < 3; i++) {
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.0012, 0.0018), dark);
    groove.position.set(0, 0.0683, 0.055 + i * 0.008);
    g.add(groove);
  }

  // cartridge slot with a raised bezel
  const bezel = cast(new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.008, 0.042, 2, 0.003), lower));
  bezel.position.set(0, 0.07, -0.03);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.128, 0.004, 0.026), dark);
  slot.position.set(0, 0.0745, -0.03);
  g.add(bezel, slot);
  const cart = buildCartridge(3, '#3d7be0', '#ffb36b', 0x8a8986);
  cart.children.forEach((c) => {
    if ((c as THREE.Mesh).material && ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).alphaMap) c.visible = false;
  });
  cart.rotation.x = Math.PI / 2; // stand it up, label facing the front
  cart.position.set(0, 0.125, -0.04);
  g.add(cart);

  // POWER / RESET buttons, LED
  for (const [x, w] of [
    [-0.085, 0.032],
    [-0.045, 0.032],
  ]) {
    const btn = cast(new THREE.Mesh(new RoundedBoxGeometry(w, 0.007, 0.014, 2, 0.002), plasticMat(0x5d5c59, 0.5)));
    btn.position.set(x, 0.0705, 0.07);
    g.add(btn);
  }
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 10, 8), new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff1f1f, emissiveIntensity: 4 }));
  led.position.set(-0.112, 0.0685, 0.07);
  g.add(led);

  // two controller ports on the front face
  for (const x of [-0.04, 0.04]) {
    const port = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.017, 0.004, 2, 0.002), dark);
    port.position.set(x, 0.026, 0.1015);
    const pins = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 0.001), metalDark(0x8a7a50, 0.4));
    pins.position.set(x, 0.026, 0.1035);
    g.add(port, pins);
  }
  // side vents
  for (let i = 0; i < 8; i++) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.0012, 0.022, 0.006), dark);
    v.position.set(0.1355, 0.026, -0.06 + i * 0.012);
    g.add(v);
  }
  // rubber feet
  for (const [x, z] of [
    [-0.11, -0.08],
    [0.11, -0.08],
    [-0.11, 0.08],
    [0.11, 0.08],
  ]) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.002, 12), rubberBlack());
    f.position.set(x, 0.001, z);
    g.add(f);
  }
  g.add(contactShadow(0.36, 0.3, 0.85));
  return shadowy(g);
}

// =============================================================== lava lamp
export function buildLavaLamp() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a1424, roughness: 0.26, metalness: 0.92 });
  const baseProfile = [new THREE.Vector2(0, 0), new THREE.Vector2(0.074, 0), new THREE.Vector2(0.075, 0.006), new THREE.Vector2(0.06, 0.05), new THREE.Vector2(0.042, 0.12), new THREE.Vector2(0.036, 0.13), new THREE.Vector2(0, 0.13)];
  const base = cast(new THREE.Mesh(new THREE.LatheGeometry(baseProfile, 48), metal));
  const capProfile = [new THREE.Vector2(0.034, 0), new THREE.Vector2(0.03, 0.035), new THREE.Vector2(0.016, 0.065), new THREE.Vector2(0, 0.068)];
  const cap = cast(new THREE.Mesh(new THREE.LatheGeometry(capProfile, 48), metal));
  cap.position.y = 0.36;
  g.add(base, cap);

  // coloured liquid (self-lit) + clear glass shell for reflections
  const liquidProfile = [new THREE.Vector2(0.034, 0), new THREE.Vector2(0.048, 0.06), new THREE.Vector2(0.044, 0.15), new THREE.Vector2(0.032, 0.23)];
  const liquid = new THREE.Mesh(new THREE.LatheGeometry(liquidProfile, 48), new THREE.MeshBasicMaterial({ map: lavaTexture(), transparent: true, opacity: 0.9, fog: false }));
  liquid.position.y = 0.13;
  const shellProfile = liquidProfile.map((p) => new THREE.Vector2(p.x + 0.0025, p.y));
  const shell = new THREE.Mesh(
    new THREE.LatheGeometry(shellProfile, 48),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false }),
  );
  shell.position.y = 0.13;
  g.add(liquid, shell);

  // wax: a pool at the bottom and a few rising blobs
  const wax = new THREE.MeshBasicMaterial({ color: 0xff9a5c, fog: false });
  const pool = new THREE.Mesh(new THREE.SphereGeometry(0.036, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), wax);
  pool.scale.y = 0.45;
  pool.position.y = 0.132;
  g.add(pool);
  [
    [0.004, 0.2, 0.0, 0.017, 1.5],
    [-0.008, 0.26, 0.006, 0.012, 1.3],
    [0.006, 0.31, -0.004, 0.009, 1.2],
    [-0.003, 0.17, -0.006, 0.01, 1.1],
  ].forEach(([x, y, z, r, sy]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), wax);
    b.scale.set(1, sy, 1);
    b.position.set(x, y, z);
    g.add(b);
  });

  const light = new THREE.PointLight(0xff2f74, 1.9, 0, 1.8);
  light.position.set(0, 0.26, 0.05);
  g.add(light);
  g.add(contactShadow(0.2, 0.2, 0.6));
  return { group: g, light };
}

// ============================================================== flashlight
/** Metal torch lying on the floor, casting a visible cool beam. */
export function buildFlashlight(target: THREE.Vector3) {
  const g = new THREE.Group();
  const knurl = knurlTexture();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x232326, roughness: 0.38, metalness: 0.8, bumpMap: knurl, bumpScale: 0.6 });
  const body = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.0135, 0.12, 28), bodyMat));
  body.rotation.z = Math.PI / 2;
  const tail = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.012, 28), metalDark(0x1a1a1c, 0.25)));
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -0.064;
  const switchBtn = cast(new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.004, 0.009, 2, 0.0015), rubberBlack()));
  switchBtn.position.set(0.02, 0.0145, 0);
  // flared head
  const headProfile = [new THREE.Vector2(0.0145, 0), new THREE.Vector2(0.016, 0.01), new THREE.Vector2(0.022, 0.03), new THREE.Vector2(0.023, 0.036), new THREE.Vector2(0.019, 0.037)];
  const head = cast(new THREE.Mesh(new THREE.LatheGeometry(headProfile, 32), metalDark(0x2c2c30, 0.22)));
  head.rotation.z = -Math.PI / 2;
  head.position.x = 0.058;
  const reflector = new THREE.Mesh(new THREE.TorusGeometry(0.0175, 0.0025, 10, 32), metalDark(0xd8d8d8, 0.12));
  reflector.rotation.y = Math.PI / 2;
  reflector.position.x = 0.0945;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.0165, 28), new THREE.MeshBasicMaterial({ color: 0xf4fbff }));
  lens.rotation.y = Math.PI / 2;
  lens.position.x = 0.0948;
  g.add(body, tail, switchBtn, head, reflector, lens);
  g.position.y = 0.0145;
  const shadow = contactShadow(0.17, 0.05, 0.7);
  shadow.position.set(0.01, -0.0133, 0);
  g.add(shadow);

  return {
    group: g,
    aim: (worldPos: THREE.Vector3, scene: THREE.Object3D) => {
      const dir = target.clone().sub(worldPos);
      g.rotation.y = Math.atan2(-dir.z, dir.x);
      const lensWorld = new THREE.Vector3(0.096, 0.0145, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y).add(new THREE.Vector3(worldPos.x, 0, worldPos.z));

      const spot = new THREE.SpotLight(0xdff2ff, 14, 0, 0.42, 0.55, 1.6);
      spot.position.copy(lensWorld);
      spot.target.position.copy(target);
      spot.castShadow = true;
      spot.shadow.mapSize.set(1024, 1024);
      spot.shadow.bias = -0.0012;
      spot.shadow.normalBias = 0.002;
      scene.add(spot, spot.target);

      const len = lensWorld.distanceTo(target) * 1.25;
      const coneGeo = new THREE.CylinderGeometry(0.016, len * Math.tan(0.42), len, 32, 1, true);
      coneGeo.translate(0, -len / 2, 0);
      const beam = new THREE.Mesh(
        coneGeo,
        new THREE.MeshBasicMaterial({ color: 0xcfe6ff, alphaMap: fadeTexture(), transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
      );
      beam.position.copy(lensWorld);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), target.clone().sub(lensWorld).normalize());
      scene.add(beam);
      return spot;
    },
  };
}

// ============================================================= power strip
export function buildPowerStrip() {
  const g = new THREE.Group();
  const white = plasticMat(0xdcd8ce, 0.48);
  const strip = cast(new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.036, 0.062, 3, 0.009), white));
  strip.position.y = 0.018;
  g.add(strip);
  const sockTex = socketTexture();
  const plugMat = plasticMat(0x161618, 0.45);
  for (let i = 0; i < 4; i++) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.038, 0.038), new THREE.MeshStandardMaterial({ map: sockTex, roughness: 0.55 }));
    face.rotation.x = -Math.PI / 2;
    face.position.set(-0.09 + i * 0.06, 0.0362, 0);
    g.add(face);
    if (i < 3) {
      const plug = cast(new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.03, 0.032, 3, 0.006), plugMat));
      plug.position.set(-0.09 + i * 0.06, 0.051, 0);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.031, 0.002, 0.024), plasticMat(0x0d0d0e, 0.6));
      grip.position.set(0, 0.008, 0);
      plug.add(grip);
      g.add(plug);
    }
  }
  const sw = new THREE.Mesh(new RoundedBoxGeometry(0.022, 0.009, 0.03, 2, 0.003), new THREE.MeshStandardMaterial({ color: 0xff3020, emissive: 0xff2a10, emissiveIntensity: 1.2, roughness: 0.3 }));
  sw.position.set(0.133, 0.038, 0);
  g.add(sw);
  g.add(contactShadow(0.36, 0.11, 0.7));
  return shadowy(g);
}

// ==================================================================== toys
export function buildToyCube() {
  const g = new THREE.Group();
  const S = 0.054;
  const core = cast(new THREE.Mesh(new RoundedBoxGeometry(S, S, S, 3, 0.004), new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.4 })));
  core.position.y = S / 2;
  g.add(core);
  const faces: [THREE.Vector3, number][] = [
    [new THREE.Vector3(0, 1, 0), 0xf2f2f2],
    [new THREE.Vector3(0, -1, 0), 0xf2c14e],
    [new THREE.Vector3(1, 0, 0), 0xe0533d],
    [new THREE.Vector3(-1, 0, 0), 0xf08a2c],
    [new THREE.Vector3(0, 0, 1), 0x2bb36a],
    [new THREE.Vector3(0, 0, -1), 0x2d6be0],
  ];
  const r = (() => {
    let s = 7;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();
  const all = faces.map(([, c]) => c);
  for (const [n, c] of faces) {
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const color = r() > 0.55 ? all[Math.floor(r() * all.length)] : c; // scrambled
        const st = new THREE.Mesh(new RoundedBoxGeometry(0.0155, 0.0155, 0.0012, 1, 0.0015), new THREE.MeshStandardMaterial({ color, roughness: 0.32 }));
        st.lookAt(n);
        const u = Math.abs(n.y) > 0.5 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const v = new THREE.Vector3().crossVectors(n, u);
        st.position.copy(n.clone().multiplyScalar(S / 2 + 0.0004)).addScaledVector(u, i * 0.0177).addScaledVector(v, j * 0.0177);
        st.position.y += S / 2;
        g.add(st);
      }
  }
  g.add(contactShadow(0.08, 0.08, 0.7));
  return shadowy(g);
}

export function buildRobotToy() {
  const g = new THREE.Group();
  const white = plasticMat(0xe6e4df, 0.42);
  const grey = plasticMat(0x8a8d93, 0.45);
  const visor = new THREE.MeshStandardMaterial({ color: 0x0e1014, roughness: 0.12, metalness: 0.5 });
  const legs = cast(new THREE.Mesh(new RoundedBoxGeometry(0.032, 0.03, 0.02, 2, 0.004), grey));
  legs.position.y = 0.015;
  const torso = cast(new THREE.Mesh(new RoundedBoxGeometry(0.042, 0.036, 0.028, 3, 0.006), white));
  torso.position.y = 0.048;
  const chest = new THREE.Mesh(new THREE.CircleGeometry(0.006, 20), new THREE.MeshStandardMaterial({ color: 0x113344, emissive: 0x2bd4ff, emissiveIntensity: 1.5 }));
  chest.position.set(0, 0.05, 0.0142);
  const head = cast(new THREE.Mesh(new RoundedBoxGeometry(0.032, 0.026, 0.027, 3, 0.007), white));
  head.position.y = 0.081;
  const eye = new THREE.Mesh(new RoundedBoxGeometry(0.024, 0.009, 0.002, 2, 0.002), visor);
  eye.position.set(0, 0.083, 0.0137);
  const antenna = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.001, 0.014, 6), grey));
  antenna.position.set(0.008, 0.1, 0);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff3a3a, emissive: 0xff2020, emissiveIntensity: 1 }));
  tip.position.set(0.008, 0.108, 0);
  g.add(legs, torso, chest, head, eye, antenna, tip);
  for (const sx of [-1, 1]) {
    const a = cast(new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, 0.022, 4, 10), grey));
    a.position.set(sx * 0.027, 0.046, 0);
    a.rotation.z = sx * 0.15;
    g.add(a);
  }
  g.add(contactShadow(0.07, 0.05, 0.7));
  return g;
}

/** Wooden crate (TV stand). */
export function buildCrate(w: number, h: number, d: number, wood: THREE.Material) {
  const g = new THREE.Group();
  const t = 0.018;
  const slats = Math.max(2, Math.round(h / 0.1));
  for (const side of [-1, 1]) {
    for (let i = 0; i < slats; i++) {
      const sh = h / slats - 0.008;
      const front = new THREE.Mesh(new THREE.BoxGeometry(w, sh, t), wood);
      front.position.set(0, i * (h / slats) + sh / 2 + 0.004, (side * (d - t)) / 2);
      const end = new THREE.Mesh(new THREE.BoxGeometry(t, sh, d - 2 * t), wood);
      end.position.set((side * (w - t)) / 2, i * (h / slats) + sh / 2 + 0.004, 0);
      g.add(front, end);
      // nail heads
      for (const nx of [-1, 1]) {
        const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.001, 8), metalDark(0x3a3530, 0.5));
        nail.rotation.x = Math.PI / 2;
        nail.position.set((nx * (w - 0.04)) / 2, i * (h / slats) + sh / 2 + 0.004, (side * d) / 2 + side * 0.0005);
        g.add(nail);
      }
    }
  }
  const lid = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), wood);
  lid.position.y = h - t / 2;
  g.add(lid);
  for (const x of [-1, 1])
    for (const z of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, h, 0.03), wood);
      post.position.set((x * (w - 0.03)) / 2, h / 2, (z * (d - 0.03)) / 2);
      g.add(post);
    }
  g.add(contactShadow(w * 1.25, d * 1.3, 0.85));
  return shadowy(g);
}

/** A few cartridges in a loose pile. */
export function cartridgePile(seeds: [number, string, string][]) {
  const g = new THREE.Group();
  seeds.forEach(([seed, a, b], i) => {
    const c = buildCartridge(seed, a, b, i % 2 ? 0x5a5a5e : 0x8f8e8b);
    c.position.set((i % 2) * 0.03 - 0.015, i * 0.0202, (i % 3) * 0.012);
    c.rotation.y = (i - 1) * 0.35;
    if (i > 0) c.children[c.children.length - 1].visible = false; // only the bottom one casts a floor shadow
    g.add(c);
  });
  return g;
}
