import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useAnimate } from 'motion/react';
import { act, useApp } from '../store';
import { useT, useReaction, openSheet } from '../components/ui';
import { Backdrop, Character, Plant, Plate } from '../components/art';
import { Coin, Icon } from '../components/Icon';
import { addWater, line, logSleep, lowIntakeDays, need, questsFor, setMood, stageOf, streakInfo, toggleHabit, GAME_PLAYS_PER_DAY } from '../logic/game';
import { burned, colorCount, dailyNorm, dayTotals } from '../logic/nutrition';
import { COLOR_CATS, CATS } from '../data/foods';
import { CITIES } from '../data/exercise';
import { fmt, locale, plural } from '../i18n';
import { today } from '../logic/dates';
import type { Tab } from '../App';
import { HabitEditor } from '../components/HabitEditor';
import { MOODS, MoodFace } from '../components/moods';
import MiniGame from './MiniGame';



export default function Home({ go }: { go: (t: Tab) => void }) {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  const p = s.profile;
  const n = dailyNorm(p);
  const tot = dayTotals(d);
  const st = streakInfo(s);
  const stage = stageOf(s.level);
  const nn = p.noNum;
  const hour = new Date().getHours();
  const [awake, setAwake] = useState(false);
  const asleep = (hour >= 23 || hour < 6) && !awake;
  const firstLine = useMemo(() => {
    if (asleep) return line(s, 'night');
    return d.foods.length || d.water ? line(s, 'hello') : line(s, 'empty');
  }, []);
  const [bubble, setBubble] = useState(firstLine);
  const [bubbleKey, setBubbleKey] = useState(0);
  const reaction = useReaction();
  const [scope, animate] = useAnimate();
  const charRef = useRef<HTMLDivElement>(null);

  const bounce = (big = true) => {
    if (!scope.current) return;
    animate(scope.current, { y: [0, big ? -22 : -12, 0], scaleY: [1, 1.04, 0.97, 1] }, { type: 'spring', stiffness: 500, damping: 12, duration: 0.6 });
    const ch = charRef.current?.querySelector('svg.char');
    if (ch) { ch.classList.remove('wiggle'); void (ch as any).getBBox?.(); requestAnimationFrame(() => ch.classList.add('wiggle')); }
  };
  useEffect(() => {
    if (!reaction.n) return;
    if (reaction.text) { setBubble(reaction.text); setBubbleKey(k => k + 1); }
    setAwake(true);
    bounce(true);
  }, [reaction.n]);

  useEffect(() => { setBubble(asleep ? line(s, 'night') : line(s, 'hello')); setBubbleKey(k => k + 1); }, [s.lang]);
  const tap = () => { setAwake(true); setBubble(line(s, 'tap')); setBubbleKey(k => k + 1); bounce(false); };
  const pct = (v: number) => Math.max(0, Math.min(100, v * 100)) + '%';
  const cc = colorCount(d);
  const nextCity = CITIES.find(c => c.km > s.km) || CITIES[CITIES.length - 1];
  const quests = questsFor(s);
  const greet = hour < 5 ? t('Доброї ночі', 'Good night') : hour < 12 ? t('Доброго ранку', 'Good morning') : hour < 18 ? t('Доброго дня', 'Good afternoon') : t('Доброго вечора', 'Good evening');
  const low = lowIntakeDays(s) >= 3;
  const plays = Math.max(0, GAME_PLAYS_PER_DAY - d.gamePlays);

  const sleepSheet = () => openSheet(close => <SleepForm close={close} />);
  const addHabit = () => openSheet(close => <HabitEditor close={close} />);
  const game = () => openSheet(close => <MiniGame close={close} />);

  return (
    <main className="screen">
      <div className="pad row-c" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div className="stack" style={{ gap: 2, minWidth: 0 }}>
          <span className="lbl" style={{ textTransform: 'none' }}>{new Date().toLocaleDateString(locale(s.lang), { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, c => c.toUpperCase())}</span>
          <span className="disp" style={{ fontWeight: 700, fontSize: 21 }}>{p.uname ? `${greet}, ${p.uname}` : greet}</span>
        </div>
        <div className="row-c" style={{ gap: 8 }}>
          <button className="row-c press" onClick={() => go('ward')} style={{ gap: 6, background: 'var(--ink)', color: 'var(--bg)', borderRadius: 999, padding: '7px 12px 7px 8px', fontWeight: 700, fontSize: 14, minHeight: 40 }} aria-label={t(`${s.coins} монет, відкрити гардероб`, `${s.coins} coins, open wardrobe`)}><Coin />{fmt(s.coins, s.lang)}</button>
          <button className="press" onClick={() => go('profile')} aria-label={t('Профіль, досягнення і налаштування', 'Profile, achievements and settings')} style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface)', boxShadow: 'inset 0 0 0 2px var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={23} /></button>
        </div>
      </div>

      <section style={{ position: 'relative', height: 304 }} aria-label={t('Персонаж', 'Companion')}>
        <Backdrop id={s.eq.bg} style={{ position: 'absolute', left: -44, top: 52, width: 290, height: 290 }} />
        <motion.div ref={scope} style={{ position: 'absolute', left: -4, top: 34, width: 250, transformOrigin: '50% 100%' }}>
          <button ref={charRef as any} onClick={tap} aria-label={t(`Погладити ${p.cname}`, `Pet ${p.cname}`)} style={{ display: 'block', width: '100%', touchAction: 'manipulation' }}>
            <Character char={p.char} eq={s.eq} stage={stage.index} asleep={asleep} label={p.cname} />
          </button>
        </motion.div>
        <motion.p key={bubbleKey} aria-live="polite" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          style={{ position: 'absolute', right: 16, top: 12, width: 176, background: 'var(--card)', borderRadius: '22px 22px 22px 6px', padding: '13px 14px', boxShadow: '0 2px 0 var(--shadow)', fontSize: 14, lineHeight: 1.38, fontWeight: 500, transformOrigin: '0 100%' }}>
          {bubble}
        </motion.p>
        <button onClick={() => go('profile')} className="stack" style={{ position: 'absolute', right: 12, top: 170, width: 150, gap: 6, textAlign: 'left' }} aria-label={t(`Рівень ${s.level}. Відкрити профіль`, `Level ${s.level}. Open profile`)}>
          <div className="row-c" style={{ gap: 8, alignItems: 'baseline' }}>
            <span className="disp" style={{ fontWeight: 800, fontSize: 40, lineHeight: 1, letterSpacing: -1 }}>{s.level}</span>
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{t('рівень', 'level')}<br /><span className="muted" style={{ fontSize: 12.5 }}>{t.l(stage.name)}</span></span>
          </div>
          <div className="bar" style={{ height: 12 }}><i style={{ width: pct(s.xp / need(s.level)) }} /></div>
          <span className="lbl" style={{ fontSize: 12 }}>{s.xp} {t('із', 'of')} {need(s.level)} {t('досвіду', 'XP')}</span>
          {st.streak > 0 && <span className="row-c" style={{ gap: 4, fontSize: 12.5, fontWeight: 700, color: 'var(--tomato)' }}><Icon name="flame" size={16} stroke={2.4} />{st.streak} {plural(s.lang, st.streak, ['день', 'дні', 'днів'], ['day', 'days'])} {t('поспіль', 'streak')}</span>}
        </button>
      </section>

      <motion.button layoutId="plate-card" className="press" onClick={() => go('food')} aria-label={t('Відкрити записи їжі', 'Open food log')}
        style={{ position: 'relative', margin: '4px 14px 0', width: 'calc(100% - 28px)', background: 'var(--peach)', borderRadius: 30, minHeight: 182, padding: 20, textAlign: 'left', display: 'block' }}>
        <motion.div layoutId="plate" style={{ position: 'absolute', right: -4, top: -30 }}><Plate foods={d.foods} size={152} /></motion.div>
        <div className="stack" style={{ gap: 4, maxWidth: 'calc(100% - 140px)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--peachInk)' }}>{t('Тарілка дня', 'Plate of the day')}{cc ? t(`, кольорів ${cc} із 5`, `, ${cc} of 5 colours`) : ''}</span>
          {nn ? (
            <div className="row-c" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {COLOR_CATS.map(c => <span key={c} style={{ fontSize: 12, fontWeight: 700, padding: '5px 9px', borderRadius: 999, background: 'rgba(59,30,63,.1)', opacity: tot.cats.has(c) ? 1 : 0.45 }}>{tot.cats.has(c) ? '✓ ' : ''}{CATS[c][s.lang]}</span>)}
            </div>
          ) : <>
            <span className="disp" style={{ fontWeight: 700, fontSize: 26, letterSpacing: -0.5, lineHeight: 1.05 }}>{fmt(tot.kcal, s.lang)}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--peachInk)' }}>{t('із', 'of')} {fmt(n.target, s.lang)} {t('ккал', 'kcal')}</span>
          </>}
        </div>
        {!nn && <div className="grid3" style={{ marginTop: 22, gap: 12 }}>
          {([[t('Білки', 'Protein'), tot.p, n.prot], [t('Жири', 'Fat'), tot.f, n.fat], [t('Вуглеводи', 'Carbs'), tot.c, n.carb]] as const).map(([l, v, m]) => (
            <div key={l} className="stack" style={{ gap: 3 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--peachInk)' }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(v, s.lang)}/{m} {t('г', 'g')}</span>
              <div className="bar" style={{ height: 8 }}><i style={{ width: pct(v / m), background: 'var(--ink)' }} /></div>
            </div>
          ))}
        </div>}
        {!d.foods.length && nn && <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600, maxWidth: 190 }}>{t('Тарілка поки порожня. Додай першу страву.', 'The plate is empty. Add your first dish.')}</p>}
      </motion.button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 10, margin: '10px 14px 0' }}>
        <div style={{ position: 'relative', borderRadius: 26, minHeight: 164, overflow: 'hidden', padding: 16, background: 'var(--oliveLight)' }}>
          <Plant water={d.water} goal={p.waterGoal} style={{ position: 'absolute', right: 2, bottom: 0, width: 96, height: 136 }} />
          <div className="stack" style={{ gap: 2, position: 'relative' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--olive)' }}>{t('Вода', 'Water')}</span>
            <span className="disp" style={{ fontWeight: 700, fontSize: 22 }}>{d.water} {t('із', 'of')} {p.waterGoal}</span>
          </div>
          <div className="row-c" style={{ position: 'absolute', left: 14, bottom: 14, gap: 6 }}>
            <button className="press" onClick={() => act(x => addWater(x, 1))} aria-label={t('Додати склянку води', 'Add a glass of water')} style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--olive)', color: '#FFF8EA', boxShadow: '0 4px 0 var(--oliveDeep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={26} stroke={3.2} /></button>
            {d.water > 0 && <button className="press" onClick={() => act(x => addWater(x, -1))} aria-label={t('Прибрати склянку', 'Remove a glass')} style={{ width: 44, height: 44, borderRadius: '50%', boxShadow: 'inset 0 0 0 2px var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={20} stroke={2.6} /></button>}
          </div>
        </div>
        <button className="press stack" onClick={() => go('move')} aria-label={t('Відкрити рух', 'Open movement')} style={{ borderRadius: 26, minHeight: 164, padding: 16, background: 'var(--mustard)', color: '#3B1E3F', justifyContent: 'space-between', textAlign: 'left' }}>
          <div className="stack" style={{ gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#6A4300' }}>{t('Рух сьогодні', 'Moving today')}</span>
            <span className="disp" style={{ fontWeight: 700, fontSize: 22 }}>{fmt(d.steps, s.lang)}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#6A4300' }}>{plural(s.lang, d.steps, ['крок', 'кроки', 'кроків'], ['step', 'steps'])}{d.workouts.length ? `, ${d.workouts.length} ${plural(s.lang, d.workouts.length, ['тренування', 'тренування', 'тренувань'], ['workout', 'workouts'])}` : ''}{d.rest ? t(', відпочинок', ', rest day') : ''}</span>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{!nn && burned(d, p.weight) > 0 ? t(`≈${fmt(burned(d, p.weight), 'uk')} ккал спалено. `, `≈${fmt(burned(d, p.weight), 'en')} kcal burned. `) : ''}{t(`До міста ${nextCity.name.uk} ${fmt(Math.max(0, nextCity.km - s.km), 'uk', 1)} км`, `${fmt(Math.max(0, nextCity.km - s.km), 'en', 1)} km to ${nextCity.name.en}`)}</span>
        </button>
      </div>

      {low && <section className="pad" style={{ marginTop: 14 }}><div className="card" style={{ padding: 16, fontSize: 14, lineHeight: 1.5, boxShadow: 'inset 0 0 0 1.5px var(--line)' }}>
        <b style={{ display: 'block', marginBottom: 4 }}>{t(`${p.cname} хоче сказати важливе`, `${p.cname} wants to say something`)}</b>
        {t('Останні дні виходить помітно менше за твою норму. Тілу потрібна енергія, щоб відновлюватися. Якщо їсти стало важко чи тривожно, поговори з кимось, кому довіряєш, або з лікарем.', 'The last few days have been well below your target. Your body needs energy to recover. If eating has started to feel hard or stressful, talk to someone you trust or a doctor.')}
      </div></section>}

      <section className="pad stack" style={{ marginTop: 26, gap: 10 }} aria-label={t('Завдання на сьогодні', 'Today\'s quests')}>
        <div className="row-c" style={{ justifyContent: 'space-between' }}>
          <h2 className="sectionT">{t('Завдання на сьогодні', 'Today\'s quests')}</h2>
          <span className="lbl">{quests.filter(q => d.quests[q.id]).length}/3</span>
        </div>
        {quests.map(q => { const done = !!d.quests[q.id]; return (
          <div key={q.id} className="row-c card" style={{ gap: 12, minHeight: 58, padding: '0 16px' }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--olive)' : 'transparent', boxShadow: done ? 'none' : 'inset 0 0 0 2.5px var(--ink2)', color: '#FFF8EA' }}>{done && <Icon name="check" size={18} stroke={3} />}</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 15, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}>{t.l(q.t)}</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--tomato)' }}>+20</span>
          </div>); })}
      </section>

      <section className="pad stack" style={{ marginTop: 26, gap: 10 }}>
        <h2 className="sectionT">{t('Самопочуття', 'Wellbeing')}</h2>
        <button className="row press" onClick={sleepSheet} style={{ minHeight: 66 }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--ink)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="moon" size={24} /></span>
          <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{t('Сон', 'Sleep')}</span>
            <span className="muted" style={{ fontSize: 13 }}>{d.sleep ? `${d.sleep.bed}–${d.sleep.wake}, ${fmt(d.sleep.hours, s.lang, 1)} ${t('год', 'h')}` : t('Як спалося минулої ночі?', 'How did you sleep last night?')}</span></span>
          <Icon name={d.sleep ? 'edit' : 'plus'} size={22} style={{ color: 'var(--ink2)' }} />
        </button>
        <div className="card stack" style={{ padding: 14, gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t('Як настрій?', 'How are you feeling?')}</span>
          <div className="grid2" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            {MOODS.map(m => <button key={m.v} className="press stack" onClick={() => act(x => setMood(x, m.v))} aria-pressed={d.mood === m.v}
              style={{ minHeight: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, background: d.mood === m.v ? 'var(--mustard)' : 'var(--bg)', color: d.mood === m.v ? '#3B1E3F' : 'var(--ink2)' }}>
              <MoodFace path={m.path} />{t(m.uk, m.en)}</button>)}
          </div>
        </div>
        <div className="card stack" style={{ padding: '14px 14px 8px', gap: 4 }}>
          <div className="row-c" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{t('Мої звички', 'My habits')}</span>
            <button className="chip press" onClick={addHabit} style={{ minHeight: 36, background: 'var(--bg)' }}><Icon name="plus" size={16} stroke={2.6} />{t('Додати', 'Add')}</button>
          </div>
          {s.habits.length === 0 && <p className="muted" style={{ fontSize: 13.5, padding: '8px 0 10px' }}>{t('Додай звичку: вітаміни, читання, медитація — що завгодно.', 'Add a habit: vitamins, reading, meditation — anything.')}</p>}
          {s.habits.map(h => { const on = !!d.habits[h.id]; return (
            <button key={h.id} className="row-c press" role="checkbox" aria-checked={on} onClick={() => act(x => toggleHabit(x, h.id))} style={{ gap: 12, minHeight: 52, textAlign: 'left' }}>
              <span style={{ width: 36, height: 36, borderRadius: 12, background: on ? 'var(--olive)' : 'var(--bg)', color: on ? '#FFF8EA' : 'var(--ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .3s' }}><Icon name={on ? 'check' : h.icon} size={20} stroke={on ? 3 : 2.2} /></span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{h.name}</span>
            </button>); })}
        </div>
      </section>

      <section className="pad" style={{ marginTop: 26 }}>
        <button className="press row-c" onClick={game} style={{ width: '100%', gap: 14, padding: 16, borderRadius: 26, background: 'var(--ink)', color: 'var(--bg)', textAlign: 'left' }}>
          <span style={{ width: 52, height: 52, borderRadius: 18, background: 'var(--tomato)', color: '#FFF1D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="game" size={28} /></span>
          <span style={{ flex: 1 }}><span className="disp" style={{ display: 'block', fontWeight: 700, fontSize: 16 }}>{t('Лови овочі', 'Catch the veggies')}</span>
            <span style={{ fontSize: 13, opacity: 0.8 }}>{plays ? t(`30 секунд, ще ${plays} ${plural('uk', plays, ['гра', 'гри', 'ігор'], ['', ''])} з монетами сьогодні`, `30 seconds, ${plays} rewarded ${plays === 1 ? 'game' : 'games'} left today`) : t('Монети на сьогодні зібрано, але грати можна', 'Coins collected for today, but you can still play')}{s.gameBest ? t(`. Рекорд: ${s.gameBest}`, `. Best: ${s.gameBest}`) : ''}</span></span>
        </button>
      </section>

      <p className="pad muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 22 }}>{t('Fatscore не є медичною порадою. Дані зберігаються лише на цьому пристрої.', 'Fatscore is not medical advice. Data stays on this device only.')}</p>
    </main>
  );
}

function SleepForm({ close }: { close: () => void }) {
  const s = useApp();
  const t = useT();
  const cur = s.days[today()].sleep;
  const [bed, setBed] = useState(cur?.bed || '23:00');
  const [wake, setWake] = useState(cur?.wake || '07:00');
  const [q, setQ] = useState<1 | 2 | 3>(cur?.quality || 2);
  return (
    <div className="stack" style={{ gap: 14 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Як спалося?', 'How did you sleep?')}</h2>
      <div className="grid2">
        <label className="stack" style={{ gap: 6 }}><span className="lbl">{t('Ліг спати', 'Went to bed')}</span><input className="field" type="time" value={bed} onChange={e => setBed(e.target.value)} /></label>
        <label className="stack" style={{ gap: 6 }}><span className="lbl">{t('Прокинувся', 'Woke up')}</span><input className="field" type="time" value={wake} onChange={e => setWake(e.target.value)} /></label>
      </div>
      <span className="lbl">{t('Якість сну', 'Sleep quality')}</span>
      <div className="seg">{([[1, 'Погано', 'Poor'], [2, 'Нормально', 'Okay'], [3, 'Чудово', 'Great']] as const).map(([v, uk, en]) => <button key={v} className={q === v ? 'on' : ''} onClick={() => setQ(v)}>{t(uk, en)}</button>)}</div>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{t('Дорослим зазвичай потрібно 7–9 годин сну. Автоматичний запис з телефона чи годинника з\'явиться в мобільній версії.', 'Adults usually need 7–9 hours of sleep. Automatic tracking from your phone or watch will come in the mobile app.')}</p>
      <button className="btn block press" onClick={() => { act(x => logSleep(x, bed, wake, q)); close(); }}>{t('Зберегти', 'Save')}</button>
    </div>
  );
}
