// Web Audio API Sound Synthesizer for TEJAS Railway System

let audioCtx: AudioContext | null = null;
let activeSirenOsc: OscillatorNode | null = null;
let activeSirenGain: GainNode | null = null;
let sirenInterval: any = null;
let isAudioMuted: boolean = false;

// Initialize AudioContext safely on user interaction
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setGlobalAudioMute(muted: boolean) {
  isAudioMuted = muted;
  if (muted) {
    stopEmergencySiren();
  }
}

export function getGlobalAudioMute(): boolean {
  return isAudioMuted;
}

/**
 * Play a gentle dual-frequency chime for general notifications (Tier 1)
 */
export function playNotificationChime() {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    const now = ctx.currentTime;
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.12);

    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch (err) {
    console.warn('Notification audio playback deferred by browser policy:', err);
  }
}

/**
 * Play an oscillating industrial emergency siren pattern (Tier 2)
 */
export function startEmergencySiren() {
  if (isAudioMuted || activeSirenOsc) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);

    activeSirenOsc = osc;
    activeSirenGain = gain;

    // Oscillate frequency between 880Hz and 440Hz every 400ms (High-low industrial siren)
    let isHigh = true;
    sirenInterval = setInterval(() => {
      if (!activeSirenOsc || !audioCtx) return;
      const time = audioCtx.currentTime;
      activeSirenOsc.frequency.setValueAtTime(isHigh ? 440 : 880, time);
      isHigh = !isHigh;
    }, 420);

  } catch (err) {
    console.warn('Emergency siren audio playback deferred:', err);
  }
}

/**
 * Stop active emergency siren
 */
export function stopEmergencySiren() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }

  if (activeSirenGain && audioCtx) {
    try {
      const now = audioCtx.currentTime;
      activeSirenGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
      setTimeout(() => {
        if (activeSirenOsc) {
          activeSirenOsc.stop();
          activeSirenOsc.disconnect();
          activeSirenOsc = null;
        }
        activeSirenGain = null;
      }, 120);
    } catch {
      activeSirenOsc = null;
      activeSirenGain = null;
    }
  } else if (activeSirenOsc) {
    try {
      activeSirenOsc.stop();
      activeSirenOsc.disconnect();
    } catch {}
    activeSirenOsc = null;
    activeSirenGain = null;
  }
}
