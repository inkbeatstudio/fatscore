import type { Cat, Food } from '../types';

// Open Food Facts — відкрита база продуктів (ліцензія ODbL). Документація: https://openfoodfacts.github.io/openfoodfacts-server/api/
const BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_uk,product_name_en,generic_name,brands,nutriments,serving_quantity,categories_tags,quantity';

function guessCat(tags: string[] = [], n: any): Cat {
  const t = tags.join(' ');
  if (/beverage|drink|juice|water|coffee|tea|soda/.test(t)) return 'drink';
  if (/dair|milk|cheese|yogurt|kefir|cream/.test(t)) return 'dairy';
  if (/fruit|berr|apple/.test(t)) return 'fruit';
  if (/vegetable|salad|legume-/.test(t)) return 'veg';
  if (/meat|fish|seafood|egg|poultr|sausage|ham|tofu|legumes/.test(t)) return 'protein';
  if (/chocolate|sweet|candies|confection|biscuit|cake|dessert|ice-cream|sugar/.test(t)) return 'sweet';
  if (/cereal|bread|pasta|rice|grain|flour|crisp|cracker|noodle/.test(t)) return 'grain';
  if (/nut|seed|oil|butter|fat/.test(t)) return 'fat';
  const p = +n?.proteins_100g || 0, f = +n?.fat_100g || 0, c = +n?.carbohydrates_100g || 0, s = +n?.sugars_100g || 0;
  if (s > 25) return 'sweet';
  if (f > 40) return 'fat';
  if (p > 15 && p >= c) return 'protein';
  return 'grain';
}

function toFood(p: any): Food | null {
  const n = p?.nutriments || {};
  let kcal = Number(n['energy-kcal_100g']);
  if (!isFinite(kcal) && isFinite(Number(n.energy_100g))) kcal = Number(n.energy_100g) / 4.184;
  if (!isFinite(kcal)) return null;
  const nameUk = (p.product_name_uk || p.product_name || p.generic_name || '').trim();
  const nameEn = (p.product_name_en || p.product_name || nameUk).trim();
  if (!nameUk && !nameEn) return null;
  const serving = Number(p.serving_quantity);
  const r = (x: any) => Math.round((Number(x) || 0) * 10) / 10;
  return {
    id: 'off_' + p.code, src: 'off', barcode: p.code, brand: (p.brands || '').split(',')[0]?.trim() || undefined,
    name: { uk: nameUk || nameEn, en: nameEn || nameUk },
    kcal: Math.round(kcal), p: r(n.proteins_100g), f: r(n.fat_100g), c: r(n.carbohydrates_100g), fiber: r(n.fiber_100g),
    cat: guessCat(p.categories_tags, n), g: serving > 0 && serving < 2000 ? Math.round(serving) : 100,
    por: serving > 0 ? { uk: 'порція з упаковки', en: 'pack serving' } : { uk: '100 г', en: '100 g' }
  };
}

async function get(url: string, ms = 12000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } });
    if (r.status === 429) throw new Error('rate');
    if (!r.ok) throw new Error('http');
    return await r.json();
  } finally { clearTimeout(t); }
}

const cache = new Map<string, Food[]>();
export async function searchOFF(q: string, lang: 'uk' | 'en'): Promise<Food[]> {
  const key = lang + ':' + q.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  if (!navigator.onLine) throw new Error('offline');
  const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=30&sort_by=unique_scans_n&lc=${lang}&fields=${FIELDS}`;
  const j = await get(url);
  const res = (j.products || []).map(toFood).filter(Boolean) as Food[];
  const seen = new Set<string>();
  const uniq = res.filter(f => { const k = f.name.uk + f.brand; if (seen.has(k)) return false; seen.add(k); return true; });
  cache.set(key, uniq);
  return uniq;
}

export async function productByBarcode(code: string): Promise<Food | null> {
  if (!navigator.onLine) throw new Error('offline');
  const j = await get(`${BASE}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`);
  if (j.status !== 1 || !j.product) return null;
  return toFood({ ...j.product, code });
}
