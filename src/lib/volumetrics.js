/**
 * volumetrics.js — visible light shafts for the complex.
 *
 * Three families of beams, all built from one additive shader so the whole
 * set costs a handful of draw calls and nothing else:
 *
 *  1. Skylight shafts — one per structural skylight strip in the roof. The
 *     strip positions are handed in by the shell, so the beams can never
 *     drift out of register with the openings above them.
 *  2. Dusk sun shafts — through the two glazed ends of the hall, where the
 *     low sun actually does rake the envelope.
 *  3. The entrance portal volume — the space the automated doors stand in,
 *     lit by the canopy LEDs and the adaptive paving.
 *
 * The beams are tilted only a fraction of the way onto the true sun vector
 * (`tilt`): a physically exact beam from a 23° sun would land ~30 m away from
 * the opening that produced it. This is the usual archviz convention.
 */
import * as THREE from "three";

const SHAFT_VERTEX = /* glsl */ `
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHAFT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHalf;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uDust;
  varying vec3 vLocal;

  void main() {
    // normalised box coordinates, -1 … 1
    vec3 p = vLocal / max(uHalf, vec3(0.0001));

    // feathered sides: bright core, nothing at the wall of the slab
    float edges = smoothstep(1.0, 0.0, abs(p.x)) * smoothstep(1.0, 0.25, abs(p.z));
    // the beam fades as it falls away from its opening
    float fall = mix(0.18, 1.0, clamp(p.y * 0.5 + 0.5, 0.0, 1.0));
    // drifting motes, so the volume never reads as flat glass
    float motes = 1.0 - uDust * 0.45 +
      uDust * 0.45 * (0.5 + 0.5 * sin(p.y * 9.0 + uTime * 0.55 + p.z * 4.3)) *
      (0.5 + 0.5 * sin(p.x * 7.0 - uTime * 0.4));

    gl_FragColor = vec4(uColor, edges * fall * motes * uIntensity);
  }
`;

const UP = new THREE.Vector3(0, 1, 0);
const DEFAULT_SUN = new THREE.Vector3(-0.6, 0.39, 0.73);

/**
 * Build one box beam. Local +Y runs along the beam, from the bottom up to
 * the opening, so the shader's `fall` term is brightest at the opening.
 */
function createShaft({ width, height, depth, color, intensity, dust = 1 }) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uHalf: { value: new THREE.Vector3(width / 2, height / 2, depth / 2) },
      uIntensity: { value: intensity },
      uTime: { value: 0 },
      uDust: { value: dust },
    },
    vertexShader: SHAFT_VERTEX,
    fragmentShader: SHAFT_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth, 1, 8, 1), material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 8;
  mesh.userData.baseIntensity = intensity;
  return mesh;
}

/**
 * @param {object} options
 * @param {Array}  options.skylights  `shell.skylights`, one entry per roof strip.
 * @param {number} options.wallHeight hall clear height (the openings sit on it).
 * @param {number} options.entranceZ  hall entrance facade coordinate.
 * @param {number} options.playerZ    player-tunnel facade coordinate.
 * @param {THREE.Vector3} options.sunDir direction from the site to the sun.
 */
export function createLightShafts({
  skylights = [],
  wallHeight = 14,
  entranceZ = -23,
  playerZ = 23,
  sunDir = DEFAULT_SUN,
} = {}) {
  const group = new THREE.Group();
  group.name = "lightShafts";

  const sun = sunDir.clone().normalize();
  /** Unit vector pointing down along a beam tilted `tilt` of the way onto the sun. */
  const beamDown = (tilt) => UP.clone().lerp(sun, tilt).normalize().multiplyScalar(-1);

  const shafts = [];

  /* ---------- 1. roof skylights ---------- */
  skylights.forEach((entry, index) => {
    const glass = entry?.glass;
    if (!glass) return;
    const anchor = new THREE.Vector3();
    glass.getWorldPosition(anchor);

    const drop = Math.max(4, anchor.y - 0.4);
    const down = beamDown(0.32); // mostly vertical: a nod to the low sun
    const shaft = createShaft({
      width: 1.35,
      height: drop,
      depth: 10.5, // a strip of the 45 m run, not the whole thing
      color: 0x9fd0ff,
      intensity: 0.05 + (index % 2) * 0.012,
    });

    shaft.quaternion.setFromUnitVectors(UP, down.clone().negate());
    shaft.position.copy(anchor).addScaledVector(down, drop / 2);
    shaft.position.z += (index % 3) * 4.2 - 4.2; // stagger the strips along the run
    group.add(shaft);
    shafts.push(shaft);
  });

  /* ---------- 2. the glazed ends ---------- */
  // Only the sunlit end gets a raking beam: the sun sits behind the entrance
  // facade, so that side is served by a soft, near-vertical sky bounce instead.
  const rakingSun = beamDown(0.82);
  const skyBounce = beamDown(0.2);
  [
    {
      z: playerZ,
      color: 0xffc98a,
      intensity: 0.1,
      width: 15.5,
      depth: 13,
      height: 5.4,
      axis: rakingSun,
      y: wallHeight * 0.3,
    },
    {
      z: entranceZ,
      color: 0xbfdcff,
      intensity: 0.042,
      width: 13.5,
      depth: 10,
      height: 7.6,
      axis: skyBounce,
      y: wallHeight * 0.42,
    },
  ].forEach(({ axis, y, ...spec }) => {
    const shaft = createShaft(spec);
    shaft.quaternion.setFromUnitVectors(UP, axis.clone().negate());
    // start at the glass and push the volume inwards, into the hall
    const inward = -Math.sign(spec.z);
    shaft.position.set(1.2, y, spec.z + inward * (spec.depth / 2 - 1.2));
    group.add(shaft);
    shafts.push(shaft);
  });

  /* ---------- 3. entrance portal volume ---------- */
  const portal = createShaft({
    width: 9.4,
    height: 3.6,
    depth: 9,
    color: 0xffc078,
    intensity: 0.075,
    dust: 0.6,
  });
  portal.position.set(0, 2.6, entranceZ + 4.6);
  group.add(portal);
  shafts.push(portal);

  /* ---------- animation + global gain ---------- */
  let gain = 1;
  const update = (elapsed) => {
    for (const shaft of shafts) {
      const uniforms = shaft.material.uniforms;
      uniforms.uTime.value = elapsed;
      uniforms.uIntensity.value = shaft.userData.baseIntensity * gain;
    }
  };

  /** Global multiplier: the film breathes the volume with the sun. */
  const setIntensity = (value) => {
    gain = Math.max(0, value);
  };

  return { group, shafts, update, setIntensity };
}
