/**
 * tools/capture-stills.mjs
 * Optional headless capture pass for the Super Smart Complex — writes the stills
 * that live in `docs/stills/`.
 *
 *   npm run serve      # in another shell (python3 -m http.server 8000)
 *   CHROME_PATH=/path/to/chrome node tools/capture-stills.mjs
 *   node tools/capture-stills.mjs --url http://localhost:8000/complex.html --out docs/stills
 *
 * Flags
 *   --url   page to open                       (default http://localhost:8000/complex.html)
 *   --out   output directory                   (default docs/stills)
 *   --w / --h  viewport size                   (default 1280 × 720)
 *   --quality  render quality preset           (default medium — software GL is slow)
 *
 * The capture is deterministic: each still seeks the film to a fixed timecode, renders six
 * fixed frames and screenshots. With SwiftShader this takes a couple of minutes per still,
 * so keep the shot list short. Chrome itself is not vendored here — point CHROME_PATH at any
 * recent Chrome/Chromium, or install `puppeteer` (which downloads one).
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const readFlag = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

const url = readFlag("url", "http://localhost:8000/complex.html");
const out = resolve(readFlag("out", "docs/stills"));
const width = Number(readFlag("w", "1280"));
const height = Number(readFlag("h", "720"));
const quality = readFlag("quality", "medium");

/** Film timecode → still. Times line up with the four chapters of the 35 s storyboard. */
const SHOTS = [
  [0.5, "01-drone-approach"],
  [8.0, "02-court-awakening"],
  [19.0, "03-dorm-pods"],
  [27.5, "04-tactical-ops"],
  [32.5, "05-vip-finale"],
];
const PLAN_SHOT = "06-floorplan-mode";

let puppeteer;
try {
  puppeteer = (await import("puppeteer")).default;
} catch {
  try {
    puppeteer = (await import("puppeteer-core")).default;
  } catch {
    console.error("Install puppeteer (npm i -D puppeteer) or puppeteer-core + a CHROME_PATH to run this tool.");
    process.exit(2);
  }
}

const executablePath = process.env.CHROME_PATH;
if (executablePath && !existsSync(executablePath)) {
  console.error(`CHROME_PATH does not exist: ${executablePath}`);
  process.exit(2);
}

mkdirSync(out, { recursive: true });

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
  defaultViewport: { width, height },
});

const page = await browser.newPage();
const problems = [];
page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") problems.push(`console: ${message.text()}`);
});
await page.evaluateOnNewDocument((preset) => {
  window.__quality = preset;
}, quality);

await page.goto(url, { waitUntil: "load", timeout: 180000 });
await new Promise((done) => setTimeout(done, 12000));

const seek = (time) =>
  page.evaluate((target) => {
    const api = window.__smartComplex.api;
    api.setMode("cinematic");
    api.director.seek(target);
    for (let i = 0; i < 6; i += 1) api.step(1 / 60);
  }, time);

for (const [time, name] of SHOTS) {
  await seek(time);
  await new Promise((done) => setTimeout(done, 4000));
  const file = `${out}/${name}.png`;
  await page.screenshot({ path: file });
  console.log(`· ${file}  (film ${time.toFixed(1)}s)`);
}

await page.evaluate(() => window.__smartComplex.api.setMode("plan"));
await new Promise((done) => setTimeout(done, 3000));
await page.screenshot({ path: `${out}/${PLAN_SHOT}.png` });
console.log(`· ${out}/${PLAN_SHOT}.png  (floor-plan cutaway)`);

await browser.close();

console.log(`\n${SHOTS.length + 1} stills → ${dirname(`${out}/x`)}`);
if (problems.length) {
  console.error("Console problems:\n" + problems.join("\n"));
  process.exit(1);
}
