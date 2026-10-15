/**
 * main.js — renders the Super Smart Sports Complex & Residence in real time.
 *
 *  · WebGL renderer with AgX tone mapping, PMREM environment, soft shadows
 *  · Gradient dusk sky with a low warm sun raking the glass envelope
 *  · Effect composer: bloom + SMAA, quality tiers from Performance to Ultra 4K
 *  · Three modes: Cinematic (35 s storyboard), Explore (orbit), Floor plan (cutaway)
 *  · IoT runtime: telemetry, doors proximity, LED floor, hoops, glazing, scenario
 */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { STRINGS, t as tr } from "./i18n.js";
import { ZONES, zoneById, SITE } from "./plan.js";
import { createMaterials, PALETTE } from "./lib/materials.js";
import { HoloRegistry } from "./lib/holo.js";
import { clamp, smoothstep } from "./lib/util.js";
import { createIotModel, SCENARIOS } from "./iot.js";
import { CinematicDirector, CHAPTERS, FILM_DURATION } from "./cinematic.js";
import { buildShell, buildBridgesZone } from "./zones/shell.js";
import { buildCourt } from "./zones/court.js";
import { buildWings } from "./zones/wings.js";
import { buildWarRoom, buildVipLounge } from "./zones/rooms.js";
import { buildLandscape } from "./zones/landscape.js";

/* ------------------------------------------------------------------ */
/* quality tiers                                                       */
/* ------------------------------------------------------------------ */

const QUALITY = {
  low: { pixelRatio: 0.85, shadows: false, bloom: 0.22, smaa: false, anisotropy: 2, trees: 60, label: "low" },
  medium: { pixelRatio: 1, shadows: false, bloom: 0.32, smaa: false, anisotropy: 4, trees: 90, label: "medium" },
  high: { pixelRatio: Math.min(window.devicePixelRatio, 1.5), shadows: true, bloom: 0.42, smaa: true, anisotropy: 8, trees: 120, label: "high" },
  ultra: { pixelRatio: Math.min(window.devicePixelRatio, 2), shadows: true, bloom: 0.5, smaa: true, anisotropy: 16, trees: 150, label: "ultra" },
};

/* ------------------------------------------------------------------ */
/* sky                                                                 */
/* ------------------------------------------------------------------ */

function createSky() {
  const uniforms = {
    uTop: { value: new THREE.Color(0x060b18) },
    uMid: { value: new THREE.Color(0x24405c) },
    uHorizon: { value: new THREE.Color(0xd98b52) },
    uSunColor: { value: new THREE.Color(0xffcf9a) },
    uSunDir: { value: new THREE.Vector3(-0.56, 0.22, 0.79).normalize() },
    uTime: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform float uTime;
      varying vec3 vDir;

      float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }

      void main() {
        vec3 dir = normalize(vDir);
        float height = clamp(dir.y, -1.0, 1.0);
        vec3 color = mix(uHorizon, uMid, smoothstep(-0.02, 0.28, height));
        color = mix(color, uTop, smoothstep(0.22, 0.85, height));
        // sun glow
        float sun = max(dot(dir, normalize(uSunDir)), 0.0);
        color += uSunColor * pow(sun, 220.0) * 2.4;
        color += uSunColor * pow(sun, 8.0) * 0.18;
        // stars
        if (height > 0.05) {
          vec3 grid = floor(dir * 260.0);
          float star = step(0.9975, hash(grid));
          float twinkle = 0.65 + 0.35 * sin(uTime * 2.4 + hash(grid + 3.1) * 30.0);
          color += vec3(star * twinkle) * smoothstep(0.05, 0.4, height) * 0.9;
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 20), material);
  mesh.name = "sky";
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

/* ------------------------------------------------------------------ */
/* boot                                                                */
/* ------------------------------------------------------------------ */

export function startExperience({ ui, language = "en" }) {
  const canvas = document.getElementById("scene");
  if (!canvas) throw new Error("Missing #scene canvas");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
  } catch (error) {
    ui.onError?.(STRINGS.webglError, error);
    return null;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x4a6076, 150, 900);

  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 2600);
  camera.position.set(96, 74, 124);
  camera.lookAt(0, 14, 0);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 0.74;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = true;

  /* ---------- environment + sky ---------- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  const envTarget = pmrem.fromScene(roomEnvironment, 0.04);
  scene.environment = envTarget.texture;
  if ("environmentIntensity" in scene) scene.environmentIntensity = 0.3;

  const sky = createSky();
  scene.add(sky.mesh);

  const sun = new THREE.DirectionalLight(0xffd3a4, 1.9);
  sun.position.set(-105, 68, 128);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -110;
  sun.shadow.camera.right = 110;
  sun.shadow.camera.top = 110;
  sun.shadow.camera.bottom = -110;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 420;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);
  scene.add(sun.target);

  const hemi = new THREE.HemisphereLight(0x9cc4e8, 0x2b2f38, 0.32);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0x22384c, 0.34);
  scene.add(ambient);

  // soft overhead fill that stands in for the skylight bounce, so the court
  // stays readable in the top-down shots of the film
  const interiorFill = new THREE.DirectionalLight(0xcfe6ff, 0.34);
  interiorFill.name = "interiorFill";
  interiorFill.position.set(6, 60, -14);
  interiorFill.target.position.set(0, 0, 0);
  scene.add(interiorFill, interiorFill.target);

  /* ---------- assets ---------- */
  const qualityKey = window.__quality || "high";
  const quality = QUALITY[qualityKey] || QUALITY.high;
  const materials = createMaterials();
  const registry = new HoloRegistry();
  const screens = [];
  const doors = [];
  const updates = [];
  const lights = [];
  const sensorField = new Float32Array(20);

  const runtime = createIotModel();
  runtime.toggles = {
    ledFloor: true,
    hoops: true,
    doors: true,
    ambient: true,
    holo: true,
    streams: true,
    tracking: true,
    electro: true,
    water: true,
  };
  const director = new CinematicDirector();

  const worldRoot = new THREE.Group();
  worldRoot.name = "complex";
  scene.add(worldRoot);

  const shell = buildShell({ materials, registry, state: runtime, doors });
  worldRoot.add(shell.group);
  lights.push(...shell.lights);
  updates.push(...shell.updates);

  const bridges = buildBridgesZone({ materials, doors });
  worldRoot.add(bridges.group);

  const court = buildCourt({ materials, registry, state: runtime, sensorField, detail: { anisotropy: quality.anisotropy } });
  worldRoot.add(court.group);
  lights.push(...court.lights);
  updates.push(court.update);

  const wings = buildWings({ materials, registry, state: runtime, screens });
  worldRoot.add(wings.group);
  lights.push(...wings.lights);

  const warRoom = buildWarRoom({ materials, registry, state: runtime, screens });
  worldRoot.add(warRoom.group);
  lights.push(...warRoom.lights);

  const vip = buildVipLounge({ materials, registry, state: runtime, screens });
  worldRoot.add(vip.group);
  lights.push(...vip.lights);

  const landscape = buildLandscape({ materials, registry, detail: { trees: quality.trees } });
  worldRoot.add(landscape.group);
  updates.push(landscape.update);

  /* ---------- post processing ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    quality.bloom,
    0.55,
    0.92
  );
  composer.addPass(bloom);
  if (quality.smaa) {
    const smaa = new SMAAPass(window.innerWidth * quality.pixelRatio, window.innerHeight * quality.pixelRatio);
    composer.addPass(smaa);
  }
  const output = new OutputPass();
  composer.addPass(output);

  /* ---------- controls ---------- */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 4, 0);
  controls.minDistance = 8;
  controls.maxDistance = 320;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.enabled = false;

  /* ---------- cutaway (floor plan mode) ---------- */
  // small hook for tooling: lets the verification script and the browser
  // console inspect or tweak the scene without re-importing three.js
  window.__three = THREE;

  const cutawayObjects = [];
  worldRoot.traverse((child) => {
    if (child.userData && child.userData.cutaway) cutawayObjects.push(child);
  });
  function setCutaway(enabled) {
    cutawayObjects.forEach((child) => {
      child.visible = !enabled;
    });
    landscape.labels.visible = false;
  }

  /* ---------- render sizing ---------- */
  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(quality.pixelRatio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(quality.pixelRatio);
    composer.setSize(width, height);
    bloom.setSize(width, height);
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- runtime state ---------- */
  const clock = new THREE.Clock();
  let elapsed = 0;
  let frames = 0;
  let fpsAccum = 0;
  let fps = 60;
  let uiAccum = 0;
  let paused = false;
  const tmpVec = new THREE.Vector3();
  const letterbox = { value: true };

  const api = {
    director,
    // exposed for tuning / diagnostics (also handy in the presenter console)
    tuning: { renderer, sun, hemi, ambient, interiorFill, sky, bloom, materials, scene, camera },
    runtime,
    scene,
    camera,
    renderer,
    setMode(mode) {
      director.mode = mode;
      api.mode = mode;
      if (mode === "cinematic") {
        controls.enabled = false;
        director.playing = true;
        setCutaway(false);
      } else if (mode === "explore") {
        controls.enabled = true;
        controls.target.set(0, 4, 0);
        director.playing = false;
        director.tween = null;
        setCutaway(false);
      } else if (mode === "plan") {
        controls.enabled = true;
        controls.target.set(0, 2, 0);
        director.playing = false;
        director.tween = null;
        setCutaway(true);
        camera.position.set(0, 74, 46);
        camera.fov = 40;
        camera.updateProjectionMatrix();
        camera.lookAt(0, 2, 0);
      }
      return mode;
    },
    focusZone(id) {
      const zone = zoneById(id);
      if (director.mode === "cinematic") api.setMode("explore");
      director.flyTo(zone.preset, 2.4);
      controls.enabled = false;
      setTimeout(() => {
        if (api.mode === "explore") {
          controls.enabled = true;
          controls.target.set(...zone.preset.target);
        }
      }, 2500);
      return zone;
    },
    jumpToChapter(index) {
      api.setMode("cinematic");
      director.seekChapter(index);
      director.playing = true;
    },
    setScenario(id) {
      runtime.setScenario(id);
    },
    setQuality(key) {
      const next = QUALITY[key];
      if (!next) return;
      Object.assign(quality, next);
      renderer.shadowMap.enabled = quality.shadows;
      materials.concrete.needsUpdate = true;
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const list = Array.isArray(child.material) ? child.material : [child.material];
          list.forEach((material) => {
            material.needsUpdate = true;
          });
        }
      });
      resize();
    },
    togglePlay() {
      if (director.mode !== "cinematic") api.setMode("cinematic");
      return director.toggle();
    },
    capture() {
      const previousRatio = renderer.getPixelRatio();
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setPixelRatio(1);
      renderer.setSize(3840, 2160, false);
      composer.setSize(3840, 2160);
      bloom.setSize(3840, 2160);
      camera.aspect = 3840 / 2160;
      camera.updateProjectionMatrix();
      tick(1 / 60);
      composer.render();
      const url = canvas.toDataURL("image/png");
      renderer.setPixelRatio(previousRatio);
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloom.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      composer.render();
      return url;
    },
    /** Advance and render N deterministic frames (used by capture + tooling). */
    step(dt = 1 / 60) {
      tick(dt);
    },
    /** Raycast diagnostic: what is actually under a screen point? */
    probe(ndcX = 0, ndcY = 0) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const hits = raycaster.intersectObjects(scene.children, true).slice(0, 5);
      return hits.map((hit) => ({
        name: hit.object.name || hit.object.parent?.name || hit.object.type,
        parent: hit.object.parent?.name || null,
        geometry: hit.object.geometry?.type,
        point: hit.point.toArray().map((v) => Math.round(v * 100) / 100),
        distance: Math.round(hit.distance * 100) / 100,
        material: hit.object.material?.type,
        color: hit.object.material?.color ? `#${hit.object.material.color.getHexString()}` : null,
        opacity: hit.object.material?.opacity,
        map: Boolean(hit.object.material?.map),
        visible: hit.object.visible,
      }));
    },
    setLetterbox(value) {
      letterbox.value = value;
    },
    dispose() {
      window.removeEventListener("resize", resize);
      renderer.dispose();
      pmrem.dispose();
    },
  };

  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.autoUpdate = true;
  api.mode = "cinematic";

  /* ---------- the loop ---------- */
  function tick(dt) {
    elapsed += dt;

    if (!paused) {
      // ---- film / camera ----
      if (director.mode === "cinematic") {
        const film = director.filmState(director.time);
        runtime.setScenario(film.scenarioId);
        runtime.ledActivation = runtime.toggles.ledFloor ? film.ledActivation : film.ledActivation * 0.12;
        runtime.hoopDeploy = runtime.toggles.hoops ? film.hoopDeploy : film.hoopDeploy * 0.15;
        runtime.gantryActive = runtime.toggles.tracking ? film.gantryActive : 0;
        runtime.podPrivacy = film.podPrivacy;
        runtime.vipPrivacy = runtime.toggles.electro ? film.vipPrivacy : 0;
        director.update(dt, camera, { loop: director.loop });
      } else {
        runtime.ledActivation = runtime.toggles.ledFloor ? 1 : 0.12;
        runtime.hoopDeploy = runtime.toggles.hoops ? 1 : 0.15;
        runtime.gantryActive = runtime.toggles.tracking ? 1 : 0;
        runtime.vipPrivacy = runtime.toggles.electro
          ? (api.mode === "plan" ? 0 : clamp(runtime.vipPrivacy + (runtime.biometricPulse > 0.6 ? 0 : 0), 0, 1))
          : 0;
        if (director.tween) {
          controls.enabled = false;
          director.update(dt, camera, {});
        } else if (controls.enabled) {
          controls.update();
        } else {
          camera.lookAt(controls.target);
        }
      }

      // ---- IoT model ----
      runtime.update(dt, elapsed, { followFilm: director.mode === "cinematic" });

      // ---- scenario lighting ----
      const scenario = SCENARIOS[runtime.scenarioId];
      const mix = scenario.modeMix;
      const runtimeState = {
        ledActivation: runtime.ledActivation,
        hoopDeploy: runtime.hoopDeploy,
        modeMix: mix,
        telemetryAverage: runtime.telemetryAverage,
        podPrivacy: runtime.podPrivacy,
        vipPrivacy: runtime.vipPrivacy,
        biometricPulse: runtime.biometricPulse,
      };

      // ---- automated doors: proximity driven ----
      doors.forEach((door) => {
        const distance = camera.position.distanceTo(door.trigger || tmpVec.set(0, 0, 0));
        let target = runtime.toggles.doors && distance < 6.5 ? 1 : 0;
        if (!runtime.toggles.doors) target = 0;
        // the film always opens the halls on cue
        if (director.mode === "cinematic" && director.time > 14.6 && director.time < 18.4 && distance < 14) {
          target = 1;
        }
        door.update(elapsed, target);
      });

      // ---- zone updates ----
      updates.forEach((fn) => fn(elapsed, dt, runtimeState));
      wings.update(elapsed, dt, runtimeState);
      warRoom.update(elapsed, dt, runtimeState);
      vip.update(elapsed, dt, runtimeState);
      registry.update(dt, runtime);

      // ---- global light modulation ----
      sun.intensity = (quality.shadows ? 1.9 : 1.0) + Math.sin(elapsed * 0.05) * 0.12;
      // interior fill follows the storyboard: dim while the drone is outside,
      // up to full inside the wings, back down for the finale panorama
      const filmT = director.mode === "cinematic" ? director.time : 20;
      interiorFill.intensity =
        0.12 + smoothstep(5.6, 8.6, filmT) * 0.26 - smoothstep(15.0, 15.9, filmT) * 0.14 + smoothstep(15.9, 24.5, filmT) * 0.16;
      const ambience = SCENARIOS[runtime.scenarioId];
      ambient.intensity = 0.3 + (ambience.id === "recovery" ? 0.14 : 0) + (ambience.id === "game" ? -0.06 : 0);
      sky.uniforms.uTime.value = elapsed;
      sky.mesh.position.copy(camera.position);
      sun.target.position.set(0, 0, 0);
    }

    // fps
    frames++;
    fpsAccum += dt;
    if (fpsAccum >= 0.5) {
      fps = frames / fpsAccum;
      frames = 0;
      fpsAccum = 0;
    }

    composer.render();

    // ---- HUD ----
    uiAccum += dt;
    if (uiAccum > 0.1) {
      uiAccum = 0;
      ui.update({
        fps,
        time: director.time,
        duration: director.duration,
        chapter: director.chapterIndex(),
        mode: api.mode,
        playing: director.playing,
        runtime,
        scenario: runtime.scenarioId,
        toggles: runtime.toggles,
        camera,
      });
    }
  }

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    tick(dt);
    requestAnimationFrame(frame);
  }

  /* ---------- events ---------- */
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
  });

  const runtimeApi = {
    api,
    runtime,
    director,
    scene,
    zones: ZONES,
    strings: STRINGS,
    setLanguage: (code) => {
      language = code;
    },
    get language() {
      return language;
    },
  };

  api.setMode("cinematic");
  director.time = 0;
  frame();
  return runtimeApi;
}

export { QUALITY, FILM_DURATION, CHAPTERS, STRINGS, ZONES, PALETTE, clamp, tr, SITE };
