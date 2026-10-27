import puppeteer from 'puppeteer-core';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const failures = [];
const notes = [];

function check(ok, message) {
  notes.push(`${ok ? 'PASS' : 'FAIL'} ${message}`);
  if (!ok) failures.push(message);
}

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (error) => errors.push(error.message));

await page.goto('http://127.0.0.1:8787/', { waitUntil: 'networkidle0' });
await page.evaluate(() => window.cacup.command('newProject', { name: 'Manipulación preview' }));
await page.waitForFunction(() => window.cacup?.state?.project?.id);
await page.evaluate(() => window.cacup.command('addText', { content: 'Arrastra este texto', size: 96 }));
await page.waitForFunction(() => window.cacup?.state?.selection);
await page.waitForSelector('.layer-frame:not([hidden])');
await sleep(500);

const textState = () => page.evaluate(() => {
  const clip = window.cacup.state.project.tracks.flatMap((track) => track.clips).find((item) => item.kind === 'text');
  return { id: clip.id, x: clip.x, y: clip.y, scale: clip.scale, rotate: clip.rotate };
});
const stickerState = () => page.evaluate(() => {
  const clip = window.cacup.state.project.tracks.flatMap((track) => track.clips).find((item) => item.kind === 'sticker');
  return clip ? { id: clip.id, x: clip.x, y: clip.y, scale: clip.scale, rotate: clip.rotate } : null;
});
const selection = () => page.evaluate(() => window.cacup.state.selection);

async function frameBox() {
  const frame = await page.$('.layer-frame:not([hidden])');
  if (!frame) throw new Error('No hay marco de capa visible');
  return frame.boundingBox();
}

async function centerOfFrame() {
  const box = await frameBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

/* 1. Arrastrar el texto. */
const before = await textState();
let center = await centerOfFrame();
await page.mouse.move(center.x, center.y);
await page.mouse.down();
await page.mouse.move(center.x + 120, center.y + 60, { steps: 12 });
await page.mouse.up();
await sleep(350);
const afterMove = await textState();
check(afterMove.x > before.x + 5 && afterMove.y > before.y + 2, `arrastre texto x:${before.x}→${afterMove.x} y:${before.y}→${afterMove.y}`);
check(await page.$eval('.layer-frame', (element) => element.classList.contains('is-dragging')) === false, 'el marco suelta el estado de arrastre');

/* 2. Escalar con la esquina inferior derecha. */
center = await centerOfFrame();
const se = await page.$('.layer-handle.se');
const seBox = await se.boundingBox();
await page.mouse.move(seBox.x + 4, seBox.y + 4);
await page.mouse.down();
await page.mouse.move(seBox.x + 70, seBox.y + 70, { steps: 12 });
await page.mouse.up();
await sleep(350);
const afterScale = await textState();
check(afterScale.scale > afterMove.scale + 0.05, `escala texto ${afterMove.scale}→${afterScale.scale}`);

/* 3. Rotar con el tirador superior. */
center = await centerOfFrame();
const rotateHandle = await page.$('.layer-rotate');
const rotateBox = await rotateHandle.boundingBox();
const handleCenter = { x: rotateBox.x + rotateBox.width / 2, y: rotateBox.y + rotateBox.height / 2 };
const radius = Math.hypot(handleCenter.x - center.x, handleCenter.y - center.y);
await page.mouse.move(handleCenter.x, handleCenter.y);
await page.mouse.down();
await page.mouse.move(center.x + radius, center.y, { steps: 18 });
await page.mouse.up();
await sleep(350);
const afterRotate = await textState();
check(Math.abs(afterRotate.rotate - 90) < 8, `rotación texto ${afterRotate.rotate}° (esperado ~90°)`);

/* 4. Arrastrar un sticker sin tocar el texto. */
await page.evaluate(() => window.cacup.command('addSticker', { value: '🎉', start: 0, duration: 5, size: 240 }));
await page.waitForFunction(() => window.cacup.state.project.tracks.some((track) => track.clips.some((clip) => clip.kind === 'sticker')));
await page.evaluate(async () => {
  const found = window.cacup.state.project.tracks.flatMap((track) => track.clips).find((clip) => clip.kind === 'text');
  await window.cacup.command('updateClip', { id: found.id, patch: { x: -34, y: -30 } });
  const sticker = window.cacup.state.project.tracks.flatMap((track) => track.clips).find((clip) => clip.kind === 'sticker');
  await window.cacup.command('selectClip', { id: sticker.id });
});
await sleep(500);
const stickerBefore = await stickerState();
const stickerCenter = await centerOfFrame();
check((await selection()) === stickerBefore.id, 'el sticker queda seleccionado');
await page.mouse.move(stickerCenter.x, stickerCenter.y);
await page.mouse.down();
await page.mouse.move(stickerCenter.x - 90, stickerCenter.y - 45, { steps: 12 });
await page.mouse.up();
await sleep(350);
const stickerAfter = await stickerState();
check(stickerAfter.x < stickerBefore.x - 2 && stickerAfter.y < stickerBefore.y - 1, `arrastre sticker x:${stickerBefore.x}→${stickerAfter.x} y:${stickerBefore.y}→${stickerAfter.y}`);

/* 5. Deshacer deja el sticker donde estaba y en un solo paso. */
await page.evaluate(() => window.cacup.command('undo'));
await sleep(350);
const stickerUndo = await stickerState();
check(Math.abs(stickerUndo.x - stickerBefore.x) < 0.02 && Math.abs(stickerUndo.y - stickerBefore.y) < 0.02, `deshacer revierte el sticker (${stickerUndo.x}, ${stickerUndo.y})`);
check((await selection()) === stickerBefore.id, 'deshacer conserva la selección del sticker');

/* 6. Volver a seleccionar el texto desde el lienzo. */
const textNow = await page.evaluate(() => {
  const found = window.cacup.state.project.tracks.flatMap((track) => track.clips).find((clip) => clip.kind === 'text');
  return { id: found.id, x: found.x, y: found.y };
});
await page.evaluate(() => window.cacup.command('selectClip', { id: null }));
await sleep(250);
// Selección por geometría: clic en el centro del texto movido (-34%, -30%).
const overlayBox = await page.$eval('.stage-overlay', (element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
});
const clickX = overlayBox.x + overlayBox.width / 2 + (-34 / 100) * overlayBox.width;
const clickY = overlayBox.y + overlayBox.height / 2 + (-30 / 100) * overlayBox.height;
await page.mouse.click(clickX, clickY);
await sleep(350);
check((await selection()) === textNow.id, 'clic en el lienzo vuelve a seleccionar el texto');
const frameVisible = await page.$eval('.layer-frame', (element) => !element.hidden && element.offsetWidth > 10 && element.offsetHeight > 10);
check(frameVisible, 'el marco reaparece al reseleccionar');

await page.screenshot({ path: 'shots/preview-drag.png' });
check(errors.length === 0, `sin errores de consola (${errors.length})`);

console.log(notes.join('\n'));
console.log('errors', JSON.stringify(errors));
await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} fallo(s)`);
  process.exitCode = 1;
}
