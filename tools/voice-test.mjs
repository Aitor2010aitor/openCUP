import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
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
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
  ],
  defaultViewport: { width: 1440, height: 900 },
});
await browser.defaultBrowserContext().overridePermissions('http://127.0.0.1:8787', ['microphone']);
const page = await browser.newPage();
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await page.goto('http://127.0.0.1:8787/', { waitUntil: 'networkidle0' });
await wait(400);
await page.evaluate(() => {
  const card = [...document.querySelectorAll('.project-card')]
    .find((item) => item.querySelector('.project-name')?.textContent === 'Prueba de voz');
  if (card) card.querySelector('[data-project-delete]')?.click();
});
const stale = await page.$('.modal [data-confirm]');
if (stale) {
  await page.click('.modal [data-confirm]');
  await wait(400);
}

await page.click('.hero-create');
await page.waitForSelector('.modal');
await page.evaluate(() => { document.querySelector('[data-new-name]').value = 'Prueba de voz'; });
await page.click('[data-new-create]');
await page.waitForSelector('.editor');
await wait(500);

const support = await page.evaluate(async () => ({
  mediaRecorder: Boolean(window.MediaRecorder),
  getUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
  deviceCount: (await navigator.mediaDevices.enumerateDevices().catch(() => [])).filter((d) => d.kind === 'audioinput').length,
}));
console.log('support', support);
check(support.mediaRecorder && support.getUserMedia, 'browser exposes recording APIs');

await page.click('[data-record]');
await page.waitForSelector('[data-rec-stop]', { timeout: 10000 });
await wait(1500);
await page.click('[data-rec-stop]');
let mediaCount = 0;
try {
  await page.waitForFunction(() => document.querySelectorAll('.media-card').length === 1, { timeout: 15000 });
  mediaCount = await page.evaluate(() => document.querySelectorAll('.media-card').length);
} catch {
  mediaCount = await page.evaluate(() => document.querySelectorAll('.media-card').length);
}
await wait(500);
const data = await page.evaluate(() => ({
  panel: window.cacup.state.panel,
  media: [...window.cacup.state.media.values()].map((item) => ({
    kind: item.kind,
    name: item.name,
    duration: item.duration,
    size: item.size,
    peaks: item.peaks?.length || 0,
  })),
  audioClips: window.cacup.state.project.tracks.find((track) => track.type === 'audio')?.clips.map((clip) => ({
    kind: clip.kind,
    duration: clip.duration,
  })),
  toasts: [...document.querySelectorAll('.toast')].map((toast) => toast.textContent),
}));
console.log('data', JSON.stringify(data, null, 2));
check(mediaCount === 1, 'voice recording appears in the media panel', String(mediaCount));
check(data.media[0]?.kind === 'audio', 'recording is imported as audio', data.media[0]?.kind);
check(data.media[0]?.duration > 0.5, 'recording has a duration', String(data.media[0]?.duration));
check(data.media[0]?.peaks > 10, 'recording waveform is analyzed', String(data.media[0]?.peaks));
check(data.audioClips?.length === 1, 'recording is added to the audio track');
check(errors.length === 0, 'no console or page errors', errors.join(' | '));

console.log(failures.length ? `VOICE TEST FAILURES: ${failures.join(', ')}` : 'VOICE RECORDING TEST PASSED');
await browser.close();
process.exit(failures.length ? 1 : 0);
