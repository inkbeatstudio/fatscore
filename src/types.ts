export type Lang = 'uk' | 'en';
export type L10n = { uk: string; en: string };
export type Sex = 'f' | 'm';
export type Goal = 'lose' | 'keep' | 'gain' | 'habits';
export type CharId = 'bear' | 'hare' | 'raccoon';
export type Slot = 'head' | 'neck' | 'face' | 'bg';
export type Cat = 'veg' | 'fruit' | 'protein' | 'grain' | 'dairy' | 'sweet' | 'fat' | 'drink';
export type MealKey = 'b' | 'l' | 'd' | 's';
export type Theme = 'light' | 'dark' | 'system';

/** Продукт або страва. Поживність на 100 г. */
export interface Food {
  id: string;
  name: L10n;
  kcal: number;
  p: number;
  f: number;
  c: number;
  fiber?: number;
  cat: Cat;
  /** типова порція, г */
  g: number;
  por: L10n;
  ua?: boolean;
  src: 'local' | 'off' | 'custom' | 'recipe';
  brand?: string;
  barcode?: string;
}

export interface FoodEntry {
  id: string;
  food: Food; // знімок, щоб запис жив офлайн навіть для продуктів з інтернету
  g: number;
  meal: MealKey;
  at: number;
}

export interface Workout {
  id: string;
  kind: 'strength' | 'cardio' | 'short';
  name: L10n;
  detail: string;
  min: number;
  kcal: number;
  km?: number;
  at: number;
}

export interface Sleep {
  bed: string; // "23:10"
  wake: string; // "07:05"
  hours: number;
  quality: 1 | 2 | 3;
}

export interface Day {
  date: string;
  foods: FoodEntry[];
  water: number;
  workouts: Workout[];
  rest: boolean;
  steps: number;
  sleep?: Sleep;
  mood?: 1 | 2 | 3 | 4;
  habits: Record<string, boolean>;
  quests: Record<string, 1>;
  weight?: number;
  rewards: Record<string, number>; // лічильники винагород за день, щоб не було «фарму»
  gamePlays: number;
  demo?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
}

export interface Profile {
  sex: Sex;
  age: number;
  height: number;
  weight: number;
  act: number;
  goal: Goal;
  noNum: boolean;
  adult: boolean;
  disc: boolean;
  char: CharId;
  cname: string;
  uname: string;
  waterGoal: number;
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  theme: Theme;
}

export interface State {
  v: number;
  onb: number; // 99 = онбординг завершено
  lang: Lang;
  startDate: string;
  profile: Profile;
  days: Record<string, Day>;
  xp: number;
  level: number;
  coins: number;
  owned: string[];
  eq: Record<Slot, string | null>;
  ach: Record<string, number>;
  prs: Record<string, { w: number; r: number }>;
  km: number;
  recent: Food[];
  favorites: Food[];
  customFoods: Food[];
  habits: Habit[];
  settings: Settings;
  gameBest: number;
  lastSeen: string;
  stats: { scans: number; recipes: number; distinctFoods: string[]; games: number };
}

export type Effect =
  | { type: 'toast'; text: string; icon?: string }
  | { type: 'celebrate'; kind: 'level' | 'record' | 'item' | 'ach' | 'city' | 'streak'; title: string; text?: string; big?: string; item?: string }
  | { type: 'react'; kind: string; text?: string }
  | { type: 'sound'; kind: 'coin' | 'tap' }
  | { type: 'haptic'; pattern: number | number[] };
