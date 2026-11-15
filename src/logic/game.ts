import type { CharId, Day, Effect, Food, Lang, MealKey, State, Workout, L10n, WidgetId } from '../types';
import { addDays, daysBetween, seeded, sleepHours, today, weekKey } from './dates';
import { colorCount, dailyNorm, dayTotals, stepsToKm } from './nutrition';
import { ITEM, ITEMS, inSeason } from '../data/items';
import { CITIES } from '../data/exercise';
import { CHARS, CHAR_IDS, UNLOCK, type LineKind } from '../data/characters';
import { COLOR_CATS, CATS } from '../data/foods';
import { allAchs, findAch, LEGACY_ACH, TIERS, type Agg } from '../data/achievements';
import { seasonOf, SEASON_TIER_PTS, SEASON_TIERS, SEASONS, TIER_REWARDS } from '../data/seasons';
import { fmt, lx, tx, plural } from '../i18n';

export const STATE_VERSION = 2;
/** Рівень профілю гравця */
export const need = (level: number) => 80 + 40 * (level - 1);
/** Рівень героя: росте трохи швидше */
export const needHero = (lv: number) => 60 + 30 * (lv - 1);
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
export const hero = (s: State, id: CharId = s.profile.char) => s.chars[id];

let idc = 0;
export const uid = (p = 'e') => `${p}${Date.now().toString(36)}${(idc++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function newDay(date: string): Day {
  return { date, foods: [], water: 0, workouts: [], rest: false, steps: 0, habits: {}, quests: {}, rewards: {}, gamePlays: 0 };
}
export const DEFAULT_HOME: WidgetId[] = ['hero', 'plate', 'water', 'move', 'quests', 'weekly', 'mood', 'habits'];
export const ALL_WIDGETS: WidgetId[] = ['hero', 'plate', 'water', 'move', 'quests', 'weekly', 'season', 'streak', 'sleep', 'mood', 'habits', 'diary', 'journey', 'weight', 'game'];
export const HALF_WIDGETS: WidgetId[] = ['water', 'move', 'streak', 'sleep', 'weight', 'journey'];

function makeCode() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'FS-' + Array.from({ length: 6 }, () => a[Math.floor(Math.random() * a.length)]).join('');
}

export function freshState(lang: Lang = 'uk'): State {
  const t = today();
  const chars = Object.fromEntries(CHAR_IDS.map(id => [id, { own: false, lv: 1, xp: 0 }])) as State['chars'];
  return {
    v: STATE_VERSION, onb: 0, lang, startDate: t,
    profile: { sex: 'f', age: 30, height: 168, weight: 68, act: 1.375, goal: 'lose', noNum: false, adult: false, disc: false, char: 'bear', cname: CHARS.bear.name[lang], uname: '', waterGoal: 8 },
    days: { [t]: newDay(t) }, xp: 0, level: 1, coins: 150, owned: [], eq: { head: null, neck: null, face: null, bg: null }, ach: {}, prs: {}, km: 0,
    recent: [], favorites: [], customFoods: [],
    habits: [
      { id: 'h_walk', name: lang === 'en' ? 'Fresh air walk' : 'Прогулянка на свіжому повітрі', icon: 'leaf' },
      { id: 'h_read', name: lang === 'en' ? 'Read 10 pages' : 'Прочитати 10 сторінок', icon: 'book' }
    ],
    settings: { sound: true, haptics: true, theme: 'system', style: 'tactile', calm: false, nudges: true, weightChart: false },
    gameBest: 0, lastSeen: t,
    stats: { scans: 0, recipes: 0, distinctFoods: [], games: 0, dailyQ: 0, weeklyQ: 0, records: 0, gps: 0, bestStreak: 0 },
    chars, stars: 3, home: [...DEFAULT_HOME], weekly: {}, season: {}, friendCode: makeCode()
  };
}

/** Перехід зі старих версій: досягнення отримують нові назви, рівень стає рівнем героя */
export function migrateState(raw: any): State {
  const base = freshState(raw?.lang || 'uk');
  const s: State = {
    ...base, ...raw,
    profile: { ...base.profile, ...(raw?.profile || {}) }, settings: { ...base.settings, ...(raw?.settings || {}) },
    stats: { ...base.stats, ...(raw?.stats || {}) }, eq: { ...base.eq, ...(raw?.eq || {}) },
    chars: { ...base.chars, ...(raw?.chars || {}) }
  };
  for (const k of Object.keys(s.days)) s.days[k] = { ...newDay(k), ...s.days[k] };
  if (!raw?.v || raw.v < 2) {
    const ach: Record<string, number> = {};
    for (const [id, ts] of Object.entries(s.ach || {})) ach[LEGACY_ACH[id] || id] = ts as number;
    s.ach = ach;
    if (raw?.onb >= 99) s.chars[s.profile.char] = { own: true, lv: raw.level || 1, xp: raw.xp || 0 };
    if (!raw?.home) s.home = [...DEFAULT_HOME];
  }
  if (!s.friendCode) s.friendCode = base.friendCode;
  s.v = STATE_VERSION;
  return s;
}

export function ensureDay(s: State, key = today()): Day {
  if (!s.days[key]) s.days[key] = newDay(key);
  return s.days[key];
}
export const ensureToday = (s: State) => ensureDay(s, today());
export const day = (s: State, key = today()) => s.days[key];

export function isActive(d?: Day) {
  return !!d && (d.foods.length > 0 || d.water > 0 || d.workouts.length > 0 || d.rest || d.steps > 0 || !!d.sleep || d.mood != null || Object.values(d.habits).some(Boolean) || !!d.note);
}
export const RESERVE_PER_WEEK = 2;

/** М'яка серія: пропущені дні покриваються «днями запасу» (2 на тиждень). Сьогоднішній день ще не закінчився — його пропуск серію не ламає. */
export function streakInfo(s: State, ref = today()) {
  const used: Record<string, number> = {};
  let streak = 0;
  let d = isActive(s.days[ref]) ? ref : addDays(ref, -1);
  let guard = 0;
  while (daysBetween(s.startDate, d) >= 0 && guard++ < 2000) {
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

// ——— Денні завдання
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
  { id: 'note', t: { uk: 'Напиши пару слів у щоденник', en: 'Write a few words in your diary' }, ok: d => !!d.note && d.note.trim().length >= 3 },
  { id: 'protein', t: { uk: 'Добери 80% білка', en: 'Reach 80% of your protein' }, ok: (d, s) => dayTotals(d).p >= dailyNorm(s.profile).prot * 0.8, goals: ['gain', 'keep', 'lose'], numbers: true },
  { id: 'strength', t: { uk: 'Силове тренування', en: 'A strength session' }, ok: d => d.workouts.some(w => w.kind === 'strength'), goals: ['gain'] }
];
const MOVE_Q = ['move10', 'steps5k', 'strength'];
export function questsFor(s: State, date = today()): Quest[] {
  const g = s.profile.goal;
  const pool = QUESTS.filter(q => (!q.goals || q.goals.includes(g)) && !(q.numbers && s.profile.noNum));
  const fixed = pool.find(q => q.id === (g === 'habits' ? 'habit' : 'meals2'))!;
  const rnd = seeded(date + g);
  const rest = pool.filter(q => q !== fixed).map(q => [rnd(), q] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const pick = [fixed, ...rest.slice(0, 2)];
  if (!pick.some(q => MOVE_Q.includes(q.id))) pick[2] = pool.find(q => q.id === 'move10')!;
  return pick;
}

// ——— Тижневі завдання (оновлюються щопонеділка, підсумок — у неділю)
export interface WQuest { id: string; t: L10n; goal: number; val: (w: Day[], s: State) => number; numbers?: boolean }
export const weekDays = (s: State, wk = weekKey(today())) => Array.from({ length: 7 }, (_, i) => s.days[addDays(wk, i)]).filter(Boolean) as Day[];
export const WQUESTS: WQuest[] = [
  { id: 'active4', t: { uk: 'Будь активним 4 дні з 7', en: 'Be active 4 days out of 7' }, goal: 4, val: w => w.filter(isActive).length },
  { id: 'workouts3', t: { uk: '3 тренування за тиждень', en: '3 workouts this week' }, goal: 3, val: w => w.reduce((a, d) => a + d.workouts.length, 0) },
  { id: 'water4', t: { uk: 'Норма води 4 дні', en: 'Water goal on 4 days' }, goal: 4, val: (w, s) => w.filter(d => d.water >= s.profile.waterGoal).length },
  { id: 'variety15', t: { uk: '15 різних продуктів за тиждень', en: '15 different foods this week' }, goal: 15, val: w => new Set(w.flatMap(d => d.foods.map(f => f.food.id))).size },
  { id: 'colors4', t: { uk: '3+ кольори на тарілці 4 дні', en: '3+ plate colours on 4 days' }, goal: 4, val: w => w.filter(d => colorCount(d) >= 3).length },
  { id: 'sleep5', t: { uk: 'Запиши сон 5 разів', en: 'Log sleep 5 times' }, goal: 5, val: w => w.filter(d => d.sleep).length },
  { id: 'steps35', t: { uk: '35 000 кроків за тиждень', en: '35,000 steps this week' }, goal: 35000, val: w => w.reduce((a, d) => a + d.steps, 0) },
  { id: 'mood5', t: { uk: 'Відзнач настрій 5 разів', en: 'Log mood 5 times' }, goal: 5, val: w => w.filter(d => d.mood != null).length },
  { id: 'rest1', t: { uk: 'Один свідомий день відпочинку', en: 'One mindful rest day' }, goal: 1, val: w => w.filter(d => d.rest).length },
  { id: 'habits10', t: { uk: 'Виконай звички 10 разів', en: 'Complete habits 10 times' }, goal: 10, val: w => w.reduce((a, d) => a + Object.values(d.habits).filter(Boolean).length, 0) },
  { id: 'daily8', t: { uk: 'Виконай 8 денних завдань', en: 'Complete 8 daily quests' }, goal: 8, val: w => w.reduce((a, d) => a + Object.keys(d.quests).length, 0) },
  { id: 'diary3', t: { uk: '3 записи в щоденнику', en: '3 diary entries' }, goal: 3, val: w => w.filter(d => d.note && d.note.trim().length >= 3).length }
];
const MOVE_WQ = ['active4', 'workouts3', 'steps35', 'rest1'];
export function weeklyFor(s: State, wk = weekKey(today())): WQuest[] {
  const rnd = seeded('w' + wk + s.profile.goal);
  const sorted = WQUESTS.map(q => [rnd(), q] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const move = sorted.find(q => MOVE_WQ.includes(q.id))!;
  return [move, ...sorted.filter(q => q !== move && !MOVE_WQ.includes(q.id)).slice(0, 2)];
}

// ——— Нагороди
const CAPS: Record<string, number> = { food: 10, water: 14, workout: 4, steps: 20, habit: 10 };
const say = (s: State, kind: LineKind) => { const L = CHARS[s.profile.char].lines[kind][s.lang]; return L[Math.floor(Math.random() * L.length)]; };
export const line = say;

function heroXp(s: State, fx: Effect[], xp: number) {
  const c = s.chars[s.profile.char];
  if (!c) return;
  c.xp += xp;
  while (c.xp >= needHero(c.lv)) {
    c.xp -= needHero(c.lv); c.lv++;
    const st = stageOf(c.lv);
    const newStage = STAGES.some(x => x.from === c.lv);
    fx.push({ type: 'celebrate', kind: 'level', big: String(c.lv), char: s.profile.char,
      title: tx(s.lang, `${s.profile.cname} тепер на ${c.lv} рівні`, `${s.profile.cname} reached level ${c.lv}`),
      text: newStage ? tx(s.lang, `Нова стадія: ${st.name.uk}. Подивись, як ${s.profile.cname} змінився!`, `New stage: ${st.name.en}. Look how ${s.profile.cname} has grown!`)
        : tx(s.lang, 'Досвід росте від регулярності, а не від ідеальності.', 'XP grows from consistency, not perfection.') });
  }
}
function give(s: State, fx: Effect[], xp: number, coins: number, key?: string, text?: string) {
  const d = ensureToday(s);
  if (key) {
    const n = d.rewards[key] || 0;
    if (n >= (CAPS[key] ?? 1)) return false;
    d.rewards[key] = n + 1;
  }
  s.xp += xp; s.coins += coins;
  heroXp(s, fx, xp);
  fx.push({ type: 'toast', icon: 'coin', text: text || tx(s.lang, `+${xp} досвіду${coins ? `, +${coins} ${plural('uk', coins, ['монета', 'монети', 'монет'], ['', ''])}` : ''}`, `+${xp} XP${coins ? `, +${coins} ${coins === 1 ? 'coin' : 'coins'}` : ''}`) });
  if (coins) fx.push({ type: 'sound', kind: 'coin' });
  return true;
}

function addSeason(s: State, fx: Effect[], pts: number, kind: 'daily' | 'weekly') {
  const se = seasonOf();
  const st = (s.season[se.key] ||= { pts: 0, tier: 0, daily: 0, weekly: 0 });
  st.pts += pts; st[kind]++;
  const tier = Math.min(SEASON_TIERS, Math.floor(st.pts / SEASON_TIER_PTS));
  while (st.tier < tier) {
    st.tier++;
    const r = TIER_REWARDS[st.tier - 1];
    if (r.coins) s.coins += r.coins;
    if (r.stars) s.stars += r.stars;
    const itemId = r.item != null ? se.def.items[r.item] : undefined;
    if (itemId && !s.owned.includes(itemId)) s.owned.push(itemId);
    const parts = [r.coins ? tx(s.lang, `${r.coins} монет`, `${r.coins} coins`) : '', r.stars ? tx(s.lang, `${r.stars} ${plural('uk', r.stars, ['зірка', 'зірки', 'зірок'], ['', ''])}`, `${r.stars} ${r.stars === 1 ? 'star' : 'stars'}`) : '', itemId ? lx(s.lang, ITEM[itemId].name) : ''].filter(Boolean).join(', ');
    fx.push({ type: 'celebrate', kind: itemId ? 'item' : 'season', item: itemId, big: String(st.tier),
      title: tx(s.lang, `${se.def.name.uk}: рівень ${st.tier}`, `${se.def.name.en}: tier ${st.tier}`), text: tx(s.lang, `Нагорода: ${parts}.`, `Reward: ${parts}.`) });
  }
}

export function aggregate(s: State): Agg {
  const days = Object.values(s.days).filter(d => !d.demo);
  const st = streakInfo(s);
  return {
    entries: days.reduce((a, d) => a + d.foods.length, 0), distinct: s.stats.distinctFoods.length,
    days5: days.filter(d => colorCount(d) >= 5).length, waterDays: days.filter(d => d.water >= s.profile.waterGoal).length,
    workouts: days.reduce((a, d) => a + d.workouts.length, 0), records: s.stats.records, steps10k: days.filter(d => d.steps >= 10000).length,
    km: s.km, streak: Math.max(s.stats.bestStreak || 0, st.streak), restDays: days.filter(d => d.rest).length, sleeps: days.filter(d => d.sleep).length,
    goodSleeps: days.filter(d => (d.sleep?.hours || 0) >= 7).length, moods: days.filter(d => d.mood != null).length,
    habits: days.reduce((a, d) => a + Object.values(d.habits).filter(Boolean).length, 0), notes: days.filter(d => d.note && d.note.trim().length >= 3).length,
    photos: days.filter(d => d.photo).length, dailyQ: s.stats.dailyQ, weeklyQ: s.stats.weeklyQ, level: s.level,
    heroes: CHAR_IDS.filter(c => s.chars[c]?.own).length, items: s.owned.length, recipes: s.stats.recipes, scans: s.stats.scans,
    game: s.gameBest, gps: s.stats.gps, cities: CITIES.filter(c => c.km > 0 && s.km >= c.km).length,
    heroLv: Math.max(...CHAR_IDS.map(c => s.chars[c]?.lv || 1))
  };
}

export function unlock(s: State, fx: Effect[], id: string) {
  if (s.ach[id]) return;
  const a = findAch(id);
  if (!a) return;
  s.ach[id] = Date.now();
  const stars = TIERS[a.tier]?.stars || 1;
  s.stars += stars;
  const item = ITEMS.find(i => i.earn === id);
  if (item && !s.owned.includes(item.id)) s.owned.push(item.id);
  fx.push({ type: 'celebrate', kind: 'ach', ach: id,
    title: (a.secret ? tx(s.lang, 'Таємне досягнення: ', 'Secret achievement: ') : tx(s.lang, 'Досягнення: ', 'Achievement: ')) + lx(s.lang, a.name),
    text: lx(s.lang, a.desc) + tx(s.lang, `. +${stars} ${plural('uk', stars, ['зірка', 'зірки', 'зірок'], ['', ''])}`, `. +${stars} ${stars === 1 ? 'star' : 'stars'}`) + (item ? tx(s.lang, `, нагорода: ${item.name.uk}`, `, reward: ${item.name.en}`) : '') + '.' });
  for (const c of CHAR_IDS) {
    if (UNLOCK[c].ach === id && !s.chars[c].own) {
      s.chars[c].own = true;
      fx.push({ type: 'celebrate', kind: 'hero', char: c, title: tx(s.lang, `Новий герой: ${CHARS[c].name.uk}!`, `New hero: ${CHARS[c].name.en}!`), text: lx(s.lang, CHARS[c].vibe) + tx(s.lang, ' Обери героя у вкладці «Герої».', ' Pick them in the Heroes tab.') });
    }
  }
}

/** Після кожної дії: денні й тижневі завдання → досягнення → рівень профілю */
export function settle(s: State, fx: Effect[]) {
  const d = ensureToday(s);
  for (const q of questsFor(s)) {
    if (!d.quests[q.id] && q.ok(d, s)) {
      d.quests[q.id] = 1; s.stats.dailyQ++;
      give(s, fx, 20, 15, undefined, tx(s.lang, `Завдання виконано: +20 досвіду, +15 монет`, `Quest done: +20 XP, +15 coins`));
      addSeason(s, fx, 10, 'daily');
    }
  }
  const wk = weekKey(today());
  const wdone = (s.weekly[wk] ||= {});
  const wd = weekDays(s, wk);
  const wqs = weeklyFor(s, wk);
  for (const q of wqs) {
    if (!wdone[q.id] && q.val(wd, s) >= q.goal) {
      wdone[q.id] = 1; s.stats.weeklyQ++; s.stars += 1;
      give(s, fx, 60, 50, undefined, tx(s.lang, 'Тижневе завдання! +60 досвіду, +50 монет, +1 зірка', 'Weekly quest! +60 XP, +50 coins, +1 star'));
      addSeason(s, fx, 40, 'weekly');
      if (wqs.every(x => wdone[x.id])) unlock(s, fx, 'firstsunday');
    }
  }
  s.stats.bestStreak = Math.max(s.stats.bestStreak || 0, streakInfo(s).streak);
  const ag = aggregate(s);
  const se = seasonOf();
  for (const a of allAchs(s, se.key)) if (!s.ach[a.id] && a.metric && a.goal != null && a.metric(ag, s) >= a.goal) unlock(s, fx, a.id);
  if (Object.values(s.eq).filter(Boolean).length >= 3) unlock(s, fx, 'stylish');
  while (s.xp >= need(s.level)) {
    s.xp -= need(s.level); s.level++;
    fx.push({ type: 'toast', icon: 'user', text: tx(s.lang, `Рівень профілю ${s.level}!`, `Profile level ${s.level}!`) });
  }
}

// ——— Дії
export function addFoods(s: State, list: { food: Food; g: number }[], meal: MealKey, opts: { repeat?: boolean; scanned?: boolean; chat?: boolean; date?: string } = {}): Effect[] {
  const fx: Effect[] = [];
  const date = opts.date || today();
  const isToday = date === today();
  const d = ensureDay(s, date);
  if (d.demo) delete d.demo; // день із прикладом стає справжнім, щойно ти щось додаєш
  const before = new Set(dayTotals(d).cats);
  for (const { food, g } of list) {
    d.foods.push({ id: uid('f'), food, g, meal, at: Date.now() });
    s.recent = [food, ...s.recent.filter(r => r.id !== food.id)].slice(0, 16);
    if (!s.stats.distinctFoods.includes(food.id)) s.stats.distinctFoods.push(food.id);
    if (isToday) give(s, fx, 10, 5, 'food');
  }
  if (!isToday) {
    fx.push({ type: 'toast', icon: 'book', text: tx(s.lang, 'Додано до щоденника за той день', 'Added to that day in your diary') });
    settle(s, fx);
    return fx;
  }
  const newCats = [...new Set(list.map(l => l.food.cat))].filter(c => COLOR_CATS.includes(c) && !before.has(c));
  if (newCats.length) {
    s.xp += 5 * newCats.length; heroXp(s, fx, 5 * newCats.length);
    fx.push({ type: 'toast', icon: 'plate', text: tx(s.lang, `Новий колір на тарілці: ${newCats.map(c => CATS[c].uk).join(', ')}`, `New colour on the plate: ${newCats.map(c => CATS[c].en).join(', ')}`) });
  }
  if (opts.repeat) unlock(s, fx, 'repeat');
  if (opts.chat) unlock(s, fx, 'chatlog');
  if (opts.scanned) s.stats.scans++;
  fx.push({ type: 'react', kind: 'meal', text: mealNote(s, d.foods.filter(f => f.meal === meal), list) || say(s, 'meal') }, { type: 'haptic', pattern: 15 });
  settle(s, fx);
  return fx;
}
/** Тепла реакція героя на прийом їжі. Лише про різноманіття й добрі знахідки — ніколи про «забагато». */
export function mealNote(s: State, mealEntries: { food: Food }[], added: { food: Food }[]): string | null {
  const cats = new Set(mealEntries.map(e => e.food.cat).filter(c => COLOR_CATS.includes(c)));
  const has = (c: string) => added.some(a => a.food.cat === c);
  const fiber = added.reduce((a, x) => a + (x.food.fiber || 0), 0);
  const L = s.lang;
  const opts: string[] = [];
  if (cats.size >= 4) opts.push(tx(L, `${cats.size} групи продуктів в одному прийомі. Справжня веселка!`, `${cats.size} food groups in one meal. A real rainbow!`));
  else if (cats.size === 3) opts.push(tx(L, 'Три кольори на тарілці. Красиво вийшло!', 'Three colours on the plate. Looks great!'));
  if (has('veg')) opts.push(tx(L, 'Овочі в ділі. Хрумко!', 'Veggies on board. Crunchy!'));
  if (has('fruit')) opts.push(tx(L, 'Фрукти — смачна порція вітамінів.', 'Fruit — a tasty dose of vitamins.'));
  if (has('protein')) opts.push(tx(L, 'Є білок. М\'язам приємно.', 'Protein’s in. Your muscles say thanks.'));
  if (fiber >= 4) opts.push(tx(L, 'Багато клітковини. Довго буде ситно.', 'Lots of fibre. You’ll stay full for a while.'));
  if (!opts.length) return null;
  return opts[Math.floor(Math.random() * opts.length)];
}

/** Скопіювати їжу з одного дня (або один прийом) в інший день */
export function copyFoods(s: State, from: string, to: string, meal?: MealKey, toMeal?: MealKey): Effect[] {
  const src = (s.days[from]?.foods || []).filter(f => !meal || f.meal === meal);
  if (!src.length) return [];
  const all: Effect[] = [];
  for (const m of MEALS) {
    const es = src.filter(f => f.meal === m.k);
    if (!es.length) continue;
    all.push(...addFoods(s, es.map(e => ({ food: e.food, g: e.g })), meal && toMeal ? toMeal : m.k, { repeat: true, date: to }));
  }
  // одна реакція й один тост замість кількох
  const keep = all.filter(e => e.type !== 'react' && e.type !== 'haptic' && !(e.type === 'toast' && e.icon === 'book'));
  const uniq = keep.filter((e, i) => e.type !== 'toast' || keep.findIndex(x => x.type === 'toast' && x.text === e.text) === i);
  uniq.push({ type: 'toast', icon: 'repeat', text: tx(s.lang, `Скопійовано: ${src.length} ${plural('uk', src.length, ['страва', 'страви', 'страв'], ['', ''])}`, `Copied ${src.length} ${src.length === 1 ? 'item' : 'items'}`) });
  if (to === today()) uniq.push({ type: 'react', kind: 'meal', text: say(s, 'meal') });
  return uniq;
}

export type Nudge = { id: string; uk: string; en: string; action: 'water' | 'food'; meal?: MealKey };
/** М'яке нагадування на головній. Не більше одного, можна сховати до завтра. */
export function nudgeFor(s: State, now = new Date()): Nudge | null {
  if (!s.settings.nudges || s.onb !== 99) return null;
  const d = s.days[today()];
  const off = new Set(d?.dismissed || []);
  const h = now.getHours();
  const water = d?.water || 0;
  const ate = (m: MealKey) => (d?.foods || []).some(f => f.meal === m);
  const list: (Nudge | false)[] = [
    h >= 11 && water === 0 && { id: 'water1', uk: 'Може, склянку води? Тілу буде приємно.', en: 'Fancy a glass of water? Your body will like it.', action: 'water' },
    h >= 16 && water > 0 && water < s.profile.waterGoal / 2 && { id: 'water2', uk: 'Ще склянка води до вечора — і буде чудово.', en: 'One more glass of water before evening would be lovely.', action: 'water' },
    h >= 9 && h < 12 && !ate('b') && { id: 'breakfast', uk: 'Як щодо сніданку? Записати можна будь-коли, навіть пізніше.', en: 'How about breakfast? You can log it any time, even later.', action: 'food', meal: 'b' },
    h >= 13 && h < 16 && !ate('l') && { id: 'lunch', uk: 'Час для обіду. Енергія знадобиться на другу половину дня.', en: 'Lunchtime. You’ll want the energy for the afternoon.', action: 'food', meal: 'l' },
    h >= 19 && h < 22 && !ate('d') && { id: 'dinner', uk: 'Вечеря вже була? Якщо так, додай її, коли зручно.', en: 'Had dinner yet? If so, add it whenever it suits you.', action: 'food', meal: 'd' }
  ];
  return (list.find(n => n && !off.has(n.id)) as Nudge | undefined) || null;
}
export function dismissNudge(s: State, id: string) {
  const d = ensureDay(s, today());
  d.dismissed = [...new Set([...(d.dismissed || []), id])];
  return [] as Effect[];
}

export function removeFood(s: State, id: string, date = today()) {
  const d = ensureDay(s, date);
  d.foods = d.foods.filter(f => f.id !== id);
  return [] as Effect[];
}

export function addWater(s: State, delta: 1 | -1, date = today()): Effect[] {
  const fx: Effect[] = [];
  const d = ensureDay(s, date);
  if (delta < 0) { d.water = Math.max(0, d.water - 1); return fx; }
  d.water++;
  if (date !== today()) return fx;
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
      fx.push({ type: 'celebrate', kind: 'city', title: tx(s.lang, `${s.profile.cname}: прибуття в ${c.name.uk}`, `${s.profile.cname} reached ${c.name.en}`),
        text: tx(s.lang, `${c.fact.uk} Сувенір: ${c.souvenir.uk}. +30 монет.`, `${c.fact.en} Souvenir: ${c.souvenir.en}. +30 coins.`) });
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
  if (xp) { s.xp += xp; s.coins += coins; heroXp(s, fx, xp); }
  fx.push({ type: 'toast', icon: 'steps', text: tx(s.lang, `+${fmt(n, 'uk')} кроків${xp ? `, +${xp} досвіду` : ''}`, `+${fmt(n, 'en')} steps${xp ? `, +${xp} XP` : ''}`) });
  fx.push({ type: 'react', kind: 'steps', text: say(s, 'steps') });
  settle(s, fx);
  return fx;
}

export function addWorkout(s: State, w: Omit<Workout, 'id' | 'at'>, date = today()): Effect[] {
  const fx: Effect[] = [];
  const d = ensureDay(s, date);
  d.workouts.push({ ...w, id: uid('w'), at: Date.now() });
  if (w.km) travel(s, fx, w.km);
  if (w.source === 'gps' || w.source === 'gpx') {
    s.stats.gps++;
    if (w.km && /walk|run|hike|ходьб|біг|похід/i.test(w.name.uk + w.name.en)) d.steps += Math.round(w.km / 0.00075);
  }
  if (date === today()) {
    give(s, fx, 25, 10, 'workout');
    fx.push({ type: 'react', kind: 'workout', text: say(s, 'workout') }, { type: 'haptic', pattern: 20 });
  } else fx.push({ type: 'toast', icon: 'book', text: tx(s.lang, 'Тренування додано в щоденник', 'Workout added to your diary') });
  settle(s, fx);
  return fx;
}
export function removeWorkout(s: State, id: string, date = today()) {
  const d = ensureDay(s, date);
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
  if (isPR) s.stats.records++;
  const min = valid.length * 3;
  const fx = addWorkout(s, { kind: 'strength', name, detail: valid.map(x => (x.w ? `${x.w}×${x.r}` : `${x.r}`)).join(', '), min, kcal: (5 * weight * min) / 60, source: 'manual' });
  if (isPR) {
    fx.unshift({ type: 'celebrate', kind: 'record', big: best.w ? `${fmt(best.w, s.lang, 1)} ${tx(s.lang, 'кг', 'kg')}` : `${best.r}`,
      title: tx(s.lang, `Новий рекорд: ${name.uk}`, `New record: ${name.en}`),
      text: tx(s.lang, `Попередній: ${prev.w ? prev.w + ' кг × ' : ''}${prev.r}. ${s.profile.cname} аплодує стоячи.`, `Previous: ${prev.w ? prev.w + ' kg × ' : ''}${prev.r}. ${s.profile.cname} gives a standing ovation.`) });
    settle(s, fx);
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

export function logSleep(s: State, bed: string, wake: string, quality: 1 | 2 | 3, date = today()): Effect[] {
  const fx: Effect[] = [];
  const d = ensureDay(s, date);
  const first = !d.sleep;
  d.sleep = { bed, wake, quality, hours: sleepHours(bed, wake) };
  if (date === today()) {
    if (first) give(s, fx, 10, 5);
    fx.push({ type: 'react', kind: 'sleep', text: say(s, 'sleep') });
  }
  settle(s, fx);
  return fx;
}

export function setMood(s: State, m: 1 | 2 | 3 | 4, date = today()): Effect[] {
  const fx: Effect[] = [];
  const d = ensureDay(s, date);
  const first = d.mood == null;
  d.mood = m;
  if (date === today()) {
    if (first) give(s, fx, 5, 2);
    fx.push({ type: 'react', kind: 'mood', text: say(s, 'mood') });
  }
  settle(s, fx);
  return fx;
}

export function setNote(s: State, text: string, date = today()): Effect[] {
  const fx: Effect[] = [];
  const d = ensureDay(s, date);
  const had = !!(d.note && d.note.trim().length >= 3);
  d.note = text.slice(0, 4000);
  if (date === today() && !had && d.note.trim().length >= 3) {
    give(s, fx, 5, 2, 'note');
    if (new Date().getHours() >= 23) unlock(s, fx, 'nightnote');
  }
  settle(s, fx);
  return fx;
}
export function setPhoto(s: State, photo: string | undefined, date = today()): Effect[] {
  const fx: Effect[] = [];
  ensureDay(s, date).photo = photo;
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

/** Відкрити героя за зірки */
export function buyHero(s: State, id: CharId): Effect[] {
  const fx: Effect[] = [];
  const c = s.chars[id];
  if (c.own || s.stars < UNLOCK[id].stars) return fx;
  s.stars -= UNLOCK[id].stars;
  c.own = true;
  fx.push({ type: 'celebrate', kind: 'hero', char: id, title: tx(s.lang, `Новий герой: ${CHARS[id].name.uk}!`, `New hero: ${CHARS[id].name.en}!`), text: lx(s.lang, CHARS[id].vibe) });
  settle(s, fx);
  return fx;
}
/** Обрати активного героя. Досвід іде тому, хто зараз поруч */
export function selectHero(s: State, id: CharId): Effect[] {
  if (!s.chars[id]?.own || s.profile.char === id) return [];
  const names = (s.heroNames ||= {});
  names[s.profile.char] = s.profile.cname;
  s.profile.char = id;
  s.profile.cname = names[id] || CHARS[id].name[s.lang];
  return [{ type: 'react', kind: 'hello', text: say(s, 'hello') }, { type: 'haptic', pattern: 15 }];
}

export const GAME_PLAYS_PER_DAY = 3;
export function finishGame(s: State, score: number): Effect[] {
  const fx: Effect[] = [];
  const d = ensureToday(s);
  d.gamePlays++;
  s.stats.games++;
  const coins = d.gamePlays <= GAME_PLAYS_PER_DAY ? Math.min(12, Math.floor(score / 3)) : 0;
  if (score > s.gameBest) s.gameBest = score;
  if (coins) give(s, fx, 5, coins);
  settle(s, fx);
  return fx;
}

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
export { SEASONS };
