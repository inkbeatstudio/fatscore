import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, useAnimate } from 'motion/react';
import { act, useApp } from '../store';
import { useT, useReaction, openSheet } from '../components/ui';
import { Backdrop, Character, Plant, Plate } from '../components/art';
import { Coin, Icon } from '../components/Icon';
import { addWater, dismissNudge, nudgeFor, ALL_WIDGETS, HALF_WIDGETS, line, logSleep, logWeight, lowIntakeDays, needHero, questsFor, setMood, stageOf, streakInfo, toggleHabit, weekDays, weeklyFor, GAME_PLAYS_PER_DAY } from '../logic/game';
import { burned, colorCount, dailyNorm, dayTotals } from '../logic/nutrition';
import { COLOR_CATS, CATS } from '../data/foods';
import { CITIES } from '../data/exercise';
import { seasonOf, SEASON_TIER_PTS, SEASON_TIERS } from '../data/seasons';
import { fmt, locale, plural } from '../i18n';
import { today, weekKey } from '../logic/dates';
import { go } from '../nav';
import { HabitEditor } from '../components/HabitEditor';
import { MOODS, MoodFace } from '../components/moods';
import type { WidgetId } from '../types';
import MiniGame from './MiniGame';

const WIDGET_INFO: Record<WidgetId, { icon: string; uk: string; en: string; dUk: string; dEn: string }> = {
  hero: { icon: 'heart', uk: 'Герой', en: 'Hero', dUk: 'Твій герой, його рівень і репліки', dEn: 'Your hero, level and lines' },
  plate: { icon: 'plate', uk: 'Тарілка дня', en: 'Plate of the day', dUk: 'Їжа, калорії та БЖВ або кольори', dEn: 'Food, calories & macros or colours' },
  water: { icon: 'drop', uk: 'Вода', en: 'Water', dUk: 'М\'ята росте від кожної склянки', dEn: 'The mint grows with every glass' },
  move: { icon: 'move', uk: 'Рух', en: 'Movement', dUk: 'Кроки, тренування, спалене', dEn: 'Steps, workouts, burned' },
  quests: { icon: 'check', uk: 'Денні завдання', en: 'Daily quests', dUk: '3 завдання на сьогодні', dEn: '3 quests for today' },
  weekly: { icon: 'star', uk: 'Тижневі завдання', en: 'Weekly quests', dUk: 'Більші цілі на тиждень, нагорода — зірки', dEn: 'Bigger goals for the week, rewards: stars' },
  season: { icon: 'leaf', uk: 'Сезон', en: 'Season', dUk: 'Сезонний шлях і нагороди', dEn: 'Season path and rewards' },
  streak: { icon: 'flame', uk: 'Серія', en: 'Streak', dUk: 'Дні поспіль і дні запасу', dEn: 'Days in a row and reserve days' },
  sleep: { icon: 'moon', uk: 'Сон', en: 'Sleep', dUk: 'Як спалось минулої ночі', dEn: 'How you slept last night' },
  mood: { icon: 'heart', uk: 'Настрій', en: 'Mood', dUk: 'Один дотик на день', dEn: 'One tap a day' },
  habits: { icon: 'leaf', uk: 'Звички', en: 'Habits', dUk: 'Твої власні щоденні звички', dEn: 'Your own daily habits' },
  diary: { icon: 'book', uk: 'Щоденник', en: 'Diary', dUk: 'Кілька слів про день', dEn: 'A few words about your day' },
  journey: { icon: 'map', uk: 'Подорож', en: 'Journey', dUk: 'Скільки до наступного міста', dEn: 'Distance to the next city' },
  weight: { icon: 'scale', uk: 'Вага', en: 'Weight', dUk: 'Остання вага і швидкий запис', dEn: 'Last weight and quick log' },
  game: { icon: 'game', uk: 'Міні-гра', en: 'Mini-game', dUk: '«Лови овочі» за монети', dEn: '«Catch the veggies» for coins' }
};

export default function Home() {
  const s = useApp();
  const t = useT();
  const [edit, setEdit] = useState(false);
  const hour = new Date().getHours();
  const greet = hour < 5 ? t('Доброї ночі', 'Good night') : hour < 12 ? t('Доброго ранку', 'Good morning') : hour < 18 ? t('Доброго дня', 'Good afternoon') : t('Доброго вечора', 'Good evening');
  const list = s.home.filter(w => w !== 'weight' || !s.profile.noNum);

  const move = (i: number, d: -1 | 1) => act(x => { const a = [...x.home]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; x.home = a; });
  const remove = (id: WidgetId) => act(x => { x.home = x.home.filter(w => w !== id); });
  const addSheet = () => openSheet(close => <AddWidget close={close} />);

  return (
    <main className="screen">
      <div className="pad row-c" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div className="stack" style={{ gap: 2, minWidth: 0 }}>
          <span className="lbl">{new Date().toLocaleDateString(locale(s.lang), { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, c => c.toUpperCase())}</span>
          <span className="disp" style={{ fontWeight: 700, fontSize: 21 }}>{s.profile.uname ? `${greet}, ${s.profile.uname}` : greet}</span>
        </div>
        <div className="row-c" style={{ gap: 6 }}>
          <button className="row-c press" onClick={() => go('heroes')} style={{ gap: 5, background: 'var(--ink)', color: 'var(--bg)', borderRadius: 999, padding: '7px 11px 7px 8px', fontWeight: 700, fontSize: 14, minHeight: 40 }} aria-label={t(`${s.coins} монет і ${s.stars} зірок`, `${s.coins} coins and ${s.stars} stars`)}>
            <Coin />{fmt(s.coins, s.lang)}<span style={{ width: 6 }} /><Icon name="star" size={18} stroke={2.6} style={{ color: 'var(--mustard)' }} />{s.stars}
          </button>
          <button className="press" onClick={() => go('profile')} aria-label={t('Профіль і налаштування', 'Profile and settings')} style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface)', boxShadow: 'inset 0 0 0 2px var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={23} /></button>
        </div>
      </div>

      {lowIntakeDays(s) >= 3 && <section className="pad" style={{ marginTop: 12 }}><div className="card" style={{ padding: 16, fontSize: 14, lineHeight: 1.5, boxShadow: 'inset 0 0 0 1.5px var(--line)' }}>
        <b style={{ display: 'block', marginBottom: 4 }}>{t(`${s.profile.cname} хоче сказати важливе`, `${s.profile.cname} wants to say something`)}</b>
        {t('Останні дні виходить помітно менше за твою норму. Тілу потрібна енергія, щоб відновлюватися. Якщо їсти стало важко чи тривожно, поговори з кимось, кому довіряєш, або з лікарем.', 'The last few days have been well below your target. Your body needs energy to recover. If eating has started to feel hard or stressful, talk to someone you trust or a doctor.')}
      </div></section>}

      <NudgeCard />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10, padding: '0 14px', marginTop: 6 }}>
        {list.map((id, i) => {
          const half = HALF_WIDGETS.includes(id);
          return (
            <motion.div key={id} layout transition={{ type: 'spring', stiffness: 420, damping: 36 }} style={{ gridColumn: half ? 'span 1' : 'span 2', position: 'relative', minWidth: 0 }}>
              {edit && (
                <div className="row-c" style={{ gap: 4, marginBottom: 6, justifyContent: 'space-between', background: 'var(--ink)', color: 'var(--bg)', borderRadius: 14, padding: '4px 6px 4px 12px' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{t(WIDGET_INFO[id].uk, WIDGET_INFO[id].en)}</span>
                  <span className="row-c" style={{ gap: 2 }}>
                    <button className="icon-btn" style={{ color: 'inherit', width: 36, height: 36 }} disabled={i === 0} onClick={() => move(i, -1)} aria-label={t('Вище', 'Move up')}><Icon name="back" size={18} style={{ transform: 'rotate(90deg)' }} /></button>
                    <button className="icon-btn" style={{ color: 'inherit', width: 36, height: 36 }} disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label={t('Нижче', 'Move down')}><Icon name="back" size={18} style={{ transform: 'rotate(-90deg)' }} /></button>
                    <button className="icon-btn" style={{ color: 'inherit', width: 36, height: 36 }} onClick={() => remove(id)} aria-label={t('Прибрати', 'Remove')}><Icon name="close" size={18} /></button>
                  </span>
                </div>
              )}
              <div style={{ pointerEvents: edit ? 'none' : undefined, opacity: edit ? 0.85 : 1 }}><Widget id={id} /></div>
            </motion.div>
          );
        })}
      </div>

      <div className="pad stack" style={{ marginTop: 22, gap: 10 }}>
        {edit && <button className="btn olive block press" onClick={addSheet}><Icon name="plus" size={20} />{t('Додати віджет', 'Add a widget')}</button>}
        <button className={'btn block press ' + (edit ? '' : 'ghost')} onClick={() => setEdit(!edit)}><Icon name={edit ? 'check' : 'edit'} size={20} />{edit ? t('Готово', 'Done') : t('Налаштувати головну', 'Customise home')}</button>
        <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 6 }}>{t('Fatscore не є медичною порадою. Дані зберігаються лише на цьому пристрої.', 'Fatscore is not medical advice. Data stays on this device only.')}</p>
      </div>
    </main>
  );
}

function AddWidget({ close }: { close: () => void }) {
  const s = useApp();
  const t = useT();
  const free = ALL_WIDGETS.filter(w => !s.home.includes(w) && !(w === 'weight' && s.profile.noNum));
  return (
    <div className="stack" style={{ gap: 10 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Додати віджет', 'Add a widget')}</h2>
      {free.length === 0 && <div className="empty">{t('Усі віджети вже на головній.', 'All widgets are already on your home.')}</div>}
      {free.map(w => (
        <button key={w} className="opt press" onClick={() => { act(x => { x.home = [...x.home, w]; }); close(); }}>
          <span className="ic" style={{ background: 'var(--surface)', boxShadow: 'inset 0 0 0 2px var(--line)' }}><Icon name={WIDGET_INFO[w].icon} size={22} /></span>
          <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700 }}>{t(WIDGET_INFO[w].uk, WIDGET_INFO[w].en)}</span><span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{t(WIDGET_INFO[w].dUk, WIDGET_INFO[w].dEn)}</span></span>
          <Icon name="plus" size={20} />
        </button>
      ))}
    </div>
  );
}

const Card = ({ children, onClick, style, className = '', label }: { children: ReactNode; onClick?: () => void; style?: React.CSSProperties; className?: string; label?: string }) =>
  onClick ? <button className={'press ' + className} onClick={onClick} aria-label={label} style={{ display: 'block', width: '100%', textAlign: 'left', borderRadius: 26, padding: 16, background: 'var(--surface)', ...style }}>{children}</button>
    : <div className={className} style={{ borderRadius: 26, padding: 16, background: 'var(--surface)', ...style }}>{children}</div>;
const Title = ({ children, right }: { children: ReactNode; right?: ReactNode }) => <div className="row-c" style={{ justifyContent: 'space-between', marginBottom: 10, gap: 8 }}><h2 className="sectionT" style={{ fontSize: 16 }}>{children}</h2>{right}</div>;

function Widget({ id }: { id: WidgetId }) {
  switch (id) {
    case 'hero': return <HeroW />;
    case 'plate': return <PlateW />;
    case 'water': return <WaterW />;
    case 'move': return <MoveW />;
    case 'quests': return <QuestsW />;
    case 'weekly': return <WeeklyW />;
    case 'season': return <SeasonW />;
    case 'streak': return <StreakW />;
    case 'sleep': return <SleepW />;
    case 'mood': return <MoodW />;
    case 'habits': return <HabitsW />;
    case 'diary': return <DiaryW />;
    case 'journey': return <JourneyW />;
    case 'weight': return <WeightW />;
    case 'game': return <GameW />;
  }
}

function HeroW() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  const h = s.chars[s.profile.char];
  const stage = stageOf(h.lv);
  const hour = new Date().getHours();
  const [awake, setAwake] = useState(false);
  const asleep = (hour >= 23 || hour < 6) && !awake;
  const first = useMemo(() => (asleep ? line(s, 'night') : d.foods.length || d.water ? line(s, 'hello') : line(s, 'empty')), []);
  const [bubble, setBubble] = useState(first);
  const [bk, setBk] = useState(0);
  const reaction = useReaction();
  const [scope, animate] = useAnimate();
  const charRef = useRef<HTMLButtonElement>(null);
  const bounce = (big: boolean) => {
    if (!scope.current) return;
    animate(scope.current, { y: [0, big ? -22 : -12, 0], scaleY: [1, 1.04, 0.97, 1] }, { type: 'spring', stiffness: 500, damping: 12, duration: 0.6 });
    const ch = charRef.current?.querySelector('svg.char');
    if (ch) { ch.classList.remove('wiggle'); requestAnimationFrame(() => ch.classList.add('wiggle')); }
  };
  useEffect(() => { if (!reaction.n) return; if (reaction.text) { setBubble(reaction.text); setBk(k => k + 1); } setAwake(true); bounce(true); }, [reaction.n]);
  useEffect(() => { setBubble(line(s, 'hello')); setBk(k => k + 1); }, [s.lang, s.profile.char]);
  const st = streakInfo(s);
  return (
    <section style={{ position: 'relative', height: 300, margin: '0 -14px' }} aria-label={t('Герой', 'Hero')}>
      <Backdrop id={s.eq.bg} style={{ position: 'absolute', left: -44, top: 50, width: 290, height: 290 }} />
      <motion.div ref={scope} style={{ position: 'absolute', left: -4, top: 32, width: 250, transformOrigin: '50% 100%' }}>
        <button ref={charRef} onClick={() => { setAwake(true); setBubble(line(s, 'tap')); setBk(k => k + 1); bounce(false); }} aria-label={t(`Погладити ${s.profile.cname}`, `Pet ${s.profile.cname}`)} style={{ display: 'block', width: '100%', touchAction: 'manipulation' }}>
          <Character char={s.profile.char} eq={s.eq} stage={stage.index} asleep={asleep} label={s.profile.cname} />
        </button>
      </motion.div>
      <motion.p key={bk} className="bubble" aria-live="polite" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        style={{ position: 'absolute', right: 16, top: 8, width: 176, background: 'var(--card)', borderRadius: '22px 22px 22px 6px', padding: '13px 14px', boxShadow: '0 2px 0 var(--shadow)', fontSize: 14, lineHeight: 1.38, fontWeight: 500, transformOrigin: '0 100%' }}>{bubble}</motion.p>
      <button onClick={() => go('heroes')} className="stack lvl-box" style={{ position: 'absolute', right: 12, top: 166, width: 150, gap: 6, textAlign: 'left' }} aria-label={t(`${s.profile.cname}, рівень ${h.lv}. Відкрити героїв`, `${s.profile.cname}, level ${h.lv}. Open heroes`)}>
        <div className="row-c" style={{ gap: 8, alignItems: 'baseline' }}>
          <span className="disp lvl-num" style={{ fontWeight: 800, fontSize: 40, lineHeight: 1, letterSpacing: -1 }}>{h.lv}</span>
          <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{s.profile.cname}<br /><span className="muted" style={{ fontSize: 12.5 }}>{t.l(stage.name)}</span></span>
        </div>
        <div className="bar" style={{ height: 12 }}><i style={{ width: Math.min(100, (h.xp / needHero(h.lv)) * 100) + '%' }} /></div>
        <span className="lbl" style={{ fontSize: 12 }}>{h.xp} {t('із', 'of')} {needHero(h.lv)} {t('досвіду', 'XP')}</span>
        {!s.settings.calm && st.streak > 0 && <span className="row-c" style={{ gap: 4, fontSize: 12.5, fontWeight: 700, color: 'var(--tomato)' }}><Icon name="flame" size={16} stroke={2.4} />{st.streak} {plural(s.lang, st.streak, ['день', 'дні', 'днів'], ['day', 'days'])}</span>}
      </button>
    </section>
  );
}

function PlateW() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  const n = dailyNorm(s.profile), tot = dayTotals(d), cc = colorCount(d), nn = s.profile.noNum;
  const pct = (v: number) => Math.max(0, Math.min(100, v * 100)) + '%';
  return (
    <motion.button layoutId="plate-card" className="press plate-card" onClick={() => go('food')} aria-label={t('Відкрити записи їжі', 'Open food log')}
      style={{ position: 'relative', width: '100%', background: 'var(--peach)', borderRadius: 30, minHeight: 182, padding: 20, textAlign: 'left', display: 'block', marginTop: 24 }}>
      <motion.div layoutId="plate" style={{ position: 'absolute', right: -4, top: -30 }}><Plate foods={d.foods} size={152} /></motion.div>
      <div className="stack" style={{ gap: 4, maxWidth: 'calc(100% - 140px)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--peachInk)' }}>{t('Тарілка дня', 'Plate of the day')}{cc ? t(`, кольорів ${cc} із 5`, `, ${cc} of 5 colours`) : ''}</span>
        {nn ? <div className="row-c" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{COLOR_CATS.map(c => <span key={c} style={{ fontSize: 12, fontWeight: 700, padding: '5px 9px', borderRadius: 999, background: 'rgba(59,30,63,.1)', opacity: tot.cats.has(c) ? 1 : 0.45 }}>{tot.cats.has(c) ? '✓ ' : ''}{CATS[c][s.lang]}</span>)}</div>
          : <><span className="disp" style={{ fontWeight: 700, fontSize: 26, letterSpacing: -0.5, lineHeight: 1.05 }}>{fmt(tot.kcal, s.lang)}</span><span style={{ fontSize: 13, fontWeight: 500, color: 'var(--peachInk)' }}>{t('із', 'of')} {fmt(n.target, s.lang)} {t('ккал', 'kcal')}</span></>}
      </div>
      {!nn && <div className="grid3" style={{ marginTop: 22, gap: 12 }}>
        {([[t('Білки', 'Protein'), tot.p, n.prot], [t('Жири', 'Fat'), tot.f, n.fat], [t('Вуглеводи', 'Carbs'), tot.c, n.carb]] as const).map(([l, v, m]) => (
          <div key={l} className="stack" style={{ gap: 3 }}><span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--peachInk)' }}>{l}</span><span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(v, s.lang)}/{m} {t('г', 'g')}</span><div className="bar" style={{ height: 8 }}><i style={{ width: pct(v / m), background: 'var(--ink)' }} /></div></div>
        ))}
      </div>}
    </motion.button>
  );
}

function WaterW() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  return (
    <div className="water-tile" style={{ position: 'relative', borderRadius: 26, minHeight: 164, overflow: 'hidden', padding: 16, background: 'var(--oliveLight)', height: '100%' }}>
      <Plant water={d.water} goal={s.profile.waterGoal} style={{ position: 'absolute', right: -4, bottom: 0, width: 86, height: 122 }} />
      <div className="stack" style={{ gap: 2, position: 'relative' }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--olive)' }}>{t('Вода', 'Water')}</span><span className="disp" style={{ fontWeight: 700, fontSize: 22 }}>{d.water}/{s.profile.waterGoal}</span></div>
      <div className="row-c" style={{ position: 'absolute', left: 12, bottom: 12, gap: 4 }}>
        <button className="press" onClick={() => act(x => addWater(x, 1))} aria-label={t('Додати склянку води', 'Add a glass of water')} style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--olive)', color: '#FFF8EA', boxShadow: '0 4px 0 var(--oliveDeep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={26} stroke={3.2} /></button>
        {d.water > 0 && <button className="press" onClick={() => act(x => addWater(x, -1))} aria-label={t('Прибрати склянку', 'Remove a glass')} style={{ width: 40, height: 40, borderRadius: '50%', boxShadow: 'inset 0 0 0 2px var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={18} stroke={2.6} /></button>}
      </div>
    </div>
  );
}

function MoveW() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  const b = burned(d, s.profile.weight);
  return (
    <button className="press stack move-tile" onClick={() => go('move')} aria-label={t('Відкрити рух', 'Open movement')} style={{ width: '100%', height: '100%', borderRadius: 26, minHeight: 164, padding: 16, background: 'var(--mustard)', color: '#3B1E3F', justifyContent: 'space-between', textAlign: 'left' }}>
      <div className="stack" style={{ gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#6A4300' }}>{t('Рух', 'Movement')}</span>
        <span className="disp" style={{ fontWeight: 700, fontSize: 22 }}>{fmt(d.steps, s.lang)}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#6A4300' }}>{plural(s.lang, d.steps, ['крок', 'кроки', 'кроків'], ['step', 'steps'])}</span>
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{d.workouts.length ? `${d.workouts.length} ${plural(s.lang, d.workouts.length, ['тренування', 'тренування', 'тренувань'], ['workout', 'workouts'])}` : d.rest ? t('День відпочинку', 'Rest day') : t('Тренування ще немає', 'No workout yet')}{!s.profile.noNum && b > 0 ? `, ≈${fmt(b, s.lang)} ${t('ккал', 'kcal')}` : ''}</span>
    </button>
  );
}

function QuestsW() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  const qs = questsFor(s);
  return (
    <Card>
      <Title right={<button className="lbl press" onClick={() => go('adventure')} style={{ minHeight: 32 }}>{qs.filter(q => d.quests[q.id]).length}/3 · {t('усі', 'all')}</button>}>{t('Завдання на сьогодні', 'Today\'s quests')}</Title>
      <div className="stack" style={{ gap: 6 }}>
        {qs.map(q => { const done = !!d.quests[q.id]; return (
          <div key={q.id} className="row-c quest" style={{ gap: 12, minHeight: 44 }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--olive)' : 'transparent', boxShadow: done ? 'none' : 'inset 0 0 0 2.5px var(--ink2)', color: '#FFF8EA' }}>{done && <Icon name="check" size={16} stroke={3} />}</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14.5, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}>{t.l(q.t)}</span>
            <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--tomato)' }}>+20</span>
          </div>); })}
      </div>
    </Card>
  );
}

export function WeeklyList({ compact }: { compact?: boolean }) {
  const s = useApp();
  const t = useT();
  const wd = weekDays(s);
  const qs = weeklyFor(s);
  const done = s.weekly[weekKey(today())] || {};
  return (
    <div className="stack" style={{ gap: compact ? 10 : 12 }}>
      {qs.map(q => {
        const v = Math.min(q.goal, q.val(wd, s)), ok = !!done[q.id] || v >= q.goal;
        return (
          <div key={q.id} className="stack" style={{ gap: 5 }}>
            <div className="row-c" style={{ justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14.5, opacity: ok ? 0.6 : 1 }}>{ok && '✓ '}{t.l(q.t)}</span>
              <span className="lbl" style={{ whiteSpace: 'nowrap' }}>{q.goal >= 1000 ? `${fmt(v / 1000, s.lang, 1)}k/${q.goal / 1000}k` : `${v}/${q.goal}`}</span>
            </div>
            <div className="bar" style={{ height: 8 }}><i style={{ width: (v / q.goal) * 100 + '%', background: ok ? 'var(--olive)' : 'var(--mustard)' }} /></div>
          </div>
        );
      })}
    </div>
  );
}
function WeeklyW() {
  const t = useT();
  const dayIdx = (new Date().getDay() + 6) % 7;
  return <Card><Title right={<span className="lbl">{t(`ще ${7 - dayIdx} дн.`, `${7 - dayIdx} days left`)}</span>}>{t('Тижневі завдання', 'Weekly quests')}</Title><WeeklyList compact /><p className="muted" style={{ fontSize: 12, marginTop: 10 }}>{t('Кожне: +60 досвіду, +50 монет, +1 зірка. Оновлюються в понеділок.', 'Each: +60 XP, +50 coins, +1 star. Reset on Monday.')}</p></Card>;
}

function SeasonW() {
  const s = useApp();
  const t = useT();
  const se = seasonOf();
  const st = s.season[se.key] || { pts: 0, tier: 0 };
  const inTier = st.tier >= SEASON_TIERS ? SEASON_TIER_PTS : st.pts % SEASON_TIER_PTS;
  return (
    <Card onClick={() => go('adventure')} label={t('Відкрити сезон', 'Open season')} style={{ background: `linear-gradient(135deg, ${se.def.colors[0]}, ${se.def.colors[1]})`, color: '#2A1630' }}>
      <div className="row-c" style={{ justifyContent: 'space-between', gap: 10 }}>
        <div className="stack" style={{ gap: 2 }}><span style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.75 }}>{t('Сезон', 'Season')} · {t(`ще ${se.daysLeft} дн.`, `${se.daysLeft} days left`)}</span><span className="disp" style={{ fontWeight: 800, fontSize: 19 }}>{t.l(se.def.name)}</span></div>
        <span className="disp" style={{ fontWeight: 800, fontSize: 30 }}>{st.tier}<span style={{ fontSize: 14, opacity: 0.7 }}>/{SEASON_TIERS}</span></span>
      </div>
      <div className="bar" style={{ height: 10, marginTop: 12, background: 'rgba(42,22,48,.15)' }}><i style={{ width: (inTier / SEASON_TIER_PTS) * 100 + '%', background: '#2A1630' }} /></div>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginTop: 6, opacity: 0.8 }}>{st.tier >= SEASON_TIERS ? t('Сезон пройдено!', 'Season complete!') : t(`${inTier}/${SEASON_TIER_PTS} очок до рівня ${st.tier + 1}`, `${inTier}/${SEASON_TIER_PTS} points to tier ${st.tier + 1}`)}</span>
    </Card>
  );
}

function StreakW() {
  const s = useApp();
  const t = useT();
  const st = streakInfo(s);
  return (
    <Card style={{ height: '100%', minHeight: 140 }}>
      <span style={{ color: 'var(--tomato)', display: 'flex' }}><Icon name={s.settings.calm ? 'leaf' : 'flame'} size={28} stroke={2.4} /></span>
      {s.settings.calm ? <><span className="disp" style={{ display: 'block', fontWeight: 800, fontSize: 26, marginTop: 6 }}>{st.weekActive}/7</span><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{t('активних днів тижня', 'active days this week')}</span></>
        : <><span className="disp" style={{ display: 'block', fontWeight: 800, fontSize: 26, marginTop: 6 }}>{st.streak}</span><span className="muted" style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, display: 'block' }}>{plural(s.lang, st.streak, ['день поспіль', 'дні поспіль', 'днів поспіль'], ['day streak', 'day streak'])}<br />{t(`запас: ${st.reserveLeft}`, `reserve: ${st.reserveLeft}`)}</span></>}
    </Card>
  );
}

function SleepW() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  return (
    <Card onClick={() => openSheet(close => <SleepForm close={close} />)} label={t('Записати сон', 'Log sleep')} style={{ height: '100%', minHeight: 140, background: 'var(--ink)', color: 'var(--bg)' }}>
      <Icon name="moon" size={28} />
      <span className="disp" style={{ display: 'block', fontWeight: 800, fontSize: 24, marginTop: 6 }}>{d.sleep ? `${fmt(d.sleep.hours, s.lang, 1)} ${t('год', 'h')}` : '—'}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.8 }}>{d.sleep ? `${d.sleep.bed}–${d.sleep.wake}` : t('Як спалось?', 'How did you sleep?')}</span>
    </Card>
  );
}

function MoodW() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  return (
    <Card>
      <Title>{t('Як настрій?', 'How are you feeling?')}</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
        {MOODS.map(m => <button key={m.v} className="press stack" onClick={() => act(x => setMood(x, m.v))} aria-pressed={d.mood === m.v}
          style={{ minHeight: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, background: d.mood === m.v ? 'var(--mustard)' : 'var(--bg)', color: d.mood === m.v ? '#3B1E3F' : 'var(--ink2)' }}><MoodFace path={m.path} />{t(m.uk, m.en)}</button>)}
      </div>
    </Card>
  );
}

function HabitsW() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  return (
    <Card>
      <Title right={<button className="chip press" onClick={() => openSheet(close => <HabitEditor close={close} />)} style={{ minHeight: 34, background: 'var(--bg)' }}><Icon name="plus" size={16} stroke={2.6} />{t('Додати', 'Add')}</button>}>{t('Мої звички', 'My habits')}</Title>
      {s.habits.length === 0 && <p className="muted" style={{ fontSize: 13.5 }}>{t('Додай звичку: вітаміни, читання, медитація — що завгодно.', 'Add a habit: vitamins, reading, meditation — anything.')}</p>}
      {s.habits.map(h => { const on = !!d.habits[h.id]; return (
        <button key={h.id} className="row-c press" role="checkbox" aria-checked={on} onClick={() => act(x => toggleHabit(x, h.id))} style={{ gap: 12, minHeight: 50, width: '100%', textAlign: 'left' }}>
          <span style={{ width: 36, height: 36, borderRadius: 12, background: on ? 'var(--olive)' : 'var(--bg)', color: on ? '#FFF8EA' : 'var(--ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .3s' }}><Icon name={on ? 'check' : h.icon} size={20} stroke={on ? 3 : 2.2} /></span>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{h.name}</span>
        </button>); })}
    </Card>
  );
}

function DiaryW() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  return (
    <Card onClick={() => go('diary')} label={t('Відкрити щоденник', 'Open diary')}>
      <Title right={<Icon name="chevron" size={20} style={{ color: 'var(--ink2)' }} />}>{t('Щоденник', 'Diary')}</Title>
      <p style={{ fontSize: 14.5, lineHeight: 1.45, color: d.note ? 'var(--ink)' : 'var(--ink2)', fontStyle: d.note ? 'normal' : 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.note || t('Як пройшов день? Кілька слів для себе.', 'How was your day? A few words for yourself.')}</p>
    </Card>
  );
}

function JourneyW() {
  const s = useApp();
  const t = useT();
  const next = CITIES.find(c => c.km > s.km) || CITIES[CITIES.length - 1];
  const prev = [...CITIES].reverse().find(c => c.km <= s.km) || CITIES[0];
  const p = Math.min(1, (s.km - prev.km) / (next.km - prev.km || 1));
  return (
    <Card onClick={() => go('adventure')} label={t('Відкрити мапу', 'Open map')} style={{ height: '100%', minHeight: 140 }}>
      <Icon name="map" size={28} style={{ color: 'var(--olive)' }} />
      <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5, marginTop: 6 }}>{t('До', 'To')} {t.l(next.name)}</span>
      <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{fmt(Math.max(0, next.km - s.km), s.lang, 1)} {t('км', 'km')}</span>
      <div className="bar" style={{ height: 8, marginTop: 8 }}><i style={{ width: p * 100 + '%' }} /></div>
    </Card>
  );
}

function WeightW() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  return (
    <Card onClick={() => openSheet(close => <WeightForm close={close} />)} label={t('Записати вагу', 'Log weight')} style={{ height: '100%', minHeight: 140 }}>
      <Icon name="scale" size={28} style={{ color: 'var(--ink2)' }} />
      <span className="disp" style={{ display: 'block', fontWeight: 800, fontSize: 24, marginTop: 6 }}>{fmt(s.profile.weight, s.lang, 1)}</span>
      <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{t('кг', 'kg')}{d.weight ? t(', записано сьогодні', ', logged today') : t(', торкнись, щоб записати', ', tap to log')}</span>
    </Card>
  );
}
function WeightForm({ close }: { close: () => void }) {
  const s = useApp();
  const t = useT();
  const [w, setW] = useState(String(s.profile.weight));
  return (
    <form className="stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); const v = parseFloat(w.replace(',', '.')); if (v >= 30 && v <= 300) { act(x => logWeight(x, v)); close(); } }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Вага сьогодні', 'Weight today')}</h2>
      <input className="field" inputMode="decimal" value={w} onChange={e => setW(e.target.value)} data-autofocus aria-label={t('Вага, кг', 'Weight, kg')} />
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{t('Вага коливається щодня — дивись на тенденцію в щоденнику. Вагу бачиш лише ти.', 'Weight fluctuates daily — look at the trend in your diary. Only you see it.')}</p>
      <button className="btn block press" type="submit">{t('Зберегти', 'Save')}</button>
    </form>
  );
}

function GameW() {
  const s = useApp();
  const t = useT();
  const plays = Math.max(0, GAME_PLAYS_PER_DAY - s.days[today()].gamePlays);
  return (
    <button className="press row-c" onClick={() => openSheet(close => <MiniGame close={close} />)} style={{ width: '100%', gap: 14, padding: 16, borderRadius: 26, background: 'var(--ink)', color: 'var(--bg)', textAlign: 'left' }}>
      <span style={{ width: 52, height: 52, borderRadius: 18, background: 'var(--tomato)', color: 'var(--onAccent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="game" size={28} /></span>
      <span style={{ flex: 1 }}><span className="disp" style={{ display: 'block', fontWeight: 700, fontSize: 16 }}>{t('Лови овочі', 'Catch the veggies')}</span>
        <span style={{ fontSize: 13, opacity: 0.8 }}>{plays ? t(`Ще ${plays} з монетами сьогодні`, `${plays} rewarded left today`) : t('Монети зібрано, граємо для задоволення', 'Coins collected, playing for fun')}{s.gameBest ? t(`. Рекорд: ${s.gameBest}`, `. Best: ${s.gameBest}`) : ''}</span></span>
    </button>
  );
}

export function SleepForm({ close, date = today() }: { close: () => void; date?: string }) {
  const s = useApp();
  const t = useT();
  const cur = s.days[date]?.sleep;
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
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{t('Дорослим зазвичай потрібно 7–9 годин сну.', 'Adults usually need 7–9 hours of sleep.')}</p>
      <button className="btn block press" onClick={() => { act(x => logSleep(x, bed, wake, q, date)); close(); }}>{t('Зберегти', 'Save')}</button>
    </div>
  );
}

/** Одне мʼяке нагадування від героя. «Пізніше» ховає його до завтра. */
function NudgeCard() {
  const s = useApp();
  const t = useT();
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(x => x + 1), 5 * 60_000); return () => clearInterval(id); }, []);
  const nd = nudgeFor(s);
  if (!nd) return null;
  return (
    <section className="pad" style={{ marginTop: 12 }}>
      <motion.div key={nd.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="row-c" style={{ gap: 12, padding: '12px 12px 12px 14px', borderRadius: 22, background: nd.action === 'water' ? 'color-mix(in srgb, #3B8FB5 16%, var(--surface))' : 'var(--peach)' }} role="status">
        <span style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', color: nd.action === 'water' ? '#3B8FB5' : 'var(--peachInk)' }}><Icon name={nd.action === 'water' ? 'drop' : 'food'} size={22} /></span>
        <span style={{ flex: 1, fontSize: 14, lineHeight: 1.4, fontWeight: 600 }}>{t(nd.uk, nd.en)}</span>
        <span className="stack" style={{ gap: 4, flexShrink: 0 }}>
          <button className="chip press on" style={{ minHeight: 36 }} onClick={() => nd.action === 'water' ? act(x => addWater(x, 1)) : go('food')}>{nd.action === 'water' ? t('+1 склянка', '+1 glass') : t('Записати', 'Log')}</button>
          <button className="chip press" style={{ minHeight: 32, fontSize: 12.5, background: 'transparent' }} onClick={() => act(x => dismissNudge(x, nd.id))}>{t('Пізніше', 'Later')}</button>
        </span>
      </motion.div>
    </section>
  );
}
