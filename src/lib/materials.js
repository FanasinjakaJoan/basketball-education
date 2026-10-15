/**
 * Material library — premium architectural finishes: matte black steel,
 * brushed aluminium, smart frosted glass, polished resin, warm court resin.
 */
import * as THREE from "three";
import {
  brushedMetalTexture,
  courtSurfaceTexture,
  fabricTexture,
  frostedGlassTexture,
  noiseTexture,
} from "./util.js";

export const PALETTE = {
  cyan: 0x5ce6ff,
  cyanDeep: 0x0e6f8c,
  amber: 0xffab5a,
  amberDeep: 0xb9601c,
  magenta: 0xff6bb6,
  lime: 0x8bff9c,
  ink: 0x0a0d12,
};

export function createMaterials(detail = {}) {
  const textureRepeat = detail.textureRepeat ?? 1;
  const noise = noiseTexture([6, 6]);
  const brushed = brushedMetalTexture([2, 1]);
  const fabric = fabricTexture([8, 8]);

  const m = {};

  /* ---------------- structure ---------------- */
  m.concrete = new THREE.MeshStandardMaterial({
    color: 0x30353d,
    roughness: 0.88,
    metalness: 0.04,
    roughnessMap: noise,
    bumpMap: noise,
    bumpScale: 0.02,
  });
  m.concreteLight = new THREE.MeshStandardMaterial({
    color: 0x9aa1a9,
    roughness: 0.8,
    metalness: 0.06,
    roughnessMap: noise,
  });
  m.matteBlackSteel = new THREE.MeshStandardMaterial({
    color: 0x121519,
    roughness: 0.42,
    metalness: 0.86,
    roughnessMap: brushed,
    envMapIntensity: 1.1,
  });
  m.graphiteSteel = new THREE.MeshStandardMaterial({
    color: 0x23282f,
    roughness: 0.55,
    metalness: 0.72,
    roughnessMap: noise,
  });
  m.brushedAluminum = new THREE.MeshStandardMaterial({
    color: 0xb6bec6,
    roughness: 0.3,
    metalness: 0.96,
    roughnessMap: brushed,
    envMapIntensity: 1.35,
  });
  m.darkAluminum = new THREE.MeshStandardMaterial({
    color: 0x4b535c,
    roughness: 0.42,
    metalness: 0.88,
    roughnessMap: brushed,
  });
  m.whiteComposite = new THREE.MeshStandardMaterial({
    color: 0xc2c8ce,
    roughness: 0.34,
    metalness: 0.12,
  });
  m.compositePanel = new THREE.MeshStandardMaterial({
    color: 0x9aa2ab,
    roughness: 0.44,
    metalness: 0.18,
    roughnessMap: noise,
  });

  /* ---------------- floors ---------------- */
  m.resinFloor = new THREE.MeshPhysicalMaterial({
    color: 0x1b2027,
    roughness: 0.34,
    metalness: 0.28,
    roughnessMap: noise,
    clearcoat: 0.42,
    clearcoatRoughness: 0.24,
    envMapIntensity: 0.75,
  });
  m.resinFloorLight = new THREE.MeshPhysicalMaterial({
    color: 0xcfd6dc,
    roughness: 0.28,
    metalness: 0.12,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    roughnessMap: noise,
  });
  m.court = new THREE.MeshPhysicalMaterial({
    map: courtSurfaceTexture([3, 2]),
    roughness: 0.42,
    metalness: 0.05,
    clearcoat: 0.32,
    clearcoatRoughness: 0.28,
    envMapIntensity: 0.55,
  });
  m.rubberTrack = new THREE.MeshStandardMaterial({
    color: 0x1a1f25,
    roughness: 0.92,
    metalness: 0.05,
  });
  m.wetRoom = new THREE.MeshStandardMaterial({
    color: 0xdadfe3,
    roughness: 0.35,
    metalness: 0.08,
    roughnessMap: noise,
  });

  /* ---------------- glazing ---------------- */
  m.smartGlass = new THREE.MeshPhysicalMaterial({
    color: 0xbfe3f2,
    roughness: 0.06,
    metalness: 0.1,
    transparent: true,
    opacity: 0.085,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  m.electroGlass = new THREE.MeshPhysicalMaterial({
    color: 0x9dc6da,
    roughness: 0.08,
    metalness: 0.16,
    transparent: true,
    opacity: 0.09,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.2,
  });
  m.electroGlassDark = new THREE.MeshStandardMaterial({
    color: 0x0d1116,
    roughness: 0.14,
    metalness: 0.3,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });
  m.frostedGlass = new THREE.MeshPhysicalMaterial({
    map: frostedGlassTexture(),
    color: 0xdcecf5,
    roughness: 0.65,
    metalness: 0.05,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.2,
  });
  // Smart frosted glazing: 0.16 opacity, double-sided, no depth write — the
  // PDLC panels read as glass that *will* go opaque, not as milk.
  m.frostedGlassClear = m.frostedGlass.clone();
  m.frostedGlassClear.map = null;
  m.frostedGlassClear.opacity = 0.16;
  m.frostedGlassClear.roughness = 0.12;
  m.frostedGlassClear.depthWrite = false;
  m.frostedGlassClear.side = THREE.DoubleSide;
  m.blackGlass = new THREE.MeshPhysicalMaterial({
    color: 0x080b10,
    roughness: 0.08,
    metalness: 0.35,
    transparent: true,
    opacity: 0.86,
    envMapIntensity: 1.8,
  });
  m.mirrorGlass = new THREE.MeshStandardMaterial({
    color: 0xa8b6c0,
    roughness: 0.04,
    metalness: 1,
    envMapIntensity: 1.5,
  });

  /* ---------------- light / neon ---------------- */
  const neon = (hex, intensity = 2.6) =>
    new THREE.MeshStandardMaterial({
      color: 0x05070a,
      emissive: new THREE.Color(hex),
      emissiveIntensity: intensity,
      roughness: 0.4,
      metalness: 0.2,
      toneMapped: true,
    });
  m.neonCyan = neon(PALETTE.cyan, 2.9);
  m.neonCyanDimm = neon(PALETTE.cyan, 0.55);
  m.neonAmber = neon(PALETTE.amber, 2.7);
  m.neonMagenta = neon(PALETTE.magenta, 2.2);
  m.neonLime = neon(PALETTE.lime, 2.2);
  m.coveLight = neon(0xd8f7ff, 1.25);
  m.coveLightShadow = new THREE.MeshStandardMaterial({
    color: 0xf1f6f8,
    emissive: 0xe8f6ff,
    emissiveIntensity: 1.1,
    roughness: 0.5,
  });
  m.screenDark = new THREE.MeshStandardMaterial({
    color: 0x04070b,
    emissive: 0x0d2231,
    emissiveIntensity: 0.6,
    roughness: 0.18,
    metalness: 0.4,
  });
  m.screenGlow = new THREE.MeshStandardMaterial({
    color: 0x081018,
    emissive: PALETTE.cyan,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.2,
  });
  m.holoGlass = new THREE.MeshPhysicalMaterial({
    color: 0x7fd6ff,
    transparent: true,
    opacity: 0.24,
    roughness: 0.08,
    metalness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.6,
  });
  m.holoSurface = new THREE.MeshBasicMaterial({
    color: PALETTE.cyan,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  /* ---------------- fit-out ---------------- */
  m.upholstery = new THREE.MeshStandardMaterial({
    color: 0x232a33,
    roughness: 0.95,
    metalness: 0.02,
    map: fabric,
  });
  m.upholsteryWarm = new THREE.MeshStandardMaterial({
    color: 0x4a3a2c,
    roughness: 0.95,
    metalness: 0.02,
    map: fabric,
  });
  m.leather = new THREE.MeshStandardMaterial({
    color: 0x2c1f19,
    roughness: 0.55,
    metalness: 0.06,
  });
  m.woodTeak = new THREE.MeshStandardMaterial({
    color: 0x6d4a2e,
    roughness: 0.48,
    metalness: 0.05,
  });
  m.marble = new THREE.MeshPhysicalMaterial({
    color: 0xece7de,
    roughness: 0.16,
    metalness: 0.08,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  });
  m.water = new THREE.MeshPhysicalMaterial({
    color: 0x2f7ba4,
    roughness: 0.05,
    metalness: 0.2,
    transparent: true,
    opacity: 0.72,
    envMapIntensity: 2,
  });
  m.plant = new THREE.MeshStandardMaterial({
    color: 0x2f6b45,
    roughness: 0.9,
    metalness: 0,
  });
  m.plantDark = new THREE.MeshStandardMaterial({
    color: 0x1f4a31,
    roughness: 0.92,
    metalness: 0,
  });
  m.gold = new THREE.MeshStandardMaterial({
    color: 0xd9b06a,
    roughness: 0.26,
    metalness: 1,
    envMapIntensity: 1.6,
  });
  m.ledStrip = new THREE.MeshBasicMaterial({
    color: 0xbdf3ff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  m.sensorFilm = new THREE.MeshBasicMaterial({
    color: 0x6fe0ff,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  m.shadowCatcher = new THREE.ShadowMaterial({ opacity: 0.32 });

  /* ---------------- landscape ---------------- */
  m.lawn = new THREE.MeshStandardMaterial({
    color: 0x1e3524,
    roughness: 0.95,
    metalness: 0,
  });
  m.asphalt = new THREE.MeshStandardMaterial({
    color: 0x191c21,
    roughness: 0.95,
    metalness: 0.02,
  });
  m.paving = new THREE.MeshStandardMaterial({
    color: 0x6a7079,
    roughness: 0.72,
    metalness: 0.06,
    roughnessMap: noise,
  });
  m.waterFeature = new THREE.MeshPhysicalMaterial({
    color: 0x11384d,
    roughness: 0.04,
    metalness: 0.5,
    transparent: true,
    opacity: 0.85,
    envMapIntensity: 2.2,
  });

  void textureRepeat;

  // convenience: materials that pulse/switch at runtime
  m.__animated = {
    neonCyan: m.neonCyan,
    neonAmber: m.neonAmber,
    coveLight: m.coveLight,
    screenGlow: m.screenGlow,
    holoSurface: m.holoSurface,
    ledStrip: m.ledStrip,
    sensorFilm: m.sensorFilm,
  };

  return m;
}
