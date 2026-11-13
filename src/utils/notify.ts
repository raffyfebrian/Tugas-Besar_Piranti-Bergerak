let audioContext: AudioContext | null = null;

type AudioContextConstructor = new () => AudioContext;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioCtor =
    window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioCtor();
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
};

/** Panggil dari gesture pengguna agar browser mengizinkan pemutaran audio. */
export const unlockNotificationSound = (): void => {
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  gain.gain.value = 0.0001;
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.02);
};

/** Nada dua langkah singkat untuk pesanan baru di meja kasir. */
export const playOrderChime = (): void => {
  const context = getAudioContext();
  if (!context) return;

  const start = context.currentTime + 0.02;
  const notes = [
    { frequency: 880, offset: 0 },
    { frequency: 1174.66, offset: 0.16 },
  ];

  notes.forEach(({ frequency, offset }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.16, start + offset + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.34);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start + offset);
    oscillator.stop(start + offset + 0.38);
  });
};
