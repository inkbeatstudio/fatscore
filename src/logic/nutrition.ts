import type { Cat, Day, FoodEntry, Profile } from '../types';
import { COLOR_CATS } from '../data/foods';

export interface Norm { bmr: number; tdee: number; target: number; min: number; floored: boolean; prot: number; fat: number; carb: number; fiber: number }

/** Безпечний мінімум калорій: нижче застосунок норму не опускає */
export const SAFE_MIN = { f: 1200, m: 1500 } as const;
/** Найбільший дефіцит — 500 ккал (≈0,5 кг на тиждень) і не більше 20% від підтримки */
export const MAX_DEFICIT = 500;

/** Формула Міффліна — Сан Жеора */
export function bmr(p: Pick<Profile, 'sex' | 'weight' | 'height' | 'age'>) {
  return 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
}

export function dailyNorm(p: Profile): Norm {
  const b = bmr(p);
  const tdee = b * p.act;
  let t = tdee;
  if (p.goal === 'lose') t = tdee - Math.min(MAX_DEFICIT, tdee * 0.2);
  if (p.goal === 'gain') t = tdee + Math.min(400, tdee * 0.12);
  const min = SAFE_MIN[p.sex];
  const floored = t < min;
  const target = Math.round(Math.max(t, min) / 10) * 10;
  const prot = Math.round(p.weight * (p.goal === 'lose' || p.goal === 'gain' ? 1.6 : 1.2));
  const fat = Math.round((target * 0.28) / 9);
  const carb = Math.max(0, Math.round((target - prot * 4 - fat * 9) / 4));
  const fiber = Math.round((target / 1000) * 14);
  return { bmr: Math.round(b), tdee: Math.round(tdee), target, min, floored, prot, fat, carb, fiber };
}

export function entryNutr(e: FoodEntry) {
  const k = e.g / 100, f = e.food;
  return { kcal: f.kcal * k, p: f.p * k, f: f.f * k, c: f.c * k, fiber: (f.fiber || 0) * k };
}

export function dayTotals(d: Day | undefined) {
  const r = { kcal: 0, p: 0, f: 0, c: 0, fiber: 0, cats: new Set<Cat>() };
  if (!d) return r;
  for (const e of d.foods) {
    const n = entryNutr(e);
    r.kcal += n.kcal; r.p += n.p; r.f += n.f; r.c += n.c; r.fiber += n.fiber;
    r.cats.add(e.food.cat);
  }
  return r;
}

export function colorCount(d: Day | undefined) {
  const c = dayTotals(d).cats;
  return COLOR_CATS.filter(x => c.has(x)).length;
}

/** Кроки: ≈0,04 ккал на крок для людини 70 кг */
export function stepsKcal(steps: number, weight: number) { return steps * 0.04 * (weight / 70); }
export function burned(d: Day | undefined, weight: number) {
  if (!d) return 0;
  return d.workouts.reduce((s, w) => s + w.kcal, 0) + stepsKcal(d.steps, weight);
}
/** ккал за MET: MET × вага × години */
export const metKcal = (met: number, weight: number, min: number) => (met * weight * min) / 60;
export const stepsToKm = (steps: number) => steps * 0.00075;
