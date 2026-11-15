import { useMemo, useState } from 'react';
import { useApp } from '../store';
import { useT, openSheet } from '../components/ui';
import { Coin, Icon } from '../components/Icon';
import { ItemThumb } from '../components/art';
import { Badge } from '../components/Badge';
import { WeeklyList } from './Home';
import { aggregate, questsFor } from '../logic/game';
import { allAchs, TIERS, type AchDef } from '../data/achievements';
import { seasonOf, SEASON_TIER_PTS, SEASON_TIERS, TIER_REWARDS } from '../data/seasons';
import { CITIES } from '../data/exercise';
import { today } from '../logic/dates';
import { fmt, locale } from '../i18n';
import { go } from '../nav';

type Filter = 'all' | 'got' | 'progress' | 'season' | 'secret';

export default function Adventure() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  const se = seasonOf();
  const st = s.season[se.key] || { pts: 0, tier: 0, daily: 0, weekly: 0 };
  const [filter, setFilter] = useState<Filter>('all');
  const ag = useMemo(() => aggregate(s), [s]);
  const achs = allAchs(s, se.key);
  const got = achs.filter(a => s.ach[a.id]).length;
  const shown = achs.filter(a => filter === 'all' ? true : filter === 'got' ? !!s.ach[a.id] : filter === 'progress' ? !s.ach[a.id] && !a.secret : filter === 'season' ? !!a.seasonal : !!a.secret);
  const prog = (a: AchDef) => (a.metric && a.goal ? Math.min(1, a.metric(ag, s) / a.goal) : 0);
  const inTier = st.tier >= SEASON_TIERS ? SEASON_TIER_PTS : st.pts % SEASON_TIER_PTS;

  return (
    <main className="screen">
      <div className="pad"><h1 className="h1">{t('Пригоди', 'Adventures')}</h1></div>

      <section className="pad" style={{ marginTop: 14 }}>
        <div className="stack" style={{ borderRadius: 28, padding: 18, gap: 12, background: `linear-gradient(140deg, ${se.def.colors[0]}, ${se.def.colors[1]})`, color: '#2A1630' }}>
          <div className="row-c" style={{ justifyContent: 'space-between', gap: 10 }}>
            <div className="stack" style={{ gap: 2 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.75 }}>{t('Сезон', 'Season')} · {t(`ще ${se.daysLeft} дн.`, `${se.daysLeft} days left`)}</span>
              <span className="disp" style={{ fontWeight: 800, fontSize: 22 }}>{t.l(se.def.name)}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.85 }}>{t.l(se.def.tagline)}</span>
            </div>
            <span className="disp" style={{ fontWeight: 800, fontSize: 36 }}>{st.tier}<span style={{ fontSize: 15, opacity: 0.7 }}>/{SEASON_TIERS}</span></span>
          </div>
          <div className="bar" style={{ height: 10, background: 'rgba(42,22,48,.15)' }}><i style={{ width: (inTier / SEASON_TIER_PTS) * 100 + '%', background: '#2A1630' }} /></div>
          <div className="chips" style={{ gap: 8, margin: '0 -18px', padding: '2px 18px 4px' }}>
            {TIER_REWARDS.map((r, i) => {
              const reached = st.tier > i;
              const itemId = r.item != null ? se.def.items[r.item] : undefined;
              return (
                <div key={i} className="stack" style={{ flex: '0 0 76px', alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 16, background: reached ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.3)', boxShadow: st.tier === i ? 'inset 0 0 0 2.5px #2A1630' : 'none' }}>
                  <span style={{ fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
                  <div style={{ width: 48, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {itemId ? <ItemThumb id={itemId} style={{ height: 40 }} /> : r.stars ? <Icon name="star" size={28} stroke={2.4} style={{ color: '#B97A00' }} /> : <Coin size={28} />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.15 }}>{itemId ? t('річ', 'item') : r.stars ? `+${r.stars}` : `+${r.coins}`}</span>
                  {reached && <Icon name="check" size={14} stroke={3} />}
                </div>
              );
            })}
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85 }}>{t('Денне завдання дає 10 очок, тижневе — 40. Сезонні речі можна отримати лише в цьому сезоні.', 'Daily quests give 10 points, weekly ones 40. Seasonal items are only available this season.')}</span>
        </div>
      </section>

      <section className="pad stack" style={{ marginTop: 22, gap: 10 }}>
        <div className="row-c" style={{ justifyContent: 'space-between' }}><h2 className="sectionT">{t('Денні завдання', 'Daily quests')}</h2><span className="lbl">{t('+20 досвіду, +15 монет', '+20 XP, +15 coins')}</span></div>
        {questsFor(s).map(q => { const done = !!d.quests[q.id]; return (
          <div key={q.id} className="row-c card quest" style={{ gap: 12, minHeight: 56, padding: '0 16px' }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--olive)' : 'transparent', boxShadow: done ? 'none' : 'inset 0 0 0 2.5px var(--ink2)', color: '#FFF8EA' }}>{done && <Icon name="check" size={18} stroke={3} />}</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 15, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}>{t.l(q.t)}</span>
          </div>); })}
      </section>

      <section className="pad stack" style={{ marginTop: 22, gap: 10 }}>
        <div className="row-c" style={{ justifyContent: 'space-between' }}><h2 className="sectionT">{t('Тижневі завдання', 'Weekly quests')}</h2><span className="lbl">{t('+1 зірка кожне', '+1 star each')}</span></div>
        <div className="card" style={{ padding: 16 }}><WeeklyList /></div>
        <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{t('Оновлюються щопонеділка. Виконаєш усі три до неділі — отримаєш таємне досягнення.', 'They reset every Monday. Finish all three by Sunday for a secret achievement.')}</p>
      </section>

      <section className="pad stack" style={{ marginTop: 22, gap: 12 }}>
        <div className="row-c" style={{ justifyContent: 'space-between' }}><h2 className="sectionT">{t('Досягнення', 'Achievements')}</h2><span className="lbl">{got}/{achs.length}</span></div>
        <div className="chips">
          {([['all', 'Усі', 'All'], ['got', 'Отримані', 'Earned'], ['progress', 'В процесі', 'In progress'], ['season', 'Сезонні', 'Seasonal'], ['secret', 'Таємні', 'Secret']] as const).map(([k, uk, en]) =>
            <button key={k} className={'chip press' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{t(uk, en)}</button>)}
        </div>
        <div className="grid3" style={{ gap: 8 }}>
          {shown.map(a => { const has = !!s.ach[a.id]; const hide = a.secret && !has; const p = prog(a); return (
            <button key={a.id} className="press stack" onClick={() => openSheet(() => <AchDetail a={a} />)} style={{ alignItems: 'center', gap: 4, padding: '10px 4px 12px', borderRadius: 20, background: 'var(--surface)', textAlign: 'center' }}>
              <Badge a={a} earned={has} size={72} progress={has || hide ? undefined : p} />
              <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2, opacity: has ? 1 : 0.7 }}>{hide ? t('Таємне', 'Secret') : t.l(a.name)}</span>
              {!has && !hide && a.goal != null && <span className="muted" style={{ fontSize: 11 }}>{Math.round(p * 100)}%</span>}
            </button>); })}
        </div>
      </section>

      <section className="pad stack" style={{ marginTop: 22, gap: 10 }}>
        <h2 className="sectionT">{t('Мапа подорожі', 'Journey map')}</h2>
        <div className="card" style={{ padding: '14px 16px' }}>
          {CITIES.map((c, i) => { const reached = s.km >= c.km; const next = !reached && (i === 0 || s.km >= CITIES[i - 1].km); return (
            <div key={i} className="row-c" style={{ gap: 12, alignItems: 'stretch' }}>
              <div className="stack" style={{ alignItems: 'center', width: 22 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', marginTop: 4, background: reached ? 'var(--olive)' : next ? 'var(--mustard)' : 'var(--track)', boxShadow: next ? '0 0 0 4px rgba(240,180,41,.3)' : 'none', flexShrink: 0 }} />
                {i < CITIES.length - 1 && <span style={{ flex: 1, width: 3, background: reached && s.km >= CITIES[i + 1].km ? 'var(--olive)' : 'var(--track)', margin: '2px 0' }} />}
              </div>
              <div className="stack" style={{ paddingBottom: 14, flex: 1, opacity: reached || next ? 1 : 0.6 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{t.l(c.name)} <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}>{c.km} {t('км', 'km')}</span></span>
                {(reached || next) && <span className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>{reached && c.km > 0 ? `${t('Сувенір', 'Souvenir')}: ${t.l(c.souvenir)}. ${t.l(c.fact)}` : next ? t(`Ще ${fmt(c.km - s.km, 'uk', 1)} км`, `${fmt(c.km - s.km, 'en', 1)} km to go`) : t.l(c.fact)}</span>}
              </div>
            </div>); })}
          <span className="muted" style={{ fontSize: 12.5 }}>{t(`Пройдено ${fmt(s.km, 'uk', 1)} км: кроки, ходьба, біг, велосипед і маршрути з GPS.`, `${fmt(s.km, 'en', 1)} km travelled: steps, walks, runs, rides and GPS routes.`)}</span>
        </div>
      </section>

      <section className="pad" style={{ marginTop: 22 }}>
        <button className="press row-c" onClick={() => go('friends')} style={{ width: '100%', gap: 14, padding: 16, borderRadius: 26, background: 'var(--ink)', color: 'var(--bg)', textAlign: 'left' }}>
          <span style={{ width: 52, height: 52, borderRadius: 18, background: 'var(--mustard)', color: '#3B1E3F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="user" size={28} /></span>
          <span style={{ flex: 1 }}><span className="disp" style={{ display: 'block', fontWeight: 700, fontSize: 16 }}>{t('Друзі та ліги', 'Friends & leagues')}</span><span style={{ fontSize: 13, opacity: 0.8 }}>{t('Спільні цілі, чат і тижневі ліги — що буде далі', 'Shared goals, chat and weekly leagues — what\'s coming')}</span></span>
          <Icon name="chevron" size={22} />
        </button>
      </section>
    </main>
  );
}

function AchDetail({ a }: { a: AchDef }) {
  const s = useApp();
  const t = useT();
  const ag = aggregate(s);
  const has = s.ach[a.id];
  const hide = a.secret && !has;
  const cur = a.metric ? a.metric(ag, s) : 0;
  const tier = TIERS[Math.min(a.tier, TIERS.length - 1)];
  return (
    <div className="stack" style={{ gap: 10, alignItems: 'center', textAlign: 'center', paddingBottom: 6 }}>
      <Badge a={a} earned={!!has} size={150} />
      <h2 className="disp" style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.2 }}>{hide ? t('Таємне досягнення', 'Secret achievement') : t.l(a.name)}</h2>
      <span style={{ fontSize: 13, fontWeight: 700, color: tier.c[1] }}>{t.l(tier.name)}{a.seasonal ? t(' · сезонне', ' · seasonal') : ''}</span>
      <p className="muted" style={{ fontSize: 15, lineHeight: 1.45 }}>{hide ? t('Умову дізнаєшся, коли відкриєш. Підказка: досліджуй застосунок.', 'You\'ll learn the condition when you unlock it. Hint: explore the app.') : t.l(a.desc)}</p>
      {!has && !hide && a.goal != null && <div className="stack" style={{ width: '100%', gap: 6 }}>
        <div className="bar" style={{ height: 12 }}><i style={{ width: Math.min(100, (cur / a.goal) * 100) + '%' }} /></div>
        <span className="lbl">{fmt(Math.min(cur, a.goal), s.lang, a.goal < 50 && cur % 1 ? 1 : 0)} / {fmt(a.goal, s.lang)}</span>
      </div>}
      {has && <span style={{ fontWeight: 600 }}>{t('Отримано', 'Earned')} {new Date(has).toLocaleDateString(locale(s.lang), { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
      <span className="row-c" style={{ gap: 6, fontWeight: 700 }}><Icon name="star" size={18} stroke={2.6} style={{ color: '#B97A00' }} />{t(`Нагорода: ${tier.stars} зір.`, `Reward: ${tier.stars} star${tier.stars > 1 ? 's' : ''}`)}</span>
    </div>
  );
}
