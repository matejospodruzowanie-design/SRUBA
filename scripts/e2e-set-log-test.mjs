// E2E: register → start workout → add exercise → log a set → inspect DOM.
// Usage: node scripts/e2e-set-log-test.mjs <baseUrl> [emailSuffix]
import puppeteer from "puppeteer-core";

const baseUrl = process.argv[2] || "http://localhost:3000";
const suffix = process.argv[3] || Date.now().toString(36);
const email = `test-${suffix}@example.com`;
const pass = "Test1234!";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--no-sandbox"],
  defaultViewport: { width: 390, height: 844 }, // mobile-ish
});

try {
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (m) => logs.push(`[console] ${m.type()}: ${m.text().slice(0, 200)}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message.slice(0, 300)}`));

  // ── Register ──
  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(500);
  const emailSel = 'input[type="email"]';
  const passSel = 'input[type="password"]';
  await page.waitForSelector(emailSel, { timeout: 15000 });
  await page.type(emailSel, email);
  await page.type(passSel, pass);
  // Any other field (e.g. username)? Fill if present
  const inputs = await page.$$("input");
  for (const inp of inputs) {
    const type = await inp.evaluate((el) => el.type);
    if (type === "text" || type === "name") {
      await inp.type("Test User");
    }
  }
  // Click the submit button
  const clicked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => /zarejestruj|utwórz|kontynuuj/i.test(x.textContent || ""));
    if (b) { b.click(); return b.textContent; }
    return null;
  });
  console.log(`[register] button: ${clicked}`);
  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => {});
  await sleep(1500);
  console.log(`[register] url after: ${page.url()}`);

  // ── Start workout ──
  await page.goto(`${baseUrl}/workout`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(1000);
  const started = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => /rozpocznij trening/i.test(x.textContent || ""));
    if (b) { b.click(); return true; }
    return false;
  });
  console.log(`[workout] start clicked: ${started}`);
  await sleep(2500);

  // ── Add exercise via picker ──
  const addClicked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => /dodaj ćwiczenie/i.test(x.textContent || ""));
    if (b) { b.click(); return true; }
    return false;
  });
  console.log(`[picker] open clicked: ${addClicked}`);
  await sleep(1500);
  await page.waitForSelector("button[aria-pressed]", { timeout: 15000 });
  const picked = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("button[aria-pressed]")].filter((c) => !c.disabled);
    if (cards.length > 0) { cards[0].click(); return true; }
    return false;
  });
  console.log(`[picker] card selected: ${picked}`);
  await sleep(800);
  const addN = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => /^Dodaj \(\d+\)$/.test(x.textContent || ""));
    if (b) { b.click(); return b.textContent; }
    return null;
  });
  console.log(`[picker] add button: ${addN}`);
  await sleep(2000);

  // ── Log a set: fill kg + reps in the first empty input row, click its check ──
  const logged = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type="number"]')];
    const kg = inputs.find((i) => i.placeholder === "kg" || i.placeholder?.startsWith("80"));
    const reps = inputs.find((i) => i.placeholder === "0" || i.placeholder?.startsWith("5"));
    if (!kg || !reps) return "inputs not found";
    kg.focus();
    // Set value via native setter so React sees it
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(kg, "80");
    kg.dispatchEvent(new Event("input", { bubbles: true }));
    setter.call(reps, "5");
    reps.dispatchEvent(new Event("input", { bubbles: true }));
    return `kg=${kg.value} reps=${reps.value}`;
  });
  console.log(`[log] filled: ${logged}`);
  await sleep(500);
  const checkClicked = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type="number"]')];
    const kg = inputs.find((i) => i.value === "80");
    const row = kg?.closest("div.grid");
    // Last button in the row is the check/confirm one (first is warmup toggle)
    const btns = row ? [...row.querySelectorAll("button")] : [];
    const btn = btns[btns.length - 1];
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log(`[log] check clicked: ${checkClicked}`);
  await sleep(2500);

  // ── Inspect DOM state ──
  const state = await page.evaluate(() => {
    const card = document.querySelector('[class*="rounded-xl"][class*="border"]')?.closest("div")?.parentElement;
    const header = document.body.innerText.match(/(\d+)\/?(serii|serie|seria)/g) || [];
    const roRows = [...document.querySelectorAll('[class*="bg-zinc-900/30"]')].map((r) => r.innerText.replace(/\s+/g, " ").trim());
    const inputRows = [...document.querySelectorAll('input[type="number"]')].map((i) => i.value || i.placeholder);
    return {
      header: header.slice(0, 5),
      roRows: roRows.slice(0, 3),
      inputValues: inputRows.slice(0, 6),
      bodySample: document.body.innerText.slice(0, 600).replace(/\n+/g, " | "),
    };
  });
  console.log("[state] " + JSON.stringify(state, null, 2));

  await page.screenshot({ path: `/tmp/set-test-${suffix}.png` });
  console.log("[done] screenshot saved");
  if (logs.length) console.log("[logs]\n" + logs.slice(0, 15).join("\n"));
} finally {
  await browser.close();
}
