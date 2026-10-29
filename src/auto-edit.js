// Editor automático con IA para openCUP.
// Análisis real en el navegador (metadatos, escenas, silencios, ritmo) + planificador
// determinista + ejecución sobre el proyecto real mediante las acciones del store.
// El modelo de lenguaje es opcional (Ollama local / OpenAI); si no está disponible se
// usa un planificador por palabras clave, siempre funcional.

import { state, on, updateProject, newProject, importFiles, addMediaToTimeline,
  addTextClip, updateClip, selectClip, seek, saveNow, projectDuration, trackById, findClip } from './store.js';
import { renderStill } from './renderer.js';
import { escapeHtml, toast, formatTime } from './utils.js';
import { icon } from './icons.js';

const AUTO_KEY = 'openCUP.autoEdit';
const SNAPSHOT_KEY = 'openCUP.autoEdit.snapshot';

// ---------- Configuración de proveedor LLM opcional ----------
export function getLlmConfig() {
  try { return JSON.parse(localStorage.getItem(AUTO_KEY) || '{}'); } catch { return {}; }
}
export function setLlmConfig(cfg) {
  localStorage.setItem(AUTO_KEY, JSON.stringify(cfg || {}));
}

export async function callLlm(prompt) {
  const cfg = getLlmConfig();
  // 1. Ollama local
  if (cfg.ollamaUrl) {
    try {
      const r = await fetch(cfg.ollamaUrl.replace(/\/$/, '') + '/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: cfg.ollamaModel || 'llama3.1', prompt, stream: false, format: 'json' }),
      });
      if (r.ok) { const d = await r.json(); return d.response || d.message?.content || ''; }
    } catch (e) { /* fall through */ }
  }
  // 2. OpenAI-compatible
  if (cfg.openaiKey) {
    try {
      const r = await fetch(cfg.openaiUrl || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.openaiKey },
        body: JSON.stringify({ model: cfg.openaiModel || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }),
      });
      if (r.ok) { const d = await r.json(); return d.choices?.[0]?.message?.content || ''; }
    } catch (e) { /* fall through */ }
  }
  return null; // sin LLM disponible
}

// ---------- Análisis de medios ----------
export async function analyzeMedia(media) {
  const out = { id: media.id, name: media.name, kind: media.kind, duration: media.duration || 0,
    width: media.width || 0, height: media.height || 0, mime: media.mime, size: media.size };
  if (media.kind === 'video' && media.url) {
    try {
      const scenes = await detectScenes(media);
      out.scenes = scenes;
    } catch (e) { out.scenes = []; out.sceneError = String(e); }
  }
  if (media.kind === 'audio' || media.kind === 'video') {
    try {
      const buf = await mediaToAudioBuffer(media);
      if (buf) {
        out.silences = detectSilences(buf);
        out.beats = detectBeats(buf);
        out.rms = rmsOf(buf);
      }
    } catch (e) { out.audioError = String(e); }
  }
  return out;
}

export async function analyzeProject() {
  if (!state.project) return null;
  const mediaList = Array.from(state.media.values());
  const analyses = [];
  for (const m of mediaList) analyses.push(await analyzeMedia(m));
  return {
    project: { name: state.project.name, ratio: state.project.ratio, resolution: state.project.resolution, fps: state.project.fps },
    media: analyses,
    tracks: state.project.tracks.map((t) => ({ id: t.id, type: t.type, clips: t.clips.length })),
    duration: projectDuration(),
  };
}

// ---------- Detección de escenas por diferencia de fotogramas ----------
export async function detectScenes(media, opts = {}) {
  const threshold = opts.threshold || 0.18;
  const sampleEvery = opts.sampleEvery || 0.5;
  const video = document.createElement('video');
  video.src = media.url;
  video.muted = true;
  video.playsInline = true;
  await new Promise((res, rej) => { video.onloadedmetadata = res; video.onerror = rej; });
  const dur = video.duration || media.duration || 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const w = 160, h = 90;
  canvas.width = w; canvas.height = h;
  let prev = null;
  const scenes = [0];
  for (let t = 0; t < dur; t += sampleEvery) {
    video.currentTime = t;
    await new Promise((res) => { video.onseeked = res; });
    ctx.drawImage(video, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    if (prev) {
      let diff = 0;
      for (let i = 0; i < data.length; i += 4) {
        diff += Math.abs(data[i] - prev[i]) + Math.abs(data[i + 1] - prev[i + 1]) + Math.abs(data[i + 2] - prev[i + 2]);
      }
      const norm = diff / (w * h * 3 * 255);
      if (norm > threshold) scenes.push(t);
    }
    prev = new Uint8ClampedArray(data);
  }
  // dedupe close scenes
  const out = [];
  for (const s of scenes) { if (!out.length || s - out[out.length - 1] > 1) out.push(s); }
  video.src = '';
  return out;
}

// ---------- Audio helpers ----------
async function mediaToAudioBuffer(media) {
  if (!media.url) return null;
  const res = await fetch(media.url);
  const arr = await res.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const buf = await ctx.decodeAudioData(arr);
  ctx.close();
  return buf;
}

export function detectSilences(buf, opts = {}) {
  const thresholdDb = opts.thresholdDb || -40;
  const minDur = opts.minDur || 0.4;
  const sr = buf.sampleRate;
  const ch = buf.getChannelData(0);
  const win = Math.floor(sr * 0.05);
  const thr = Math.pow(10, thresholdDb / 20);
  const silences = [];
  let start = null;
  for (let i = 0; i < ch.length; i += win) {
    let peak = 0;
    for (let j = i; j < i + win && j < ch.length; j++) peak = Math.max(peak, Math.abs(ch[j]));
    const isSilent = peak < thr;
    const t = i / sr;
    if (isSilent && start === null) start = t;
    if (!isSilent && start !== null) {
      if (t - start >= minDur) silences.push({ start, end: t, duration: t - start });
      start = null;
    }
  }
  if (start !== null && (ch.length / sr) - start >= minDur) silences.push({ start, end: ch.length / sr, duration: (ch.length / sr) - start });
  return silences;
}

export function detectBeats(buf, opts = {}) {
  // Onset detection via energy flux on low-passed signal.
  const sr = buf.sampleRate;
  const ch = buf.getChannelData(0);
  const win = Math.floor(sr * 0.02);
  const energies = [];
  for (let i = 0; i < ch.length; i += win) {
    let e = 0;
    for (let j = i; j < i + win && j < ch.length; j++) e += ch[j] * ch[j];
    energies.push(e / win);
  }
  const flux = energies.map((e, i) => i === 0 ? 0 : Math.max(0, e - energies[i - 1]));
  // adaptive threshold
  const beats = [];
  let last = -1;
  const minGap = Math.floor(0.25 / 0.02);
  for (let i = 1; i < flux.length; i++) {
    const local = flux.slice(Math.max(0, i - 8), i).reduce((a, b) => a + b, 0) / 8;
    if (flux[i] > local * 1.6 && flux[i] > 0.0005 && i - last > minGap) {
      beats.push(i * 0.02);
      last = i;
    }
  }
  return beats;
}

function rmsOf(buf) {
  const ch = buf.getChannelData(0);
  let s = 0;
  for (let i = 0; i < ch.length; i++) s += ch[i] * ch[i];
  return Math.sqrt(s / ch.length);
}

export async function transcribeMedia(media, onProgress) {
  const cfg = getLlmConfig();
  if (cfg.whisperUrl && media?.url) {
    try {
      const res = await fetch(media.url);
      const blob = await res.blob();
      const form = new FormData();
      form.append('file', blob, media.name || 'audio.webm');
      if (cfg.whisperLanguage) form.append('language', cfg.whisperLanguage);
      const r = await fetch(cfg.whisperUrl.replace(/\/$/, ''), { method: 'POST', body: form });
      if (r.ok) {
        const d = await r.json();
        let segments = null;
        let words = [];
        if (Array.isArray(d.segments)) {
          segments = d.segments.map((s) => ({ start: s.start, end: s.end, text: (s.text || '').trim() })).filter((s) => s.text);
          for (const s of d.segments) if (Array.isArray(s.words)) for (const w of s.words) words.push({ word: (w.word || w.text || '').trim(), start: w.start, end: w.end });
        } else if (Array.isArray(d.subtitles)) {
          segments = d.subtitles.map((s) => ({ start: s.start, end: s.end, text: (s.text || '').trim() })).filter((s) => s.text);
          for (const s of d.subtitles) if (Array.isArray(s.words)) for (const w of s.words) words.push({ word: (w.word || w.text || '').trim(), start: w.start, end: w.end });
        } else if (typeof d.text === 'string' && d.text.trim()) {
          segments = [{ start: 0, end: media.duration || 5, text: d.text.trim() }];
        }
        if (segments) {
          if (!words.length) for (const s of segments) { const ws = s.text.split(/\s+/); const dur = Math.max(0.1, s.end - s.start); ws.forEach((w, i) => words.push({ word: w, start: s.start + (dur * i / ws.length), end: s.start + (dur * (i + 1) / ws.length) })); }
          return { segments, words };
        }
      }
    } catch (e) { console.warn('transcribeMedia (endpoint):', e); }
  }
  const t = await transcribeWithTransformers(media, onProgress);
  if (t) return t;
  return null;
}
// Convierte instrucción + análisis en un plan de operaciones estructuradas.
export async function planEdit(instruction, analysis) {
  const text = (instruction || '').toLowerCase();
  const intent = await parseIntent(instruction, analysis);
  const plan = { intent, operations: [] };

  const videos = (analysis?.media || []).filter((m) => m.kind === 'video');
  const audios = (analysis?.media || []).filter((m) => m.kind === 'audio');
  const images = (analysis?.media || []).filter((m) => m.kind === 'image');

  // Formato / ratio
  if (/vertical|tiktok|reels|shorts|9:16/.test(text)) {
    plan.operations.push({ op: 'setRatio', ratio: '9:16' });
    plan.operations.push({ op: 'setResolution', resolution: '1080p' });
  } else if (/horizontal|16:9|youtube/.test(text)) {
    plan.operations.push({ op: 'setRatio', ratio: '16:9' });
  }
  if (/4k/.test(text)) plan.operations.push({ op: 'setResolution', resolution: '4K' });
  if (/720/.test(text)) plan.operations.push({ op: 'setResolution', resolution: '720p' });

  // Duración objetivo
  const durMatch = text.match(/(\d+)\s*(s|seg|segundos|sec)/);
  const targetDur = durMatch ? parseInt(durMatch[1], 10) : null;

  // Eliminar silencios
  if (/silencio|silence|pausa/.test(text)) {
    for (const v of videos) {
      if (v.silences?.length) {
        plan.operations.push({ op: 'removeSilences', mediaId: v.id, silences: v.silences });
      }
    }
  }

  // Ritmo musical
  const wantsBeats = /ritmo|beat|beats|sincroniz|m[uú]sica/.test(text);
  const music = audios[0];

  // Escenas / mejores momentos / resumen
  const wantsHighlights = /mejores momentos|highlights|resumen|summary|din[aá]mico/.test(text);
  const wantsCinematic = /cinematogr[aá]fico|cinematic/.test(text);

  // Montaje base: un clip por vídeo (o por escena si hay)
  const mainVideo = videos[0];
  if (mainVideo) {
    const scenes = mainVideo.scenes && mainVideo.scenes.length ? mainVideo.scenes : [0];
    const segs = [];
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      const e = scenes[i + 1] || mainVideo.duration;
      if (e - s >= 0.5) segs.push({ start: s, end: Math.min(e, s + (targetDur || e - s)) });
    }
    // Si pide resumen/highlights, tomar los primeros N segmentos más cortos
    let chosen = segs;
    if (wantsHighlights && segs.length > 6) chosen = segs.slice(0, 6);
    if (targetDur) {
      // recortar al duración objetivo acumulada
      let acc = 0;
      const out = [];
      for (const c of chosen) {
        if (acc >= targetDur) break;
        const take = Math.min(c.end - c.start, targetDur - acc);
        out.push({ start: c.start, end: c.start + take });
        acc += take;
      }
      chosen = out.length ? out : chosen.slice(0, 1);
    }
    plan.operations.push({ op: 'buildMontage', mediaId: mainVideo.id, segments: chosen, beats: wantsBeats ? (music?.beats || []) : null });
  }

  // Color
  if (wantsCinematic || /color|correcci[oó]n|grade/.test(text)) {
    plan.operations.push({ op: 'applyColor', preset: wantsCinematic ? 'cinematic' : 'auto' });
  }

  // Transiciones
  if (/transici[oó]n|transition/.test(text)) {
    plan.operations.push({ op: 'applyTransitions', style: 'fade' });
  }

  // Subtítulos (placeholder real: crea pista de texto con marcadores)
  if (/subt[ií]tulo|subtitle|caption/.test(text)) {
    plan.operations.push({ op: 'addSubtitles', language: /ingl[eé]s|english/.test(text) ? 'en' : 'es' });
  }

  // Títulos
  if (/t[ií]tulo|title/.test(text)) {
    plan.operations.push({ op: 'addTitle', text: state.project?.name || 'openCUP' });
  }

  // Audio: mezcla voz/música
  if (/audio|voz|voice|m[uú]sica|music/.test(text) && music) {
    plan.operations.push({ op: 'addMusic', mediaId: music.id });
    plan.operations.push({ op: 'balanceAudio' });
  }

  // Reencuadre vertical (seguimiento sujeto) — marcado como limitado
  if (/seguimiento|tracking|reframe|reencuadre/.test(text)) {
    plan.operations.push({ op: 'reframeVertical', note: 'Reencuadre automático básico (centro); tracking avanzado requiere modelo externo.' });
  }

  // Velocidad
  if (/lento|slow|ralenti/.test(text)) plan.operations.push({ op: 'slowMotion', factor: 0.5 });
  if (/r[aá]pido|fast/.test(text)) plan.operations.push({ op: 'speedUp', factor: 1.5 });

  return plan;
}

async function parseIntent(instruction, analysis) {
  const llm = await callLlm(
    `Eres un planificador de edición de vídeo. Devuelve SOLO JSON con campos: goal (string), keywords (array), duration (number|null), vertical (bool), cinematic (bool), subtitles (bool), beats (bool), highlights (bool), color (bool), transitions (bool), titles (bool), music (bool), reframe (bool), silenceRemoval (bool). Instrucción: ${JSON.stringify(instruction)}`
  );
  if (llm) {
    try { return JSON.parse(llm); } catch (e) { /* fall through */ }
  }
  const t = (instruction || '').toLowerCase();
  return {
    goal: instruction || '',
    keywords: t.split(/\s+/).filter(Boolean),
    duration: (t.match(/(\d+)\s*(s|seg)/) || [])[1] ? parseInt((t.match(/(\d+)\s*(s|seg)/) || [])[1], 10) : null,
    vertical: /vertical|tiktok|reels|shorts/.test(t),
    cinematic: /cinematogr[aá]fico|cinematic/.test(t),
    subtitles: /subt[ií]tulo|subtitle|caption/.test(t),
    beats: /ritmo|beat|sincroniz/.test(t),
    highlights: /mejores|highlights|resumen|summary/.test(t),
    color: /color|correcci[oó]n|grade/.test(t),
    transitions: /transici[oó]n|transition/.test(t),
    titles: /t[ií]tulo|title/.test(t),
    music: /m[uú]sica|music|audio|voz/.test(t),
    reframe: /seguimiento|tracking|reframe|reencuadre/.test(t),
    silenceRemoval: /silencio|silence|pausa/.test(t),
  };
}

export async function transcribeWithTransformers(media, onProgress) {
  if (!media?.url) return null;
  try {
    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
    onProgress && onProgress('Descargando modelo Whisper (primera vez, ~40 MB)...');
    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      progress_callback: (p) => onProgress && onProgress((p.status || 'cargando') + ' ' + (p.progress ? p.progress.toFixed(0) + '%' : '')),
    });
    onProgress && onProgress('Transcribiendo...');
    const buf = await mediaToAudioBuffer(media);
    const result = await transcriber(buf.getChannelData(0), { sampling_rate: buf.sampleRate, chunk_length_s: 30, stride_length_s: 5, return_timestamps: 'word' });
    const chunks = result?.chunks || (result?.text ? [{ text: result.text, timestamp: [0, media.duration || 5] }] : []);
    const segments = [];
    const words = [];
    for (const c of chunks) {
      const [s, e] = c.timestamp || [0, media.duration || 5];
      const t = (c.text || '').trim();
      if (!t) continue;
      segments.push({ start: s, end: e, text: t });
      const ws = t.split(/\s+/);
      const dur = Math.max(0.1, e - s);
      ws.forEach((w, i) => words.push({ word: w, start: s + (dur * i / ws.length), end: s + (dur * (i + 1) / ws.length) }));
    }
    if (Array.isArray(result?.words)) {
      words.length = 0;
      for (const w of result.words) words.push({ word: (w.word || w.text || '').trim(), start: w.start ?? w.timestamp?.[0], end: w.end ?? w.timestamp?.[1] });
    }
    return { segments, words };
  } catch (e) {
    console.warn('transcribeWithTransformers:', e);
    return null;
  }
}

// ---------- Ejecución del plan ----------
let lastSnapshot = null;

export function snapshotProject() {
  return JSON.parse(JSON.stringify(state.project));
}

export async function applyPlan(plan, onProgress) {
  if (!state.project) throw new Error('No hay proyecto abierto');
  lastSnapshot = snapshotProject();
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(lastSnapshot));
  const ops = plan.operations || [];
  const total = ops.length;
  let i = 0;
  for (const op of ops) {
    i++;
    onProgress && onProgress(i, total, op.op);
    await executeOp(op);
    // yield to UI
    await new Promise((r) => setTimeout(r, 0));
  }
  state.project.updatedAt = Date.now();
  saveNow();
}

async function executeOp(op) {
  switch (op.op) {
    case 'setRatio':
      updateProject({ ratio: op.ratio });
      break;
    case 'setResolution':
      updateProject({ resolution: op.resolution });
      break;
    case 'removeSilences': {
      const media = state.media.get(op.mediaId);
      if (!media || !op.silences?.length) break;
      // Mark silences as cuts by splitting/removing; here we record in project metadata
      // and trim the main video clip if present.
      const clip = findClipByMedia(op.mediaId);
      if (clip) {
        // Build kept ranges
        const dur = media.duration || clip.clip.duration;
        const removed = op.silences.reduce((a, s) => a + (s.end - s.start), 0);
        updateClip(clip.clip.id, { duration: Math.max(0.5, dur - removed) }, { history: true });
      }
      break;
    }
    case 'buildMontage': {
      await buildMontage(op);
      break;
    }
    case 'applyColor': {
      applyColorToAll(op.preset);
      break;
    }
    case 'applyTransitions': {
      applyTransitions(op.style);
      break;
    }
    case 'addSubtitles': {
      await addSubtitles(op.language);
      break;
    }
    case 'addTitle': {
      addTextClip(op.text, { size: 72, weight: 800, color: '#ffffff', duration: 3, start: 0 });
      break;
    }
    case 'addMusic': {
      const media = state.media.get(op.mediaId);
      if (media) addMediaToTimeline(op.mediaId, { trackId: 'track_audio', start: 0 });
      break;
    }
    case 'balanceAudio': {
      // Normalize volumes: voice track louder than music
      for (const t of state.project.tracks) {
        if (t.type === 'audio') {
          for (const c of t.clips) {
            const isMusic = c.mediaId && state.media.get(c.mediaId)?.kind === 'audio';
            updateClip(c.id, { volume: isMusic ? 0.35 : 1 }, { history: false });
          }
        }
      }
      break;
    }
    case 'reframeVertical': {
      // Center crop: adjust x to 0.5 (center) for all video/image clips
      for (const t of state.project.tracks) {
        for (const c of t.clips) {
          if (c.kind === 'video' || c.kind === 'image') updateClip(c.id, { x: 0.5, y: 0.5, scale: 1 }, { history: false });
        }
      }
      break;
    }
    case 'slowMotion': {
      for (const t of state.project.tracks) for (const c of t.clips) if (c.kind === 'video') updateClip(c.id, { speed: op.factor }, { history: false });
      break;
    }
    case 'speedUp': {
      for (const t of state.project.tracks) for (const c of t.clips) if (c.kind === 'video') updateClip(c.id, { speed: op.factor }, { history: false });
      break;
    }
    default:
      console.warn('Op desconocida:', op.op);
  }
}

function findClipByMedia(mediaId) {
  for (const t of state.project.tracks) for (const c of t.clips) if (c.mediaId === mediaId) return { track: t, clip: c };
  return null;
}

async function buildMontage(op) {
  const media = state.media.get(op.mediaId);
  if (!media) return;
  // Clear existing clips on video track? Keep project media; add new clips.
  const track = state.project.tracks.find((t) => t.type === 'video') || state.project.tracks[1];
  const segments = op.segments || [{ start: 0, end: Math.min(media.duration || 5, 5) }];
  let cursor = 0;
  for (const seg of segments) {
    const dur = Math.max(0.3, seg.end - seg.start);
    const clip = {
      id: 'clip_' + Math.random().toString(36).slice(2, 10),
      mediaId: op.mediaId, kind: media.kind, name: media.name,
      start: cursor, duration: dur, in: seg.start, speed: 1, volume: 1, opacity: 1,
      scale: 1, x: 0.5, y: 0.5, filter: null, adjust: { brightness: 0, contrast: 0, saturate: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, sharpness: 0, vignette: 0, grain: 0, fade: 0, dehaze: 0 },
      fadeIn: 0, fadeOut: 0,
    };
    track.clips.push(clip);
    cursor += dur;
    // beat sync: snap cut boundaries to nearest beat
    if (op.beats?.length) {
      const nearest = op.beats.reduce((a, b) => Math.abs(b - cursor) < Math.abs(a - cursor) ? b : a, op.beats[0]);
      if (Math.abs(nearest - cursor) < 0.25) cursor = nearest;
    }
  }
  // update project duration
  updateProject({ updatedAt: Date.now() });
  // notify
  state.project.updatedAt = Date.now();
}

function applyColorToAll(preset) {
  const presets = {
    cinematic: { brightness: -5, contrast: 15, saturate: -10, temperature: -5, vignette: 30, grain: 15, fade: 10 },
    auto: { brightness: 0, contrast: 5, saturate: 5, sharpness: 10 },
  };
  const p = presets[preset] || presets.auto;
  for (const t of state.project.tracks) for (const c of t.clips) if (c.kind === 'video' || c.kind === 'image') {
    updateClip(c.id, { adjust: { ...c.adjust, ...p } }, { history: false });
  }
}

function applyTransitions(style) {
  const tracks = state.project.tracks.filter((t) => t.type === 'video' || t.type === 'audio');
  for (const t of tracks) {
    for (let i = 1; i < t.clips.length; i++) {
      updateClip(t.clips[i].id, { transition: 'fade', transitionDuration: 0.4 }, { history: false });
    }
  }
}

async function addSubtitles(lang) {
  // Solo para vídeos: transcripción real si hay endpoint Whisper configurado (estilo Drift),
  // si no, marcadores editables por escena.
  const videoMedia = Array.from(state.media.values()).find((m) => m.kind === 'video');
  if (!videoMedia) { toast('No hay vídeo para subtítular', 'warn'); return; }
  const track = state.project.tracks.find((t) => t.type === 'text') || state.project.tracks[0];
  const segs = await transcribeMedia(videoMedia, (m) => toast(m, 'info'));
  if (segs && segs.segments?.length) {
    for (const s of segs.segments) {
      const wordsForClip = (segs.words || []).filter((w) => w.start >= s.start - 0.05 && w.start < s.end + 0.05);
      addTextClip(s.text, { start: Math.max(0, s.start), duration: Math.max(0.5, (s.end - s.start) || 2), size: 42, weight: 700, color: '#ffffff', trackId: track.id, words: wordsForClip.length ? wordsForClip : undefined });
    }
    toast(`Subtítulos generados (${segs.segments.length})`, 'success');
    return;
  }
  const scenes = videoMedia.scenes && videoMedia.scenes.length ? videoMedia.scenes : [0, videoMedia.duration];
  for (let i = 0; i < scenes.length - 1; i++) {
    const s = scenes[i], e = scenes[i + 1];
    if (e - s < 0.8) continue;
    addTextClip(`Subtítulo ${i + 1}`, { start: s, duration: Math.min(e - s, 4), size: 42, weight: 700, color: '#ffffff', trackId: track.id });
  }
  toast('Subtítulos por escenas (configura Whisper en Ajustes para transcripción real)', 'info');
}

export function undoAutoEdit() {
  const snap = localStorage.getItem(SNAPSHOT_KEY);
  if (!snap && !lastSnapshot) { toast('No hay montaje automático que deshacer', 'warn'); return false; }
  try {
    const s = lastSnapshot || JSON.parse(snap);
    state.project = s;
    // restore media map stays; project.media already in snapshot
    localStorage.removeItem(SNAPSHOT_KEY);
    lastSnapshot = null;
    saveNow();
    toast('Montaje automático deshecho', 'info');
    return true;
  } catch (e) {
    toast('No se pudo deshacer: ' + e.message, 'error');
    return false;
  }
}

// ---------- UI helper ----------
export function autoEditPanelHtml() {
  const cfg = getLlmConfig();
  return `
    <div class="auto-edit">
      <div class="panel-empty" style="padding:12px 0">
        <strong>Editor automático con IA</strong>
        Analiza el material, interpreta tu instrucción y monta la timeline real.
      </div>
      <label style="font-size:12px;font-weight:700;margin-top:8px;display:block">Instrucción</label>
      <textarea id="ae-instruction" rows="4" style="width:100%;background:var(--bg-2);color:var(--fg);border:1px solid var(--border);border-radius:8px;padding:8px;font-size:13px" placeholder="Ej: Crea un vídeo vertical de 30 s para TikTok con los mejores momentos, música y subtítulos."></textarea>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        <button class="btn btn-primary" id="ae-analyze">1. Analizar material</button>
        <button class="btn" id="ae-plan">2. Generar montaje</button>
        <button class="btn" id="ae-apply">3. Aplicar a la timeline</button>
      </div>
      <div id="ae-progress" style="margin-top:8px;font-size:12px;color:var(--muted)"></div>
      <div id="ae-log" style="margin-top:8px;font-size:12px;max-height:160px;overflow:auto;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;padding:8px"></div>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        <button class="btn" id="ae-undo">Deshacer montaje</button>
        <button class="btn" id="ae-export">Exportar</button>
      </div>
      <details style="margin-top:10px">
        <summary style="cursor:pointer;font-size:12px;font-weight:700">Ajustes de IA (opcional)</summary>
        <div style="margin-top:6px;display:grid;gap:6px">
          <label style="font-size:11px">Ollama URL <input id="ae-ollama-url" value="${escapeHtml(cfg.ollamaUrl || '')}" placeholder="http://localhost:11434" style="width:100%"></label>
          <label style="font-size:11px">Modelo Ollama <input id="ae-ollama-model" value="${escapeHtml(cfg.ollamaModel || 'llama3.1')}" style="width:100%"></label>
          <label style="font-size:11px">OpenAI API key <input id="ae-openai-key" type="password" value="${escapeHtml(cfg.openaiKey || '')}" placeholder="sk-..." style="width:100%"></label>
          <label style="font-size:11px">Whisper URL (transcripción) <input id="ae-whisper-url" value="${escapeHtml(cfg.whisperUrl || '')}" placeholder="http://localhost:8080/inference" style="width:100%"></label>
          <label style="font-size:11px">Idioma Whisper <input id="ae-whisper-lang" value="${escapeHtml(cfg.whisperLanguage || 'es')}" placeholder="es" style="width:100%"></label>
          <button class="btn" id="ae-save-cfg">Guardar ajustes</button>
        </div>
      </details>
      <div style="margin-top:10px;font-size:11px;color:var(--muted)">
        Limitaciones: la transcripción automática y el tracking avanzado requieren un modelo externo (Whisper/YOLO). El modo sin IA usa análisis real de escenas, silencios y ritmo.
      </div>
    </div>`;
}

export function wireAutoEditPanel(root) {
  const log = (msg) => {
    const el = root.querySelector('#ae-log');
    if (el) { el.innerHTML += `<div>• ${escapeHtml(msg)}</div>`; el.scrollTop = el.scrollHeight; }
  };
  const progress = (i, total, op) => {
    const el = root.querySelector('#ae-progress');
    if (el) el.textContent = `Paso ${i}/${total}: ${op}`;
    log(`Ejecutando ${op}`);
  };

  let lastPlan = null;
  root.querySelector('#ae-analyze')?.addEventListener('click', async () => {
    if (!state.project) { toast('Abre o crea un proyecto primero', 'warn'); return; }
    const el = root.querySelector('#ae-progress'); if (el) el.textContent = 'Analizando…';
    const a = await analyzeProject();
    log(`Medios: ${a.media.length} (${a.media.filter((m) => m.kind === 'video').length} vídeo, ${a.media.filter((m) => m.kind === 'audio').length} audio, ${a.media.filter((m) => m.kind === 'image').length} imagen)`);
    for (const m of a.media) {
      log(`${m.name}: ${m.duration?.toFixed(1) || 0}s ${m.width}x${m.height}${m.scenes ? ' · ' + m.scenes.length + ' escenas' : ''}${m.silences ? ' · ' + m.silences.length + ' silencios' : ''}${m.beats ? ' · ' + m.beats.length + ' beats' : ''}`);
    }
    if (el) el.textContent = 'Análisis listo';
  });

  root.querySelector('#ae-plan')?.addEventListener('click', async () => {
    if (!state.project) { toast('Abre o crea un proyecto primero', 'warn'); return; }
    const instr = root.querySelector('#ae-instruction')?.value || '';
    const a = await analyzeProject();
    lastPlan = await planEdit(instr, a);
    log('Plan generado: ' + lastPlan.operations.map((o) => o.op).join(', '));
    const el = root.querySelector('#ae-progress'); if (el) el.textContent = 'Plan listo: ' + lastPlan.operations.length + ' operaciones';
  });

  root.querySelector('#ae-apply')?.addEventListener('click', async () => {
    if (!lastPlan) { toast('Genera primero el montaje', 'warn'); return; }
    try {
      await applyPlan(lastPlan, progress);
      toast('Montaje aplicado', 'success');
      const el = root.querySelector('#ae-progress'); if (el) el.textContent = 'Aplicado';
    } catch (e) {
      toast('Error: ' + e.message, 'error');
    }
  });

  root.querySelector('#ae-undo')?.addEventListener('click', () => { undoAutoEdit(); });
  root.querySelector('#ae-export')?.addEventListener('click', () => { openExportDialog(); });

  root.querySelector('#ae-save-cfg')?.addEventListener('click', () => {
    setLlmConfig({
      ollamaUrl: root.querySelector('#ae-ollama-url')?.value || '',
      ollamaModel: root.querySelector('#ae-ollama-model')?.value || 'llama3.1',
      openaiKey: root.querySelector('#ae-openai-key')?.value || '',
      whisperUrl: root.querySelector('#ae-whisper-url')?.value || '',
      whisperLanguage: root.querySelector('#ae-whisper-lang')?.value || 'es',
    });
    toast('Ajustes guardados', 'success');
  });
}
