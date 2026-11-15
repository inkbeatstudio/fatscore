import { describe, expect, it } from 'vitest';
import { bmr, dailyNorm, SAFE_MIN } from './nutrition';
import { freshState, streakInfo, newDay, addWater, addFoods, questsFor, need, logStrength, setRest, weeklyFor, addWorkout, migrateState, buyHero, selectHero, setNote, needHero, copyFoods, mealNote, nudgeFor, dismissNudge } from './game';
import { buildCSV, buildHTML } from '../services/report';
import { seasonOf } from '../data/seasons';
import { seriesAchs } from '../data/achievements';
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
    const s = freshState(); s.xp = need(1) + 5; s.chars.bear.xp = needHero(1) + 5; addWater(s, 1);
    expect(s.level).toBe(2);
    expect(s.chars.bear.lv).toBe(2);
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
    expect(s.ach.records_1).toBeTruthy();
  });
  it('день відпочинку відкриває досягнення', () => { const s = freshState(); setRest(s); expect(s.ach.rest_1).toBeTruthy(); });
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

describe('v0.2: герої, тижні, сезони', () => {
  it('досягнень багато і всі з унікальними id', () => {
    const a = seriesAchs();
    expect(a.length).toBeGreaterThan(80);
    expect(new Set(a.map(x => x.id)).size).toBe(a.length);
  });
  it('тижневих завдань 3, одне з них про рух', () => {
    const s = freshState();
    const w = weeklyFor(s, '2026-11-09');
    expect(w.length).toBe(3);
    expect(w.some(q => ['active4', 'workouts3', 'steps35', 'rest1'].includes(q.id))).toBe(true);
  });
  it('3 тренування закривають тижневе завдання і дають зірку', () => {
    const s = freshState();
    const before = s.stars;
    for (let i = 0; i < 3; i++) addWorkout(s, { kind: 'cardio', name: { uk: 'Біг', en: 'Run' }, detail: '', min: 20, kcal: 100 });
    const wq = weeklyFor(s);
    if (wq.some(q => q.id === 'workouts3')) expect(s.stars).toBeGreaterThan(before);
    expect(s.season[seasonOf().key].daily).toBeGreaterThanOrEqual(0);
  });
  it('денне завдання дає очки сезону', () => {
    const s = freshState();
    addFoods(s, [{ food: LOCAL_FOODS[0], g: 100 }], 'b');
    addFoods(s, [{ food: LOCAL_FOODS[1], g: 100 }], 'l');
    expect(s.season[seasonOf().key].pts).toBeGreaterThanOrEqual(10);
  });
  it('стара версія переноситься: досягнення перейменовуються, рівень стає рівнем героя', () => {
    const old: any = { ...freshState(), v: 1, onb: 99, level: 4, xp: 30, ach: { first_meal: 1, streak7: 2 }, chars: undefined, home: undefined };
    delete old.chars; delete old.home;
    const s = migrateState(old);
    expect(s.ach.meals_1).toBe(1);
    expect(s.ach.streak_2).toBe(2);
    expect(s.chars.bear.lv).toBe(4);
    expect(s.chars.bear.own).toBe(true);
    expect(s.home.length).toBeGreaterThan(3);
  });
  it('героя можна купити за зірки і обрати', () => {
    const s = freshState(); s.chars.bear.own = true; s.stars = 20;
    buyHero(s, 'fox');
    expect(s.chars.fox.own).toBe(true);
    expect(s.stars).toBe(3); // 20 − 18 + 1 за досягнення «Колекція героїв I»
    selectHero(s, 'fox');
    expect(s.profile.char).toBe('fox');
  });
  it('їжа за минулий день не дає нагород', () => {
    const s = freshState();
    const y = addDays(today(), -1);
    addFoods(s, [{ food: LOCAL_FOODS[0], g: 100 }], 'b', { date: y });
    expect(s.xp).toBe(0);
    expect(s.days[y].foods.length).toBe(1);
  });
  it('запис у щоденнику рахується', () => {
    const s = freshState();
    setNote(s, 'Гарний день, багато гуляв');
    expect(s.ach.diary_1).toBeTruthy();
  });
});

import { parseMeal } from './parse';
describe('запис їжі повідомленням', () => {
  it('розбирає грами, штуки і відмінки', () => {
    const r = parseMeal('250 г гречки, курка 150 і 2 яйця', LOCAL_FOODS);
    expect(r.length).toBe(3);
    expect(r[0].food?.id).toBe('buckwheat'); expect(r[0].g).toBe(250);
    expect(r[1].food?.id).toMatch(/chicken/); expect(r[1].g).toBe(150);
    expect(r[2].food?.id).toBe('egg'); expect(r[2].g).toBe(110);
  });
  it('без кількості бере типову порцію', () => {
    const r = parseMeal('борщ і скибка житнього хліба', LOCAL_FOODS);
    expect(r[0].food?.id).toBe('borsch'); expect(r[0].g).toBe(300);
    expect(r[1].food?.id).toBe('bread_rye'); expect(r[1].g).toBe(30);
  });
  it('англійською теж', () => {
    const r = parseMeal('2 bananas and a cappuccino', LOCAL_FOODS);
    expect(r[0].food?.id).toBe('banana'); expect(r[0].g).toBe(240);
    expect(r[1].food?.id).toBe('cappuccino');
  });
  it('головне слово важливіше за уточнення', () => {
    const r = parseMeal('2 сирники зі сметаною', LOCAL_FOODS);
    expect(r[0].food?.id).toBe('syrnyky'); expect(r[0].g).toBe(300);
  });
  it('невідоме не вигадує', () => {
    expect(parseMeal('щось дивне ксилофон', LOCAL_FOODS)[0].food).toBeNull();
  });
});

describe('v0.3', () => {
  const ready = () => { const s = freshState(); s.onb = 99; return s; };
  const at = (h: number) => { const d = new Date(); d.setHours(h, 0, 0, 0); return d; };
  const food = (id: string) => LOCAL_FOODS.find(f => f.id === id) || LOCAL_FOODS[0];

  it('копіювання прийому їжі на інший день і в інший прийом', () => {
    const s = ready(); const y = addDays(today(), -1);
    addFoods(s, [{ food: food('banana'), g: 120 }, { food: LOCAL_FOODS[5], g: 100 }], 'b', { date: y });
    addFoods(s, [{ food: LOCAL_FOODS[7], g: 200 }], 'l', { date: y });
    const fx = copyFoods(s, y, today(), 'b', 's');
    const t = s.days[today()].foods;
    expect(t.length).toBe(2);
    expect(t.every(f => f.meal === 's')).toBe(true);
    expect(fx.filter(e => e.type === 'react').length).toBe(1);
  });
  it('копіювання всього дня зберігає прийоми', () => {
    const s = ready(); const y = addDays(today(), -1);
    addFoods(s, [{ food: LOCAL_FOODS[1], g: 100 }], 'b', { date: y });
    addFoods(s, [{ food: LOCAL_FOODS[2], g: 100 }], 'd', { date: y });
    copyFoods(s, y, addDays(today(), -2));
    expect(s.days[addDays(today(), -2)].foods.map(f => f.meal).sort()).toEqual(['b', 'd']);
  });
  it('реакція на їжу ніколи не про «забагато» і хвалить різноманіття', () => {
    const s = ready();
    const cats = ['veg', 'fruit', 'protein', 'grain'].map(c => LOCAL_FOODS.find(f => f.cat === c)!);
    const note = mealNote(s, cats.map(food => ({ food })), cats.map(food => ({ food })))!;
    expect(note).toBeTruthy();
    expect(note).not.toMatch(/забагато|багато калор|менше|too much/i);
    expect(mealNote(s, [{ food: LOCAL_FOODS.find(f => f.cat === 'sweet')! }], [{ food: LOCAL_FOODS.find(f => f.cat === 'sweet')! }])).toBeNull();
  });
  it('мʼякі нагадування: вода після 11, ховаються до завтра, вимикаються', () => {
    const s = ready();
    expect(nudgeFor(s, at(8))).toBeNull();
    expect(nudgeFor(s, at(11))?.id).toBe('water1');
    dismissNudge(s, 'water1');
    expect(nudgeFor(s, at(11))?.id).toBe('breakfast');
    s.settings.nudges = false;
    expect(nudgeFor(s, at(11))).toBeNull();
  });
  it('старий стан отримує нові налаштування за замовчуванням', () => {
    const old: any = { ...freshState(), settings: { sound: true, haptics: true, theme: 'system', style: 'tactile', calm: false } };
    const m = migrateState(old);
    expect(m.settings.nudges).toBe(true);
    expect(m.settings.weightChart).toBe(false);
  });
  it('звіт CSV: заголовок, рядок на кожен день, без демо-днів', () => {
    const s = ready();
    addFoods(s, [{ food: food('banana'), g: 120 }], 'b');
    s.days[addDays(today(), -1)] = { ...newDay(addDays(today(), -1)), demo: true, water: 9 };
    const csv = buildCSV(s, 7).replace('﻿', '').split('\n');
    expect(csv.length).toBe(8);
    expect(csv[7].startsWith(today())).toBe(true);
    expect(csv[6].split(',').slice(1).every(x => x === '')).toBe(true);
    expect(buildHTML(s, 7)).toContain('<table');
  });
});
