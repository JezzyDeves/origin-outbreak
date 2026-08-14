import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8080/";
const outDir = "/workspace/screenshots";

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function shot(page, name) {
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: false });
}

const errors = [];
function attach(page) {
  page.on("pageerror", (e) => errors.push(`page:${e}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const t = msg.text();
    if (t.includes("get-session") || t.includes("Failed to load resource")) return;
    errors.push(`console:${t}`);
  });
}

async function clickHospital(page) {
  const loc = await page.evaluate(() => {
    const pin = document.querySelector('g[data-pin="hospital"] rect');
    if (!pin) return null;
    const r = pin.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, n: document.querySelectorAll('g[data-pin="hospital"]').length };
  });
  if (!loc || loc.n < 10) throw new Error(`hospitals missing: ${JSON.stringify(loc)}`);
  await page.mouse.click(loc.x, loc.y);
  return loc;
}

const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
attach(desktop);
await desktop.goto(url, { waitUntil: "networkidle" });
await desktop.waitForTimeout(600);
await shot(desktop, "home-desktop.png");

await desktop.getByRole("button", { name: "Build a custom disease" }).click();
await desktop.waitForTimeout(300);
await shot(desktop, "lab.png");
const labText = await desktop.locator("body").innerText();
if (!labText.includes("Pathogen")) throw new Error("lab did not render");

await desktop.getByRole("button", { name: "Set origin" }).click();
await desktop.waitForTimeout(500);
await shot(desktop, "seed.png");
const seedText = await desktop.locator("body").innerText();
if (!seedText.includes("Origin")) throw new Error("seed did not render");
if (!seedText.includes("hospitals")) throw new Error("seed missing hospital count");

const seedHosp = await clickHospital(desktop);
await desktop.waitForTimeout(400);
await shot(desktop, "seed-hospital.png");
const seedHospText = await desktop.locator("body").innerText();
if (!/beds|CMS|Emergency/i.test(seedHospText)) {
  throw new Error(`hospital detail missing after seed tap @${JSON.stringify(seedHosp)}\n${seedHospText.slice(0, 400)}`);
}

await desktop.getByRole("button", { name: "Begin outbreak" }).click();
await desktop.waitForTimeout(1400);
await shot(desktop, "sim-start.png");
const simText = await desktop.locator("body").innerText();
if (!simText.includes("Day")) throw new Error("sim did not render");

await desktop.getByRole("button", { name: "Hospitals" }).click();
await desktop.waitForTimeout(200);
await desktop.getByRole("button", { name: "Hospitals" }).click();
await desktop.waitForTimeout(200);

const simHosp = await clickHospital(desktop);
await desktop.waitForTimeout(500);
await shot(desktop, "sim-hospital.png");
const hospText = await desktop.locator("body").innerText();
if (!/Allocated patients|CMS overall|Emergency/i.test(hospText)) {
  throw new Error(`sim hospital sheet missing @${JSON.stringify(simHosp)}\n${hospText.slice(0, 500)}`);
}

await desktop.getByRole("button", { name: "Close panel" }).click();
await desktop.waitForTimeout(250);
await shot(desktop, "sim-running.png");

await desktop.getByRole("button", { name: "Curve" }).click();
await desktop.waitForTimeout(400);
await shot(desktop, "sim-chart.png");

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
attach(mobile);
await mobile.goto(url, { waitUntil: "networkidle" });
await mobile.waitForTimeout(500);
const overflow = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
await shot(mobile, "home-mobile.png");

await mobile.getByRole("button", { name: "Seasonal flu" }).click();
await mobile.waitForTimeout(500);
await shot(mobile, "seed-mobile.png");
await mobile.getByRole("button", { name: "Begin outbreak" }).click();
await mobile.waitForTimeout(1600);
await shot(mobile, "sim-mobile.png");
const mobileOverflow = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));

await browser.close();

const result = { ok: errors.length === 0, errors, overflow, mobileOverflow, seedHosp, simHosp };
console.log(JSON.stringify(result, null, 2));
if (overflow.scrollWidth > overflow.clientWidth + 2) {
  console.error("home mobile overflow", overflow);
  process.exit(1);
}
if (mobileOverflow.scrollWidth > mobileOverflow.clientWidth + 2) {
  console.error("sim mobile overflow", mobileOverflow);
  process.exit(1);
}
if (errors.length) process.exit(2);
