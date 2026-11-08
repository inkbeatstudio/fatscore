import type { L10n, Lang } from './types';

/** Двомовний рядок поруч з місцем використання: tx(lang, 'Привіт', 'Hi') */
export const tx = (lang: Lang, uk: string, en: string) => (lang === 'en' ? en : uk);
export const lx = (lang: Lang, s: L10n | string) => (typeof s === 'string' ? s : s[lang] || s.uk);
export const locale = (lang: Lang) => (lang === 'en' ? 'en-GB' : 'uk-UA');
export const fmt = (n: number, lang: Lang = 'uk', digits = 0) =>
  (Math.round(n * 10 ** digits) / 10 ** digits).toLocaleString(locale(lang), { maximumFractionDigits: digits }).replace(/ /g, ' ');

/** Українські множини: 1 крок, 2 кроки, 5 кроків */
export function plural(lang: Lang, n: number, uk: [string, string, string], en: [string, string]) {
  if (lang === 'en') return Math.abs(n) === 1 ? en[0] : en[1];
  const a = Math.abs(Math.round(n)) % 100, b = a % 10;
  if (a > 10 && a < 20) return uk[2];
  if (b > 1 && b < 5) return uk[1];
  if (b === 1) return uk[0];
  return uk[2];
}
