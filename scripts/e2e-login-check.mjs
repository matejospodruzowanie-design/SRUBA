// Quick check: register on production and dump the visible error text.
// Usage: node scripts/e2e-login-check.mjs <baseUrl> [emailSuffix]
import puppeteer from "puppeteer-core";

const baseUrl = process.argv[2] || "http://localhost:3000";
const suffix = process.argv[3] || Date.now().toString(36);
const email = `chk-${suffix}@example.com`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--no-sandbox"],
  defaultViewport: { width: 390, height: 844 },
});

try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.log(`[console.error] ${m.text().slice(0, 300)}`); });
  page.on("pageerror", (e) => console.log(`[pageerror] ${e.message.slice(0, 300)}`));

  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(500);
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', "Test1234!");
  const extra = await page.$$("input");
  for (const inp of extra) {
    const t = await inp.evaluate((el) => el.type);
    if (t === "text" || t === "name") await inp.type("Check User");
  }
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => /zarejestruj|utwórz|kontynuuj/i.test(x.textContent || ""));
    if (b) b.click();
  });
  await sleep(4000);
  console.log(`[url] ${page.url()}`);
  const body = await page.evaluate(() => document.body.innerText.slice(0, 900).replace(/\n+/g, " | "));
  console.log(`[body] ${body}`);
} finally {
  await browser.close();
}
