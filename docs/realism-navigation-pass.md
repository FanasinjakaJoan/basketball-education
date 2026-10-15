# Realism & navigation pass — what changed, and what the brief asked for

Audit of the *Super Smart Sports Complex & Residence* against the visualisation brief, and the
work done in this pass. Everything here is committed to `src/` and rebuilt into
`assets/smart-complex.bundle.js`; nothing in the model was rebuilt from scratch.

---

## 1 · Already in the model (audited, untouched)

| Brief | Where it lives |
| --- | --- |
| FIBA court, 2 048-cell kinetic LED floor, painted markings | `src/zones/court.js` — custom LED shader with pressure grid, game / training / recovery palettes |
| Retractable hoops on ceiling carriages | `src/zones/court.js` — `createHoop()` |
| Robotic tracking gantry, 6 × 240 fps pose cameras, travelling carriage | `src/zones/court.js` — `createGantry()` |
| Suspended four-sided holographic scoreboard | `src/zones/court.js` — `createScoreboard()`, live scores, shot clock |
| Two mirrored dorm wings, smart pods, biometric sleep tracking, PDLC partitions, RFID lockers | `src/zones/wings.js` + `src/lib/holo.js` — 13 pods per wing per level, `createSmartSurface` canvases |
| Chromotherapy wet zone, touchless smart mirrors, water recycling, cryo pods | `src/zones/wings.js` — 6 stalls, hue-cycling glow planes, mirror HUDs, 68 % recycling loop |
| North mezzanine tactical operations centre: curved holo wall, 8 workstations, briefing room | `src/zones/rooms.js` — `buildWarRoom()` |
| South mezzanine VIP deck: electrochromic partitions, hospitality bar, biometric entry | `src/zones/rooms.js` — `buildVipLounge()` |
| 35-second film in four moves (descent → court → wings → finale) | `src/cinematic.js` — 4 shots, 4 chapter boundaries at 5 / 15 / 25 / 35 s, each its own spline |
| Cinematic · Orbit · Plan modes, timeline scrubber, play/pause, speed, EN/FR/MG HUD, Training/Game/Recovery palettes, 4 K still | `complex.html`, `src/ui.js`, `src/index.js` |
| Matte black steel, brushed aluminium, polished resin, maple/teak, textured fabrics | `src/lib/materials.js` |
| PCF soft shadows at 2048², dusk sky dome, ACES-ready post chain | `src/main.js` |

## 2 · Added in this pass

| Brief | Implementation |
| --- | --- |
| **10 stylized player capsules with ground emissive ring markers** | Was 8. `src/lib/players.js` now defines 10 drill routines (five per team, matching the 10-slot sensor field and LED uniform array): added a perimeter defender closeout and a second baseline shuttle. Every athlete carries its own additive ring marker. |
| **Ice baths** alongside the cryo pods | `src/zones/wings.js` — two 4 °C plunge tubs per wing against the glazed facade: insulated shell, liner, glossy water surface that breathes, 12 instanced floating ice cubes, drifting cold vapour, step, grab rails and a live `4.0 °C · COLD PLUNGE · 3 MIN` readout. |
| **Hoops stored at y = 10.2, deployed at y = 3.05** | `src/zones/court.js` now expresses this once: `STOW_Y = 10.2`, `DEPLOY_Y = rimHeight + 0.34 − tube radius`, so the *top of the rim* lands on the FIBA 3.05 m line. Previously the deployed carriage sat 0.18 m high. |
| **FogExp2 for depth** | `src/main.js` — density 0.0021 replaces the linear `Fog(150, 900)`. |
| **Warm sun ≈ 2.2, cool blue hemisphere ≈ 0.35** | `src/main.js` — sun `0xffc98a` at 2.2, hemisphere at 0.35, still keyed to the quality tier and modulated with time. |
| **Volumetric light shafts — roof skylights and the entrance portal** | New `src/lib/volumetrics.js`: one additive box beam per structural skylight (positions read straight off the roof geometry, so they can never drift), a raking sun beam through the sunlit glazed end, a soft sky bounce at the shaded end, and the entrance portal volume. One shader, nine beams, animated motes, global intensity gain. |
| **Polished resin flooring with realistic reflections** | New `src/lib/mirror.js` — `ResinMirror`: three.js `Reflector` maths (oblique clip plane, projected lookup) rewritten as a fresnel-weighted, micro-rippled *blend* so the LED floor stays readable under the reflection. The mirror pass is restricted to one layer containing only the court furniture and athletes (461 meshes), not the whole complex. Off by default. |
| **Bloom 0.55 / radius 0.5 / threshold 0.85, OutputPass, SMAA** | `src/main.js` — bloom re-tuned per tier (0.28 / 0.4 / 0.55 / 0.62 at those radius and threshold values), and **SMAA moved after `OutputPass`** so edges are anti-aliased on the resolved image instead of in linear HDR. |
| **Smart frosted glass at opacity 0.16, double-sided, no depth write** | `src/lib/materials.js` — `frostedGlassClear` set to the brief's numbers; shower and stall partitions keep their heavier frost so privacy still reads. |
| **X-ray toggle in the HUD** | `src/main.js` + `complex.html` — the cutaway set (roof, envelope, ceilings, upper pods) is no longer welded to plan mode: `X` or the chip toggles it from any mode, and the landscape labels come back when it is off (they previously stayed hidden). |
| **Record button** | `src/main.js` + `src/ui.js` — `MediaRecorder` on `canvas.captureStream(60)` → VP9/VP8 WebM download at 24 Mbit/s, with a pulsing REC indicator and elapsed time in the HUD footer; `R` or the chip starts and stops it. |
| **Guided jumps** | `src/plan.js` — `QUICK_VIEWS`: court, Alpha, Beta, showers, cryotherapy, command, VIP, exterior, entrance. Seven reuse the zone presets; the wet zone is split into two so the showers and the plunge/cryo corner get their own framing. Nine chips in the HUD, all translated. |
| Tone-mapping escape hatch | `?tone=aces\|agx\|neutral`, `?exposure=…`, `smartComplex.tone("agx")`, `api.setToneMapping(key, exposure)`. |

## 3 · Deliberate deviations from the brief

1. **Point and spot intensities are not 80–400 cd.** The scene is not authored in photometric
   units: the sun is a three.js `DirectionalLight` at 2.2 and the interior accents run 3–34 with
   quadratic decay and per-light cut-off distances under AgX/ACES exposure. Dropping 80–400 cd
   into that rig would overexpose the hall by roughly an order of magnitude. This is a global
   re-grade (lights *and* exposure together) and needs a real GPU under the eye — say the word and
   I will do it as a separate, reviewable step.
2. **The entrance portal is at z = −23, not +17.5.** That is where this model's curtain wall,
   canopy, LED paving and automated doors are, and where the film's 0:05 key passes them at
   (1.5, 3.4, −19.5). The +23 facade is the player tunnel, which is the end the low sun actually
   reaches. The beams follow the model's own coordinates.
3. **Beam tilt is art-directed.** The sun sits at ~23° elevation; a physically exact beam from a
   skylight would land 30 m away from the opening that produced it. The shafts are tilted 0.32
   (skylights) and 0.82 (the sunlit end) of the way onto the true sun vector — the usual archviz
   compromise, and it keeps the beams over the court.
4. **The mirror is opt-in.** It is a second render pass; leaving it on by default would cost every
   visitor frames for an effect most of the film does not need.
5. **Plan mode stays perspective.** It is a high, near-vertical framing with the cutaway on, plus
   the 2D minimap — the brief's "orthographic-style" read, without swapping the camera out from
   under the composer and the cinematic director.

## 4 · How to review

```bash
npm run build && npm run verify:modules   # structural checks: no browser needed
npm run serve                             # http://localhost:8080/complex.html
CHROME_PATH=… node tools/verify-scene.mjs # headless Chromium pass
```

* Compare tone mapping live: `complex.html?tone=aces` (default, per the brief) against
  `complex.html?tone=agx` (the previous, softer pipeline) and `?tone=neutral`.
* Flip **Mirror floor** on while looking down the court from the far end: the reflection is
  strongest at grazing angles and disappears underfoot.
* Flip **X-ray shell** on in any mode, or press `X`, to read the plan without leaving the film.
* The nine **guided jumps** land on the viewpoints the brief names.
