import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:8787';
const SHOTS = path.resolve('shots');
await mkdir(SHOTS, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (error) => errors.push(error.message));

await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.waitForSelector('.hero-create');
await page.click('.hero-create');
await page.waitForSelector('[data-new-name]');
await page.evaluate(() => { document.querySelector('[data-new-name]').value = 'Efectos visuales'; });
await page.click('[data-new-create]');
await page.waitForSelector('.editor');
await page.waitForFunction(() => window.openCUP?.state?.project?.id);
await page.evaluate(() => window.openCUP.command('setPanel', { panel: 'media' }));
const mediaChooser = page.waitForFileChooser();
await page.click('.media-drop');
await (await mediaChooser).accept([path.resolve('tools/fixtures/foto.png')]);
await page.waitForFunction(() => window.openCUP.state.project.tracks.some((track) => track.clips.some((clip) => clip.kind === 'image')), { timeout: 20000 });
const clipId = await page.evaluate(() => {
  const track = window.openCUP.state.project.tracks.find((item) => item.type === 'video');
  return track.clips.find((clip) => clip.kind === 'image').id;
});
await page.evaluate((id) => window.openCUP.command('selectClip', { id }), clipId);

const effects = [
  ['tnd_heart', 'Corazón brillante'],
  ['frm_polaroid', 'Polaroid'],
  ['edt_vhs', 'VHS'],
  ['luz_leak', 'Fuga de luz'],
  ['bmb_boom', 'Cómic boom'],
  ['pat_bubbles', 'Burbujas de pato'],
  ['d3_anaglyph', 'Anaglifo'],
  ['oldFilm', 'Cine viejo'],
];

for (const [key, label] of effects) {
  await page.evaluate(({ id, effect }) => window.openCUP.command('applyEffect', { clip: id, effect }), { id: clipId, effect: key });
  await new Promise((resolve) => setTimeout(resolve, 350));
  await page.screenshot({ path: path.join(SHOTS, `fx-${key}.png`) });
  console.log('shot', key, label);
}

console.log('errors', JSON.stringify(errors));
await browser.close();
if (errors.length) process.exitCode = 1;
