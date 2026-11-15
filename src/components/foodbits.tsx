import { useRef, useState } from 'react';
import { act, useApp } from '../store';
import { useT, openSheet } from './ui';
import { Icon } from './Icon';
import { CATS } from '../data/foods';
import { copyFoods, MEALS } from '../logic/game';
import { addDays, parse, today } from '../logic/dates';
import { locale, plural } from '../i18n';
import type { Cat, FoodEntry, MealKey } from '../types';

/** Горизонтальний свайп: вліво — наступне, вправо — попереднє. Не заважає прокрутці чипів і полям вводу. */
export function useSwipe(onPrev: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number; ok: boolean } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      const el = e.target as HTMLElement;
      const ok = !el.closest('.chips, input, textarea, .noswipe, .leaflet-container');
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ok };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const s0 = start.current; start.current = null;
      if (!s0?.ok) return;
      const dx = e.changedTouches[0].clientX - s0.x, dy = e.changedTouches[0].clientY - s0.y;
      if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
      if (dx < 0) onNext(); else onPrev();
    }
  };
}

/** Кольорові крапки груп продуктів у прийомі їжі. Лише «скільки різного», жодних оцінок. */
export function MealVariety({ es }: { es: FoodEntry[] }) {
  const t = useT();
  const cats = [...new Set(es.map(e => e.food.cat))] as Cat[];
  if (!cats.length) return null;
  const label = cats.map(c => CATS[c][t.lang]).join(', ');
  return (
    <span className="row-c" style={{ gap: 3 }} title={label} aria-label={t(`Групи продуктів: ${label}`, `Food groups: ${label}`)}>
      {cats.map(c => <i key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: CATS[c].c[1], boxShadow: '0 0 0 1.5px var(--surface)' }} />)}
      <span className="lbl" style={{ fontSize: 11.5, marginLeft: 3 }}>{cats.length} {plural(t.lang, cats.length, ['група', 'групи', 'груп'], ['group', 'groups'])}</span>
    </span>
  );
}

/** Вікно «Копіювати»: прийом їжі або весь день в інший день */
export function openCopy(from: string, meal?: MealKey) { openSheet(close => <CopySheet from={from} meal={meal} close={close} />); }
function CopySheet({ from, meal, close }: { from: string; meal?: MealKey; close: () => void }) {
  const s = useApp();
  const t = useT();
  const td = today();
  const [to, setTo] = useState(td);
  const [m, setM] = useState<MealKey | undefined>(meal);
  const src = (s.days[from]?.foods || []).filter(f => !meal || f.meal === meal);
  const nice = (k: string) => k === td ? t('сьогодні', 'today') : k === addDays(td, -1) ? t('вчора', 'yesterday') : parse(k).toLocaleDateString(locale(s.lang), { day: 'numeric', month: 'long' });
  const quick = [td, addDays(td, -1)].filter(k => k !== from || meal);
  return (
    <div className="stack" style={{ gap: 14 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{meal ? t('Копіювати прийом їжі', 'Copy meal') : t('Копіювати весь день', 'Copy the whole day')}</h2>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.45 }}>{src.map(e => t.l(e.food.name)).join(', ')}</p>
      <span className="lbl">{t('Куди', 'To')}</span>
      <div className="chips" style={{ flexWrap: 'wrap' }}>
        {quick.map(k => <button key={k} className={'chip press' + (to === k ? ' on' : '')} onClick={() => setTo(k)}>{nice(k).replace(/^./, c => c.toUpperCase())}</button>)}
        <label className={'chip press' + (!quick.includes(to) ? ' on' : '')} style={{ position: 'relative' }}>
          <Icon name="book" size={16} />{!quick.includes(to) ? nice(to) : t('Інший день', 'Another day')}
          <input type="date" max={td} value={to} onChange={e => e.target.value && setTo(e.target.value)} aria-label={t('Обрати день', 'Pick a day')} style={{ position: 'absolute', inset: 0, opacity: 0 }} />
        </label>
      </div>
      {meal && <>
        <span className="lbl">{t('У який прийом', 'Into which meal')}</span>
        <div className="chips">{MEALS.map(x => <button key={x.k} className={'chip press' + (m === x.k ? ' on' : '')} onClick={() => setM(x.k)}>{t.l(x.name)}</button>)}</div>
      </>}
      <button className="btn block press" data-autofocus disabled={!src.length} onClick={() => { act(x => copyFoods(x, from, to, meal, m)); close(); }}>
        <Icon name="copy" size={20} />{t('Копіювати на ', 'Copy to ')}{nice(to)}
      </button>
      {to !== td && <p className="muted" style={{ fontSize: 12.5 }}>{t('Записи за минулі дні йдуть у щоденник без монет і досвіду.', 'Entries for past days go into the diary without coins or XP.')}</p>}
    </div>
  );
}
