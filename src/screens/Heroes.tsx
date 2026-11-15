import { useState } from 'react';
import { act, useApp } from '../store';
import { useT, openSheet } from '../components/ui';
import { Backdrop, Character } from '../components/art';
import { Coin, Icon } from '../components/Icon';
import { CHARS, CHAR_IDS, UNLOCK } from '../data/characters';
import { findAch } from '../data/achievements';
import { buyHero, needHero, selectHero, stageOf, STAGES } from '../logic/game';
import { fmt } from '../i18n';
import WardrobePanel from './Wardrobe';
import type { CharId } from '../types';

export default function Heroes() {
  const s = useApp();
  const t = useT();
  const cur = s.profile.char;
  const h = s.chars[cur];
  const st = stageOf(h.lv);
  const owned = CHAR_IDS.filter(c => s.chars[c].own).length;
  const rename = () => openSheet(close => <Rename close={close} />);

  return (
    <main className="screen">
      <div className="pad row-c" style={{ justifyContent: 'space-between' }}>
        <h1 className="h1">{t('Герої', 'Heroes')}</h1>
        <span className="row-c" style={{ gap: 5, background: 'var(--ink)', color: 'var(--bg)', borderRadius: 999, padding: '7px 11px 7px 8px', fontWeight: 700, fontSize: 14 }}>
          <Coin />{fmt(s.coins, s.lang)}<span style={{ width: 6 }} /><Icon name="star" size={18} stroke={2.6} style={{ color: 'var(--mustard)' }} />{s.stars}
        </span>
      </div>

      <section style={{ position: 'relative', height: 268, marginTop: 4 }}>
        <Backdrop id={s.eq.bg} style={{ position: 'absolute', left: '50%', top: 14, width: 250, height: 250, marginLeft: -125 }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 226, marginLeft: -113 }}><Character char={cur} eq={s.eq} stage={st.index} label={s.profile.cname} /></div>
      </section>
      <section className="pad stack" style={{ gap: 8, alignItems: 'center', textAlign: 'center' }}>
        <button className="row-c press" onClick={rename} style={{ gap: 6 }} aria-label={t('Змінити ім\'я', 'Rename')}>
          <span className="disp" style={{ fontWeight: 800, fontSize: 24 }}>{s.profile.cname}</span><Icon name="edit" size={18} style={{ color: 'var(--ink2)' }} />
        </button>
        <span className="muted" style={{ fontWeight: 600, fontSize: 14 }}>{t.l(CHARS[cur].kind)} · {t('рівень', 'level')} {h.lv} · {t.l(st.name)}</span>
        <div className="bar" style={{ width: '80%', height: 12 }}><i style={{ width: Math.min(100, (h.xp / needHero(h.lv)) * 100) + '%' }} /></div>
        <span className="lbl" style={{ fontSize: 12 }}>{h.xp}/{needHero(h.lv)} {t('досвіду', 'XP')}{st.next ? t(` · нова стадія на ${st.next} рівні`, ` · next stage at level ${st.next}`) : ''}</span>
        <div className="row-c" style={{ gap: 6, marginTop: 6 }}>
          {STAGES.map((x, i) => (
            <div key={i} className="stack" style={{ alignItems: 'center', gap: 2, width: 58 }}>
              <div style={{ width: 52, filter: h.lv >= x.from ? undefined : 'grayscale(1) opacity(.35)' }}><Character char={cur} stage={i + 1} /></div>
              <span style={{ fontSize: 10.5, fontWeight: 700, opacity: h.lv >= x.from ? 1 : 0.5 }}>{x.from} {t('рів.', 'lv')}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{t('Досвід отримує герой, який зараз поруч. Перемикайся між героями — кожен росте окремо.', 'XP goes to the hero who\'s with you now. Switch heroes — each grows separately.')}</p>
      </section>

      <section className="pad stack" style={{ marginTop: 22, gap: 10 }}>
        <div className="row-c" style={{ justifyContent: 'space-between' }}><h2 className="sectionT">{t('Колекція', 'Collection')}</h2><span className="lbl">{owned}/{CHAR_IDS.length}</span></div>
        <div className="grid3" style={{ gap: 8 }}>
          {CHAR_IDS.map(c => {
            const ch = s.chars[c], active = c === cur;
            return (
              <button key={c} className="press stack" onClick={() => openSheet(close => <HeroSheet id={c} close={close} />)} aria-label={ch.own ? t.l(CHARS[c].name) : t('Закритий герой', 'Locked hero')}
                style={{ alignItems: 'center', gap: 4, padding: '10px 6px 12px', borderRadius: 20, background: 'var(--surface)', boxShadow: active ? 'inset 0 0 0 3px var(--ink)' : 'none' }}>
                <div style={{ width: 80, filter: ch.own ? undefined : 'brightness(0) opacity(.18)' }} aria-hidden="true"><Character char={c} stage={ch.own ? stageOf(ch.lv).index : 2} label="" /></div>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{ch.own ? t.l(CHARS[c].name) : '???'}</span>
                <span className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{active ? t('поруч', 'with you') : ch.own ? `${t('рів.', 'lv')} ${ch.lv}` : <span className="row-c" style={{ gap: 3 }}><Icon name="star" size={12} stroke={2.6} />{UNLOCK[c].stars}</span>}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="pad stack" style={{ marginTop: 22, gap: 10 }}>
        <h2 className="sectionT">{t('Гардероб', 'Wardrobe')}</h2>
        <WardrobePanel />
      </section>
    </main>
  );
}

function HeroSheet({ id, close }: { id: CharId; close: () => void }) {
  const s = useApp();
  const t = useT();
  const ch = s.chars[id];
  const c = CHARS[id];
  const ach = findAch(UNLOCK[id].ach);
  const active = s.profile.char === id;
  const [showLines] = useState(() => c.lines.hello[s.lang]);
  return (
    <div className="stack" style={{ gap: 10, alignItems: 'center', textAlign: 'center' }}>
      <div style={{ width: 190, filter: ch.own ? undefined : 'brightness(0) opacity(.2)' }}><Character char={id} stage={ch.own ? stageOf(ch.lv).index : 2} exercise={ch.own} /></div>
      <h2 className="disp" style={{ fontSize: 22, fontWeight: 800 }}>{ch.own ? (s.heroNames?.[id] || (active ? s.profile.cname : t.l(c.name))) : t.l(c.name)}</h2>
      <span className="muted" style={{ fontWeight: 600 }}>{t.l(c.kind)}{ch.own ? ` · ${t('рівень', 'level')} ${ch.lv}` : ''}</span>
      <p style={{ fontSize: 15, lineHeight: 1.45 }}>{t.l(c.vibe)}</p>
      {ch.own && <p className="muted" style={{ fontStyle: 'italic', fontSize: 14 }}>«{showLines[0]}»</p>}
      {ch.own ? (active ? <span className="chip on">{t('Вже поруч з тобою', 'Already with you')}</span>
        : <button className="btn block press" onClick={() => { act(x => selectHero(x, id)); close(); }}>{t('Обрати героєм', 'Choose as hero')}</button>)
        : <>
          <button className="btn block press" disabled={s.stars < UNLOCK[id].stars} onClick={() => { act(x => buyHero(x, id)); close(); }}><Icon name="star" size={20} stroke={2.6} />{t(`Відкрити за ${UNLOCK[id].stars} зірок`, `Unlock for ${UNLOCK[id].stars} stars`)}</button>
          <span className="muted" style={{ fontSize: 13.5, lineHeight: 1.45 }}>{t(`Або безкоштовно за досягнення «${ach?.name.uk}»: ${ach?.desc.uk.toLowerCase()}.`, `Or free with the «${ach?.name.en}» achievement: ${ach?.desc.en.toLowerCase()}.`)}{s.stars < UNLOCK[id].stars ? t(` Зірки дають тижневі завдання, досягнення і сезон. У тебе ${s.stars}.`, ` Stars come from weekly quests, achievements and the season. You have ${s.stars}.`) : ''}</span>
        </>}
    </div>
  );
}

function Rename({ close }: { close: () => void }) {
  const s = useApp();
  const t = useT();
  const [n, setN] = useState(s.profile.cname);
  return (
    <form className="stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); if (n.trim()) act(x => { x.profile.cname = n.trim().slice(0, 16); x.heroNames = { ...(x.heroNames || {}), [x.profile.char]: x.profile.cname }; }); close(); }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Ім\'я героя', 'Hero\'s name')}</h2>
      <input className="field" value={n} maxLength={16} onChange={e => setN(e.target.value)} data-autofocus />
      <button className="btn block press" type="submit">{t('Зберегти', 'Save')}</button>
    </form>
  );
}
