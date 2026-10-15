/**
 * ui.js — the heads-up display around the 3D film.
 * Trilingual (EN/FR/MG), keyboard driven, and it owns all user input:
 * modes, transport, chapters, zone browser, IoT toggles, scenarios, quality,
 * telemetry, systems gauges, event log and the 2D minimap of plan mode.
 */
import { STRINGS, t as tr } from "./i18n.js";
import { ZONES, HALL, WING, COURT, SITE } from "./plan.js";
import { CHAPTERS, FILM_DURATION } from "./cinematic.js";

function resolvePath(object, path) {
  return path.split(".").reduce((value, key) => (value == null ? value : value[key]), object);
}

export function createUi(handlers = {}) {
  const el = (id) => document.getElementById(id);
  const dom = {
    loading: el("loading"),
    toast: el("toast"),
    chapters: el("chapters"),
    zoneList: el("zone-list"),
    zoneDetail: el("zone-detail"),
    toggleGrid: el("toggle-grid"),
    scenarioRow: el("scenario-row"),
    telemetry: el("telemetry"),
    gauges: el("gauges"),
    log: el("log"),
    scrub: el("scrub"),
    scrubFill: el("scrub-fill"),
    scrubHandle: el("scrub-handle"),
    scrubMarks: el("scrub-marks"),
    timecode: el("timecode"),
    timecodeTotal: el("timecode-total"),
    chapterName: el("chapter-name"),
    bottomFill: el("bottom-progress-fill"),
    fps: el("fps"),
    minimap: el("minimap"),
    helpSheet: el("help-sheet"),
    playButton: el("play-button"),
    modeSwitch: el("mode-switch"),
    qualityRow: el("quality-row"),
    letterboxButton: el("letterbox-button"),
    speedSelect: el("speed-select"),
  };

  let language = document.documentElement.lang || "en";
  let activeZoneId = ZONES[0].id;
  let logCursor = 0;
  let letterboxOn = true;
  const logEntries = [];

  /* ---------------- static text ---------------- */
  function applyLanguage(code = language) {
    language = code;
    document.documentElement.lang = code;
    document.title = tr(STRINGS.docTitle, code);
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = resolvePath(STRINGS, node.dataset.i18n);
      if (value) node.textContent = tr(value, code);
    });
    document.querySelectorAll(".lang-tab").forEach((tab) => {
      const active = tab.dataset.lang === code;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    buildChapters();
    buildZones();
    buildToggles();
    buildScenarios();
    buildTelemetryLabels();
    buildGauges();
    renderLog();
    updatePlayButton(handlers.isPlaying ? handlers.isPlaying() : true);
  }

  /* ---------------- chapters ---------------- */
  function buildChapters() {
    dom.chapters.innerHTML = "";
    CHAPTERS.forEach((chapter, index) => {
      const data = STRINGS.chapters[index];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chapter";
      button.dataset.chapter = String(index);
      button.innerHTML = `
        <span class="chapter-time">${data.time}</span>
        <span class="chapter-title">${tr(data.title, language)}</span>
        <span class="chapter-desc">${tr(data.desc, language)}</span>
      `;
      button.addEventListener("click", () => handlers.onChapter?.(index));
      dom.chapters.appendChild(button);
    });
    dom.scrubMarks.innerHTML = CHAPTERS.map(
      (chapter) => `<span class="scrub-mark" style="left:${(chapter.start / FILM_DURATION) * 100}%"></span>`
    ).join("");
    dom.timecodeTotal.textContent = `/ ${format(FILM_DURATION)}`;
  }

  function format(seconds) {
    const value = Math.max(0, seconds);
    const whole = Math.floor(value);
    const tenths = Math.floor((value - whole) * 10);
    return `00:${String(whole).padStart(2, "0")}.${tenths}`;
  }

  /* ---------------- zone browser ---------------- */
  function buildZones() {
    dom.zoneList.innerHTML = "";
    ZONES.forEach((zone) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = `zone-button ${zone.id === activeZoneId ? "is-active" : ""}`;
      button.innerHTML = `
        <span class="zone-name">${tr(zone.name, language)}</span>
        <span class="zone-meta">${zone.specs.map((spec) => spec.value).slice(0, 2).join(" · ")}</span>
      `;
      button.addEventListener("click", () => {
        activeZoneId = zone.id;
        buildZones();
        showZoneDetail(zone);
        handlers.onZone?.(zone.id);
      });
      item.appendChild(button);
      dom.zoneList.appendChild(item);
    });
    const active = ZONES.find((zone) => zone.id === activeZoneId);
    if (active) showZoneDetail(active);
  }

  function showZoneDetail(zone) {
    dom.zoneDetail.hidden = false;
    dom.zoneDetail.innerHTML = `
      <p class="zone-desc">${tr(zone.desc, language)}</p>
      <h3 class="zone-spec-title">${tr(STRINGS.specs, language)}</h3>
      <ul class="zone-specs">
        ${zone.specs
          .map(
            (spec) =>
              `<li><span>${tr(resolvePath(STRINGS.spec, spec.label.replace("spec.", "")) || spec.label, language)}</span><strong>${spec.value}</strong></li>`
          )
          .join("")}
      </ul>
      <button type="button" class="chip" id="fly-button">${tr(STRINGS.flyHere, language)}</button>
    `;
    el("fly-button")?.addEventListener("click", () => handlers.onZone?.(zone.id));
  }

  /* ---------------- IoT toggles ---------------- */
  const TOGGLE_KEYS = ["ledFloor", "hoops", "doors", "ambient", "holo", "streams", "tracking", "electro", "water"];

  function buildToggles() {
    dom.toggleGrid.innerHTML = "";
    TOGGLE_KEYS.forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "toggle is-active";
      button.dataset.toggle = key;
      button.innerHTML = `<span class="toggle-dot"></span><span>${tr(STRINGS.iot[key], language)}</span>`;
      button.addEventListener("click", () => {
        const next = !button.classList.contains("is-active");
        button.classList.toggle("is-active", next);
        handlers.onToggle?.(key, next);
      });
      dom.toggleGrid.appendChild(button);
    });
  }

  function buildScenarios() {
    dom.scenarioRow.innerHTML = "";
    Object.keys(STRINGS.scenario).forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `chip ${key === "training" ? "is-active" : ""}`;
      button.dataset.scenario = key;
      button.textContent = tr(STRINGS.scenario[key], language);
      button.addEventListener("click", () => {
        dom.scenarioRow.querySelectorAll(".chip").forEach((chip) => chip.classList.toggle("is-active", chip === button));
        handlers.onScenario?.(key);
      });
      dom.scenarioRow.appendChild(button);
    });
  }

  /* ---------------- telemetry + gauges ---------------- */
  function buildTelemetryLabels() {
    dom.telemetry.innerHTML = Object.entries(STRINGS.telemetryLabels)
      .map(
        ([key, label]) => `
        <div class="telemetry-row" data-metric="${key}">
          <span class="telemetry-label">${tr(label, language)}</span>
          <span class="telemetry-bar"><i></i></span>
          <span class="telemetry-value">—</span>
        </div>`
      )
      .join("");
  }

  function buildGauges() {
    dom.gauges.innerHTML = ["pv", "load", "battery", "recycle", "tank", "co2"].map(
      (key) => `
      <div class="gauge" data-gauge="${key}">
        <span class="gauge-value">—</span>
        <span class="gauge-label">${key.toUpperCase()}</span>
        <span class="gauge-bar"><i></i></span>
      </div>`
    ).join("");
  }

  /* ---------------- event log ---------------- */
  function renderLog() {
    dom.log.innerHTML = logEntries
      .slice(-9)
      .map(
        (entry) => `
        <li class="log-line">
          <span class="log-time">${entry.time.toFixed(1)}s</span>
          <span class="log-text">${tr(entry.translations, language) || entry.text}</span>
        </li>`
      )
      .join("");
    dom.log.scrollTop = dom.log.scrollHeight;
  }

  /* ---------------- minimap (plan mode) ---------------- */
  function buildMinimap() {
    const scale = 1.55;
    const cx = 110;
    const cy = 78;
    const rect = (x, z, w, d, className, label) => {
      const px = cx + (x - w / 2) * scale;
      const py = cy + (z - d / 2) * scale;
      return `<rect class="${className}" x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${(w * scale).toFixed(1)}" height="${(d * scale).toFixed(1)}" rx="1">${
        label ? `<title>${label}</title>` : ""
      }</rect>`;
    };
    dom.minimap.innerHTML = `
      <g class="mm-ground">
        <circle cx="${cx}" cy="${cy}" r="66" />
      </g>
      ${rect(0, 0, HALL.width, HALL.length, "mm-hall")}
      ${rect(-(WING.innerX + WING.outerX) / 2, 0, WING.outerX - WING.innerX, WING.halfLength * 2, "mm-wing")}
      ${rect((WING.innerX + WING.outerX) / 2, 0, WING.outerX - WING.innerX, WING.halfLength * 2, "mm-wing")}
      ${rect(0, 0, COURT.length, COURT.width, "mm-court")}
      ${rect(0, 0, 2.2, 2.2, "mm-hoop")}
      ${rect(-10.4, 0, 3, 3, "mm-hoop")}
      ${rect(10.4, 0, 3, 3, "mm-hoop")}
      ${rect(0, HALL.length / 2 - 3.2, 17.6, 5.5, "mm-vip")}
      ${rect(0, -(HALL.length / 2 - 3.2), 17.6, 5.5, "mm-toc")}
      ${rect(SITE.pool.x, SITE.pool.z, SITE.pool.width, SITE.pool.depth, "mm-pool")}
      ${rect(52, -26, 17, 30, "mm-outdoor")}
      <circle id="mm-camera" class="mm-camera" cx="${cx}" cy="${cy}" r="3.4" />
      <line id="mm-camera-line" class="mm-camera-line" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy}" />
    `;
  }

  /* ---------------- interactions ---------------- */
  dom.playButton.addEventListener("click", () => {
    const playing = handlers.onPlay?.();
    updatePlayButton(playing);
  });
  el("restart-button").addEventListener("click", () => {
    handlers.onRestart?.();
    updatePlayButton(true);
  });
  dom.speedSelect.addEventListener("change", () => handlers.onSpeed?.(Number(dom.speedSelect.value)));
  el("capture-button").addEventListener("click", async () => {
    const url = await handlers.onCapture?.();
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `smart-complex-4k-${Date.now()}.png`;
    link.click();
    showToast(tr(STRINGS.captureDone, language));
  });
  dom.letterboxButton?.addEventListener("click", () => {
    letterboxOn = !letterboxOn;
    dom.letterboxButton.classList.toggle("is-active", letterboxOn);
    document.body.classList.toggle("no-letterbox", !letterboxOn);
    handlers.onLetterbox?.(letterboxOn);
  });
  dom.letterboxButton?.classList.add("is-active");

  dom.modeSwitch.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      dom.modeSwitch.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b === button));
      handlers.onMode?.(button.dataset.mode);
    });
  });

  dom.qualityRow.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      dom.qualityRow.querySelectorAll(".chip").forEach((b) => b.classList.toggle("is-active", b === button));
      handlers.onQuality?.(button.dataset.quality);
    });
  });

  document.querySelectorAll(".lang-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      applyLanguage(tab.dataset.lang);
      handlers.onLanguage?.(tab.dataset.lang);
    });
  });

  el("help-button").addEventListener("click", () => {
    dom.helpSheet.hidden = false;
  });
  el("help-close").addEventListener("click", () => {
    dom.helpSheet.hidden = true;
  });

  // scrub interaction
  let scrubbing = false;
  const scrubTo = (event) => {
    const rect = dom.scrub.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    handlers.onSeek?.(ratio * FILM_DURATION);
  };
  dom.scrub.addEventListener("pointerdown", (event) => {
    scrubbing = true;
    dom.scrub.setPointerCapture(event.pointerId);
    scrubTo(event);
  });
  dom.scrub.addEventListener("pointermove", (event) => {
    if (scrubbing) scrubTo(event);
  });
  dom.scrub.addEventListener("pointerup", (event) => {
    scrubbing = false;
    dom.scrub.releasePointerCapture?.(event.pointerId);
  });
  dom.scrub.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 5 : 1;
    if (event.key === "ArrowRight") handlers.onSeek?.(handlers.currentTime() + step);
    if (event.key === "ArrowLeft") handlers.onSeek?.(handlers.currentTime() - step);
    if (event.key === "Home") handlers.onSeek?.(0);
    if (event.key === "End") handlers.onSeek?.(FILM_DURATION);
  });

  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    switch (event.key) {
      case " ":
        event.preventDefault();
        updatePlayButton(handlers.onPlay?.());
        break;
      case "ArrowRight":
        handlers.onSeek?.(handlers.currentTime() + 1);
        break;
      case "ArrowLeft":
        handlers.onSeek?.(handlers.currentTime() - 1);
        break;
      case "1":
      case "2":
      case "3":
      case "4":
        handlers.onChapter?.(Number(event.key) - 1);
        break;
      case "c":
      case "C":
        setMode("cinematic");
        break;
      case "e":
      case "E":
        setMode("explore");
        break;
      case "p":
      case "P":
        setMode("plan");
        break;
      case "h":
      case "H":
        document.body.classList.toggle("hide-ui");
        break;
      default:
        break;
    }
  });

  function setMode(mode) {
    dom.modeSwitch.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
    });
    handlers.onMode?.(mode);
  }

  function updatePlayButton(playing) {
    dom.playButton.classList.toggle("is-playing", Boolean(playing));
  }

  function showToast(text) {
    if (!dom.toast) return;
    dom.toast.textContent = text;
    dom.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      dom.toast.hidden = true;
    }, 2600);
  }

  /* ---------------- per-frame update ---------------- */
  function update(state) {
    const { runtime, camera, mode } = state;
    const ratio = state.time / state.duration;
    dom.scrubFill.style.width = `${(ratio * 100).toFixed(2)}%`;
    dom.scrubHandle.style.left = `${(ratio * 100).toFixed(2)}%`;
    dom.bottomFill.style.width = `${(ratio * 100).toFixed(2)}%`;
    dom.scrub.setAttribute("aria-valuenow", state.time.toFixed(1));
    dom.timecode.textContent = format(state.time);
    dom.fps.textContent = `${Math.round(state.fps)} ${tr(STRINGS.fps, language)}`;

    const chapter = CHAPTERS[state.chapter];
    if (chapter) {
      const data = STRINGS.chapters[state.chapter];
      dom.chapterName.textContent = `${chapter.index + 1}/4 · ${tr(data.title, language)}`;
    }
    updatePlayButton(state.playing);

    dom.chapters.querySelectorAll(".chapter").forEach((node, index) => {
      node.classList.toggle("is-active", index === state.chapter);
    });

    // telemetry
    const avg = runtime.telemetryAverage;
    const metrics = {
      hr: `${Math.round(62 + avg * 108)} bpm`,
      speed: `${(avg * 7.1).toFixed(1)} m/s`,
      load: `${Math.round(avg * 100)} %`,
      hydration: `${Math.round(88 - avg * 12)} %`,
      sleep: `${Math.round(74 + avg * 14)}`,
    };
    Object.entries(metrics).forEach(([key, value]) => {
      const row = dom.telemetry.querySelector(`[data-metric="${key}"]`);
      if (!row) return;
      row.querySelector(".telemetry-value").textContent = value;
      row.querySelector(".telemetry-bar > i").style.width = `${Math.min(100, 20 + avg * 85)}%`;
    });

    // gauges
    const systems = runtime.systems;
    const gaugeValues = {
      pv: systems.energy.pv,
      load: systems.energy.load,
      battery: systems.energy.battery,
      recycle: systems.water.recycle,
      tank: systems.water.tank,
      co2: Math.min(1, systems.air.co2 / 1000),
    };
    Object.entries(gaugeValues).forEach(([key, value]) => {
      const node = dom.gauges.querySelector(`[data-gauge="${key}"]`);
      if (!node) return;
      const display =
        key === "co2"
          ? `${Math.round(systems.air.co2)} ppm`
          : key === "recycle"
            ? `${Math.round(value * 100)} %`
            : `${Math.round(value * 100)} %`;
      node.querySelector(".gauge-value").textContent = display;
      node.querySelector(".gauge-bar > i").style.width = `${Math.round(value * 100)}%`;
    });

    // log streaming
    if (runtime.log.length > logCursor) {
      const fresh = runtime.log.slice(logCursor);
      logCursor = runtime.log.length;
      fresh.forEach((entry) => logEntries.push(entry));
      renderLog();
    }

    // minimap camera marker
    if (dom.minimap) dom.minimap.hidden = mode !== "plan";
    if (mode === "plan" && camera) {
      const scale = 1.55;
      const cx = 110 + camera.position.x * scale;
      const cy = 78 + camera.position.z * scale;
      const marker = document.getElementById("mm-camera");
      const line = document.getElementById("mm-camera-line");
      if (marker) {
        marker.setAttribute("cx", Math.max(6, Math.min(214, cx)).toFixed(1));
        marker.setAttribute("cy", Math.max(6, Math.min(144, cy)).toFixed(1));
      }
      if (line) {
        line.setAttribute("x2", Math.max(6, Math.min(214, cx)).toFixed(1));
        line.setAttribute("y2", Math.max(6, Math.min(144, cy)).toFixed(1));
      }
    }

    document.body.classList.toggle("is-plan", mode === "plan");
  }

  function finishLoading() {
    if (dom.loading) {
      dom.loading.classList.add("is-done");
      setTimeout(() => dom.loading?.remove(), 900);
    }
  }

  buildMinimap();
  applyLanguage(language);
  return {
    update,
    setLanguage: applyLanguage,
    showToast,
    finishLoading,
    setMode,
    get language() {
      return language;
    },
    onError(message, error) {
      if (dom.loading) {
        dom.loading.innerHTML = `<div class="loading-inner"><p>${tr(message, language)}</p></div>`;
      }
      // eslint-disable-next-line no-console
      console.error(error);
    },
  };
}
