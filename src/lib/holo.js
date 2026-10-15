/**
 * Holographic interface kit: canvas-driven smart surfaces, animated strategy
 * walls, telemetry screens, biometric curves, floating labels and a volumetric
 * hologram material (scanning lines + flicker).
 *
 * Every surface owns a 2D canvas and redraws on its own cadence (6–12 Hz) so
 * the interfaces feel alive while staying cheap enough for 60 fps.
 */
import * as THREE from "three";
import { PALETTE, createMaterials } from "./materials.js";
import { mulberry32 } from "./util.js";

const FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Registry so main.js can tick every smart surface with one call. */
export class HoloRegistry {
  constructor() {
    this.items = [];
    this.time = 0;
  }

  add(item) {
    this.items.push(item);
    return item;
  }

  /**
   * Tick every registered surface. `onFrame` receives (time, dt, context) so a
   * live system always gets a real delta-time scalar, never the context object.
   */
  update(dt, state) {
    this.time += dt;
    for (const item of this.items) {
      item.acc = (item.acc || 0) - dt;
      const due = item.acc <= 0;
      if (due) {
        item.acc = item.interval || 0.1;
        item.draw(this.time, state);
        if (item.texture) item.texture.needsUpdate = true;
      }
      if (item.onFrame) item.onFrame(this.time, dt, state);
    }
  }
}

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

export function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function baseSurface(ctx, w, h, tint = "#04121c", alpha = 0.92) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = tint;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(92,230,255,0.16)");
  grad.addColorStop(0.5, "rgba(92,230,255,0.03)");
  grad.addColorStop(1, "rgba(255,171,90,0.10)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // scanlines
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#7fe8ff";
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 1;
}

function header(ctx, w, title, subtitle, accent = "#7fe8ff") {
  ctx.fillStyle = accent;
  ctx.font = `600 ${Math.round(w * 0.035)}px ${FONT}`;
  ctx.fillText(title.toUpperCase(), w * 0.045, w * 0.062);
  ctx.fillStyle = "rgba(220,240,255,0.55)";
  ctx.font = `500 ${Math.round(w * 0.026)}px ${FONT}`;
  ctx.fillText(subtitle, w * 0.045, w * 0.096);
  ctx.strokeStyle = "rgba(127,232,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.04, w * 0.112);
  ctx.lineTo(w * 0.96, w * 0.112);
  ctx.stroke();
}

/** A screen plane with a live canvas texture. */
export function createSmartSurface({
  width = 4,
  height = 2,
  pixels = 512,
  draw,
  interval = 0.12,
  registry,
  transparent = true,
  opacity = 1,
  doubleSide = false,
  emissiveTint = 0x000000,
  name = "smartSurface",
}) {
  const canvas = makeCanvas(pixels, Math.round((pixels * height) / width));
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent,
    opacity,
    side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: false,
    toneMapped: true,
    color: 0xffffff,
  });
  if (emissiveTint) material.color = new THREE.Color(emissiveTint);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  const item = {
    interval,
    texture,
    canvas,
    ctx,
    material,
    mesh,
    draw: (t, state) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      baseSurface(ctx, canvas.width, canvas.height);
      draw(ctx, canvas.width, canvas.height, t, state);
    },
  };
  registry?.add(item);
  return { mesh, texture, canvas, ctx, item };
}

/* ------------------------------------------------------------------ */
/* interface content                                                   */
/* ------------------------------------------------------------------ */

/** Coach strategy wall: play sets, arrows, player tokens, playbook numbering. */
export function strategyWallDraw(index = 0) {
  const random = mulberry32(1000 + index);
  return (ctx, w, h, t) => {
    header(ctx, w, "Play set 14", index === 0 ? "Horns flex · vs switch" : "Zone attack · 1-3-1", "#8ce8ff");
    const courtX = w * 0.07;
    const courtY = h * 0.2;
    const courtW = w * 0.86;
    const courtH = h * 0.66;
    ctx.strokeStyle = "rgba(140,232,255,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(courtX, courtY, courtW, courtH);
    ctx.beginPath();
    ctx.moveTo(courtX + courtW / 2, courtY);
    ctx.lineTo(courtX + courtW / 2, courtY + courtH);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(courtX + courtW / 2, courtY + courtH / 2, courtH * 0.13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(courtX + courtW * 0.42, courtY, courtW * 0.16, courtH * 0.2);
    ctx.strokeRect(courtX + courtW * 0.42, courtY + courtH * 0.8, courtW * 0.16, courtH * 0.2);

    const cycle = (t * 0.6 + index * 0.4) % 1;
    const plays = [
      { from: [0.3, 0.72], to: [0.62, 0.46], label: "1" },
      { from: [0.5, 0.85], to: [0.34, 0.55], label: "2" },
      { from: [0.72, 0.7], to: [0.56, 0.34], label: "3" },
      { from: [0.5, 0.5], to: [0.5, 0.22], label: "5" },
      { from: [0.24, 0.42], to: [0.42, 0.3], label: "4" },
    ];
    plays.forEach((play, i) => {
      const px = courtX + play.from[0] * courtW;
      const py = courtY + play.from[1] * courtH;
      const qx = courtX + play.to[0] * courtW;
      const qy = courtY + play.to[1] * courtH;
      const local = Math.max(0, Math.min(1, cycle * 1.6 - i * 0.08));
      ctx.strokeStyle = "rgba(255,171,90,0.75)";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + (qx - px) * local, py + (qy - py) * local);
      ctx.stroke();
      ctx.setLineDash([]);
      // player token
      ctx.fillStyle = i < 3 ? "#7fe8ff" : "#ffcf94";
      ctx.beginPath();
      ctx.arc(px + (qx - px) * local, py + (qy - py) * local, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#04202c";
      ctx.font = `700 16px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(play.label, px + (qx - px) * local, py + (qy - py) * local + 6);
      ctx.textAlign = "left";
    });
    // ball + defence shadows
    ctx.fillStyle = "rgba(255,120,80,0.85)";
    plays.forEach((play, i) => {
      const jitter = Math.sin(t * 1.6 + i) * 4;
      ctx.beginPath();
      ctx.arc(courtX + play.from[0] * courtW + jitter, courtY + (play.from[1] + 0.06) * courtH, 9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(220,240,255,0.75)";
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText(`PACE ${(0.92 + Math.sin(t * 0.7) * 0.06).toFixed(2)} · EFF 1.${(1 + Math.round(Math.abs(Math.sin(t * 0.3)) * 9))}`, w * 0.05, h * 0.95);
    void random;
  };
}

/** Live player telemetry: heart-rate waveform, load bars, hydration, sleep. */
export function telemetryDraw(ctx, w, h, t) {
  header(ctx, w, "Telemetry", "24 players · 1 Hz uplink", "#ffc07a");
  const rows = 4;
  const labels = ["#07 M. RAKOTO", "#11 S. ANDRIA", "#23 T. RAZAFY", "#04 L. RABE"];
  const randoms = [mulberry32(11), mulberry32(22), mulberry32(33), mulberry32(44)];
  for (let r = 0; r < rows; r++) {
    const y = h * (0.19 + r * 0.2);
    ctx.fillStyle = "rgba(230,244,255,0.82)";
    ctx.font = `600 ${Math.round(w * 0.028)}px ${FONT}`;
    ctx.fillText(labels[r], w * 0.05, y + 6);
    const hr = 128 + Math.round(Math.abs(Math.sin(t * 0.6 + r)) * 42);
    ctx.fillStyle = hr > 155 ? "#ff8f6b" : "#7fe8ff";
    ctx.font = `700 ${Math.round(w * 0.03)}px ${FONT}`;
    ctx.fillText(`${hr} bpm`, w * 0.32, y + 6);
    // waveform
    ctx.strokeStyle = "rgba(127,232,255,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) {
      const px = w * 0.05 + (i / 90) * w * 0.62;
      const phase = (i / 90) * Math.PI * 6 + t * 3 + r;
      const spike = Math.pow(Math.abs(Math.sin(phase)), 12) * (hr / 200);
      const py = y + 26 - spike * 22 - Math.sin(phase * 0.4) * 3;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // load bar
    const load = 0.35 + Math.abs(Math.sin(t * 0.45 + r * 1.3)) * 0.6;
    const barX = w * 0.72;
    const barW = w * 0.22;
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(barX, y + 12, barW, 12);
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, "#5ce6ff");
    grad.addColorStop(1, "#ffab5a");
    ctx.fillStyle = grad;
    ctx.fillRect(barX, y + 12, barW * load, 12);
    ctx.fillStyle = "rgba(220,240,255,0.6)";
    ctx.font = `500 ${Math.round(w * 0.024)}px ${FONT}`;
    ctx.fillText("LOAD", barX, y - 2);
    void randoms[r]();
  }
}

/** Smart mirror HUD: hydration index, recovery score, body temperature. */
export function mirrorDraw(ctx, w, h, t) {
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(200,224,235,0.22)");
  grad.addColorStop(1, "rgba(90,120,140,0.28)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(6,20,30,0.45)";
  ctx.fillRect(0, 0, w, h);
  header(ctx, w, "Recovery", "hydration · sleep · load", "#a8f0d0");
  const items = [
    { label: "HYDRATION", value: `${74 + Math.round(Math.sin(t * 0.5) * 4)} %`, color: "#7fe8ff" },
    { label: "SLEEP SCORE", value: `${82 + Math.round(Math.sin(t * 0.35 + 1) * 6)}`, color: "#c6a4ff" },
    { label: "MUSCLE LOAD", value: `${38 + Math.round(Math.sin(t * 0.8 + 2) * 9)} %`, color: "#ffc07a" },
    { label: "CORE TEMP", value: `${(36.4 + Math.sin(t * 0.2) * 0.3).toFixed(1)} °C`, color: "#ff9f9f" },
  ];
  items.forEach((item, i) => {
    const y = h * (0.24 + i * 0.18);
    ctx.fillStyle = "rgba(230,244,255,0.6)";
    ctx.font = `600 ${Math.round(w * 0.026)}px ${FONT}`;
    ctx.fillText(item.label, w * 0.06, y);
    ctx.fillStyle = item.color;
    ctx.font = `700 ${Math.round(w * 0.042)}px ${FONT}`;
    ctx.fillText(item.value, w * 0.45, y + 4);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(w * 0.06, y + 12, w * 0.7, 6);
    ctx.fillStyle = item.color;
    ctx.fillRect(w * 0.06, y + 12, w * 0.7 * (0.5 + Math.abs(Math.sin(t * 0.4 + i)) * 0.5), 6);
  });
  // body hydration silhouette
  ctx.strokeStyle = "rgba(168,240,208,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w * 0.87, h * 0.3, w * 0.045, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.87, h * 0.35);
  ctx.lineTo(w * 0.87, h * 0.62);
  ctx.moveTo(w * 0.87, h * 0.4);
  ctx.lineTo(w * 0.83, h * 0.52);
  ctx.moveTo(w * 0.87, h * 0.4);
  ctx.lineTo(w * 0.91, h * 0.52);
  ctx.moveTo(w * 0.87, h * 0.62);
  ctx.lineTo(w * 0.84, h * 0.8);
  ctx.moveTo(w * 0.87, h * 0.62);
  ctx.lineTo(w * 0.9, h * 0.8);
  ctx.stroke();
}

/** Fake 4K camera feed of the court (multiview wall). */
export function feedDraw(feedIndex) {
  const random = mulberry32(900 + feedIndex * 7);
  const dots = Array.from({ length: 10 }, () => [random(), random()]);
  return (ctx, w, h, t) => {
    ctx.fillStyle = "#071722";
    ctx.fillRect(0, 0, w, h);
    // court in perspective
    ctx.strokeStyle = "rgba(127,232,255,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.8);
    ctx.lineTo(w * 0.88, h * 0.8);
    ctx.lineTo(w * 0.7, h * 0.36);
    ctx.lineTo(w * 0.3, h * 0.36);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.8);
    ctx.lineTo(w * 0.88, h * 0.36);
    ctx.moveTo(w * 0.3, h * 0.36);
    ctx.lineTo(w * 0.7, h * 0.8);
    ctx.stroke();
    dots.forEach((dot, i) => {
      const x = dot[0] + Math.sin(t * (0.4 + i * 0.05) + i) * 0.05;
      const y = dot[1] + Math.cos(t * (0.33 + i * 0.04) + i) * 0.05;
      const sx = w * (0.16 + x * 0.68);
      const sy = h * (0.42 + y * 0.34);
      ctx.fillStyle = i % 2 ? "rgba(255,171,90,0.95)" : "rgba(127,232,255,0.95)";
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(127,232,255,0.85)";
    ctx.font = `600 18px ${FONT}`;
    ctx.fillText(`CAM ${String(feedIndex + 1).padStart(2, "0")} · 240 fps`, w * 0.04, h * 0.1);
    ctx.fillStyle = "rgba(255,90,90,0.9)";
    ctx.beginPath();
    ctx.arc(w * 0.9, h * 0.08, 7 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(127,232,255,0.25)";
    for (let y = 0; y < h; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };
}

/** Tactical holo table: mini wireframe court with live player markers. */
export function createHoloTable({ registry, scale = 1 }) {
  const group = new THREE.Group();
  group.name = "holoTable";
  const courtW = 4.2 * scale;
  const courtD = 2.3 * scale;
  const shape = new THREE.Shape();
  shape.moveTo(-courtW / 2, -courtD / 2);
  shape.lineTo(courtW / 2, -courtD / 2);
  shape.lineTo(courtW / 2, courtD / 2);
  shape.lineTo(-courtW / 2, courtD / 2);
  shape.closePath();

  const floor = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({
      color: PALETTE.cyan,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const lineMaterial = new THREE.LineBasicMaterial({
    color: PALETTE.cyan,
    transparent: true,
    opacity: 0.85,
  });
  const points = [
    [-courtW / 2, 0, -courtD / 2],
    [courtW / 2, 0, -courtD / 2],
    [courtW / 2, 0, courtD / 2],
    [-courtW / 2, 0, courtD / 2],
    [-courtW / 2, 0, -courtD / 2],
  ];
  const boundary = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p))),
    lineMaterial
  );
  group.add(boundary);
  const mid = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -courtD / 2), new THREE.Vector3(0, 0, courtD / 2)]),
    lineMaterial
  );
  group.add(mid);
  const circle = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * courtD * 0.16, 0, Math.sin(a) * courtD * 0.16);
      })
    ),
    lineMaterial
  );
  group.add(circle);

  // hoops
  [-1, 1].forEach((side) => {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.09 * scale, 0.008 * scale, 6, 18),
      new THREE.MeshBasicMaterial({ color: PALETTE.amber })
    );
    rim.position.set(side * courtW * 0.44, 0.22 * scale, 0);
    rim.rotation.y = Math.PI / 2;
    group.add(rim);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(0.03 * scale, 0.16 * scale),
      new THREE.MeshBasicMaterial({
        color: PALETTE.cyan,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );
    board.position.set(side * courtW * 0.46, 0.2 * scale, 0);
    board.rotation.y = Math.PI / 2;
    group.add(board);
  });

  // player markers
  const markers = [];
  const markerGeometry = new THREE.CylinderGeometry(0.045 * scale, 0.045 * scale, 0.12 * scale, 10);
  for (let i = 0; i < 10; i++) {
    const isAlpha = i < 5;
    const material = new THREE.MeshBasicMaterial({
      color: isAlpha ? PALETTE.cyan : PALETTE.amber,
      transparent: true,
      opacity: 0.95,
    });
    const marker = new THREE.Mesh(markerGeometry, material);
    marker.position.y = 0.16 * scale;
    group.add(marker);
    markers.push({ marker, phase: i * 0.7, team: isAlpha });
    const trail = new THREE.Mesh(
      new THREE.CircleGeometry(0.07 * scale, 16),
      new THREE.MeshBasicMaterial({
        color: isAlpha ? PALETTE.cyan : PALETTE.amber,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    trail.rotation.x = -Math.PI / 2;
    trail.position.y = 0.02;
    group.add(trail);
    marker.userData.trail = trail;
  }

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.001, courtD * 0.52, 1.6 * scale, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: PALETTE.cyan,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  beam.position.y = 0.8 * scale;
  group.add(beam);

  registry?.add({
    interval: 0.05,
    draw: () => {},
    onFrame: (t) => {
      markers.forEach((entry, i) => {
        const attack = entry.team ? 1 : -1;
        const phase = t * 0.45 + entry.phase;
        const x = Math.sin(phase) * courtW * 0.34 * attack + Math.sin(phase * 2.3) * 0.12 * attack;
        const z = Math.cos(phase * 0.8 + i) * courtD * 0.32;
        entry.marker.position.set(x, 0.16 * scale, z);
        entry.marker.rotation.y = Math.sin(phase * 3) * 0.4;
        const trail = entry.marker.userData.trail;
        trail.position.set(x, 0.02, z);
        trail.scale.setScalar(0.8 + Math.sin(t * 3 + i) * 0.25);
      });
      beam.material.opacity = 0.08 + Math.sin(t * 1.4) * 0.04;
    },
  });

  return group;
}

/* ------------------------------------------------------------------ */
/* volumetric hologram material                                        */
/* ------------------------------------------------------------------ */

export function createVolumetricMaterial({ color = PALETTE.cyan, lines = 90, speed = 0.6, opacity = 0.4 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uLines: { value: lines },
      uSpeed: { value: speed },
      uOpacity: { value: opacity },
      uIntensity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalW;
      void main() {
        vUv = uv;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uLines;
      uniform float uSpeed;
      uniform float uOpacity;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vNormalW;
      void main() {
        float scan = fract(vUv.y * uLines - uTime * uSpeed);
        float lines = smoothstep(0.0, 0.35, scan) * smoothstep(1.0, 0.65, scan);
        float flicker = 0.82 + 0.18 * sin(uTime * 9.0 + vUv.y * 40.0);
        float fres = pow(1.0 - abs(dot(normalize(vNormalW), vec3(0.0, 0.0, 1.0))), 1.6);
        float alpha = (0.16 + lines * 0.5 + fres * 0.35) * uOpacity * uIntensity * flicker;
        gl_FragColor = vec4(uColor * (0.7 + lines * 0.9 + fres), alpha);
      }
    `,
  });
}

export function updateVolumetric(material, time) {
  if (material && material.uniforms?.uTime) material.uniforms.uTime.value = time;
}

/* ------------------------------------------------------------------ */
/* floating 3D labels                                                  */
/* ------------------------------------------------------------------ */

export function createLabelSprite(text, { color = "#8ce8ff", sub = "", width = 256, accent = "rgba(92,230,255,0.55)" } = {}) {
  const canvas = makeCanvas(width, width / 2);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  roundedRect(ctx, 6, 6, canvas.width - 12, canvas.height - 12, 18);
  ctx.fillStyle = "rgba(4,18,28,0.82)";
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.round(width * 0.11)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2 + (sub ? -4 : 10));
  if (sub) {
    ctx.fillStyle = "rgba(220,240,255,0.7)";
    ctx.font = `500 ${Math.round(width * 0.075)}px ${FONT}`;
    ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 28);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width / 40, width / 80, 1);
  return sprite;
}

/** Shared material library accessor for zones that need extra one-off materials. */
export const extraMaterials = (() => {
  let cache = null;
  return () => {
    if (!cache) cache = createMaterials();
    return cache;
  };
})();
