import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { BEZEL_FRONT, buildTV, SCREEN_X, SCREEN_Y, TV, type TvAction } from './tvModel';
import { ATTIC, buildAttic, buildDust, cable } from './atticModel';
import {
  buildBrickPad,
  buildCartridge,
  buildConsole,
  buildFlashlight,
  buildLavaLamp,
  buildPowerStrip,
  buildRobotToy,
  buildToyCube,
  cartridgePile,
  type BrickPad,
} from './propsModel';
import type { Action } from '../systems/input';

export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const FOV = 32;

/** Where the HTML screen sits in the viewport — the 3D camera is solved to match it. */
export function screenTarget(vw: number, vh: number): ScreenRect {
  const mobile = vw < 768;
  // phone: keep the whole casing in frame (casing ≈ 1.5 × screen width)
  const width = mobile ? Math.min(vw * 0.62, vh * 0.32 * (4 / 3)) : Math.min(vw * 0.37, vh * 0.47 * (4 / 3));
  const height = width * 0.75;
  const cy = mobile ? vh * 0.3 : vh * 0.39;
  return { left: (vw - width) / 2, top: cy - height / 2, width, height };
}

/**
 * Owns the WebGL scene: a cluttered attic floor at night with an old CRT on a
 * crate, a console, wired pads, cartridges, a lava lamp and a flashlight beam.
 * Renders on demand (only while something moves), so idle cost is zero.
 */
export class SceneRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.03, 40);

  private tv = buildTV();
  private pad: BrickPad = buildBrickPad('cream'); // the clickable one
  private tvLight: THREE.RectAreaLight;
  private dust = buildDust();
  private clickables: THREE.Object3D[] = [];
  private pressed = new Map<THREE.Object3D, number>();

  private screenCenter = new THREE.Vector3();
  private finalPos = new THREE.Vector3();
  private posCurve!: THREE.CatmullRomCurve3;
  private lookCurve!: THREE.CatmullRomCurve3;
  private camProgress = 1;

  private raf = 0;
  private compiled = false;
  /** Resolves once every shader has been compiled (first frame can be drawn). */
  ready: Promise<void> = Promise.resolve();
  private animUntil = 0;
  private continuous = 0;
  private gameTexture: THREE.CanvasTexture | null = null;
  private idleScreen = new THREE.Color(0x07121e);

  onTvAction: (a: TvAction) => void = () => {};
  onPadAction: (a: Action) => void = () => {};

  constructor(private canvas: HTMLCanvasElement) {
    RectAreaLightUniformsLib.init();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const s = this.scene;
    s.background = new THREE.Color(0x0a080c);
    s.fog = new THREE.FogExp2(0x0c0a0e, 0.2);

    // soft image-based reflections so metal, glossy plastic and glass read as real materials
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    s.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    s.environmentIntensity = 0.08;
    pmrem.dispose();

    s.add(buildAttic().group);

    // TV on its crate, front face at z = 0
    const H = ATTIC.CRATE_H;
    this.tv.group.position.set(0, H, 0);
    s.add(this.tv.group);
    this.screenCenter.set(SCREEN_X, H + SCREEN_Y, 0);

    this.buildFloor();

    // ambient + the CRT's own cool glow
    s.add(new THREE.HemisphereLight(0x3d3046, 0x0a0806, 0.18));
    // warm amber pool over the console, like the reference shot
    const warm = new THREE.PointLight(0xff9a4a, 1.4, 0, 2);
    warm.position.set(-0.45, 0.75, 0.75);
    s.add(warm);
    this.tvLight = new THREE.RectAreaLight(0x9cc0ff, 0, TV.SCREEN_W, TV.SCREEN_H);
    this.tvLight.position.copy(this.screenCenter).add(new THREE.Vector3(0, 0, 0.06));
    this.tvLight.lookAt(this.screenCenter.x, this.screenCenter.y - 0.25, 5);
    s.add(this.tvLight);
    const tvSpill = new THREE.PointLight(0x8fb4ff, 0, 3, 2);
    tvSpill.name = 'tvSpill';
    tvSpill.position.copy(this.screenCenter).add(new THREE.Vector3(0, -0.15, 0.4));
    s.add(tvSpill);

    s.add(this.dust);

    this.setGameCanvas(null);
    // Compile every shader up front without blocking the main thread (KHR_parallel_shader_compile),
    // so the title card animates smoothly while the GPU warms up.
    this.ready = this.warmUp().then(() => {
      if (this.disposed) return;
      this.compiled = true;
      this.requestRender();
    });
    this.clickables = [...this.tv.buttons, ...this.pad.buttons.values()];
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
  }

  /**
   * Kick off shader compilation without blocking (KHR_parallel_shader_compile) and
   * resolve when every program reports ready. Unlike three's compileAsync this
   * tolerates materials whose program isn't created yet, and gives up waiting
   * after a few seconds so the scene can never get stuck on a blank frame.
   */
  private warmUp(timeoutMs = 4000) {
    return new Promise<void>((resolve) => {
      let materials: Set<THREE.Material>;
      try {
        materials = this.renderer.compile(this.scene, this.camera) as unknown as Set<THREE.Material>;
      } catch {
        resolve();
        return;
      }
      const t0 = performance.now();
      const props = this.renderer.properties;
      const poll = () => {
        if (this.disposed) return resolve();
        let pending = 0;
        materials?.forEach?.((m) => {
          const program = (props.get(m) as { currentProgram?: { isReady: () => boolean } }).currentProgram;
          if (program && !program.isReady()) pending++;
        });
        if (pending === 0 || performance.now() - t0 > timeoutMs) resolve();
        else setTimeout(poll, 30);
      };
      setTimeout(poll, 0);
    });
  }

  // ------------------------------------------------------- floor clutter
  private place(o: THREE.Object3D, x: number, z: number, ry = 0) {
    o.position.x = x;
    o.position.z = z;
    o.rotation.y = ry;
    this.scene.add(o);
    o.updateMatrixWorld(true);
    return o;
  }

  private buildFloor() {
    const s = this.scene;
    const F = 0.004; // cables lie just above the boards
    const w = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

    const H = ATTIC.CRATE_H;
    const EDGE = ATTIC.CRATE_FRONT_Z;
    const consoleG = this.place(buildConsole(), -0.2, 0.5, 0.32);
    const toWorld = (o: THREE.Object3D, x: number, y: number, z: number) => o.localToWorld(new THREE.Vector3(x, y, z));

    // The clickable pad is "held" up in front of the camera (positioned in layout());
    // two more pads lie on the floor.
    this.scene.add(this.pad.group);
    const padB = buildBrickPad('dark');
    this.place(padB.group, -0.64, 0.8, 0.75);
    const padC = buildBrickPad('grey');
    this.place(padC.group, 0.32, 0.7, -0.95);

    const portL = toWorld(consoleG, -0.05, 0.02, 0.088);
    const portR = toWorld(consoleG, 0.05, 0.02, 0.088);
    const cordFrom = (p: BrickPad) => p.group.localToWorld(p.plug.clone());
    this.padPort.copy(portR); // the held pad's cord is built in layout()
    const b = cordFrom(padB);
    s.add(cable([b, w(b.x + 0.06, F, b.z - 0.05), w(-0.48, F, 0.86), w(-0.36, F, 0.7), w(-0.42, F, 0.62), w(portL.x - 0.02, F, portL.z + 0.06), portL], 0.0032, 0x1a1a1c, [false, true]));
    // third pad isn't plugged in — its lead just trails off with the plug loose
    const c = cordFrom(padC);
    s.add(cable([c, w(c.x - 0.05, F, c.z - 0.04), w(0.2, F, 0.6), w(0.08, F, 0.78), w(0.18, F, 0.95)], 0.003, 0x1d1d22, [false, true]));

    // console → TV (AV): along the crate front, round the right corner, up to the side jacks
    const back = toWorld(consoleG, 0.02, 0.025, -0.088);
    const jacks = w(TV.W / 2 + 0.006, H + 0.1, -0.06);
    s.add(cable([back, w(back.x + 0.08, F, EDGE + 0.06), w(0.2, F, EDGE + 0.05), w(0.44, F, EDGE + 0.03), w(0.45, F, 0.05), w(0.45, 0.12, -0.04), w(0.42, H + 0.04, -0.06), jacks], 0.0032, 0x2a2420));
    s.add(cable([back, w(back.x + 0.1, F, EDGE + 0.08), w(0.3, F, EDGE + 0.08), w(0.47, F, EDGE + 0.05), w(0.465, F, 0.0), w(0.46, 0.14, -0.08), w(jacks.x + 0.002, jacks.y + 0.022, jacks.z)], 0.003, 0xc9b98a));

    // power strip on the right with leads to everything
    const strip = this.place(buildPowerStrip(), 0.72, 0.46, -0.55);
    const plugTop = (i: number) => toWorld(strip, -0.09 + i * 0.06, 0.05, -0.016);
    const lava = buildLavaLamp();
    this.place(lava.group, 0.6, 0.05, 0);
    const p0 = plugTop(0);
    s.add(cable([p0, w(p0.x - 0.03, F, p0.z - 0.06), w(0.66, F, 0.22), w(0.63, F, 0.12), w(0.6, 0.02, 0.05)], 0.003, 0x1c1418));
    const p1 = plugTop(1);
    s.add(cable([p1, w(p1.x - 0.02, F, p1.z - 0.08), w(0.45, F, EDGE + 0.12), w(0.15, F, EDGE + 0.1), w(back.x + 0.05, F, back.z - 0.01), back], 0.003));
    const p2 = plugTop(2);
    s.add(cable([p2, w(p2.x, F, p2.z - 0.1), w(0.62, F, -0.1), w(0.4, F, -0.6), w(0.25, 0.1, -0.62), w(0.2, ATTIC.CRATE_H + 0.15, -0.56)], 0.0034));
    const stripEnd = toWorld(strip, 0.16, 0.017, 0);
    s.add(cable([stripEnd, w(stripEnd.x + 0.12, F, stripEnd.z - 0.05), w(1.1, F, 0.1), w(1.25, F, -0.6), w(1.6, F, -1.3)], 0.0035, 0xd6d2c8));

    // loose leads snaking across the boards (left foreground)
    s.add(cable([w(-0.3, F, 0.35), w(-0.55, F, 0.5), w(-0.4, F, 0.68), w(-0.75, F, 0.95), w(-0.6, F, 1.2), w(-0.9, F, 1.45)], 0.003, 0x17171a));
    s.add(cable([w(-0.12, F, 0.6), w(-0.25, F, 0.98), w(0.05, F, 1.1), w(-0.1, F, 1.35), w(0.2, F, 1.6)], 0.0028, 0x232327));

    // flashlight lying on the boards, beam across a pad
    const torch = buildFlashlight(w(-0.64, 0.01, 0.8));
    const torchPos = w(-1.02, 0, 1.06);
    torch.group.position.x = torchPos.x;
    torch.group.position.z = torchPos.z;
    s.add(torch.group);
    torch.aim(torchPos, s);

    // cartridges, toys
    this.place(
      cartridgePile([
        [11, '#9d5bff', '#75f5ff'],
        [17, '#f15c9c', '#ffd166'],
        [23, '#2bb3a3', '#f2f2f2'],
      ]),
      -0.62,
      0.18,
      0.3,
    );
    this.place(buildCartridge(41, '#168dff', '#ffb36b'), 0.46, 0.9, 0.5);
    this.place(buildCartridge(47, '#e0533d', '#f2c14e', 0x55555b), -0.36, 1.08, -0.7);
    this.place(buildCartridge(53, '#50c060', '#ffffff'), 0.62, 0.72, 1.2);
    this.place(buildToyCube(), -0.42, 0.44, 0.5);
    this.place(buildRobotToy(), 0.82, 0.66, -0.6);
  }

  // -------------------------------------------------------------- layout
  /** Size the canvas and solve the final camera pose so the 3D screen lands exactly on `rect`. */
  layout(vw: number, vh: number): ScreenRect {
    this.renderer.setSize(vw, vh, false);
    this.camera.aspect = vw / vh;
    this.camera.updateProjectionMatrix();

    const rect = screenTarget(vw, vh);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const dist = (TV.SCREEN_W * vh) / (2 * tanHalf * rect.width);
    const pxPerM = rect.width / TV.SCREEN_W;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const glassZ = this.screenCenter.z + BEZEL_FRONT; // the bezel opening — where the HTML screen sits
    this.finalPos.set(this.screenCenter.x - (cx - vw / 2) / pxPerM, this.screenCenter.y + (cy - vh / 2) / pxPerM, glassZ + dist);

    this.buildPath();
    this.applyCamera();
    this.layoutHeldPad(vw, vh, tanHalf);
    this.requestRender();
    return rect;
  }

  // ------------------------------------------------------- held controller
  private padPort = new THREE.Vector3();
  private heldPos = new THREE.Vector3();
  private heldRise = 1; // 0 = lowered out of view, 1 = held up
  private heldShown = true;
  private padCord: THREE.Object3D | null = null;
  private padLight: THREE.SpotLight | null = null;

  /**
   * The controller is held up in front of the camera, facing it square-on (tilted
   * back a touch, like it's in your hands) and sized to the viewport so every
   * button is easy to click or tap. Its cord runs down to the console on the floor.
   */
  private layoutHeldPad(vw: number, vh: number, tanHalf: number) {
    const mobile = vw < 768;
    const targetW = mobile ? vw * 0.86 : Math.min(vw * 0.26, 400);
    const cyPx = mobile ? vh * 0.84 : vh * 0.855;
    const d = 0.34; // metres in front of the camera
    const pxPerM = vh / (2 * tanHalf * d);
    const scale = targetW / (0.12 * pxPerM);
    const g = this.pad.group;
    g.scale.setScalar(scale);
    g.rotation.set(Math.PI / 2 - 0.13, 0, 0); // face the camera, leaning back slightly
    this.heldPos.set(this.finalPos.x, this.finalPos.y - (cyPx - vh / 2) / pxPerM, this.finalPos.z - d);
    this.applyHeld();

    // soft key light so the face of the pad isn't lost in shadow
    if (!this.padLight) {
      this.padLight = new THREE.SpotLight(0xffe6c8, 0.9, 1.1, 0.55, 0.8, 2);
      this.scene.add(this.padLight, this.padLight.target);
    }
    this.padLight.position.copy(this.finalPos).add(new THREE.Vector3(0.06, 0.16, -0.02));
    this.padLight.target.position.copy(this.heldPos);

    // cord: out of the top edge, arcing away and down to the console's port
    if (this.padCord) {
      this.scene.remove(this.padCord);
      this.padCord.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    }
    g.position.copy(this.heldPos);
    g.updateMatrixWorld(true);
    const p0 = g.localToWorld(this.pad.plug.clone());
    const port = this.padPort;
    // short hook out of the top edge, then it drops behind the pad and out of frame
    // (so it never crosses the TV), running along the floor to the console
    this.padCord = cable(
      [
        p0,
        p0.clone().add(new THREE.Vector3(-0.002, 0.007 * scale, -0.008)),
        p0.clone().add(new THREE.Vector3(-0.012, -0.02, -0.03)),
        new THREE.Vector3(p0.x - 0.02, Math.max(0.08, p0.y - 0.22), p0.z - 0.09),
        new THREE.Vector3(p0.x - 0.03, 0.004, p0.z - 0.28),
        new THREE.Vector3((p0.x + port.x) / 2, 0.004, (p0.z + port.z) / 2 + 0.05),
        new THREE.Vector3(port.x + 0.05, 0.004, port.z + 0.14),
        port,
      ],
      0.0028,
      0x1a1a1c,
      [false, true],
    );
    this.scene.add(this.padCord);
    this.applyHeld();
  }

  private applyHeld() {
    const g = this.pad.group;
    const r = this.heldRise;
    g.visible = r > 0.001;
    g.position.copy(this.heldPos).add(new THREE.Vector3(0, -(1 - r) * 0.12, 0.02 * (1 - r)));
    if (this.padCord) this.padCord.visible = r >= 0.999;
    if (this.padLight) this.padLight.visible = g.visible;
    this.clickables = r >= 0.999 ? [...this.tv.buttons, ...this.pad.buttons.values()] : [...this.tv.buttons];
  }

  /** Lower the controller out of shot (during the fly-in) or raise it into your hands. */
  showHeldPad(on: boolean, animate = true) {
    if (on === this.heldShown && animate) return;
    this.heldShown = on;
    const from = { r: this.heldRise };
    const to = on ? 1 : 0;
    if (!animate) {
      this.heldRise = to;
      this.applyHeld();
      this.requestRender();
      return;
    }
    gsap.to(from, {
      r: to,
      duration: on ? 0.75 : 0.35,
      ease: on ? 'back.out(1.4)' : 'power2.in',
      onUpdate: () => {
        this.heldRise = Math.min(1, Math.max(0, from.r));
        this.applyHeld();
        this.requestRender();
      },
      onComplete: () => {
        this.heldRise = to;
        this.applyHeld();
        this.requestRender();
      },
    });
  }

  /**
   * Continuous camera path. It opens on the reference composition — high and to the
   * front-left, looking down across the cluttered floorboards with the TV glowing
   * upper-right — then dollies in, cranes down and swings round to dead-centre.
   */
  private buildPath() {
    const F = this.finalPos;
    const v = (x: number, y: number, z: number) => new THREE.Vector3(F.x + x, F.y + y, F.z + z);
    this.posCurve = new THREE.CatmullRomCurve3([v(-0.7, 0.78, 1.15), v(-0.55, 0.55, 0.82), v(-0.26, 0.24, 0.4), v(-0.05, 0.035, 0.07), F.clone()], false, 'centripetal');
    const c = this.screenCenter;
    this.lookCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-0.32, 0.14, 0.42),
        new THREE.Vector3(-0.18, 0.2, 0.25),
        new THREE.Vector3(c.x, c.y - 0.12, -0.05),
        new THREE.Vector3(F.x, F.y, c.z - 0.6),
        new THREE.Vector3(F.x, F.y, F.z - 1),
      ],
      false,
      'centripetal',
    );
  }

  setCameraProgress(p: number) {
    this.camProgress = THREE.MathUtils.clamp(p, 0, 1);
    this.applyCamera();
    this.requestRender();
  }

  private applyCamera() {
    if (this.camProgress >= 1) {
      // exactly frontal — identity rotation, so the HTML screen lines up pixel-perfectly
      this.camera.position.copy(this.finalPos);
      this.camera.quaternion.identity();
      return;
    }
    this.camera.position.copy(this.posCurve.getPoint(this.camProgress));
    this.camera.lookAt(this.lookCurve.getPoint(this.camProgress));
  }

  // -------------------------------------------------------------- TV state
  /** 1×1 white texture used when no game is showing — swapping textures (never to null)
   *  keeps the shader program unchanged, so nothing is recompiled mid-flight. */
  private idleTexture = (() => {
    const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    t.needsUpdate = true;
    return t;
  })();

  setGameCanvas(canvas: HTMLCanvasElement | null) {
    if (canvas) {
      this.gameTexture = new THREE.CanvasTexture(canvas);
      this.gameTexture.colorSpace = THREE.SRGBColorSpace;
      this.gameTexture.magFilter = THREE.NearestFilter;
      this.tv.screenMat.map = this.gameTexture;
    } else {
      this.gameTexture?.dispose();
      this.gameTexture = null;
      this.tv.screenMat.map = this.idleTexture;
    }
    this.applyScreenColor();
    this.requestRender();
  }

  private powerLevel = 0;
  private applyScreenColor() {
    // with a picture: white × brightness; without: the dark cyan tube glow
    const base = this.gameTexture ? new THREE.Color(0xffffff) : this.idleScreen.clone();
    this.tv.screenMat.color.copy(base.multiplyScalar(Math.max(0.03, this.powerLevel)));
  }

  /** 0 = off, 1 = on. Drives screen glow, the cyan light spill and the power LED. */
  setPower(level: number, animate = true) {
    const spill = this.scene.getObjectByName('tvSpill') as THREE.PointLight;
    const target = { v: level };
    const apply = (v: number) => {
      this.powerLevel = v;
      this.tvLight.intensity = 6 * v;
      spill.intensity = 0.35 * v;
      this.applyScreenColor();
      this.tv.ledMat.emissive.set(v > 0.5 ? 0x3dff7a : 0xff2a2a);
      this.requestRender();
    };
    if (!animate) return apply(level);
    const from = { v: this.powerLevel };
    gsap.to(from, { v: target.v, duration: 0.6, ease: 'power2.out', onUpdate: () => apply(from.v) });
  }

  /** Animate a physical button press (TV front buttons and controller buttons). */
  press(obj: THREE.Object3D | undefined) {
    if (!obj) return;
    this.pressed.set(obj, performance.now());
    this.requestRender(220);
  }
  pressPad(a: Action) {
    this.press(this.pad.buttons.get(a));
  }

  // -------------------------------------------------------------- input
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private hit(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickables, true);
    let o: THREE.Object3D | null = hits[0]?.object ?? null;
    while (o && !o.userData.tvAction && !o.userData.action) o = o.parent;
    return o && o.visible !== false ? o : null;
  }
  private onPointerDown = (e: PointerEvent) => {
    const o = this.hit(e);
    if (!o) return;
    e.preventDefault();
    this.press(o);
    if (o.userData.tvAction) this.onTvAction(o.userData.tvAction as TvAction);
    else if (o.userData.action) this.onPadAction(o.userData.action as Action);
  };
  private lastMove = 0;
  private onPointerMove = (e: PointerEvent) => {
    const now = performance.now();
    if (now - this.lastMove < 50) return;
    this.lastMove = now;
    this.canvas.style.cursor = this.hit(e) ? 'pointer' : '';
  };

  // -------------------------------------------------------------- loop
  /** Keep rendering every frame while > 0 (cinematic, demo game on screen). */
  setContinuous(on: boolean) {
    this.continuous = Math.max(0, this.continuous + (on ? 1 : -1));
    this.requestRender();
  }

  requestRender(ms = 0) {
    if (this.disposed) return; // a torn-down renderer must never draw into the shared canvas again
    this.animUntil = Math.max(this.animUntil, performance.now() + ms);
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    if (this.disposed) return;
    if (this.gameTexture) this.gameTexture.needsUpdate = true;
    if (this.continuous > 0) {
      // dust motes drift through the light while the camera moves
      this.dust.rotation.y = now * 0.00002;
      this.dust.position.y = Math.sin(now * 0.0004) * 0.02;
    }

    for (const [o, t0] of this.pressed) {
      const k = (now - t0) / 160;
      const depth = k < 0.35 ? k / 0.35 : Math.max(0, 1 - (k - 0.35) / 0.65);
      const rest = o.userData.rest as number;
      const amount = o.userData.tvAction ? 0.004 : 0.0022;
      if (o.userData.axis === 'z') o.position.z = rest - depth * amount;
      else o.position.y = rest - depth * amount;
      if (k >= 1) this.pressed.delete(o);
    }

    if (this.compiled) this.renderer.render(this.scene, this.camera);
    if (this.continuous > 0 || now < this.animUntil || this.pressed.size) this.raf = requestAnimationFrame(this.tick);
  };

  private disposed = false;
  dispose() {
    this.disposed = true;
    this.continuous = 0;
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.dispose();
  }
}

/** The live instance, for the cinematic and input wiring. */
export const sceneRef: { current: SceneRenderer | null } = { current: null };
