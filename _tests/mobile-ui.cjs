// Run against a Jekyll build: node _tests/mobile-ui.cjs /path/to/site
// Requires Playwright; CHROME_PATH may select an installed Chromium executable.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(process.argv[2] || '_site');
const origin = 'https://wuu26.github.io';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
  const failures = [];
  try {
    for (const mode of ['baseline', 'slow-mathjax', 'slow-mermaid', 'slow-main', 'storage-read-denied', 'storage-write-denied']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const held = [];
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if ((mode === 'slow-mathjax' && url.href.includes('mathjax@')) ||
            (mode === 'slow-mermaid' && url.href.includes('mermaid@')) ||
            (mode === 'slow-main' && url.pathname.endsWith('/main.min.js'))) {
          held.push(route);
          return;
        }
        if (url.origin !== origin) return route.abort();
        const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
        return fs.existsSync(file)
          ? route.fulfill({ status: 200, body: fs.readFileSync(file), contentType: mime[path.extname(file)] || 'application/octet-stream' })
          : route.fulfill({ status: 404, body: 'Not found' });
      });
      await context.addInitScript(mode => {
        if (mode === 'storage-read-denied') Storage.prototype.getItem = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };
        if (mode === 'storage-write-denied') Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
      }, mode);
      const page = await context.newPage();
      page.setDefaultTimeout(3000);
      const check = (condition, name) => { if (!condition) failures.push(`${mode}: ${name}`); };
      try {
        await page.goto(origin, { waitUntil: 'commit' });
        await page.waitForFunction(() => document.readyState !== 'loading' && Number(getComputedStyle(document.querySelector('#main')).opacity) === 1);
        if (mode === 'baseline') await page.waitForLoadState('domcontentloaded');
        const menu = page.locator('.author__urls');
        check(await menu.isVisible(), 'contact links are visible without interaction');
        const links = menu.locator('a');
        check(await links.count() === 3, 'email, GitHub and LinkedIn are present');
        for (const link of await links.all()) {
          check(await link.isVisible(), 'each contact link is visible');
          if (await link.isVisible()) await link.tap({ trial: true });
        }
        const clear = await page.locator('.lang-toggle-btn').evaluate(el => {
          const r = el.getBoundingClientRect();
          return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
        });
        check(clear, 'contact links do not cover language button');
        if (clear) {
          await page.locator('.lang-toggle-btn').tap();
          check(await page.locator('html').getAttribute('lang') === 'zh-CN', 'language switches with contact links visible');
        }
        await Promise.all(held.map(route => route.abort()));
        await page.waitForLoadState('domcontentloaded');
        check(await menu.isVisible(), 'contact links remain visible after delayed scripts finish');
        for (const width of [320, 390, 768, 924, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          const metrics = await page.evaluate(() => ({
            avatar: document.querySelector('.author__avatar img').getBoundingClientRect().width,
            overflow: document.documentElement.scrollWidth > innerWidth + 1
          }));
          check(!metrics.overflow, `no overflow at ${width}px`);
          check(width < 925 ? metrics.avatar >= 70 : metrics.avatar >= 170 && metrics.avatar <= 180, `appropriate avatar size at ${width}px`);
          check(await menu.isVisible(), `contact links visible at ${width}px`);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        check(await menu.isVisible(), 'contact links remain visible after desktop-to-mobile resize');
        if (!mode.startsWith('storage-')) {
          await page.goto(origin + '/cv/', { waitUntil: 'commit' });
          await page.locator('html[lang="zh-CN"]').waitFor().catch(() => {});
          check(await page.locator('html').getAttribute('lang') === 'zh-CN', 'chosen language persists across pages');
        }
        console.log(`${mode}: checks completed`);
      } finally { await context.close(); }
    }
    assert.deepEqual(failures, [], failures.join('\n'));
    console.log('PASS: mobile touch, blocked scripts, unavailable storage, responsive layout and persistence');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
