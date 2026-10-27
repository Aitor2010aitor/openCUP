import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = path.resolve('shots');
await mkdir(SHOTS, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await page.goto('http://127.0.0.1:8787/', { waitUntil: 'networkidle0' });
await page.click('.hero-create');
await page.waitForSelector('.modal');
await page.evaluate(() => { document.querySelector('[data-new-name]').value = 'Auditoría de diseño'; });
await page.click('[data-new-create]');
await page.waitForSelector('.editor');
await wait(500);

const sizes = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1000, 700],
  [800, 700],
  [760, 700],
];
const failures = [];
for (const [width, height] of sizes) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await wait(350);
  const metrics = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return { x: box.x, y: box.y, w: box.width, h: box.height, right: box.right };
    };
    const left = rect(document.querySelector('.titlebar-left'));
    const tabs = rect(document.querySelector('.tools-strip'));
    const right = rect(document.querySelector('.titlebar-right'));
    const details = rect(document.querySelector('.details-panel'));
    const stage = rect(document.querySelector('.stage'));
    const tabRects = [...document.querySelectorAll('.tools-strip .tab')].map((el) => ({
      label: el.textContent.trim(),
      ...rect(el),
      span: getComputedStyle(el.querySelector('span')).display,
    }));
    return {
      left,
      tabs,
      right,
      details,
      stage,
      firstTab: tabRects[0],
      lastTab: tabRects[tabRects.length - 1],
      visibleTabs: tabRects.filter((tab) => tab.w > 0).length,
      labels: tabRects.filter((tab) => tab.span !== 'none').map((tab) => tab.label),
      docOverflow: document.documentElement.scrollWidth - innerWidth,
      tabsOverflow: document.querySelector('.tools-strip').scrollWidth - document.querySelector('.tools-strip').clientWidth,
    };
  });
  const stageOk = metrics.stage && metrics.stage.w > 200 && metrics.stage.h > 120;
  const detailsOk = width >= 1161 ? metrics.details.w > 150 : metrics.details.w === 0;
  const tabsOk = metrics.visibleTabs === 11 && metrics.tabsOverflow <= 1;
  const overflowOk = metrics.docOverflow <= 1;
  const ok = stageOk && detailsOk && tabsOk && overflowOk;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${width}x${height}`, JSON.stringify({
    firstTabX: Math.round(metrics.firstTab.x),
    leftRight: Math.round(metrics.left.right),
    lastTabRight: Math.round(metrics.lastTab.right),
    rightX: Math.round(metrics.right.x),
    details: Math.round(metrics.details.w),
    stage: [Math.round(metrics.stage.w), Math.round(metrics.stage.h)],
    visibleTabs: metrics.visibleTabs,
    labels: metrics.labels,
    docOverflow: metrics.docOverflow,
    tabsOverflow: metrics.tabsOverflow,
  }));
  if (!ok) failures.push(`${width}x${height}`);
  if ([1366, 1000, 800, 760].includes(width)) {
    await page.screenshot({ path: path.join(SHOTS, `layout-${width}.png`) });
  }
  if (width === 760) {
    await page.click('[data-panel="media"]');
    await wait(250);
    const open = await page.evaluate(() => document.querySelector('[data-left]').classList.contains('open'));
    console.log(`PANEL TOGGLE 760x700: ${open ? 'PASS' : 'FAIL'}`);
    if (!open) failures.push('panel-toggle');
    await page.screenshot({ path: path.join(SHOTS, 'layout-760-panel.png') });

    await page.click('[data-panel="text"]');
    await wait(250);
    const tabKeepsPanel = await page.evaluate(() => ({
      open: document.querySelector('[data-left]').classList.contains('open'),
      presets: document.querySelectorAll('[data-preset]').length,
      active: document.querySelector('[data-panel="text"]').classList.contains('active'),
    }));
    const tabOk = tabKeepsPanel.open && tabKeepsPanel.presets > 0 && tabKeepsPanel.active;
    console.log(`PANEL TAB 760x700: ${tabOk ? 'PASS' : 'FAIL'} ${JSON.stringify(tabKeepsPanel)}`);
    if (!tabOk) failures.push('panel-tab');

    await page.click('[data-panel="text"]');
    await wait(200);
    const closedAgain = await page.evaluate(() => !document.querySelector('[data-left]').classList.contains('open'));
    console.log(`PANEL TOGGLE CLOSE 760x700: ${closedAgain ? 'PASS' : 'FAIL'}`);
    if (!closedAgain) failures.push('panel-toggle-close');
  }
}

// ---- Home responsive audit --------------------------------------------------
await page.click('[data-act="home"]');
await page.waitForSelector('.home');
await wait(400);
for (const [width, height] of [[1440, 900], [1000, 700], [760, 700]]) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await wait(300);
  const homeMetrics = await page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
    };
    return {
      hero: rect('.hero-create'),
      sidebar: rect('.home-sidebar'),
      main: rect('.home-main'),
      cards: document.querySelectorAll('.project-card').length,
      aiCards: document.querySelectorAll('.ai-card').length,
      docOverflow: document.documentElement.scrollWidth - innerWidth,
      scrollHeight: document.querySelector('.home-main')?.scrollHeight,
    };
  });
  const homeOk = homeMetrics.docOverflow <= 1
    && homeMetrics.hero?.w > 0
    && homeMetrics.main?.w > 0
    && homeMetrics.aiCards > 0;
  console.log(`${homeOk ? 'PASS' : 'FAIL'} HOME ${width}x${height}`, JSON.stringify(homeMetrics));
  if (!homeOk) failures.push(`home-${width}`);
  if (width === 760) await page.screenshot({ path: path.join(SHOTS, 'layout-home-760.png') });
}

if (errors.length) {
  console.log('CONSOLE ERRORS', errors);
  failures.push('console');
}
console.log(failures.length ? `LAYOUT FAILURES: ${failures.join(', ')}` : 'LAYOUT AUDIT PASSED');
await browser.close();
process.exit(failures.length ? 1 : 0);
