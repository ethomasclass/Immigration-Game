// ============================================================================
// AUDIO: voiceover + ambience
// Voice lines: assets/audio/vo/<lineId>.mp3  (from ElevenLabs)
// Ambience:    assets/audio/amb_<zone>.mp3   (optional; otherwise synthesized)
// ============================================================================
import { state } from '../state.js';
import { CHARACTERS } from '../data/characters.js';

const missing = new Set();
let current = null;
let ctx = null;
let ambNodes = null;
let ambEl = null;

function plain(text) { return String(text).replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (m, a) => a); }

export function stopVoice() {
  if (current) { current.pause(); current = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export function playVoice(id, text, who) {
  stopVoice();
  const vol = state.settings.vo;
  if (vol <= 0) return;
  const fallback = () => {
    if (!state.settings.tts || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(plain(text));
    const c = CHARACTERS[who] || {};
    u.rate = 0.95; u.volume = vol;
    u.pitch = (c.height && c.height < 1.4) ? 1.4 : (/woman|girl/i.test(c.voice || '') ? 1.15 : 0.9);
    speechSynthesis.speak(u);
  };
  if (missing.has(id)) return fallback();
  const a = new Audio(`assets/audio/vo/${id}.mp3`);
  a.volume = vol;
  current = a;
  a.addEventListener('error', () => { missing.add(id); if (current === a) { current = null; fallback(); } }, { once: true });
  a.play().catch(() => {});
}

// ---------------- ambience ----------------
function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function brownNoise(c) {
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  const src = c.createBufferSource(); src.buffer = buf; src.loop = true; return src;
}

const PRESETS = {
  ship:   { freq: 260, q: 0.7, gain: 0.55, lfo: 0.12, lfoAmt: 0.35 },
  castle: { freq: 700, q: 0.5, gain: 0.35, lfo: 0.2, lfoAmt: 0.25 },
  les:    { freq: 900, q: 0.4, gain: 0.3, lfo: 0.5, lfoAmt: 0.1 },
  city:   { freq: 1100, q: 0.4, gain: 0.3, lfo: 0.4, lfoAmt: 0.1 },
};

export function startAmbience(zone) {
  stopAmbience();
  const vol = state.settings.amb;
  // Try a real recording first.
  const el = new Audio(`assets/audio/amb_${zone}.mp3`);
  el.loop = true; el.volume = vol;
  let usedFile = false;
  el.addEventListener('canplaythrough', () => { if (ambEl === el) { usedFile = true; killSynth(); el.play().catch(() => {}); } }, { once: true });
  el.addEventListener('error', () => {}, { once: true });
  ambEl = el;
  el.load();
  // Synth fallback right away (killed if the file loads).
  const c = ensureCtx(); if (!c || usedFile) return;
  const p = PRESETS[zone] || PRESETS.les;
  const src = brownNoise(c);
  const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = p.freq; filt.Q.value = p.q;
  const g = c.createGain(); g.gain.value = p.gain * vol;
  const lfo = c.createOscillator(); lfo.frequency.value = p.lfo;
  const lg = c.createGain(); lg.gain.value = p.gain * vol * p.lfoAmt;
  lfo.connect(lg); lg.connect(g.gain);
  src.connect(filt); filt.connect(g); g.connect(c.destination);
  src.start(); lfo.start();
  ambNodes = { src, lfo, g };
}

function killSynth() {
  if (!ambNodes) return;
  try { ambNodes.src.stop(); ambNodes.lfo.stop(); ambNodes.g.disconnect(); } catch {}
  ambNodes = null;
}

export function stopAmbience() {
  killSynth();
  if (ambEl) { ambEl.pause(); ambEl = null; }
}

export function setAmbienceVolume(v) {
  if (ambEl) ambEl.volume = v;
  if (ambNodes) ambNodes.g.gain.value = 0.4 * v;
}

/** Short synthesized sounds: 'shutter', 'flash', 'train', 'page' */
export function sfx(name, opt = {}) {
  const c = ensureCtx(); if (!c) return;
  const t = c.currentTime;
  const vol = Math.max(0.15, state.settings.amb) * (opt.vol ?? 1);
  const noise = (type, freq, peak, dur, q = 1, at = t) => {
    const src = brownNoise(c), f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(peak * vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    src.connect(f); f.connect(g); g.connect(c.destination); src.start(at); src.stop(at + dur + 0.05); return f;
  };
  const tone = (type, f0, f1, peak, dur, at = t) => {
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, at); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, at + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak * vol, at + 0.02); g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    o.connect(g); g.connect(c.destination); o.start(at); o.stop(at + dur + 0.05);
  };
  switch (name) {
    case 'step': {   // footsteps: boards knock, paving clicks, grass and gravel hush
      const k = opt.surface || 'stone', j = 0.9 + Math.random() * 0.2;
      if (k === 'wood') { noise('lowpass', 210 * j, 0.9, 0.11, 2); noise('bandpass', 900 * j, 0.12, 0.04, 3); }
      else if (k === 'grass') noise('highpass', 2600 * j, 0.22, 0.1);
      else { noise('bandpass', 1500 * j, 0.3, 0.05, 2.5); noise('lowpass', 300, 0.35, 0.06); }
      return;
    }
    case 'wings': for (let i = 0; i < 9; i++) noise('bandpass', 1400 + Math.random() * 900, 0.5 - i * 0.04, 0.05, 1.5, t + i * 0.07 + Math.random() * 0.02); return;
    case 'gull': for (let i = 0; i < 3; i++) tone('sawtooth', 1500 - i * 60, 1050, 0.05, 0.22, t + i * 0.3); return;
    case 'horn': tone('sawtooth', 98, 96, 0.16, 2.2); tone('sawtooth', 147, 145, 0.08, 2.2); return;
    case 'hoof': for (let i = 0; i < 6; i++) noise('bandpass', 1100 + (i % 2) * 300, 0.3, 0.045, 4, t + i * 0.19 + (i % 2) * 0.05); return;
    case 'bell': tone('sine', 523, 523, 0.14, 2.4); tone('sine', 1046, 1046, 0.05, 1.6); tone('sine', 1569, 1569, 0.02, 0.9); return;
    case 'creak': { const f = noise('bandpass', 260, 0.5, 1.1, 9); f.frequency.linearRampToValueAtTime(420, t + 1.0); return; }
    case 'murmur': for (let i = 0; i < 5; i++) noise('bandpass', 380 + Math.random() * 500, 0.16, 0.28, 3, t + i * 0.22 + Math.random() * 0.1); return;
    case 'success': [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.16, 0.5, t + i * 0.09)); return;
    case 'find': [784, 988, 1318].forEach((f, i) => tone('sine', f, f, 0.14, 0.7, t + i * 0.07)); return;
    case 'print': noise('highpass', 1800, 0.35, 0.5); tone('sine', 880, 880, 0.05, 0.25, t + 0.35); return;
  }
  if (name === 'shutter' || name === 'page') {
    const src = brownNoise(c);
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = name === 'page' ? 1500 : 2500;
    const g = c.createGain(); g.gain.setValueAtTime(0.8 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + (name === 'page' ? 0.25 : 0.12));
    src.connect(f); f.connect(g); g.connect(c.destination); src.start(t); src.stop(t + 0.3);
  } else if (name === 'flash') {
    const src = brownNoise(c);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 400;
    const g = c.createGain(); g.gain.setValueAtTime(1.5 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    src.connect(f); f.connect(g); g.connect(c.destination); src.start(t); src.stop(t + 0.7);
  } else if (name === 'train') {
    const src = brownNoise(c);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    const g = c.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(1.6 * vol, t + 1.5); g.gain.exponentialRampToValueAtTime(0.001, t + 5);
    src.connect(f); f.connect(g); g.connect(c.destination); src.start(t); src.stop(t + 5.2);
  } else if (name === 'chime') {
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(880, t + 0.12);
    const g = c.createGain(); g.gain.setValueAtTime(0.18 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.7);
  }
}

export function unlockAudio() { ensureCtx(); }

// Occasional sounds of the place (a gull, a ship's horn, hooves on paving, a church bell).
const ONESHOTS = {
  ship: ['creak', 'creak', 'murmur'],
  castle: ['gull', 'gull', 'horn', 'murmur', 'creak'],
  les: ['hoof', 'bell', 'murmur', 'hoof'],
  les2: ['hoof', 'bell', 'murmur', 'hoof'],
  city: ['hoof', 'hoof', 'bell', 'murmur'],
  park: ['gull', 'murmur'],
};
let oneT = 5;
export function ambientTick(dt, zone) {
  oneT -= dt; if (oneT > 0) return;
  oneT = 6 + Math.random() * 9;
  const list = ONESHOTS[zone]; if (!list || state.settings.amb <= 0.01) return;
  sfx(list[Math.floor(Math.random() * list.length)], { vol: 0.45 });
}
