# Hoop Horizons Madagascar — deck, 3D complex & drawing sheet

Three deliverables in one repository, all built from a single dimension table:

| File | What it is |
| --- | --- |
| `index.html` + `app.js` + `styles.css` | The trilingual pitch deck (EN / FR / MG), 10 slides, hash-routed (`#slide-N`), present mode. |
| `complex.html` | The **Super Smart Sports Complex & Residence**: a real-time WebGL 3D model, a 35-second cinematic film, an interactive explorer and a live IoT dashboard. |
| `docs/floor-plan.svg` | A1-style general arrangement sheet — level-0 plan, level-1 dorm plan, long section A-A, schedule of areas, IoT legend, site context diagram and title block. |

Everything is served statically: no server-side code, no network calls, no build step required to *view* it (the bundle is committed).

---

## Quick start

```bash
npm install                 # three 0.169 · esbuild · puppeteer-core (dev only)
npm run build               # bundles src/ → assets/smart-complex.bundle.js
npm run serve               # static server on http://localhost:8080
npm run verify              # headless smoke test of complex.html
```

* Open `http://localhost:8080/index.html` for the deck (it links to the 3D model from the top bar).
* Open `http://localhost:8080/complex.html` for the model.
* Rebuild the drawing sheet at any time with `node tools/build-plan-svg.mjs` → `docs/floor-plan.svg`.

> `npm run verify` needs a Chromium. It uses `CHROME_PATH` when set, otherwise Puppeteer's own
> download. The `serve` script binds `0.0.0.0:8080`, so the same URL works from a phone on the
> LAN or from a sandbox preview proxy.

---

## `complex.html` — the 3D sports complex

### What is in the scene

A 34 × 46 m hall with a 14 m clear height, flanked by two mirrored 18 × 32 m residential wings on
three levels, inside a 420 × 420 m landscaped site. The scene is built from primitives at load
time (no external assets): ~1 700 meshes, 42 instanced groups, 34 lights.

| Zone (13) | Contents |
| --- | --- |
| Glass facade & smart entrance | Electrochromic curtain wall, proximity entry, adaptive LED paving |
| IoT basketball court | FIBA 28 × 15 m resin court, kinetic LED floor (2 048 pressure cells, 1.4 mm pitch), painted markings, sensor grid |
| Robotic tracking gantry | Two overhead gantry rails, 6 × 240 fps pose cameras, travelling carriage |
| Suspended holographic scoreboard | Four-sided holo cube on cables above the court |
| Link corridors & proximity doors | Two glazed bridges (3 m × 3.75 m) between hall and wings, 4 automated door pairs at 0.4 s |
| Dormitory wing — Team Alpha | 13 smart pods with biometric sleep tracking, PDLC privacy partitions, lockers, gym, wet zone |
| Dormitory wing — Team Beta | Mirror image of Alpha (accent colour swap: cyan ⇄ amber) |
| Showers, sanitary & cryotherapy | 12 showers, 6 touchless smart mirrors, 2 cryo pods at −110 °C, 68 % water recycling |
| Tactical operations centre | Mezzanine war room (+5.40), 9 m curved holographic wall, 8 coach workstations, live telemetry |
| VIP & guest lounge deck | 17.6 × 5.8 m mezzanine deck above the court, 48 guests, switchable electrochromic glass |
| Study hall & team lounge | Level-2 study level (+7.60), 90 school minutes per day per athlete |
| Roof, PV array & skylights | 1 850 m² PV array, 380 kWp, skylight bands, plant deck |
| Landscape & smart lighting | 310 trees, 1.2 km jogging loop, 180 adaptive light poles, reflecting pool, outdoor court |

### Modes, chapters and the film

Three modes (`setMode`):

| Mode | Behaviour |
| --- | --- |
| **Cinematic** | The camera flies the scripted film; the timeline scrubs 0:00 → 0:35. |
| **Explore** | Orbit/pan/zoom with the mouse; clicking a zone in the browser flies to a framing for that zone. |
| **Floor plan** | 3D cutaway — roof, upper pods and glass are hidden so the layout reads like the drawing sheet; the 2D minimap appears. |

The film is one continuous spline sequence, cut into 4 chapters exactly on the brief:

| Chapter | Time | Shot |
| --- | --- | --- |
| 1 · Drone descent | 0:00 – 0:05 | Aerial fly-through (104, 78, 132) descending to the entrance canopy, glass facade and smart landscape lighting |
| 2 · Court awakening | 0:05 – 0:15 | Pan across the court as the LED floor activates, the retractable hoops lower and biometric data starts pulsing |
| 3 · Residence & recovery | 0:15 – 0:25 | Through the link corridor into the symmetrical dorm pods, then the shower / cryotherapy wet zone |
| 4 · VIP & command | 0:25 – 0:35 | Ascent into the tactical operations centre, cross-court sweep, finale on the VIP deck with the electrochromic glazing cleared |

The film drives both the camera and the lighting: scenario, LED activation, hoop deployment,
gantry activity, pod privacy and VIP glass are all keyed off the film time, so the render state is
deterministic for any given `t`.

### Controls

| Input | Action |
| --- | --- |
| `Space` | Play / pause the film |
| `←` `→` | Scrub ∓1 s (the focusable timeline bar scrubs 1 s, `Shift` + arrow 5 s) |
| `1` `2` `3` `4` | Jump to a chapter |
| `C` / `E` / `P` | Cinematic / Explore / Floor-plan mode |
| `H` | Hide the interface (letterbox stays) |
| Mouse drag / wheel | Orbit and zoom (Explore and Floor-plan modes) |
| Click a zone | Fly to that zone, then hand control back |
| `?` (help button) | Shortcut sheet |

HUD buttons: mode switch, play, restart, speed (0.5× / 1× / 1.5× / 2×), 4K capture, letterbox toggle,
language switch (EN / FR / MG), quality selector, scenario presets, the 9 IoT toggles, the zone
browser, telemetry, system gauges, event log and the floor-plan minimap.

### The 9 IoT toggles

Each toggle rewires the live model, not just the HUD. Switching one off animates the relevant
system down (the LED floor drops to 12 % brightness, the hoops stay stowed, the gantry parks, the
electrochromic glass clears) and writes an entry into the event log.

| Toggle | Effect |
| --- | --- |
| Kinetic LED floor | Floor emissive lines, patterns and court glow |
| Pressure-sensor grid | Per-cell heat map that follows the players |
| Proximity doors | Automatic sliding doors on the bridges and entrance |
| Ambient scene lighting | Scenario lighting rig (training / game night / recovery) |
| Holographic interfaces | Court holo-cube, tactical wall, VIP panels |
| Data streams | Animated telemetry streams between sensors, servers and dashboards |
| Motion-tracking gantry | Gantry carriage travel and camera tracking cones |
| Electrochromic glazing | PDLC / electrochromic privacy state of pods and VIP deck |
| Water-recycling loop | Shower recovery loop (68 %) and recycling animation |

### Live telemetry (5 rows) and systems gauges

Heart rate, speed, load, hydration and sleep score for 24 player uplinks, plus gauges for PV
production (380 kWp), grid draw, battery state and building load — driven by the scenario
(training / game night / recovery) and by the film timeline, and by `runtime.biometricPulse`
during play.

### Quality tiers

| Tier | Pixel ratio | Shadows | Bloom | SMAA | Anisotropy | Trees |
| --- | --- | --- | --- | --- | --- | --- |
| Performance (`low`) | 0.85 | off | 0.22 | off | 2 | 60 |
| Balanced (`medium`) | 1 | off | 0.32 | off | 4 | 90 |
| High (`high`, default) | ≤1.5 | on | 0.42 | on | 8 | 120 |
| Ultra (`ultra`) | ≤2 | on | 0.5 | on | 16 | 150 |

Force a tier for a capture with `window.__quality = "ultra"` **before** the page loads (an
`evaluateOnNewDocument` hook), or switch at runtime from the quality row.

### Public API (console / tooling)

```js
const app = window.__smartComplex;         // { zones, director, runtime, api, ui, ... }
app.api.setMode("plan");                   // cinematic | explore | plan
app.api.jumpToChapter(3);                  // seek to a chapter and play
app.api.focusZone("warroom");              // fly to a zone preset
app.api.setScenario("game");               // training | game | recovery
app.api.setQuality("high");
app.runtime.toggles.ledFloor = false;      // any of the 9 IoT toggles
app.director.speed = 1.5;                  // 0.5 | 1 | 1.5 | 2
app.api.step(1 / 60);                      // advance + render exactly one frame
app.api.probe(0, -0.8);                    // raycast diagnostic: what is under this pixel?
app.api.tuning;                            // renderer, sun, hemi, ambient, bloom, materials…
window.__three;                            // THREE, for experiments from the console
await app.api.capture();                   // 4K PNG data URL of the current frame
```

`step()` plus `probe()` are what the screenshot/verification tooling uses: render a fixed number
of frames after a `seek`, then read the canvas. `src/index.js` also exposes short aliases for
presenters: `smartComplex.play(t)`, `.pause()`, `.mode()`, `.zone()`, `.scenario()`,
`.quality()`, `.language("fr")`.

### Languages and layout

The whole HUD is trilingual (EN / FR / MG, `src/i18n.js`, switchable at runtime). The page ships a no-letterbox state for embedding, a `hide-ui` state for clean captures
and a plan-mode state; `[hidden]` is honoured so the minimap only appears in floor-plan mode.

---

## `docs/floor-plan.svg` — the drawing sheet

`node tools/build-plan-svg.mjs` imports `src/plan.js` and emits the complete 1 584 × 1 160 sheet,
so the drawing can never drift from the model:

* **Level-0 general arrangement** (1:250) — hall envelope, FIBA court and markings, four-row
  tribunes, ghosted +5.40 mezzanine footprints (TOC and VIP), player tunnel, gantry rails,
  scoreboard, the two wings with locker / kit, gym, wet zone and corridor, the link bridges with
  their proximity doors, entrance apron, canopy and steps.
* **Level-1 dorm plan** — the two wings with the 13 pods per wing, corridor and study level tag.
* **Long section A-A** — roof, skylight, mezzanines, tribunes, canopy, gantry rails, scoreboard,
  retractable hoop and the ±0.00 / +5.40 / +14.00 datum chain.
* **Schedule of areas & systems** — site, hall, court, wings, wet zone, TOC, VIP deck and bridges.
* **Legend, render & systems notes, site context diagram, north arrow, dimensions and title block.**

The generator escapes text entities itself (raw `&` in a `<title>` produces an XML parse error and
a blank page in Chromium), so validate after any edit:

```bash
node tools/build-plan-svg.mjs
python3 -c "import xml.dom.minidom; xml.dom.minidom.parse('docs/floor-plan.svg')"
```

---

## Verification

```bash
npm run build
npm run serve &                                     # or any static server on :8080
CHROME_PATH=/path/to/chrome node tools/verify-scene.mjs
```

`tools/verify-scene.mjs` boots `complex.html` headless, asserts WebGL 2 is up, then checks the
scene registers ≥13 zones with a matching zone browser, exactly 9 IoT toggles, 4 chapters,
5 telemetry rows, >800 meshes, >12 lights, that the film is 35 s long and that jumping to every
chapter produces **no console errors or warnings**. Current output:

```
scene ok · meshes 1699 · instanced 42 · lights 34 · zones 13 · film 35s · event log 0 lines
verify-scene: all checks passed
```

---

## Source layout

```
index.html              deck shell (top bar links to complex.html)
app.js, styles.css      deck: slides, routing, present mode, trilingual copy
complex.html            3D viewer page: canvas #scene + the whole HUD
assets/complex.css      HUD theme: cinema bars, glass panels, toggles, gauges, minimap
assets/smart-complex.bundle.js   built bundle (committed) — do not edit by hand
src/index.js            bundle entry
src/main.js             renderer, camera, lighting, quality tiers, modes, public api
src/plan.js             single source of truth for every dimension (SITE, HALL, COURT, WING…)
src/cinematic.js        the 35 s film: shots, splines, chapters, director (seek/play/tween)
src/iot.js              IoT model: scenarios, toggles, 24 player uplinks, event log
src/ui.js               HUD controller (dom, chapters, toggles, telemetry, minimap)
src/i18n.js             EN / FR / MG strings
src/lib/util.js         small helpers (math, rng, shapes, glow sprites)
src/lib/materials.js    material library: glass, steel, resin, LED, holo, fabrics
src/lib/holo.js         holographic UI sprites (canvas textures) + frame registry
src/lib/players.js      athlete rigs + biometric-ish animation and telemetry
src/zones/court.js      court, LED floor, sensor grid, hoops, scoreboard, gantry, data viz
src/zones/shell.js      envelope, tribunes, mezzanines, roof, PV, skylights
src/zones/wings.js      mirrored dorm wings: pods, storage, study level, gym, wet zone
src/zones/rooms.js      TOC/control room, VIP lounge, staff rooms, furniture
src/zones/landscape.js  terrain, trees, paths, pool, outdoor court, light poles
tools/verify-scene.mjs  headless smoke test
tools/build-plan-svg.mjs  drawing-sheet generator
docs/floor-plan.svg     generated sheet
Hoop-Horizons-Madagascar-Trilingual-Deck.md   narrative / copy source for the deck
```

### Build notes

* The bundle is committed so `complex.html` works from a plain static host with no toolchain.
  Run `npm run build` after *any* `src/` change, or `npm run watch` while iterating.
* `three` is a **dev** dependency only: esbuild inlines it into the bundle.
* Tuning the look is safe through `app.api.tuning` (sun, hemisphere, ambient, interior fill,
  bloom, materials, exposure) — the values that matter live in `src/main.js` and
  `src/lib/materials.js`.

## License

ISC — see `LICENSE`.
