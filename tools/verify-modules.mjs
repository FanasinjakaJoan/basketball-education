/**
 * tools/verify-modules.mjs — headless structural check of the 3D complex.
 *
 * Runs the *real* zone builders, the volumetric beams and the resin mirror in
 * plain Node (no browser, no WebGL) against a stubbed 2D canvas, then asserts
 * the numbers the design brief quotes. It is the fast half of the verification
 * story: `npm run verify` renders the thing in a headless Chromium, this one
 * runs in a second and catches anything structural.
 *
 *   node tools/verify-modules.mjs
 */
import * as THREE from "three";
import { createMaterials } from "../src/lib/materials.js";
import { HoloRegistry } from "../src/lib/holo.js";
import { createIotModel } from "../src/iot.js";
import { createLightShafts } from "../src/lib/volumetrics.js";
import { createCourtMirror } from "../src/lib/mirror.js";
import { buildShell, buildBridgesZone } from "../src/zones/shell.js";
import { buildCourt } from "../src/zones/court.js";
import { buildWings } from "../src/zones/wings.js";
import { buildWarRoom, buildVipLounge } from "../src/zones/rooms.js";
import { buildLandscape } from "../src/zones/landscape.js";
import { COURT, HALL } from "../src/plan.js";
import { ROUTINES } from "../src/lib/players.js";

/* ------------------------------------------------------------------ */
/* a 2D canvas good enough for the procedural textures                 */
/* ------------------------------------------------------------------ */

function stubContext() {
  const store = {};
  const gradient = { addColorStop() {} };
  const image = (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === "measureText") return () => ({ width: 12, actualBoundingBoxAscent: 9, actualBoundingBoxDescent: 3 });
      if (prop === "createLinearGradient" || prop === "createRadialGradient" || prop === "createPattern") {
        return () => gradient;
      }
      if (prop === "createImageData") return (w, h) => image(w, h);
      if (prop === "getImageData") return (x, y, w, h) => image(w, h);
      return () => undefined;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

function stubCanvas() {
  return {
    width: 1,
    height: 1,
    style: {},
    nodeName: "CANVAS",
    getContext: () => stubContext(),
    addEventListener() {},
    removeEventListener() {},
    toDataURL: () => "data:,",
  };
}

globalThis.document = {
  createElement: (tag) => (tag === "canvas" ? stubCanvas() : { style: {}, appendChild() {}, dataset: {} }),
  documentElement: { lang: "en" },
  addEventListener() {},
  querySelectorAll: () => [],
};
globalThis.window = { devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720, location: { search: "" } };

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const problems = [];
const check = (condition, label) => {
  if (!condition) problems.push(label);
  console.log(`${condition ? "  ok  " : " FAIL "} ${label}`);
};

const countNamed = (root, prefix) => {
  let count = 0;
  root.traverse((child) => {
    if (typeof child.name === "string" && child.name.startsWith(prefix)) count++;
  });
  return count;
};

const countMatching = (root, pattern) => {
  let count = 0;
  root.traverse((child) => {
    if (typeof child.name === "string" && pattern.test(child.name)) count++;
  });
  return count;
};

const countGeometry = (root, geometryType) => {
  let count = 0;
  root.traverse((child) => {
    if (child.isMesh && child.geometry?.type === geometryType) count += child.isInstancedMesh ? child.count : 1;
  });
  return count;
};

const countMeshes = (root) => {
  let count = 0;
  root.traverse((child) => {
    if (child.isMesh) count++;
  });
  return count;
};

/* ------------------------------------------------------------------ */
/* build the whole complex, exactly as main.js does                    */
/* ------------------------------------------------------------------ */

const materials = createMaterials();
const registry = new HoloRegistry();
const runtime = createIotModel();
runtime.toggles = {
  ledFloor: true, hoops: true, doors: true, ambient: true, holo: true,
  streams: true, tracking: true, electro: true, water: true, xray: false, mirrorFloor: false,
};

const world = new THREE.Group();
const doors = [];
const screens = [];
const sensorField = new Float32Array(20);
const updates = [];

const shell = buildShell({ materials, registry, state: runtime, doors });
world.add(shell.group);
const bridges = buildBridgesZone({ materials, doors });
world.add(bridges.group);
const court = buildCourt({ materials, registry, state: runtime, sensorField, detail: { anisotropy: 4 } });
world.add(court.group);
const wings = buildWings({ materials, registry, state: runtime, screens });
world.add(wings.group);
const warRoom = buildWarRoom({ materials, registry, state: runtime, screens });
world.add(warRoom.group);
const vip = buildVipLounge({ materials, registry, state: runtime, screens });
world.add(vip.group);
const landscape = buildLandscape({ materials, registry, detail: { trees: 60 } });
world.add(landscape.group);

const shafts = createLightShafts({
  skylights: shell.skylights,
  wallHeight: HALL.wallHeight,
  entranceZ: HALL.entranceZ,
  playerZ: HALL.playerZ,
  sunDir: new THREE.Vector3(-105, 68, 128).normalize(),
});
world.add(shafts.group);

const mirror = createCourtMirror({ length: COURT.length, width: COURT.width, layer: 2 });
world.add(mirror.mesh);
mirror.tags([court.group, court.scoreboard?.group, ...court.hoops.map((hoop) => hoop.group)]);

world.updateMatrixWorld(true);

/* ------------------------------------------------------------------ */
/* assertions                                                          */
/* ------------------------------------------------------------------ */

console.log("Super Smart Sports Complex — structural verification\n");

console.log("architecture");
check(world.children.length >= 9, `zone groups mounted (${world.children.length})`);
const iceBaths = countMatching(world, /^ice-bath-(alpha|beta)-\d+$/);
check(iceBaths === 4, `ice baths: two per wing (${iceBaths})`);
check(countMatching(world, /^ice-bath-readout-/) === 4, "each ice bath has a temperature readout");
check(countNamed(world, "cryo-display-") === 4, `cryotherapy pods: two per wing (${countNamed(world, "cryo-display-")})`);
check(countNamed(world, "wet-zone-") === 2, `wet zones (${countNamed(world, "wet-zone-")})`);
check(countMeshes(world) > 800, `mesh count is a real complex (${countMeshes(world)})`);

console.log("\ncourt");
const athletes = court.group.children.find((child) => child.name === "athletes");
check(Boolean(athletes), "athlete group present");
check(ROUTINES.length === 10, `ten player drill routines (${ROUTINES.length})`);
check(
  athletes && countGeometry(athletes, "RingGeometry") === 10,
  `ten ground emissive ring markers (${athletes ? countGeometry(athletes, "RingGeometry") : 0})`
);
check(court.hoops.length === 2, "two retractable hoops");

const rimPoint = new THREE.Vector3();
/** Highest ring of the assembly: the rim itself, the net hangs below it. */
const rimTop = (hoop) => {
  hoop.group.updateMatrixWorld(true);
  let top = -Infinity;
  hoop.group.traverse((child) => {
    if (child.isMesh && child.geometry?.type === "TorusGeometry") {
      child.getWorldPosition(rimPoint);
      top = Math.max(top, rimPoint.y + 0.018); // tube radius
    }
  });
  return Number(top.toFixed(3));
};

court.hoops.forEach((hoop) => hoop.update(0));
const stowedCarriage = court.hoops.map((hoop) => Number(hoop.carriage.position.y.toFixed(2)));
check(
  stowedCarriage.every((y) => Math.abs(y - 10.2) < 0.01),
  `hoops stow at y = 10.2 (${stowedCarriage.join(", ")})`
);
check(court.hoops.every((hoop) => rimTop(hoop) > 9), "stowed rims are up out of play");

court.hoops.forEach((hoop) => hoop.update(1));
const deployedRims = court.hoops.map((hoop) => rimTop(hoop));
check(
  deployedRims.every((y) => Math.abs(y - COURT.rimHeight) < 0.02),
  `hoops deploy to the FIBA 3.05 m rim top (${deployedRims.join(", ")})`
);

console.log("\natmosphere + optics");
check(shell.skylights.length === 6, `six structural roof skylights (${shell.skylights.length})`);
check(
  shafts.shafts.length === shell.skylights.length + 3,
  `volumetric beams: one per skylight, the raking sun, the sky bounce, the portal (${shafts.shafts.length})`
);
check(shafts.group.visible === true, "beams visible by default");
check(
  shafts.shafts.every((shaft) => shaft.material.uniforms.uIntensity.value > 0 && Number.isFinite(shaft.position.y)),
  "every beam is placed and lit"
);
shafts.setIntensity(0.5);
shafts.update(1);
check(
  Math.abs(shafts.shafts[0].material.uniforms.uIntensity.value - shafts.shafts[0].userData.baseIntensity * 0.5) < 1e-6,
  "beams respond to the global intensity"
);
check(mirror.mesh.visible === false, "resin mirror is opt-in");
check(mirror.mesh.position.y > 0.03, "mirror sits above the LED film");
check(mirror.mesh.renderOrder > 10, "mirror draws after the floor layers");
check(mirror.mesh.camera.layers.mask === 1 << 2, "mirror pass is restricted to one layer");
let onMirrorLayer = 0;
court.group.traverse((child) => {
  if (child.isMesh && (child.layers.mask & (1 << 2)) !== 0) onMirrorLayer++;
});
check(onMirrorLayer > 50, `court furniture is tagged for the reflection (${onMirrorLayer} meshes)`);
check(Math.abs(materials.frostedGlassClear.opacity - 0.16) < 1e-6, "smart frosted glass at 0.16 opacity");
check(materials.frostedGlassClear.depthWrite === false, "frosted glass does not write depth");
check(materials.frostedGlassClear.side === THREE.DoubleSide, "frosted glass is double-sided");

console.log("\nledger");
let meshes = 0;
let lights = 0;
let instanced = 0;
world.traverse((child) => {
  if (child.isMesh) meshes++;
  if (child.isInstancedMesh) instanced++;
  if (child.isLight) lights++;
});
void updates;
console.log(`  · meshes ${meshes} · instanced ${instanced} · lights ${lights} · screens ${screens.length} · doors ${doors.length}`);

if (problems.length) {
  console.error(`\nverify-modules: ${problems.length} failed check(s):\n - ${problems.join("\n - ")}`);
  process.exit(1);
}
console.log("\nverify-modules: all checks passed");
