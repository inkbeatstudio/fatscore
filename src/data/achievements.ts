import type { L10n, State } from '../types';
import { SEASONS, parseSeasonKey } from './seasons';

/** Знімок показників, з яких рахуються досягнення */
export interface Agg {
  entries: number; distinct: number; days5: number; waterDays: number; workouts: number; records: number; steps10k: number; km: number;
  streak: number; restDays: number; sleeps: number; goodSleeps: number; moods: number; habits: number; notes: number; photos: number;
  dailyQ: number; weeklyQ: number; level: number; heroes: number; items: number; recipes: number; scans: number; game: number; gps: number; cities: number; heroLv: number;
}

export interface Series { key: string; icon: string; name: L10n; desc: (n: number) => L10n; goals: number[]; metric: (a: Agg) => number; color: string }

const L = (uk: string, en: string): L10n => ({ uk, en });
/** Відмінок за числом: 1 тренування, 2 тренування, 5 тренувань */
const pu = (n: number, f: [string, string, string]) => { const a = n % 100, b = n % 10; return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b > 1 && b < 5 ? f[1] : f[2]; };
const pe = (n: number, one: string, many: string) => (n === 1 ? one : many);
export const SERIES: Series[] = [
  { key: 'meals', icon: 'food', color: '#E5462B', name: L('Літописець тарілки', 'Plate chronicler'), desc: n => L(`Зроби ${n} ${pu(n, ['запис', 'записи', 'записів'])} їжі`, `Log food ${n} ${pe(n, 'time', 'times')}`), goals: [1, 50, 250, 1000], metric: a => a.entries },
  { key: 'variety', icon: 'plate', color: '#6F7F2E', name: L('Дослідник смаків', 'Taste explorer'), desc: n => L(`Спробуй ${n} ${pu(n, ['різний продукт', 'різні продукти', 'різних продуктів'])}`, `Try ${n} different foods`), goals: [10, 30, 60, 120], metric: a => a.distinct },
  { key: 'rainbow', icon: 'star', color: '#C0567F', name: L('Веселка на тарілці', 'Rainbow plate'), desc: n => L(n === 1 ? 'Усі 5 кольорів тарілки за один день' : `Усі 5 кольорів тарілки за день — ${n} ${pu(n, ['раз', 'рази', 'разів'])}`, n === 1 ? 'All 5 plate colours in one day' : `All 5 plate colours in a day, ${n} times`), goals: [1, 10, 50], metric: a => a.days5 },
  { key: 'water', icon: 'drop', color: '#3B8FB5', name: L('Водяний', 'Hydro hero'), desc: n => L(n === 1 ? 'Виконай норму води за день' : `Норма води ${n} ${pu(n, ['день', 'дні', 'днів'])}`, n === 1 ? 'Hit your water goal for a day' : `Hit your water goal on ${n} days`), goals: [1, 7, 30, 100, 365], metric: a => a.waterDays },
  { key: 'workouts', icon: 'dumbbell', color: '#E07A1F', name: L('Невтомний', 'Unstoppable'), desc: n => L(n === 1 ? 'Перше тренування' : `${n} ${pu(n, ['тренування', 'тренування', 'тренувань'])}`, n === 1 ? 'Your first workout' : `${n} workouts`), goals: [1, 10, 50, 150, 365], metric: a => a.workouts },
  { key: 'records', icon: 'trophy', color: '#B97A00', name: L('Рекордсмен', 'Record breaker'), desc: n => L(n === 1 ? 'Побий власний рекорд' : `Побий власний рекорд ${n} ${pu(n, ['раз', 'рази', 'разів'])}`, n === 1 ? 'Beat a personal best' : `Beat a personal best ${n} times`), goals: [1, 10, 30], metric: a => a.records },
  { key: 'steps', icon: 'steps', color: '#5E8A3A', name: L('Десять тисяч', 'Ten thousand'), desc: n => L(n === 1 ? '10 000 кроків за день' : `10 000 кроків за день — ${n} ${pu(n, ['раз', 'рази', 'разів'])}`, n === 1 ? '10,000 steps in a day' : `10,000 steps in a day, ${n} times`), goals: [1, 10, 50, 150], metric: a => a.steps10k },
  { key: 'km', icon: 'map', color: '#3B6FB5', name: L('Мандрівник', 'Wanderer'), desc: n => L(`Подолай ${n} км`, `Travel ${n} km`), goals: [10, 100, 500, 1500], metric: a => a.km },
  { key: 'cities', icon: 'map', color: '#C4552B', name: L('Колекціонер міст', 'City collector'), desc: n => L(n === 1 ? 'Дійди до першого міста на мапі' : `Дійди до ${n} ${pu(n, ['міста', 'міст', 'міст'])} на мапі`, n === 1 ? 'Reach the first city on the map' : `Reach ${n} cities on the map`), goals: [1, 3, 7], metric: a => a.cities },
  { key: 'gps', icon: 'move', color: '#2A7F8F', name: L('Слідопит', 'Pathfinder'), desc: n => L(n === 1 ? 'Запиши перший маршрут з GPS або годинника' : `Запиши ${n} ${pu(n, ['маршрут', 'маршрути', 'маршрутів'])} з GPS або годинника`, `Record ${n} GPS or watch ${pe(n, 'route', 'routes')}`), goals: [1, 10, 50], metric: a => a.gps },
  { key: 'streak', icon: 'flame', color: '#E5462B', name: L('Серія', 'Streak'), desc: n => L(`Серія ${n} ${pu(n, ['день', 'дні', 'днів'])}`, `A ${n}-day streak`), goals: [3, 7, 30, 100, 365], metric: a => a.streak },
  { key: 'rest', icon: 'rest', color: '#6F7F2E', name: L('Мудрий відпочинок', 'Wise rest'), desc: n => L(n === 1 ? 'Свідомий день відпочинку' : `${n} ${pu(n, ['свідомий день', 'свідомі дні', 'свідомих днів'])} відпочинку`, n === 1 ? 'A mindful rest day' : `${n} mindful rest days`), goals: [1, 10, 30], metric: a => a.restDays },
  { key: 'sleep', icon: 'moon', color: '#536F8E', name: L('Соня', 'Sleepyhead'), desc: n => L(`Запиши сон ${n} ${pu(n, ['раз', 'рази', 'разів'])}`, `Log sleep ${n} times`), goals: [7, 30, 100], metric: a => a.sleeps },
  { key: 'goodsleep', icon: 'moon', color: '#3B2F55', name: L('Глибокий сон', 'Deep sleeper'), desc: n => L(`7+ годин сну — ${n} ${pu(n, ['ніч', 'ночі', 'ночей'])}`, `7+ hours of sleep on ${n} nights`), goals: [7, 30, 100], metric: a => a.goodSleeps },
  { key: 'mood', icon: 'heart', color: '#C0567F', name: L('Чуйність', 'Self-aware'), desc: n => L(`Відзнач настрій ${n} ${pu(n, ['раз', 'рази', 'разів'])}`, `Log mood ${n} times`), goals: [7, 30, 100], metric: a => a.moods },
  { key: 'habits', icon: 'leaf', color: '#5E8A3A', name: L('Сила звички', 'Habit power'), desc: n => L(n === 1 ? 'Виконай свою звичку' : `Виконай свої звички ${n} ${pu(n, ['раз', 'рази', 'разів'])}`, n === 1 ? 'Complete one of your habits' : `Complete your habits ${n} times`), goals: [1, 50, 250, 1000], metric: a => a.habits },
  { key: 'diary', icon: 'book', color: '#8A5A3C', name: L('Щоденник', 'Dear diary'), desc: n => L(n === 1 ? 'Зроби перший запис у щоденнику' : `Зроби ${n} ${pu(n, ['запис', 'записи', 'записів'])} у щоденнику`, n === 1 ? 'Write your first diary entry' : `Write ${n} diary entries`), goals: [1, 10, 50, 200], metric: a => a.notes },
  { key: 'photos', icon: 'sun', color: '#E07A1F', name: L('Фото дня', 'Photo of the day'), desc: n => L(n === 1 ? 'Додай перше фото дня' : `Додай ${n} фото дня`, n === 1 ? 'Add your first photo of the day' : `Add ${n} photos of the day`), goals: [1, 30], metric: a => a.photos },
  { key: 'daily', icon: 'check', color: '#E5462B', name: L('Виконавець', 'Quest taker'), desc: n => L(`Виконай ${n} ${pu(n, ['денне завдання', 'денні завдання', 'денних завдань'])}`, `Complete ${n} daily quests`), goals: [10, 50, 200, 500], metric: a => a.dailyQ },
  { key: 'weekly', icon: 'star', color: '#B97A00', name: L('Тиждень героя', 'Hero of the week'), desc: n => L(n === 1 ? 'Виконай тижневе завдання' : `Виконай ${n} ${pu(n, ['тижневе завдання', 'тижневі завдання', 'тижневих завдань'])}`, `Complete ${n} weekly ${pe(n, 'quest', 'quests')}`), goals: [1, 10, 40, 100], metric: a => a.weeklyQ },
  { key: 'level', icon: 'user', color: '#3B1E3F', name: L('Досвідчений гравець', 'Seasoned player'), desc: n => L(`Досягни ${n} рівня профілю`, `Reach profile level ${n}`), goals: [3, 5, 10, 20, 30], metric: a => a.level },
  { key: 'herolv', icon: 'heart', color: '#E07A1F', name: L('Найкращі друзі', 'Best friends'), desc: n => L(`Прокачай героя до ${n} рівня`, `Raise a hero to level ${n}`), goals: [5, 10, 15], metric: a => a.heroLv },
  { key: 'heroes', icon: 'user', color: '#6F7F2E', name: L('Колекція героїв', 'Hero collection'), desc: n => L(`Збери ${n} ${pu(n, ['героя', 'героїв', 'героїв'])}`, `Collect ${n} heroes`), goals: [2, 4, 6], metric: a => a.heroes },
  { key: 'items', icon: 'wardrobe', color: '#C0567F', name: L('Модник', 'Fashionista'), desc: n => L(`Збери ${n} ${pu(n, ['річ', 'речі', 'речей'])}`, `Collect ${n} items`), goals: [3, 10, 20, 30], metric: a => a.items },
  { key: 'recipes', icon: 'pot', color: '#8A5A3C', name: L('Шеф', 'Chef'), desc: n => L(n === 1 ? 'Створи свій рецепт' : `Створи ${n} ${pu(n, ['свій рецепт', 'свої рецепти', 'своїх рецептів'])}`, n === 1 ? 'Create your own recipe' : `Create ${n} recipes`), goals: [1, 5, 15], metric: a => a.recipes },
  { key: 'scans', icon: 'barcode', color: '#3B1E3F', name: L('Сканер', 'Scanner'), desc: n => L(n === 1 ? 'Відскануй перший штрихкод' : `Відскануй ${n} ${pu(n, ['штрихкод', 'штрихкоди', 'штрихкодів'])}`, n === 1 ? 'Scan your first barcode' : `Scan ${n} barcodes`), goals: [1, 25, 100], metric: a => a.scans },
  { key: 'game', icon: 'game', color: '#E5462B', name: L('Спритні лапи', 'Quick paws'), desc: n => L(`Набери ${n} ${pu(n, ['очко', 'очки', 'очок'])} у міні-грі`, `Score ${n} in the mini-game`), goals: [25, 50, 80], metric: a => a.game }
];

export const TIERS = [
  { name: L('Бронза', 'Bronze'), c: ['#F2B88A', '#B8703C'] as [string, string], stars: 1 },
  { name: L('Срібло', 'Silver'), c: ['#F2F4F7', '#9BA6B5'] as [string, string], stars: 2 },
  { name: L('Золото', 'Gold'), c: ['#FFE38A', '#D29A12'] as [string, string], stars: 3 },
  { name: L('Платина', 'Platinum'), c: ['#D9F2EE', '#5FA8A0'] as [string, string], stars: 4 },
  { name: L('Діамант', 'Diamond'), c: ['#E3D9FF', '#7A5FC9'] as [string, string], stars: 5 }
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export interface AchDef { id: string; name: L10n; desc: L10n; icon: string; color: string; tier: number; secret?: boolean; seasonal?: string; goal?: number; metric?: (a: Agg, s: State) => number }

const SECRETS: AchDef[] = [
  { id: 'repeat', name: L('Як учора', 'Same as yesterday'), desc: L('Скористайся «повторити вчорашнє»', 'Use «repeat yesterday»'), icon: 'repeat', color: '#6F7F2E', tier: 1, secret: true },
  { id: 'stylish', name: L('Стильний день', 'Dressed up'), desc: L('Вдягни 3 речі одночасно', 'Wear 3 items at once'), icon: 'wardrobe', color: '#C0567F', tier: 1, secret: true },
  { id: 'early', name: L('Ранкова пташка', 'Early bird'), desc: L('Склянка води до 8 ранку', 'A glass of water before 8 am'), icon: 'sun', color: '#E07A1F', tier: 1, secret: true },
  { id: 'comeback', name: L('З поверненням', 'Welcome back'), desc: L('Повернись після перерви. Ми чекали.', 'Come back after a break. We missed you.'), icon: 'heart', color: '#E5462B', tier: 1, secret: true },
  { id: 'nightnote', name: L('Нічний філософ', 'Night philosopher'), desc: L('Запис у щоденнику після 23:00', 'A diary entry after 11 pm'), icon: 'moon', color: '#3B2F55', tier: 1, secret: true },
  { id: 'chatlog', name: L('Пиши як другові', 'Like texting a friend'), desc: L('Запиши їжу одним повідомленням', 'Log food with a single message'), icon: 'edit', color: '#3B6FB5', tier: 1, secret: true },
  { id: 'firstsunday', name: L('Недільний підсумок', 'Sunday wrap-up'), desc: L('Виконай усі тижневі завдання', 'Complete all weekly quests'), icon: 'star', color: '#B97A00', tier: 2, secret: true }
];

export function seriesAchs(): AchDef[] {
  const out: AchDef[] = [];
  for (const s of SERIES) s.goals.forEach((g, i) => out.push({
    id: `${s.key}_${i + 1}`, name: { uk: `${s.name.uk} ${ROMAN[i]}`, en: `${s.name.en} ${ROMAN[i]}` }, desc: s.desc(g), icon: s.icon, color: s.color, tier: i, goal: g, metric: a => s.metric(a)
  }));
  return out;
}

/** Сезонні досягнення конкретного сезону (наприклад, autumn-2026) */
export function seasonAchs(key: string): AchDef[] {
  const { kind, year } = parseSeasonKey(key);
  const d = SEASONS[kind];
  if (!d) return [];
  const y = kind === 'winter' ? `${year}/${String(year + 1).slice(2)}` : String(year);
  const mk = (id: string, uk: string, en: string, du: string, de: string, goal: number, tier: number, f: (st: State) => number): AchDef =>
    ({ id: `season_${key}_${id}`, name: { uk: `${d.name.uk} ${y}: ${uk}`, en: `${d.name.en} ${y}: ${en}` }, desc: L(du, de), icon: d.icon, color: d.colors[1], tier, seasonal: key, goal, metric: (_a, st) => f(st) });
  return [
    mk('d20', 'старт', 'kick-off', 'Виконай 20 денних завдань за сезон', 'Complete 20 daily quests this season', 20, 0, st => st.season[key]?.daily || 0),
    mk('w6', 'наполегливість', 'persistence', 'Виконай 6 тижневих завдань за сезон', 'Complete 6 weekly quests this season', 6, 1, st => st.season[key]?.weekly || 0),
    mk('t10', 'фінал', 'finale', 'Пройди всі 10 рівнів сезонного шляху', 'Finish all 10 season tiers', 10, 2, st => st.season[key]?.tier || 0)
  ];
}

const BASE = [...seriesAchs(), ...SECRETS];
export function allAchs(s: State, currentSeason: string): AchDef[] {
  const keys = new Set<string>([currentSeason]);
  Object.keys(s.ach).forEach(id => { const m = id.match(/^season_(\w+-\d+)_/); if (m) keys.add(m[1]); });
  return [...BASE, ...[...keys].flatMap(seasonAchs)];
}
export function findAch(id: string): AchDef | undefined {
  const b = BASE.find(a => a.id === id);
  if (b) return b;
  const m = id.match(/^season_(\w+-\d+)_/);
  return m ? seasonAchs(m[1]).find(a => a.id === id) : undefined;
}

/** Перейменування досягнень з версії 0.1 */
export const LEGACY_ACH: Record<string, string> = {
  first_meal: 'meals_1', meals50: 'meals_2', all5: 'rainbow_1', variety30: 'variety_2', scanner: 'scans_1', recipe: 'recipes_1',
  water_goal: 'water_1', water_week: 'water_2', first_workout: 'workouts_1', workouts10: 'workouts_2', record: 'records_1', rest: 'rest_1',
  steps10k: 'steps_1', city1: 'cities_1', sleep7: 'sleep_1', mood7: 'mood_1', habit_first: 'habits_1', streak7: 'streak_2', streak30: 'streak_3',
  level3: 'level_1', level5: 'level_2', level10: 'level_3', game: 'game_1'
};
