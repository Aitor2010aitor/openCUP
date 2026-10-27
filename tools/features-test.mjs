import puppeteer from 'puppeteer-core';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = path.resolve('shots');
const TMP = path.resolve('shots/tmp');
await mkdir(SHOTS, { recursive: true });
await mkdir(TMP, { recursive: true });

const srtPath = path.join(TMP, 'prueba.srt');
await writeFile(srtPath, `1
00:00:00,500 --> 00:00:02,000
Hola desde SRT

2
00:00:02,500 --> 00:00:04,000
Segunda línea de subtítulo
`, 'utf8');

const failures = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--window-size=1440,900',
    '--force-device-scale-factor=1',
    '--hide-scrollbars',
    '--autoplay-policy=no-user-gesture-required',
  ],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const state = () => page.evaluate(() => ({
  view: window.cacup?.state?.view,
  project: window.cacup?.state?.project?.name,
  projects: (window.cacup?.state?.projects || []).map((item) => item.name),
  tracks: window.cacup?.state?.project?.tracks?.map((track) => ({
    type: track.type,
    clips: track.clips.map((clip) => ({
      kind: clip.kind,
      name: clip.name,
      start: Number(clip.start.toFixed(3)),
      duration: Number(clip.duration.toFixed(3)),
      text: clip.text?.content,
    })),
  })),
}));

async function goHome() {
  if ((await state()).view !== 'home') {
    await page.click('[data-act="home"]');
    await page.waitForSelector('.home');
    await wait(350);
  }
}

async function removeProjectNamed(name) {
  await goHome();
  const found = await page.evaluate((target) => {
    const card = [...document.querySelectorAll('.project-card')]
      .find((item) => item.querySelector('.project-name')?.textContent === target);
    if (!card) return false;
    card.querySelector('[data-project-delete]')?.click();
    return true;
  }, name);
  if (!found) return false;
  await page.waitForSelector('.modal [data-confirm]', { timeout: 5000 });
  await page.click('.modal [data-confirm]');
  await wait(450);
  return true;
}

const projectNames = ['Prueba funciones', 'Renombrado una vez', 'Renombrado dos veces', 'Vlog vertical', 'Prueba subtítulos'];

await page.goto('http://127.0.0.1:8787/', { waitUntil: 'networkidle0' });
await wait(400);
for (const name of projectNames) await removeProjectNamed(name);
await page.waitForSelector('.hero-create', { timeout: 10000 });

// ---- Project title rename inside the editor ---------------------------------
await page.click('.hero-create');
await page.waitForSelector('.modal');
await page.evaluate(() => { document.querySelector('[data-new-name]').value = 'Prueba funciones'; });
await page.click('[data-new-create]');
await page.waitForSelector('.editor');
await wait(450);
await page.evaluate(() => {
  const input = document.querySelector('[data-project-name]');
  input.value = 'Renombrado una vez';
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
await wait(300);
let data = await state();
check(data.project === 'Renombrado una vez', 'renaming in the editor updates the project', data.project);
await goHome();
let cardName = await page.evaluate(() => document.querySelector('.project-card .project-name')?.textContent);
check(cardName === 'Renombrado una vez', 'the new name appears on the home card', cardName);

// ---- Rename from the home card ---------------------------------------------
await page.evaluate(() => document.querySelector('[data-project-rename]').click());
await page.waitForSelector('[data-prompt-input]');
await page.evaluate(() => { document.querySelector('[data-prompt-input]').value = 'Renombrado dos veces'; });
await page.click('.modal [data-confirm]');
await wait(450);
data = await state();
check(data.projects.includes('Renombrado dos veces'), 'renaming from the home card works', JSON.stringify(data.projects));

// ---- Persistence + deletion -------------------------------------------------
await wait(900);
await page.reload({ waitUntil: 'networkidle0' });
await wait(450);
cardName = await page.evaluate(() => document.querySelector('.project-card .project-name')?.textContent);
check(cardName === 'Renombrado dos veces', 'renamed project persists after reload', cardName);
const removed = await removeProjectNamed('Renombrado dos veces');
check(removed, 'delete action is available on the card');
data = await state();
check(!data.projects.includes('Renombrado dos veces'), 'project is removed from home', JSON.stringify(data.projects));
await wait(700);
await page.reload({ waitUntil: 'networkidle0' });
await wait(400);
data = await state();
check(!data.projects.includes('Renombrado dos veces'), 'deleted project stays deleted after reload', JSON.stringify(data.projects));

// ---- Home templates ---------------------------------------------------------
await page.evaluate(() => document.querySelector('.side-item[data-home-action="templates"]').click());
await page.waitForSelector('[data-home-template="vlog"]');
await page.evaluate(() => document.querySelector('[data-home-template="vlog"]').click());
await page.waitForSelector('.editor');
await wait(600);
data = await state();
check(data.project === 'Vlog vertical', 'home template creates its project', data.project);
check(await page.evaluate(() => window.cacup.state.project.ratio) === '9:16', 'template applies its aspect ratio');
const templateTextTracks = data.tracks?.filter((track) => track.type === 'text') || [];
const templateClips = templateTextTracks.flatMap((track) => track.clips);
const templateText = templateClips.find((clip) => clip.text?.includes('MI DÍA'));
const templateSubtitle = templateClips.find((clip) => clip.text === 'Hoy en el canal');
check(templateText?.text?.includes('MI DÍA'), 'template inserts its title text', templateText?.text);
check(templateClips.length === 2, 'template adds a title and a subtitle', String(templateClips.length));
check(templateTextTracks.length === 2 && templateTextTracks.every((track) => track.clips.length === 1),
  'template uses separate text tracks for title and subtitle', String(templateTextTracks.length));
check(templateSubtitle?.text === 'Hoy en el canal', 'template subtitle keeps its copy', templateSubtitle?.text);
check(Math.abs((templateSubtitle?.start ?? -1) - (templateText?.start ?? 0)) < 0.01, 'subtitle shares the title timing');
check(await page.evaluate(() => document.querySelectorAll('.clip.text').length) === 2, 'template text appears on the timeline');
await page.screenshot({ path: path.join(SHOTS, '20-template.png') });
await goHome();
await removeProjectNamed('Vlog vertical');

// ---- SRT import -------------------------------------------------------------
await page.click('.hero-create');
await page.waitForSelector('.modal');
await page.evaluate(() => { document.querySelector('[data-new-name]').value = 'Prueba subtítulos'; });
await page.click('[data-new-create]');
await page.waitForSelector('.editor');
await wait(400);
await page.click('[data-panel="captions"]');
await wait(300);
const chooserPromise = page.waitForFileChooser();
await page.click('[data-import-srt]');
const chooser = await chooserPromise;
await chooser.accept([srtPath]);
await page.waitForFunction(() => document.querySelectorAll('.clip.text').length === 2, { timeout: 10000 });
await wait(350);
data = await state();
const captions = data.tracks.find((track) => track.type === 'text').clips;
check(captions.length === 2, 'SRT import creates one clip per cue', String(captions.length));
check(captions[0]?.text === 'Hola desde SRT', 'first SRT cue keeps its text', captions[0]?.text);
check(Math.abs(captions[0].start - 0.5) < 0.02 && Math.abs(captions[0].duration - 1.5) < 0.02,
  'first SRT cue keeps its timing', JSON.stringify(captions[0]));
check(Math.abs(captions[1].start - 2.5) < 0.02, 'second SRT cue starts at 2.5 s', String(captions[1].start));
await page.screenshot({ path: path.join(SHOTS, '21-srt-import.png') });
await goHome();
await removeProjectNamed('Prueba subtítulos');

check(errors.length === 0, 'no console or page errors', errors.join(' | '));
console.log(failures.length ? `FEATURE FAILURES: ${failures.join(', ')}` : 'ALL FEATURE CHECKS PASSED');
await browser.close();
process.exit(failures.length ? 1 : 0);
