import type { Day, Effect, Food, Lang, MealKey, State, Workout, L10n } from '../types';
import { addDays, daysBetween, seeded, sleepHours, today, weekKey } from './dates';
import { colorCount, dailyNorm, dayTotals, stepsToKm } from './nutrition';
import { ACH, ITEM, ITEMS, inSeason } from '../data/items';
import { CITIES } from '../data/exercise';
import { CHARS, type LineKind } from '../data/characters';
import { COLOR_CATS, CATS } from '../data/foods';
import { fmt, lx, tx, plural } from '../i18n';

export const STATE_VERSION = 1;
export const need = (level: number) => 80 + 40 * (level - 1);
export const STAGES: { from: number; name: L10n }[] = [
  { from: 1, name: { uk: 'Малюк', en: 'Baby' } },
  { from: 3, name: { uk: 'Юний', en: 'Young' } },
  { from: 6, name: { uk: 'Дорослий', en: 'Grown-up' } },
  { from: 10, name: { uk: 'Досвідчений', en: 'Seasoned' } },
  { from: 15, name: { uk: 'Легендарний', en: 'Legendary' } }
];
export function stageOf(level: number) {
  let i = 0;
  STAGES.forEach((s, k) => { if (level >= s.from) i = k; });
  return { index: i + 1, ...STAGES[i], next: STAGES[i + 1]?.from };
}

let idc = 0;
export const uid = (p = 'e') => `${p}${Date.now().toString(36)}${(idc++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function newDay(date: string): Day {
  return { date, foods: [], water: 0, workouts: [], rest: false, steps: 0, habits: {}, quests: {}, rewards: {}, gamePlays: 0 };
}

export function freshState(lang: Lang = 'uk'): State {
  const t = today();
  return {
    v: STATE_VERSION, onb: 0, lang, startDate: t,
    profile: { sex: 'f', age: 30, height: 168, weight: 68, act: 1.375, goal: 'lose', noNum: false, adult: false, disc: false, char: 'bear', cname: CHARS.bear.name[lang], uname: '', waterGoal: 8 },
    days: { [t]: newDay(t) }, xp: 0, level: 1, coins: 150, owned: [], eq: { head: null, neck: null, face: null, bg: null }, ach: {}, prs: {}, km: 0,
    recent: [], favorites: [], customFoods: [],
    habits: [
      { id: 'h_walk', name: lang === 'en' ? 'Fresh air walk' : 'Прогулянка на свіжому повітрі', icon: 'leaf' },
      { id: 'h_read', name: lang === 'en' ? 'Read 10 pages' : 'Прочитати 10 сторінок', icon: 'book' }
    ],
    settings: { sound: true, haptics: true, theme: 'system', style: 'tactile' },
    gameBest: 0, lastSeen: t, stats: { scans: 0, recipes: 0, distinctFoods: [], games: 0 }
  };
}

/** Гарантує, що в state є сьогоднішній день */
export function ensureToday(s: State): Day {
  const t = today();
  if (!s.days[t]) s.days[t] = newDay(t);
  return s.days[t];
}
export const day = (s: State, key = today()) => s.days[key];

/** День активний, якщо людина щось зробила для себе. День відпочинку — теж активний. */
export function isActive(d?: Day) {
  return !!d && (d.foods.length > 0 || d.water > 0 || d.workouts.length > 0 || d.rest || d.steps > 0 || !!d.sleep || d.mood != null || Object.values(d.habits).some(Boolean));
}
export const RESERVE_PER_WEEK = 2;

/** М'яка серія: пропущені дні покриваються «днями запасу» (2 на тиждень). Сьогоднішній день ще не закінчився — його пропуск серію не ламає. */
export function streakInfo(s: State, ref = today()) {
  const used: Record<string, number> = {};
  let streak = 0;
  let d = isActive(s.days[ref]) ? ref : addDays(ref, -1);
  const start = s.startDate;
  let guard = 0;
  while (daysBetween(start, d) >= 0 && guard++ < 2000) {
    if (isActive(s.days[d])) streak++;
    else {
      const w = weekKey(d);
      if ((used[w] || 0) < RESERVE_PER_WEEK) used[w] = (used[w] || 0) + 1;
      else break;
    }
    d = addDays(d, -1);
  }
  const wk = weekKey(ref);
  let weekActive = 0;
  for (let i = 0; i < 7; i++) if (isActive(s.days[addDays(wk, i)])) weekActive++;
  return { streak, reserveLeft: Math.max(0, RESERVE_PER_WEEK - (used[wk] || 0)), weekActive };
}

// ——— Квести дня
export interface Quest { id: string; t: L10n; ok: (d: Day, s: State) => boolean; goals?: string[]; numbers?: boolean }
export const QUESTS: Quest[] = [
  { id: 'breakfast', t: { uk: 'Запиши сніданок', en: 'Log breakfast' }, ok: d => d.foods.some(f => f.meal === 'b') },
  { id: 'meals2', t: { uk: 'Запиши два прийоми їжі', en: 'Log two meals' }, ok: d => new Set(d.foods.map(f => f.meal)).size >= 2 },
  { id: 'colors3', t: { uk: '3 кольори на тарілці', en: '3 colours on the plate' }, ok: d => colorCount(d) >= 3 },
  { id: 'veg', t: { uk: 'Додай овочі до будь-якої страви', en: 'Add veggies to any meal' }, ok: d => d.foods.some(f => f.food.cat === 'veg') },
  { id: 'fruit', t: { uk: 'З\'їж фрукт або ягоди', en: 'Have some fruit or berries' }, ok: d => d.foods.some(f => f.food.cat === 'fruit') },
  { id: 'water6', t: { uk: 'Випий 6 склянок води', en: 'Drink 6 glasses of water' }, ok: d => d.water >= 6 },
  { id: 'move10', t: { uk: '10 хвилин руху або день відпочинку', en: '10 minutes of movement or a rest day' }, ok: d => d.rest || d.workouts.reduce((a, w) => a + w.min, 0) >= 10 },
  { id: 'steps5k', t: { uk: '5 000 кроків', en: '5,000 steps' }, ok: d => d.steps >= 5000 },
  { id: 'sleep', t: { uk: 'Запиши, як спалось', en: 'Log how you slept' }, ok: d => !!d.sleep },
  { id: 'mood', t: { uk: 'Відзнач настрій', en: 'Check in your mood' }, ok: d => d.mood != null },
  { id: 'habit', t: { uk: 'Виконай одну свою звичку', en: 'Complete one of your habits' }, ok: d => Object.values(d.habits).some(Boolean) },
  { id: 'protein', t: { uk: 'Добери 80% білка', en: 'Reach 80% of your protein' }, ok: (d, s) => dayTotals(d).p >= dailyNorm(s.profile).prot * 0.8, goals: ['gain', 'keep', 'lose'], numbers: true },
  { id: 'strength', t: { uk: 'Силове тренування або рекорд', en: 'A strength session' }, ok: d => d.workouts.some(w => w.kind === 'strength'), goals: ['gain'] }
];
export function questsFor(s: State, date = today()): Quest[] {
  const g = s.profile.goal;
  const pool = QUESTS.filter(q => (!q.goals || q.goals.includes(g)) && !(q.numbers && s.profile.noNum));
  const fixed = pool.find(q => q.id === (g === 'habits' ? 'habit' : 'meals2'))!;
  const rnd = seeded(date + g);
  const rest = pool.filter(q => q !== fixed).map(q => [rnd(), q] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const pick = [fixed];
  for (const q of rest) {
    if (pick.length >= 3) break;
    if (pick.some(p => (p.id.startsWith('water') && q.id.startsWith('water')))) continue;
    pick.push(q);
  }
  if (!pick.some(q => q.id === 'move10' || q.id === 'steps5k' || q.id === 'strength')) pick[2] = pool.find(q => q.id === 'move10')!;
  return pick;
}

// ——— Нагороди
const CAPS: Record<string, number> = { food: 10, water: 14, workout: 4, steps: 20, habit: 10 };
function give(s: State, fx: Effect[], xp: number, coins: number, key?: string, text?: string) {
  const d = ensureToday(s);
  if (key) {
    const cap = CAPS[key] ?? 1;
    const n = d.rewards[key] || 0;
    if (n >= cap) return false;
    d.rewards[key] = n + 1;
  }
  s.xp += xp; s.coins += coins;
  fx.push({ type: 'toast', icon: 'coin', text: text || tx(s.lang, `+${xp} досвіду${coins ? `, +${coins} ${plural('uk', coins, ['монета', 'монети', 'монет'], ['', ''])}` : ''}`, `+${xp} XP${coins ? `, +${coins} ${coins === 1 ? 'coin' : 'coins'}` : ''}`) });
  if (coins) fx.push({ type: 'sound', kind: 'coin' });
  return true;
}
const say = (s: State, kind: LineKind) => {
  const L = CHARS[s.profile.char].lines[kind][s.lang];
  return L[Math.floor(Math.random() * L.length)];
};
export const line = say;

function aggregate(s: State) {
  const days = Object.values(s.days).filter(d => !d.demo);
  return {
    entries: days.reduce((a, d) => a + d.foods.length, 0),
    workouts: days.reduce((a, d) => a + d.workouts.length, 0),
    sleeps: days.filter(d => d.sleep).length,
    moods: days.filter(d => d.mood != null).length,
    waterDays: days.filter(d => d.water >= s.profile.waterGoal).length
  };
}

export function unlock(s: State, fx: Effect[], id: string) {
  if (s.ach[id]) return;
  s.ach[id] = Date.now();
  const a = ACH[id];
  const item = ITEMS.find(i => i.earn === id);
  if (item && !s.owned.includes(item.id)) s.owned.push(item.id);
  fx.push({
    type: 'celebrate', kind: item ? 'item' : 'ach', item: item?.id,
    title: (a.secret ? tx(s.lang, 'Таємне досягнення: ', 'Secret achievement: ') : tx(s.lang, 'Досягнення: ', 'Achievement: ')) + lx(s.lang, a.name),
    text: lx(s.lang, a.desc) + (item ? tx(s.lang, `. Нагорода: ${lx('uk', item.name)}, вона вже в гардеробі.`, `. Reward: ${lx('en', item.name)}, it's in your wardrobe.`) : '')
  });
}

/** Після кожної дії: квести → досягнення → рівні */
export function settle(s: State, fx: Effect[]) {
  const d = ensureToday(s);
  for (const q of questsFor(s)) {
    if (!d.quests[q.id] && q.ok(d, s)) {
      d.quests[q.id] = 1;
      give(s, fx, 20, 15, undefined, tx(s.lang, `Завдання виконано: +20 досвіду, +15 монет`, `Quest done: +20 XP, +15 coins`));
    }
  }
  const ag = aggregate(s);
  const st = streakInfo(s);
  const cc = colorCount(d);
  const checks: [string, boolean][] = [
    ['first_meal', ag.entries >= 1], ['meals50', ag.entries >= 50], ['rainbow', cc >= 4], ['all5', cc >= 5],
    ['variety30', s.stats.distinctFoods.length >= 30], ['scanner', s.stats.scans >= 1], ['recipe', s.stats.recipes >= 1],
    ['water_goal', d.water >= s.profile.waterGoal], ['water_week', ag.waterDays >= 7],
    ['first_workout', ag.workouts >= 1], ['workouts10', ag.workouts >= 10], ['rest', d.rest], ['steps10k', d.steps >= 10000],
    ['city1', s.km >= CITIES[1].km], ['sleep7', ag.sleeps >= 7], ['mood7', ag.moods >= 7],
    ['habit_first', Object.values(d.habits).some(Boolean)], ['streak7', st.streak >= 7], ['streak30', st.streak >= 30],
    ['level3', s.level >= 3], ['level5', s.level >= 5], ['level10', s.level >= 10], ['game', s.gameBest >= 25],
    ['stylish', Object.values(s.eq).filter(Boolean).length >= 3]
  ];
  for (const [id, ok] of checks) if (ok) unlock(s, fx, id);
  let leveled = false;
  while (s.xp >= need(s.level)) {
    s.xp -= need(s.level); s.level++; leveled = true;
    const st2 = stageOf(s.level);
    const newStage = STAGES.some(x => x.from === s.level);
    fx.push({
      type: 'celebrate', kind: 'level', big: String(s.level),
      title: tx(s.lang, `${s.profile.cname} тепер на ${s.level} рівні`, `${s.profile.cname} reached level ${s.level}`),
      text: newStage ? tx(s.lang, `Нова стадія: ${st2.name.uk}. Подивись, як ${s.profile.cname} змінився!`, `New stage: ${st2.name.en}. Look how ${s.profile.cname} has grown!`)
        : tx(s.lang, 'Досвід росте від регулярності, а не від ідеальності.', 'XP grows from consistency, not perfection.')
    });
  }
  if (leveled) { for (const [id, ok] of checks) if (ok) unlock(s, fx, id); settleLevelAch(s, fx); }
}
function settleLevelAch(s: State, fx: Effect[]) {
  if (s.level >= 3) unlock(s, fx, 'level3');
  if (s.level >= 5) unlock(s, fx, 'level5');
  if (s.level >= 10) unlock(s, fx, 'level10');
}

// ——— Дії
export function addFoods(s: State, list: { food: Food; g: number }[], meal: MealKey, opts: { repeat?: boolean; scanned?: boolean } = {}): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  const before = new Set(dayTotals(d).cats);
  for (const { food, g } of list) {
    d.foods.push({ id: uid('f'), food, g, meal, at: Date.now() });
    s.recent = [food, ...s.recent.filter(r => r.id !== food.id)].slice(0, 16);
    if (!s.stats.distinctFoods.includes(food.id)) s.stats.distinctFoods.push(food.id);
    give(s, fx, 10, 5, 'food');
  }
  const newCats = [...new Set(list.map(l => l.food.cat))].filter(c => COLOR_CATS.includes(c) && !before.has(c));
  if (newCats.length) {
    s.xp += 5 * newCats.length;
    fx.push({ type: 'toast', icon: 'plate', text: tx(s.lang, `Новий колір на тарілці: ${newCats.map(c => CATS[c].uk).join(', ')}`, `New colour on the plate: ${newCats.map(c => CATS[c].en).join(', ')}`) });
  }
  if (opts.repeat) unlock(s, fx, 'repeat');
  if (opts.scanned) s.stats.scans++;
  fx.push({ type: 'react', kind: 'meal', text: say(s, 'meal') }, { type: 'haptic', pattern: 15 });
  settle(s, fx);
  return fx;
}
export function removeFood(s: State, id: string) {
  const d = ensureToday(s);
  d.foods = d.foods.filter(f => f.id !== id);
  return [] as Effect[];
}

export function addWater(s: State, delta: 1 | -1): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  if (delta < 0) { d.water = Math.max(0, d.water - 1); return fx; }
  d.water++;
  give(s, fx, 3, 1, 'water');
  if (new Date().getHours() < 8) unlock(s, fx, 'early');
  if (d.water === s.profile.waterGoal) fx.push({ type: 'toast', icon: 'drop', text: tx(s.lang, 'Норму води виконано! М\'ята розквітла.', 'Water goal reached! The mint is in bloom.') });
  fx.push({ type: 'react', kind: 'water', text: say(s, 'water') }, { type: 'haptic', pattern: 12 });
  settle(s, fx);
  return fx;
}

function travel(s: State, fx: Effect[], km: number) {
  const before = s.km;
  s.km = Math.round((s.km + km) * 100) / 100;
  for (const c of CITIES.slice(1)) {
    if (before < c.km && s.km >= c.km) {
      s.coins += 30;
      fx.push({ type: 'celebrate', kind: 'city', title: tx(s.lang, `${s.profile.cname} дійшов до міста ${c.name.uk}`, `${s.profile.cname} reached ${c.name.en}`),
        text: tx(s.lang, `${c.fact.uk} Сувенір для кімнати: ${c.souvenir.uk}. +30 монет.`, `${c.fact.en} Souvenir: ${c.souvenir.en}. +30 coins.`) });
    }
  }
}
export function addSteps(s: State, n: number): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  n = Math.max(0, Math.min(60000, Math.round(n)));
  if (!n) return fx;
  const prevK = Math.floor(d.steps / 1000);
  d.steps += n;
  travel(s, fx, stepsToKm(n));
  const k = Math.floor(d.steps / 1000) - prevK;
  let xp = 0, coins = 0;
  for (let i = 0; i < k; i++) { const c = d.rewards.steps || 0; if (c < CAPS.steps) { d.rewards.steps = c + 1; xp += 4; coins += 1; } }
  if (xp) { s.xp += xp; s.coins += coins; }
  fx.push({ type: 'toast', icon: 'steps', text: tx(s.lang, `+${fmt(n, 'uk')} кроків${xp ? `, +${xp} досвіду` : ''}`, `+${fmt(n, 'en')} steps${xp ? `, +${xp} XP` : ''}`) });
  fx.push({ type: 'react', kind: 'steps', text: say(s, 'steps') });
  settle(s, fx);
  return fx;
}

export function addWorkout(s: State, w: Omit<Workout, 'id' | 'at'>): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  d.workouts.push({ ...w, id: uid('w'), at: Date.now() });
  if (w.km) travel(s, fx, w.km);
  give(s, fx, 25, 10, 'workout');
  fx.push({ type: 'react', kind: 'workout', text: say(s, 'workout') }, { type: 'haptic', pattern: 20 });
  settle(s, fx);
  return fx;
}
export function removeWorkout(s: State, id: string) {
  const d = ensureToday(s);
  const w = d.workouts.find(x => x.id === id);
  if (w?.km) s.km = Math.max(0, Math.round((s.km - w.km) * 100) / 100);
  d.workouts = d.workouts.filter(x => x.id !== id);
  return [] as Effect[];
}

export function logStrength(s: State, exId: string, name: L10n, sets: { w: number; r: number }[], weight: number): Effect[] {
  const valid = sets.filter(x => x.r > 0);
  const best = valid.reduce((a, x) => (x.w > a.w || (x.w === a.w && x.r > a.r) ? x : a), { w: -1, r: 0 });
  const prev = s.prs[exId];
  const isPR = !!prev && (best.w > prev.w || (best.w === prev.w && best.r > prev.r));
  if (!prev || isPR) s.prs[exId] = { w: best.w, r: best.r };
  const min = valid.length * 3;
  const fx = addWorkout(s, { kind: 'strength', name, detail: valid.map(x => (x.w ? `${x.w}×${x.r}` : `${x.r}`)).join(', '), min, kcal: (5 * weight * min) / 60 });
  if (isPR) {
    fx.unshift({ type: 'celebrate', kind: 'record', big: best.w ? `${fmt(best.w, s.lang, 1)} ${tx(s.lang, 'кг', 'kg')}` : `${best.r}`,
      title: tx(s.lang, `Новий рекорд: ${name.uk}`, `New record: ${name.en}`),
      text: tx(s.lang, `Попередній: ${prev.w ? prev.w + ' кг × ' : ''}${prev.r}. ${s.profile.cname} аплодує стоячи.`, `Previous: ${prev.w ? prev.w + ' kg × ' : ''}${prev.r}. ${s.profile.cname} gives a standing ovation.`) });
    unlock(s, fx, 'record');
  } else if (!prev) {
    fx.push({ type: 'toast', icon: 'trophy', text: tx(s.lang, `Перший результат у вправі «${name.uk}» збережено`, `First result for «${name.en}» saved`) });
  }
  return fx;
}

export function setRest(s: State): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  if (d.rest) return fx;
  d.rest = true;
  give(s, fx, 15, 5);
  fx.push({ type: 'react', kind: 'rest', text: say(s, 'rest') });
  settle(s, fx);
  return fx;
}

export function logSleep(s: State, bed: string, wake: string, quality: 1 | 2 | 3): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  const first = !d.sleep;
  d.sleep = { bed, wake, quality, hours: sleepHours(bed, wake) };
  if (first) give(s, fx, 10, 5);
  fx.push({ type: 'react', kind: 'sleep', text: say(s, 'sleep') });
  settle(s, fx);
  return fx;
}

export function setMood(s: State, m: 1 | 2 | 3 | 4): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  const first = d.mood == null;
  d.mood = m;
  if (first) give(s, fx, 5, 2);
  fx.push({ type: 'react', kind: 'mood', text: say(s, 'mood') });
  settle(s, fx);
  return fx;
}

export function toggleHabit(s: State, id: string): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  d.habits[id] = !d.habits[id];
  if (d.habits[id]) {
    give(s, fx, 8, 3, 'habit');
    fx.push({ type: 'react', kind: 'habit', text: say(s, 'habit') }, { type: 'haptic', pattern: 12 });
  }
  settle(s, fx);
  return fx;
}

export function logWeight(s: State, kg: number): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  const first = d.weight == null;
  d.weight = kg;
  s.profile.weight = kg;
  if (first) give(s, fx, 5, 0);
  settle(s, fx);
  return fx;
}

export function buyItem(s: State, id: string): Effect[] {
  const fx: Effect[] = [];
  const it = ITEM[id];
  if (!it || it.price == null || s.owned.includes(id) || s.coins < it.price || !inSeason(it)) return fx;
  s.coins -= it.price;
  s.owned.push(id);
  s.eq[it.slot] = id;
  fx.push({ type: 'celebrate', kind: 'item', item: id, title: tx(s.lang, `Нова річ: ${it.name.uk}`, `New item: ${it.name.en}`), text: tx(s.lang, `${s.profile.cname} вже приміряє. Пасує!`, `${s.profile.cname} is trying it on. Looks great!`) });
  settle(s, fx);
  return fx;
}
export function toggleEquip(s: State, id: string): Effect[] {
  const it = ITEM[id];
  if (!it || !s.owned.includes(id)) return [];
  s.eq[it.slot] = s.eq[it.slot] === id ? null : id;
  const fx: Effect[] = [{ type: 'haptic', pattern: 10 }];
  settle(s, fx);
  return fx;
}

export const GAME_PLAYS_PER_DAY = 3;
export function finishGame(s: State, score: number): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  d.gamePlays++;
  s.stats.games++;
  const rewarded = d.gamePlays <= GAME_PLAYS_PER_DAY;
  const coins = rewarded ? Math.min(12, Math.floor(score / 3)) : 0;
  if (score > s.gameBest) s.gameBest = score;
  if (coins) give(s, fx, 5, coins);
  settle(s, fx);
  return fx;
}

/** Викликається при відкритті: повернення після перерви — тепле привітання, без докорів */
export function onOpen(s: State): Effect[] {
  const fx: Effect[] = [];
  const t = today();
  const gap = daysBetween(s.lastSeen, t);
  ensureToday(s);
  if (s.onb >= 99 && gap >= 3) {
    unlock(s, fx, 'comeback');
    fx.push({ type: 'react', kind: 'back', text: say(s, 'back') });
  }
  s.lastSeen = t;
  return fx;
}

/** Дні поспіль із помітно меншою за норму енергією — м'яке повідомлення про турботу, а не нагорода */
export function lowIntakeDays(s: State) {
  const n = dailyNorm(s.profile).target;
  let c = 0;
  for (let i = 1; i <= 3; i++) {
    const d = s.days[addDays(today(), -i)];
    if (d && !d.demo && d.foods.length && dayTotals(d).kcal < n * 0.6) c++;
  }
  return c;
}

export const MEALS: { k: MealKey; name: L10n }[] = [
  { k: 'b', name: { uk: 'Сніданок', en: 'Breakfast' } },
  { k: 'l', name: { uk: 'Обід', en: 'Lunch' } },
  { k: 'd', name: { uk: 'Вечеря', en: 'Dinner' } },
  { k: 's', name: { uk: 'Перекус', en: 'Snack' } }
];
export const autoMeal = (): MealKey => { const h = new Date().getHours(); return h < 11 ? 'b' : h < 16 ? 'l' : h < 21 ? 'd' : 's'; };
