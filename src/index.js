/**
 * index.js — entry point: wires the HUD (ui.js) to the real-time scene (main.js).
 */
import { createUi } from "./ui.js";
import { startExperience } from "./main.js";

let app = null;

const ui = createUi({
  onMode: (mode) => app?.api.setMode(mode),
  onPlay: () => app?.api.togglePlay(),
  onRestart: () => {
    app?.director.restart();
    return true;
  },
  onSeek: (time) => {
    if (!app) return;
    app.director.seek(time);
    if (app.api.mode !== "cinematic") app.api.setMode("cinematic");
    app.director.playing = false;
  },
  onChapter: (index) => app?.api.jumpToChapter(index),
  onZone: (id) => app?.api.focusZone(id),
  onScenario: (id) => app?.api.setScenario(id),
  onQuality: (key) => app?.api.setQuality(key),
  onCapture: async () => app?.api.capture(),
  onToggle: (key, value) => {
    if (app) app.runtime.toggles[key] = value;
  },
  onLetterbox: (value) => app?.api.setLetterbox(value),
  onLanguage: () => {
    /* strings are already swapped by the HUD; 3D labels stay bilingual-neutral */
  },
  onSpeed: (value) => {
    if (app) app.director.speed = value;
  },
  isPlaying: () => app?.director.playing ?? true,
  currentTime: () => app?.director.time ?? 0,
});

app = startExperience({ ui, language: ui.language });

if (app) {
  app.director.speed = 1;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      setTimeout(() => ui.finishLoading(), 420);
    })
  );
  window.__smartComplex = app;
  // expose a tiny API for presentations / testing
  window.smartComplex = {
    play: (time) => {
      app.api.setMode("cinematic");
      app.director.seek(time ?? 0);
      app.director.playing = true;
    },
    pause: () => app.director.pause(),
    mode: (mode) => app.api.setMode(mode),
    zone: (id) => app.api.focusZone(id),
    scenario: (id) => app.api.setScenario(id),
    quality: (key) => app.api.setQuality(key),
    language: (code) => ui.setLanguage(code),
  };
}
