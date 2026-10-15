/**
 * Zone: architectural shell of the hall.
 * Slabs, acoustic side walls, floor-to-ceiling smart-glass curtain walls with
 * steel fins, roof with structural skylights + PV array, service trusses,
 * seating banks, mezzanines (VIP deck + tactical operations floor), the
 * entrance canopy, the player tunnel and every automated sliding door.
 *
 * Objects that should disappear in "floor plan" mode are tagged with
 * userData.cutaway = "roof" | "upper" | "glass".
 */
import * as THREE from "three";
import { HALL, WING, BRIDGE, COURT } from "../plan.js";
import { PALETTE } from "../lib/materials.js";
import { createSmartSurface, roundedRect } from "../lib/holo.js";
import { mulberry32, roundedBox } from "../lib/util.js";

const FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

/* ------------------------------------------------------------------ */
/* automated sliding doors                                             */
/* ------------------------------------------------------------------ */

export function createSlidingDoor({ x = 0, y = 0, z = 0, width = 3.2, height = 2.8, axis = "x", materials, label = "door" }) {
  const group = new THREE.Group();
  group.name = `door-${label}`;
  group.position.set(x, y, z);

  const postGeometry = new THREE.BoxGeometry(0.16, height, 0.16);
  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(postGeometry, materials.matteBlackSteel);
    if (axis === "x") post.position.set(0, height / 2, side * (width / 2 + 0.08));
    else post.position.set(side * (width / 2 + 0.08), height / 2, 0);
    group.add(post);
  });

  const lintel = new THREE.Mesh(
    axis === "x"
      ? new THREE.BoxGeometry(0.34, 0.24, width + 0.32)
      : new THREE.BoxGeometry(width + 0.32, 0.24, 0.34),
    materials.graphiteSteel
  );
  lintel.position.y = height + 0.12;
  group.add(lintel);

  const leafWidth = width / 2;
  const leafGeometry =
    axis === "x"
      ? new THREE.BoxGeometry(0.07, height - 0.08, leafWidth)
      : new THREE.BoxGeometry(leafWidth, height - 0.08, 0.07);
  const leaves = [];
  [-1, 1].forEach((side) => {
    const leaf = new THREE.Mesh(leafGeometry, materials.smartGlass);
    const closed = side * (leafWidth / 2);
    if (axis === "x") leaf.position.set(0, (height - 0.08) / 2, closed);
    else leaf.position.set(closed, (height - 0.08) / 2, 0);
    group.add(leaf);

    const edge = new THREE.Mesh(
      axis === "x" ? new THREE.BoxGeometry(0.075, height - 0.2, 0.05) : new THREE.BoxGeometry(0.05, height - 0.2, 0.075),
      materials.neonCyan
    );
    edge.position.copy(leaf.position);
    if (axis === "x") edge.position.z = closed - side * (leafWidth / 2 - 0.04);
    else edge.position.x = closed - side * (leafWidth / 2 - 0.04);
    group.add(edge);
    leaves.push({ leaf, edge, closed, side });
  });

  const sensor = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.1, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x0a0d12, emissive: PALETTE.lime, emissiveIntensity: 1.4 })
  );
  sensor.position.set(0, height + 0.36, axis === "x" ? -0.18 : 0);
  if (axis !== "x") sensor.position.x = 0;
  group.add(sensor);

  const threshold = new THREE.Mesh(
    axis === "x" ? new THREE.BoxGeometry(0.2, 0.03, width) : new THREE.BoxGeometry(width, 0.03, 0.2),
    materials.coveLight
  );
  threshold.position.y = 0.02;
  group.add(threshold);

  let open = 0;
  const update = (t, target = 0) => {
    open += (target - open) * 0.16;
    const travel = leafWidth * 0.95 * open;
    leaves.forEach(({ leaf, edge, closed, side }) => {
      const value = closed + side * travel;
      if (axis === "x") {
        leaf.position.z = value;
        edge.position.z = value - side * (leafWidth / 2 - 0.04);
      } else {
        leaf.position.x = value;
        edge.position.x = value - side * (leafWidth / 2 - 0.04);
      }
    });
    sensor.material.emissiveIntensity = 1 + open * 1.8 + Math.sin(t * 5) * 0.12;
    threshold.material.opacity = 0.35 + open * 0.5;
    return open;
  };

  return { group, update, leaves, get open() { return open; } };
}

/* ------------------------------------------------------------------ */
/* curtain wall helper                                                 */
/* ------------------------------------------------------------------ */

function buildCurtainWall({ width, height, panels = 8, materials, tint = 0xbfe3f2, finSpacing = 3.2 }) {
  const group = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), materials.smartGlass.clone());
  glass.material.color = new THREE.Color(tint);
  glass.position.y = height / 2;
  glass.userData.cutaway = "glass";
  group.add(glass);

  // mullions
  const divisions = Math.max(2, Math.round(width / finSpacing));
  for (let i = 0; i <= divisions; i++) {
    const x = -width / 2 + (i / divisions) * width;
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.1, height, 0.22), materials.graphiteSteel);
    mullion.position.set(x, height / 2, 0);
    group.add(mullion);
  }
  // transoms
  [0.34, 0.62, 0.86].forEach((fraction) => {
    const transom = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, 0.16), materials.darkAluminum);
    transom.position.set(0, height * fraction, 0);
    group.add(transom);
  });
  // base podium
  const podium = new THREE.Mesh(new THREE.BoxGeometry(width, 1.6, 0.5), materials.concrete);
  podium.position.set(0, 0.8, 0);
  podium.userData.cutaway = "upper";
  group.add(podium);
  // steel fins
  const fins = new THREE.Group();
  for (let i = 0; i <= divisions; i += 2) {
    const x = -width / 2 + (i / divisions) * width;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, height * 0.92, 0.9), materials.matteBlackSteel);
    fin.position.set(x, height * 0.52, 0.55);
    fin.rotation.z = 0.02;
    fins.add(fin);
  }
  group.add(fins);
  void panels;
  return { group, glass, fins };
}

/* ------------------------------------------------------------------ */
/* roof, trusses, PV                                                   */
/* ------------------------------------------------------------------ */

function buildRoof({ materials, detail = {} }) {
  const group = new THREE.Group();
  group.name = "roof";
  const width = HALL.width + 2.4;
  const length = HALL.length + 2.4;
  const skylights = [];
  const slabWidth = 3.4;
  const skyWidth = 1.6;
  const count = 7;
  const totalWidth = count * slabWidth + (count - 1) * skyWidth;
  let x = -totalWidth / 2;

  for (let i = 0; i < count; i++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(slabWidth, 0.62, length), materials.concrete);
    slab.position.set(x + slabWidth / 2, HALL.wallHeight + 0.31, 0);
    slab.userData.cutaway = "roof";
    slab.castShadow = true;
    slab.receiveShadow = true;
    group.add(slab);
    x += slabWidth;
    if (i < count - 1) {
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(skyWidth, length - 1), materials.smartGlass);
      glass.rotation.x = -Math.PI / 2;
      glass.position.set(x + skyWidth / 2, HALL.wallHeight + 0.34, 0);
      glass.userData.cutaway = "roof";
      group.add(glass);
      const skyLight = new THREE.RectAreaLight(0xd8ecff, 0.32, skyWidth * 0.9, length * 0.5);
      skyLight.position.set(x + skyWidth / 2, HALL.wallHeight - 0.2, 0);
      skyLight.rotation.x = -Math.PI / 2;
      skyLight.userData.cutaway = "roof";
      group.add(skyLight);
      skylights.push({ glass, light: skyLight });
      // skylight frame
      [-1, 1].forEach((side) => {
        const railFrame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, length), materials.brushedAluminum);
        railFrame.position.set(x + skyWidth / 2 + side * (skyWidth / 2 + 0.08), HALL.wallHeight + 0.3, 0);
        railFrame.userData.cutaway = "roof";
        group.add(railFrame);
      });
      x += skyWidth;
    }
  }

  // flat dark deck + acoustic felt under the skylight strips: keeps the
  // interior reads crisp when the camera looks up, and bounces soft light
  const deckMaterial = new THREE.MeshStandardMaterial({ color: 0x11151b, roughness: 0.9, metalness: 0.08 });
  const ceilingDeck = new THREE.Mesh(new THREE.PlaneGeometry(width, length), deckMaterial);
  ceilingDeck.rotation.x = Math.PI / 2;
  ceilingDeck.position.set(0, HALL.wallHeight + 0.62, 0);
  ceilingDeck.userData.cutaway = "roof";
  ceilingDeck.castShadow = true;
  group.add(ceilingDeck);

  // parapet
  const parapetMaterial = materials.graphiteSteel;
  [
    { size: [width, 1.1, 0.3], pos: [0, HALL.wallHeight + 0.55, -length / 2] },
    { size: [width, 1.1, 0.3], pos: [0, HALL.wallHeight + 0.55, length / 2] },
    { size: [0.3, 1.1, length], pos: [-width / 2, HALL.wallHeight + 0.55, 0] },
    { size: [0.3, 1.1, length], pos: [width / 2, HALL.wallHeight + 0.55, 0] },
  ].forEach(({ size, pos }) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(...size), parapetMaterial);
    wall.position.set(...pos);
    wall.userData.cutaway = "roof";
    wall.castShadow = true;
    group.add(wall);
  });

  // PV array on top of the slabs
  const pvMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1522,
    roughness: 0.22,
    metalness: 0.6,
    emissive: 0x0a1e33,
    emissiveIntensity: 0.35,
  });
  const pvGeometry = new THREE.BoxGeometry(slabWidth - 0.3, 0.08, 4.6);
  const pvCount = count * 8;
  const pv = new THREE.InstancedMesh(pvGeometry, pvMaterial, pvCount);
  pv.userData.cutaway = "roof";
  const dummy = new THREE.Object3D();
  let index = 0;
  const random = mulberry32(77);
  for (let i = 0; i < count; i++) {
    const slabX = -totalWidth / 2 + i * (slabWidth + skyWidth) + slabWidth / 2;
    for (let j = 0; j < 8; j++) {
      dummy.position.set(slabX, HALL.wallHeight + 0.56, -length / 2 + 3.2 + j * 5.6);
      dummy.rotation.set(-0.18, 0, 0);
      dummy.scale.setScalar(0.98 + random() * 0.04);
      dummy.updateMatrix();
      pv.setMatrixAt(index++, dummy.matrix);
    }
  }
  pv.instanceMatrix.needsUpdate = true;
  pv.castShadow = false;
  group.add(pv);

  // rooftop plant + HVAC
  const plant = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.4, 2),
      materials.brushedAluminum
    );
    box.position.set(-12 + i * 5, HALL.wallHeight + 1.1, i % 2 ? 18 : -18);
    box.userData.cutaway = "roof";
    plant.add(box);
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16), materials.darkAluminum);
    fan.position.set(box.position.x, HALL.wallHeight + 1.85, box.position.z);
    fan.userData.cutaway = "roof";
    plant.add(fan);
  }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 2.6, 22), materials.whiteComposite);
  tank.position.set(-14.5, HALL.wallHeight + 1.6, 0);
  tank.userData.cutaway = "roof";
  plant.add(tank);
  group.add(plant);

  void detail;
  return { group, skylights };
}

function buildTrusses({ materials }) {
  const group = new THREE.Group();
  group.name = "trusses";
  const y = HALL.wallHeight - 1.1;
  for (let i = -3; i <= 3; i++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, HALL.length - 0.6), materials.graphiteSteel);
    beam.position.set(i * 5.6, y, 0);
    beam.userData.cutaway = "roof";
    beam.castShadow = true;
    group.add(beam);
  }
  for (let z = -21; z <= 21; z += 6) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(HALL.width - 0.6, 0.4, 0.24), materials.graphiteSteel);
    beam.position.set(0, y - 0.5, z);
    beam.userData.cutaway = "roof";
    group.add(beam);
    if (z % 12 === 0) {
      [-1, 1].forEach((side) => {
        const diagonal = new THREE.Mesh(new THREE.BoxGeometry(7.9, 0.14, 0.14), materials.darkAluminum);
        diagonal.position.set(side * 4.4, y - 1.5, z + 3);
        diagonal.rotation.z = side * 0.42;
        diagonal.userData.cutaway = "roof";
        group.add(diagonal);
      });
    }
  }
  return group;
}

/* ------------------------------------------------------------------ */
/* seating + mezzanines                                                */
/* ------------------------------------------------------------------ */

function buildSeating({ materials }) {
  const group = new THREE.Group();
  group.name = "seating";
  const rows = 4;
  const perRow = 18;
  const firstRowZ = 9.4;
  const rowStep = 1.5;
  const seatGeometry = new THREE.BoxGeometry(0.46, 0.12, 0.44);
  const backGeometry = new THREE.BoxGeometry(0.46, 0.5, 0.1);
  const seatMaterial = materials.upholstery.clone();
  seatMaterial.color = new THREE.Color(0x1d232b);
  const instanced = new THREE.InstancedMesh(seatGeometry, seatMaterial, rows * perRow * 2);
  const backs = new THREE.InstancedMesh(backGeometry, seatMaterial, rows * perRow * 2);
  const dummy = new THREE.Object3D();
  let index = 0;
  [-1, 1].forEach((side) => {
    for (let row = 0; row < rows; row++) {
      const z = side * (firstRowZ + row * rowStep);
      const y = 0.55 + row * 0.52;
      for (let i = 0; i < perRow; i++) {
        const x = -12.6 + i * 1.48;
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        instanced.setMatrixAt(index, dummy.matrix);
        dummy.position.set(x, y + 0.3, z - side * 0.2);
        dummy.rotation.set(side * 0.12, 0, 0);
        dummy.updateMatrix();
        backs.setMatrixAt(index, dummy.matrix);
        index++;
      }
    }
    // tiers / steps
    for (let row = 0; row < rows; row++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(HALL.width - 1.6, 0.52, rowStep),
        materials.concrete
      );
      step.position.set(0, 0.29 + row * 0.52, side * (firstRowZ + row * rowStep + rowStep / 2 - 0.1));
      step.receiveShadow = true;
      group.add(step);
      const nosing = new THREE.Mesh(
        new THREE.BoxGeometry(HALL.width - 1.6, 0.04, 0.06),
        materials.neonCyanDimm
      );
      nosing.position.set(0, 0.53 + row * 0.52, side * (firstRowZ + row * rowStep - 0.12));
      group.add(nosing);
    }
  });
  instanced.instanceMatrix.needsUpdate = true;
  backs.instanceMatrix.needsUpdate = true;
  instanced.castShadow = true;
  group.add(instanced, backs);
  return group;
}

function buildMezzanine({ materials, side = 1, depth = HALL.mezzanineDepth, width = HALL.width }) {
  const group = new THREE.Group();
  group.name = `mezzanine-${side > 0 ? "south" : "north"}`;
  const zCenter = side * (HALL.length / 2 - depth / 2);
  const courtEdgeZ = zCenter - side * (depth / 2 + 0.25);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, depth), materials.concrete);
  slab.position.set(0, HALL.mezzanine - 0.25, zCenter);
  slab.receiveShadow = true;
  slab.castShadow = true;
  group.add(slab);

  // fascia beam sits at the court-facing edge so the balcony reads structurally
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(width, 1.1, 0.4), materials.matteBlackSteel);
  fascia.position.set(0, HALL.mezzanine - 0.75, courtEdgeZ);
  group.add(fascia);
  const facadeLight = new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, 0.08, 0.12), materials.neonCyan);
  facadeLight.position.set(0, HALL.mezzanine - 0.16, courtEdgeZ - side * 0.22);
  group.add(facadeLight);

  // glass balustrade on the court edge, sitting on top of the slab
  const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 1.05, 0.04), materials.smartGlass);
  rail.position.set(0, HALL.mezzanine + 0.54, courtEdgeZ + side * 0.18);
  rail.userData.cutaway = "glass";
  group.add(rail);
  const handrail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.07, 0.12), materials.brushedAluminum);
  handrail.position.set(0, HALL.mezzanine + 1.08, courtEdgeZ + side * 0.18);
  group.add(handrail);

  // support columns under the balcony
  for (let i = -3; i <= 3; i++) {
    const column = new THREE.Mesh(new THREE.BoxGeometry(0.34, HALL.mezzanine - 0.5, 0.34), materials.graphiteSteel);
    column.position.set(i * 5.2, (HALL.mezzanine - 0.5) / 2, zCenter);
    group.add(column);
  }

  return group;
}

/* ------------------------------------------------------------------ */
/* entrance canopy, tunnel, bridges                                    */
/* ------------------------------------------------------------------ */

function buildCanopy({ materials, registry, state }) {
  const group = new THREE.Group();
  group.name = "entrance";
  const z = HALL.entranceZ;

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(24, 0.6, 7.4), materials.matteBlackSteel);
  canopy.position.set(0, 7.2, z - 3.6);
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  group.add(canopy);
  const soffit = new THREE.Mesh(new THREE.BoxGeometry(23.2, 0.12, 6.8), materials.coveLightShadow);
  soffit.position.set(0, 6.88, z - 3.6);
  group.add(soffit);
  for (let i = -3; i <= 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 6.6), materials.darkAluminum);
    blade.position.set(i * 3.4, 7.6, z - 3.6);
    group.add(blade);
  }
  // support columns
  [-1, 1].forEach((side) => {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 7.2, 14), materials.matteBlackSteel);
    column.position.set(side * 10.6, 3.6, z - 6.4);
    group.add(column);
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.4, 14), materials.neonCyan);
    glow.position.set(side * 10.6, 1.2, z - 6.4);
    group.add(glow);
  });

  // signage
  const sign = createSmartSurface({
    width: 14,
    height: 2.6,
    pixels: 1024,
    interval: 0.4,
    registry,
    name: "entranceSign",
    draw: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "rgba(6,14,22,0.92)");
      grad.addColorStop(1, "rgba(10,24,34,0.92)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      roundedRect(ctx, 8, 8, w - 16, h - 16, 22);
      ctx.strokeStyle = "rgba(127,232,255,0.45)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#eaf7ff";
      ctx.font = `800 ${Math.round(w * 0.075)}px ${FONT}`;
      ctx.fillText("SMART SPORTS COMPLEX & RESIDENCE", w / 2, h * 0.42);
      ctx.fillStyle = "rgba(127,232,255,0.9)";
      ctx.font = `600 ${Math.round(w * 0.042)}px ${FONT}`;
      ctx.fillText("HOOP HORIZONS · ANTANANARIVO", w / 2, h * 0.62);
      ctx.fillStyle = `rgba(255,171,90,${0.55 + Math.sin(t * 2) * 0.2})`;
      ctx.font = `600 ${Math.round(w * 0.036)}px ${FONT}`;
      ctx.fillText(
        state?.scenarioLabel?.[1] || "TRAINING MODE",
        w / 2,
        h * 0.82
      );
      ctx.textAlign = "left";
    },
  });
  sign.mesh.position.set(0, 4.6, z - 0.35);
  group.add(sign.mesh);

  // plaza steps
  const steps = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(28, 0.3, 1.4), materials.paving);
    step.position.set(0, 1.5 - i * 0.3, z - 10.4 - i * 1.4);
    step.receiveShadow = true;
    steps.add(step);
    const led = new THREE.Mesh(new THREE.BoxGeometry(27.4, 0.04, 0.08), materials.ledStrip);
    led.position.set(0, 1.52 - i * 0.3, z - 9.75 - i * 1.4);
    steps.add(led);
  }
  group.add(steps);

  return group;
}

function buildPlayerTunnel({ materials }) {
  const group = new THREE.Group();
  group.name = "playerTunnel";
  const z0 = COURT.length / 2 + 0.4;
  const z1 = HALL.length / 2;
  const length = z1 - z0;
  const zc = z0 + length / 2;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, length), materials.resinFloor);
  floor.position.set(0, 0.08, zc);
  floor.receiveShadow = true;
  group.add(floor);

  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.6, length), materials.compositePanel);
    wall.position.set(side * 2.1, 1.8, zc);
    group.add(wall);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, length - 0.4), materials.neonAmber);
    strip.position.set(side * 1.96, 2.9, zc);
    group.add(strip);
  });
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.3, length), materials.graphiteSteel);
  ceiling.position.set(0, 3.75, zc);
  group.add(ceiling);
  for (let i = 0; i < 8; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 0.1), materials.coveLight);
    bar.position.set(0, 3.55, z0 + 1 + i * (length / 8));
    group.add(bar);
  }
  return group;
}

function buildBridges({ materials, doors }) {
  const group = new THREE.Group();
  group.name = "bridges";
  const created = [];

  [-1, 1].forEach((side) => {
    const dir = side;
    const startX = dir * BRIDGE.startX;
    const endX = dir * BRIDGE.endX;
    const spanX = Math.abs(endX - startX);
    const centerX = (startX + endX) / 2;
    const z0 = BRIDGE.z[0];
    const z1 = BRIDGE.z[1];
    const spanZ = z1 - z0;
    const centerZ = (z0 + z1) / 2;

    // ground-floor bridge
    const floor = new THREE.Mesh(new THREE.BoxGeometry(spanX, 0.3, spanZ), materials.resinFloor);
    floor.position.set(centerX, 0.15, centerZ);
    group.add(floor);
    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(spanX, 0.36, spanZ), materials.graphiteSteel);
    roofSlab.position.set(centerX, BRIDGE.y[1] + 0.18, centerZ);
    roofSlab.userData.cutaway = "upper";
    group.add(roofSlab);
    [-1, 1].forEach((zs) => {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(spanX, BRIDGE.y[1]), materials.smartGlass);
      wall.rotation.y = Math.PI / 2;
      wall.position.set(centerX, BRIDGE.y[1] / 2, centerZ + zs * spanZ / 2);
      wall.userData.cutaway = "glass";
      group.add(wall);
    });
    // cove light under the bridge roof
    const cove = new THREE.Mesh(new THREE.BoxGeometry(spanX - 1, 0.08, 0.2), materials.coveLight);
    cove.position.set(centerX, BRIDGE.y[1] - 0.1, centerZ);
    group.add(cove);

    // mezzanine bridge
    const mezzFloor = new THREE.Mesh(
      new THREE.BoxGeometry(spanX, 0.3, spanZ * 0.7),
      materials.resinFloor
    );
    mezzFloor.position.set(centerX, BRIDGE.mezzanineY[0] - 0.15, centerZ);
    group.add(mezzFloor);
    [-1, 1].forEach((zs) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(spanX, 1.05, 0.04),
        materials.smartGlass
      );
      rail.position.set(centerX, BRIDGE.mezzanineY[0] + 0.55, centerZ + zs * (spanZ * 0.7) / 2);
      rail.userData.cutaway = "glass";
      group.add(rail);
    });
    const mezzRoof = new THREE.Mesh(new THREE.BoxGeometry(spanX, 0.3, spanZ * 0.7), materials.graphiteSteel);
    mezzRoof.position.set(centerX, BRIDGE.mezzanineY[1] + 0.15, centerZ);
    mezzRoof.userData.cutaway = "upper";
    group.add(mezzRoof);

    // automated doors: hall-side and wing-side, two levels
    const team = side > 0 ? "beta" : "alpha";
    const doorConfigs = [
      { x: dir * (BRIDGE.startX - 0.1), y: 0, label: `hall-ground-${team}` },
      { x: dir * (BRIDGE.startX - 0.1), y: BRIDGE.mezzanineY[0], label: `hall-mezz-${team}` },
      { x: dir * (BRIDGE.endX + 0.1), y: 0, label: `wing-ground-${team}` },
      { x: dir * (BRIDGE.endX + 0.1), y: BRIDGE.mezzanineY[0], label: `wing-mezz-${team}` },
    ];
    doorConfigs.forEach((config) => {
      const door = createSlidingDoor({
        x: config.x,
        y: config.y,
        z: centerZ,
        width: 3,
        height: 2.8,
        axis: "z",
        materials,
        label: config.label,
      });
      door.trigger = new THREE.Vector3(config.x - dir * 1.6, config.y + 1.2, centerZ);
      group.add(door.group);
      doors.push(door);
      created.push(door);
    });
  });

  void WING;
  return { group, doors: created };
}

/* ------------------------------------------------------------------ */
/* main hall wall assembly                                             */
/* ------------------------------------------------------------------ */

export function buildShell({ materials, registry, state, doors }) {
  const group = new THREE.Group();
  group.name = "shell";
  const lights = [];
  const random = mulberry32(2026);

  /* hall floor slab */
  const slab = new THREE.Mesh(new THREE.BoxGeometry(HALL.width + 0.8, 0.5, HALL.length + 0.8), materials.concrete);
  slab.position.y = -0.3;
  slab.receiveShadow = true;
  group.add(slab);
  const resinDeck = new THREE.Mesh(new THREE.BoxGeometry(HALL.width, 0.12, HALL.length), materials.resinFloor);
  resinDeck.position.y = -0.13;
  resinDeck.receiveShadow = true;
  group.add(resinDeck);

  /* side walls (x = ±17): acoustic panels with glazed openings for the bridges */
  [-1, 1].forEach((side) => {
    const panels = new THREE.Group();
    panels.name = `side-wall-${side > 0 ? "east" : "west"}`;
    const openings = [
      { z0: BRIDGE.z[0] - 1.4, z1: BRIDGE.z[1] + 1.4, y0: 0, y1: BRIDGE.y[1] + 0.4 },
      { z0: BRIDGE.z[0] - 1.4, z1: BRIDGE.z[1] + 1.4, y0: BRIDGE.mezzanineY[0] - 0.4, y1: BRIDGE.mezzanineY[1] + 0.4 },
    ];
    const holes = openings.map((o) => o);
    const halfLength = HALL.length / 2;
    // Build the wall as vertical strips to leave the bridge openings
    const stripCount = 26;
    for (let i = 0; i < stripCount; i++) {
      const z = -halfLength + (i + 0.5) * (HALL.length / stripCount);
      const inHole = holes.some((hole) => z > hole.z0 && z < hole.z1);
      if (inHole) continue;
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, HALL.wallHeight, HALL.length / stripCount + 0.02),
        i % 4 === 0 ? materials.matteBlackSteel : materials.graphiteSteel
      );
      panel.position.set(side * (HALL.width / 2 + 0.25), HALL.wallHeight / 2, z);
      panel.receiveShadow = true;
      panel.castShadow = true;
      panels.add(panel);
    }
    // wall above/below the openings
    holes.forEach((hole) => {
      const zc = (hole.z0 + hole.z1) / 2;
      const spanZ = hole.z1 - hole.z0;
      const lower = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, Math.max(hole.y0, 0.001), spanZ),
        materials.graphiteSteel
      );
      lower.position.set(side * (HALL.width / 2 + 0.25), hole.y0 / 2, zc);
      if (lower.geometry.parameters.height > 0.01) panels.add(lower);
      const upperHeight = HALL.wallHeight - hole.y1;
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.5, upperHeight, spanZ), materials.graphiteSteel);
      upper.position.set(side * (HALL.width / 2 + 0.25), hole.y1 + upperHeight / 2, zc);
      panels.add(upper);
    });
    // horizontal light bands on the wall
    [2.6, 6.6, 10.6].forEach((y) => {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, HALL.length - 1), materials.neonCyan);
      band.position.set(side * (HALL.width / 2 - 0.02), y, 0);
      panels.add(band);
    });
    group.add(panels);
  });

  /* end curtain walls (z = ±23) */
  const entranceWall = buildCurtainWall({
    width: HALL.width,
    height: HALL.wallHeight,
    materials,
    tint: 0xc6e8f6,
  });
  entranceWall.group.position.set(0, 0, HALL.entranceZ);
  group.add(entranceWall.group);

  const playerWall = buildCurtainWall({
    width: HALL.width,
    height: HALL.wallHeight,
    materials,
    tint: 0xb9dcef,
  });
  playerWall.group.position.set(0, 0, HALL.playerZ);
  playerWall.group.rotation.y = Math.PI;
  group.add(playerWall.group);

  /* entrance doors (main + player) */
  const mainDoor = createSlidingDoor({
    x: 0,
    y: 0,
    z: HALL.entranceZ + 0.35,
    width: 7.2,
    height: 3.4,
    axis: "x",
    materials,
    label: "main-gate",
  });
  mainDoor.trigger = new THREE.Vector3(0, 1.6, HALL.entranceZ - 5.5);
  group.add(mainDoor.group);
  doors.push(mainDoor);

  const playerDoor = createSlidingDoor({
    x: 0,
    y: 0,
    z: HALL.playerZ - 0.35,
    width: 4.6,
    height: 3,
    axis: "x",
    materials,
    label: "player-gate",
  });
  playerDoor.trigger = new THREE.Vector3(0, 1.5, HALL.playerZ + 5);
  group.add(playerDoor.group);
  doors.push(playerDoor);

  /* entrance + tunnel + bridges + seating + mezzanines */
  group.add(buildCanopy({ materials, registry, state }));
  group.add(buildPlayerTunnel({ materials }));
  group.add(buildSeating({ materials }));

  const southMezz = buildMezzanine({ materials, side: 1 });
  const northMezz = buildMezzanine({ materials, side: -1 });
  group.add(southMezz, northMezz);

  /* roof + trusses */
  const roof = buildRoof({ materials });
  group.add(roof.group);
  group.add(buildTrusses({ materials }));

  /* interior cove lighting rings (kept above the mezzanine glass boxes) */
  [13.4].forEach((y, index) => {
    const ring = new THREE.Mesh(
      new THREE.BoxGeometry(HALL.width - 1.2, 0.1, 0.16),
      index === 0 ? materials.coveLight : materials.coveLightShadow
    );
    const ring2 = ring.clone();
    ring.position.set(0, y, HALL.length / 2 - 0.5);
    ring2.position.set(0, y, -HALL.length / 2 + 0.5);
    group.add(ring, ring2);
    const sideRing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, HALL.length - 1), materials.coveLight);
    const sideRing2 = sideRing.clone();
    sideRing.position.set(HALL.width / 2 - 0.5, y, 0);
    sideRing2.position.set(-HALL.width / 2 + 0.5, y, 0);
    group.add(sideRing, sideRing2);
  });

  /* hall lighting */
  const hallLightA = new THREE.RectAreaLight(0xcfe8ff, 0.34, 26, 10);
  hallLightA.position.set(0, BRIDGE.y[1] + 2.2, 18);
  hallLightA.lookAt(0, 0, 0);
  hallLightA.userData.cutaway = "upper";
  group.add(hallLightA);
  lights.push(hallLightA);

  const hallLightB = hallLightA.clone();
  hallLightB.position.set(0, BRIDGE.y[1] + 2.2, -18);
  hallLightB.userData.cutaway = "upper";
  group.add(hallLightB);
  lights.push(hallLightB);

  const ambient = new THREE.PointLight(0x8fd6ff, 6, 60, 2);
  ambient.position.set(0, 9, 0);
  group.add(ambient);
  lights.push(ambient);

  /* facade accent sequencing */
  const facadeLeds = [];
  for (let i = 0; i < 22; i++) {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), materials.neonCyan.clone());
    led.position.set(-HALL.width / 2 + 1.4 + i * 1.5, 0.6, HALL.entranceZ - 0.4);
    group.add(led);
    facadeLeds.push({ led, phase: random() * 6.28 });
  }

  const updates = [];
  updates.push((t) => {
    facadeLeds.forEach(({ led, phase }) => {
      const wave = (Math.sin(t * 1.6 - phase) + 1) / 2;
      led.material.emissiveIntensity = 0.6 + wave * 2.2;
    });
  });

  return {
    group,
    lights,
    doors: [mainDoor, playerDoor],
    updates,
    roof,
    // flattened for consumers that only care about the openings: the
    // volumetric beams hang off these exact strips
    skylights: roof.skylights,
    mezzanines: { south: southMezz, north: northMezz },
  };
}

export function buildBridgesZone({ materials, doors }) {
  const bridges = buildBridges({ materials, doors });
  return bridges;
}
