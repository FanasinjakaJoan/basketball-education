/**
 * tools/build-plan-svg.mjs
 * Generates docs/floor-plan.svg from src/plan.js — the same numbers the
 * real-time 3D model is built from, so the drawing can never drift from the
 * massing, the court markings or the room schedule.
 *
 *   node tools/build-plan-svg.mjs
 *
 * Sheet content: level-0 general arrangement, level-1 dorm plan, long section
 * A-A, room schedule, IoT legend, site context diagram and title block.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE, COURT, HALL, WING, BRIDGE, TEAMS } from "../src/plan.js";

const here = dirname(fileURLToPath(import.meta.url));
const outFile = resolve(here, "../docs/floor-plan.svg");

/* ------------------------------------------------------------------ */
/* sheet + palette                                                     */
/* ------------------------------------------------------------------ */
const SHEET = { width: 1584, height: 1160, margin: 44 };
const PX = 5.8; // px per metre — main plan

const INK = "#0e1a24";
const PAPER = "#f6f2e8";
const CYAN = "#0f7f9a";
const AMBER = "#c2701f";
const GREY = "#8d9aa5";
const MUTED = "#44525c";

const esc = (value) =>
  String(value)
    .replaceAll("&amp;", "\u0000AMP\u0000")
    .replaceAll("&", "&amp;")
    .replaceAll("\u0000AMP\u0000", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

function label(
  x,
  y,
  text,
  { size = 11, weight = 600, fill = INK, anchor = "middle", letter = 0, rotate = null, halo = false } = {}
) {
  const transform = rotate ? ` transform="rotate(${rotate} ${x.toFixed(1)} ${y.toFixed(1)})"` : "";
  const back = halo ? ' stroke="#fbf9f2" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round"' : "";
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${letter}"${back}${transform}>${esc(
    text
  )}</text>`;
}

/* ------------------------------------------------------------------ */
/* projector                                                           */
/* ------------------------------------------------------------------ */
function projector(originX, originY, scale = PX) {
  return (x, z) => [originX + x * scale, originY + z * scale];
}

const PLAN = { originX: 1048, originY: 418 };
const p1 = projector(PLAN.originX, PLAN.originY);

/** plan rect from centre (x,z) + size (w,d) — used by the level-0 panel */
function rect(x, z, w, d, style, title = "") {
  const [px, py] = p1(x - w / 2, z - d / 2);
  return `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${(w * PX).toFixed(1)}" height="${(d * PX).toFixed(
    1
  )}" ${style}>${title ? `<title>${esc(title)}</title>` : ""}</rect>`;
}

function planLine(x1, z1, x2, z2, style) {
  const [ax, ay] = p1(x1, z1);
  const [bx, by] = p1(x2, z2);
  return `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" ${style}/>`;
}

function planCircle(x, z, r, style) {
  const [cx, cy] = p1(x, z);
  return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * PX).toFixed(1)}" ${style}/>`;
}

/* ------------------------------------------------------------------ */
/* level 0 — general arrangement                                       */
/* ------------------------------------------------------------------ */
function level0Plan() {
  let s = "";
  const overlays = [];

  /* immediate context: approach apron, steps, canopy, hedges */
  s += rect(0, HALL.entranceZ - 9, 64, 14, `fill="#efece3" stroke="${GREY}" stroke-width="0.9"`, "Entrance apron — adaptive LED paving");
 for (let i = -6; i <= 6; i++) {
    s += rect(i * 6.6, HALL.entranceZ - 16, 5.4, 1.0, `fill="#d6e5d6" stroke="#5c7d5c" stroke-width="0.6"`);
  }
  for (let i = 0; i < 5; i++) {
    s += rect(0, HALL.entranceZ - 11 - i * 1.4, 28, 1.4, `fill="#e6e2d8" stroke="${GREY}" stroke-width="0.5"`);
  }
  s += label(p1(0, HALL.entranceZ - 6.4)[0], p1(0, HALL.entranceZ - 6.4)[1], "ENTRANCE APRON · ADAPTIVE LED PAVING", {
    size: 8.6,
    fill: GREY,
    letter: 0.7,
  });
  s += rect(0, HALL.entranceZ - 12, 24, 7.4, `fill="none" stroke="${AMBER}" stroke-width="1" stroke-dasharray="5 4"`, "Entrance canopy (above)");
  s += label(p1(0, HALL.entranceZ - 9.4)[0], p1(0, HALL.entranceZ - 9.4)[1], "CANOPY ABOVE · SIGNAGE", { size: 8.4, fill: AMBER, letter: 0.4 });

  /* hall envelope */
  s += rect(0, 0, HALL.width + 1.6, HALL.length + 1.6, `fill="#ffffff" stroke="${INK}" stroke-width="3"`, "Main hall — 34 × 46 m, 14 m clear");
  s += rect(0, 0, HALL.width, HALL.length, `fill="none" stroke="${INK}" stroke-width="1.2"`);

  /* seating banks */
  [-1, 1].forEach((side) => {
    for (let row = 0; row < 4; row++) {
      const z = side * (9.4 + row * 1.5);
      s += rect(0, z, HALL.width - 1.6, 1.5, `fill="${row % 2 ? "#e2e8ec" : "#d5dee4"}" stroke="${GREY}" stroke-width="0.5"`);
    }

  });

  /* mezzanine footprints (level +5.40) */
  [
    [1, "VIP LOUNGE · 48 GUESTS", AMBER],
    [-1, "TOC · 8 COACHES", CYAN],
  ].forEach(([side, text, color]) => {
    const z = side * (HALL.length / 2 - HALL.mezzanineDepth / 2);
    s += rect(0, z, HALL.width, HALL.mezzanineDepth, `fill="none" stroke="${color}" stroke-width="1.4" stroke-dasharray="7 4"`, text);
    overlays.push(
      label(p1(0, z + side * 0.3)[0], p1(0, z + side * 0.3)[1], text, { size: 7.6, fill: color, letter: 0.5, halo: true })
    );

  });

  /* court + markings */
  s += rect(0, 0, COURT.length + 4.4, COURT.width + 4.4, `fill="#eef1f3" stroke="${GREY}" stroke-width="0.8"`, "Court apron — resin deck");
  s += rect(0, 0, COURT.length, COURT.width, `fill="#f0d9b4" stroke="${AMBER}" stroke-width="1.6"`, "FIBA court 28 × 15 m");
  s += planLine(0, -COURT.width / 2, 0, COURT.width / 2, `stroke="${AMBER}" stroke-width="1.1"`);
  s += planCircle(0, 0, COURT.centreCircle, `fill="none" stroke="${AMBER}" stroke-width="1.1"`);
  [-1, 1].forEach((side) => {
    const bx = side * (COURT.length / 2 - COURT.basketFromBaseline);
    const ftx = side * (COURT.length / 2 - COURT.laneLength);
    s += rect(bx, 0, 0.5, COURT.backboardWidth, `fill="${AMBER}"`, "Backboard + rim");
    s += planCircle(bx, 0, COURT.rimDiameter / 2, `fill="none" stroke="${AMBER}" stroke-width="0.9"`);
    s += rect((bx + ftx) / 2, 0, Math.abs(ftx - bx), COURT.laneWidth, `fill="#f7e3c6" stroke="${AMBER}" stroke-width="0.8" opacity="0.9"`);
    s += planCircle(ftx, 0, COURT.freeThrowCircle, `fill="none" stroke="${AMBER}" stroke-width="0.8" stroke-dasharray="4 3"`);
  });
  s += rect(0, 0, COURT.length, COURT.width, `fill="none" stroke="#2aa7c4" stroke-width="0.9" stroke-dasharray="3 3"`, "Kinetic LED floor — 2 048 pressure cells");
  s += label(p1(0, -COURT.width / 2 - 2.4)[0], p1(0, -COURT.width / 2 - 2.4)[1], "KINETIC LED FLOOR · 2 048 SENSORS", {
    size: 8,
    fill: CYAN,
    letter: 0.5,
    halo: true,
  });

  /* scanner gantry + scoreboard (above) */
  [-1, 1].forEach((side) => {
    s += planLine(side * 6.2, -15, side * 6.2, 15, `stroke="${MUTED}" stroke-width="1.6" stroke-dasharray="6 3"`);
  });

  s += planCircle(0, 0, 2.9, `fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray="2 2"`);
  s += label(p1(0, 6.2)[0], p1(0, 6.2)[1], "SCOREBOARD ABOVE", { size: 7.2, fill: MUTED, letter: 0.3, halo: true });

  /* player tunnel */
  const tunnelZ0 = COURT.length / 2 + 0.4;
  const tunnelZ1 = HALL.length / 2;
  s += rect(0, (tunnelZ0 + tunnelZ1) / 2, 4.2, tunnelZ1 - tunnelZ0, `fill="#e7ecef" stroke="${GREY}" stroke-width="0.8"`, "Player tunnel");
  s += label(p1(0, HALL.length / 2 + 2.6)[0], p1(0, HALL.length / 2 + 2.6)[1], "TEAM APPROACH · GARDEN + PLAYER TUNNEL", { size: 8.4, fill: GREY, letter: 0.8, halo: false });
  s += label(p1(0, -HALL.length / 2 - 2.2)[0], p1(0, -HALL.length / 2 - 2.2)[1], "PUBLIC + VIP APPROACH · PLAZA AND PARKING BEYOND", { size: 8.4, fill: GREY, letter: 0.8 });

  /* team wings */
  TEAMS.forEach((team) => {
    const cx = team.side * ((WING.innerX + WING.outerX) / 2);
    const accent = team.side > 0 ? AMBER : CYAN;
    s += rect(cx, 0, WING.outerX - WING.innerX, WING.halfLength * 2, `fill="#fbf9f2" stroke="${INK}" stroke-width="2.2"`, `Wing ${team.name.en}`);
    s += rect(cx, 11.3, WING.outerX - WING.innerX, 9.4, `fill="#e7eef2" stroke="${GREY}" stroke-width="0.8"`, "Locker room + kit");
    s += label(p1(cx, 11.3)[0], p1(cx, 11.3)[1], "LOCKER ROOM · KIT", { size: 7.6, fill: GREY, letter: 0.4, halo: true });
    s += rect(cx, 0, WING.outerX - WING.innerX, 9, `fill="#eef3f0" stroke="${GREY}" stroke-width="0.8"`, "Team gym");
    s += label(p1(cx, 0)[0], p1(cx, 0)[1], "TEAM GYM", { size: 7.6, fill: GREY, letter: 0.4, halo: true });
    s += rect(cx, -11, WING.outerX - WING.innerX, 10, `fill="#e4f0f4" stroke="${CYAN}" stroke-width="0.9"`, "Showers, smart mirrors, cryo");
    s += label(p1(cx, -9.4)[0], p1(cx, -9.4)[1], "SHOWERS · MIRRORS", { size: 7.4, fill: CYAN, letter: 0.3, halo: true });
    s += label(p1(cx, -13.4)[0], p1(cx, -13.4)[1], "CRYO PODS −110 °C", { size: 7.4, fill: CYAN, letter: 0.3, halo: true });
    s += rect(cx, 0, 3.2, WING.halfLength * 2, `fill="#fdfbf4" stroke="${GREY}" stroke-width="0.7" stroke-dasharray="4 3"`, "Corridor");
    s += label(p1(cx, -15.4)[0], p1(cx, -15.4)[1], "CORRIDOR", { size: 7, fill: GREY, letter: 0.6, halo: true });
    s += label(p1(team.side * (WING.outerX + 3.4), 0)[0], p1(team.side * (WING.outerX + 3.4), 0)[1], team.name.en.toUpperCase(), {
      size: 9,
      fill: accent,
      letter: 0.8,
      rotate: -90,
    });
  });

  /* bridges + automated doors */
  [-1, 1].forEach((side) => {
    const startX = side * BRIDGE.startX;
    const endX = side * BRIDGE.endX;
    const spanX = Math.abs(endX - startX);
    const cx = (startX + endX) / 2;
    const cz = (BRIDGE.z[0] + BRIDGE.z[1]) / 2;
    const depth = BRIDGE.z[1] - BRIDGE.z[0];
    s += rect(cx, cz, spanX, depth, `fill="#eaf3f6" stroke="${CYAN}" stroke-width="1.1"`, "Glazed link bridge");
    s += rect(cx, cz - depth / 2 - 1.1, 3.0, 0.3, `fill="${AMBER}" stroke="none"`, "Automated sliding door");
    s += rect(cx, cz + depth / 2 + 1.1, 3.0, 0.3, `fill="${AMBER}" stroke="none"`, "Automated sliding door");
    s += label(p1(cx, cz)[0], p1(cx, cz)[1], "PROXIMITY DOORS", {
      size: 6.2,
      fill: AMBER,
      letter: 0.3,
      rotate: -90,
    });
  });

  /* title of the panel */
  s += label(PLAN.originX, 118, "LEVEL 0 · MATCH FLOOR, LOCKERS, GYM, WET ZONE, VIP, TOC", {
    size: 10.6,
    weight: 700,
    letter: 1.1,
  });
  s += label(PLAN.originX, 134, "PLAN 1:250 · dimensions in metres · green = planted / smart-lighting zones", {
    size: 8.2,
    fill: GREY,
    letter: 0.4,
  });
  return s + overlays.join("");
}

/* ------------------------------------------------------------------ */
/* level 1 — dorm plan                                                 */
/* ------------------------------------------------------------------ */
function level1Plan() {
  const origin = { x: 228, y: 734 };
  const scale = 0.62;
  const dp = projector(origin.x, origin.y, PX * scale);
  const spanX = WING.outerX * 2 * PX * scale;
  let s = "";
  s += `<rect x="${(origin.x - spanX / 2 - 16).toFixed(1)}" y="${(origin.y - WING.halfLength * PX * scale - 22).toFixed(
    1
  )}" width="${(spanX + 32).toFixed(1)}" height="${(WING.halfLength * 2 * PX * scale + 44).toFixed(
    1
  )}" fill="none" stroke="${GREY}" stroke-width="0.9" stroke-dasharray="5 4"/>`;

  TEAMS.forEach((team) => {
    const cx = team.side * ((WING.innerX + WING.outerX) / 2);
    const accent = team.side > 0 ? AMBER : CYAN;
    const [px, py] = dp(cx - (WING.outerX - WING.innerX) / 2, -WING.halfLength);
    s += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${((WING.outerX - WING.innerX) * PX * scale).toFixed(
      1
    )}" height="${(WING.halfLength * 2 * PX * scale).toFixed(1)}" fill="#fbf9f2" stroke="${INK}" stroke-width="1.6"><title>Wing ${esc(
      team.name.en
    )} · level 1</title></rect>`;
    const [cpx, cpy] = dp(cx - 1.6, -WING.halfLength);
    s += `<rect x="${cpx.toFixed(1)}" y="${cpy.toFixed(1)}" width="${(3.2 * PX * scale).toFixed(1)}" height="${(
      WING.halfLength * 2 * PX * scale
    ).toFixed(1)}" fill="#fdfbf4" stroke="${GREY}" stroke-width="0.6" stroke-dasharray="4 3"/>`;
    WING.dormRows.forEach((row) => {
      const rowX = team.side * row.x;
      const spacing = (WING.halfLength * 2) / (row.pods + 1);
      for (let i = 0; i < row.pods; i++) {
        const z = -WING.halfLength + spacing * (i + 1);
        const [zx, zy] = dp(rowX, z);
        s += `<rect x="${(zx - (WING.pod.width * PX * scale) / 2).toFixed(1)}" y="${(
          zy - (WING.pod.depth * PX * scale) / 2
        ).toFixed(1)}" width="${(WING.pod.width * PX * scale).toFixed(1)}" height="${(WING.pod.depth * PX * scale).toFixed(
          1
        )}" fill="#dfe9f2" stroke="${accent}" stroke-width="0.6"><title>Smart pod · biometric sleep tracking</title></rect>`;
      }
    });
    const [tx, ty] = dp(cx, 0);
    s += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="8" fill="${accent}" font-weight="700" text-anchor="middle" transform="rotate(-90 ${tx.toFixed(
      1
    )} ${ty.toFixed(1)})" letter-spacing="0.8" stroke="#fbf9f2" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(
      team.name.en.toUpperCase()
    )} · 13 PODS + STUDY</text>`;
  });
  s += label(origin.x, origin.y + WING.halfLength * PX * scale + 34, "LEVEL 1 · SMART PODS, PDLC PRIVACY & STUDY", {
    size: 10,
    weight: 700,
    letter: 1,
  });
  s += label(origin.x, origin.y + WING.halfLength * PX * scale + 48, "13 pods per wing · 8 storage lockers · study level +7.60 above", {
    size: 8,
    fill: GREY,
  });
  return s;
}

/* ------------------------------------------------------------------ */
/* long section A-A                                                    */
/* ------------------------------------------------------------------ */
function section() {
  const SEC = { x: 786, y: 838, px: 10.8, py: 11.6 };
  const sp = (z, y) => [SEC.x + (z + 32) * SEC.px, SEC.y - y * SEC.py];
  const at = (z, y) => sp(z, y).map((v) => v.toFixed(1)).join(" ");
  let s = "";

  /* ground + roof + facades */
  s += `<g fill="none" stroke="${INK}" stroke-width="2">`;
  s += `<path d="M ${at(-32, 0)} L ${at(32, 0)}"/>`;
  s += `<path d="M ${at(-24, 14)} L ${at(-6.4, 14)}"/>`;
  s += `<path d="M ${at(-5.2, 14)} L ${at(5.2, 14)}" stroke-dasharray="5 4"/>`;
  s += `<path d="M ${at(6.4, 14)} L ${at(24, 14)}"/>`;
  s += `<path d="M ${at(-23.6, 0)} L ${at(-23.6, 14)}"/>`;
  s += `<path d="M ${at(23.6, 0)} L ${at(23.6, 14)}"/>`;
  s += `</g>`;

  /* mezzanine floors, enclosures, seating, tunnel, canopy */
  s += `<g fill="none" stroke="${INK}" stroke-width="1.2">`;
  s += `<path d="M ${at(-23.6, 5.4)} L ${at(-16.4, 5.4)}"/>`;
  s += `<path d="M ${at(16.4, 5.4)} L ${at(23.6, 5.4)}"/>`;
  s += `<path d="M ${at(-21.2, 5.4)} L ${at(-21.2, 8.9)} L ${at(-16.4, 8.9)} L ${at(-16.4, 5.4)}"/>`;
  s += `<path d="M ${at(16.4, 5.4)} L ${at(16.4, 8.9)} L ${at(21.2, 8.9)} L ${at(21.2, 5.4)}"/>`;
  [-1, 1].forEach((side) => {
    for (let row = 0; row < 4; row++) {
      const z = side * (9.4 + row * 1.5 + 0.75);
      const y = 0.55 + row * 0.52;
      const [x0, y0] = sp(z - 0.75, y);
      s += `<rect x="${x0.toFixed(1)}" y="${(y0 - 0.52 * SEC.py).toFixed(1)}" width="${(1.5 * SEC.px).toFixed(
        1
      )}" height="${(0.52 * SEC.py).toFixed(1)}"/>`;
    }
  });
  s += `<path d="M ${at(14, 0)} L ${at(14, 3.75)} L ${at(23.6, 3.75)}"/>`;
  s += `<path d="M ${at(-23.6, 7.2)} L ${at(-29.6, 7.2)}"/>`;
  s += `<path d="M ${at(-29.1, 0)} L ${at(-29.1, 7.2)}"/>`;
  s += `</g>`;

  /* court + systems in colour */
  const [cx0, cy0] = sp(-14, 0);
  s += `<rect x="${cx0.toFixed(1)}" y="${(cy0 - 0.35 * SEC.py).toFixed(1)}" width="${(28 * SEC.px).toFixed(1)}" height="${(
    0.35 * SEC.py
  ).toFixed(1)}" fill="${AMBER}" opacity="0.7"/>`;
  const [scx, scy] = sp(0, 10.6);
  s += `<rect x="${(scx - 2.6 * SEC.px).toFixed(1)}" y="${(scy - 0.35 * SEC.py).toFixed(1)}" width="${(5.2 * SEC.px).toFixed(
    1
  )}" height="${(0.7 * SEC.py).toFixed(1)}" fill="${CYAN}" opacity="0.9"/>`;
  s += label(scx, scy - 7, "HOLOGRAPHIC SCOREBOARD 4 m ABOVE COURT", { size: 7.2, fill: CYAN, letter: 0.4 });
  const [gx, gy] = sp(0, 12.5);
  s += `<rect x="${(gx - 6.2 * SEC.px).toFixed(1)}" y="${(gy - 0.2 * SEC.py).toFixed(1)}" width="${(12.4 * SEC.px).toFixed(
    1
  )}" height="${(0.35 * SEC.py).toFixed(1)}" fill="${INK}" opacity="0.55"/>`;
  s += label(gx, gy - 8, "ROBOTIC TRACKING GANTRY · 6 × 240 fps POSE CAMERAS", { size: 7.2, fill: MUTED, letter: 0.4 });
  [-12.4, 12.4].forEach((hx) => {
    const [x, y] = sp(hx, 3.55);
    s += `<rect x="${(x - 0.9 * SEC.px).toFixed(1)}" y="${y.toFixed(1)}" width="${(1.8 * SEC.px).toFixed(
      1
    )}" height="${(0.14 * SEC.py).toFixed(1)}" fill="${AMBER}"/>`;
  });
  const [hx0, hy0] = sp(-12.4, 3.55);
  s += label(hx0 + 4, hy0 - 7, "RETRACTABLE HOOP 3.05 m", { size: 7.2, fill: AMBER, letter: 0.4, anchor: "start" });
  const [tocx, tocy] = sp(-18.8, 7.2);
  s += label(tocx, tocy, "TOC", { size: 7.6, fill: CYAN, letter: 0.6, weight: 700 });
  const [vipx, vipy] = sp(18.8, 7.2);
  s += label(vipx, vipy, "VIP", { size: 7.6, fill: AMBER, letter: 0.6, weight: 700 });
  const [canx, cany] = sp(-27.4, 6.1);
  s += label(canx, cany, "CANOPY", { size: 7, fill: GREY, letter: 0.4 });

  /* datums */
  [0, 5.4, 14].forEach((y) => {
    const [, ly] = sp(-32, y);
    s += label(SEC.x - 8, ly + 3, y === 0 ? "±0.00" : `+${y.toFixed(2)}`, { size: 8, fill: GREY, anchor: "end", weight: 600 });
    s += `<line x1="${(SEC.x - 4).toFixed(1)}" y1="${ly.toFixed(1)}" x2="${(SEC.x + 68 * SEC.px).toFixed(
      1
    )}" y2="${ly.toFixed(1)}" stroke="${GREY}" stroke-width="0.3" stroke-dasharray="3 4" opacity="0.5"/>`;
  });

  s += label(SEC.x, SEC.y + 42, "SECTION A-A · HALL, TRIBUNES AND MANAGEMENT LEVELS · 1:250", {
    size: 10,
    weight: 700,
    letter: 1,
  });
  return s;
}

/* ------------------------------------------------------------------ */
/* site context diagram                                                */
/* ------------------------------------------------------------------ */
function siteContext() {
  const scale = 0.6;
  const origin = { x: 236, y: 898 };
  const g = projector(origin.x, origin.y, scale);
  const r = (x, z, w, d, style, title = "") => {
    const [px, py] = g(x - w / 2, z - d / 2);
    return `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${(w * scale).toFixed(1)}" height="${(d * scale).toFixed(
      1
    )}" ${style}>${title ? `<title>${esc(title)}</title>` : ""}</rect>`;
  };
  let s = "";
  s += `<circle cx="${origin.x}" cy="${origin.y}" r="${(200 * scale).toFixed(1)}" fill="none" stroke="${GREY}" stroke-width="0.8" stroke-dasharray="6 5"/>`;
  s += `<circle cx="${origin.x}" cy="${origin.y}" r="${(105 * scale).toFixed(1)}" fill="none" stroke="${GREY}" stroke-width="0.4" stroke-dasharray="3 4" opacity="0.6"/>`;
  /* jogging loop */
  s += `<ellipse cx="${origin.x}" cy="${(origin.y + 6 * scale).toFixed(1)}" rx="${(78 * scale).toFixed(1)}" ry="${(
    78 * scale * 0.72
  ).toFixed(1)}" fill="none" stroke="${MUTED}" stroke-width="1.4"/>`;
  s += r(0, 0, HALL.width + 2, HALL.length + 2, `fill="${INK}" stroke="none"`, "Main hall");
  TEAMS.forEach((team) => {
    s += r(team.side * ((WING.innerX + WING.outerX) / 2), 0, WING.outerX - WING.innerX, WING.halfLength * 2, `fill="${MUTED}" stroke="none"`, "Team wing");
  });
  s += r(SITE.pool.x, SITE.pool.z, SITE.pool.width, SITE.pool.depth, `fill="#bfe0ef" stroke="${CYAN}" stroke-width="0.6"`, "Reflecting pool");
  s += r(52, -26, 17, 30, `fill="#e3d8ef" stroke="#6b5b9a" stroke-width="0.6"`, "Outdoor training court");
  s += r(-58, HALL.entranceZ - 30, 46, 22, `fill="#e9e5dc" stroke="${GREY}" stroke-width="0.5"`, "Staff and visitor parking");
  s += r(0, HALL.entranceZ - 26, 64, SITE.plazaDepth, `fill="#efece3" stroke="${GREY}" stroke-width="0.5"`, "Entrance plaza");
  s += `<circle cx="${g(SITE.park.x + 8, SITE.park.z)[0].toFixed(1)}" cy="${g(SITE.park.x + 8, SITE.park.z)[1].toFixed(
    1
  )}" r="${(46 * scale).toFixed(1)}" fill="#dbe8db" stroke="#7d9b7d" stroke-width="0.6" opacity="0.9"/>`;
  s += label(origin.x, origin.y + 200 * scale + 22, "SITE CONTEXT · 420 × 420 m SITE DIAGRAM", {
    size: 10,
    weight: 700,
    letter: 1,
  });
  s += label(origin.x, origin.y + 200 * scale + 36, "1.2 km jogging loop · 310 trees · 180 adaptive light poles", {
    size: 8,
    fill: GREY,
  });
  return s;
}

/* ------------------------------------------------------------------ */
/* schedule, legend, title block, north arrow, dimensions               */
/* ------------------------------------------------------------------ */
function schedule(x, y) {
  const rows = [
    ["Site", "420 × 420 m", "PV 1 850 m² · 380 kWp · 180 poles"],
    ["Main hall", "34 × 46 m · 14 m clear", "1 500 lux on court · 2 700 m² floor"],
    ["Court", "28 × 15 m (FIBA)", "2 048 pressure cells · 1.4 mm pitch"],
    ["Team wings ×2", "18 × 32 m · 3 levels", "13 smart pods/wing · 90 min school/day"],
    ["Wet zone / wing", "12 showers · 6 mirrors", "Water recycling −68 % · 2 cryo pods"],
    ["TOC", "17.6 × 5.8 m · level +5.40", "9 m curved holo wall · 8 workstations"],
    ["VIP deck", "17.6 × 5.8 m · level +5.40", "48 guests · electrochromic glazing"],
    ["Bridges ×2", "3 m wide · 3.75 m high", "4 automated door pairs · 0.4 s"],
  ];
  const width = 520;
  const rowH = 20;
  let s = "";
  s += `<rect x="${x}" y="${y}" width="${width}" height="${24 + rows.length * rowH}" fill="#ffffff" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<rect x="${x}" y="${y}" width="${width}" height="22" fill="${INK}"/>`;
  s += label(x + 10, y + 15, "SCHEDULE OF AREAS &amp; SYSTEMS", { size: 10, fill: "#f6f2e8", weight: 700, anchor: "start", letter: 0.9 });
  rows.forEach((row, i) => {
    const ry = y + 22 + i * rowH;
    s += `<line x1="${x}" y1="${ry}" x2="${x + width}" y2="${ry}" stroke="${GREY}" stroke-width="0.4"/>`;
    s += label(x + 9, ry + 14, row[0], { size: 9, weight: 700, anchor: "start" });
    s += label(x + 118, ry + 14, row[1], { size: 9, fill: CYAN, anchor: "start" });
    s += label(x + 264, ry + 14, row[2], { size: 8.4, fill: MUTED, anchor: "start" });
  });
  return s;
}

function legend(x, y) {
  const items = [
    ["#f0d9b4", "Kinetic LED court floor (sensor grid)"],
    ["#e4f0f4", "Wet zone: showers · smart mirrors · cryo"],
    ["#dfe9f2", "Smart pod (biometric sleep tracking)"],
    ["#e3d8ef", "Outdoor training court"],
    ["#bfe0ef", "Reflecting pool / water feature"],
    ["#efece3", "Paving, plaza and parking"],
  ];
  let s = "";
  s += `<rect x="${x}" y="${y}" width="${x + 0 === 0 ? 300 : 300}" height="${20 + items.length * 17}" fill="#ffffff" stroke="${INK}" stroke-width="1.1"/>`;
  s += label(x + 9, y + 14, "LEGEND", { size: 9.6, weight: 700, anchor: "start", letter: 1.2 });
  items.forEach((item, i) => {
    const iy = y + 22 + i * 17;
    s += `<rect x="${x + 9}" y="${iy}" width="15" height="9" fill="${item[0]}" stroke="${GREY}" stroke-width="0.5"/>`;
    s += label(x + 30, iy + 8, item[1], { size: 8.4, fill: "#33414b", anchor: "start" });
  });
  return s;
}

function durationNotes() {
  const x = SHEET.margin + 4;
  const y = 470;
  const rows = [
    ["Render", "real-time WebGL 2 · AgX tone mapping · bloom + SMAA"],
    ["Capture", "4K / 60 fps cinematic sequence · 8 chapters of lighting cues"],
    ["Film", "0:00 drone descent · 0:05 court · 0:15 dorm wings · 0:25 VIP & TOC"],
    ["IoT", "2 048 floor sensors · 24 player telemetry uplinks · 12 servo axes"],
    ["Resilience", "62 % site energy autonomy · 68 % shower water recycled"],
  ];
  let s = "";
  s += `<rect x="${x}" y="${y}" width="520" height="${20 + rows.length * 18}" fill="none" stroke="${GREY}" stroke-width="0.9"/>`;
  s += label(x + 9, y + 14, "RENDER & SYSTEMS NOTES", { size: 9.6, weight: 700, anchor: "start", letter: 1 });
  rows.forEach((row, i) => {
    const ry = y + 22 + i * 18;
    s += label(x + 9, ry + 9, row[0], { size: 8.6, weight: 700, anchor: "start" });
    s += label(x + 92, ry + 9, row[1], { size: 8.4, fill: MUTED, anchor: "start" });
  });
  return s;
}

function titleBlock() {
  const w = 560;
  const h = 88;
  const x = SHEET.width - SHEET.margin - w;
  const y = SHEET.height - SHEET.margin - h;
  let s = "";
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="30" fill="${INK}"/>`;
  s += label(x + 13, y + 21, "SUPER SMART SPORTS COMPLEX & RESIDENCE", { size: 11.5, fill: "#f6f2e8", weight: 800, anchor: "start", letter: 0.8 });
  s += label(x + 13, y + 48, "Hoop Horizons Madagascar · Antananarivo", { size: 9.4, anchor: "start" });
  s += label(x + 13, y + 64, "Two professional basketball teams · IoT-first performance campus", { size: 8.6, fill: MUTED, anchor: "start" });
  s += label(x + 13, y + 80, "Drawing 01 — Level 0 & 1 general arrangement, section A-A, site context", { size: 8.6, fill: MUTED, anchor: "start" });
  s += label(x + w - 13, y + 48, "SCALE 1:250 @ A1", { size: 9.4, fill: CYAN, anchor: "end", weight: 700 });
  s += label(x + w - 13, y + 64, "REV A · 2026", { size: 8.6, fill: MUTED, anchor: "end" });
  s += label(x + w - 13, y + 80, "Dimensions in metres", { size: 8.6, fill: MUTED, anchor: "end" });
  return s;
}

function northArrow() {
  const x = SHEET.width - SHEET.margin - 44;
  const y = 132;
  return `<g>
    <circle cx="${x}" cy="${y}" r="26" fill="#ffffff" stroke="${INK}" stroke-width="1.1"/>
    <path d="M ${x} ${y - 18} L ${x + 7} ${y + 6} L ${x} ${y + 1.5} L ${x - 7} ${y + 6} Z" fill="${INK}"/>
    <text x="${x}" y="${y + 20}" font-size="10" font-weight="700" fill="${INK}" text-anchor="middle" font-family='${FONT}'>N</text>
    <text x="${x}" y="${y + 40}" font-size="8" fill="${GREY}" text-anchor="middle" font-family='${FONT}'>ENTRANCE</text>
  </g>`;
}

function dimensions() {
  let s = "";
  /* overall width above the plan */
  const [, planTop] = p1(0, -HALL.length / 2);
  const y = planTop - 100;
  const [x0] = p1(-WING.outerX - 4, 0);
  const [x1] = p1(WING.outerX + 4, 0);
  s += `<g stroke="${GREY}" stroke-width="0.8" fill="none">`;
  s += `<path d="M ${x0.toFixed(1)} ${y} L ${x1.toFixed(1)} ${y}"/>`;
  s += `<path d="M ${x0.toFixed(1)} ${y - 6} L ${x0.toFixed(1)} ${y + 6}"/>`;
  s += `<path d="M ${x1.toFixed(1)} ${y - 6} L ${x1.toFixed(1)} ${y + 6}"/>`;
  s += `</g>`;
  s += label((x0 + x1) / 2, y - 9, "76 m OVERALL — MIRRORED TEAM WINGS + CENTRAL ARENA", { size: 10, weight: 700, letter: 1 });

  /* hall length left of the plan */
  const xd = p1(-WING.outerX - 12, 0)[0] - 6;
  const [, z0] = p1(0, -HALL.length / 2);
  const [, z1] = p1(0, HALL.length / 2);
  s += `<g stroke="${GREY}" stroke-width="0.8" fill="none">`;
  s += `<path d="M ${xd.toFixed(1)} ${z0.toFixed(1)} L ${xd.toFixed(1)} ${z1.toFixed(1)}"/>`;
  s += `<path d="M ${(xd - 6).toFixed(1)} ${z0.toFixed(1)} L ${(xd + 6).toFixed(1)} ${z0.toFixed(1)}"/>`;
  s += `<path d="M ${(xd - 6).toFixed(1)} ${z1.toFixed(1)} L ${(xd + 6).toFixed(1)} ${z1.toFixed(1)}"/>`;
  s += `</g>`;
  s += label(xd - 12, (z0 + z1) / 2, "46 m HALL", { size: 9.4, weight: 700, rotate: -90 });

  /* wing depth below the plan */
  const yb = p1(0, WING.halfLength)[1] + 44;
  const [wx0] = p1(-(WING.outerX - 2), 0);
  const [wx1] = p1(-(WING.innerX + 2), 0);
  s += `<g stroke="${GREY}" stroke-width="0.8" fill="none">`;
  s += `<path d="M ${wx0.toFixed(1)} ${yb.toFixed(1)} L ${wx1.toFixed(1)} ${yb.toFixed(1)}"/>`;
  s += `<path d="M ${wx0.toFixed(1)} ${(yb - 5).toFixed(1)} L ${wx0.toFixed(1)} ${(yb + 5).toFixed(1)}"/>`;
  s += `<path d="M ${wx1.toFixed(1)} ${(yb - 5).toFixed(1)} L ${wx1.toFixed(1)} ${(yb + 5).toFixed(1)}"/>`;
  s += `</g>`;
  s += label((wx0 + wx1) / 2, yb + 14, "18 m WING", { size: 8.6, fill: MUTED, weight: 600 });
  return s;
}

/* ------------------------------------------------------------------ */
/* sheet                                                               */
/* ------------------------------------------------------------------ */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SHEET.width} ${SHEET.height}" width="${SHEET.width}" height="${SHEET.height}" role="img" aria-label="General arrangement, level 1 plan and section of the Super Smart Sports Complex and Residence">
  <defs>
    <style>text { font-family: ${FONT}; }</style>
  </defs>
  <rect width="${SHEET.width}" height="${SHEET.height}" fill="${PAPER}"/>
  <rect x="${SHEET.margin - 18}" y="${SHEET.margin - 18}" width="${SHEET.width - 2 * (SHEET.margin - 18)}" height="${
    SHEET.height - 2 * (SHEET.margin - 18)
  }" fill="none" stroke="${INK}" stroke-width="0.9"/>
  ${label(SHEET.margin + 4, SHEET.margin + 8, "SUPER SMART SPORTS COMPLEX & RESIDENCE — GENERAL ARRANGEMENT", {
    size: 15,
    weight: 800,
    anchor: "start",
    letter: 1.2,
  })}
  ${label(SHEET.margin + 4, SHEET.margin + 26, "Hoop Horizons Madagascar · two professional basketball teams · 3D model + plan generated from one shared dimension table", {
    size: 9.6,
    fill: MUTED,
    anchor: "start",
  })}
  ${schedule(SHEET.margin + 4, 116)}
  ${legend(SHEET.margin + 4, 320)}
  ${durationNotes()}
  ${dimensions()}
  ${northArrow()}
  ${level0Plan()}
  ${level1Plan()}
  ${section()}
  ${siteContext()}
  ${titleBlock()}
</svg>
`;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, svg, "utf8");
console.log(`floor plan written → ${outFile} (${(svg.length / 1024).toFixed(1)} kB)`);
