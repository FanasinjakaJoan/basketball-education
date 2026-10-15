/**
 * Procedural athletes: low-poly articulated figures with a run cycle, jump
 * shots, dribbling balls and a kinetic floor ripple that feeds the court LED
 * shader's "player" uniforms.
 */
import * as THREE from "three";
import { PALETTE } from "./materials.js";
import { clamp, mulberry32 } from "./util.js";

const SKIN_TONES = [0x8d5a3b, 0x6f4429, 0xa9754f, 0x5d3a26];

export function createBall(radius = 0.121) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#d4741f";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#7a3b0d";
  ctx.fillRect(62, 0, 5, 128);
  ctx.fillRect(0, 62, 128, 5);
  ctx.beginPath();
  ctx.arc(64, 64, 42, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#7a3b0d";
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 20, 14),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.72, metalness: 0.02 })
  );
  mesh.name = "ball";
  return mesh;
}

function limbSegment(radius, length, material) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 3, 8), material);
  mesh.position.y = -length / 2 - radius * 0.5;
  pivot.add(mesh);
  return { pivot, mesh };
}

export function createAthlete({ number = 7, accent = PALETTE.cyan, seed = 1, height = 1.98 } = {}) {
  const random = mulberry32(seed);
  const skin = new THREE.MeshStandardMaterial({
    color: SKIN_TONES[Math.floor(random() * SKIN_TONES.length)],
    roughness: 0.72,
    metalness: 0.02,
  });
  const jersey = new THREE.MeshStandardMaterial({
    color: 0x1c2229,
    roughness: 0.68,
    metalness: 0.06,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0d11,
    emissive: new THREE.Color(accent),
    emissiveIntensity: 1.5,
    roughness: 0.4,
    metalness: 0.3,
  });
  const shoe = new THREE.MeshStandardMaterial({ color: 0xf2f5f8, roughness: 0.55, metalness: 0.08 });

  const scale = height / 1.98;
  const group = new THREE.Group();
  group.name = `athlete-${number}`;

  const body = new THREE.Group();
  body.scale.setScalar(scale);
  group.add(body);

  const hips = new THREE.Group();
  hips.position.y = 0.98;
  body.add(hips);

  const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.08, 3, 10), jersey);
  pelvis.rotation.z = Math.PI / 2;
  pelvis.position.y = 0.02;
  hips.add(pelvis);

  const torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.185, 0.36, 4, 12), jersey);
  torsoMesh.position.y = 0.33;
  hips.add(torsoMesh);

  // number strip on the back
  const numberStrip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.02), accentMaterial);
  numberStrip.position.set(0, 0.36, -0.185);
  hips.add(numberStrip);

  const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 3, 8), jersey);
  shoulders.rotation.z = Math.PI / 2;
  shoulders.position.y = 0.52;
  hips.add(shoulders);

  const neck = new THREE.Group();
  neck.position.y = 0.66;
  hips.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), skin);
  head.position.y = 0.1;
  neck.add(head);
  const visor = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014, 6, 18, Math.PI), accentMaterial);
  visor.rotation.set(Math.PI / 2, 0, Math.PI);
  visor.position.set(0, 0.13, 0.02);
  neck.add(visor);

  const arms = [];
  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.235, 0.48, 0);
    hips.add(shoulder);
    const upper = limbSegment(0.062, 0.26, skin);
    shoulder.add(upper.pivot);
    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    upper.pivot.add(elbow);
    const fore = limbSegment(0.052, 0.24, skin);
    elbow.add(fore.pivot);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), skin);
    hand.position.y = -0.3;
    fore.pivot.add(hand);
    arms.push({ side, shoulder, elbow, hand });
  });

  const legs = [];
  [-1, 1].forEach((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.108, -0.02, 0);
    hips.add(hip);
    const thighSkin = new THREE.MeshStandardMaterial({
      color: 0x151a20,
      roughness: 0.66,
      metalness: 0.05,
    });
    const thigh = limbSegment(0.078, 0.3, thighSkin);
    hip.add(thigh.pivot);
    const knee = new THREE.Group();
    knee.position.y = -0.4;
    thigh.pivot.add(knee);
    const shin = limbSegment(0.062, 0.28, thighSkin);
    knee.add(shin.pivot);
    const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.058, 0.1, 10), accentMaterial);
    sock.position.y = -0.62;
    shin.pivot.add(sock);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.075, 0.26), shoe);
    foot.position.set(0, -0.68, 0.045);
    shin.pivot.add(foot);
    legs.push({ side, hip, knee, foot });
  });

  // kinetic floor ripple (fed by foot strikes)
  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.34, 28),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.y = 0.03;
  group.add(ripple);

  return { group, body, hips, neck, arms, legs, ripple, height, number };
}

/**
 * Routine definitions: each athlete runs a named drill on the court.
 * Positions are in court coordinates (origin = court centre, X = length).
 */
export const ROUTINES = [
  { type: "lap", speed: 3.1, radiusX: 12.6, radiusZ: 8.2, phase: 0.0 },
  { type: "lap", speed: 2.6, radiusX: 12.6, radiusZ: 8.2, phase: 2.4 },
  { type: "zigzag", speed: 3.4, z0: -4.4, z1: 4.4, x0: -10, x1: -2, phase: 0.3 },
  { type: "spot", spots: [[-6.2, -5.4], [-6.2, 5.4], [-1.4, 0]], dwell: 2.4, phase: 0.7 },
  { type: "shoot", spot: [-6.6, 0], dwell: 4.2, phase: 1.5 },
  { type: "pass", from: [5.4, -3.2], to: [8.8, 3.2], period: 3.4, phase: 0.0 },
  { type: "sprint", a: [-11.5, -6.6], b: [11.5, -6.6], period: 5.2, phase: 1.1 },
  { type: "zigzag", speed: 3.0, z0: 4.4, z1: -4.4, x0: 10, x1: 2, phase: 2.0 },
];

function lapPosition(t, routine, out) {
  const angle = routine.phase + (t * routine.speed) / Math.max(routine.radiusX, routine.radiusZ);
  out.set(Math.sin(angle) * routine.radiusX, 0, Math.cos(angle) * routine.radiusZ);
  return out;
}

export function createTeamScene({ registry, sensorField }) {
  const group = new THREE.Group();
  group.name = "athletes";
  const athletes = [];
  const positions = new Float32Array(ROUTINES.length * 2);
  const tmp = new THREE.Vector3();
  const prev = new THREE.Vector3();

  ROUTINES.forEach((routine, index) => {
    const isAlpha = index < ROUTINES.length / 2;
    const athlete = createAthlete({
      number: (index * 3 + 4) % 99,
      accent: isAlpha ? PALETTE.cyan : PALETTE.amber,
      seed: 100 + index * 17,
      height: 1.86 + ((index * 7) % 5) * 0.035,
    });
    athlete.routine = routine;
    athlete.isAlpha = isAlpha;
    athlete.phaseOffset = index * 1.37;
    athlete.jump = 0;
    athlete.jumpTimer = 2 + index;
    group.add(athlete.group);
    athletes.push(athlete);
  });

  const ball = createBall();
  group.add(ball);

  const temperature = new THREE.Group();
  group.add(temperature);

  const update = (t, dt) => {
    let lastSpeed = 0;
    athletes.forEach((athlete, index) => {
      const routine = athlete.routine;
      const root = athlete.group;
      let speed = 0;

      prev.copy(root.position);
      if (routine.type === "lap") {
        lapPosition(t, routine, tmp);
        root.position.set(tmp.x, 0, tmp.z);
      } else if (routine.type === "zigzag") {
        const span = routine.x1 - routine.x0;
        const progress = (Math.sin(t * 0.55 * (routine.speed / 3) + routine.phase) + 1) / 2;
        const x = routine.x0 + progress * span;
        const z = (routine.z0 + routine.z1) / 2 + Math.sin(t * 1.7 + routine.phase) * (routine.z1 - routine.z0) * 0.42;
        root.position.set(x, 0, z);
      } else if (routine.type === "spot") {
        const total = routine.spots.length * routine.dwell;
        const local = (t + routine.phase * 5) % total;
        const idx = Math.floor(local / routine.dwell);
        const frac = (local % routine.dwell) / routine.dwell;
        const nextIdx = (idx + 1) % routine.spots.length;
        const from = routine.spots[idx];
        const to = routine.spots[nextIdx];
        const move = clamp((frac - 0.7) / 0.3, 0, 1);
        const ease = move * move * (3 - 2 * move);
        root.position.set(from[0] + (to[0] - from[0]) * ease, 0, from[1] + (to[1] - from[1]) * ease);
        athlete.crouch = Math.sin(t * 1.4 + athlete.phaseOffset) * 0.05 * (1 - move);
      } else if (routine.type === "shoot") {
        root.position.set(routine.spot[0], 0, routine.spot[1]);
        const cycle = ((t + routine.phase * 3) % routine.dwell) / routine.dwell;
        const jump = Math.max(0, Math.sin(clamp((cycle - 0.55) / 0.3, 0, 1) * Math.PI));
        athlete.jump = jump * 0.62;
        speed = 0;
      } else if (routine.type === "pass") {
        root.position.set(routine.from[0], 0, routine.from[1]);
      } else if (routine.type === "sprint") {
        const cycle = ((t + routine.phase * 4) % routine.period) / routine.period;
        const sprint = Math.min(1, Math.max(0, (cycle - 0.15) / 0.25)) * Math.min(1, Math.max(0, (0.85 - cycle) / 0.2));
        const dir = Math.sin((t + routine.phase) * 0.25) > 0 ? 1 : -1;
        const progress = (Math.sin(t * 0.32 + routine.phase) + 1) / 2;
        root.position.set(
          routine.a[0] + (routine.b[0] - routine.a[0]) * progress,
          0,
          routine.a[1] + (routine.b[1] - routine.a[1]) * progress
        );
        speed = 6.4 * sprint * dir;
        athlete.jump = 0;
      }

      const moved = prev.distanceTo(root.position);
      const realSpeed = moved / Math.max(dt, 0.0001);
      speed = routine.type === "sprint" ? speed : realSpeed;
      lastSpeed = speed;
      const gait = speed > 0.2 ? speed : 0;

      // heading: face movement direction (fallback: face the north hoop)
      const dx = root.position.x - prev.x;
      const dz = root.position.z - prev.z;
      if (Math.abs(dx) + Math.abs(dz) > 0.0004) {
        const targetYaw = Math.atan2(dx, dz);
        let delta = targetYaw - root.rotation.y;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        root.rotation.y += delta * Math.min(1, dt * 6);
      } else if (routine.type === "shoot") {
        root.rotation.y += (Math.PI / 2 - root.rotation.y) * Math.min(1, dt * 2);
      }

      // limb animation
      const cycle = t * (2.6 + gait * 1.1) + athlete.phaseOffset;
      const swing = clamp(gait * 0.22, 0.05, 0.9);
      const isShooting = routine.type === "shoot" && athlete.jump > 0.02;
      athlete.legs.forEach((leg, i) => {
        const sign = i === 0 ? 1 : -1;
        leg.hip.rotation.x = Math.sin(cycle + (i ? Math.PI : 0)) * swing;
        leg.knee.rotation.x = Math.max(0, -Math.sin(cycle + (i ? Math.PI : 0) + 0.6)) * swing * 1.2;
      });
      athlete.arms.forEach((arm) => {
        const sign = arm.side;
        if (isShooting) {
          arm.shoulder.rotation.x = -2.5;
          arm.elbow.rotation.x = -0.5;
        } else {
          arm.shoulder.rotation.x = Math.sin(cycle + (sign > 0 ? Math.PI : 0)) * swing * 1.1;
          arm.shoulder.rotation.z = sign * (0.16 + Math.abs(Math.sin(cycle)) * 0.06);
          arm.elbow.rotation.x = -0.35 - Math.abs(Math.sin(cycle * 1.1)) * 0.4;
        }
      });
      const bounce = Math.abs(Math.sin(cycle * 2)) * 0.045 * (0.4 + gait * 0.2);
      athlete.body.position.y = bounce + athlete.jump + (athlete.crouch || 0);
      athlete.body.rotation.x = clamp(gait * 0.03, 0, 0.22);
      athlete.ripple.position.copy(root.position);
      const rip = (Math.sin(t * 3 + athlete.phaseOffset) + 1) / 2;
      athlete.ripple.material.opacity = 0.12 + rip * 0.35 * (0.4 + gait * 0.2);
      athlete.ripple.scale.setScalar(0.9 + rip * 0.5);

      if (sensorField) {
        positions[index * 2] = root.position.x;
        positions[index * 2 + 1] = root.position.z;
      }
    });

    if (sensorField) sensorField.set(positions);

    // ball: dribbled by the zig-zag athlete, passed in the pass routine, shot by the shooter
    const dribbler = athletes[2];
    const passer = athletes[5];
    const shooter = athletes[4];
    const shotCycle = ((t + shooter.routine.phase * 3) % shooter.routine.dwell) / shooter.routine.dwell;
    const ballInFlight = shotCycle > 0.86;
    if (ballInFlight) {
      const flight = (shotCycle - 0.86) / 0.14;
      ball.position.set(
        shooter.group.position.x + flight * 2.6,
        3.05 - Math.abs(flight - 0.5) * 1.2 + 1.6 * Math.sin(flight * Math.PI),
        shooter.group.position.z * (1 - flight)
      );
    } else if (Math.sin(t * 0.8) > 0.2) {
      ball.position.set(
        dribbler.group.position.x + Math.sin(t * 8) * 0.22,
        0.9 + Math.abs(Math.sin(t * 8)) * 0.85,
        dribbler.group.position.z + 0.24
      );
    } else {
      const k = (t % passer.routine.period) / passer.routine.period;
      ball.position.set(
        passer.routine.from[0] + (passer.routine.to[0] - passer.routine.from[0]) * k,
        0.9 + Math.sin(k * Math.PI) * 1.5,
        passer.routine.from[1] + (passer.routine.to[1] - passer.routine.from[1]) * k
      );
    }
    ball.rotation.y += dt * 3.4 * Math.max(1, lastSpeed * 0.4);
    ball.rotation.x += dt * 2.1;
  };

  registry?.add({ interval: 1e9, draw: () => {}, onFrame: update });

  return { group, athletes, update, ball };
}
