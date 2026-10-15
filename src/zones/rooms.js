/**
 * Zone: management & VIP floors.
 *  · Tactical operations centre (TOC) on the north mezzanine: curved
 *    holographic strategy wall, coach workstations, live camera multiview,
 *    player telemetry, holographic court table.
 *  · VIP & guest lounge on the south mezzanine: electrochromic glass that
 *    switches from transparent to opaque, robotic hospitality bar,
 *    biometric entry corridor and floating interfaces.
 */
import * as THREE from "three";
import { HALL } from "../plan.js";
import { PALETTE } from "../lib/materials.js";
import {
  createHoloTable,
  createSmartSurface,
  createVolumetricMaterial,
  feedDraw,
  strategyWallDraw,
  telemetryDraw,
  updateVolumetric,
} from "../lib/holo.js";
import { clamp, mulberry32 } from "../lib/util.js";

const FONT = "Inter, ui-sans-serif, system-ui, sans-serif";
const MEZZ = HALL.mezzanine;

/* ------------------------------------------------------------------ */
/* Tactical operations centre                                          */
/* ------------------------------------------------------------------ */

export function buildWarRoom({ materials, registry, state, screens, detail = {} }) {
  const group = new THREE.Group();
  group.name = "warRoom";
  const lights = [];
  const updates = [];
  const y = MEZZ + 0.16;
  const roomZ = -20.2;
  const random = mulberry32(88);

  /* enclosure: back wall, side walls and the court-facing glazing */
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(16.8, 3.6, 0.26), materials.matteBlackSteel);
  backWall.position.set(0, y + 1.7, roomZ - 2.86);
  group.add(backWall);
  [-1, 1].forEach((side) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.6, 5.6), materials.graphiteSteel);
    sideWall.position.set(side * 8.3, y + 1.7, roomZ);
    sideWall.userData.cutaway = "upper";
    group.add(sideWall);
  });
  const frontPartitions = [];
  for (let i = 0; i < 5; i++) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 3.4),
      materials.electroGlass.clone()
    );
    panel.material.userData.current = 0.09;
    panel.material.opacity = 0.09;
    panel.position.set(-6.4 + i * 3.2, y + 1.7, roomZ + 2.72);
    panel.userData.cutaway = "glass";
    group.add(panel);
    frontPartitions.push({ mesh: panel, phase: i * 0.5 });
  }

  /* dark carpet */
  const carpet = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.06, 5.4), materials.upholstery.clone());
  carpet.material.color = new THREE.Color(0x11161c);
  carpet.position.set(0, y + 0.02, roomZ);
  carpet.receiveShadow = true;
  group.add(carpet);

  /* curved holographic strategy wall — concave face turned to the room */
  const wallRadius = 5.2;
  const wallCenterZ = roomZ - 0.6;
  const wallGroup = new THREE.Group();
  wallGroup.position.set(0, y, wallCenterZ);
  const curve = new THREE.CylinderGeometry(wallRadius, wallRadius, 3.0, 48, 1, true, Math.PI - 0.62, 1.24);
  const wallMesh = new THREE.Mesh(
    curve,
    new THREE.MeshStandardMaterial({
      color: 0x080d13,
      roughness: 0.3,
      metalness: 0.5,
      emissive: 0x08202c,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
    })
  );
  wallMesh.position.y = 1.3;
  wallGroup.add(wallMesh);
  group.add(wallGroup);

  /* three curved holo screens floating in front of the wall */
  const wallScreens = [];
  for (let i = 0; i < 3; i++) {
    const surface = createSmartSurface({
      width: 3.3,
      height: 1.65,
      pixels: 640,
      interval: 0.16,
      registry,
      name: `strategy-${i}`,
      draw: strategyWallDraw(i),
      doubleSide: false,
    });
    const angle = (i - 1) * 0.42;
    surface.mesh.position.set(
      Math.sin(angle) * (wallRadius - 0.3),
      y + 1.55,
      wallCenterZ - Math.cos(angle) * (wallRadius - 0.3)
    );
    surface.mesh.rotation.y = angle;
    group.add(surface.mesh);
    wallScreens.push(surface);
    screens.push(surface);
  }

  /* coach workstations — two tiered rows */
  const deskGeometry = new THREE.BoxGeometry(1.9, 0.08, 0.9);
  const legGeometry = new THREE.BoxGeometry(0.08, 0.72, 0.8);
  const chairGeometry = new THREE.BoxGeometry(0.52, 0.12, 0.52);
  const chairBackGeometry = new THREE.BoxGeometry(0.52, 0.6, 0.09);
  const rows = [
    { z: roomZ - 0.2, y: 0, desks: 4 },
    { z: roomZ + 1.5, y: 0.42, desks: 4 },
  ];
  const workstationCount = rows.reduce((sum, row) => sum + row.desks, 0);
  const desks = new THREE.InstancedMesh(deskGeometry, materials.matteBlackSteel, workstationCount);
  const legs = new THREE.InstancedMesh(legGeometry, materials.darkAluminum, workstationCount * 2);
  const chairs = new THREE.InstancedMesh(chairGeometry, materials.upholstery, workstationCount);
  const chairBacks = new THREE.InstancedMesh(chairBackGeometry, materials.upholstery, workstationCount);
  const monitorGeometry = new THREE.BoxGeometry(1.1, 0.62, 0.05);
  const monitors = new THREE.InstancedMesh(monitorGeometry, materials.screenDark.clone(), workstationCount);
  const dummy = new THREE.Object3D();
  let index = 0;
  rows.forEach((row) => {
    for (let i = 0; i < row.desks; i++) {
      const x = -5.1 + i * 3.4;
      const z = row.z;
      dummy.position.set(x, y + 0.76 + row.y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      desks.setMatrixAt(index, dummy.matrix);
      [-1, 1].forEach((s, k) => {
        dummy.position.set(x + s * 0.85, y + 0.38 + row.y, z);
        dummy.updateMatrix();
        legs.setMatrixAt(index * 2 + k, dummy.matrix);
      });
      dummy.position.set(x, y + 0.46 + row.y, z + 0.95);
      dummy.updateMatrix();
      chairs.setMatrixAt(index, dummy.matrix);
      dummy.position.set(x, y + 0.76 + row.y, z + 1.2);
      dummy.updateMatrix();
      chairBacks.setMatrixAt(index, dummy.matrix);
      dummy.position.set(x, y + 1.12 + row.y, z - 0.28);
      dummy.rotation.set(-0.12, 0, 0);
      dummy.updateMatrix();
      monitors.setMatrixAt(index, dummy.matrix);
      index++;
    }
  });
  [desks, legs, chairs, chairBacks, monitors].forEach((mesh) => {
    mesh.instanceMatrix.needsUpdate = true;
  });
  group.add(desks, legs, chairs, chairBacks, monitors);

  /* monitors: camera multiview + telemetry, as real canvases on the front desks */
  const feedSurfaces = [];
  for (let i = 0; i < 4; i++) {
    const surface = createSmartSurface({
      width: 1.06,
      height: 0.6,
      pixels: 384,
      interval: 0.33 + i * 0.05,
      registry,
      name: `feed-${i}`,
      draw: feedDraw(i),
    });
    const x = -5.1 + i * 3.4;
    surface.mesh.position.set(x, y + 1.16, roomZ + 1.22);
    surface.mesh.rotation.x = -0.12;
    group.add(surface.mesh);
    feedSurfaces.push(surface);
    screens.push(surface);
  }

  const telemetrySurface = createSmartSurface({
    width: 2.6,
    height: 1.6,
    pixels: 640,
    interval: 0.22,
    registry,
    name: "telemetry-wall",
    draw: telemetryDraw,
  });
  telemetrySurface.mesh.position.set(-7.4, y + 1.6, roomZ - 1.2);
  telemetrySurface.mesh.rotation.y = Math.PI / 2 - 0.2;
  group.add(telemetrySurface.mesh);
  screens.push(telemetrySurface);

  const squadSurface = createSmartSurface({
    width: 2.6,
    height: 1.6,
    pixels: 640,
    interval: 0.4,
    registry,
    name: "squad-wall",
    draw: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(3,11,18,0.92)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#ffc07a";
      ctx.font = `700 ${Math.round(w * 0.06)}px ${FONT}`;
      ctx.fillText("SQUAD LOAD · 48 H", w * 0.05, h * 0.12);
      for (let i = 0; i < 8; i++) {
        const value = 0.3 + Math.abs(Math.sin(t * 0.35 + i * 0.8)) * 0.65;
        const barH = h * 0.6;
        const x = w * 0.08 + i * (w * 0.11);
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(x, h * 0.2, w * 0.07, barH);
        const grad = ctx.createLinearGradient(0, h * 0.2 + barH, 0, h * 0.2);
        grad.addColorStop(0, "#5ce6ff");
        grad.addColorStop(1, "#ff7a4a");
        ctx.fillStyle = grad;
        ctx.fillRect(x, h * 0.2 + barH * (1 - value), w * 0.07, barH * value);
        ctx.fillStyle = "rgba(220,240,255,0.7)";
        ctx.font = `600 ${Math.round(w * 0.035)}px ${FONT}`;
        ctx.fillText(`P${i + 1}`, x, h * 0.94);
      }
    },
  });
  squadSurface.mesh.position.set(7.4, y + 1.6, roomZ - 1.2);
  squadSurface.mesh.rotation.y = -Math.PI / 2 + 0.2;
  group.add(squadSurface.mesh);
  screens.push(squadSurface);

  /* central holographic court table */
  const table = new THREE.Group();
  table.position.set(0, y + 0.9, roomZ + 1.6);
  const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 0.9, 24), materials.matteBlackSteel);
  tableBase.position.y = -0.45;
  table.add(tableBase);
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.12, 32), materials.blackGlass);
  table.add(tableTop);
  const tableGlow = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.03, 8, 48), materials.neonCyan);
  tableGlow.rotation.x = Math.PI / 2;
  table.add(tableGlow);
  const holoTable = createHoloTable({ registry, scale: 1.5 });
  holoTable.position.y = 0.1;
  table.add(holoTable);
  group.add(table);

  /* volumetric projector above the table */
  const projector = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 2.6, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: PALETTE.cyan,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  projector.position.set(0, y + 2.4, roomZ + 1.6);
  group.add(projector);
  const projectorHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.42, 0.3, 20),
    materials.brushedAluminum
  );
  projectorHead.position.set(0, y + 3.6, roomZ + 1.6);
  group.add(projectorHead);

  /* ceiling cove + dark acoustic ceiling */
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.18, 5.6), materials.graphiteSteel);
  ceiling.position.set(0, y + 3.4, roomZ);
  ceiling.userData.cutaway = "upper";
  group.add(ceiling);
  for (let i = -1; i <= 1; i++) {
    const cove = new THREE.Mesh(new THREE.BoxGeometry(14, 0.06, 0.14), materials.coveLightShadow);
    cove.position.set(0, y + 3.28, roomZ + i * 1.7);
    group.add(cove);
  }
  const tocLight = new THREE.RectAreaLight(0xbfe6ff, 0.55, 14, 4.6);
  tocLight.position.set(0, y + 3.2, roomZ);
  tocLight.rotation.x = -Math.PI / 2;
  tocLight.userData.cutaway = "upper";
  group.add(tocLight);
  lights.push(tocLight);

  const accentLight = new THREE.PointLight(PALETTE.cyan, 4, 22, 2);
  accentLight.position.set(0, y + 1.4, roomZ - 1.4);
  group.add(accentLight);
  lights.push(accentLight);

  /* holo glow behind the wall */
  const wallHolo = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 2.6),
    new THREE.MeshBasicMaterial({
      color: PALETTE.cyan,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  wallHolo.position.set(0, y + 1.35, wallCenterZ - wallRadius + 0.35);
  group.add(wallHolo);

  /* staff figures at the desks */
  void random;
  void detail;

  const update = (t, dt, runtime) => {
    const privacy = (runtime && runtime.vipPrivacy) || 0;
    frontPartitions.forEach(({ mesh }) => {
      const current = mesh.material.userData.current ?? 0.18;
      const next = current + (0.09 + privacy * 0.55 - current) * Math.min(1, dt * 1.4);
      mesh.material.userData.current = next;
      mesh.material.opacity = next;
      mesh.material.roughness = 0.08 + next * 0.4;
    });
    wallScreens.forEach((surface, i) => {
      surface.mesh.position.y = y + 1.55 + Math.sin(t * 0.6 + i) * 0.02;
    });
    tableGlow.material.opacity = 0.5 + Math.sin(t * 1.4) * 0.3;
    projector.material.opacity = 0.05 + Math.abs(Math.sin(t * 0.9)) * 0.05;
    wallHolo.material.opacity = 0.05 + Math.abs(Math.sin(t * 0.7)) * 0.05;
    updates.forEach((fn) => fn(t));
  };

  return { group, lights, update, wallScreens, monitorSurfaces: feedSurfaces, partitions: frontPartitions };
}

/* ------------------------------------------------------------------ */
/* VIP & guest lounge                                                  */
/* ------------------------------------------------------------------ */

export function buildVipLounge({ materials, registry, state, screens }) {
  const group = new THREE.Group();
  group.name = "vipLounge";
  const lights = [];
  const updates = [];
  const y = MEZZ + 0.16;
  const roomZ = 20.2;

  /* enclosure walls behind the lounge */
  const vipBackWall = new THREE.Mesh(new THREE.BoxGeometry(16.8, 3.6, 0.26), materials.woodTeak);
  vipBackWall.position.set(0, y + 1.7, roomZ + 2.86);
  group.add(vipBackWall);
  [-1, 1].forEach((side) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.6, 5.6), materials.graphiteSteel);
    sideWall.position.set(side * 8.3, y + 1.7, roomZ);
    sideWall.userData.cutaway = "upper";
    group.add(sideWall);
  });

  /* dark stone floor + rug */
  const floor = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.08, 5.4), materials.resinFloor.clone());
  floor.material.color = new THREE.Color(0x1a1410);
  floor.position.set(0, y + 0.03, roomZ);
  floor.receiveShadow = true;
  group.add(floor);
  const rug = new THREE.Mesh(new THREE.BoxGeometry(9, 0.03, 3.6), materials.upholsteryWarm.clone());
  rug.material.color = new THREE.Color(0x3a2b20);
  rug.position.set(-0.4, y + 0.08, roomZ + 0.2);
  group.add(rug);

  /* electrochromic partitions along the court-side glazing */
  const partitions = [];
  const partitionMaterial = materials.electroGlass.clone();
  for (let i = 0; i < 5; i++) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), partitionMaterial.clone());
    panel.position.set(-6.4 + i * 3.2, y + 1.6, roomZ - 2.62);
    panel.userData.cutaway = "glass";
    group.add(panel);
    partitions.push({ mesh: panel, phase: i * 0.4 });
  }
  updates.push((t, dt, runtime) => {
    const opaque = runtime.vipPrivacy ?? 0;
    partitions.forEach(({ mesh, phase }, i) => {
      const target = i % 2 === 0 ? opaque : clamp(opaque * 0.7, 0, 1);
      const current = mesh.material.userData.current ?? 0;
      const next = current + (target - current) * Math.min(1, dt * 1.2);
      mesh.material.userData.current = next;
      mesh.material.opacity = 0.14 + next * 0.78;
      mesh.material.roughness = 0.08 + next * 0.5;
      mesh.material.color.setRGB(
        0.62 - next * 0.5,
        0.78 - next * 0.68,
        0.86 - next * 0.74
      );
      const shift = Math.sin(t * 0.25 + phase) * 0.05;
      mesh.material.opacity = clamp(mesh.material.opacity + shift * 0.1, 0.1, 0.95);
    });
  });

  /* lounge seating — two conversation groups */
  const sofaGeometry = new THREE.BoxGeometry(2.4, 0.4, 0.95);
  const sofaBackGeometry = new THREE.BoxGeometry(2.4, 0.5, 0.2);
  const cushionGeometry = new THREE.BoxGeometry(0.7, 0.14, 0.8);
  const groups = [
    { x: -4.6, z: roomZ - 0.6, rotation: 0 },
    { x: 3.2, z: roomZ - 0.6, rotation: 0 },
  ];
  groups.forEach((placement) => {
    const sofa = new THREE.Mesh(sofaGeometry, materials.leather);
    sofa.position.set(placement.x, y + 0.32, placement.z);
    group.add(sofa);
    const back = new THREE.Mesh(sofaBackGeometry, materials.leather);
    back.position.set(placement.x, y + 0.62, placement.z + 0.4);
    group.add(back);
    for (let i = -1; i <= 1; i++) {
      const cushion = new THREE.Mesh(cushionGeometry, materials.upholstery);
      cushion.position.set(placement.x + i * 0.78, y + 0.56, placement.z + 0.02);
      group.add(cushion);
    }
    const sofa2 = new THREE.Mesh(sofaGeometry, materials.leather);
    sofa2.position.set(placement.x, y + 0.32, placement.z + 2.4);
    sofa2.rotation.y = Math.PI;
    group.add(sofa2);
    const back2 = new THREE.Mesh(sofaBackGeometry, materials.leather);
    back2.position.set(placement.x, y + 0.62, placement.z + 2.0);
    group.add(back2);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 22), materials.marble);
    table.position.set(placement.x, y + 0.42, placement.z + 1.2);
    group.add(table);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.4, 12), materials.gold);
    stem.position.set(placement.x, y + 0.2, placement.z + 1.2);
    group.add(stem);
    // champagne cooler + glasses
    const cooler = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.3, 16), materials.marble);
    cooler.position.set(placement.x + 0.3, y + 0.6, placement.z + 1.2);
    group.add(cooler);
    for (let g2 = 0; g2 < 3; g2++) {
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.035, 0.14, 10),
        new THREE.MeshPhysicalMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.4, roughness: 0.05 })
      );
      glass.position.set(placement.x - 0.25 + g2 * 0.18, y + 0.5, placement.z + 1.1);
      group.add(glass);
    }
  });

  /* leaning bar + robotic service arm */
  const barCounter = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.1, 0.8), materials.matteBlackSteel);
  barCounter.position.set(0, y + 0.55, roomZ - 1.9);
  group.add(barCounter);
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.08, 0.9), materials.marble);
  barTop.position.set(0, y + 1.14, roomZ - 1.9);
  group.add(barTop);
  const barGlow = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.05, 0.08), materials.neonAmber);
  barGlow.position.set(0, y + 0.06, roomZ - 1.48);
  group.add(barGlow);

  for (let i = -3; i <= 3; i++) {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.72, 16), materials.leather);
    stool.position.set(i * 1.0, y + 0.36, roomZ - 0.9);
    group.add(stool);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.05, 16), materials.gold);
    base.position.set(i * 1.0, y + 0.03, roomZ - 0.9);
    group.add(base);
  }

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.5, 0.35), materials.woodTeak);
  shelf.position.set(0, y + 2.6, roomZ - 2.3);
  group.add(shelf);
  const bottleColors = [0x8a5a2b, 0x2f6b4f, 0x6c2f3a, 0xa08b57];
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 14; i++) {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.05, 0.3, 10),
        new THREE.MeshPhysicalMaterial({
          color: bottleColors[(i + row) % bottleColors.length],
          roughness: 0.15,
          metalness: 0.1,
          transparent: true,
          opacity: 0.85,
        })
      );
      bottle.position.set(-3.2 + i * 0.48, y + 2.05 + row * 0.5, roomZ - 2.3);
      group.add(bottle);
    }
    const shelfBoard = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.06, 0.4), materials.brushedAluminum);
    shelfBoard.position.set(0, y + 1.92 + row * 0.5, roomZ - 2.3);
    group.add(shelfBoard);
  }
  const shelfGlow = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.03, 0.06), materials.neonAmber);
  shelfGlow.position.set(0, y + 1.86, roomZ - 2.1);
  group.add(shelfGlow);

  // robotic arm
  const arm = new THREE.Group();
  arm.position.set(3.4, y + 1.18, roomZ - 1.9);
  const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.24, 18), materials.brushedAluminum);
  arm.add(armBase);
  const armLink1 = new THREE.Group();
  armLink1.position.y = 0.14;
  arm.add(armLink1);
  const link1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), materials.brushedAluminum);
  link1.position.y = 0.4;
  armLink1.add(link1);
  const armLink2 = new THREE.Group();
  armLink2.position.y = 0.8;
  armLink1.add(armLink2);
  const link2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), materials.brushedAluminum);
  link2.position.y = 0.35;
  armLink2.add(link2);
  const gripper = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.2), materials.graphiteSteel);
  gripper.position.y = 0.72;
  armLink2.add(gripper);
  group.add(arm);
  updates.push((t) => {
    armLink1.rotation.z = Math.sin(t * 0.5) * 0.35 - 0.1;
    armLink2.rotation.z = Math.sin(t * 0.5 + 1.2) * 0.5 + 0.3;
    armLink1.rotation.y = Math.sin(t * 0.23) * 0.5;
  });

  /* floating interfaces above the bar */
  const menuSurface = createSmartSurface({
    width: 3.2,
    height: 1.4,
    pixels: 640,
    interval: 0.3,
    registry,
    name: "vip-menu",
    transparent: true,
    draw: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(6,12,18,0.72)";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,171,90,0.55)";
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = "#ffd9ad";
      ctx.font = `700 ${Math.round(w * 0.062)}px ${FONT}`;
      ctx.fillText("HOSPITALITY · ANTANANARIVO", w * 0.04, h * 0.16);
      ctx.fillStyle = "rgba(234,247,255,0.9)";
      ctx.font = `600 ${Math.round(w * 0.05)}px ${FONT}`;
      const items = [
        "Ranom-boasary pressé · 12 kcal",
        "Thé vert de Fianarantsoa",
        "Isotonic house mix · Na⁺ 480 mg",
        "Café d'Itasy · cortado",
      ];
      items.forEach((item, i) => ctx.fillText(item, w * 0.04, h * (0.36 + i * 0.16)));
      ctx.fillStyle = "rgba(127,232,255,0.8)";
      ctx.font = `600 ${Math.round(w * 0.04)}px ${FONT}`;
      ctx.fillText(`GUEST SERVICE · ${Math.round(t * 10) % 60} s`, w * 0.04, h * 0.95);
    },
  });
  menuSurface.mesh.position.set(-2.8, y + 2.5, roomZ - 0.6);
  menuSurface.mesh.rotation.y = 0.16;
  group.add(menuSurface.mesh);
  screens.push(menuSurface);

  const matchSurface = createSmartSurface({
    width: 3.4,
    height: 1.9,
    pixels: 640,
    interval: 0.24,
    registry,
    name: "vip-match",
    draw: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(3,10,16,0.9)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#eaf7ff";
      ctx.font = `800 ${Math.round(w * 0.16)}px ${FONT}`;
      ctx.textAlign = "center";
      const score = state?.score || [72, 68];
      ctx.fillText(`${score[0]} — ${score[1]}`, w / 2, h * 0.34);
      ctx.font = `600 ${Math.round(w * 0.055)}px ${FONT}`;
      ctx.fillStyle = "rgba(127,232,255,0.9)";
      ctx.fillText("ALPHA", w * 0.18, h * 0.12);
      ctx.fillStyle = "rgba(255,171,90,0.9)";
      ctx.fillText("BETA", w * 0.82, h * 0.12);
      ctx.fillStyle = "rgba(234,247,255,0.75)";
      ctx.font = `600 ${Math.round(w * 0.045)}px ${FONT}`;
      ctx.fillText(`Q${state?.quarter || 3} · ${state?.gameClock || "07:42"} · COURT CAM 03`, w / 2, h * 0.5);
      // court minimap with live dots
      ctx.strokeStyle = "rgba(127,232,255,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.2, h * 0.6, w * 0.6, h * 0.28);
      for (let i = 0; i < 8; i++) {
        const x = w * 0.2 + ((Math.sin(t * 0.5 + i) + 1) / 2) * w * 0.58;
        const y2 = h * 0.6 + ((Math.cos(t * 0.4 + i) + 1) / 2) * h * 0.26;
        ctx.fillStyle = i < 4 ? "#7fe8ff" : "#ffab5a";
        ctx.beginPath();
        ctx.arc(x, y2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = "left";
    },
  });
  matchSurface.mesh.position.set(3.6, y + 1.9, roomZ - 2.5);
  matchSurface.mesh.rotation.y = -0.08;
  group.add(matchSurface.mesh);
  screens.push(matchSurface);

  /* biometric entry corridor at the west end */
  const entry = new THREE.Group();
  entry.position.set(-7.6, y, roomZ + 0.6);
  const entryFloor = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 2.6), materials.resinFloor);
  entryFloor.position.y = 0.04;
  entry.add(entryFloor);
  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 8, 32), materials.neonCyan);
  scanRing.rotation.x = Math.PI / 2;
  scanRing.position.set(0.4, 0.06, 0);
  entry.add(scanRing);
  const scanPillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.4, 0.22), materials.matteBlackSteel);
  scanPillar.position.set(1.2, 1.2, 0.7);
  entry.add(scanPillar);
  const scanLens = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), materials.neonCyan);
  scanLens.position.set(1.2, 2.3, 0.7);
  entry.add(scanLens);
  const scanBeamMaterial = new THREE.MeshBasicMaterial({
    color: PALETTE.cyan,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const scanBeam = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), scanBeamMaterial);
  scanBeam.position.set(0.4, 1.2, 0.3);
  entry.add(scanBeam);
  const gate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 1.0), materials.smartGlass);
  gate.position.set(1.7, 1.3, 0);
  entry.add(gate);
  group.add(entry);
  updates.push((t, dt, runtime) => {
    scanRing.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
    scanBeam.material.opacity = (runtime.biometricPulse ?? 0.3) * 0.5;
    scanBeam.position.y = 0.2 + ((t * 0.9) % 1) * 2.2;
    gate.material.opacity = 0.15 + (runtime.vipPrivacy ?? 0) * 0.5;
    void dt;
  });

  /* ceiling + lighting */
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.16, 5.6), materials.woodTeak);
  ceiling.position.set(0, y + 3.32, roomZ);
  ceiling.userData.cutaway = "upper";
  group.add(ceiling);
  const cove = new THREE.Mesh(new THREE.BoxGeometry(15, 0.06, 0.12), materials.coveLightShadow);
  cove.position.set(0, y + 3.2, roomZ + 1.6);
  group.add(cove);
  const vipLight = new THREE.RectAreaLight(0xffd9ad, 0.6, 14, 4.2);
  vipLight.position.set(0, y + 3.1, roomZ);
  vipLight.rotation.x = -Math.PI / 2;
  vipLight.userData.cutaway = "upper";
  group.add(vipLight);
  lights.push(vipLight);

  const warmLight = new THREE.PointLight(0xffb066, 3, 16, 2);
  warmLight.position.set(0, y + 2.2, roomZ + 0.6);
  group.add(warmLight);
  lights.push(warmLight);

  /* guest figures (smart casual), gently animated */
  void screens;

  const update = (t, dt, runtime) => {
    updates.forEach((fn) => fn(t, dt, runtime));
  };

  return { group, lights, update, partitions };
}
