import type { L10n, SeasonKind, Slot } from '../types';

export type Rarity = 'common' | 'rare' | 'epic' | 'legend';
export interface Item { id: string; name: L10n; slot: Slot; price: number | null; rar: Rarity; earn?: string; season?: [number, number]; seasonal?: SeasonKind }

export const RARITY: Record<Rarity, { name: L10n; color: string }> = {
  common: { name: { uk: 'Звичайна', en: 'Common' }, color: 'var(--ink2)' },
  rare: { name: { uk: 'Рідкісна', en: 'Rare' }, color: 'var(--olive)' },
  epic: { name: { uk: 'Епічна', en: 'Epic' }, color: 'var(--tomato)' },
  legend: { name: { uk: 'Легендарна', en: 'Legendary' }, color: 'var(--gold)' }
};

/** earn — id досягнення, яке відкриває річ. season — місяці [від, до] (1–12), коли річ продається */
export const ITEMS: Item[] = [
  { id: 'beanie', name: { uk: 'Томатна шапка', en: 'Tomato beanie' }, slot: 'head', price: 120, rar: 'common' },
  { id: 'flower', name: { uk: 'Квітка за вухом', en: 'Ear flower' }, slot: 'head', price: 160, rar: 'common' },
  { id: 'cap', name: { uk: 'Оливкова кепка', en: 'Olive cap' }, slot: 'head', price: 220, rar: 'rare' },
  { id: 'phones', name: { uk: 'Навушники', en: 'Headphones' }, slot: 'head', price: 400, rar: 'epic' },
  { id: 'winter', name: { uk: 'Новорічна шапка', en: 'Holiday hat' }, slot: 'head', price: 300, rar: 'epic', season: [12, 1] },
  { id: 'band', name: { uk: 'Спортивна пов\'язка', en: 'Sweatband' }, slot: 'head', price: null, rar: 'rare', earn: 'workouts_1' },
  { id: 'chef', name: { uk: 'Кухарський ковпак', en: 'Chef\'s hat' }, slot: 'head', price: null, rar: 'rare', earn: 'recipes_1' },
  { id: 'party', name: { uk: 'Святковий ковпачок', en: 'Party hat' }, slot: 'head', price: null, rar: 'epic', earn: 'level_2' },
  { id: 'crown', name: { uk: 'Вінок з м\'яти', en: 'Mint wreath' }, slot: 'head', price: null, rar: 'legend', earn: 'water_2' },
  { id: 'scarf', name: { uk: 'Гірчичний шарф', en: 'Mustard scarf' }, slot: 'neck', price: 150, rar: 'common' },
  { id: 'bowtie', name: { uk: 'Метелик', en: 'Bow tie' }, slot: 'neck', price: 180, rar: 'common' },
  { id: 'stripes', name: { uk: 'Смугастий шарф', en: 'Striped scarf' }, slot: 'neck', price: 260, rar: 'rare' },
  { id: 'medal', name: { uk: 'Медаль мандрівника', en: 'Traveller\'s medal' }, slot: 'neck', price: null, rar: 'rare', earn: 'cities_1' },
  { id: 'towel', name: { uk: 'Спортивний рушник', en: 'Gym towel' }, slot: 'neck', price: null, rar: 'epic', earn: 'workouts_2' },
  { id: 'freckles', name: { uk: 'Веснянки', en: 'Freckles' }, slot: 'face', price: 90, rar: 'common' },
  { id: 'glasses', name: { uk: 'Круглі окуляри', en: 'Round glasses' }, slot: 'face', price: 180, rar: 'rare' },
  { id: 'shades', name: { uk: 'Сонячні окуляри', en: 'Sunglasses' }, slot: 'face', price: 320, rar: 'epic' },
  { id: 'bg_kitchen', name: { uk: 'Кухня з плиткою', en: 'Tiled kitchen' }, slot: 'bg', price: 200, rar: 'rare' },
  { id: 'bg_garden', name: { uk: 'Сад з м\'ятою', en: 'Mint garden' }, slot: 'bg', price: 300, rar: 'epic' },
  { id: 'bg_night', name: { uk: 'Зоряна ніч', en: 'Starry night' }, slot: 'bg', price: null, rar: 'epic', earn: 'streak_2' },
  { id: 'medal_gold', name: { uk: 'Золота медаль', en: 'Gold medal' }, slot: 'neck', price: null, rar: 'legend', earn: 'workouts_4' },
  { id: 'monocle', name: { uk: 'Монокль мудреця', en: 'Sage\'s monocle' }, slot: 'face', price: null, rar: 'epic', earn: 'diary_2' },
  // сезонні: відкриваються на сезонному шляху
  { id: 'mushroom', name: { uk: 'Грибна шапочка', en: 'Mushroom cap' }, slot: 'head', price: null, rar: 'rare', seasonal: 'autumn' },
  { id: 'leafscarf', name: { uk: 'Шарф з кленовим листям', en: 'Maple leaf scarf' }, slot: 'neck', price: null, rar: 'epic', seasonal: 'autumn' },
  { id: 'bg_autumn', name: { uk: 'Осінній парк', en: 'Autumn park' }, slot: 'bg', price: null, rar: 'legend', seasonal: 'autumn' },
  { id: 'earmuffs', name: { uk: 'Теплі навушники', en: 'Earmuffs' }, slot: 'head', price: null, rar: 'rare', seasonal: 'winter' },
  { id: 'knit', name: { uk: 'Шарф зі сніжинками', en: 'Snowflake scarf' }, slot: 'neck', price: null, rar: 'epic', seasonal: 'winter' },
  { id: 'bg_snow', name: { uk: 'Засніжений ліс', en: 'Snowy forest' }, slot: 'bg', price: null, rar: 'legend', seasonal: 'winter' },
  { id: 'wreath', name: { uk: 'Квітковий вінок', en: 'Flower wreath' }, slot: 'head', price: null, rar: 'rare', seasonal: 'spring' },
  { id: 'bandana', name: { uk: 'Бандана', en: 'Bandana' }, slot: 'neck', price: null, rar: 'epic', seasonal: 'spring' },
  { id: 'bg_bloom', name: { uk: 'Квітучий сад', en: 'Blooming orchard' }, slot: 'bg', price: null, rar: 'legend', seasonal: 'spring' },
  { id: 'strawhat', name: { uk: 'Солом\'яний капелюх', en: 'Straw hat' }, slot: 'head', price: null, rar: 'rare', seasonal: 'summer' },
  { id: 'whistle', name: { uk: 'Свисток тренера', en: 'Coach\'s whistle' }, slot: 'neck', price: null, rar: 'epic', seasonal: 'summer' },
  { id: 'bg_beach', name: { uk: 'Пляж на світанку', en: 'Sunrise beach' }, slot: 'bg', price: null, rar: 'legend', seasonal: 'summer' },
  { id: 'bg_gold', name: { uk: 'Золота зала', en: 'Golden hall' }, slot: 'bg', price: null, rar: 'legend', earn: 'streak_3' }
];
export const ITEM: Record<string, Item> = Object.fromEntries(ITEMS.map(i => [i.id, i]));

export function inSeason(it: Item, month = new Date().getMonth() + 1) {
  if (!it.season) return true;
  const [a, b] = it.season;
  return a <= b ? month >= a && month <= b : month >= a || month <= b;
}

