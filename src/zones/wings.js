/**
 * Zone: dual team wings (Team Alpha / Team Beta — perfect mirrors).
 * Level 0  locker rooms, gym, water-recycling showers, smart sanitary, cryo pods
 * Level 1  smart dorm pods with biometric sleep tracking + PDLC privacy glass
 * Level 2  study hall (education first), library wall and team lounge
 */
import * as THREE from "three";
import { WING, TEAMS, BRIDGE } from "../plan.js";
import { PALETTE } from "../lib/materials.js";
import { createSmartSurface, mirrorDraw, createLabelSprite } from "../lib/holo.js";
import { mulberry32, clamp } from "../lib/util.js";

const FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

/* shared geometry cache (built once, reused by both wings) */
let cache = null;
function geometries() {
  if (cache) return cache;
  cache = {
    podShell: new THREE.BoxGeometry(2.7, 0.5, 3.3),
    podHead: new THREE.BoxGeometry(2.7, 1.5, 0.2),
    mattress: new THREE.BoxGeometry(1.5, 0.22, 2.1),
    pillow: new THREE.BoxGeometry(1.2, 0.14, 0.4),
    partition: new THREE.PlaneGeometry(2.6, 1.9),
    locker: new THREE.BoxGeometry(1.0, 2.1, 0.6),
    lockerDoor: new THREE.BoxGeometry(0.92, 1.8, 0.04),
    desk: new THREE.BoxGeometry(2.4, 0.08, 1.1),
    deskLeg: new THREE.BoxGeometry(0.08, 0.72, 1.0),
    chair: new THREE.BoxGeometry(0.5, 0.1, 0.5),
    chairBack: new THREE.BoxGeometry(0.5, 0.55, 0.08),
    shelf: new THREE.BoxGeometry(0.35, 2.4, 3.6),
    book: new THREE.BoxGeometry(0.06, 0.28, 0.2),
    bench: new THREE.BoxGeometry(2.2, 0.12, 0.44),
    showerPanel: new THREE.BoxGeometry(1.1, 2.4, 0.06),
    cryoBody: new THREE.CylinderGeometry(0.78, 0.78, 2.3, 20, 1, true),
    cryoBase: new THREE.CylinderGeometry(0.85, 0.9, 0.3, 20),
    basin: new THREE.BoxGeometry(1.6, 0.2, 0.55),
    sofa: new THREE.BoxGeometry(2.6, 0.42, 1.0),
    sofaBack: new THREE.BoxGeometry(2.6, 0.5, 0.18),
    table: new THREE.CylinderGeometry(0.6, 0.6, 0.06, 20),
    tree: new THREE.SphereGeometry(1.4, 12, 10),
    pot: new THREE.CylinderGeometry(0.5, 0.4, 0.7, 14),
    weightPlate: new THREE.CylinderGeometry(0.22, 0.22, 0.05, 14),
    treadmill: new THREE.BoxGeometry(0.9, 0.16, 1.9),
    rail: new THREE.BoxGeometry(0.06, 1.1, 2.0),
  };
  return cache;
}

/* ------------------------------------------------------------------ */
/* dorm level                                                          */
/* ------------------------------------------------------------------ */

function buildDormLevel({ side, team, materials, registry, state, screens, offsets }) {
  const group = new THREE.Group();
  group.name = `dorm-level-${team.id}`;
  const g = geometries();
  const accent = new THREE.Color(team.accent);
  const random = mulberry32(team.id === "alpha" ? 12 : 21);

  const shellMaterial = new THREE.MeshStandardMaterial({ color: 0x272d35, roughness: 0.62, metalness: 0.24 });
  const mattressMaterial = new THREE.MeshStandardMaterial({ color: 0xc4cad1, roughness: 0.95, metalness: 0 });
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b2128,
    roughness: 0.5,
    metalness: 0.3,
    emissive: accent,
    emissiveIntensity: 0.85,
  });

  const podRows = WING.dormRows;
  const totalPods = podRows.reduce((sum, row) => sum + row.pods, 0);
  const shell = new THREE.InstancedMesh(g.podShell, shellMaterial, totalPods);
  const heads = new THREE.InstancedMesh(g.podHead, headMaterial, totalPods);
  const mattresses = new THREE.InstancedMesh(g.mattress, mattressMaterial, totalPods);
  const pillows = new THREE.InstancedMesh(g.pillow, mattressMaterial, totalPods);
  const dummy = new THREE.Object3D();
  const partitions = [];
  const underLights = [];
  const underLightGeometry = new THREE.BoxGeometry(2.5, 0.05, 0.08);
  let index = 0;

  podRows.forEach((row) => {
    const spacing = WING.halfLength * 2 / (row.pods + 1);
    for (let i = 0; i < row.pods; i++) {
      const z = -WING.halfLength + spacing * (i + 1);
      const x = side * row.x;
      const facingOuter = row.x > 30; // outer row faces the park

      dummy.position.set(x, WING.levelHeight + 0.24, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      shell.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x + side * (facingOuter ? 1.3 : -1.3) * 1, WING.levelHeight + 0.95, z);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.updateMatrix();
      heads.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x, WING.levelHeight + 0.6, z);
      dummy.updateMatrix();
      mattresses.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x + side * (facingOuter ? 0.55 : -0.55), WING.levelHeight + 0.75, z);
      dummy.updateMatrix();
      pillows.setMatrixAt(index, dummy.matrix);

      // PDLC privacy partition in front of each pod
      const partition = new THREE.Mesh(g.partition, materials.frostedGlassClear.clone());
      partition.material.transparent = true;
      partition.material.opacity = 0.08;
      partition.rotation.y = Math.PI / 2;
      partition.position.set(x - side * 1.45, WING.levelHeight + 1.05, z);
      partition.userData.frosted = true;
      partitions.push({ mesh: partition, phase: random() * 6.28 });
      group.add(partition);

      // smart-pod accent: a soft LED line under the shell
      const underLight = new THREE.Mesh(
        underLightGeometry,
        new THREE.MeshStandardMaterial({
          color: 0x0b0e12,
          emissive: accent,
          emissiveIntensity: 1.5,
          roughness: 0.4,
        })
      );
      underLight.position.set(x - side * (facingOuter ? 1.15 : -1.15), WING.levelHeight + 0.09, z);
      group.add(underLight);
      underLights.push(underLight);

      index++;
    }
  });
  shell.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  mattresses.instanceMatrix.needsUpdate = true;
  pillows.instanceMatrix.needsUpdate = true;
  group.add(shell, heads, mattresses, pillows);

  /* corridor floor, ceiling and lighting */
  const corridorFloor = new THREE.Mesh(
    new THREE.BoxGeometry(WING.corridorX[1] - WING.corridorX[0] + 0.4, 0.14, WING.halfLength * 2),
    materials.resinFloor
  );
  corridorFloor.position.set(side * ((WING.corridorX[0] + WING.corridorX[1]) / 2), WING.levelHeight + 0.07, 0);
  corridorFloor.receiveShadow = true;
  group.add(corridorFloor);

  const corridorCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.24, WING.halfLength * 2),
    new THREE.MeshStandardMaterial({ color: 0x8d949c, roughness: 0.86, metalness: 0.1 })
  );
  corridorCeiling.position.set(side * ((WING.corridorX[0] + WING.corridorX[1]) / 2), WING.levelHeight + WING.levelHeight - 0.24, 0);
  corridorCeiling.userData.cutaway = "upper";
  group.add(corridorCeiling);

  const stripCount = 10;
  for (let i = 0; i < stripCount; i++) {
    const z = -WING.halfLength + 2 + i * ((WING.halfLength * 2 - 4) / (stripCount - 1));
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.06, 0.6),
      i % 2 === 0
        ? new THREE.MeshStandardMaterial({
            color: 0xf4f9ff,
            emissive: 0xeaf6ff,
            emissiveIntensity: 1.6,
            roughness: 0.5,
          })
        : new THREE.MeshStandardMaterial({
            color: 0x0a0d12,
            emissive: accent,
            emissiveIntensity: 1.4,
          })
    );
    strip.position.set(side * ((WING.corridorX[0] + WING.corridorX[1]) / 2), WING.levelHeight + 3.5, z);
    group.add(strip);
  }

  /* storage lockers along the corridor */
  const lockerCount = 14;
  const lockers = new THREE.InstancedMesh(g.locker, materials.matteBlackSteel, lockerCount);
  const lockerDoors = new THREE.InstancedMesh(
    g.lockerDoor,
    new THREE.MeshStandardMaterial({ color: 0x1d232b, roughness: 0.4, metalness: 0.6 }),
    lockerCount
  );
  for (let i = 0; i < lockerCount; i++) {
    const z = -WING.halfLength + 2 + i * ((WING.halfLength * 2 - 4) / (lockerCount - 1));
    const x = side * (WING.corridorX[0] - 0.5);
    dummy.position.set(x, WING.levelHeight + 1.05, z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    lockers.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x + side * 0.32, WING.levelHeight + 1.05, z);
    dummy.updateMatrix();
    lockerDoors.setMatrixAt(i, dummy.matrix);
  }
  lockers.instanceMatrix.needsUpdate = true;
  lockerDoors.instanceMatrix.needsUpdate = true;
  group.add(lockers, lockerDoors);

  /* room labels */
  const label = createLabelSprite(team.name.en, {
    color: team.id === "alpha" ? "#9ff0ff" : "#ffd7a8",
    sub: "LEVEL 1 · 13 SMART PODS",
    accent: team.id === "alpha" ? "rgba(92,230,255,0.6)" : "rgba(255,171,90,0.6)",
  });
  label.position.set(side * (WING.corridorX[1] + 0.9), WING.levelHeight + 2.7, WING.halfLength - 1.4);
  label.scale.set(3.1, 1.55, 1);
  group.add(label);

  /* one holo clock per pod row */
  const clock = createSmartSurface({
    width: 1.4,
    height: 0.8,
    pixels: 256,
    interval: 0.5,
    registry,
    name: "dorm-clock",
    draw: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(4,14,22,0.9)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#eaf7ff";
      ctx.font = `700 ${Math.round(w * 0.3)}px ${FONT}`;
      ctx.textAlign = "center";
      const minutes = Math.floor(t / 60) % 60;
      const seconds = Math.floor(t) % 60;
      ctx.fillText(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`, w / 2, h * 0.55);
      ctx.font = `600 ${Math.round(w * 0.13)}px ${FONT}`;
      ctx.fillStyle = "rgba(127,232,255,0.8)";
      ctx.fillText("SLEEP 8H12 · HRV 82", w / 2, h * 0.8);
      ctx.textAlign = "left";
    },
  });
  clock.mesh.position.set(side * (WING.corridorX[0] - 0.46), WING.levelHeight + 2.3, WING.halfLength - 2);
  clock.mesh.rotation.y = -side * Math.PI / 2;
  group.add(clock.mesh);
  screens.push(clock);

  void offsets;
  void clamp;
  return { group, partitions, shell };
}

/* ------------------------------------------------------------------ */
/* level 0 — locker rooms, gym, showers, sanitary, cryo                */
/* ------------------------------------------------------------------ */

function buildGroundLevel({ side, team, materials, registry, screens }) {
  const group = new THREE.Group();
  group.name = `ground-level-${team.id}`;
  const g = geometries();
  const accent = new THREE.Color(team.accent);
  const dummy = new THREE.Object3D();
  const updates = [];
  const wetMaterials = [];

  /* ---------- locker room (z: 6 … 16) ---------- */
  const lockerRoom = new THREE.Group();
  const rowCount = 2;
  const perRow = 9;
  const lockerInstances = new THREE.InstancedMesh(g.locker, materials.matteBlackSteel, rowCount * perRow);
  const lockerDoorInstances = new THREE.InstancedMesh(
    g.lockerDoor,
    new THREE.MeshStandardMaterial({ color: 0x1c222a, roughness: 0.35, metalness: 0.65 }),
    rowCount * perRow
  );
  const lockerLedInstances = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.9, 0.03, 0.02),
    new THREE.MeshBasicMaterial({ color: team.accent }),
    rowCount * perRow
  );
  for (let row = 0; row < rowCount; row++) {
    for (let i = 0; i < perRow; i++) {
      const z = 6.6 + i * 1.05;
      const x = side * (row === 0 ? 25 : 26.1);
      const yaw = side * (row === 0 ? Math.PI / 2 : -Math.PI / 2);
      dummy.position.set(x, 1.05, z);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      lockerInstances.setMatrixAt(row * perRow + i, dummy.matrix);
      dummy.position.set(x + side * (row === 0 ? 0.34 : -0.34), 1.05, z);
      dummy.updateMatrix();
      lockerDoorInstances.setMatrixAt(row * perRow + i, dummy.matrix);
      dummy.position.set(x + side * (row === 0 ? 0.36 : -0.36), 1.85, z);
      dummy.updateMatrix();
      lockerLedInstances.setMatrixAt(row * perRow + i, dummy.matrix);
    }
  }
  lockerInstances.instanceMatrix.needsUpdate = true;
  lockerDoorInstances.instanceMatrix.needsUpdate = true;
  lockerLedInstances.instanceMatrix.needsUpdate = true;
  lockerRoom.add(lockerInstances, lockerDoorInstances, lockerLedInstances);

  // benches between the rows
  for (let i = 0; i < 5; i++) {
    const bench = new THREE.Mesh(g.bench, materials.woodTeak);
    bench.position.set(side * 25.6, 0.45, 7.4 + i * 1.9);
    bench.rotation.y = side * Math.PI / 2;
    lockerRoom.add(bench);
    [-1, 1].forEach((legSide) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 8), materials.darkAluminum);
      leg.position.set(side * 25.6, 0.21, 7.4 + i * 1.9 + legSide * 0.8);
      lockerRoom.add(leg);
    });
  }

  // team crest wall + holo lineup board
  const crest = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 2.6, 6.4),
    new THREE.MeshStandardMaterial({
      color: 0x0d1116,
      emissive: accent,
      emissiveIntensity: 0.32,
      roughness: 0.4,
      metalness: 0.4,
    })
  );
  crest.position.set(side * 24.6, 1.9, 11);
  lockerRoom.add(crest);
  const lineupBoard = createSmartSurface({
    width: 3.4,
    height: 1.9,
    pixels: 512,
    interval: 0.4,
    registry,
    name: `lineup-${team.id}`,
    draw: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(5,12,18,0.94)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = team.id === "alpha" ? "#8ce8ff" : "#ffc07a";
      ctx.font = `700 ${Math.round(w * 0.06)}px ${FONT}`;
      ctx.fillText(team.name.en.toUpperCase(), w * 0.05, h * 0.12);
      ctx.fillStyle = "#eaf7ff";
      ctx.font = `600 ${Math.round(w * 0.045)}px ${FONT}`;
      const players = ["RAKOTO M.", "ANDRIA S.", "RAZAFY T.", "RABE L.", "RASOA J."];
      players.forEach((name, i) => {
        ctx.fillText(`#${(i + 4) * 3}  ${name}`, w * 0.05, h * (0.26 + i * 0.13));
        const load = 0.4 + Math.abs(Math.sin(t * 0.6 + i)) * 0.55;
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(w * 0.55, h * (0.21 + i * 0.13), w * 0.4, 8);
        ctx.fillStyle = team.id === "alpha" ? "#5ce6ff" : "#ffab5a";
        ctx.fillRect(w * 0.55, h * (0.21 + i * 0.13), w * 0.4 * load, 8);
        ctx.fillStyle = "#eaf7ff";
      });
      ctx.fillStyle = "rgba(220,240,255,0.6)";
      ctx.font = `500 ${Math.round(w * 0.038)}px ${FONT}`;
      ctx.fillText("READINESS · LOAD · UNIFORM RFID", w * 0.05, h * 0.95);
    },
  });
  lineupBoard.mesh.position.set(side * 24.9, 1.9, 11);
  lineupBoard.mesh.rotation.y = -side * Math.PI / 2;
  lockerRoom.add(lineupBoard.mesh);
  screens.push(lineupBoard);
  group.add(lockerRoom);

  /* ---------- team gym (z: -6 … 6, x: 24 … 30) ---------- */
  const gym = new THREE.Group();
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.4, 3.2), materials.matteBlackSteel);
  rack.position.set(side * 24.8, 1.2, 2);
  gym.add(rack);
  for (let i = 0; i < 8; i++) {
    const plate = new THREE.Mesh(g.weightPlate, materials.matteBlackSteel);
    plate.rotation.z = Math.PI / 2;
    plate.position.set(side * 25.4, 0.4 + i * 0.26, -1.2);
    gym.add(plate);
  }
  for (let i = 0; i < 3; i++) {
    const tread = new THREE.Mesh(g.treadmill, materials.graphiteSteel);
    tread.position.set(side * (28.6 + i * 1.2), 0.2, -3.4);
    tread.rotation.y = side * Math.PI / 2;
    gym.add(tread);
    const rail = new THREE.Mesh(g.rail, materials.brushedAluminum);
    rail.position.set(side * (28.6 + i * 1.2), 0.8, -3.4);
    rail.rotation.y = side * Math.PI / 2;
    gym.add(rail);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), materials.screenGlow);
    screen.position.set(side * (28.6 + i * 1.2) - side * 0.5, 1.2, -3.4);
    screen.rotation.y = -side * Math.PI / 2;
    gym.add(screen);
  }
  // mirror wall
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.6), materials.mirrorGlass);
  mirror.position.set(side * 25.2, 1.4, 4.4);
  mirror.rotation.y = -side * Math.PI / 2;
  gym.add(mirror);
  group.add(gym);

  /* ---------- showers + sanitary + cryo (z: -16 … -6) ---------- */
  const wet = new THREE.Group();
  wet.name = `wet-zone-${team.id}`;
  const showerCount = 6;
  const stallW = 1.25;
  for (let i = 0; i < showerCount; i++) {
    const z = -6.9 - i * stallW;
    // tray
    const tray = new THREE.Mesh(new THREE.BoxGeometry(stallW - 0.1, 0.08, 1.4), materials.wetRoom);
    tray.position.set(side * 34.4, 0.04, z);
    tray.receiveShadow = true;
    wet.add(tray);
    // glass partition
    const panel = new THREE.Mesh(g.showerPanel, materials.frostedGlass.clone());
    panel.position.set(side * 34.4, 1.2, z - stallW / 2);
    wet.add(panel);
    // chromotherapy light column
    const chrome = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.9, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x0a0d12, emissive: 0x22ffbb, emissiveIntensity: 1.5 })
    );
    chrome.position.set(side * 35.0, 1.3, z);
    wet.add(chrome);
    wetMaterials.push({ material: chrome.material, phase: i * 0.7 });
    // shower head + water
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), materials.brushedAluminum);
    head.position.set(side * 34.4, 2.3, z);
    wet.add(head);
    const droplets = 40;
    const positions = new Float32Array(droplets * 3);
    for (let d = 0; d < droplets; d++) {
      positions[d * 3] = side * 34.4 + (Math.random() - 0.5) * 0.4;
      positions[d * 3 + 1] = Math.random() * 2.2;
      positions[d * 3 + 2] = z + (Math.random() - 0.5) * 0.4;
    }
    const waterGeometry = new THREE.BufferGeometry();
    waterGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const water = new THREE.Points(
      waterGeometry,
      new THREE.PointsMaterial({
        color: 0xbfe9ff,
        size: 0.035,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    wet.add(water);
    updates.push((t, dt) => {
      const attr = waterGeometry.getAttribute("position");
      for (let d = 0; d < droplets; d++) {
        let y = attr.getY(d) - dt * (1.6 + (d % 5) * 0.15);
        if (y < 0.05) y = 2.25;
        attr.setY(d, y);
      }
      attr.needsUpdate = true;
      void t;
    });
  }

  // smart mirrors + basins
  for (let i = 0; i < 3; i++) {
    const z = -12.6 - i * 1.4;
    const counter = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 2.6), materials.marble);
    counter.position.set(side * 33.4, 0.92, z);
    wet.add(counter);
    for (let k = -1; k <= 1; k++) {
      const basin = new THREE.Mesh(g.basin, materials.whiteComposite);
      basin.rotation.y = Math.PI / 2;
      basin.position.set(side * 33.4, 1.0, z + k * 0.8);
      wet.add(basin);
    }
    const mirrorSurface = createSmartSurface({
      width: 2.4,
      height: 1.5,
      pixels: 512,
      interval: 0.35,
      registry,
      name: `smart-mirror-${team.id}-${i}`,
      draw: mirrorDraw,
      doubleSide: true,
    });
    mirrorSurface.mesh.position.set(side * 34.1, 1.7, z);
    mirrorSurface.mesh.rotation.y = -side * Math.PI / 2;
    wet.add(mirrorSurface.mesh);
    screens.push(mirrorSurface);
    void mirrorSurface.mesh;
  }

  // sanitary stalls (privacy + touchless)
  for (let i = 0; i < 3; i++) {
    const z = -8.6 - i * 1.5;
    const stall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.3, 0.08), materials.frostedGlass);
    stall.position.set(side * 31.8, 1.15, z);
    stall.rotation.y = Math.PI / 2;
    wet.add(stall);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.1, 0.06), materials.compositePanel);
    door.position.set(side * 31.3, 1.05, z);
    door.rotation.y = Math.PI / 2;
    wet.add(door);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.9), materials.neonLime);
    led.position.set(side * 31.24, 2.2, z);
    wet.add(led);
  }

  // cryotherapy pods
  const cryo = [];
  for (let i = 0; i < 2; i++) {
    const z = -14.6 - i * 2.4;
    const pod = new THREE.Group();
    pod.position.set(side * 30.4, 0, z);
    const base = new THREE.Mesh(g.cryoBase, materials.matteBlackSteel);
    base.position.y = 0.15;
    pod.add(base);
    const body = new THREE.Mesh(g.cryoBody, materials.mirrorGlass.clone());
    body.material.transparent = true;
    body.material.opacity = 0.45;
    body.position.y = 1.45;
    pod.add(body);
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 2.0, 18),
      new THREE.MeshStandardMaterial({
        color: 0x08222e,
        emissive: 0x35c8ff,
        emissiveIntensity: 0.9,
        roughness: 0.3,
        metalness: 0.4,
        transparent: true,
        opacity: 0.55,
      })
    );
    inner.position.y = 1.4;
    pod.add(inner);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 8, 24), materials.brushedAluminum);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 2.62;
    pod.add(rim);
    const display = createSmartSurface({
      width: 0.8,
      height: 0.4,
      pixels: 256,
      interval: 0.4,
      registry,
      name: `cryo-display-${team.id}-${i}`,
      draw: (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(2,10,16,0.92)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#8ce8ff";
        ctx.font = `800 ${Math.round(w * 0.32)}px ${FONT}`;
        ctx.textAlign = "center";
        ctx.fillText(`-${(108 + Math.sin(t * 0.4) * 2).toFixed(0)}°C`, w / 2, h * 0.5);
        ctx.font = `600 ${Math.round(w * 0.15)}px ${FONT}`;
        ctx.fillStyle = "rgba(220,240,255,0.7)";
        ctx.fillText("CRYO · 3 MIN", w / 2, h * 0.82);
        ctx.textAlign = "left";
      },
    });
    display.mesh.position.set(0, 1.5, side * 0.78);
    display.mesh.rotation.y = 0;
    pod.add(display.mesh);
    screens.push(display);
    // cold mist
    const mistCount = 60;
    const mistPositions = new Float32Array(mistCount * 3);
    for (let m = 0; m < mistCount; m++) {
      mistPositions[m * 3] = (Math.random() - 0.5) * 1.4;
      mistPositions[m * 3 + 1] = Math.random() * 2.6;
      mistPositions[m * 3 + 2] = (Math.random() - 0.5) * 1.4;
    }
    const mistGeometry = new THREE.BufferGeometry();
    mistGeometry.setAttribute("position", new THREE.BufferAttribute(mistPositions, 3));
    const mist = new THREE.Points(
      mistGeometry,
      new THREE.PointsMaterial({
        color: 0xdfefff,
        size: 0.05,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    pod.add(mist);
    updates.push((t, dt) => {
      const attr = mistGeometry.getAttribute("position");
      for (let m = 0; m < mistCount; m++) {
        let y = attr.getY(m) - dt * 0.25;
        if (y < 0.05) y = 2.7;
        attr.setY(m, y);
      }
      attr.needsUpdate = true;
      void t;
    });
    cryo.push(pod);
    wet.add(pod);
  }

  group.add(wet);

  /* chromotherapy programme cycling */
  const programmes = [
    [0x2bff9f, "recovery"],
    [0x3fa8ff, "focus"],
    [0xff5f8f, "circulation"],
    [0xffc75f, "energy"],
  ];
  updates.push((t) => {
    wetMaterials.forEach(({ material, phase }) => {
      const cycle = (t * 0.12 + phase * 0.2) % programmes.length;
      const a = programmes[Math.floor(cycle) % programmes.length];
      const b = programmes[(Math.floor(cycle) + 1) % programmes.length];
      const k = cycle - Math.floor(cycle);
      const color = new THREE.Color(a[0]).lerp(new THREE.Color(b[0]), k);
      material.emissive.copy(color);
      material.emissiveIntensity = 1.1 + Math.sin(t * 1.4 + phase) * 0.35;
    });
  });

  void cryo;
  return { group, updates };
}

/* ------------------------------------------------------------------ */
/* level 2 — study hall, library, team lounge                          */
/* ------------------------------------------------------------------ */

function buildStudyLevel({ side, team, materials, registry, screens }) {
  const group = new THREE.Group();
  group.name = `study-level-${team.id}`;
  const g = geometries();
  const accent = new THREE.Color(team.accent);
  const dummy = new THREE.Object3D();
  const y = WING.levelHeight * 2;

  /* holo whiteboard */
  const board = createSmartSurface({
    width: 4.6,
    height: 2.4,
    pixels: 768,
    interval: 0.3,
    registry,
    name: `holo-board-${team.id}`,
    draw: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(3,12,20,0.94)";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(127,232,255,0.35)";
      ctx.lineWidth = 2;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (h / 6) * i);
        ctx.lineTo(w, (h / 6) * i);
        ctx.stroke();
      }
      ctx.fillStyle = "#eaf7ff";
      ctx.font = `700 ${Math.round(w * 0.055)}px ${FONT}`;
      ctx.fillText("PHYSICS · TRAJECTORY OF A SHOT", w * 0.05, h * 0.16);
      ctx.strokeStyle = "#ffab5a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.78);
      for (let i = 0; i <= 60; i++) {
        const x = w * 0.08 + (i / 60) * w * 0.84;
        const progress = i / 60;
        const yv = h * 0.78 - Math.sin(progress * Math.PI) * h * 0.5 * (0.9 + Math.sin(t * 0.6) * 0.06);
        ctx.lineTo(x, yv);
      }
      ctx.stroke();
      ctx.fillStyle = "rgba(127,232,255,0.9)";
      ctx.font = `600 ${Math.round(w * 0.04)}px ${FONT}`;
      ctx.fillText("v₀ = 7.4 m/s · θ = 52° · release 2.24 m", w * 0.2, h * 0.9);
      ctx.fillText(`COHORT 2026 · ${team.name.en.toUpperCase()}`, w * 0.66, h * 0.16);
    },
  });
  board.mesh.position.set(side * 24.95, y + 1.8, 6.5);
  board.mesh.rotation.y = -side * Math.PI / 2;
  group.add(board.mesh);
  screens.push(board);

  /* desks */
  const deskCount = 9;
  const desks = new THREE.InstancedMesh(g.desk, materials.whiteComposite, deskCount);
  const legsA = new THREE.InstancedMesh(g.deskLeg, materials.darkAluminum, deskCount * 2);
  const chairs = new THREE.InstancedMesh(g.chair, materials.upholstery, deskCount * 2);
  const chairBacks = new THREE.InstancedMesh(g.chairBack, materials.upholstery, deskCount * 2);
  for (let i = 0; i < deskCount; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = side * (26.4 + col * 1.9);
    const z = 0.4 + row * 3.0;
    dummy.position.set(x, y + 0.76, z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    desks.setMatrixAt(i, dummy.matrix);
    [-1, 1].forEach((legSide) => {
      dummy.position.set(x + legSide * 1.0, y + 0.38, z);
      dummy.updateMatrix();
      legsA.setMatrixAt(i * 2 + (legSide < 0 ? 0 : 1), dummy.matrix);
    });
    [-1, 1].forEach((chairSide) => {
      dummy.position.set(x, y + 0.46, z + chairSide * 0.95);
      dummy.updateMatrix();
      chairs.setMatrixAt(i * 2 + (chairSide < 0 ? 0 : 1), dummy.matrix);
      dummy.position.set(x, y + 0.75, z + chairSide * 1.18);
      dummy.updateMatrix();
      chairBacks.setMatrixAt(i * 2 + (chairSide < 0 ? 0 : 1), dummy.matrix);
    });
  }
  [desks, legsA, chairs, chairBacks].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
  });
  group.add(desks, legsA, chairs, chairBacks);

  /* library wall */
  const shelf = new THREE.Mesh(g.shelf, materials.woodTeak);
  shelf.position.set(side * 36.6, y + 1.2, -6);
  group.add(shelf);
  const bookColors = [0x8c5b3f, 0x2f4b63, 0x6d4a63, 0x8a7a3c, 0x3f6152];
  const books = new THREE.InstancedMesh(
    g.book,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.05 }),
    (bookColors.length * 4) * 4
  );
  books.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(bookColors.length * 16 * 3), 3);
  let bookIndex = 0;
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 16; i++) {
      const color = new THREE.Color(bookColors[(i + row) % bookColors.length]);
      dummy.position.set(side * 36.5, y + 0.55 + row * 0.55, -7.5 + i * 0.2);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      books.setMatrixAt(bookIndex, dummy.matrix);
      books.setColorAt(bookIndex, color);
      bookIndex++;
    }
  }
  books.instanceMatrix.needsUpdate = true;
  if (books.instanceColor) books.instanceColor.needsUpdate = true;
  group.add(books);

  /* tutoring booths */
  for (let i = 0; i < 3; i++) {
    const booth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.08), materials.frostedGlass);
    booth.position.set(side * 32.4, y + 1.1, -3 + i * 2.2);
    booth.rotation.y = Math.PI / 2;
    group.add(booth);
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.0), materials.coveLight);
    light.position.set(side * 32.4, y + 2.2, -3 + i * 2.2);
    light.rotation.y = Math.PI / 2;
    group.add(light);
  }

  /* team lounge corner with holo entertainment wall */
  const sofa = new THREE.Mesh(g.sofa, materials.upholsteryWarm);
  sofa.position.set(side * 27.6, y + 0.36, -9.5);
  sofa.rotation.y = side * Math.PI;
  group.add(sofa);
  const sofaBack = new THREE.Mesh(g.sofaBack, materials.upholsteryWarm);
  sofaBack.position.set(side * 27.6, y + 0.66, -10);
  sofaBack.rotation.y = side * Math.PI;
  group.add(sofaBack);
  const table = new THREE.Mesh(g.table, materials.marble);
  table.position.set(side * 27.6, y + 0.42, -8.4);
  group.add(table);
  const screenWall = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 2.1),
    materials.screenGlow.clone()
  );
  screenWall.position.set(side * 25, y + 1.5, -9.5);
  screenWall.rotation.y = side * Math.PI / 2;
  group.add(screenWall);

  /* plant wall + green terrace hint */
  for (let i = 0; i < 5; i++) {
    const pot = new THREE.Mesh(g.pot, new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.8 }));
    pot.position.set(side * 35.6, y + 0.35, 8 + i * 1.6);
    group.add(pot);
    const plant = new THREE.Mesh(g.tree, materials.plant);
    plant.scale.setScalar(0.35);
    plant.position.set(side * 35.6, y + 1.2, 8 + i * 1.6);
    group.add(plant);
  }

  /* accent cove lighting tinted per team */
  for (let i = 0; i < 6; i++) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.06, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x090c10, emissive: accent, emissiveIntensity: 1.2 })
    );
    strip.position.set(side * (26 + (i % 2) * 4), y + 2.9, -8 + Math.floor(i / 2) * 6);
    group.add(strip);
  }

  void dummy;
  return { group };
}

/* ------------------------------------------------------------------ */
/* wing assembly                                                       */
/* ------------------------------------------------------------------ */

function buildWing({ side, team, materials, registry, state, screens, updates }) {
  const group = new THREE.Group();
  group.name = `wing-${team.id}`;
  const innerX = side * WING.innerX;
  const outerX = side * WING.outerX;
  const centerX = (innerX + outerX) / 2;
  const width = WING.outerX - WING.innerX;

  /* floor slabs (levels 1-2 have a stair void in the corridor) */
  const voidA = side * WING.corridorX[0] + side * 0.2;
  const voidB = side * WING.corridorX[1] - side * 0.2;
  const voidLoX = Math.min(voidA, voidB);
  const voidHiX = Math.max(voidA, voidB);
  const voidZ0 = -5.2;
  const voidZ1 = 1.2;
  for (let level = 0; level <= WING.levels; level++) {
    const y = level * WING.levelHeight;
    const slabMaterial = level === 0 ? materials.concrete : materials.compositePanel;
    const innerEdge = Math.min(innerX, outerX);
    const outerEdge = Math.max(innerX, outerX);
    if (level === 0) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.34, WING.halfLength * 2), slabMaterial);
      slab.position.set(centerX, y - 0.2, 0);
      slab.receiveShadow = true;
      slab.castShadow = true;
      group.add(slab);
    } else {
      const pieces = [
        { x0: innerEdge, x1: voidLoX, z0: -WING.halfLength, z1: WING.halfLength },
        { x0: voidHiX, x1: outerEdge, z0: -WING.halfLength, z1: WING.halfLength },
        { x0: voidLoX, x1: voidHiX, z0: -WING.halfLength, z1: voidZ0 },
        { x0: voidLoX, x1: voidHiX, z0: voidZ1, z1: WING.halfLength },
      ];
      pieces.forEach((piece) => {
        const w = piece.x1 - piece.x0;
        const d = piece.z1 - piece.z0;
        if (w <= 0.05 || d <= 0.05) return;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, d), slabMaterial);
        slab.position.set((piece.x0 + piece.x1) / 2, y - 0.09, (piece.z0 + piece.z1) / 2);
        slab.receiveShadow = true;
        slab.castShadow = true;
        if (level >= 2) slab.userData.cutaway = "upper";
        group.add(slab);
      });
      // slab edge trims around the void
      [voidZ0, voidZ1].forEach((zEdge) => {
        const trim = new THREE.Mesh(
          new THREE.BoxGeometry(voidHiX - voidLoX, 0.4, 0.16),
          materials.matteBlackSteel
        );
        trim.position.set((voidLoX + voidHiX) / 2, y - 0.2, zEdge);
        if (level >= 2) trim.userData.cutaway = "upper";
        group.add(trim);
      });
      // stair flight rising along the void (12 treads ≈ one storey)
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 0.42), materials.concreteLight);
        step.position.set(
          centerX,
          WING.levelHeight - 0.3 - (i / steps) * WING.levelHeight,
          voidZ1 - 0.4 - i * ((voidZ1 - voidZ0 - 0.6) / steps)
        );
        step.receiveShadow = true;
        group.add(step);
      }
    }
    const soffitLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, WING.halfLength * 2 - 1),
      materials.coveLight
    );
    soffitLight.position.set(side * (WING.corridorX[0] - 0.9), y - 0.4, 0);
    if (level >= 2) soffitLight.userData.cutaway = "upper";
    group.add(soffitLight);
  }

  /* end walls (z = ±16) and outer curtain wall (x = ±38) */
  [-1, 1].forEach((zs) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(width, WING.height, 0.4),
      zs < 0 ? materials.matteBlackSteel : materials.compositePanel
    );
    wall.position.set(centerX, WING.height / 2, zs * WING.halfLength);
    wall.castShadow = true;
    group.add(wall);
    if (zs > 0) {
      // glazed south end with the team name band
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(width - 2, WING.height - 2.4), materials.smartGlass);
      glass.position.set(centerX, WING.height / 2 + 0.4, zs * (WING.halfLength + 0.22));
      glass.userData.cutaway = "glass";
      group.add(glass);
    }
  });

  const finCount = 9;
  for (let i = 0; i <= finCount; i++) {
    const z = -WING.halfLength + (i / finCount) * WING.halfLength * 2;
    const mullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, WING.height, 0.16),
      materials.brushedAluminum
    );
    mullion.position.set(outerX, WING.height / 2, z);
    group.add(mullion);
  }
  const outerGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(WING.halfLength * 2, WING.height - 4.2),
    materials.smartGlass
  );
  outerGlass.rotation.y = -side * Math.PI / 2;
  outerGlass.position.set(outerX, WING.height / 2 + 1.9, 0);
  outerGlass.userData.cutaway = "glass";
  group.add(outerGlass);

  // spandrel: a solid band keeps every level grounded against the exterior
  [1, 2].forEach((level) => {
    const spandrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 1.5, WING.halfLength * 2),
      materials.compositePanel
    );
    spandrel.position.set(outerX, level * WING.levelHeight - 0.4, 0);
    group.add(spandrel);
    const ledge = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.12, WING.halfLength * 2),
      materials.brushedAluminum
    );
    ledge.position.set(outerX - side * 0.2, level * WING.levelHeight + 0.4, 0);
    group.add(ledge);
  });

  /* inner facade: solid except the bridge openings */
  const holeZ = [BRIDGE.z[0] - 1.2, BRIDGE.z[1] + 1.2];
  for (let i = 0; i < 12; i++) {
    const z = -WING.halfLength + (i + 0.5) * (WING.halfLength * 2 / 12);
    if (z > holeZ[0] && z < holeZ[1]) continue;
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, WING.height, WING.halfLength * 2 / 12 + 0.02),
      i % 3 === 0 ? materials.matteBlackSteel : materials.compositePanel
    );
    panel.position.set(innerX, WING.height / 2, z);
    group.add(panel);
  }
  // infill above the bridge openings
  [
    { y: 0.9, height: 1.8 },
    { y: 4.8, height: 6.6 },
  ].forEach(({ y, height }) => {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, height, holeZ[1] - holeZ[0]),
      materials.compositePanel
    );
    panel.position.set(innerX, y + height / 2, (holeZ[0] + holeZ[1]) / 2);
    group.add(panel);
  });

  /* roof */
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.36, WING.halfLength * 2 + 0.6), materials.concrete);
  roof.position.set(centerX, WING.height + 0.18, 0);
  roof.userData.cutaway = "roof";
  roof.castShadow = true;
  group.add(roof);

  /* roof gardens at both ends */
  [-1, 1].forEach((zs) => {
    const garden = new THREE.Mesh(
      new THREE.BoxGeometry(width - 3, 0.3, 5.4),
      materials.lawn
    );
    garden.position.set(centerX, WING.height + 0.5, zs * 11.4);
    garden.userData.cutaway = "roof";
    group.add(garden);
    for (let i = 0; i < 3; i++) {
      const tree = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), materials.plantDark);
      tree.position.set(side * (23 + i * 5), WING.height + 1.5, zs * 11.4);
      tree.userData.cutaway = "roof";
      group.add(tree);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.2, 8), materials.woodTeak);
      trunk.position.set(side * (23 + i * 5), WING.height + 0.9, zs * 11.4);
      trunk.userData.cutaway = "roof";
      group.add(trunk);
    }
  });

  /* PV on the wing roofs */
  const pv = new THREE.InstancedMesh(
    new THREE.BoxGeometry(3.4, 0.08, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x0b1522, roughness: 0.25, metalness: 0.6, emissive: 0x0a1e33, emissiveIntensity: 0.3 }),
    8
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 8; i++) {
    dummy.position.set(centerX + ((i % 2) - 0.5) * 4.6, WING.height + 0.62, -12 + Math.floor(i / 2) * 3.2);
    dummy.rotation.set(-0.14, 0, 0);
    dummy.updateMatrix();
    pv.setMatrixAt(i, dummy.matrix);
  }
  pv.instanceMatrix.needsUpdate = true;
  pv.userData.cutaway = "roof";
  group.add(pv);

  /* atrium glazing around the stair void */
  const atrium = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, WING.height - 0.8, 3.6),
    materials.smartGlass
  );
  atrium.position.set(side * 29, WING.height / 2, -2);
  atrium.userData.cutaway = "glass";
  group.add(atrium);

  /* per-level fit-out */
  const dorm = buildDormLevel({ side, team, materials, registry, state, screens, updates });
  const ground = buildGroundLevel({ side, team, materials, registry, screens });
  const study = buildStudyLevel({ side, team, materials, registry, screens });
  group.add(ground.group, dorm.group, study.group);
  updates.push(...ground.updates);

  /* level-0 accent lighting strips */
  const accentColor = new THREE.Color(team.accent);
  const baseStrips = [];
  for (let i = 0; i < 10; i++) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.08, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x090c10, emissive: accentColor, emissiveIntensity: 1.1 })
    );
    strip.position.set(side * 27.6, 2.9, -13 + i * 2.8);
    group.add(strip);
    baseStrips.push(strip);
  }
  updates.push((t) => {
    baseStrips.forEach((strip, i) => {
      strip.material.emissiveIntensity = 0.8 + (Math.sin(t * 1.1 - i * 0.6) + 1) * 0.7;
    });
  });

  /* dorm corridor people (a couple of players walking) */
  return { group, partitions: dorm.partitions, updates };
}

export function buildWings({ materials, registry, state, screens }) {
  const group = new THREE.Group();
  group.name = "wings";
  const updates = [];
  const wings = [];

  TEAMS.forEach((team) => {
    const wing = buildWing({
      side: team.side,
      team,
      materials,
      registry,
      state,
      screens,
      updates,
    });
    group.add(wing.group);
    wings.push({ team, ...wing });
  });

  /* corridor lighting: one cool wash per occupied level and a warm stair light */
  const lights = [];
  TEAMS.forEach((team) => {
    [1, 2].forEach((level) => {
      const light = new THREE.RectAreaLight(0xdcefff, 1.35, 2.8, 26);
      light.position.set(
        team.side * ((WING.corridorX[0] + WING.corridorX[1]) / 2),
        level * WING.levelHeight + 3.1,
        0
      );
      light.rotation.x = -Math.PI / 2;
      light.userData.cutaway = "upper";
      group.add(light);
      lights.push(light);

      const accent = new THREE.PointLight(team.accent, 3.2, 22, 2);
      accent.position.set(team.side * WING.corridorX[1], level * WING.levelHeight + 2.0, 0);
      accent.userData.cutaway = "upper";
      group.add(accent);
      lights.push(accent);
    });

    const stairLight = new THREE.PointLight(0xffe3c0, 5.5, 20, 2);
    stairLight.position.set(team.side * 29, WING.levelHeight + 1.6, -2);
    group.add(stairLight);
    lights.push(stairLight);
  });

  const update = (t, dt, runtime) => {
    updates.forEach((fn) => fn(t, dt, runtime));
    // PDLC partitions react to "privacy" runtime value (pod mode)
    const privacy = runtime.podPrivacy ?? 0.35;
    wings.forEach((wing) => {
      wing.partitions.forEach(({ mesh, phase }) => {
        const wobble = 0.12 * Math.sin(t * 0.6 + phase);
        mesh.material.opacity = clamp(privacy + wobble, 0.06, 0.85);
        mesh.material.roughness = 0.1 + privacy * 0.65;
      });
    });
  };

  return { group, lights, update, wings };
}
