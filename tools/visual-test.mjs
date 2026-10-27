import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:8787/';
const outDir = new URL('../shots/', import.meta.url);
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--window-size=1440,900', '--force-device-scale-factor=1', '--hide-scrollbars'],
  defaultViewport: { width: 1440, height: 900 },
});

const page = await browser.newPage();
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

const shot = async (name) => {
  await page.evaluate(() => document.querySelectorAll('.toast').forEach((el) => el.remove()));
  const path = new URL(name, outDir).pathname.replace(/^\//, '');
  await page.screenshot({ path, fullPage: false });
  console.log(`shot ${name}`);
};

await page.goto(BASE, { waitUntil: 'networkidle0' });
await new Promise((resolve) => setTimeout(resolve, 500));
await shot('01-home.png');

const homeMetrics = await page.evaluate(() => ({
  viewport: [innerWidth, innerHeight],
  projects: window.cacup?.state?.projects?.length,
  scrollHeight: document.querySelector('.home-main')?.scrollHeight,
  heroColor: getComputedStyle(document.querySelector('.hero-create')).color,
  heroBg: getComputedStyle(document.querySelector('.hero-create')).backgroundColor,
  sidebarWidth: document.querySelector('.home-sidebar')?.getBoundingClientRect().width,
  aiCardHeights: [...document.querySelectorAll('.ai-card')].map((el) => Math.round(el.getBoundingClientRect().height)),
}));
console.log('home metrics', homeMetrics);

await page.click('.hero-create');
await page.waitForSelector('.modal');
await shot('02-new-project.png');
await page.evaluate(() => document.querySelector('[data-new-name]')?.select());
await page.type('[data-new-name]', 'Mi primer video');
await page.click('[data-new-create]');
await page.waitForSelector('.editor');
await new Promise((resolve) => setTimeout(resolve, 700));
await shot('03-editor.png');

const editorMetrics = await page.evaluate(() => {
  const rect = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const box = el.getBoundingClientRect();
    return [Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)];
  };
  return {
    details: rect('[data-details]'),
    center: rect('[data-center]'),
    stage: rect('.stage'),
    timeline: rect('[data-timeline]'),
    timelineScrollHeight: document.querySelector('[data-scroll]')?.scrollHeight,
    tabsVisible: [...document.querySelectorAll('.tools-strip .tab')].filter((el) => el.getBoundingClientRect().width > 0).length,
    labels: [...document.querySelectorAll('.track-label .t-name')].map((el) => el.textContent),
    detailsText: document.querySelector('[data-details]')?.innerText?.slice(0, 160),
  };
});
console.log('editor metrics', editorMetrics);

await page.click('[data-panel="text"]');
await new Promise((resolve) => setTimeout(resolve, 200));
await shot('04-text-panel.png');
await page.click('[data-preset="0"]');
await new Promise((resolve) => setTimeout(resolve, 400));
await shot('05-text-clip.png');

const textMetrics = await page.evaluate(() => ({
  selection: window.cacup?.state?.selection,
  clips: [...document.querySelectorAll('.clip')].map((el) => ({
    name: el.querySelector('.clip-label')?.textContent,
    width: Math.round(el.getBoundingClientRect().width),
    selected: el.classList.contains('selected'),
  })),
  textPreview: document.querySelector('.clip-text-preview')?.textContent,
  detailsTitle: document.querySelector('.details-title')?.textContent,
  stageHasContent: document.querySelector('.stage')?.classList.contains('has-content'),
  detailsWidth: document.querySelector('[data-details]')?.getBoundingClientRect().width,
  timecode: document.querySelector('[data-current]')?.textContent,
}));
console.log('text metrics', textMetrics);
await shot('06-text-selected.png');

await page.click('[data-act="export"]');
await page.waitForSelector('.modal');
await new Promise((resolve) => setTimeout(resolve, 200));
await shot('07-export.png');
console.log('errors', errors);

await browser.close();
