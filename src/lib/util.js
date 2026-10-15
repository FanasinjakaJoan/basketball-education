/**
 * Shared helpers: deterministic randomness, procedural canvas textures and
 * small geometry utilities used across the complex builder.
 * No external assets: every texture is generated at runtime so the model
 * loads instantly and stays fully offline-capable.
 */
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* deterministic random                                                */
/* ------------------------------------------------------------------ */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/* ------------------------------------------------------------------ */
/* canvas textures                                                     */
/* ------------------------------------------------------------------ */

function makeCanvas(width, height = width) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function canvasTexture(width, height, draw, options = {}) {
  const {
    repeat = [1, 1],
    srgb = true,
    anisotropy = 8,
    wrap = THREE.RepeatWrapping,
    name = "",
  } = options;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = name;
  texture.wrapS = wrap;
  texture.wrapT = wrap;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

/** Warm maple / resin professional court surface. */
export function courtSurfaceTexture(repeat = [1, 1]) {
  return canvasTexture(
    1024,
    1024,
    (ctx, w, h) => {
      const random = mulberry32(90210);
      const base = ctx.createLinearGradient(0, 0, w, h);
      base.addColorStop(0, "#c88f52");
      base.addColorStop(0.45, "#b87c43");
      base.addColorStop(1, "#a86c38");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      const plank = 34;
      for (let y = 0; y < h; y += plank) {
        const tone = 0.86 + random() * 0.3;
        ctx.fillStyle = `rgba(${Math.floor(150 * tone)},${Math.floor(104 * tone)},${Math.floor(58 * tone)},0.5)`;
        ctx.fillRect(0, y, w, plank - 1);
        ctx.strokeStyle = "rgba(60,32,12,0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + plank - 0.5);
        ctx.lineTo(w, y + plank - 0.5);
        ctx.stroke();
        // staggered plank joints
        for (let x = (y / plank) % 2 ? 0 : 210; x < w; x += 320) {
          ctx.strokeStyle = "rgba(70,38,16,0.28)";
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + plank);
          ctx.stroke();
        }
      }
      // fine grain
      for (let i = 0; i < 2600; i++) {
        const x = random() * w;
        const y = random() * h;
        ctx.strokeStyle = `rgba(${random() > 0.5 ? 255 : 90},${180},${110},${0.02 + random() * 0.05})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 40 + random() * 90, y + (random() - 0.5) * 4);
        ctx.stroke();
      }
      // polished sheen
      const sheen = ctx.createRadialGradient(w * 0.35, h * 0.3, 40, w * 0.5, h * 0.5, w * 0.75);
      sheen.addColorStop(0, "rgba(255,236,205,0.30)");
      sheen.addColorStop(1, "rgba(255,236,205,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, w, h);
    },
    { repeat, name: "courtSurface" }
  );
}

/** Sensor / LED node grid baked into the transparent overlay above the court. */
export function sensorGridTexture(repeat = [1, 1]) {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cells = 32;
      const step = w / cells;
      ctx.strokeStyle = "rgba(90,238,255,0.30)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= cells; i++) {
        ctx.moveTo(i * step, 0);
        ctx.lineTo(i * step, h);
        ctx.moveTo(0, i * step);
        ctx.lineTo(w, i * step);
      }
      ctx.stroke();

      for (let x = 0; x <= cells; x++) {
        for (let y = 0; y <= cells; y++) {
          const px = x * step;
          const py = y * step;
          ctx.fillStyle = "rgba(150,246,255,0.85)";
          ctx.beginPath();
          ctx.arc(px, py, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,176,92,0.55)";
          ctx.beginPath();
          ctx.arc(px, py, 5.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    { repeat, name: "sensorGrid" }
  );
}

/** Window / louvre grid used on facades and curtain walls. */
export function facadeTexture(repeat = [1, 1], accent = "#59d8ff") {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const random = mulberry32(1337);
      ctx.fillStyle = "#0a0f16";
      ctx.fillRect(0, 0, w, h);
      const cols = 16;
      const rows = 26;
      const cw = w / cols;
      const ch = h / rows;
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const lit = random();
          const px = x * cw + 1.5;
          const py = y * ch + 1.5;
          const iw = cw - 3;
          const ih = ch - 3;
          if (lit > 0.72) {
            const warm = random() > 0.55;
            ctx.fillStyle = warm ? "rgba(255,196,120,0.85)" : accent;
            ctx.globalAlpha = 0.35 + random() * 0.5;
          } else {
            ctx.fillStyle = "#14202c";
            ctx.globalAlpha = 0.9;
          }
          ctx.fillRect(px, py, iw, ih);
          ctx.globalAlpha = 1;
        }
      }
      ctx.strokeStyle = "rgba(120,150,175,0.35)";
      ctx.lineWidth = 2;
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cw, 0);
        ctx.lineTo(x * cw, h);
        ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * ch);
        ctx.lineTo(w, y * ch);
        ctx.stroke();
      }
    },
    { repeat, name: "facade" }
  );
}

/** Brushed metal roughness streaks. */
export function brushedMetalTexture(repeat = [1, 1]) {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const random = mulberry32(4242);
      ctx.fillStyle = "#8d8d8d";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 4200; i++) {
        const y = random() * h;
        const shade = 90 + Math.floor(random() * 110);
        ctx.strokeStyle = `rgba(${shade},${shade},${shade},${0.06 + random() * 0.14})`;
        ctx.lineWidth = 0.6 + random() * 1.6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + (random() - 0.5) * 2);
        ctx.stroke();
      }
    },
    { repeat, srgb: false, name: "brushedMetal" }
  );
}

/** Soft noise used for roughness break-up on concrete / resin. */
export function noiseTexture(repeat = [1, 1], size = 256, contrast = 0.35) {
  return canvasTexture(
    size,
    size,
    (ctx, w, h) => {
      const random = mulberry32(777);
      const image = ctx.createImageData(w, h);
      for (let i = 0; i < image.data.length; i += 4) {
        const v = 150 + (random() - 0.5) * 255 * contrast;
        image.data[i] = image.data[i + 1] = image.data[i + 2] = clamp(v, 0, 255);
        image.data[i + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
      // soften
      ctx.globalAlpha = 0.35;
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.globalAlpha = 1;
    },
    { repeat, srgb: false, name: "noise" }
  );
}

/** Milky streaks for smart frosted glass. */
export function frostedGlassTexture(repeat = [1, 1]) {
  return canvasTexture(
    256,
    512,
    (ctx, w, h) => {
      const random = mulberry32(31337);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(255,255,255,0.42)");
      grad.addColorStop(0.5, "rgba(206,232,246,0.22)");
      grad.addColorStop(1, "rgba(255,255,255,0.40)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) {
        const x = random() * w;
        ctx.strokeStyle = `rgba(255,255,255,${0.02 + random() * 0.06})`;
        ctx.lineWidth = 0.5 + random() * 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (random() - 0.5) * 30, h);
        ctx.stroke();
      }
    },
    { repeat, name: "frostedGlass" }
  );
}

/** Cyan/amber grid used by holographic planes (alpha-driven). */
export function holoGridTexture(repeat = [1, 1], color = "rgba(88,226,255,0.95)") {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      for (let i = 0; i <= 16; i++) {
        const p = (i / 16) * w;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, h);
        ctx.moveTo(0, p);
        ctx.lineTo(w, p);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, w - 2, h - 2);
      ctx.globalAlpha = 1;
    },
    { repeat, name: "holoGrid" }
  );
}

/** Strip of repeating light dashes for cove / landscape accents. */
export function ledStripTexture(repeat = [1, 1], color = "#7ff0ff") {
  return canvasTexture(
    256,
    32,
    (ctx, w, h) => {
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        const x = (i / 8) * w + 6;
        const grad = ctx.createLinearGradient(x, 0, x + 20, 0);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(x - 6, 0, 24, h);
      }
    },
    { repeat, name: "ledStrip" }
  );
}

/** Area-rug like texture for lounge zones. */
export function fabricTexture(repeat = [1, 1], tint = "#2b3340") {
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      const random = mulberry32(5150);
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const x = random() * w;
        const y = random() * h;
        const a = 0.03 + random() * 0.06;
        ctx.fillStyle = random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
        ctx.fillRect(x, y, 2, 1);
      }
    },
    { repeat, name: "fabric" }
  );
}

/* ------------------------------------------------------------------ */
/* geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** Rounded box built from an extruded rounded rect (cheap, low poly). */
export function roundedBox(width, height, depth, radius = 0.1, curveSegments = 3) {
  const r = Math.min(radius, width / 2 - 0.001, height / 2 - 0.001);
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(depth - 0.002, 0.002),
    bevelEnabled: true,
    bevelSize: radius * 0.35,
    bevelThickness: radius * 0.35,
    bevelSegments: curveSegments,
    curveSegments,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** Simple plane facing +Y (floor) or rotated as needed. */
export function floorGeometry(width, depth, y = 0) {
  const geometry = new THREE.PlaneGeometry(width, depth);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y, 0);
  return geometry;
}

/** A hollow steel frame ring (for the gantry structure / roof trusses). */
export function trussBetween(a, b, thickness = 0.08) {
  const start = new THREE.Vector3().fromArray(a);
  const end = new THREE.Vector3().fromArray(b);
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const geometry = new THREE.CylinderGeometry(thickness, thickness, length, 8, 1, true);
  geometry.translate(0, length / 2, 0);
  const mesh = new THREE.Mesh(geometry);
  mesh.position.copy(start);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

export function disposeObject(root) {
  root.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    const material = child.material;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else if (material) material.dispose();
  });
}
