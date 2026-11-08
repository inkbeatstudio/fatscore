import type { L10n, Slot } from '../types';

export type Rarity = 'common' | 'rare' | 'epic' | 'legend';
export interface Item { id: string; name: L10n; slot: Slot; price: number | null; rar: Rarity; earn?: string; season?: [number, number] }

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
  { id: 'band', name: { uk: 'Спортивна пов\'язка', en: 'Sweatband' }, slot: 'head', price: null, rar: 'rare', earn: 'first_workout' },
  { id: 'chef', name: { uk: 'Кухарський ковпак', en: 'Chef\'s hat' }, slot: 'head', price: null, rar: 'rare', earn: 'recipe' },
  { id: 'party', name: { uk: 'Святковий ковпачок', en: 'Party hat' }, slot: 'head', price: null, rar: 'epic', earn: 'level5' },
  { id: 'crown', name: { uk: 'Вінок з м\'яти', en: 'Mint wreath' }, slot: 'head', price: null, rar: 'legend', earn: 'water_week' },
  { id: 'scarf', name: { uk: 'Гірчичний шарф', en: 'Mustard scarf' }, slot: 'neck', price: 150, rar: 'common' },
  { id: 'bowtie', name: { uk: 'Метелик', en: 'Bow tie' }, slot: 'neck', price: 180, rar: 'common' },
  { id: 'stripes', name: { uk: 'Смугастий шарф', en: 'Striped scarf' }, slot: 'neck', price: 260, rar: 'rare' },
  { id: 'medal', name: { uk: 'Медаль мандрівника', en: 'Traveller\'s medal' }, slot: 'neck', price: null, rar: 'rare', earn: 'city1' },
  { id: 'towel', name: { uk: 'Спортивний рушник', en: 'Gym towel' }, slot: 'neck', price: null, rar: 'epic', earn: 'workouts10' },
  { id: 'freckles', name: { uk: 'Веснянки', en: 'Freckles' }, slot: 'face', price: 90, rar: 'common' },
  { id: 'glasses', name: { uk: 'Круглі окуляри', en: 'Round glasses' }, slot: 'face', price: 180, rar: 'rare' },
  { id: 'shades', name: { uk: 'Сонячні окуляри', en: 'Sunglasses' }, slot: 'face', price: 320, rar: 'epic' },
  { id: 'bg_kitchen', name: { uk: 'Кухня з плиткою', en: 'Tiled kitchen' }, slot: 'bg', price: 200, rar: 'rare' },
  { id: 'bg_garden', name: { uk: 'Сад з м\'ятою', en: 'Mint garden' }, slot: 'bg', price: 300, rar: 'epic' },
  { id: 'bg_night', name: { uk: 'Зоряна ніч', en: 'Starry night' }, slot: 'bg', price: null, rar: 'epic', earn: 'streak7' },
  { id: 'bg_gold', name: { uk: 'Золота зала', en: 'Golden hall' }, slot: 'bg', price: null, rar: 'legend', earn: 'streak30' }
];
export const ITEM: Record<string, Item> = Object.fromEntries(ITEMS.map(i => [i.id, i]));

export function inSeason(it: Item, month = new Date().getMonth() + 1) {
  if (!it.season) return true;
  const [a, b] = it.season;
  return a <= b ? month >= a && month <= b : month >= a || month <= b;
}

export interface Ach { id: string; name: L10n; desc: L10n; secret?: boolean }
export const ACHS: Ach[] = [
  { id: 'first_meal', name: { uk: 'Перша тарілка', en: 'First plate' }, desc: { uk: 'Запиши першу їжу', en: 'Log your first meal' } },
  { id: 'meals50', name: { uk: 'Літописець', en: 'Chronicler' }, desc: { uk: '50 записів їжі', en: '50 food entries' } },
  { id: 'rainbow', name: { uk: 'Веселка', en: 'Rainbow' }, desc: { uk: '4 кольори на тарілці за день', en: '4 plate colours in a day' } },
  { id: 'all5', name: { uk: 'Повна палітра', en: 'Full palette' }, desc: { uk: 'Усі 5 кольорів за день', en: 'All 5 colours in a day' } },
  { id: 'variety30', name: { uk: 'Дослідник смаків', en: 'Taste explorer' }, desc: { uk: '30 різних продуктів', en: '30 different foods' } },
  { id: 'scanner', name: { uk: 'Сканер', en: 'Scanner' }, desc: { uk: 'Відскануй перший штрихкод', en: 'Scan your first barcode' } },
  { id: 'recipe', name: { uk: 'Шеф', en: 'Chef' }, desc: { uk: 'Створи свій рецепт', en: 'Create your own recipe' } },
  { id: 'water_goal', name: { uk: 'М\'ята розквітла', en: 'Mint in bloom' }, desc: { uk: 'Виконай норму води за день', en: 'Hit your water goal' } },
  { id: 'water_week', name: { uk: 'Тиждень з водою', en: 'Hydration week' }, desc: { uk: 'Норма води 7 днів', en: 'Water goal on 7 days' } },
  { id: 'first_workout', name: { uk: 'Перший крок', en: 'First step' }, desc: { uk: 'Перше тренування', en: 'Your first workout' } },
  { id: 'workouts10', name: { uk: 'Десятка', en: 'Perfect ten' }, desc: { uk: '10 тренувань', en: '10 workouts' } },
  { id: 'record', name: { uk: 'Новий рекорд', en: 'New record' }, desc: { uk: 'Побий власний рекорд', en: 'Beat a personal best' } },
  { id: 'rest', name: { uk: 'Мудрий відпочинок', en: 'Wise rest' }, desc: { uk: 'Свідомий день відпочинку', en: 'Take a mindful rest day' } },
  { id: 'steps10k', name: { uk: 'Десять тисяч', en: 'Ten thousand' }, desc: { uk: '10 000 кроків за день', en: '10,000 steps in a day' } },
  { id: 'city1', name: { uk: 'Мандрівник', en: 'Traveller' }, desc: { uk: 'Дійди до першого міста', en: 'Reach the first city' } },
  { id: 'sleep7', name: { uk: 'Соня', en: 'Sleepyhead' }, desc: { uk: 'Запиши сон 7 разів', en: 'Log sleep 7 times' } },
  { id: 'mood7', name: { uk: 'Чуйність', en: 'Self-aware' }, desc: { uk: 'Відзнач настрій 7 разів', en: 'Log mood 7 times' } },
  { id: 'habit_first', name: { uk: 'Своя звичка', en: 'My habit' }, desc: { uk: 'Виконай власну звичку', en: 'Complete a custom habit' } },
  { id: 'streak7', name: { uk: 'Тиждень поспіль', en: 'Week streak' }, desc: { uk: 'Серія 7 днів', en: '7-day streak' } },
  { id: 'streak30', name: { uk: 'Місяць поспіль', en: 'Month streak' }, desc: { uk: 'Серія 30 днів', en: '30-day streak' } },
  { id: 'level3', name: { uk: 'Підростає', en: 'Growing up' }, desc: { uk: 'Досягни 3 рівня', en: 'Reach level 3' } },
  { id: 'level5', name: { uk: 'П\'ятий рівень', en: 'Level five' }, desc: { uk: 'Досягни 5 рівня', en: 'Reach level 5' } },
  { id: 'level10', name: { uk: 'Ветеран', en: 'Veteran' }, desc: { uk: 'Досягни 10 рівня', en: 'Reach level 10' } },
  { id: 'game', name: { uk: 'Спритні лапи', en: 'Quick paws' }, desc: { uk: 'Набери 25 очок у міні-грі', en: 'Score 25 in the mini-game' } },
  { id: 'repeat', name: { uk: 'Як учора', en: 'Same as yesterday' }, desc: { uk: 'Скористайся «повторити вчорашнє»', en: 'Use «repeat yesterday»' }, secret: true },
  { id: 'stylish', name: { uk: 'Стильний день', en: 'Dressed up' }, desc: { uk: 'Вдягни 3 речі одночасно', en: 'Wear 3 items at once' }, secret: true },
  { id: 'early', name: { uk: 'Ранкова пташка', en: 'Early bird' }, desc: { uk: 'Склянка води до 8 ранку', en: 'A glass of water before 8 am' }, secret: true },
  { id: 'comeback', name: { uk: 'З поверненням', en: 'Welcome back' }, desc: { uk: 'Повернись після перерви. Ми чекали.', en: 'Come back after a break. We missed you.' }, secret: true }
];
export const ACH: Record<string, Ach> = Object.fromEntries(ACHS.map(a => [a.id, a]));
