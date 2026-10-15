/**
 * Zone: site & landscape.
 * Ground plane, entrance plaza with adaptive LED paving, reflecting pool,
 * outdoor training court, jogging loop, tree planting and 180 smart light
 * poles that wake in sequence as players walk the campus.
 */
import * as THREE from "three";
import { SITE, HALL, WING } from "../plan.js";
import { PALETTE } from "../lib/materials.js";
import { mulberry32 } from "../lib/util.js";
import { createLabelSprite } from "../lib/holo.js";

function inBuilding(x, z, margin = 4) {
  const insideHall =
    Math.abs(x) < HALL.width / 2 + margin && Math.abs(z) < HALL.length / 2 + margin;
  const insideWings =
    Math.abs(x) > WING.innerX - margin - 4 && Math.abs(x) < WING.outerX + margin && Math.abs(z) < WING.halfLength + margin;
  return insideHall || insideWings;
}

export function buildLandscape({ materials, registry, detail = {} }) {
  const group = new THREE.Group();
  group.name = "landscape";
  const random = mulberry32(90210);
  const updates = [];
  const poleHeads = [];

  /* ---------------- ground ---------------- */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x0e1116, roughness: 0.96, metalness: 0.04 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.32;
  ground.receiveShadow = true;
  group.add(ground);

  /* ---------------- entrance plaza ---------------- */
  const plaza = new THREE.Mesh(
    new THREE.BoxGeometry(64, 0.2, SITE.plazaDepth),
    materials.paving
  );
  plaza.position.set(0, -0.16, HALL.entranceZ - SITE.plazaDepth / 2 + 4);
  plaza.receiveShadow = true;
  group.add(plaza);

  // adaptive LED paving lines
  const pavingLines = [];
  for (let i = 0; i < 10; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(60, 0.03, 0.16),
      new THREE.MeshBasicMaterial({
        color: 0x9ff0ff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    line.position.set(0, -0.05, HALL.entranceZ - 6 - i * 3.4);
    group.add(line);
    pavingLines.push({ line, phase: i * 0.55 });
  }
  updates.push((t) => {
    pavingLines.forEach(({ line, phase }) => {
      const wave = (Math.sin(t * 0.9 - phase) + 1) / 2;
      line.material.opacity = 0.08 + wave * 0.55;
    });
  });

  /* ---------------- reflecting pool ---------------- */
  const poolDeck = new THREE.Mesh(
    new THREE.BoxGeometry(SITE.pool.width + 6, 0.22, SITE.pool.depth + 6),
    materials.paving
  );
  poolDeck.position.set(SITE.pool.x, -0.14, SITE.pool.z);
  poolDeck.receiveShadow = true;
  group.add(poolDeck);
  const water = new THREE.Mesh(
    new THREE.BoxGeometry(SITE.pool.width, 0.16, SITE.pool.depth),
    materials.waterFeature
  );
  water.position.set(SITE.pool.x, -0.03, SITE.pool.z);
  group.add(water);
  const poolEdge = new THREE.Mesh(
    new THREE.BoxGeometry(SITE.pool.width + 0.4, 0.04, SITE.pool.depth + 0.4),
    materials.marble
  );
  poolEdge.position.set(SITE.pool.x, 0.04, SITE.pool.z);
  group.add(poolEdge);
  // submerged lighting
  for (let i = -3; i <= 3; i++) {
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.08, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xa8f0ff, transparent: true, opacity: 0.7 })
    );
    glow.position.set(SITE.pool.x + i * 4.2, -0.08, SITE.pool.z + SITE.pool.depth / 2 - 1);
    group.add(glow);
  }

  /* ---------------- outdoor training court ---------------- */
  const outdoor = new THREE.Group();
  outdoor.position.set(52, 0, -26);
  const courtDeck = new THREE.Mesh(new THREE.BoxGeometry(17, 0.2, 30), materials.rubberTrack);
  courtDeck.position.y = -0.1;
  courtDeck.receiveShadow = true;
  outdoor.add(courtDeck);
  const courtPaint = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 28),
    new THREE.MeshStandardMaterial({ color: 0x1d4a5e, roughness: 0.7, metalness: 0.05 })
  );
  courtPaint.rotation.x = -Math.PI / 2;
  courtPaint.position.y = 0.02;
  outdoor.add(courtPaint);
  const paintMaterial = new THREE.MeshBasicMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.75 });
  [
    { size: [15, 0.02, 0.12], pos: [0, 0.03, -14] },
    { size: [15, 0.02, 0.12], pos: [0, 0.03, 14] },
    { size: [0.12, 0.02, 28], pos: [-7.5, 0.03, 0] },
    { size: [0.12, 0.02, 28], pos: [7.5, 0.03, 0] },
    { size: [15, 0.02, 0.12], pos: [0, 0.03, 0] },
  ].forEach((line) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...line.size), paintMaterial);
    mesh.position.set(...line.pos);
    outdoor.add(mesh);
  });
  [-1, 1].forEach((side) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4.2, 12), materials.matteBlackSteel);
    pole.position.set(side * 8.6, 2.1, 0);
    outdoor.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), materials.brushedAluminum);
    arm.position.set(side * 7.9, 4.05, 0);
    outdoor.add(arm);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, 1.8), materials.compositePanel);
    board.position.set(side * 7.15, 3.5, 0);
    outdoor.add(board);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.02, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xf06a2c, roughness: 0.4, metalness: 0.7 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(side * 6.9, 3.05, 0);
    outdoor.add(rim);
  });
  group.add(outdoor);

  /* ---------------- jogging loop ---------------- */
  const loopRadius = 78;
  const loop = new THREE.Mesh(
    new THREE.TorusGeometry(loopRadius, 1.6, 6, 96),
    materials.rubberTrack
  );
  loop.rotation.x = Math.PI / 2;
  loop.position.set(0, -0.2, 6);
  loop.scale.set(1, 0.72, 1);
  group.add(loop);
  const loopMarkers = [];
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.04, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.5 })
    );
    marker.position.set(Math.cos(angle) * loopRadius, -0.05, 6 + Math.sin(angle) * loopRadius * 0.72);
    marker.rotation.y = -angle;
    group.add(marker);
    loopMarkers.push({ marker, phase: i * 0.24 });
  }
  updates.push((t) => {
    loopMarkers.forEach(({ marker, phase }) => {
      const wave = (Math.sin(t * 1.8 - phase) + 1) / 2;
      marker.material.opacity = 0.08 + wave * 0.7;
    });
  });

  /* ---------------- trees ---------------- */
  const treeCount = detail.trees ?? 120;
  const trunkGeometry = new THREE.CylinderGeometry(0.16, 0.24, 3.4, 8);
  const canopyGeometry = new THREE.SphereGeometry(1.9, 10, 8);
  const canopyGeometry2 = new THREE.SphereGeometry(1.3, 8, 6);
  const trunks = new THREE.InstancedMesh(trunkGeometry, materials.woodTeak, treeCount);
  const canopies = new THREE.InstancedMesh(canopyGeometry, materials.plantDark, treeCount);
  const canopies2 = new THREE.InstancedMesh(canopyGeometry2, materials.plant, treeCount);
  const dummy = new THREE.Object3D();
  let placed = 0;
  let guard = 0;
  while (placed < treeCount && guard < treeCount * 40) {
    guard++;
    const x = (random() - 0.5) * 300;
    const z = (random() - 0.5) * 300;
    const radius = Math.hypot(x, z);
    if (inBuilding(x, z, 8) || radius < 52 || radius > 210) continue;
    const scale = 0.85 + random() * 0.8;
    dummy.rotation.set(0, random() * Math.PI, 0);
    dummy.scale.setScalar(scale);
    dummy.position.set(x, 1.7 * scale, z);
    dummy.updateMatrix();
    trunks.setMatrixAt(placed, dummy.matrix);
    dummy.position.set(x, 3.5 * scale, z);
    dummy.updateMatrix();
    canopies.setMatrixAt(placed, dummy.matrix);
    dummy.position.set(x + (random() - 0.5) * 1.6, 4.7 * scale, z + (random() - 0.5) * 1.6);
    dummy.scale.setScalar(scale * 0.85);
    dummy.updateMatrix();
    canopies2.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  trunks.count = placed;
  canopies.count = placed;
  canopies2.count = placed;
  trunks.instanceMatrix.needsUpdate = true;
  canopies.instanceMatrix.needsUpdate = true;
  canopies2.instanceMatrix.needsUpdate = true;
  trunks.castShadow = true;
  group.add(trunks, canopies, canopies2);

  /* hedges along the facade */
  for (let i = -6; i <= 6; i++) {
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(6, 0.9, 1.2), materials.plantDark);
    hedge.position.set(i * 6.6, 0.34, HALL.entranceZ - 16);
    hedge.userData.cutaway = undefined;
    group.add(hedge);
  }

  /* ---------------- smart light poles ---------------- */
  const poleCount = 44;
  const poleGeometry = new THREE.CylinderGeometry(0.11, 0.15, 7.4, 10);
  const poleInstances = new THREE.InstancedMesh(poleGeometry, materials.matteBlackSteel, poleCount);
  let poleIndex = 0;
  const polePositions = [];
  for (let i = 0; i < poleCount; i++) {
    let x;
    let z;
    if (i < 16) {
      // plaza rows
      const row = i % 2;
      x = -28 + Math.floor(i / 2) * 8;
      z = HALL.entranceZ - 8 - row * 12;
    } else if (i < 28) {
      const angle = ((i - 16) / 12) * Math.PI * 2;
      x = Math.cos(angle) * 62;
      z = 6 + Math.sin(angle) * 46;
    } else {
      const angle = ((i - 28) / (poleCount - 28)) * Math.PI * 2;
      x = Math.cos(angle) * 96;
      z = 6 + Math.sin(angle) * 70;
    }
    if (inBuilding(x, z, 3)) continue;
    dummy.position.set(x, 3.7, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    poleInstances.setMatrixAt(poleIndex, dummy.matrix);
    poleIndex++;
    polePositions.push([x, z, i]);
  }
  poleInstances.count = poleIndex;
  poleInstances.instanceMatrix.needsUpdate = true;
  group.add(poleInstances);

  const headGeometry = new THREE.SphereGeometry(0.32, 10, 8);
  polePositions.forEach(([x, z], index) => {
    const head = new THREE.Mesh(
      headGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x101418,
        emissive: index % 3 === 0 ? PALETTE.amber : PALETTE.cyan,
        emissiveIntensity: 1.2,
        roughness: 0.4,
      })
    );
    head.position.set(x, 7.4, z);
    group.add(head);
    poleHeads.push({ head, phase: index * 0.37 });
  });
  updates.push((t) => {
    poleHeads.forEach(({ head, phase }) => {
      const wave = (Math.sin(t * 1.1 - phase) + 1) / 2;
      head.material.emissiveIntensity = 0.5 + wave * 2.4;
    });
  });

  /* a few real lights so the plaza reads at night */
  [
    [24, 7.6, HALL.entranceZ - 10],
    [-24, 7.6, HALL.entranceZ - 10],
    [40, 7.4, 18],
    [-40, 7.4, 18],
  ].forEach(([x, y, z]) => {
    const light = new THREE.PointLight(0xa8d8ff, 9, 46, 2);
    light.position.set(x, y, z);
    group.add(light);
  });

  /* ---------------- car park + vehicles ---------------- */
  const carPark = new THREE.Mesh(new THREE.BoxGeometry(46, 0.18, 22), materials.asphalt);
  carPark.position.set(-56, -0.2, HALL.entranceZ - 30);
  carPark.receiveShadow = true;
  group.add(carPark);
  const carBody = new THREE.BoxGeometry(1.9, 0.7, 4.3);
  const carRoof = new THREE.BoxGeometry(1.7, 0.6, 2.2);
  const carColors = [0x1a1d22, 0x2b3138, 0x8d949c, 0x243a4a, 0x3a2b2b];
  for (let i = 0; i < 8; i++) {
    const material = new THREE.MeshStandardMaterial({
      color: carColors[i % carColors.length],
      roughness: 0.35,
      metalness: 0.6,
    });
    const body = new THREE.Mesh(carBody, material);
    const row = i % 2;
    const x = -70 + Math.floor(i / 2) * 3.2;
    const z = HALL.entranceZ - 30 + (row ? 4 : -4);
    body.position.set(x, 0.35, z);
    body.rotation.y = Math.PI / 2;
    group.add(body);
    const roof = new THREE.Mesh(carRoof, material);
    roof.position.set(x, 0.95, z);
    roof.rotation.y = Math.PI / 2;
    group.add(roof);
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.1, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xff5a3c })
    );
    glow.position.set(x - 2.1, 0.45, z);
    glow.rotation.y = Math.PI / 2;
    group.add(glow);
  }

  /* ---------------- site labels (explore mode) ---------------- */
  const labels = new THREE.Group();
  labels.name = "siteLabels";
  [
    ["ENTRANCE PLAZA", 0, 4, HALL.entranceZ - 20],
    ["OUTDOOR COURT", 52, 5, -26],
    ["REFLECTING POOL", SITE.pool.x, 4, SITE.pool.z],
    ["TEAM PARKING", -56, 4.5, HALL.entranceZ - 42],
  ].forEach(([text, x, y, z]) => {
    const label = createLabelSprite(text, { width: 320, sub: "SMART SITE" });
    label.position.set(x, y, z);
    label.scale.multiplyScalar(2.1);
    labels.add(label);
  });
  labels.visible = false;
  group.add(labels);

  const update = (t) => {
    updates.forEach((fn) => fn(t));
    water.material.opacity = 0.78 + Math.sin(t * 0.5) * 0.04;
  };

  return { group, update, labels };
}
