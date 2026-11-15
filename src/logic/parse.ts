import type { Food } from '../types';
import { norm } from '../data/foods';

/** Розбір фрази «250 г гречки, курка 150 і 2 яйця» на продукти й грами. Без ШІ: правила + вбудована база. */
export interface Parsed { text: string; food: Food | null; g: number }

const UNIT_G = /^(г|гр|грам\w*|g|gr|gram\w*|мл|ml)$/i;
const UNIT_KG = /^(кг|kg|л|l)$/i;
const UNIT_PIECE = /^(шт\w*|штук\w*|pcs?|piece\w*|скибк\w*|скибоч\w*|slice\w*|порці\w*|porti\w*|serving\w*|тарілк\w*|миск\w*|bowl\w*|склянк\w*|glass\w*|чашк\w*|cup\w*|ложк\w*|spoon\w*|жмен\w*|handful\w*)$/i;
const WORD_NUM: Record<string, number> = { 'один': 1, 'одна': 1, 'одне': 1, 'одну': 1, 'два': 2, 'дві': 2, 'три': 3, 'чотири': 4, "п'ять": 5, 'пять': 5, 'пів': 0.5, 'половина': 0.5, 'половину': 0.5, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'half': 0.5, 'a': 1, 'an': 1 };
const STOP = new Set(['з', 'із', 'зі', 'та', 'і', 'й', 'на', 'в', 'у', 'до', 'по', 'with', 'and', 'of', 'the', 'some', 'трохи', 'їв', "з'їв", 'зїв', 'з’їв', 'випив', 'ate', 'had', 'drank', 'сніданок', 'обід', 'вечеря', 'breakfast', 'lunch', 'dinner']);

const stem = (w: string) => (w.length >= 5 ? w.slice(0, Math.max(4, w.length - 2)) : w);

/** Розмовні назви, які не збігаються з назвою в базі за коренем */
const ALIASES: [RegExp, string][] = [
  [/^(курк|курят|курочк|chicken)/, 'chicken'], [/^(яйц|яєц|яєчк|egg)/, 'egg'], [/^(картопл|картошк|potato)/, 'potato'],
  [/^(гречк|buckwheat)/, 'buckwheat'], [/^(вівсян|oatmeal|oats?$|porridge)/, 'oat_milk'], [/^(сир$|сирок|cottage)/, 'tvorog'],
  [/^(кав|coffee)/, 'coffee_milk'], [/^(чай|tea)$/, 'tea_sugar'], [/^(салат|salad)/, 'salad_ct'], [/^(хліб|хлiб|bread)/, 'bread_white']
];
export function matchFood(phrase: string, foods: Food[]): Food | null {
  const words = norm(phrase).split(/[^a-zа-яіїєґ]+/i).filter(w => w.length >= 3 && !STOP.has(w));
  if (!words.length) return null;
  if (words.length === 1) {
    const al = ALIASES.find(([re]) => re.test(words[0]));
    const f = al && foods.find(x => x.id === al[1]);
    if (f) return f;
  }
  const stems = words.map(stem);
  let best: Food | null = null, bestScore = -1;
  for (const f of foods) {
    const ukWords = norm(f.name.uk).split(/[^a-zа-яіїєґ]+/i).filter(Boolean);
    const enWords = norm(f.name.en).split(/[^a-zа-яіїєґ]+/i).filter(Boolean);
    for (const hayWords of [ukWords, enWords]) {
      const has = (st: string) => hayWords.some(h => h.startsWith(st) || (st.length >= 4 && h.startsWith(st.slice(0, 4)) && Math.abs(h.length - st.length) <= 3));
      const hit = stems.filter(has).length;
      if (!hit) continue;
      // перше слово фрази — головне («сирники зі сметаною» — це сирники)
      const main = has(stems[0]) ? 0.3 : 0;
      const head = stems.some(st => hayWords[0]?.startsWith(st)) ? 0.1 : 0;
      const score = hit / stems.length + main + head - (hayWords.length - hit) * 0.05 + (f.src === 'custom' || f.src === 'recipe' ? 0.05 : 0);
      if (score > bestScore) { bestScore = score; best = f; }
    }
  }
  return bestScore >= 0.5 ? best : null;
}

export function parseMeal(text: string, foods: Food[]): Parsed[] {
  const chunks = text.split(/[,;\n+]|\s(?:і|й|та|and|with|плюс)\s/i).map(c => c.trim()).filter(Boolean);
  return chunks.map(chunk => {
    const tokens = chunk.replace(/(\d)([a-zа-яіїєґ])/gi, '$1 $2').split(/\s+/);
    let qty: number | null = null, unit: 'g' | 'piece' | null = null;
    const rest: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const tk = tokens[i].toLowerCase().replace(/[.!?]$/, '');
      const num = parseFloat(tk.replace(',', '.'));
      if (!isNaN(num) && /^[\d.,]+$/.test(tk)) { qty = num; continue; }
      if (WORD_NUM[tk] != null && qty == null) { qty = WORD_NUM[tk]; continue; }
      if (UNIT_G.test(tk)) { unit = 'g'; continue; }
      if (UNIT_KG.test(tk)) { unit = 'g'; qty = (qty ?? 1) * 1000; continue; }
      if (UNIT_PIECE.test(tk)) { unit = 'piece'; continue; }
      rest.push(tokens[i]);
    }
    const name = rest.join(' ');
    const food = matchFood(name, foods);
    let g = food ? food.g : 100;
    if (qty != null) {
      if (unit === 'g') g = qty;
      else if (unit === 'piece' || (food && qty < 15)) g = Math.round((food?.g || 100) * qty);
      else g = qty;
    }
    return { text: chunk, food, g: Math.max(1, Math.round(g)) };
  });
}
