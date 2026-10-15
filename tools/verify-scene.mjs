/**
 * tools/verify-scene.mjs
 * Headless smoke test for the Super Smart Complex.
 *
 *   npm run build
 *   npm run serve      # in another shell (python3 -m http.server 8000)
 *   node tools/verify-scene.mjs [--url http://localhost:8000/complex.html]
 *
 * Checks that the bundle boots, WebGL 2 is available, all zones are built, the
 * HUD is wired, and that every chapter of the 35 s storyboard renders without
 * console errors. Requires `puppeteer` (or `puppeteer-core` + CHROME_PATH) —
 * the tool is optional and intentionally not a dependency of the deck.
 */
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const urlFlag = args.indexOf("--url");
const url = urlFlag >= 0 ? args[urlFlag + 1] : "http://localhost:8000/complex.html";

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
  return {
    ok: true,
    meshes,
    instanced,
    lights,
    zones: app.zones.length,
    duration: app.director.duration,
    hudZones: document.querySelectorAll("#zone-list .zone-button").length,
    toggles: document.querySelectorAll("#toggle-grid .toggle").length,
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
];
const failed = expectations.filter(([condition]) => !condition);
console.log(
  `scene ok · meshes ${report.meshes} · instanced ${report.instanced} · lights ${report.lights} · ` +
    `zones ${report.zones} · film ${report.duration}s · event log ${report.logLines} lines`
);
if (failed.length) {
  console.error("Failed assertions:", failed.map(([, label]) => label).join(", "));
  process.exit(1);
}
console.log("verify-scene: all checks passed");
