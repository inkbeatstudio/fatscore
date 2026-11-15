import { useState } from 'react';
import { act, useApp, emitEffects } from '../store';
import { useT, openSheet } from '../components/ui';
import { ItemThumb } from '../components/art';
import { Coin, Icon } from '../components/Icon';
import { ITEMS, ITEM, RARITY, inSeason } from '../data/items';
import { findAch } from '../data/achievements';
import { SEASONS } from '../data/seasons';
import { buyItem, toggleEquip } from '../logic/game';
import type { Slot } from '../types';

const SLOTS: [Slot, string, string][] = [['head', 'Голова', 'Head'], ['neck', 'Шия', 'Neck'], ['face', 'Обличчя', 'Face'], ['bg', 'Кімната', 'Room']];

/** Гардероб: речі пасують кожному герою */
export default function WardrobePanel() {
  const s = useApp();
  const t = useT();
  const [slot, setSlot] = useState<Slot>('head');
  const list = ITEMS.filter(i => i.slot === slot && (inSeason(i) || s.owned.includes(i.id)));

  const how = (id: string) => {
    const it = ITEM[id];
    if (it.earn) return t.l(findAch(it.earn)?.name || { uk: it.earn, en: it.earn });
    if (it.seasonal) return t(`Сезон «${SEASONS[it.seasonal].name.uk}»`, `«${SEASONS[it.seasonal].name.en}» season`);
    return '';
  };
  const tap = (id: string) => {
    const it = ITEM[id];
    if (s.owned.includes(id)) { act(x => toggleEquip(x, id)); return; }
    if (it.price == null) { emitEffects([{ type: 'toast', icon: 'lock', text: t(`Як отримати: ${how(id)}`, `How to get: ${how(id)}`) }]); return; }
    if (s.coins < it.price) { emitEffects([{ type: 'toast', icon: 'coin', text: t(`Ще ${it.price - s.coins} монет, і річ твоя`, `${it.price - s.coins} more coins and it's yours`) }]); return; }
    openSheet(close => (
      <div className="stack" style={{ gap: 14, alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 220, padding: 10, borderRadius: 26, background: 'var(--surface)' }}><ItemThumb id={id} style={{ height: 120 }} /></div>
        <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t.l(it.name)}</h2>
        <span style={{ fontWeight: 700, fontSize: 13, color: RARITY[it.rar].color }}>{t.l(RARITY[it.rar].name)}</span>
        <button className="btn block press" data-autofocus onClick={() => { act(x => buyItem(x, id)); close(); }}><Coin size={20} />{t(`Купити за ${it.price}`, `Buy for ${it.price}`)}</button>
        <button className="btn ghost block press" onClick={close}>{t('Не зараз', 'Not now')}</button>
      </div>
    ));
  };

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="seg" role="tablist">{SLOTS.map(([k, uk, en]) => <button key={k} role="tab" aria-selected={slot === k} className={slot === k ? 'on' : ''} onClick={() => setSlot(k)}>{t(uk, en)}</button>)}</div>
      <div className="grid2">
        {list.map(it => {
          const own = s.owned.includes(it.id), eq = s.eq[it.slot] === it.id;
          return (
            <button key={it.id} className="press stack" onClick={() => tap(it.id)} aria-pressed={eq}
              style={{ borderRadius: 22, background: 'var(--surface)', padding: '10px 12px 14px', gap: 4, minHeight: 176, textAlign: 'left', boxShadow: eq ? 'inset 0 0 0 3px var(--ink)' : 'none' }}>
              <ItemThumb id={it.id} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: RARITY[it.rar].color }}>{t.l(RARITY[it.rar].name)}{it.seasonal || it.season ? t(', сезонна', ', seasonal') : ''}</span>
              <span style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{t.l(it.name)}</span>
              {eq ? <span style={{ fontWeight: 700, fontSize: 14 }}>{t('Вдягнено', 'Wearing')}</span>
                : own ? <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--olive)' }}>{t('Вдягнути', 'Wear')}</span>
                  : it.price != null ? <span className="row-c" style={{ gap: 4, fontWeight: 700, fontSize: 14, opacity: s.coins >= it.price ? 1 : 0.6 }}><Coin size={17} />{it.price}</span>
                    : <span className="row-c" style={{ gap: 5, fontSize: 12.5, fontWeight: 600, color: 'var(--ink2)', lineHeight: 1.25 }}><Icon name="lock" size={16} style={{ flexShrink: 0 }} />{how(it.id)}</span>}
            </button>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{t('Без лутбоксів: бачиш річ — отримуєш саме її. Легендарні та сезонні речі лише заробляються.', 'No loot boxes: you see the item, you get that item. Legendary and seasonal items can only be earned.')}</p>
    </div>
  );
}
