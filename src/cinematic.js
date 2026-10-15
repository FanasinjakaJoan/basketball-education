/**
 * cinematic.js — the 35 s storyboard.
 * Ten camera stations are interpolated with a centripetal Catmull-Rom spline
 * (C1-continuous across segments) so the drone fly-through never snaps.
 * Each segment maps to a moment of the film, and the film also drives the
 * building runtime: LED floor activation, hoop deployment, PDLC privacy,
 * electrochromic glazing and the scoreboard.
 */
import * as THREE from "three";
import { clamp, smoothstep } from "./lib/util.js";

export const FILM_DURATION = 35;

/**
 * Camera stations. pos/target in metres, fov in degrees.
 * 0:00 aerial · 0:05 facade · 0:08 court centre · 0:12 players · 0:15 bridge
 * 0:18 wing corridor · 0:20 dorm pods · 0:23 wet zone · 0:27 TOC · 0:30 VIP · 0:35 finale
 */
/**
 * The film is cut into four shots. Each shot owns its own Catmull-Rom spline,
 * so a camera move can never be forced to travel through a wall: the two
 * geographic jumps (court → team wing, wing → tactical floor) are deliberate
 * cuts that land exactly on chapter boundaries.
 */
export const SHOTS = [
  {
    id: "approach",
    chapter: 0,
    start: 0,
    end: 6.2,
    cut: false,
    keys: [
      { t: 0.0, pos: [104, 78, 132], target: [0, 16, -4], fov: 40, note: "aerial establishing" },
      { t: 2.4, pos: [70, 40, 84], target: [6, 12, -12], fov: 38, note: "drone descent" },
      { t: 4.6, pos: [26, 13, 2], target: [4, 6, -22], fov: 43, note: "raking the glass facade" },
      { t: 6.2, pos: [4.5, 4.4, -32], target: [0, 3.6, -18], fov: 44, note: "arrival at the entrance canopy" },
    ],
  },
  {
    id: "court",
    chapter: 1,
    start: 6.2,
    end: 15.4,
    cut: true,
    keys: [
      { t: 6.2, pos: [1.5, 3.4, -19.5], target: [0, 3.0, -6], fov: 46, note: "through the entrance glass" },
      { t: 8.6, pos: [1.5, 4.4, -9.0], target: [-3, 2.4, 3], fov: 46, note: "gliding over the activating court" },
      { t: 11.0, pos: [-9.5, 4.2, 6.5], target: [2, 2.2, -3], fov: 44, note: "hoops deploying" },
      { t: 13.2, pos: [-11.8, 2.3, 6.6], target: [4.5, 1.6, -5.5], fov: 40, note: "players + telemetry ribbon" },
      { t: 15.4, pos: [-8.6, 2.8, 6.4], target: [12, 3.4, -2], fov: 54, note: "turning toward the west wing" },
    ],
  },
  {
    id: "wings",
    chapter: 2,
    start: 15.4,
    end: 25.0,
    cut: true,
    keys: [
      { t: 15.4, pos: [-14.6, 2.6, 4.6], target: [-20.5, 2.8, 4.4], fov: 56, note: "link corridor" },
      { t: 17.4, pos: [-24.6, 3.2, 5.8], target: [-30.4, 3.6, 0.5], fov: 58, note: "wing corridor" },
      { t: 18.7, pos: [-28.9, 3.4, -1.8], target: [-30.0, 4.8, -3.2], fov: 56, note: "into the stair void" },
      { t: 19.6, pos: [-28.9, 5.6, -1.8], target: [-34.6, 5.4, -2.0], fov: 55, note: "rising to the dorm level" },
      { t: 20.8, pos: [-25.9, 4.6, 5.6], target: [-34.6, 4.8, -2.4], fov: 54, note: "smart pods" },
      { t: 22.2, pos: [-29.6, 5.2, 8.2], target: [-35.6, 4.6, -3.6], fov: 52, note: "13 pods per level" },
      { t: 23.4, pos: [-29.2, 5.4, -0.6], target: [-29.6, 3.0, -3.8], fov: 56, note: "back to the stair void" },
      { t: 24.3, pos: [-29.2, 2.7, -1.6], target: [-30.6, 1.9, -9.4], fov: 58, note: "down to the wet zone" },
      { t: 25.0, pos: [-30.2, 2.3, -9.8], target: [-34.8, 1.6, -12.8], fov: 58, note: "showers, smart mirrors, cryo" },
    ],
  },
  {
    id: "management",
    chapter: 3,
    start: 25.0,
    end: 35.0,
    cut: true,
    keys: [
      { t: 25.0, pos: [7.2, 6.6, -9.6], target: [-1.6, 6.5, -19.6], fov: 48, note: "tactical operations centre" },
      { t: 28.0, pos: [2.2, 6.2, -11.6], target: [-3.2, 6.2, -19.8], fov: 44, note: "curved strategy wall + holo table" },
      { t: 31.0, pos: [-0.6, 6.6, -2.0], target: [0.4, 5.6, 18.0], fov: 46, note: "crossing the court to the VIP deck" },
      { t: 33.0, pos: [-0.4, 6.6, 12.6], target: [0.6, 5.4, 21.0], fov: 40, note: "VIP lounge lighting up" },
      { t: 35.0, pos: [-1.2, 6.9, 16.4], target: [0, 1.6, -6.0], fov: 34, note: "VIP panorama over the court" },
    ],
  },
];

/** Flat list of every camera station, kept for tooling and documentation. */
export const CAMERA_KEYS = SHOTS.flatMap((shot) => shot.keys.map((key) => ({ ...key, shot: shot.id })));

export function shotAt(time) {
  const t = clamp(time, 0, FILM_DURATION);
  for (const shot of SHOTS) {
    if (t >= shot.start && t < shot.end) return shot;
  }
  return SHOTS[SHOTS.length - 1];
}

export const CHAPTERS = [
  { index: 0, start: 0, end: 5, key: "drone" },
  { index: 1, start: 5, end: 15, key: "court" },
  { index: 2, start: 15, end: 25, key: "wings" },
  { index: 3, start: 25, end: 35, key: "vip" },
];

/* ------------------------------------------------------------------ */
/* spline helper                                                       */
/* ------------------------------------------------------------------ */

function buildSegmentCurves(points) {
  const curves = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    curves.push(
      new THREE.CatmullRomCurve3(
        [p0.clone(), p1.clone(), p2.clone(), p3.clone()],
        false,
        "centripetal",
        0.5
      )
    );
  }
  return curves;
}

export class CinematicDirector {
  constructor() {
    this.time = 0;
    this.playing = true;
    this.speed = 1;
    this.loop = true;
    this.mode = "cinematic";
    this.tween = null;
    this._pos = new THREE.Vector3();
    this._target = new THREE.Vector3();
    this._lastFov = CAMERA_KEYS[0].fov;
    this._skipped = 0;
    this._shots = SHOTS.map((shot) => ({
      shot,
      pos: buildSegmentCurves(shot.keys.map((key) => new THREE.Vector3(...key.pos))),
      target: buildSegmentCurves(shot.keys.map((key) => new THREE.Vector3(...key.target))),
    }));
  }

  get duration() {
    return FILM_DURATION;
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  toggle() {
    this.playing = !this.playing;
    return this.playing;
  }

  restart() {
    this.time = 0;
    this.playing = true;
    this.tween = null;
    this._skipped = -1;
  }

  seek(time) {
    this.time = clamp(time, 0, FILM_DURATION);
    this.tween = null;
  }

  seekChapter(index) {
    const shot = SHOTS[clamp(index, 0, SHOTS.length - 1)];
    this.seek(shot.start + 0.08);
  }

  /** Smooth fly-to used by the zone browser (explore / plan modes). */
  flyTo(preset, duration = 2.6) {
    if (!preset) return;
    const fromPos = this._pos.clone();
    const fromTarget = this._target.clone();
    this.tween = {
      t: 0,
      duration,
      fromPos,
      fromTarget,
      toPos: new THREE.Vector3(...preset.pos),
      toTarget: new THREE.Vector3(...(preset.target || [0, 2, 0])),
      fromFov: this._lastFov ?? preset.fov ?? 48,
      toFov: preset.fov ?? 48,
    };
  }

  /** Returns { pos, target, fov, roll, shot } for the requested film time. */
  sampleFilm(time) {
    const t = clamp(time, 0, FILM_DURATION);
    const entry = this._shots.find((item) => t >= item.shot.start && t < item.shot.end) || this._shots[this._shots.length - 1];
    const keys = entry.shot.keys;
    let index = 0;
    for (let i = 0; i < keys.length - 1; i++) {
      if (t >= keys[i].t && t <= keys[i + 1].t) {
        index = i;
        break;
      }
      index = keys.length - 2;
    }
    const a = keys[index];
    const b = keys[index + 1];
    const span = Math.max(0.0001, b.t - a.t);
    const localT = clamp((t - a.t) / span, 0, 1);
    const eased = localT * localT * (3 - 2 * localT) * 0.55 + localT * 0.45;
    const u = (1 + eased) / 3;

    this._posCurveLocal = entry.pos;
    entry.pos[index].getPoint(u, this._pos);
    entry.target[index].getPoint(u, this._target);

    // gentle drone breathing
    const breath = Math.sin(t * 1.35) * 0.06 + Math.sin(t * 0.47) * 0.1;
    this._pos.y += breath * 0.5;
    this._pos.x += Math.sin(t * 0.9) * 0.05;
    this._pos.z += Math.cos(t * 0.8) * 0.05;

    const fov = THREE.MathUtils.lerp(a.fov, b.fov, eased);
    const roll = Math.sin(t * 0.55) * 0.008;
    this._lastFov = fov;
    return { pos: this._pos, target: this._target, fov, roll, shot: entry.shot };
  }

  /** Film-driven building state, so the architecture performs on cue. */
  filmState(time) {
    const t = clamp(time, 0, FILM_DURATION);
    return {
      ledActivation: smoothstep(5.6, 8.0, t) * 0.7 + smoothstep(8.0, 11.5, t) * 0.3,
      hoopDeploy: smoothstep(7.6, 10.4, t),
      gantryActive: smoothstep(8.8, 12.2, t),
      podPrivacy: 0.32 + smoothstep(19.2, 20.6, t) * 0.5 - smoothstep(23.6, 24.6, t) * 0.45,
      vipPrivacy: smoothstep(26.4, 28.2, t) - smoothstep(31.4, 33.4, t),
      scenarioId: t > 29 ? "game" : "training",
      courtBoost: 0.4 + smoothstep(0, 6, t) * 0.6,
    };
  }

  update(dt, camera, options = {}) {
    if (this.tween) {
      this.tween.t += dt / this.tween.duration;
      const k = clamp(this.tween.t, 0, 1);
      const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this._pos.lerpVectors(this.tween.fromPos, this.tween.toPos, ease);
      this._target.lerpVectors(this.tween.fromTarget, this.tween.toTarget, ease);
      const fov = THREE.MathUtils.lerp(this.tween.fromFov, this.tween.toFov, ease);
      this._lastFov = fov;
      camera.position.copy(this._pos);
      camera.fov = fov;
      camera.lookAt(this._target);
      camera.rotation.z += Math.sin(this.tween.t * 6) * 0.004 * (1 - ease);
      camera.updateProjectionMatrix();
      if (k >= 1) this.tween = null;
      return { pos: this._pos, target: this._target, fov, playing: this.playing };
    }

    if (this.playing) {
      const previous = this.time;
      this.time += dt * this.speed;
      if (this._skipped > 0) this._skipped -= dt;
      if (this.time >= FILM_DURATION) {
        if (this.loop && !options.holdAtEnd) {
          this.time -= FILM_DURATION;
          this.cutAt = this.time;
        } else {
          this.time = FILM_DURATION;
          this.playing = false;
        }
      }
      if (options.onEnd && previous < FILM_DURATION && this.time === FILM_DURATION) {
        options.onEnd();
      }
    }

    const sample = this.sampleFilm(this.time);
    if (options.apply !== false) {
      camera.position.copy(sample.pos);
      camera.fov = sample.fov;
      camera.lookAt(sample.target);
      camera.rotation.z += sample.roll;
      camera.updateProjectionMatrix();
    }
    return { ...sample, playing: this.playing, time: this.time };
  }

  chapterIndex() {
    const t = this.time;
    for (const chapter of CHAPTERS) {
      if (t >= chapter.start && t < chapter.end) return chapter.index;
    }
    return CHAPTERS.length - 1;
  }

  formatTime(time = this.time) {
    const total = Math.max(0, time);
    const seconds = Math.floor(total);
    const tenths = Math.floor((total - seconds) * 10);
    return `00:${String(seconds).padStart(2, "0")}.${tenths}`;
  }
}
