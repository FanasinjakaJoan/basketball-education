/**
 * Zone: IoT basketball court (centre-piece).
 *  · FIBA-accurate resin court surface (painted lines drawn procedurally)
 *  · Kinetic LED floor driven by a custom shader: sensor grid, sweeping data
 *    streams, player foot-prints, and three ambient modes
 *  · Retractable automated hoops on ceiling carriages
 *  · Robotic overhead tracking gantry (rails + translating cross-beam + pods)
 *  · Suspended holographic scoreboard with live canvases
 *  · Biometric data visualisation columns / ribbons floating over the floor
 */
import * as THREE from "three";
import { COURT } from "../plan.js";
import { PALETTE } from "../lib/materials.js";
import { clamp, mulberry32 } from "../lib/util.js";
import { createVolumetricMaterial, updateVolumetric, createSmartSurface } from "../lib/holo.js";
import { createTeamScene, createAthlete, createBall } from "../lib/players.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

const PPM = 2048 / COURT.length; // pixels per metre on the court canvas
const mx = (x) => (x + COURT.length / 2) * PPM;
const my = (z) => (z + COURT.width / 2) * PPM;

/* ------------------------------------------------------------------ */
/* painted court surface                                               */
/* ------------------------------------------------------------------ */

export function drawCourtCanvas(ctx) {
  const w = 2048;
  const h = Math.round(COURT.width * PPM);
  const random = mulberry32(20204);

  // resin base
  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, "#b07c46");
  base.addColorStop(0.5, "#a06e3b");
  base.addColorStop(1, "#8e5f34");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // plank texture
  const plank = 26;
  for (let y = 0; y < h; y += plank) {
    const tone = 0.88 + random() * 0.26;
    ctx.fillStyle = `rgba(${Math.floor(140 * tone)},${Math.floor(96 * tone)},${Math.floor(54 * tone)},0.5)`;
    ctx.fillRect(0, y, w, plank - 1);
    for (let x = (y / plank) % 2 ? 0 : 180; x < w; x += 300) {
      ctx.strokeStyle = "rgba(72,40,18,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + plank);
      ctx.stroke();
    }
  }
  for (let i = 0; i < 2200; i++) {
    const x = random() * w;
    const y = random() * h;
    ctx.strokeStyle = `rgba(255,225,180,${0.015 + random() * 0.04})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 30 + random() * 80, y + (random() - 0.5) * 3);
    ctx.stroke();
  }

  // painted key (both ends) — deep teal resin
  const keyWidth = COURT.laneWidth * PPM;
  const keyLength = COURT.laneLength * PPM;
  [-1, 1].forEach((side) => {
    const x0 = side < 0 ? 0 : w - keyLength;
    ctx.fillStyle = "rgba(12,50,66,0.82)";
    ctx.fillRect(x0, my(-COURT.laneWidth / 2), keyLength, keyWidth);
    // lane blocks
    ctx.fillStyle = "rgba(240,246,250,0.9)";
    for (let i = 0; i < 4; i++) {
      const bx = side < 0 ? 0.35 * PPM + i * 0.85 * PPM : w - 0.35 * PPM - i * 0.85 * PPM;
      const bw = 0.35 * PPM;
      const gap = 0.25 * PPM;
      ctx.fillRect(bx, my(-COURT.laneWidth / 2) - 0.45 * PPM, bw, 0.12 * PPM);
      ctx.fillRect(bx, my(-COURT.laneWidth / 2) - 0.45 * PPM, bw, 0.12 * PPM);
      void gap;
      ctx.fillRect(bx, my(COURT.laneWidth / 2) + 0.33 * PPM, bw, 0.12 * PPM);
    }
  });

  // centre logo plate
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "rgba(255,236,208,0.85)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 2.4 * PPM, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(20,90,110,0.9)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 2.15 * PPM, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,236,208,0.75)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 1.55 * PPM, 0, Math.PI * 2);
  ctx.moveTo(cx - 1.55 * PPM, cy);
  ctx.lineTo(cx + 1.55 * PPM, cy);
  ctx.moveTo(cx, cy - 1.55 * PPM);
  ctx.lineTo(cx, cy + 1.55 * PPM);
  ctx.stroke();
  ctx.restore();

  // ---- FIBA lines ----
  const line = (draw, width = 0.05 * PPM, color = "rgba(255,248,238,0.94)") => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    draw();
    ctx.stroke();
  };
  const lineWidth = 0.05 * PPM;

  // boundary
  ctx.strokeStyle = "rgba(255,248,238,0.94)";
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(lineWidth / 2, lineWidth / 2, w - lineWidth, h - lineWidth);

  // mid-court line + centre circle
  line(() => {
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
  }, lineWidth);
  line(() => ctx.arc(cx, cy, COURT.centreCircle * PPM, 0, Math.PI * 2), lineWidth);

  [-1, 1].forEach((side) => {
    const baseline = side < 0 ? 0 : w;
    const basketX = mx(side * (COURT.length / 2 - COURT.basketFromBaseline));
    const freeThrowX = mx(side * (COURT.length / 2 - COURT.laneLength));
    const cornerZ = COURT.width / 2 - COURT.threePointCorner;
    const arcJoinX = basketX + side * -1 * Math.sqrt(COURT.threePoint ** 2 - cornerZ ** 2) * PPM * -1;

    // lane
    line(() => {
      ctx.moveTo(baseline, my(-COURT.laneWidth / 2));
      ctx.lineTo(freeThrowX, my(-COURT.laneWidth / 2));
      ctx.lineTo(freeThrowX, my(COURT.laneWidth / 2));
      ctx.lineTo(baseline, my(COURT.laneWidth / 2));
    }, lineWidth);

    // free-throw circle (solid half towards centre court, dashed towards basket)
    line(() => {
      const start = side < 0 ? -Math.PI / 2 : Math.PI / 2;
      ctx.arc(freeThrowX, cy, COURT.freeThrowCircle * PPM, start, start + Math.PI);
    }, lineWidth);
    ctx.save();
    ctx.setLineDash([0.35 * PPM, 0.35 * PPM]);
    line(() => {
      const start = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      ctx.arc(freeThrowX, cy, COURT.freeThrowCircle * PPM, start, start + Math.PI);
    }, lineWidth, "rgba(255,248,238,0.7)");
    ctx.restore();

    // three-point line: corner straights + arc
    const cornerLineX = mx(side * (COURT.length / 2 - (COURT.laneLength + 0.3)));
    line(() => {
      ctx.moveTo(baseline, my(cornerZ));
      ctx.lineTo(cornerLineX, my(cornerZ));
      ctx.moveTo(baseline, my(-cornerZ));
      ctx.lineTo(cornerLineX, my(-cornerZ));
    }, lineWidth);
    line(() => {
      const dy = Math.sqrt(COURT.threePoint ** 2 - cornerZ ** 2) / COURT.threePoint;
      const angle = Math.asin(clamp(dy, -1, 1));
      const start = side < 0 ? angle : Math.PI - angle;
      const end = side < 0 ? -angle : Math.PI + angle;
      ctx.arc(basketX, cy, COURT.threePoint * PPM, start, end, side > 0);
    }, lineWidth);
    void arcJoinX;

    // restricted area (no-charge semicircle)
    line(() => {
      const start = side < 0 ? -Math.PI / 2 : Math.PI / 2;
      ctx.arc(basketX, cy, COURT.restrictedArc * PPM, start, start + Math.PI);
    }, lineWidth, "rgba(255,214,150,0.85)");

    // backboard projection tick
    line(() => {
      ctx.moveTo(mx(side * (COURT.length / 2 - COURT.backboardFromBaseline)), cy - 0.9 * PPM);
      ctx.lineTo(mx(side * (COURT.length / 2 - COURT.backboardFromBaseline)), cy + 0.9 * PPM);
    }, lineWidth * 0.8, "rgba(255,214,150,0.6)");
  });

  // coaching boxes
  [-1, 1].forEach((side) => {
    const x = side < 0 ? 0.1 * PPM : w - 0.1 * PPM - 2.5 * PPM;
    ctx.strokeStyle = "rgba(140,232,255,0.55)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, h - 3.4 * PPM, 2.5 * PPM, 1.2 * PPM);
  });

  // subtle sheen
  const sheen = ctx.createRadialGradient(w * 0.35, h * 0.3, 60, w * 0.5, h * 0.5, w * 0.8);
  sheen.addColorStop(0, "rgba(255,240,210,0.09)");
  sheen.addColorStop(1, "rgba(255,240,210,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);
}

/* ------------------------------------------------------------------ */
/* kinetic LED floor                                                   */
/* ------------------------------------------------------------------ */

const LED_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LED_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uActivation;
  uniform vec3 uModeMix;      // training, game, recovery
  uniform vec3 uColorTrain;
  uniform vec3 uColorGame;
  uniform vec3 uColorRecover;
  uniform vec2 uPlayers[10];
  uniform float uPlayerCount;
  uniform float uTelemetry;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float rings(vec2 c, float speed, float freq) {
    float d = length(c);
    return pow(0.5 + 0.5 * sin(d * freq - uTime * speed), 8.0);
  }

  void main() {
    vec2 c = vec2((vUv.x - 0.5) * 28.0, (0.5 - vUv.y) * 15.0);

    /* --- training: fine sensor grid + random pressure cells --- */
    vec2 cell = floor(c * 2.0);
    float rnd = hash(cell);
    float blink = pow(0.5 + 0.5 * sin(uTime * (2.0 + rnd * 3.0) + rnd * 40.0), 12.0);
    vec2 g = abs(fract(c * 1.0) - 0.5);
    float gridLine = 1.0 - smoothstep(0.0, 0.035, min(g.x, g.y));
    float grid = gridLine * 0.22 + smoothstep(0.94, 1.0, hash(cell)) * blink * 0.5;
    grid += smoothstep(0.9, 1.0, rnd) * 0.25 * (0.5 + 0.5 * sin(uTime * 1.2 + rnd * 10.0));
    grid *= 0.5 + 0.5 * rings(c, 1.1, 0.42);

    /* --- game: chess squares + travelling sweep + logo pulse --- */
    vec2 chess = floor(c * vec2(0.5, 1.0));
    float chessSq = mod(chess.x + chess.y, 2.0);
    float sweepPos = -18.0 + mod(uTime * 7.0, 36.0);
    float sweep = exp(-pow((c.x - sweepPos) / 1.6, 2.0));
    float logoPulse = pow(0.5 + 0.5 * sin(uTime * 2.4), 6.0) * exp(-pow(length(c) / 2.4, 2.0));
    float game = chessSq * 0.16 + sweep * 0.6 + logoPulse * 0.45;

    /* --- recovery: slow breathing rings, no grid --- */
    float recover = rings(c, 0.35, 0.55) * 0.4 + 0.05;

    /* --- player pressure footprints (interactive LED lines) --- */
    float foot = 0.0;
    for (int i = 0; i < 10; i++) {
      if (float(i) < uPlayerCount) {
        float d = distance(c, uPlayers[i]);
        float ring = exp(-pow((d - 0.62 - 0.1 * sin(uTime * 2.2 + float(i))) / 0.22, 2.0)) * 0.75;
        float core = exp(-pow(d / 0.3, 2.0)) * 0.5;
        foot += ring + core;
      }
    }

    /* --- hoop spot pools --- */
    float hoopA = exp(-pow(distance(c, vec2(-12.4, 0.0)) / 2.2, 2.0));
    float hoopB = exp(-pow(distance(c, vec2(12.4, 0.0)) / 2.2, 2.0));
    float hoops = (hoopA + hoopB) * 0.12;

    float intensity =
        (grid * uModeMix.x
      + game * uModeMix.y
      + recover * uModeMix.z) * uActivation
      + foot * (0.9 + uTelemetry * 0.4)
      + hoops;

    vec3 color =
        uColorTrain * (grid * uModeMix.x + foot * 0.7)
      + uColorGame * (game * uModeMix.y + hoops)
      + uColorRecover * (recover * uModeMix.z)
      + vec3(0.65, 0.95, 1.0) * foot * 0.5;

    float flicker = 0.94 + 0.06 * sin(uTime * 43.0 + vUv.x * 200.0);
    intensity *= flicker;
    color *= flicker;

    color = min(color, vec3(1.2)) * 0.55;
    gl_FragColor = vec4(color, clamp(intensity, 0.0, 0.8));
  }
`;

export function createLedFloor({ activation = 0 } = {}) {
  const uniforms = {
    uTime: { value: 0 },
    uActivation: { value: activation },
    uModeMix: { value: new THREE.Vector3(1, 0, 0) },
    uColorTrain: { value: new THREE.Color(PALETTE.cyan) },
    uColorGame: { value: new THREE.Color(PALETTE.amber) },
    uColorRecover: { value: new THREE.Color(0x9f8cff) },
    uPlayers: { value: Array.from({ length: 10 }, () => new THREE.Vector2(0, 0)) },
    uPlayerCount: { value: 8 },
    uTelemetry: { value: 0.5 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: LED_VERTEX,
    fragmentShader: LED_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.PlaneGeometry(COURT.length, COURT.width);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0.03;
  mesh.name = "ledFloor";
  return { mesh, uniforms };
}

/* ------------------------------------------------------------------ */
/* retractable automated hoops                                         */
/* ------------------------------------------------------------------ */

/* The carriage holds the rim 0.34 m below its own origin, so the parked and
 * playing heights are expressed once, here: 10.2 m stowed against the roof,
 * and deployed at exactly the FIBA 3.05 m to the top of the ring. */
const RIM_OFFSET = 0.34;
const RIM_TUBE = 0.018;
const STOW_Y = 10.2;
const DEPLOY_Y = COURT.rimHeight + RIM_OFFSET - RIM_TUBE; // 3.372 → rim top at 3.05

export function createHoop({ side = -1, materials }) {
  const group = new THREE.Group();
  group.name = `hoop-${side < 0 ? "west" : "east"}`;
  const xColumn = side * (COURT.length / 2 + 0.6);

  // ceiling carriage rail (fixed)
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 6.4, 0.34), materials.graphiteSteel);
  rail.position.set(xColumn, 10.5, 0);
  group.add(rail);
  const railTrim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 6.4, 0.06), materials.neonCyan);
  railTrim.position.set(xColumn - side * 0.19, 10.5, 0);
  group.add(railTrim);

  // translating carriage
  const carriage = new THREE.Group();
  carriage.position.set(xColumn, 7.2, 0);
  group.add(carriage);
  const carriageBody = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.5, 0.66), materials.matteBlackSteel);
  carriageBody.position.y = 0.3;
  carriage.add(carriageBody);
  const carriageLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), materials.neonAmber);
  carriageLight.position.y = 0.02;
  carriage.add(carriageLight);
  const piston = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 1.4, 10),
    materials.brushedAluminum
  );
  piston.rotation.z = Math.PI / 2;
  piston.position.set(-side * 0.5, 0.12, 0);
  carriage.add(piston);

  // arm + board assembly
  const armAssembly = new THREE.Group();
  armAssembly.position.set(-side * 0.75, 0, 0);
  carriage.add(armAssembly);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.2), materials.brushedAluminum);
  arm.position.set(-side * 0.55, 0, 0);
  armAssembly.add(arm);
  const armRib = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.32, 0.05), materials.graphiteSteel);
  armRib.position.set(-side * 0.5, 0.18, 0);
  armAssembly.add(armRib);

  // fold pivot: backboard folds flat when stowed
  const boardPivot = new THREE.Group();
  boardPivot.position.set(-side * 1.3, 0, 0);
  armAssembly.add(boardPivot);

  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.05, 1.8), materials.matteBlackSteel);
  boardPivot.add(boardFrame);
  const boardGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.95, 1.72),
    new THREE.MeshPhysicalMaterial({
      color: 0xdff2ff,
      transparent: true,
      opacity: 0.34,
      roughness: 0.05,
      metalness: 0.1,
      envMapIntensity: 2,
    })
  );
  boardGlass.position.x = -0.03;
  boardPivot.add(boardGlass);
  const boardLight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 1.5), materials.neonCyan);
  boardLight.position.set(-0.05, -0.42, 0);
  boardPivot.add(boardLight);
  const targetSquare = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.45, 0.59),
    new THREE.MeshBasicMaterial({ color: 0xff6f4a })
  );
  targetSquare.position.set(-0.06, -0.16, 0);
  boardPivot.add(targetSquare);

  // rim + net
  const rimGroup = new THREE.Group();
  rimGroup.position.set(-0.15, -RIM_OFFSET, 0);
  boardPivot.add(rimGroup);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(COURT.rimDiameter / 2, RIM_TUBE, 10, 28),
    new THREE.MeshStandardMaterial({ color: 0xf06a2c, roughness: 0.35, metalness: 0.75 })
  );
  rim.rotation.x = Math.PI / 2;
  rimGroup.add(rim);
  const netMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f7fa,
    roughness: 0.8,
    transparent: true,
    opacity: 0.75,
  });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.44, 4), netMaterial);
    strand.position.set(
      Math.cos(a) * (COURT.rimDiameter / 2) * 0.78,
      -0.22,
      Math.sin(a) * (COURT.rimDiameter / 2) * 0.78
    );
    strand.rotation.z = Math.cos(a) * 0.28;
    strand.rotation.x = -Math.sin(a) * 0.28;
    rimGroup.add(strand);
  }
  [-0.14, -0.28, -0.42].forEach((y, i) => {
    const ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry((COURT.rimDiameter / 2) * (0.82 - i * 0.16), 0.006, 6, 20),
      netMaterial
    );
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = y;
    rimGroup.add(ringMesh);
  });

  // shot-clock on the board back
  const shotClock = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.22, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x120b06, emissive: 0xff5a2a, emissiveIntensity: 1.6 })
  );
  shotClock.position.set(0.06, -0.2, 0);
  boardPivot.add(shotClock);

  const update = (deploy) => {
    const ease = clamp((deploy - 0.25) / 0.75, 0, 1);
    const smooth = ease * ease * (3 - 2 * ease);
    carriage.position.y = THREE.MathUtils.lerp(STOW_Y, DEPLOY_Y, smooth);
    boardPivot.rotation.z = THREE.MathUtils.lerp(side * 1.42, 0, clamp(deploy / 0.6, 0, 1));
    carriageLight.material.emissiveIntensity = deploy > 0.05 ? 1.8 + Math.sin(performance.now() * 0.004) * 0.4 : 0.6;
    rimGroup.visible = smooth > 0.6;
  };

  return { group, update, carriage };
}

/* ------------------------------------------------------------------ */
/* robotic tracking gantry                                             */
/* ------------------------------------------------------------------ */

export function createGantry({ materials }) {
  const group = new THREE.Group();
  group.name = "gantry";
  const rails = [];
  [-1, 1].forEach((side) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 30), materials.graphiteSteel);
    rail.position.set(side * 6.2, 12.7, 0);
    group.add(rail);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 30), materials.neonCyan);
    glow.position.set(side * 6.2, 12.55, 0);
    group.add(glow);
    for (let z = -14; z <= 14; z += 3.5) {
      const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), materials.darkAluminum);
      hanger.position.set(side * 6.2, 13.2, z);
      group.add(hanger);
    }
    rails.push(rail);
  });

  const beam = new THREE.Group();
  beam.position.set(0, 12.5, 0);
  group.add(beam);
  const beamBody = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.28, 0.34), materials.brushedAluminum);
  beam.add(beamBody);
  const beamStrip = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.04, 0.1), materials.neonAmber);
  beamStrip.position.y = -0.16;
  beam.add(beamStrip);

  const pods = [];
  [-4.2, 0, 4.2].forEach((x, index) => {
    const podHead = new THREE.Group();
    podHead.position.set(x, -0.55, 0);
    beam.add(podHead);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 8), materials.darkAluminum);
    arm.position.y = 0.35;
    podHead.add(arm);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.34), materials.matteBlackSteel);
    housing.position.y = 0.02;
    podHead.add(housing);
    const lens = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 14, 10),
      new THREE.MeshPhysicalMaterial({ color: 0x0b1a22, roughness: 0.05, metalness: 0.6, envMapIntensity: 2.4 })
    );
    lens.position.y = -0.14;
    podHead.add(lens);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), materials.neonCyan);
    led.position.set(0.14, 0.11, 0.14);
    podHead.add(led);
    pods.push({ podHead, index });
  });

  const update = (t) => {
    beam.position.z = Math.sin(t * 0.32) * 11.5;
    beam.rotation.y = Math.sin(t * 0.21) * 0.05;
    pods.forEach(({ podHead, index }) => {
      podHead.rotation.y = Math.sin(t * 0.7 + index) * 0.9;
      podHead.rotation.x = Math.sin(t * 0.5 + index * 1.4) * 0.24;
    });
  };

  return { group, update };
}

/* ------------------------------------------------------------------ */
/* suspended holographic scoreboard                                     */
/* ------------------------------------------------------------------ */

export function createScoreboard({ materials, registry, state }) {
  const group = new THREE.Group();
  group.name = "scoreboard";
  group.position.y = 10.6;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.22, 12, 40), materials.brushedAluminum);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(2.95, 0.045, 8, 48), materials.neonCyan);
  ringGlow.rotation.x = Math.PI / 2;
  group.add(ringGlow);

  const core = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 36), materials.matteBlackSteel);
  group.add(core);

  // four 4K panels facing the stands
  const panels = [];
  const panelWidth = 3.6;
  const panelHeight = 1.7;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const surface = createSmartSurface({
      width: panelWidth,
      height: panelHeight,
      pixels: 768,
      interval: 0.2,
      registry,
      name: `scoreboard-panel-${i}`,
      draw: (ctx, w, h, time) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#04090f";
        ctx.fillRect(0, 0, w, h);
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, "rgba(92,230,255,0.22)");
        grad.addColorStop(1, "rgba(255,171,90,0.16)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        // score
        ctx.fillStyle = "#eaf6ff";
        ctx.font = `800 ${Math.round(w * 0.2)}px Inter, sans-serif`;
        ctx.textAlign = "center";
        const score = state?.score || [72, 68];
        ctx.fillText(String(score[0]), w * 0.24, h * 0.44);
        ctx.fillText(String(score[1]), w * 0.76, h * 0.44);
        ctx.fillStyle = "rgba(127,232,255,0.85)";
        ctx.font = `600 ${Math.round(w * 0.07)}px Inter, sans-serif`;
        ctx.fillText("TEAM ALPHA", w * 0.24, h * 0.16);
        ctx.fillStyle = "rgba(255,171,90,0.85)";
        ctx.fillText("TEAM BETA", w * 0.76, h * 0.16);
        ctx.fillStyle = "#ff6b3d";
        ctx.font = `800 ${Math.round(w * 0.13)}px Inter, sans-serif`;
        ctx.fillText(String(state?.shotClock ?? 24).padStart(2, "0"), w * 0.5, h * 0.94);
        ctx.fillStyle = "rgba(220,240,255,0.6)";
        ctx.font = `600 ${Math.round(w * 0.045)}px Inter, sans-serif`;
        ctx.fillText(
          `Q${state?.quarter || 3} · ${String(state?.gameClock || "07:42")} · SHOT CLOCK`,
          w * 0.5,
          h * 0.68
        );
        // team fouls / possession
        ctx.fillStyle = "rgba(127,232,255,0.9)";
        ctx.beginPath();
        ctx.arc(w * 0.42, h * 0.95, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = "left";
      },
    });
    surface.mesh.position.set(Math.sin(angle) * (panelWidth / 2 + 0.28), -0.5, Math.cos(angle) * (panelWidth / 2 + 0.28));
    surface.mesh.rotation.y = angle;
    group.add(surface.mesh);
    panels.push(surface.mesh);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth + 0.16, panelHeight + 0.16, 0.08),
      materials.graphiteSteel
    );
    frame.position.copy(surface.mesh.position);
    frame.rotation.y = angle;
    frame.translateZ(-0.06);
    group.add(frame);
  }

  // volumetric hologram volume above the ring
  const holoMaterial = createVolumetricMaterial({ color: PALETTE.cyan, lines: 70, speed: 0.5, opacity: 0.34 });
  const holo = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3.4, 28, 1, true), holoMaterial);
  holo.position.y = 2;
  group.add(holo);
  const holoCore = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 20, 16),
    new THREE.MeshBasicMaterial({
      color: PALETTE.cyan,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  holoCore.position.y = 2;
  group.add(holoCore);

  // projection cone down to the court
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 3.4, 8.2, 30, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x7fe8ff,
      transparent: true,
      opacity: 0.035,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  cone.position.y = -4.2;
  group.add(cone);

  // suspension cables
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 3.4, 6),
      materials.darkAluminum
    );
    cable.position.set(Math.cos(angle) * 2.4, 1.9, Math.sin(angle) * 2.4);
    group.add(cable);
  }

  const update = (t) => {
    updateVolumetric(holoMaterial, t);
    holo.material.uniforms.uIntensity.value = 0.7 + Math.sin(t * 1.3) * 0.3;
    holoCore.material.opacity = 0.06 + Math.abs(Math.sin(t * 0.8)) * 0.08;
    holo.rotation.y = t * 0.14;
    cone.material.opacity = 0.02 + Math.abs(Math.sin(t * 0.7)) * 0.015;
  };

  return { group, update, panels };
}

/* ------------------------------------------------------------------ */
/* biometric data visualisation                                        */
/* ------------------------------------------------------------------ */

export function createDataViz({ materials, registry, telemetry }) {
  const group = new THREE.Group();
  group.name = "courtDataViz";
  const random = mulberry32(4242);

  // vertical telemetry columns along both sidelines
  const columns = [];
  const columnGeometry = new THREE.BoxGeometry(0.22, 1, 0.22);
  columnGeometry.translate(0, 0.5, 0);
  for (let i = 0; i < 14; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const material = new THREE.MeshBasicMaterial({
      color: side < 0 ? PALETTE.cyan : PALETTE.amber,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const column = new THREE.Mesh(columnGeometry, material);
    column.position.set(-6.4 + Math.floor(i / 2) * 1.9, 0.02, side * 8.6);
    column.userData.base = 0.4 + random() * 0.6;
    column.userData.speed = 0.6 + random() * 1.2;
    group.add(column);
    columns.push(column);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({
        color: side < 0 ? 0x9ff0ff : 0xffcf94,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    );
    column.add(cap);
    cap.position.y = 1.02;
  }

  // floating holo rings + particles
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.4 + i * 0.9, 0.02, 6, 48),
      new THREE.MeshBasicMaterial({
        color: i === 1 ? PALETTE.amber : PALETTE.cyan,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3.2 + i * 1.4;
    group.add(ring);
    rings.push(ring);
  }

  const particleCount = 240;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (random() - 0.5) * 26;
    positions[i * 3 + 1] = random() * 6;
    positions[i * 3 + 2] = (random() - 0.5) * 13;
    speeds[i] = 0.2 + random() * 0.7;
  }
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0x9ff0ff,
      size: 0.075,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(particles);

  const update = (t, dt) => {
    columns.forEach((column, i) => {
      const value = telemetry.get(i % 8) * column.userData.base;
      const scale = 0.3 + value * 3.1;
      column.scale.y += (scale - column.scale.y) * Math.min(1, dt * 4);
      column.material.opacity = 0.18 + value * 0.3;
      column.children[0].position.y = 1.02;
    });
    rings.forEach((ring, i) => {
      ring.rotation.z = t * (0.12 + i * 0.05) * (i % 2 ? -1 : 1);
      ring.position.y = 3.2 + i * 1.4 + Math.sin(t * 0.5 + i) * 0.3;
      ring.material.opacity = 0.08 + Math.abs(Math.sin(t * 0.6 + i)) * 0.12;
    });
    const attr = particleGeometry.getAttribute("position");
    for (let i = 0; i < particleCount; i++) {
      let y = attr.getY(i) + dt * speeds[i];
      if (y > 7) {
        y = 0.1;
        attr.setX(i, (Math.random() - 0.5) * 26);
        attr.setZ(i, (Math.random() - 0.5) * 13);
      }
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  };

  registry?.add({ interval: 1e9, draw: () => {}, onFrame: update });
  return { group, update };
}

/* ------------------------------------------------------------------ */
/* court lighting                                                      */
/* ------------------------------------------------------------------ */

export function createCourtLighting({ materials }) {
  RectAreaLightUniformsLib.init();
  const group = new THREE.Group();
  group.name = "courtLighting";
  const lights = [];
  const panels = [];

  for (let ix = 0; ix < 2; ix++) {
    for (let iz = 0; iz < 3; iz++) {
      const x = (ix - 0.5) * 8.4;
      const z = (iz - 1) * 9.6;
      const housing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 4.6), materials.graphiteSteel);
      housing.position.set(x, 13.15, z);
      group.add(housing);
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.08, 4.4),
        new THREE.MeshStandardMaterial({
          color: 0xf2f8ff,
          emissive: 0xe8f6ff,
          emissiveIntensity: 0.35,
          roughness: 0.4,
        })
      );
      panel.position.set(x, 13.0, z);
      group.add(panel);
      panels.push(panel);
    }
  }

  const courtWash = new THREE.RectAreaLight(0xdff2ff, 0.9, 26, 14);
  courtWash.position.set(0, 12.6, 0);
  courtWash.rotation.x = -Math.PI / 2;
  group.add(courtWash);
  lights.push(courtWash);

  const keyLight = new THREE.SpotLight(0xffe6c8, 34, 34, Math.PI / 5, 0.7, 1.6);
  keyLight.position.set(-9, 13.4, 6);
  keyLight.target.position.set(-6, 0, 0);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0006;
  group.add(keyLight, keyLight.target);
  lights.push(keyLight);

  const rimLight = new THREE.SpotLight(0x9fd8ff, 22, 30, Math.PI / 4.4, 0.75, 1.8);
  rimLight.position.set(10.5, 13.2, -6);
  rimLight.target.position.set(7, 0, 0);
  group.add(rimLight, rimLight.target);
  lights.push(rimLight);

  // court perimeter LED strip in the apron
  [-1, 1].forEach((side) => {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(COURT.length + 1.6, 0.05, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: 0.9 })
    );
    strip.position.set(0, 0.03, side * (COURT.width / 2 + 0.9));
    group.add(strip);
  });
  [-1, 1].forEach((side) => {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.05, COURT.width + 1.6),
      new THREE.MeshBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: 0.9 })
    );
    strip.position.set(side * (COURT.length / 2 + 0.9), 0.03, 0);
    group.add(strip);
  });

  const update = (t) => {
    const pulse = 0.82 + Math.sin(t * 0.8) * 0.1;
    panels.forEach((panel) => {
      panel.material.emissiveIntensity = pulse;
    });
    courtWash.intensity = 0.85 + Math.sin(t * 0.5) * 0.08;
  };

  return { group, lights, update };
}

/* ------------------------------------------------------------------ */
/* whole court zone                                                    */
/* ------------------------------------------------------------------ */

export function buildCourt({ materials, registry, state, sensorField, detail = {} }) {
  const group = new THREE.Group();
  group.name = "courtZone";

  /* apron slab */
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(COURT.length + 4.4, 0.3, COURT.width + 4.4),
    materials.resinFloor
  );
  apron.position.y = -0.25;
  apron.receiveShadow = true;
  group.add(apron);

  /* painted court */
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = Math.round(COURT.width * PPM);
  drawCourtCanvas(canvas.getContext("2d"));
  const courtTexture = new THREE.CanvasTexture(canvas);
  courtTexture.colorSpace = THREE.SRGBColorSpace;
  courtTexture.anisotropy = detail.anisotropy ?? 8;
  const courtMaterial = materials.court.clone();
  courtMaterial.map = courtTexture;
  courtMaterial.clearcoat = 0.32;
  courtMaterial.clearcoatRoughness = 0.28;
  courtMaterial.roughness = 0.42;
  courtMaterial.envMapIntensity = 0.55;
  courtMaterial.needsUpdate = true;
  const court = new THREE.Mesh(new THREE.PlaneGeometry(COURT.length, COURT.width), courtMaterial);
  court.rotation.x = -Math.PI / 2;
  court.position.y = 0.005;
  court.receiveShadow = true;
  group.add(court);

  /* kinetic LED floor */
  const led = createLedFloor();
  group.add(led.mesh);

  /* thin resin safety film with printed sensor nodes */
  const film = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT.length, COURT.width),
    materials.sensorFilm
  );
  film.rotation.x = -Math.PI / 2;
  film.position.y = 0.016;
  group.add(film);

  /* hoops */
  const hoops = [createHoop({ side: -1, materials }), createHoop({ side: 1, materials })];
  hoops.forEach((hoop) => group.add(hoop.group));

  /* gantry + scoreboard + lighting */
  const gantry = createGantry({ materials });
  group.add(gantry.group);
  const scoreboard = createScoreboard({ materials, registry, state });
  group.add(scoreboard.group);
  const lighting = createCourtLighting({ materials });
  group.add(lighting.group);

  /* athletes */
  const team = createTeamScene({ registry, sensorField });
  group.add(team.group);

  /* data visualisation */
  const viz = createDataViz({ materials, registry, telemetry: state });
  group.add(viz.group);

  /* coaches + analysts on the sidelines */
  const benchGroup = new THREE.Group();
  const analystPositions = [
    [-9.5, -8.6],
    [-7.4, -8.6],
    [9.5, 8.6],
    [7.4, 8.6],
  ];
  analystPositions.forEach(([x, z], index) => {
    const figure = createAthlete({
      number: 90 + index,
      accent: index % 2 ? PALETTE.amber : PALETTE.cyan,
      seed: 700 + index * 11,
      height: 1.8,
    });
    figure.group.position.set(x, 0, z);
    figure.group.rotation.y = z > 0 ? Math.PI : 0;
    benchGroup.add(figure.group);
    figure.__bench = true;
    figure.__phase = index * 0.9;
  });
  group.add(benchGroup);

  /* bench + scorer table */
  const benchTable = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.9, 0.9), materials.matteBlackSteel);
  benchTable.position.set(0, 0.45, -9.6);
  group.add(benchTable);
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.06, 1), materials.marble);
  benchTop.position.set(0, 0.92, -9.6);
  group.add(benchTop);
  const benchGlow = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.04, 0.06), materials.neonCyan);
  benchGlow.position.set(0, 0.88, -10.09);
  group.add(benchGlow);
  const benchScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.62), materials.screenGlow);
  benchScreen.position.set(0, 1.35, -9.3);
  group.add(benchScreen);

  const benchUpdate = (t) => {
    benchGroup.children.forEach((child) => {
      child.rotation.y += Math.sin(t * 0.4 + child.__phase) * 0.0015;
      child.position.y = Math.sin(t * 1.2 + child.__phase) * 0.012;
    });
  };

  /* ball for the bench lads */
  const spareBall = createBall();
  spareBall.position.set(10.6, 0.12, 7.4);
  group.add(spareBall);

  const update = (t, dt, runtime) => {
    const activation = runtime.ledActivation ?? 0;
    led.uniforms.uTime.value = t;
    led.uniforms.uActivation.value = activation;
    led.uniforms.uModeMix.value.set(runtime.modeMix[0], runtime.modeMix[1], runtime.modeMix[2]);
    led.uniforms.uTelemetry.value = runtime.telemetryAverage;
    if (sensorField) {
      for (let i = 0; i < 10; i++) {
        const vector = led.uniforms.uPlayers.value[i];
        if (i * 2 + 1 < sensorField.length) {
          vector.set(sensorField[i * 2], sensorField[i * 2 + 1]);
        } else {
          vector.set(999, 999);
        }
      }
    }
    const deploy = clamp(runtime.hoopDeploy ?? 0, 0, 1);
    hoops.forEach((hoop) => hoop.update(deploy));
    gantry.update(t);
    scoreboard.update(t);
    lighting.update(t);
    team.update(t, dt);
    viz.update(t, dt);
    benchUpdate(t);
    film.material.opacity = 0.08 + activation * 0.16;
  };

  return { group, lights: lighting.lights, update, led, hoops, scoreboard };
}
