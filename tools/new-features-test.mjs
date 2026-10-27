import puppeteer from 'puppeteer-core';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:8787';
const SHOTS = path.resolve('shots');
await mkdir(SHOTS, { recursive: true });

const failures = [];
const notes = [];
const check = (ok, message) => {
  if (ok) notes.push(`PASS ${message}`);
  else { failures.push(message); notes.push(`FAIL ${message}`); }
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});

// Pestaña anterior que permanece en Inicio: el puente debe ignorarla y
// controlar la pestaña más reciente, que es la que usa la prueba.
const distractor = await browser.newPage();
await distractor.goto(BASE, { waitUntil: 'networkidle0' });

const page = await browser.newPage();
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

try {
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.hero-create');

  check(await page.$('.capcut-pill') !== null, 'home muestra acceso CapCut');
  check(await page.$('.side-ai') !== null, 'home muestra Puente IA');
  check((await page.$$('.showcase-card')).length === 4, 'home muestra 4 escaparates');

  // Crear proyecto desde el hero.
  await page.click('.hero-create');
  await page.waitForSelector('[data-new-name]');
  await page.evaluate(() => { document.querySelector('[data-new-name]').value = 'Prueba nuevas herramientas'; });
  await page.click('[data-new-create]');
  await page.waitForSelector('.editor');
  await page.waitForFunction(() => window.cacup?.state?.project?.id);

  const tabs = await page.$$eval('.tools-strip .tab', (els) => els.map((el) => el.dataset.panel || el.textContent.trim()));
  check(tabs.length === 11, `editor muestra 11 pestañas (${tabs.length})`);

  const clickTab = async (panel) => {
    await page.evaluate((name) => {
      const tabs = [...document.querySelectorAll('.tools-strip .tab')];
      tabs.find((tab) => (tab.dataset.panel || '') === name)?.click();
    }, panel);
    await page.waitForFunction((name) => window.cacup.state.panel === name, {}, panel);
    await new Promise((resolve) => setTimeout(resolve, 120));
  };

  await clickTab('stickers');
  const stickerButtons = await page.$$('.sticker-grid .sticker-btn');
  const stickerChips = await page.$$('.category-chips .category-chip');
  check(stickerButtons.length >= 12, `panel stickers: ${stickerButtons.length} stickers en la categoría`);
  check(stickerChips.length === 19, `panel stickers: ${stickerChips.length} categorías`);
  await page.screenshot({ path: path.join(SHOTS, 'new-stickers.png') });
  await page.click('.sticker-btn');
  await new Promise((resolve) => setTimeout(resolve, 200));
  const stickerState = await page.evaluate(() => {
    const found = window.cacup.state.project.tracks.flatMap((track) => track.clips).find((clip) => clip.id === window.cacup.state.selection);
    return found ? { kind: found.kind, sticker: found.sticker } : null;
  });
  check(stickerState?.kind === 'sticker', 'sticker insertado como capa sticker');
  check(Boolean(stickerState?.sticker?.content), 'sticker conserva contenido');
  check(await page.$('[data-sticker-content]') !== null, 'detalles muestran controles de sticker');

  // Importar una imagen real para probar efectos y transiciones sobre medios.
  await clickTab('media');
  const chooserPromise = page.waitForFileChooser();
  await page.click('.media-drop');
  const chooser = await chooserPromise;
  await chooser.accept([path.resolve('tools/fixtures/foto.png')]);
  await page.waitForFunction(() => [...window.cacup.state.media.values()].some((media) => media.kind === 'image'), { timeout: 30000 });
  await page.waitForFunction(() => window.cacup.state.project.tracks.some((track) => track.clips.some((clip) => clip.kind === 'image')), { timeout: 20000 });
  const imageClipId = await page.evaluate(() => {
    const track = window.cacup.state.project.tracks.find((item) => item.type === 'video');
    return track?.clips.find((clip) => clip.kind === 'image')?.id || null;
  });
  check(Boolean(imageClipId), 'imagen importada en la pista de video');
  if (imageClipId) await page.evaluate(async (id) => { await window.cacup.command('selectClip', { id }); }, imageClipId);

  await clickTab('effects');
  const effectCards = await page.$$('.effect-grid .effect-card');
  const effectChips = await page.$$('.category-chips .category-chip');
  check(effectCards.length >= 160, `panel efectos: ${effectCards.length} efectos`);
  check(effectChips.length === 20, `panel efectos: ${effectChips.length} categorías`);
  await page.click('[data-effect="oldFilm"]');
  await new Promise((resolve) => setTimeout(resolve, 250));
  const effectState = await page.evaluate(() => {
    const found = window.cacup.state.project.tracks.flatMap((track) => track.clips).find((clip) => clip.id === window.cacup.state.selection);
    return found ? { kind: found.kind, effect: found.effect } : null;
  });
  check(effectState?.kind === 'image' && effectState?.effect === 'oldFilm', 'efecto oldFilm aplicado a la imagen');
  await page.screenshot({ path: path.join(SHOTS, 'new-effects.png') });

  await clickTab('transitions');
  const transitionCards = await page.$$('.transition-grid .transition-card');
  check(transitionCards.length === 16, `panel transiciones: ${transitionCards.length} transiciones`);
  await page.screenshot({ path: path.join(SHOTS, 'new-transitions.png') });
  await page.click('[data-transition="slide-left"]');
  await new Promise((resolve) => setTimeout(resolve, 200));
  check(await page.evaluate(() => {
    const found = window.cacup.state.project.tracks.flatMap((track) => track.clips).find((clip) => clip.id === window.cacup.state.selection);
    return found?.transition === 'slide-left' && found?.transitionDuration === 0.6;
  }), 'transición slide-left aplicada');

  await clickTab('captions');
  const captionStyles = await page.$$('.caption-styles .caption-style');
  check(captionStyles.length === 6, `panel subtítulos: ${captionStyles.length} estilos`);
  await page.click('[data-caption-style="yellow"]');
  await new Promise((resolve) => setTimeout(resolve, 150));
  await page.screenshot({ path: path.join(SHOTS, 'new-captions.png') });
  await page.click('[data-add-subtitle]');
  await new Promise((resolve) => setTimeout(resolve, 350));
  check(await page.evaluate(() => {
    const found = window.cacup.state.project.tracks.flatMap((track) => track.clips).find((clip) => clip.id === window.cacup.state.selection);
    return found?.kind === 'text' && found?.text?.color === '#ffe34d';
  }), 'subtítulo creado con estilo amarillo');
  await page.screenshot({ path: path.join(SHOTS, 'new-captions-added.png') });

  await clickTab('avatar');
  const avatarCards = await page.$$('.avatar-grid .avatar-card');
  check(avatarCards.length === 8, `panel avatar: ${avatarCards.length} avatares`);
  await page.screenshot({ path: path.join(SHOTS, 'new-avatar.png') });
  await page.click('[data-avatar="presenter"]');
  await new Promise((resolve) => setTimeout(resolve, 200));
  check(await page.evaluate(() => {
    const found = window.cacup.state.project.tracks.flatMap((track) => track.clips).find((clip) => clip.id === window.cacup.state.selection);
    return found?.kind === 'sticker' && found?.sticker?.background === '#1d6d78' && found?.sticker?.shape === 'circle';
  }), 'avatar insertado con fondo circular');

  await clickTab('filters');
  const filterCards = await page.$$('.filter-grid .filter-card');
  const filterChips = await page.$$('.category-chips .category-chip');
  check(filterCards.length === 51, `panel filtros: ${filterCards.length} filtros en Destacado`);
  check(filterChips.length === 20, `panel filtros: ${filterChips.length} categorías`);
  await page.screenshot({ path: path.join(SHOTS, 'new-filters.png') });
  await page.evaluate(() => {
    const chip = [...document.querySelectorAll('[data-filter-category]')].find((item) => item.dataset.filterCategory === 'Alternativo');
    chip?.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 250));
  const creativeFilters = await page.$$('.filter-grid .filter-card');
  check(creativeFilters.length === 51, `categoría Alternativo filtra ${creativeFilters.length} filtros`);
  const activeFilterCategory = await page.$eval('.category-chips .category-chip.active', (el) => el.dataset.filterCategory);
  check(activeFilterCategory === 'Alternativo', `categoría activa visible: ${activeFilterCategory}`);
  const chipScroll = await page.$eval('.category-chips', (el) => Math.max(el.scrollTop, el.scrollLeft));
  check(chipScroll > 0, `el raíl de categorías se desplaza hasta la activa (${Math.round(chipScroll)} px)`);
  await page.screenshot({ path: path.join(SHOTS, 'new-filters-creative.png') });

  await clickTab('templates');
  const templateCards = await page.$$('.template-grid .template-card');
  check(templateCards.length === 10, `panel plantillas: ${templateCards.length} plantillas`);
  await page.screenshot({ path: path.join(SHOTS, 'new-templates.png') });

  // Diálogo del puente IA desde el propio API.
  await page.evaluate(() => { void window.cacup.openBridge(); });
  await page.waitForSelector('.bridge-modal .bridge-hero, .bridge-modal .bridge-offline', { timeout: 8000 });
  const bridgeText = await page.$eval('.bridge-modal .modal-body', (el) => el.textContent);
  check(bridgeText.includes('Cacup AI Bridge'), 'diálogo IA muestra el puente');
  check(bridgeText.includes('8790'), 'diálogo IA muestra el puerto 8790');
  check(await page.$('.bridge-actions .bridge-action') !== null, 'diálogo IA lista acciones');
  await page.screenshot({ path: path.join(SHOTS, 'new-bridge.png') });
  await page.evaluate(() => document.querySelector('[data-modal-close]')?.click());
  await new Promise((resolve) => setTimeout(resolve, 150));

  // CapCut desde inicio.
  await page.evaluate(() => window.cacup.command('goHome'));
  await page.waitForSelector('.home');
  await page.click('[data-home-action="capcut"]');
  await page.waitForSelector('.capcut-modal .capcut-list, .capcut-modal .capcut-empty', { timeout: 10000 });
  const capcutCards = await page.$$('.capcut-modal .capcut-card');
  check(capcutCards.length >= 1, `modal CapCut lista ${capcutCards.length} borradores`);
  const capcutNames = await page.$$eval('.capcut-modal .capcut-info strong', (els) => els.map((el) => el.textContent.trim()));
  check(capcutNames.includes('1007'), 'modal CapCut incluye el borrador 1007');
  await page.screenshot({ path: path.join(SHOTS, 'new-capcut-list.png') });

  const clicked1007 = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.capcut-modal .capcut-card')]
      .find((item) => item.querySelector('.capcut-info strong')?.textContent.trim() === '1007');
    if (!card) return false;
    card.querySelector('[data-capcut-open]')?.click();
    return true;
  });
  check(clicked1007, 'se puede abrir el borrador CapCut 1007');
  if (clicked1007) {
    await page.waitForFunction(() => window.cacup.state.view === 'editor' && window.cacup.state.project?.source?.type === 'capcut', { timeout: 20000 });
    const capcutState = await page.evaluate(() => {
      const project = window.cacup.state.project;
      return {
        name: project.name,
        source: project.source,
        clips: project.tracks.flatMap((track) => track.clips).map((clip) => ({ kind: clip.kind, text: clip.text?.content })),
      };
    });
    check(capcutState.clips.some((clip) => clip.kind === 'text' && clip.text === 'Texto predeterminado'), 'import CapCut conserva el texto del borrador 1007');
    check(capcutState.source?.type === 'capcut', 'proyecto importado marcado como CapCut');
    await page.screenshot({ path: path.join(SHOTS, 'new-capcut-imported.png') });
  }

  // Puente IA real: estado y comando con token.
  const token = (await readFile('.cacup-ai-token', 'utf8')).trim();
  const api = (route) => `http://127.0.0.1:8790/api/ai${route}`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const statusResponse = await fetch(api('/status'), { headers });
  const status = await statusResponse.json();
  check(statusResponse.ok && status.connected === true, 'puente IA reporta la app conectada');
  check(status.clients >= 2, `puente IA detecta varias pestañas (${status.clients})`);
  check(Boolean(status.target), 'puente IA identifica la pestaña de control');
  const unauthorized = await fetch(api('/status'));
  check(unauthorized.status === 401, 'el puente rechaza peticiones sin token');
  const actionsResponse = await fetch(api('/actions'), { headers });
  const actions = await actionsResponse.json();
  check(actions.actions?.length === 31, `el puente publica 31 acciones (${actions.actions?.length})`);
  check(actions.actions?.some((item) => item.action === 'applyTransition' && item.description.includes('16 tipos')), 'la documentación de acciones está actualizada');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const stateResponse = await fetch(api('/state'), { headers });
  const state = await stateResponse.json();
  check(state.state?.project?.source?.type === 'capcut', 'puente IA devuelve el estado del proyecto CapCut');

  const commandResponse = await fetch(api('/command'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'addText', params: { content: 'Texto desde otra IA', start: 0, duration: 2 }, wait: true }),
  });
  const command = await commandResponse.json();
  check(commandResponse.ok && command.ok, `comando addText ejecutado (${command.error || 'ok'})`);
  const afterCommand = await page.evaluate(() => window.cacup.state.project.tracks.flatMap((track) => track.clips).some((clip) => clip.text?.content === 'Texto desde otra IA'));
  check(afterCommand, 'el texto del comando aparece en el proyecto');

  const screenshotResponse = await fetch(api('/command'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'screenshot', params: { width: 640 }, wait: true }),
  });
  const screenshot = await screenshotResponse.json();
  check(screenshotResponse.ok && String(screenshot.result?.dataUrl || '').startsWith('data:image/jpeg'), 'comando screenshot devuelve JPEG');

  check(errors.length === 0, `sin errores de consola (${errors.length})`);
  if (errors.length) notes.push(...errors.map((error) => `  ${error}`));
} catch (error) {
  failures.push(`Excepción: ${error?.message || error}`);
  notes.push(`FAIL Excepción: ${error?.stack || error}`);
  try { await page.screenshot({ path: path.join(SHOTS, 'new-failure.png') }); } catch { /* sin captura */ }
} finally {
  await browser.close();
}

console.log(notes.join('\n'));
if (failures.length) {
  console.error(`\n${failures.length} fallo(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('\nTodas las comprobaciones nuevas pasaron.');
