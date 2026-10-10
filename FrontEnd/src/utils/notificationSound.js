/**
 * Digitech IMS - Premium Audio Chime Generator
 * Menggunakan Web Audio API sintetis murni (zero external asset dependency).
 * Menghasilkan nada lonceng kristal ganda (Velvet Bell Chime C5 -> G5) yang hangat,
 * lembut, menenangkan, dan tidak mengagetkan di telinga.
 */

const STORAGE_KEY = 'ims_notification_sound_muted';

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Cek apakah suara notifikasi sedang di-mute oleh pengguna
 */
export function isSoundMuted() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

/**
 * Simpan pengaturan mute / unmute ke localStorage
 */
export function setSoundMuted(muted) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
}

/**
 * Memutar suara notifikasi lonceng hangat & elegan (Velvet Crystal Chime).
 * @param {boolean} force - Jika true, tetap diputar meskipun sedang di-mute (misal saat user meng-unmute)
 */
export function playNotificationSound(force = false) {
  if (!force && isSoundMuted()) {
    return;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master filter low-pass lembut untuk membuang distorsi & nada tinggi yang menusuk (harshness)
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(2400, now);
    masterFilter.Q.setValueAtTime(0.7, now);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.85, now);

    masterFilter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Generator nada lonceng lembut dengan attack mulus & decay eksponensial alami
    const createBellTone = (freq, startTime, duration, peakVolume) => {
      // 1. Fundamental Nada Dasar (Pure Sine - Hangat & Bulat)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Attack 15ms untuk mencegah 'clicking' / 'popping' audio digital
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.015);
      // Decay eksponensial panjang menyerupai getaran lonceng perak
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(masterFilter);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);

      // 2. Kilau Lonceng Halus (Harmonic Overtone 2x)
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();

      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(freq * 2.01, startTime);

      shimmerGain.gain.setValueAtTime(0.0001, startTime);
      shimmerGain.gain.linearRampToValueAtTime(peakVolume * 0.16, startTime + 0.012);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.55);

      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(masterFilter);

      shimmerOsc.start(startTime);
      shimmerOsc.stop(startTime + duration * 0.6);
    };

    // ── Cascading Harmoni Dua Nada (C5 -> G5, Perfect 5th Chime) ──
    // Nada 1: C5 (523.25 Hz) - Nada pembuka yang hangat
    createBellTone(523.25, now, 0.45, 0.16);

    // Nada 2: G5 (783.99 Hz) - Nada penyelesaian yang jernih & cerah
    createBellTone(783.99, now + 0.09, 0.62, 0.20);

  } catch (err) {
    console.warn('[NotificationSound] Audio playback failed:', err);
  }
}
