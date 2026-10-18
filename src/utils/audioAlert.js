// src/utils/audioAlert.js

let audioCtx = null;
let chimeInterval = null;
let isMuted = false;

/**
 * Returns or initializes the shared browser AudioContext.
 *
 * @returns {AudioContext|null}
 */
function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

/**
 * Synthesizes a clean two-tone emergency alert chime (880 Hz -> 660 Hz)
 * using the Web Audio API without requiring external MP3 assets.
 */
function playTonePair() {
  if (isMuted) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Browser Autoplay Policy: resume if suspended
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  // Tone 1: High tone (880 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(880, now);
  gain1.gain.setValueAtTime(0.15, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.18);

  // Tone 2: Lower tone (660 Hz)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(660, now + 0.2);
  gain2.gain.setValueAtTime(0.15, now + 0.2);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.2);
  osc2.stop(now + 0.45);
}

/**
 * Starts the periodic emergency chime (repeats every 4 seconds) until silenced.
 */
export function startEmergencyChime() {
  if (chimeInterval || isMuted) return;

  try {
    playTonePair();
    chimeInterval = setInterval(() => {
      playTonePair();
    }, 4000);
  } catch {
    // Fail gracefully if user has not interacted with DOM yet
  }
}

/**
 * Immediately silences any active emergency chime and stops the interval timer.
 */
export function stopEmergencyChime() {
  if (chimeInterval) {
    clearInterval(chimeInterval);
    chimeInterval = null;
  }
}

/**
 * Sets the global mute preference for emergency audio alerts.
 *
 * @param {boolean} muted
 */
export function setChimeMuted(muted) {
  isMuted = !!muted;
  if (isMuted) {
    stopEmergencyChime();
  }
}

/**
 * Checks whether the emergency chime is currently muted.
 *
 * @returns {boolean}
 */
export function isChimeMuted() {
  return isMuted;
}
