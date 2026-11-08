const pad = (n: number) => String(n).padStart(2, '0');
export const dkey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => dkey(new Date());
export function parse(key: string) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(key: string, n: number) { const d = parse(key); d.setDate(d.getDate() + n); return dkey(d); }
export function daysBetween(a: string, b: string) { return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000); }
/** Ключ тижня: дата понеділка */
export function weekKey(key: string) { const d = parse(key); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return dkey(d); }
export function timeToMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); }
export function sleepHours(bed: string, wake: string) {
  let diff = timeToMin(wake) - timeToMin(bed);
  if (diff <= 0) diff += 24 * 60;
  return Math.round(diff / 6) / 10;
}
/** Простий детермінований генератор для вибору квестів дня */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
