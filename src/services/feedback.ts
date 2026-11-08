import { getState } from '../store';

let ctx: AudioContext | null = null;
type Kind = 'level' | 'record' | 'item' | 'ach' | 'city' | 'streak' | 'coin' | 'tap';
const NOTES: Record<Kind, number[]> = {
  level: [523, 659, 784, 1047], record: [392, 523, 659, 784, 659, 1047], item: [659, 880, 1175], ach: [587, 740, 880],
  city: [440, 554, 659, 880], streak: [523, 784, 1047], coin: [988, 1319], tap: [660]
};
/** Короткі мелодії синтезуються на льоту, файли не потрібні */
export function chime(kind: Kind) {
  if (!getState().settings.sound) return;
  try {
    ctx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime, step = kind === 'coin' ? 0.07 : 0.11;
    NOTES[kind].forEach((f, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      const st = t0 + i * step;
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(kind === 'coin' ? 0.08 : 0.15, st + 0.02); g.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
      o.connect(g).connect(ctx!.destination); o.start(st); o.stop(st + 0.4);
    });
  } catch { /* звук недоступний */ }
}
export function haptic(p: number | number[]) {
  if (!getState().settings.haptics) return;
  try { navigator.vibrate?.(p); } catch { /* iOS Safari не підтримує вібрацію з вебу */ }
}
