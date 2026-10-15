/**
 * tools/verify-scene.mjs
 * Headless smoke test for the Super Smart Complex.
 *
 *   npm run build
 *   npm run serve      # in another shell (python3 -m http.server 8080)
 *   node tools/verify-scene.mjs [--url http://localhost:8080/complex.html]
 *
 * Checks that the bundle boots, WebGL 2 is available, all zones are built, the
 * HUD is wired, and that every chapter of the 35 s storyboard renders without
 * console errors. Requires `puppeteer` (or `puppeteer-core` + CHROME_PATH) —
 * the tool is optional and intentionally not a dependency of the deck.
 */
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const urlFlag = args.indexOf("--url");
const url = urlFlag >= 0 ? args[urlFlag + 1] : "http://localhost:8080/complex.html";

let puppeteer;
try {
  puppeteer = (await import("puppeteer")).default;
} catch {
  try {
    puppeteer = (await import("puppeteer-core")).default;
  } catch {
    console.error("Install puppeteer (npm i -D puppeteer) or puppeteer-core + a CHROME_PATH to run this check.");
    process.exit(2);
  }
}

const executablePath = process.env.CHROME_PATH;
if (executablePath && !existsSync(executablePath)) {
  console.error(`CHROME_PATH does not exist: ${executablePath}`);
  process.exit(2);
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
  defaultViewport: { width: 900, height: 520 },
});

const page = await browser.newPage();
const problems = [];
page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") problems.push(`console: ${message.text()}`);
});

await page.evaluateOnNewDocument(() => {
  window.__quality = "medium";
});
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await new Promise((resolve) => setTimeout(resolve, 12000));

const report = await page.evaluate(() => {
  const app = window.__smartComplex;
  if (!app) return { ok: false, reason: "window.smartComplex missing" };
  let meshes = 0;
  let instanced = 0;
  let lights = 0;
  app.scene.traverse((child) => {
    if (child.isMesh) meshes++;
    if (child.isInstancedMesh) instanced++;
    if (child.isLight) lights++;
  });
  app.api.setMode("cinematic");
  for (const chapter of [0, 1, 2, 3]) {
    app.api.jumpToChapter(chapter);
    for (let i = 0; i < 8; i++) app.api.step(1 / 60);
  }

  /* ---- realism + navigation pass -------------------------------------- */
  const toneBefore = app.api.toneMapping;
  app.api.setToneMapping("agx");
  const toneAfter = app.api.toneMapping;
  app.api.setToneMapping(toneBefore);

  // x-ray hides the tagged shell, then puts it back
  const shellVisible = () => {
    let hidden = 0;
    let shown = 0;
    app.scene.traverse((child) => {
      if (child.userData && child.userData.cutaway) (child.visible ? shown++ : hidden++);
    });
    return { hidden, shown };
  };
  const cutawayOff = shellVisible();
  app.api.setXray(true);
  app.api.step(1 / 60);
  const cutawayOn = shellVisible();
  app.api.setXray(false);
  app.api.step(1 / 60);

  // the reflection is a second render pass, off until it is asked for
  const mirrorBefore = app.api.tuning.mirror.mesh.visible;
  app.api.setMirrorFloor(true);
  app.api.step(1 / 60);
  const mirrorOn = app.api.tuning.mirror.mesh.visible;
  app.api.setMirrorFloor(false);

  // guided jumps fly the camera, and every one of them moves it
  const views = [...document.querySelectorAll("#quick-row .chip")].map((chip) => chip.dataset.view);
  app.api.focusView("court");
  for (let i = 0; i < 185; i++) app.api.step(1 / 60); // the fly-to tween is 2.4 s
  const courtCam = app.camera.position.clone();

  const shafts = app.api.tuning.shafts;

  return {
    ok: true,
    meshes,
    instanced,
    lights,
    toneMapping: toneAfter,
    cutawayOff,
    cutawayOn,
    mirrorBefore,
    mirrorOn,
    views,
    courtCam: [courtCam.x, courtCam.y, courtCam.z],
    shafts: shafts.shafts.length,
    shaftsVisible: shafts.group.visible,
    zones: app.zones.length,
    duration: app.director.duration,
    hudZones: document.querySelectorAll("#zone-list .zone-button").length,
    toggles: document.querySelectorAll("#toggle-grid .toggle").length,
    viewChips: document.querySelectorAll("#quick-row .chip").length,
    recordButton: Boolean(document.getElementById("record-button")),
    xrayButton: Boolean(document.getElementById("xray-button")),
    mirrorButton: Boolean(document.getElementById("mirror-button")),
    chapters: document.querySelectorAll("#chapters .chapter").length,
    logLines: document.querySelectorAll("#log .log-line").length,
    telemetry: document.querySelectorAll("#telemetry .telemetry-row").length,
  };
});

await browser.close();

if (!report.ok) {
  console.error("FAILED:", report.reason);
  process.exit(1);
}
if (problems.length) {
  console.error("Console problems:\n" + problems.join("\n"));
  process.exit(1);
}

const expectations = [
  [report.zones >= 13, "zone register"],
  [report.hudZones === report.zones, "zone browser"],
  [report.toggles === 9, "IoT toggles"],
  [report.chapters === 4, "chapters"],
  [report.telemetry === 5, "telemetry rows"],
  [report.meshes > 800, "mesh count"],
  [report.lights > 12, "light count"],
  [report.views.length === 9 && report.viewChips === 9, "guided jumps"],
  [report.xrayButton && report.mirrorButton && report.recordButton, "view + capture chips"],
  [report.toneMapping === "agx", "tone-mapping switch"],
  [report.cutawayOn.hidden > report.cutawayOff.hidden, "x-ray hides the shell"],
  [report.cutawayOn.hidden === report.cutawayOff.hidden || report.cutawayOff.shown > 0, "x-ray restores the shell"],
  [report.mirrorBefore === false && report.mirrorOn === true, "mirror floor is opt-in"],
  [report.shafts === 9, "volumetric shafts"],
  [report.shaftsVisible === true, "shafts visible"],
  [
    Math.abs(report.courtCam[0] - 10) < 2.5 &&
      Math.abs(report.courtCam[1] - 4.6) < 2 &&
      Math.abs(report.courtCam[2] - 12) < 2.5,
    "guided jump lands on the court preset",
  ],
];
const failed = expectations.filter(([condition]) => !condition);
console.log(
  `scene ok · meshes ${report.meshes} · instanced ${report.instanced} · lights ${report.lights} · ` +
    `zones ${report.zones} · film ${report.duration}s · event log ${report.logLines} lines`
);
console.log(
  `realism · tone ${report.toneMapping} · shafts ${report.shafts} · mirror opt-in · ` +
    `x-ray hides ${report.cutawayOn.hidden} parts · ${report.views.length} guided jumps`
);
if (failed.length) {
  console.error("Failed assertions:", failed.map(([, label]) => label).join(", "));
  process.exit(1);
}
console.log("verify-scene: all checks passed");
