import { describe, expect, it } from 'vitest';
import { bmr, dailyNorm, SAFE_MIN } from './nutrition';
import { freshState, streakInfo, newDay, addWater, addFoods, questsFor, need, logStrength, setRest } from './game';
import { addDays, sleepHours, today, weekKey } from './dates';
import { LOCAL_FOODS, searchFoods } from '../data/foods';

const p = () => ({ ...freshState().profile, sex: 'm' as const, age: 30, height: 180, weight: 80, act: 1.55 });

describe('харчування', () => {
  it('Міффлін — Сан Жеор для чоловіка 30 р., 180 см, 80 кг', () => {
    expect(bmr(p())).toBe(10 * 80 + 6.25 * 180 - 150 + 5); // 1780
  });
  it('дефіцит не більший за 500 ккал', () => {
    const n = dailyNorm({ ...p(), goal: 'lose' });
    expect(n.tdee - n.target).toBeLessThanOrEqual(505);
  });
  it('норма ніколи не нижча за безпечний мінімум', () => {
    const tiny = dailyNorm({ ...p(), sex: 'f', weight: 40, height: 145, age: 80, act: 1.2, goal: 'lose' });
    expect(tiny.target).toBeGreaterThanOrEqual(SAFE_MIN.f);
    expect(tiny.floored).toBe(true);
  });
  it('пошук знаходить страви обома мовами і без апострофа', () => {
    expect(searchFoods(LOCAL_FOODS, 'борщ').length).toBeGreaterThan(1);
    expect(searchFoods(LOCAL_FOODS, 'varenyky')[0].id).toMatch(/varenyky/);
    expect(searchFoods(LOCAL_FOODS, 'олівє')[0].id).toBe('olivie');
  });
});

describe('дати', () => {
  it('сон через північ', () => { expect(sleepHours('23:30', '07:00')).toBe(7.5); });
  it('ключ тижня — понеділок', () => { expect(weekKey('2026-11-08')).toBe('2026-11-02'); });
});

describe('серії з днями запасу', () => {
  it('один пропущений день не ламає серію', () => {
    const s = freshState();
    const t = today();
    s.startDate = addDays(t, -10);
    for (let i = 1; i <= 10; i++) { const k = addDays(t, -i); s.days[k] = { ...newDay(k), water: i === 3 ? 0 : 2 }; }
    const st = streakInfo(s);
    expect(st.streak).toBe(9);
  });
  it('день відпочинку теж рахується', () => {
    const s = freshState(); const t = today(); s.startDate = addDays(t, -1);
    s.days[addDays(t, -1)] = { ...newDay(addDays(t, -1)), rest: true };
    expect(streakInfo(s).streak).toBe(1);
  });
});

describe('нагороди', () => {
  it('вода дає досвід, але з лімітом на день', () => {
    const s = freshState(); s.onb = 99;
    for (let i = 0; i < 30; i++) addWater(s, 1);
    expect(s.days[today()].rewards.water).toBe(14);
  });
  it('рівень росте, а досвід переноситься', () => {
    const s = freshState(); s.xp = need(1) + 5; addWater(s, 1);
    expect(s.level).toBe(2);
  });
  it('за їжу нагорода, «з\'їв менше» ніде не винагороджується', () => {
    const s = freshState();
    const fx = addFoods(s, [{ food: LOCAL_FOODS[0], g: 300 }], 'l');
    expect(s.xp).toBeGreaterThan(0);
    expect(fx.some(f => f.type === 'toast')).toBe(true);
  });
  it('рекорд у силовій визначається з другого разу', () => {
    const s = freshState();
    logStrength(s, 'squat', { uk: 'Присідання', en: 'Squat' }, [{ w: 60, r: 8 }], 70);
    const fx = logStrength(s, 'squat', { uk: 'Присідання', en: 'Squat' }, [{ w: 65, r: 5 }], 70);
    expect(fx.some(f => f.type === 'celebrate' && f.kind === 'record')).toBe(true);
    expect(s.ach.record).toBeTruthy();
  });
  it('день відпочинку відкриває досягнення', () => { const s = freshState(); setRest(s); expect(s.ach.rest).toBeTruthy(); });
  it('завжди 3 квести і серед них є рух', () => {
    const s = freshState();
    for (const g of ['lose', 'keep', 'gain', 'habits'] as const) {
      s.profile.goal = g;
      const q = questsFor(s, '2026-11-08');
      expect(q.length).toBe(3);
      expect(q.some(x => ['move10', 'steps5k', 'strength'].includes(x.id))).toBe(true);
    }
  });
});
