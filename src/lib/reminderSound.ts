let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext;
  const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  audioContext = new AudioCtor();
  return audioContext;
}

export function unlockReminderSound() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

export function playReminderChime(urgent: boolean) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const notes = urgent ? [988, 988, 1319] : [659, 880];
  const spacing = urgent ? 0.22 : 0.2;
  const start = ctx.currentTime + 0.05;

  notes.forEach((frequency, i) => {
    const t = start + i * spacing;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  });
}
