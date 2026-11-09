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
export function sfx(name) {
  const c = ensureCtx(); if (!c) return;
  const t = c.currentTime;
  const vol = Math.max(0.15, state.settings.amb);
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
