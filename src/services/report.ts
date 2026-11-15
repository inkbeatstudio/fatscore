import { addDays, today, parse } from '../logic/dates';
import { dailyNorm, dayTotals, entryNutr } from '../logic/nutrition';
import { MEALS } from '../logic/game';
import { fmt, locale, lx, tx } from '../i18n';
import type { Day, Lang, State } from '../types';

const MOOD = { uk: ['', 'важко', 'так собі', 'добре', 'чудово'], en: ['', 'hard', 'so-so', 'good', 'great'] };

export function rowsFor(s: State, days: number) {
  const keys = Array.from({ length: days }, (_, i) => addDays(today(), i - days + 1));
  return keys.map(k => ({ k, d: s.days[k] && !s.days[k].demo ? s.days[k] : undefined }));
}
const esc = (v: string | number) => { const x = String(v ?? ''); return /[",;\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
const h = (v: string) => v.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function buildCSV(s: State, days: number) {
  const L = s.lang;
  const head = L === 'en'
    ? ['date', 'kcal', 'protein_g', 'fat_g', 'carbs_g', 'fibre_g', 'water_glasses', 'steps', 'activity_min', 'workouts', 'rest_day', 'sleep_h', 'mood', 'weight_kg', 'foods']
    : ['дата', 'ккал', 'білки_г', 'жири_г', 'вуглеводи_г', 'клітковина_г', 'вода_склянок', 'кроки', 'активність_хв', 'тренування', 'день_відпочинку', 'сон_год', 'настрій', 'вага_кг', 'їжа'];
  const lines = rowsFor(s, days).map(({ k, d }) => {
    if (!d) return [k, '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
    const tt = dayTotals(d);
    return [k, Math.round(tt.kcal), Math.round(tt.p), Math.round(tt.f), Math.round(tt.c), Math.round(tt.fiber), d.water, d.steps,
      d.workouts.reduce((a, w) => a + w.min, 0), d.workouts.map(w => `${lx(L, w.name)} ${w.min}${tx(L, ' хв', ' min')}`).join('; '), d.rest ? 1 : 0,
      d.sleep ? d.sleep.hours : '', d.mood ? MOOD[L][d.mood] : '', d.weight ?? '',
      d.foods.map(f => `${lx(L, f.food.name)} ${f.g}${tx(L, 'г', 'g')}`).join('; ')];
  });
  return '﻿' + [head, ...lines].map(r => r.map(esc).join(',')).join('\n');
}

export function buildHTML(s: State, days: number) {
  const L: Lang = s.lang;
  const T = (uk: string, en: string) => tx(L, uk, en);
  const rows = rowsFor(s, days);
  const filled = rows.filter(r => r.d) as { k: string; d: Day }[];
  const withFood = filled.filter(r => r.d.foods.length);
  const avg = (f: (d: Day) => number, arr = withFood) => (arr.length ? arr.reduce((a, r) => a + f(r.d), 0) / arr.length : 0);
  const n = dailyNorm(s.profile);
  const sleepDays = filled.filter(r => r.d.sleep);
  const dfmt = (k: string) => parse(k).toLocaleDateString(locale(L), { weekday: 'short', day: 'numeric', month: 'short' });
  const range = `${parse(rows[0].k).toLocaleDateString(locale(L), { day: 'numeric', month: 'long' })} – ${parse(rows[rows.length - 1].k).toLocaleDateString(locale(L), { day: 'numeric', month: 'long', year: 'numeric' })}`;
  const sum = [
    [T('Днів із записами їжі', 'Days with food logged'), `${withFood.length} / ${days}`],
    [T('Середньо ккал (у дні із записами)', 'Avg kcal (logged days)'), fmt(avg(d => dayTotals(d).kcal), L)],
    [T('Білки / жири / вуглеводи, г', 'Protein / fat / carbs, g'), `${fmt(avg(d => dayTotals(d).p), L)} / ${fmt(avg(d => dayTotals(d).f), L)} / ${fmt(avg(d => dayTotals(d).c), L)}`],
    [T('Клітковина, г', 'Fibre, g'), fmt(avg(d => dayTotals(d).fiber), L)],
    [T('Вода, склянок на день', 'Water, glasses a day'), fmt(avg(d => d.water, filled), L, 1)],
    [T('Кроки на день', 'Steps a day'), fmt(avg(d => d.steps, filled), L)],
    [T('Сон, год', 'Sleep, h'), sleepDays.length ? fmt(avg(d => d.sleep!.hours, sleepDays), L, 1) : '—'],
    [T('Орієнтир застосунку, ккал', 'App guideline, kcal'), `${fmt(n.target, L)} (${T('не нижче', 'never below')} ${fmt(n.min, L)})`]
  ];
  const tr = rows.map(({ k, d }) => {
    if (!d) return `<tr class="empty"><td>${dfmt(k)}</td><td colspan="8">${T('немає записів', 'no entries')}</td></tr>`;
    const tt = dayTotals(d);
    const foods = MEALS.map(m => { const es = d.foods.filter(f => f.meal === m.k); return es.length ? `<b>${h(lx(L, m.name))}:</b> ${es.map(e => `${h(lx(L, e.food.name))} ${e.g}${T('г', 'g')} (${Math.round(entryNutr(e).kcal)})`).join(', ')}` : ''; }).filter(Boolean).join('<br>');
    return `<tr><td>${dfmt(k)}</td><td>${d.foods.length ? Math.round(tt.kcal) : ''}</td><td>${d.foods.length ? `${Math.round(tt.p)}/${Math.round(tt.f)}/${Math.round(tt.c)}` : ''}</td><td>${d.water || ''}</td><td>${d.steps || ''}</td><td>${d.workouts.map(w => h(`${lx(L, w.name)} ${w.min}′`)).join(', ')}${d.rest ? T('відпочинок', 'rest') : ''}</td><td>${d.sleep ? fmt(d.sleep.hours, L, 1) : ''}</td><td>${d.mood ? MOOD[L][d.mood] : ''}</td><td>${d.weight ?? ''}</td></tr>${foods ? `<tr class="foods"><td></td><td colspan="8">${foods}</td></tr>` : ''}`;
  }).join('');
  return `<!doctype html><html lang="${L}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${T('Звіт Fatscore', 'Fatscore report')} ${range}</title>
<style>body{font:14px/1.45 -apple-system,system-ui,sans-serif;color:#222;margin:24px;max-width:960px}h1{font-size:22px;margin:0 0 4px}p{margin:4px 0}.m{color:#666;font-size:12.5px}
table{border-collapse:collapse;width:100%;margin-top:14px}th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3f3f3;font-size:12.5px}
tr.foods td{font-size:12.5px;color:#444;border-bottom:1px solid #bbb}tr.empty td{color:#999}.sum td:first-child{color:#555}.bar{display:flex;gap:8px;margin:14px 0}
button{font:inherit;padding:10px 16px;border-radius:10px;border:0;background:#222;color:#fff}@media print{.bar{display:none}body{margin:10mm}}</style></head><body>
<h1>${T('Звіт про харчування та активність', 'Nutrition & activity report')}</h1>
<p>${range}${s.profile.uname ? ' · ' + h(s.profile.uname) : ''}</p>
<p class="m">${T('Дані записані користувачем у застосунку Fatscore. Калорійність домашніх страв усереднена. Не є медичною порадою.', 'Data logged by the user in the Fatscore app. Values for home-cooked dishes are averages. Not medical advice.')}</p>
<div class="bar"><button onclick="print()">${T('Друк / зберегти PDF', 'Print / save PDF')}</button></div>
<table class="sum">${sum.map(([a, b]) => `<tr><td>${a}</td><td><b>${b}</b></td></tr>`).join('')}</table>
<table><thead><tr><th>${T('День', 'Day')}</th><th>${T('ккал', 'kcal')}</th><th>${T('Б/Ж/В, г', 'P/F/C, g')}</th><th>${T('Вода', 'Water')}</th><th>${T('Кроки', 'Steps')}</th><th>${T('Рух', 'Activity')}</th><th>${T('Сон', 'Sleep')}</th><th>${T('Настрій', 'Mood')}</th><th>${T('Вага', 'Weight')}</th></tr></thead><tbody>${tr}</tbody></table>
</body></html>`;
}

