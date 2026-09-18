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

const bodyA = await page.locator("body").innerText();
if (!/Convoy/.test(bodyA) || !/Skip week/.test(bodyA) || !/1:1/.test(bodyA)) {
  console.error("FAIL: Convoy variant did not render", bodyA.slice(0, 500));
  process.exit(1);
}
if (!/Day 38/.test(bodyA)) {
  console.error("FAIL: Clock did not start on canned day 38", bodyA.slice(0, 500));
  process.exit(1);
}

await page.getByRole("button", { name: "Skip week" }).click();
await page.waitForTimeout(400);
const afterSkip = await page.locator("body").innerText();
if (!/Day 45/.test(afterSkip)) {
  console.error("FAIL: Skip week did not jump 7 calendar days", afterSkip.slice(0, 800));
  process.exit(1);
}

await page.getByRole("button", { name: "Pause" }).click();
const pausedDay = (await page.locator("body").innerText()).match(/Day (\d+)/)?.[1];
await page.waitForTimeout(1500);
const stillPaused = (await page.locator("body").innerText()).match(/Day (\d+)/)?.[1];
if (pausedDay !== stillPaused) {
  console.error("FAIL: Pause did not freeze the Clock", { pausedDay, stillPaused });
  process.exit(1);
}

await page.getByRole("button", { name: "Advance one Sim step" }).click();
await page.waitForTimeout(200);
const afterStep = await page.locator("body").innerText();
if (!new RegExp(`Day ${Number(pausedDay) + 1}`).test(afterStep)) {
  console.error("FAIL: Step did not advance one Sim step", afterStep.slice(0, 600));
  process.exit(1);
}

await page.getByRole("button", { name: "Play" }).click();
await page.getByText("1 d/s", { exact: true }).click();
await page.waitForTimeout(1400);
const afterDayRate = await page.locator("body").innerText();
const dayAfter = Number(afterDayRate.match(/Day (\d+)/)?.[1]);
if (!(dayAfter >= Number(pausedDay) + 2)) {
  console.error("FAIL: 1 day/sec did not advance the calendar", afterDayRate.slice(0, 600));
  process.exit(1);
}

await page.screenshot({ path: new URL("clock-move-A.png", outDir).pathname });

await page.getByRole("button", { name: "Next variant" }).click();
await page.waitForTimeout(500);
const bodyB = await page.locator("body").innerText();
if (!/Heat/.test(bodyB) || !/clock rate/i.test(bodyB)) {
  console.error("FAIL: Heat variant did not render", bodyB.slice(0, 500));
  process.exit(1);
}
await page.screenshot({ path: new URL("clock-move-B.png", outDir).pathname });

await page.getByRole("button", { name: "Next variant" }).click();
await page.waitForTimeout(500);
const bodyC = await page.locator("body").innerText();
if (!/Ledger/.test(bodyC) || !/movement ledger/i.test(bodyC)) {
  console.error("FAIL: Ledger variant did not render", bodyC.slice(0, 500));
  process.exit(1);
}
await page.getByText("Chicago", { exact: true }).first().click({ force: true });
await page.waitForTimeout(400);
const ledgerChicago = await page.locator("body").innerText();
if (!/Place · Chicago/.test(ledgerChicago) || !/Road ·/.test(ledgerChicago)) {
  console.error("FAIL: Ledger did not list Chicago Movement", ledgerChicago.slice(0, 800));
  process.exit(1);
}
await page.screenshot({ path: new URL("clock-move-C.png", outDir).pathname });

await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(400);
const bodyBack = await page.locator("body").innerText();
if (!/Heat/.test(bodyBack)) {
  console.error("FAIL: arrow key did not cycle back to Heat");
  process.exit(1);
}

await page.getByText("Chicago", { exact: true }).first().click({ force: true });
await page.waitForTimeout(400);
const afterTap = await page.locator("body").innerText();
if (!afterTap.includes("Place · Chicago")) {
  console.error("FAIL: tap did not select Chicago", afterTap.slice(0, 800));
  process.exit(1);
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://127.0.0.1:8080/?variant=A", { waitUntil: "networkidle", timeout: 45000 });
await mobile.waitForTimeout(600);
const mobileText = await mobile.locator("body").innerText();
if (!/Convoy/.test(mobileText)) {
  console.error("FAIL: mobile Convoy did not render", mobileText.slice(0, 400));
  process.exit(1);
}
await mobile.screenshot({ path: new URL("clock-move-A-mobile.png", outDir).pathname });
await mobile.close();

console.log(
  JSON.stringify(
    { ok: true, errors, afterTap: afterTap.match(/Place ·[^\n]+|Residual ·[^\n]+/)?.[0] },
    null,
    2,
  ),
);
if (errors.length) process.exit(2);
await browser.close();
