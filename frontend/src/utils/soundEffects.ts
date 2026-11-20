// Web Audio API Sound Effects Synthesizer for StudentOS
// Zero latency, no external assets needed, pure synthesized tones

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
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

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('studentos_sound_enabled');
  return saved === null ? true : saved === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('studentos_sound_enabled', enabled ? 'true' : 'false');
}

// Master volume helper
function playTone(
  freq: number,
  type: OscillatorType,
  duration: number,
  startGain: number,
  endGain: number = 0.001,
  delay: number = 0
) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  setTimeout(() => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(startGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, endGain), ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio context errors
    }
  }, delay * 1000);
}

// Audio Sound Effect Methods
export const soundManager = {
  // Played once upon dashboard entry (35% volume, smooth startup chord)
  playWelcome: () => {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      playTone(freq, 'sine', 1.4, 0.09, 0.001, idx * 0.08);
    });
  },

  // Soft micro click for standard buttons/navigation
  playClick: () => {
    playTone(600, 'sine', 0.04, 0.05, 0.001);
  },

  // Soft tick for tabs
  playTab: () => {
    playTone(800, 'triangle', 0.03, 0.04, 0.001);
  },

  // Success chime for saves and submissions
  playSuccess: () => {
    playTone(523.25, 'sine', 0.12, 0.08, 0.001, 0);
    playTone(659.25, 'sine', 0.18, 0.08, 0.001, 0.08);
    playTone(783.99, 'sine', 0.3, 0.1, 0.001, 0.16);
  },

  // Warning or delete click
  playWarning: () => {
    playTone(220, 'sawtooth', 0.15, 0.06, 0.001, 0);
    playTone(180, 'sawtooth', 0.2, 0.06, 0.001, 0.08);
  },

  playDelete: () => {
    playTone(220, 'sawtooth', 0.15, 0.06, 0.001, 0);
    playTone(180, 'sawtooth', 0.2, 0.06, 0.001, 0.08);
  },

  // Bell tone for notifications
  playBell: () => {
    playTone(880, 'sine', 0.4, 0.09, 0.001, 0);
    playTone(1320, 'sine', 0.6, 0.06, 0.001, 0.06);
  },

  // Glass pop for opening modals
  playPop: () => {
    playTone(400, 'sine', 0.06, 0.08, 0.001, 0);
    playTone(800, 'sine', 0.08, 0.06, 0.001, 0.03);
  },

  // Soft whoosh for closing modals
  playWhoosh: () => {
    playTone(500, 'sine', 0.08, 0.06, 0.001, 0);
    playTone(300, 'sine', 0.06, 0.03, 0.001, 0.03);
  },

  // Magic chime for theme toggle
  playThemeToggle: () => {
    playTone(440, 'sine', 0.1, 0.05, 0.001, 0);
    playTone(880, 'sine', 0.2, 0.06, 0.001, 0.06);
  },

  // Upload/Download sound
  playAction: () => {
    playTone(700, 'sine', 0.08, 0.05, 0.001, 0);
    playTone(1050, 'sine', 0.1, 0.05, 0.001, 0.05);
  },
};
