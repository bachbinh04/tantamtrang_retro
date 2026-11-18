import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { cardboardTexture, planksTexture } from './textures';
import { buildCrate } from './propsModel';

/**
 * A dusty attic: worn floorboards, a gable back wall, sloped roof with rafters,
 * a hanging bulb and junk in the shadows. The TV sits on a wooden crate at the
 * origin; its front face is at z = 0 and the floor clutter spreads toward +z.
 */
export const ATTIC = {
  BACK_Z: -1.45,
  HALF_W: 2.4,
  KNEE: 0.65,
  RIDGE: 2.45,
  CRATE_H: 0.26,
  CRATE_FRONT_Z: 0.31,
  CRATE_BACK_Z: -0.55,
};

export function buildAttic() {
  const g = new THREE.Group();
  const { BACK_Z, HALF_W, KNEE, RIDGE } = ATTIC;

  const floorTex = planksTexture([4, 4]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2, 6), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.78 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, BACK_Z + 3);
  floor.receiveShadow = true;
  g.add(floor);

  const wallTex = planksTexture([1, 1], 6);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });

  // gable end wall (UVs = metres, so one plank texture tile per metre)
  const gable = new THREE.Shape();
  gable.moveTo(-HALF_W, 0);
  gable.lineTo(HALF_W, 0);
  gable.lineTo(HALF_W, KNEE);
  gable.lineTo(0, RIDGE);
  gable.lineTo(-HALF_W, KNEE);
  gable.closePath();
  const back = new THREE.Mesh(new THREE.ShapeGeometry(gable), wallMat);
  back.position.z = BACK_Z;
  back.receiveShadow = true;
  g.add(back);

  // knee walls + roof slopes
  const depth = 6;
  for (const side of [-1, 1]) {
    const knee = new THREE.Mesh(new THREE.PlaneGeometry(depth, KNEE), wallMat);
    knee.rotation.y = -side * (Math.PI / 2);
    knee.position.set(side * HALF_W, KNEE / 2, BACK_Z + depth / 2);
    knee.receiveShadow = true;
    g.add(knee);

    const run = HALF_W;
    const rise = RIDGE - KNEE;
    const len = Math.hypot(run, rise);
    // tilt about the ridge (z) axis: right side falls toward +x, left toward -x
    const tilt = side > 0 ? -Math.atan2(rise, run) : Math.atan2(rise, run);
    const holder = new THREE.Group();
    holder.rotation.z = tilt;
    holder.position.set((side * run) / 2, KNEE + rise / 2, BACK_Z + depth / 2);
    const slope = new THREE.Mesh(new THREE.PlaneGeometry(len, depth), new THREE.MeshStandardMaterial({ map: planksTexture([3, 6], 9), roughness: 0.95, side: THREE.DoubleSide }));
    slope.rotation.x = Math.PI / 2;
    holder.add(slope);
    g.add(holder);

    // rafters
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x2c1d12, roughness: 0.85 });
    for (let z = BACK_Z + 0.25; z < BACK_Z + depth; z += 0.6) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.07), beamMat);
      beam.rotation.z = tilt;
      beam.position.set((side * run) / 2, KNEE + rise / 2 - 0.06, z);
      beam.castShadow = true;
      g.add(beam);
    }
  }
  const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, depth), new THREE.MeshStandardMaterial({ color: 0x24170e, roughness: 0.85 }));
  ridgeBeam.position.set(0, RIDGE - 0.07, BACK_Z + depth / 2);
  g.add(ridgeBeam);

  // small dusty window in the gable, faint moonlight
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ color: 0x1c2f55 }));
  win.position.set(-1.05, 1.45, BACK_Z + 0.004);
  g.add(win);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.8 });
  for (const [w, h, x, y] of [
    [0.48, 0.04, -1.05, 1.66],
    [0.48, 0.04, -1.05, 1.24],
    [0.04, 0.46, -1.26, 1.45],
    [0.04, 0.46, -0.84, 1.45],
    [0.03, 0.42, -1.05, 1.45],
    [0.42, 0.03, -1.05, 1.45],
  ]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), frameMat);
    b.position.set(x, y, BACK_Z + 0.015);
    g.add(b);
  }
  const moon = new THREE.SpotLight(0x5b7fd0, 3, 0, 0.5, 0.8, 1.5);
  moon.position.set(-1.05, 1.45, BACK_Z + 0.1);
  moon.target.position.set(-0.4, 0, 0.6);
  g.add(moon, moon.target);

  // hanging bulb (warm practical, back left)
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.55, 6), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  wire.position.set(-0.75, RIDGE - 0.35, -0.85);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
  bulb.position.set(-0.75, RIDGE - 0.66, -0.85);
  const bulbLight = new THREE.PointLight(0xffa458, 1.6, 0, 2);
  bulbLight.position.copy(bulb.position);
  g.add(wire, bulb, bulbLight);

  // ---- junk in the shadows
  const card = new THREE.MeshStandardMaterial({ map: cardboardTexture(), roughness: 0.95 });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, ry: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), card);
    m.position.set(x, y + h / 2, z);
    m.rotation.y = ry;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
  };
  box(0.5, 0.38, 0.4, -1.55, 0, -1.1, 0.1);
  box(0.42, 0.3, 0.36, -1.5, 0.38, -1.12, -0.15);
  box(0.36, 0.28, 0.32, -1.0, 0, -1.2, 0.3);
  box(0.6, 0.25, 0.45, 1.65, 0, -0.95, -0.2);
  box(0.3, 0.2, 0.3, 1.1, 0, -1.25, 0.5);

  const darkWood = new THREE.MeshStandardMaterial({ map: planksTexture([1, 1], 3), roughness: 0.8 });
  // old chair (back right)
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.4), darkWood);
  seat.position.y = 0.45;
  chair.add(seat);
  for (const [x, z] of [
    [-0.18, -0.17],
    [0.18, -0.17],
    [-0.18, 0.17],
    [0.18, 0.17],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.45, 0.035), darkWood);
    leg.position.set(x, 0.225, z);
    chair.add(leg);
  }
  const backRest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.03), darkWood);
  backRest.position.set(0, 0.7, -0.19);
  chair.add(backRest);
  chair.position.set(1.15, 0, -0.85);
  chair.rotation.y = -0.6;
  chair.traverse((c) => (c.castShadow = true));
  g.add(chair);

  // rolled rug + old suitcase
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 20), new THREE.MeshStandardMaterial({ color: 0x5a2a2a, roughness: 1 }));
  rug.rotation.z = Math.PI / 2;
  rug.rotation.y = 0.5;
  rug.position.set(1.75, 0.09, 0.0);
  rug.castShadow = true;
  g.add(rug);
  const suitcase = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.16, 0.38, 3, 0.03), new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.7 }));
  suitcase.position.set(-1.7, 0.08, -0.3);
  suitcase.rotation.y = 0.4;
  suitcase.castShadow = true;
  g.add(suitcase);

  // TV crate — deep enough that the controller rests on it in front of the TV
  // (so it stays in frame when the camera ends square-on to the screen)
  const crateDepth = ATTIC.CRATE_FRONT_Z - ATTIC.CRATE_BACK_Z;
  const crate = buildCrate(0.82, ATTIC.CRATE_H, crateDepth,new THREE.MeshStandardMaterial({ map: planksTexture([0.6, 0.6], 2), roughness: 0.75 }));
  crate.position.set(0, 0, (ATTIC.CRATE_FRONT_Z + ATTIC.CRATE_BACK_Z) / 2);
  g.add(crate);

  return { group: g };
}

/**
 * A rubber cable as a tube through control points, with moulded connector
 * heads on both ends (aligned to the cable direction).
 */
export function cable(points: THREE.Vector3[], radius = 0.0034, color = 0x141416, ends: [boolean, boolean] = [true, true]) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const rubber = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0 });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(64, points.length * 28), radius, 10, false), rubber);
  tube.castShadow = tube.receiveShadow = true;
  g.add(tube);

  const headMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.4 });
  const tipMat = new THREE.MeshStandardMaterial({ color: 0xb8a36a, roughness: 0.3, metalness: 0.9 });
  const addHead = (t: 0 | 1) => {
    const p = curve.getPointAt(t);
    const dir = curve.getTangentAt(t).normalize();
    if (t === 0) dir.negate(); // point outward
    const head = new THREE.Group();
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.6, radius * 2.4, 0.016, 14), headMat);
    boot.position.y = 0.008;
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.2, radius * 1.2, 0.007, 14), tipMat);
    tip.position.y = 0.0185;
    head.add(boot, tip);
    head.position.copy(p);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    head.traverse((c) => (c.castShadow = true));
    g.add(head);
  };
  if (ends[0]) addHead(0);
  if (ends[1]) addHead(1);
  return g;
}

/** Floating dust motes lit by the TV, lamp and torch. */
export function buildDust(count = 600) {
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    p[i * 3] = (Math.random() - 0.5) * 2.6;
    p[i * 3 + 1] = Math.random() * 1.6;
    p[i * 3 + 2] = -0.8 + Math.random() * 2.6;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0xffe6c4, size: 0.0045, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  return pts;
}
