import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const outDir = new URL("../screenshots/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (err) => errors.push(String(err?.message || err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto("http://127.0.0.1:8080/?variant=A", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(800);

const body = await page.locator("body").innerText();
if (!/prototype/i.test(body) || !body.includes("Atlas")) {
  console.error("FAIL: Atlas variant did not render", body.slice(0, 400));
  process.exit(1);
}

await page.screenshot({ path: new URL("map-look-A.png", outDir).pathname });

await page.getByRole("button", { name: "Next variant" }).click();
await page.waitForTimeout(500);
const bodyB = await page.locator("body").innerText();
if (!bodyB.includes("Network")) {
  console.error("FAIL: Network variant did not render", bodyB.slice(0, 400));
  process.exit(1);
}
await page.screenshot({ path: new URL("map-look-B.png", outDir).pathname });

await page.getByRole("button", { name: "Next variant" }).click();
await page.waitForTimeout(700);
const bodyC = await page.locator("body").innerText();
if (!bodyC.includes("Megalopolis") || !bodyC.includes("Northeast zoom")) {
  console.error("FAIL: Megalopolis variant did not render", bodyC.slice(0, 400));
  process.exit(1);
}
await page.screenshot({ path: new URL("map-look-C.png", outDir).pathname });

await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(400);
const bodyBack = await page.locator("body").innerText();
if (!bodyBack.includes("Network")) {
  console.error("FAIL: arrow key did not cycle back to Network");
  process.exit(1);
}

await page.getByText("Chicago", { exact: true }).first().click({ force: true });
await page.waitForTimeout(400);
const afterTap = await page.locator("body").innerText();
if (!afterTap.includes("Place · Chicago")) {
  console.error("FAIL: tap did not select Chicago", afterTap.slice(0, 800));
  process.exit(1);
}

await page.screenshot({ path: new URL("map-look-B-tapped.png", outDir).pathname });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://127.0.0.1:8080/?variant=A", { waitUntil: "networkidle", timeout: 45000 });
await mobile.waitForTimeout(600);
await mobile.screenshot({ path: new URL("map-look-A-mobile.png", outDir).pathname });
await mobile.close();

console.log(JSON.stringify({ ok: true, errors, afterTap: afterTap.match(/Place ·[^\n]+|Residual ·[^\n]+/)?.[0] }, null, 2));
if (errors.length) process.exit(2);
await browser.close();
