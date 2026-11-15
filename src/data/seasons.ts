import type { L10n, SeasonKind } from '../types';

export interface SeasonDef { kind: SeasonKind; name: L10n; tagline: L10n; icon: string; colors: [string, string]; items: [string, string, string] }

export const SEASONS: Record<SeasonKind, SeasonDef> = {
  winter: { kind: 'winter', name: { uk: 'Зимова казка', en: 'Winter Tale' }, tagline: { uk: 'Теплі звички в холодні дні', en: 'Warm habits for cold days' }, icon: 'star', colors: ['#BFD7EA', '#3B6FB5'], items: ['earmuffs', 'knit', 'bg_snow'] },
  spring: { kind: 'spring', name: { uk: 'Весняне пробудження', en: 'Spring Awakening' }, tagline: { uk: 'Все росте — і ти теж', en: 'Everything grows, and so do you' }, icon: 'leaf', colors: ['#D7EBB8', '#5E8A3A'], items: ['wreath', 'bandana', 'bg_bloom'] },
  summer: { kind: 'summer', name: { uk: 'Літній марафон', en: 'Summer Marathon' }, tagline: { uk: 'Сонце, рух і кавун', en: 'Sun, movement and watermelon' }, icon: 'sun', colors: ['#FFE38A', '#E07A1F'], items: ['strawhat', 'whistle', 'bg_beach'] },
  autumn: { kind: 'autumn', name: { uk: 'Затишна осінь', en: 'Cosy Autumn' }, tagline: { uk: 'Плед, гарбуз і прогулянки парком', en: 'Blankets, pumpkins and park walks' }, icon: 'leaf', colors: ['#FFC88A', '#C4552B'], items: ['mushroom', 'leafscarf', 'bg_autumn'] }
};

export function seasonOf(d = new Date()) {
  const m = d.getMonth() + 1;
  const kind: SeasonKind = m === 12 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn';
  // зима 2026/27 рахується як 2026
  const year = m <= 2 ? d.getFullYear() - 1 : d.getFullYear();
  const endMonth = { winter: 2, spring: 5, summer: 8, autumn: 11 }[kind];
  const end = new Date(kind === 'winter' ? year + 1 : year, endMonth, 1);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - d.getTime()) / 86400000));
  return { kind, year, key: `${kind}-${year}`, def: SEASONS[kind], daysLeft };
}

/** Сезонний пропуск: 10 рівнів по 100 очок. Очки дають денні (+10) і тижневі (+40) завдання */
export const SEASON_TIER_PTS = 100;
export const SEASON_TIERS = 10;
export type TierReward = { coins?: number; stars?: number; item?: 0 | 1 | 2 };
export const TIER_REWARDS: TierReward[] = [
  { coins: 30 }, { stars: 1 }, { item: 0 }, { coins: 50 }, { stars: 2 },
  { item: 1 }, { coins: 80 }, { stars: 2 }, { coins: 120 }, { item: 2, stars: 3 }
];
export const parseSeasonKey = (key: string) => { const [kind, y] = key.split('-'); return { kind: kind as SeasonKind, year: +y }; };
