import { memo, useMemo } from 'react';
import type { CharId, FoodEntry, Slot } from '../types';
import { CHARS } from '../data/characters';
import { CATS } from '../data/foods';
import { ITEM } from '../data/items';

let n = 0;
const nid = (p: string) => p + (++n).toString(36);
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Градієнти для речей — з префіксом, щоб кілька SVG на сторінці не конфліктували */
function itemDefs(P: string) {
  return `<radialGradient id="${P}tom" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#FF7A5C"/><stop offset="1" stop-color="#C9361E"/></radialGradient>
  <radialGradient id="${P}oli" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#A3B44A"/><stop offset="1" stop-color="#5E6E22"/></radialGradient>
  <radialGradient id="${P}mus" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#FFCB52"/><stop offset="1" stop-color="#D99511"/></radialGradient>
  <radialGradient id="${P}gold" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#FFE38A"/><stop offset="1" stop-color="#C98A0C"/></radialGradient>
  <pattern id="${P}str" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(70)"><rect width="16" height="16" fill="#FFF1D6"/><rect width="8" height="16" fill="#E5462B"/></pattern>
  <pattern id="${P}xmas" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#C9361E"/><circle cx="7" cy="7" r="2" fill="#FFF1D6" opacity=".8"/></pattern>`;
}

/** Усі речі прив'язані до спільного «скелета» персонажів (голова в центрі 120,92) — тому пасують кожному */
export function itemSVG(id: string, P: string): string {
  switch (id) {
    case 'beanie': return `<path d="M60 74c0-42 27-62 60-62s60 20 60 62z" fill="url(#${P}tom)"/><rect x="54" y="58" width="132" height="22" rx="11" fill="#C9361E"/><path d="M72 62v14M88 62v14M104 62v14M120 62v14M136 62v14M152 62v14M168 62v14" stroke="#A82C17" stroke-width="2.4" stroke-linecap="round"/><circle cx="120" cy="12" r="13" fill="url(#${P}tom)"/>`;
    case 'winter': return `<path d="M62 72c0-40 24-60 58-60 30 0 52 14 64 40l-14 10c-6-14-14-22-26-24z" fill="url(#${P}xmas)"/><path d="M176 50c10 6 18 18 20 30" stroke="#C9361E" stroke-width="14" stroke-linecap="round" fill="none"/><circle cx="198" cy="86" r="12" fill="#FFF8EA"/><rect x="54" y="58" width="132" height="22" rx="11" fill="#FFF8EA"/>`;
    case 'flower': return `<g transform="translate(166 42)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-11" rx="7" ry="11" transform="rotate(${a})" fill="#F7A8C4"/>`).join('')}<circle r="7" fill="#F0B429"/></g><path d="M156 58l-10 8" stroke="#6F7F2E" stroke-width="4" stroke-linecap="round"/>`;
    case 'cap': return `<path d="M58 70c0-36 27-54 62-54s62 18 62 54z" fill="url(#${P}oli)"/><path d="M118 62h84c10 0 12 14 0 15l-84 3z" fill="#4D5A1A"/><circle cx="120" cy="18" r="5" fill="#4D5A1A"/><path d="M120 18v50" stroke="#4D5A1A" stroke-width="2" opacity=".5"/>`;
    case 'band': return `<path d="M68 52Q120 32 172 52l4 16Q120 46 64 68z" fill="url(#${P}mus)"/><path d="M174 58l20-8-4 14zM174 62l16 12-14 2z" fill="#D99511"/>`;
    case 'chef': return `<path d="M72 64h96v-10c18-4 24-28 6-38-6-14-26-16-36-6-10-12-34-10-40 4-20 4-22 30-2 38z" fill="#FFFFFF" stroke="#E8D9C2" stroke-width="3"/><rect x="72" y="54" width="96" height="18" rx="6" fill="#F4ECDF" stroke="#E8D9C2" stroke-width="3"/>`;
    case 'party': return `<path d="M120 0l30 64H90z" fill="url(#${P}tom)"/><path d="M106 34l28 0M98 50l44 0" stroke="#F0B429" stroke-width="5" stroke-linecap="round"/><circle cx="120" cy="2" r="8" fill="#F0B429"/>`;
    case 'phones': return `<path d="M44 98C44 8 196 8 196 98" stroke="#3B1E3F" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="32" y="78" width="26" height="44" rx="13" fill="url(#${P}tom)"/><rect x="182" y="78" width="26" height="44" rx="13" fill="url(#${P}tom)"/>`;
    case 'crown': return `<g>${[[70, 52, -50], [86, 40, -35], [104, 32, -15], [120, 30, 0], [136, 32, 15], [154, 40, 35], [170, 52, 50]].map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="15" transform="rotate(${r} ${x} ${y})" fill="${i % 2 ? '#93A83C' : '#6F7F2E'}"/>`).join('')}<circle cx="120" cy="24" r="6" fill="#F0B429"/></g>`;
    case 'scarf': return `<path d="M58 146c22 14 102 14 124 0l6 19c-26 18-110 18-136 0z" fill="url(#${P}mus)"/><path d="M146 158l14 50c2 7-4 11-10 9l-16-4-4-50z" fill="url(#${P}mus)"/><path d="M74 154v12M92 158v12M110 160v12M128 160v12M146 158v12M164 154v12" stroke="#C07F0A" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
    case 'stripes': return `<path d="M58 146c22 14 102 14 124 0l6 19c-26 18-110 18-136 0z" fill="url(#${P}str)"/><path d="M146 158l14 50c2 7-4 11-10 9l-16-4-4-50z" fill="url(#${P}str)"/>`;
    case 'bowtie': return `<path d="M120 160l-30-16v32zM120 160l30-16v32z" fill="url(#${P}tom)"/><circle cx="120" cy="160" r="8" fill="#C9361E"/>`;
    case 'medal': return `<path d="M96 140l24 40 24-40" stroke="#3B6FB5" stroke-width="9" fill="none" stroke-linejoin="round"/><circle cx="120" cy="188" r="17" fill="url(#${P}gold)"/><path d="M120 179l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z" fill="#FFF8EA"/>`;
    case 'towel': return `<path d="M60 142c20 20 100 20 120 0l8 14c-28 26-108 26-136 0z" fill="#FFFFFF" stroke="#E8D9C2" stroke-width="2"/><path d="M80 150l-8 60 22 4 6-56zM160 150l8 60-22 4-6-56z" fill="#FFFFFF" stroke="#E8D9C2" stroke-width="2"/><path d="M74 196l22 4M166 196l-22 4" stroke="#6F7F2E" stroke-width="4"/>`;
    case 'freckles': return `<g fill="#9A5530" opacity=".55">${[[70, 104], [78, 112], [84, 102], [156, 104], [162, 112], [170, 102]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join('')}</g>`;
    case 'glasses': return `<g fill="none" stroke="#3B1E3F" stroke-width="4"><circle cx="92" cy="88" r="17" fill="rgba(255,255,255,.18)"/><circle cx="148" cy="88" r="17" fill="rgba(255,255,255,.18)"/><path d="M109 86q11-6 22 0M75 84l-20-6M165 84l20-6"/></g>`;
    case 'shades': return `<rect x="70" y="76" width="44" height="26" rx="12" fill="#2A1630"/><rect x="126" y="76" width="44" height="26" rx="12" fill="#2A1630"/><path d="M114 86h12M70 84l-16-5M170 84l16-5" stroke="#2A1630" stroke-width="4" stroke-linecap="round"/><path d="M78 82h10M134 82h10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`;
  }
  return '';
}

/** Фон «кімнати» за персонажем — коло 300×300 */
export function bgSVG(id: string | null): string {
  const P = nid('b');
  const inner = bgInner(id, P);
  return `<defs><clipPath id="${P}clip"><circle cx="150" cy="150" r="150"/></clipPath></defs><g clip-path="url(#${P}clip)">${inner}</g>`;
}
function bgInner(id: string | null, P: string): string {
  switch (id) {
    case 'bg_kitchen': return `<defs><pattern id="${P}" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#FFE1BC"/><rect width="15" height="15" fill="#FFF3E2"/><rect x="15" y="15" width="15" height="15" fill="#FFF3E2"/></pattern></defs><circle cx="150" cy="150" r="150" fill="url(#${P})"/><rect x="0" y="206" width="300" height="94" fill="#E8B987"/><rect x="0" y="200" width="300" height="10" fill="#C98F5A"/>`;
    case 'bg_garden': return `<circle cx="150" cy="150" r="150" fill="#DDEBC0"/><g fill="#A9BC52" opacity=".8">${[[40, 210], [80, 190], [230, 200], [260, 230], [200, 220], [60, 240]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="12" transform="rotate(-24 ${x} ${y})"/>`).join('')}</g><circle cx="230" cy="70" r="26" fill="#FFE38A"/><rect x="0" y="230" width="300" height="70" fill="#B9D07E"/>`;
    case 'bg_night': return `<circle cx="150" cy="150" r="150" fill="#2B2A5A"/>${[[50, 60], [90, 30], [230, 50], [260, 110], [40, 140], [200, 25], [130, 70]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 2.4 : 1.6}" fill="#FFF1D6"/>`).join('')}<circle cx="236" cy="78" r="20" fill="#FFF1D6"/><circle cx="246" cy="72" r="18" fill="#2B2A5A"/>`;
    case 'bg_gold': return `<defs><radialGradient id="${P}" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#FFF0B8"/><stop offset="1" stop-color="#E9B949"/></radialGradient></defs><circle cx="150" cy="150" r="150" fill="url(#${P})"/>${[[60, 70], [240, 90], [80, 220], [230, 210], [150, 30]].map(([x, y]) => `<path d="M${x} ${y - 9}l2.5 6.5 6.5 2.5-6.5 2.5-2.5 6.5-2.5-6.5-6.5-2.5 6.5-2.5z" fill="#FFFFFF" opacity=".85"/>`).join('')}`;
  }
  return `<circle cx="150" cy="150" r="150" fill="var(--blob)"/>`;
}

export interface CharProps { char: CharId; eq?: Partial<Record<Slot, string | null>>; stage?: number; asleep?: boolean; label?: string; className?: string; exercise?: boolean }

function charInner({ char, eq = {}, stage = 2, asleep }: CharProps) {
  const c = CHARS[char], P = nid('c');
  let ears = '', tail = '', marks = '', extra = '';
  if (char === 'bear') {
    ears = `<g class="earL"><circle cx="60" cy="44" r="23" fill="url(#${P}fur)"/><circle cx="60" cy="44" r="11" fill="${c.ear}"/></g><g class="earR"><circle cx="180" cy="44" r="23" fill="url(#${P}fur)"/><circle cx="180" cy="44" r="11" fill="${c.ear}"/></g>`;
    tail = `<circle cx="190" cy="214" r="12" fill="${c.fur[2]}"/>`;
  } else if (char === 'hare') {
    ears = `<g class="earL"><ellipse cx="88" cy="22" rx="16" ry="44" transform="rotate(-12 88 22)" fill="url(#${P}fur)"/><ellipse cx="88" cy="26" rx="7" ry="32" transform="rotate(-12 88 26)" fill="${c.ear}"/></g><g class="earR"><ellipse cx="152" cy="22" rx="16" ry="44" transform="rotate(14 152 22)" fill="url(#${P}fur)"/><ellipse cx="152" cy="26" rx="7" ry="32" transform="rotate(14 152 26)" fill="${c.ear}"/></g>`;
    tail = `<circle cx="194" cy="206" r="17" fill="#FBF3F5"/><circle cx="198" cy="200" r="6" fill="#fff" opacity=".7"/>`;
    extra = `<path d="M92 120h-30M92 126l-28 6M148 120h30M148 126l28 6" stroke="${c.fur[2]}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
  } else {
    ears = `<g class="earL"><path d="M52 66 62 18l40 28z" fill="url(#${P}fur)"/><path d="M62 54 66 30l20 16z" fill="${c.ear}"/></g><g class="earR"><path d="M188 66 178 18l-40 28z" fill="url(#${P}fur)"/><path d="M178 54 174 30l-20 16z" fill="${c.ear}"/></g>`;
    tail = `<path d="M176 222c38 4 56-26 46-56" stroke="${c.fur[1]}" stroke-width="24" stroke-linecap="round" fill="none"/><path d="M196 222l6-20M214 208l-12-14M222 186l-18-4" stroke="#3B2F35" stroke-width="8" stroke-linecap="round"/>`;
    marks = `<path d="M56 92c10-22 42-26 56-10 4 4 12 4 16 0 14-16 46-12 56 10-10 18-40 22-56 12h-16c-16 10-46 6-56-12z" fill="#3B2F35"/><path d="M100 50l20 22 20-22" stroke="#3B2F35" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".5"/>`;
  }
  const eyeFill = char === 'raccoon' ? '#FFF1D6' : '#3B1E3F';
  const eyeHi = char === 'raccoon' ? '#3B2F35' : '#FFFFFF';
  const eyes = asleep
    ? `<path d="M84 90c5 5 11 5 16 0M140 90c5 5 11 5 16 0" stroke="${eyeFill}" stroke-width="4" stroke-linecap="round" fill="none"/>`
    : `<g class="pupils"><g class="eye"><ellipse cx="92" cy="88" rx="8.5" ry="10.5" fill="${eyeFill}"/><circle cx="95" cy="84" r="3" fill="${eyeHi}"/></g><g class="eye"><ellipse cx="148" cy="88" rx="8.5" ry="10.5" fill="${eyeFill}"/><circle cx="151" cy="84" r="3" fill="${eyeHi}"/></g></g>`;
  const scale = stage <= 1 ? 0.84 : stage === 2 ? 0.93 : 1;
  const sprout = stage <= 1 && !eq.head ? `<path d="M120 30c0-10 2-16 6-20" stroke="#5E6E22" stroke-width="4" stroke-linecap="round" fill="none"/><ellipse cx="132" cy="10" rx="10" ry="6" transform="rotate(-25 132 10)" fill="#93A83C"/>` : '';
  const halo = stage >= 5 ? `<ellipse cx="120" cy="22" rx="40" ry="9" fill="none" stroke="#F0B429" stroke-width="5" opacity=".9"/>` : '';
  const star = stage >= 4 ? `<path d="M120 182l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#F0B429" opacity=".9"/>` : '';
  const zzz = asleep ? `<g class="zzz" font-family="Unbounded,sans-serif" font-weight="800" fill="#6E4C68"><text x="178" y="40" font-size="20">z</text><text x="196" y="22" font-size="14">z</text></g>` : '';
  return `<defs>
    <radialGradient id="${P}fur" cx="38%" cy="28%" r="78%"><stop offset="0" stop-color="${c.fur[0]}"/><stop offset=".62" stop-color="${c.fur[1]}"/><stop offset="1" stop-color="${c.fur[2]}"/></radialGradient>
    <radialGradient id="${P}bel" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="${c.belly[0]}"/><stop offset="1" stop-color="${c.belly[1]}"/></radialGradient>
    ${itemDefs(P)}</defs>
  <ellipse cx="120" cy="250" rx="${82 * scale}" ry="9" fill="#3B1E3F" opacity=".13"/>
  <g transform="translate(${120 - 120 * scale} ${250 - 250 * scale}) scale(${scale})"><g class="breath">
    ${halo}${tail}
    <path d="M44 186c0-48 34-78 76-78s76 30 76 78c0 38-24 62-76 62s-76-24-76-62z" fill="url(#${P}fur)"/>
    <ellipse cx="120" cy="194" rx="45" ry="43" fill="url(#${P}bel)"/>${star}
    <ellipse cx="50" cy="178" rx="15" ry="26" transform="rotate(18 50 178)" fill="${c.fur[2]}"/>
    <ellipse cx="190" cy="178" rx="15" ry="26" transform="rotate(-18 190 178)" fill="${c.fur[2]}"/>
    <ellipse cx="68" cy="240" rx="27" ry="15" fill="${c.feet}"/><ellipse cx="172" cy="240" rx="27" ry="15" fill="${c.feet}"/>
    <ellipse cx="68" cy="242" rx="13" ry="7" fill="${c.belly[1]}"/><ellipse cx="172" cy="242" rx="13" ry="7" fill="${c.belly[1]}"/>
    ${eq.neck ? itemSVG(eq.neck, P) : ''}
    ${ears}
    <ellipse cx="120" cy="92" rx="72" ry="64" fill="url(#${P}fur)"/>
    <ellipse cx="98" cy="54" rx="24" ry="12" fill="#fff" opacity=".16"/>
    ${marks}
    <ellipse cx="120" cy="116" rx="33" ry="25" fill="url(#${P}bel)"/>${extra}${eyes}
    <path d="M110 104c0-5 20-5 20 0s-5 8-10 8-10-3-10-8z" fill="#3B1E3F"/>
    <path d="${asleep ? 'M115 122h10' : 'M113 121c4 5 10 5 14 0'}" stroke="#3B1E3F" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="76" cy="110" rx="11" ry="7" fill="#E5462B" opacity=".32"/><ellipse cx="164" cy="110" rx="11" ry="7" fill="#E5462B" opacity=".32"/>
    ${eq.face ? itemSVG(eq.face, P) : ''}${eq.head ? itemSVG(eq.head, P) : sprout}
  </g></g>${zzz}`;
}

export const Character = memo(function Character(p: CharProps) {
  const html = useMemo(() => charInner(p), [p.char, p.eq?.head, p.eq?.neck, p.eq?.face, p.stage, p.asleep]);
  return <svg className={'char ' + (p.className || '') + (p.exercise ? ' exercise' : '')} viewBox="0 0 240 260" role="img" aria-label={p.label || CHARS[p.char].name.uk} dangerouslySetInnerHTML={{ __html: html }} />;
});

export function Backdrop({ id, style }: { id: string | null; style?: React.CSSProperties }) {
  const html = useMemo(() => bgSVG(id), [id]);
  return <svg viewBox="0 0 300 300" style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ItemThumb({ id, style }: { id: string; style?: React.CSSProperties }) {
  const it = ITEM[id];
  const html = useMemo(() => {
    if (it.slot === 'bg') return `<g transform="translate(20 0) scale(.4)">${bgSVG(id)}</g>`;
    const P = nid('t');
    return `<defs>${itemDefs(P)}</defs>${itemSVG(id, P)}`;
  }, [id]);
  const vb = it.slot === 'head' ? '30 -6 180 136' : it.slot === 'neck' ? '40 130 160 100' : it.slot === 'face' ? '48 60 144 60' : '0 0 160 120';
  return <svg viewBox={vb} style={{ width: '100%', height: 84, display: 'block', ...style }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

const SLOTS: [number, number, number][] = [[62, 96, 1], [96, 108, 1], [104, 64, 1], [78, 54, .9], [118, 90, .85], [56, 70, .8], [86, 82, .8], [126, 62, .7], [70, 118, .7], [110, 118, .7], [48, 92, .6], [132, 104, .6]];
export function Plate({ foods, size = 170, style, layoutId }: { foods: FoodEntry[]; size?: number; style?: React.CSSProperties; layoutId?: string }) {
  const html = useMemo(() => {
    const P = nid('p');
    const defs = Object.entries(CATS).map(([k, v]) => `<radialGradient id="${P}${k}" cx="35%" cy="30%" r="72%"><stop offset="0" stop-color="${v.c[0]}"/><stop offset="1" stop-color="${v.c[1]}"/></radialGradient>`).join('');
    const blobs = foods.slice(-12).map((e, i, arr) => {
      const [x, y, s] = SLOTS[i];
      const r = Math.max(11, Math.min(26, Math.sqrt((e.food.kcal * e.g) / 100) * 1.05)) * s + 5;
      const last = i === arr.length - 1;
      const cat = e.food.cat;
      return `<g class="${last ? 'grow' : ''}"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${P}${cat})" ${cat === 'dairy' ? 'stroke="#E2D2B6" stroke-width="1.5"' : ''}/><ellipse cx="${x - r * 0.32}" cy="${y - r * 0.38}" rx="${r * 0.35}" ry="${r * 0.2}" fill="#fff" opacity=".35"/></g>`;
    }).join('');
    return `<defs>${defs}<radialGradient id="${P}pl" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F1E3CC"/></radialGradient></defs>
    <ellipse cx="86" cy="152" rx="62" ry="9" fill="#3B1E3F" opacity=".14"/><circle cx="84" cy="84" r="72" fill="url(#${P}pl)"/><circle cx="84" cy="84" r="54" fill="none" stroke="#E7D3B4" stroke-width="2"/>${blobs}`;
  }, [foods.length, foods[foods.length - 1]?.id]);
  void layoutId;
  return <svg viewBox="0 0 168 168" width={size} height={size} style={style} role="img" aria-label={`Тарілка дня / Plate: ${foods.length}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

const LEAVES: [number, number, number, number, number, string][] = [[30, 96, -28, 15, 8, '#6F7F2E'], [62, 88, 28, 15, 8, '#6F7F2E'], [30, 76, -30, 14, 7.5, '#7E9230'], [62, 68, 30, 14, 7.5, '#7E9230'], [32, 56, -32, 13, 7, '#93A83C'], [60, 48, 32, 13, 7, '#93A83C'], [40, 36, -20, 10, 6, '#A9BC52'], [52, 30, 20, 10, 6, '#A9BC52']];
export function Plant({ water, goal, style }: { water: number; goal: number; style?: React.CSSProperties }) {
  const leaves = Math.min(8, Math.round((water / Math.max(1, goal)) * 8));
  const bloom = water >= goal;
  const html = useMemo(() => {
    const top = leaves ? Math.max(28, 104 - leaves * 10) : 100;
    const lv = LEAVES.slice(0, leaves).map((l, i) => `<ellipse class="${i === leaves - 1 ? 'grow' : ''}" cx="${l[0]}" cy="${l[1]}" rx="${l[3]}" ry="${l[4]}" transform="rotate(${l[2]} ${l[0]} ${l[1]})" fill="${l[5]}"/>`).join('');
    const fl = bloom ? `<g class="grow"><circle cx="46" cy="18" r="8" fill="#F7A8C4"/><circle cx="46" cy="18" r="3.4" fill="#F0B429"/></g>` : '';
    return `<path d="M46 104V${top}" stroke="#5E6E22" stroke-width="4" stroke-linecap="round"/>${lv}${fl}<path d="M18 104h56l-7 32H25z" fill="#E5462B"/><rect x="14" y="98" width="64" height="12" rx="6" fill="#C9361E"/><path d="M26 116h40" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".25"/>`;
  }, [leaves, bloom]);
  return <svg viewBox="0 0 92 136" style={style} role="img" aria-label={`${water}/${goal}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
export { esc };
