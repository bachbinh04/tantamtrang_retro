import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { glareTexture, grilleTexture, textTexture } from './textures';

/**
 * 80s/90s bedroom CRT like the reference shot: grey plastic box, tapered tube
 * housing at the back, a dark bezel around a rounded convex screen on the left,
 * and a control column on the right (two channel knobs, vertical speaker slats,
 * small buttons, power switch + LED).
 *
 * Local space: origin at the bottom-centre of the front face, +z toward the viewer.
 */
export const TV = {
  W: 0.7,
  H: 0.48,
  D: 0.44,
  FEET: 0.012,
  SCREEN_W: 0.46,
  SCREEN_H: 0.345,
};
/** screen centre in TV local space */
export const SCREEN_X = -TV.W / 2 + 0.05 + TV.SCREEN_W / 2;
export const SCREEN_Y = TV.FEET + TV.H - 0.05 - TV.SCREEN_H / 2;
/** z of the bezel's front lip (extrude depth 0.012 + bevel 0.006); the HTML screen maps onto this plane */
export const BEZEL_FRONT = 0.018;

export type TvAction = 'up' | 'down' | 'sound' | 'back' | 'power';

export interface TVModel {
  group: THREE.Group;
  screen: THREE.Mesh;
  screenMat: THREE.MeshBasicMaterial;
  buttons: THREE.Mesh[];
  ledMat: THREE.MeshStandardMaterial;
}

export function roundedRect(path: THREE.Shape | THREE.Path, cx: number, cy: number, w: number, h: number, r: number) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

export function buildTV(): TVModel {
  const g = new THREE.Group();
  g.name = 'tv';
  const { W, H, D, FEET, SCREEN_W, SCREEN_H } = TV;
  const sx = SCREEN_X;
  const sy = SCREEN_Y;

  const plastic = new THREE.MeshStandardMaterial({ color: 0x8b8d90, roughness: 0.5, metalness: 0.12 });
  const plasticDark = new THREE.MeshStandardMaterial({ color: 0x55575b, roughness: 0.65 });
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.5 });
  const knobMat = new THREE.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.4, metalness: 0.2 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xb9bcc0, roughness: 0.25, metalness: 0.85 });

  // main box
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 5, 0.03), plastic);
  body.position.set(0, FEET + H / 2, -D / 2);
  body.castShadow = body.receiveShadow = true;
  g.add(body);

  // tapered tube housing (square frustum), narrow end to the back
  const rearGeo = new THREE.CylinderGeometry(0.16, 0.3, 0.3, 4, 1);
  rearGeo.rotateX(-Math.PI / 2);
  rearGeo.rotateZ(Math.PI / 4);
  rearGeo.scale(1.15, 0.85, 1);
  const rear = new THREE.Mesh(rearGeo, plasticDark);
  rear.position.set(sx * 0.5, FEET + H * 0.52, -D - 0.13);
  rear.castShadow = true;
  g.add(rear);
  for (let i = 0; i < 9; i++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.008), bezelMat);
    slot.position.set(0, FEET + H + 0.0005, -0.12 - i * 0.026);
    g.add(slot);
  }

  // bezel ring around the screen, standing proud of the casing
  const outer = roundedRect(new THREE.Shape(), sx, sy, SCREEN_W + 0.064, SCREEN_H + 0.064, 0.04) as THREE.Shape;
  outer.holes.push(roundedRect(new THREE.Path(), sx, sy, SCREEN_W, SCREEN_H, 0.034) as THREE.Path);
  const bezel = new THREE.Mesh(
    new THREE.ExtrudeGeometry(outer, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 12 }),
    bezelMat,
  );
  bezel.castShadow = true;
  g.add(bezel);

  // convex glass (self-lit picture)
  const sg = new THREE.PlaneGeometry(SCREEN_W + 0.016, SCREEN_H + 0.016, 40, 30);
  const pos = sg.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i) / ((SCREEN_W + 0.016) / 2);
    const ny = pos.getY(i) / ((SCREEN_H + 0.016) / 2);
    pos.setZ(i, 0.011 * (1 - nx * nx * 0.9) * (1 - ny * ny * 0.9));
  }
  sg.computeVertexNormals();
  const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const screen = new THREE.Mesh(sg, screenMat);
  screen.position.set(sx, sy, 0.005);
  g.add(screen);
  const glare = new THREE.Mesh(sg.clone(), new THREE.MeshBasicMaterial({ map: glareTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  glare.position.set(sx, sy, 0.0056);
  g.add(glare);

  const brand = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.017),
    new THREE.MeshStandardMaterial({ map: textTexture('NOVA·VISION', '#8a8c90', '700 40px Orbitron, sans-serif'), transparent: true, roughness: 0.6 }),
  );
  brand.position.set(sx - 0.17, sy - SCREEN_H / 2 - 0.016, BEZEL_FRONT + 0.0006);
  g.add(brand);

  // ---- right-hand control column
  const px = (SCREEN_W / 2 + sx + 0.032 + W / 2) / 2 + 0.008; // centre of the column
  const panel = new THREE.Mesh(new RoundedBoxGeometry(0.13, H - 0.07, 0.008, 2, 0.003), new THREE.MeshStandardMaterial({ color: 0x77797d, roughness: 0.55 }));
  panel.position.set(px, FEET + H / 2, 0.003);
  g.add(panel);

  const buttons: THREE.Mesh[] = [];
  const knob = (r: number, y: number, action: TvAction) => {
    const geo = new THREE.CylinderGeometry(r, r * 1.08, 0.022, 32);
    geo.rotateX(Math.PI / 2);
    const k = new THREE.Mesh(geo, knobMat);
    k.position.set(px, y, 0.018);
    k.userData = { tvAction: action, rest: k.position.z, axis: 'z' };
    k.castShadow = true;
    g.add(k);
    // pointer line
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.003, r * 0.8, 0.002), chrome);
    tick.position.set(0, r * 0.4, 0.012);
    k.add(tick);
    buttons.push(k);
  };
  knob(0.024, FEET + H - 0.075, 'up'); // channel
  knob(0.019, FEET + H - 0.145, 'down'); // fine tune

  // vertical speaker slats
  const grilleGeo = new THREE.PlaneGeometry(0.15, 0.09);
  grilleGeo.rotateZ(Math.PI / 2);
  const grille = new THREE.Mesh(grilleGeo, new THREE.MeshStandardMaterial({ map: grilleTexture(), roughness: 0.7 }));
  grille.position.set(px, FEET + 0.19, 0.0075);
  g.add(grille);

  // small push buttons + power switch
  (['sound', 'back'] as TvAction[]).forEach((a, i) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(0.026, 0.014, 0.012, 2, 0.003), knobMat);
    b.position.set(px - 0.033 + i * 0.033, FEET + 0.075, 0.012);
    b.userData = { tvAction: a, rest: b.position.z, axis: 'z' };
    g.add(b);
    buttons.push(b);
  });
  const power = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.02, 0.014, 2, 0.004), chrome);
  power.position.set(px + 0.034, FEET + 0.075, 0.013);
  power.userData = { tvAction: 'power', rest: power.position.z, axis: 'z' };
  g.add(power);
  buttons.push(power);

  const ledMat = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2a2a, emissiveIntensity: 0.6 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 12, 8), ledMat);
  led.position.set(px + 0.034, FEET + 0.045, 0.009);
  g.add(led);

  // AV jacks on the side
  ['#d9b13b', '#e0e0da', '#c4413c'].forEach((c, i) => {
    const j = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.01, 16), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
    j.rotation.z = Math.PI / 2;
    j.position.set(W / 2 + 0.003, FEET + 0.08 + i * 0.022, -0.06);
    g.add(j);
  });

  // feet
  for (const [fx, fz] of [
    [-0.26, -0.05],
    [0.26, -0.05],
    [-0.26, -0.38],
    [0.26, -0.38],
  ]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.06, FEET, 0.05), bezelMat);
    f.position.set(fx, FEET / 2, fz);
    g.add(f);
  }

  return { group: g, screen, screenMat, buttons, ledMat };
}
