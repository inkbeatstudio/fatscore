import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { act, useApp } from '../store';
import { useT, openSheet } from '../components/ui';
import { Icon } from '../components/Icon';
import { MealVariety, openCopy, useSwipe } from '../components/foodbits';
import { openReport } from '../components/Report';
import { MOODS, MoodFace } from '../components/moods';
import { SleepForm } from './Home';
import { addDays, daysBetween, dkey, parse, today, weekKey } from '../logic/dates';
import { isActive, MEALS, removeFood, removeWorkout, setMood, setNote, setPhoto } from '../logic/game';
import { colorCount, dailyNorm, dayTotals, entryNutr } from '../logic/nutrition';
import { CATS } from '../data/foods';
import { fmt, locale, plural } from '../i18n';
import { go } from '../nav';
import type { Day } from '../types';

const MOOD_BG = ['', '#C9B7C9', '#F3D8AE', '#C9D58E', '#F0B429'];

export default function Diary() {
  const s = useApp();
  const t = useT();
  const [sel, setSel] = useState(today());
  const [month, setMonth] = useState(() => { const d = parse(today()); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const first = (month.getDay() + 6) % 7;
  const dim = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((first + dim) / 7) * 7 }, (_, i) => { const n = i - first + 1; return n >= 1 && n <= dim ? dkey(new Date(month.getFullYear(), month.getMonth(), n)) : null; });
  const wd = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale(s.lang), { weekday: 'short' }).slice(0, 2));
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= parse(today());
  const monthName = month.toLocaleDateString(locale(s.lang), { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());
  const monthActive = cells.filter(k => k && isActive(s.days[k])).length;
  const shift = (n: number) => { const k = addDays(sel, n); if (k > today()) return; setSel(k); const d = parse(k); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); };

  return (
    <main className="screen">
      <div className="pad row-c" style={{ justifyContent: 'space-between' }}>
        <h1 className="h1">{t('Щоденник', 'Diary')}</h1>
        <button className="chip press" onClick={() => { setSel(today()); const d = parse(today()); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}>{t('Сьогодні', 'Today')}</button>
      </div>

      <section className="pad" style={{ marginTop: 12 }}>
        <div className="card" style={{ padding: '14px 12px 12px' }}>
          <div className="row-c" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <button className="icon-btn press" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label={t('Попередній місяць', 'Previous month')} style={{ color: 'var(--ink)' }}><Icon name="back" /></button>
            <div className="stack" style={{ alignItems: 'center' }}><span className="disp" style={{ fontWeight: 700, fontSize: 17 }}>{monthName}</span><span className="lbl" style={{ fontSize: 12 }}>{t(`активних днів: ${monthActive}`, `active days: ${monthActive}`)}</span></div>
            <button className="icon-btn press" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label={t('Наступний місяць', 'Next month')} style={{ color: 'var(--ink)', opacity: canNext ? 1 : 0.3 }}><Icon name="chevron" /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 4 }} role="grid">
            {wd.map((w, i) => <span key={i} className="lbl" style={{ textAlign: 'center', fontSize: 11.5, paddingBottom: 4 }}>{w}</span>)}
            {cells.map((k, i) => k ? <DayCell key={k} k={k} sel={sel === k} onPick={() => setSel(k)} /> : <span key={i} />)}
          </div>
          <div className="row-c" style={{ gap: 12, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            {[['var(--tomato)', t('їжа', 'food')], ['#3B8FB5', t('вода', 'water')], ['var(--mustard)', t('рух', 'move')], ['var(--ink)', t('запис', 'note')]].map(([c, l]) => <span key={l} className="row-c lbl" style={{ gap: 4, fontSize: 11.5 }}><i style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />{l}</span>)}
          </div>
        </div>
      </section>

      <DayDetail key={sel} date={sel} onShift={shift} />
      <WeekReport date={sel} />
      <Trends />
    </main>
  );
}

function DayCell({ k, sel, onPick }: { k: string; sel: boolean; onPick: () => void }) {
  const s = useApp();
  const d = s.days[k];
  const future = daysBetween(today(), k) > 0;
  const isT = k === today();
  const dots = d ? [d.foods.length > 0 && 'var(--tomato)', d.water >= s.profile.waterGoal && '#3B8FB5', (d.workouts.length > 0 || d.rest || d.steps >= 5000) && 'var(--mustard)', !!d.note && 'var(--ink)'].filter(Boolean) as string[] : [];
  return (
    <button className="press stack" disabled={future} onClick={onPick} aria-pressed={sel} aria-label={k}
      style={{ aspectRatio: '1 / 1.08', borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 3, opacity: future ? 0.3 : 1,
        background: sel ? 'var(--ink)' : d?.mood ? MOOD_BG[d.mood] + '88' : 'transparent', color: sel ? 'var(--bg)' : 'var(--ink)', boxShadow: isT && !sel ? 'inset 0 0 0 2px var(--tomato)' : 'none' }}>
      <span style={{ fontWeight: 700, fontSize: 14.5 }}>{parse(k).getDate()}</span>
      <span className="row-c" style={{ gap: 2, height: 6 }}>{dots.map((c, i) => <i key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: sel && c === 'var(--ink)' ? 'var(--bg)' : c }} />)}</span>
    </button>
  );
}

/** Стискаємо фото до ~720 px, щоб щоденник не займав забагато місця на телефоні */
async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, 720 / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  } finally { URL.revokeObjectURL(url); }
}

function DayDetail({ date, onShift }: { date: string; onShift: (n: number) => void }) {
  const s = useApp();
  const t = useT();
  const d: Day | undefined = s.days[date];
  const isT = date === today();
  const nn = s.profile.noNum;
  const tot = dayTotals(d);
  const n = dailyNorm(s.profile);
  const [note, setNoteLocal] = useState(d?.note || '');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const saveNote = (v: string) => { clearTimeout(timer.current); timer.current = setTimeout(() => act(x => setNote(x, v, date)), 700); };
  const swipe = useSwipe(() => onShift(-1), () => onShift(1));
  const title = isT ? t('Сьогодні', 'Today') : date === addDays(today(), -1) ? t('Вчора', 'Yesterday') : parse(date).toLocaleDateString(locale(s.lang), { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, c => c.toUpperCase());
  const stat = (icon: string, v: string, l: string) => (
    <div className="card stack" style={{ padding: '10px 6px', alignItems: 'center', gap: 2, textAlign: 'center' }}><Icon name={icon} size={20} style={{ color: 'var(--ink2)' }} /><span className="disp" style={{ fontWeight: 700, fontSize: 15 }}>{v}</span><span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>{l}</span></div>
  );
  return (
    <motion.section className="pad stack" style={{ marginTop: 20, gap: 12 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} {...swipe}>
      <div className="row-c" style={{ justifyContent: 'space-between', gap: 8 }}>
        <button className="icon-btn press" style={{ color: 'var(--ink)', marginLeft: -10 }} onClick={() => onShift(-1)} aria-label={t('Попередній день', 'Previous day')}><Icon name="back" /></button>
        <h2 className="sectionT" style={{ flex: 1, textAlign: 'center' }} aria-live="polite">{title}</h2>
        <button className="icon-btn press" style={{ color: 'var(--ink)', marginRight: -10, opacity: isT ? 0.3 : 1 }} disabled={isT} onClick={() => onShift(1)} aria-label={t('Наступний день', 'Next day')}><Icon name="chevron" /></button>
      </div>
      <p className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: -6 }}>{t('Гортай свайпом вліво-вправо', 'Swipe left or right to change day')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6 }}>
        {stat('food', nn ? `${colorCount(d)}/5` : fmt(tot.kcal, s.lang), nn ? t('кольори', 'colours') : t('ккал', 'kcal'))}
        {stat('drop', `${d?.water || 0}`, t('склянок', 'glasses'))}
        {stat('steps', fmt(d?.steps || 0, s.lang), t('кроків', 'steps'))}
        {stat('moon', d?.sleep ? fmt(d.sleep.hours, s.lang, 1) : '—', t('год сну', 'h sleep'))}
      </div>

      <div className="card stack" style={{ padding: 14, gap: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{t('Настрій', 'Mood')}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
          {MOODS.map(m => <button key={m.v} className="press stack" onClick={() => act(x => setMood(x, m.v, date))} aria-pressed={d?.mood === m.v}
            style={{ minHeight: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 11, fontWeight: 600, background: d?.mood === m.v ? 'var(--mustard)' : 'var(--bg)', color: d?.mood === m.v ? '#3B1E3F' : 'var(--ink2)' }}><MoodFace path={m.path} size={24} />{t(m.uk, m.en)}</button>)}
        </div>
      </div>

      <div className="card stack" style={{ padding: 14, gap: 10 }}>
        <div className="row-c" style={{ justifyContent: 'space-between' }}><span style={{ fontWeight: 700, fontSize: 15 }}>{t('Записи дня', 'Day notes')}</span><span className="lbl" style={{ fontSize: 12 }}>{t('зберігається само', 'saves automatically')}</span></div>
        <textarea className="field" value={note} rows={4} maxLength={4000} placeholder={isT ? t('Як пройшов день? Що порадувало? Що було важко?', 'How was your day? What was good? What was hard?') : t('Що запам\'яталось у цей день?', 'What do you remember about this day?')}
          onChange={e => { setNoteLocal(e.target.value); saveNote(e.target.value); }} onBlur={() => { clearTimeout(timer.current); act(x => setNote(x, note, date)); }}
          style={{ padding: 14, lineHeight: 1.5, resize: 'vertical', minHeight: 110, fontSize: 15.5 }} aria-label={t('Запис у щоденнику', 'Diary entry')} />
        {d?.photo ? (
          <div style={{ position: 'relative' }}>
            <img src={d.photo} alt={t('Фото дня', 'Photo of the day')} style={{ width: '100%', borderRadius: 16, display: 'block', maxHeight: 360, objectFit: 'cover' }} />
            <button className="press" onClick={() => act(x => setPhoto(x, undefined, date))} aria-label={t('Прибрати фото', 'Remove photo')} style={{ position: 'absolute', top: 8, right: 8, width: 40, height: 40, borderRadius: '50%', background: 'rgba(28,14,32,.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trash" size={18} /></button>
          </div>
        ) : <button className="btn ghost small press" onClick={() => file.current?.click()}><Icon name="sun" size={18} />{t('Додати фото дня', 'Add a photo of the day')}</button>}
        <input ref={file} type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) { const url = await compress(f); act(x => setPhoto(x, url, date)); } e.target.value = ''; }} />
      </div>

      <div className="card stack" style={{ padding: 14, gap: 8 }}>
        <div className="row-c" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t('Їжа', 'Food')}</span>
          <span className="row-c" style={{ gap: 6 }}>
            {!!d?.foods.length && <button className="chip press" style={{ minHeight: 36, background: 'var(--bg)' }} onClick={() => openCopy(date)}><Icon name="copy" size={16} />{t('Копіювати день', 'Copy day')}</button>}
            <button className="chip press" style={{ minHeight: 36, background: 'var(--bg)' }} onClick={() => go('food', { date: isT ? undefined : date })}><Icon name="plus" size={16} stroke={2.6} />{t('Додати', 'Add')}</button>
          </span>
        </div>
        {!d?.foods.length && <p className="muted" style={{ fontSize: 13.5 }}>{isT ? t('Ще нічого не записано.', 'Nothing logged yet.') : t('Забув записати? Можна додати зараз.', 'Forgot to log? You can add it now.')}</p>}
        {MEALS.map(m => { const es = d?.foods.filter(f => f.meal === m.k) || []; if (!es.length) return null; return (
          <div key={m.k} className="stack" style={{ gap: 4 }}>
            <div className="row-c" style={{ justifyContent: 'space-between', gap: 8 }}>
              <span className="row-c" style={{ gap: 10, flexWrap: 'wrap' }}><span className="lbl" style={{ fontSize: 12 }}>{t.l(m.name)}</span><MealVariety es={es} /></span>
              <button className="icon-btn press" style={{ width: 34, height: 34 }} onClick={() => openCopy(date, m.k)} aria-label={t(`Копіювати: ${m.name.uk.toLowerCase()}`, `Copy ${m.name.en.toLowerCase()}`)}><Icon name="copy" size={17} /></button>
            </div>
            {es.map(e => <div key={e.id} className="row-c" style={{ gap: 10, minHeight: 40 }}>
              <span className="dot" style={{ background: CATS[e.food.cat].c[1] }} />
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{t.l(e.food.name)}</span>
              <span className="muted" style={{ fontSize: 12.5 }}>{nn ? `${e.g} ${t('г', 'g')}` : `${fmt(entryNutr(e).kcal, s.lang)} ${t('ккал', 'kcal')}`}</span>
              <button className="icon-btn press" style={{ width: 36, height: 36 }} onClick={() => act(x => removeFood(x, e.id, date))} aria-label={t('Видалити', 'Delete')}><Icon name="close" size={16} /></button>
            </div>)}
          </div>); })}
        {!nn && !!d?.foods.length && <span className="muted" style={{ fontSize: 12.5 }}>{t(`Білки ${fmt(tot.p, 'uk')}/${n.prot} г · жири ${fmt(tot.f, 'uk')}/${n.fat} г · вуглеводи ${fmt(tot.c, 'uk')}/${n.carb} г`, `Protein ${fmt(tot.p, 'en')}/${n.prot} g · fat ${fmt(tot.f, 'en')}/${n.fat} g · carbs ${fmt(tot.c, 'en')}/${n.carb} g`)}</span>}
      </div>

      <div className="card stack" style={{ padding: 14, gap: 8 }}>
        <div className="row-c" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t('Рух і сон', 'Movement & sleep')}</span>
          <button className="chip press" style={{ minHeight: 36, background: 'var(--bg)' }} onClick={() => openSheet(close => <SleepForm close={close} date={date} />)}><Icon name="moon" size={16} />{d?.sleep ? t('Сон', 'Sleep') : t('+ сон', '+ sleep')}</button>
        </div>
        {d?.sleep && <span style={{ fontSize: 14 }}>{t('Сон', 'Sleep')}: {d.sleep.bed}–{d.sleep.wake}, {fmt(d.sleep.hours, s.lang, 1)} {t('год', 'h')}</span>}
        {d?.rest && <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--olive)' }}>{t('День відпочинку', 'Rest day')}</span>}
        {(d?.workouts || []).map(w => <div key={w.id} className="row-c" style={{ gap: 10, minHeight: 40 }}>
          <Icon name={w.route ? 'map' : 'dumbbell'} size={20} style={{ color: 'var(--tomato)' }} />
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{t.l(w.name)} <span className="muted" style={{ fontWeight: 500 }}>{w.detail}{w.km ? `, ${fmt(w.km, s.lang, 2)} ${t('км', 'km')}` : ''}</span></span>
          <button className="icon-btn press" style={{ width: 36, height: 36 }} onClick={() => act(x => removeWorkout(x, w.id, date))} aria-label={t('Видалити', 'Delete')}><Icon name="close" size={16} /></button>
        </div>)}
        {(d?.workouts || []).filter(w => w.route && w.route.length > 1).slice(0, 1).map(w => <RouteMini key={w.id} route={w.route!} />)}
        {!d?.workouts.length && !d?.rest && !d?.sleep && <p className="muted" style={{ fontSize: 13.5 }}>{t('Тут з\'являться тренування, маршрути й сон.', 'Workouts, routes and sleep will show up here.')}</p>}
      </div>
    </motion.section>
  );
}

/** Маленька схема маршруту без мапи — працює офлайн */
export function RouteMini({ route }: { route: [number, number][] }) {
  const path = useMemo(() => {
    const lats = route.map(p => p[0]), lons = route.map(p => p[1]);
    const mnA = Math.min(...lats), mxA = Math.max(...lats), mnO = Math.min(...lons), mxO = Math.max(...lons);
    const k = Math.cos((mnA * Math.PI) / 180);
    const w = (mxO - mnO) * k || 1e-6, h = mxA - mnA || 1e-6, sc = Math.min(300 / w, 120 / h);
    return route.map(([a, o], i) => `${i ? 'L' : 'M'}${(10 + (o - mnO) * k * sc + (300 - w * sc) / 2).toFixed(1)} ${(10 + (mxA - a) * sc + (120 - h * sc) / 2).toFixed(1)}`).join(' ');
  }, [route]);
  return <svg viewBox="0 0 320 140" style={{ width: '100%', borderRadius: 14, background: 'var(--bg)' }} role="img" aria-label="Route"><path d={path} fill="none" stroke="var(--tomato)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function WeekReport({ date }: { date: string }) {
  const s = useApp();
  const t = useT();
  const wk = weekKey(date);
  const days = Array.from({ length: 7 }, (_, i) => s.days[addDays(wk, i)]).filter(Boolean) as Day[];
  const active = days.filter(isActive).length;
  const workouts = days.reduce((a, d) => a + d.workouts.length, 0);
  const sl = days.filter(d => d.sleep);
  const avgSleep = sl.length ? sl.reduce((a, d) => a + d.sleep!.hours, 0) / sl.length : 0;
  const water = days.filter(d => d.water >= s.profile.waterGoal).length;
  const fd = days.filter(d => d.foods.length);
  const avgCol = fd.length ? fd.reduce((a, d) => a + colorCount(d), 0) / fd.length : 0;
  const steps = days.reduce((a, d) => a + d.steps, 0);
  const range = `${parse(wk).toLocaleDateString(locale(s.lang), { day: 'numeric', month: 'short' })} – ${parse(addDays(wk, 6)).toLocaleDateString(locale(s.lang), { day: 'numeric', month: 'short' })}`;
  const cmt = active >= 5 ? t('Сильний тиждень. Пишаюсь!', 'A strong week. Proud of you!') : active >= 3 ? t('Стабільно. Саме так будуються звички.', 'Steady. That\'s how habits are built.') : t('Будь-який крок рахується. Наступний тиждень — новий старт.', 'Every step counts. Next week is a fresh start.');
  const row = (v: string, l: string) => <div className="stack" style={{ gap: 1 }}><span className="disp" style={{ fontWeight: 700, fontSize: 18 }}>{v}</span><span className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{l}</span></div>;
  return (
    <section className="pad" style={{ marginTop: 22 }}>
      <div className="stack" style={{ borderRadius: 26, padding: 16, gap: 12, background: 'var(--oliveLight)' }}>
        <div className="row-c" style={{ justifyContent: 'space-between' }}><h2 className="sectionT" style={{ fontSize: 16 }}>{t('Підсумок тижня', 'Week summary')}</h2><span className="lbl">{range}</span></div>
        <div className="grid3" style={{ gap: 12 }}>
          {row(`${active}/7`, t('активних днів', 'active days'))}
          {row(String(workouts), plural(s.lang, workouts, ['тренування', 'тренування', 'тренувань'], ['workout', 'workouts']))}
          {row(avgSleep ? fmt(avgSleep, s.lang, 1) : '—', t('год сну в середньому', 'h avg sleep'))}
          {row(`${water}`, t('днів з нормою води', 'water-goal days'))}
          {row(avgCol ? fmt(avgCol, s.lang, 1) : '—', t('кольорів на тарілці', 'plate colours avg'))}
          {row(`${fmt(steps / 1000, s.lang, 1)}k`, t('кроків', 'steps'))}
        </div>
        <p style={{ fontSize: 14, fontWeight: 600 }}>{s.profile.cname}: «{cmt}»</p>
        <button className="btn ghost small press" style={{ background: 'var(--surface)' }} onClick={() => openReport()}><Icon name="file" size={18} />{t('Звіт для лікаря чи дієтолога', 'Report for a doctor or dietitian')}</button>
      </div>
    </section>
  );
}

function Trends() {
  const s = useApp();
  const t = useT();
  const weights = Object.values(s.days).filter(d => d.weight != null && !d.demo).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6));
  const last28 = Array.from({ length: 28 }, (_, i) => s.days[addDays(today(), i - 27)]);
  const chart = weights.length >= 2 ? <WeightChart days={weights} /> : null;
  const moodDays = Object.values(s.days).filter(d => d.mood != null && !d.demo);
  let insight = t('Через тиждень-два тут з\'являться твої закономірності.', 'In a week or two your patterns will show up here.');
  if (moodDays.length >= 6) {
    const a = moodDays.filter(d => d.workouts.length || d.steps >= 5000), b = moodDays.filter(d => !(d.workouts.length || d.steps >= 5000));
    if (a.length >= 2 && b.length >= 2) {
      const avg = (x: Day[]) => x.reduce((q, d) => q + (d.mood || 0), 0) / x.length;
      const diff = avg(a) - avg(b);
      insight = Math.abs(diff) < 0.3 ? t('Поки настрій не залежить помітно від руху.', 'So far your mood doesn\'t clearly depend on movement.') : diff > 0 ? t('У дні з рухом твій настрій у середньому кращий.', 'On active days your mood tends to be better.') : t('У спокійні дні настрій буває кращим. Відпочинок теж важливий.', 'Your mood tends to be better on quiet days. Rest matters too.');
    }
  }
  return (
    <section className="pad stack" style={{ marginTop: 22, gap: 12 }}>
      <h2 className="sectionT">{t('Тренди', 'Trends')}</h2>
      <div className="card stack" style={{ padding: 14, gap: 10 }}>
        <span style={{ fontWeight: 700 }}>{t('Сон за тиждень', 'Sleep this week')}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 6, alignItems: 'end', height: 110 }}>
          {last7.map(k => { const h = s.days[k]?.sleep?.hours || 0; return (
            <div key={k} className="stack" style={{ alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700 }}>{h ? fmt(h, s.lang, 1) : ''}</span>
              <div style={{ width: '70%', height: `${Math.min(100, (h / 10) * 100) * 0.7}%`, minHeight: 4, borderRadius: 8, background: h >= 7 ? 'var(--olive)' : h ? 'var(--mustard)' : 'var(--track)' }} />
              <span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>{parse(k).toLocaleDateString(locale(s.lang), { weekday: 'narrow' })}</span>
            </div>); })}
        </div>
      </div>
      <div className="card stack" style={{ padding: 14, gap: 10 }}>
        <span style={{ fontWeight: 700 }}>{t('Настрій за 4 тижні', 'Mood, last 4 weeks')}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0,1fr))', gap: 3 }}>
          {last28.map((d, i) => { const m = MOODS.find(x => x.v === d?.mood); return <span key={i} style={{ aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: m ? MOOD_BG[m.v] : 'var(--track)', color: '#3B1E3F' }}>{m && <MoodFace path={m.path} size={15} />}</span>; })}
        </div>
        <p style={{ fontSize: 13.5, fontWeight: 600 }}>{insight}</p>
      </div>
      {!s.profile.noNum && s.settings.weightChart && <div className="card stack" style={{ padding: 14, gap: 8 }}>
        <span style={{ fontWeight: 700 }}>{t('Вага', 'Weight')}</span>
        {chart || <p className="muted" style={{ fontSize: 13.5 }}>{t('Записуй вагу раз на кілька днів (віджет «Вага» на головній), і тут з\'явиться графік.', 'Log your weight every few days (the «Weight» home widget) and a chart will appear.')}</p>}
        <span className="muted" style={{ fontSize: 12 }}>{t('Вагу бачиш лише ти. Її можна не записувати зовсім.', 'Only you see your weight. You don\'t have to log it at all.')}</span>
      </div>}
    </section>
  );
}

/** Вага: бліді точки — окремі зважування, суцільна лінія — згладжений тренд.
 *  Щоденні коливання на 0,5–1 кг — це вода, тож дивимось на напрямок, а не на одну цифру. */
function WeightChart({ days }: { days: Day[] }) {
  const s = useApp();
  const t = useT();
  const vals = days.map(d => d.weight!);
  const trend: number[] = [];
  vals.forEach((v, i) => trend.push(i ? trend[i - 1] + 0.3 * (v - trend[i - 1]) : v));
  const t0 = parse(days[0].date).getTime(), t1 = parse(days[days.length - 1].date).getTime() || t0 + 1;
  const all = [...vals, ...trend];
  const mn = Math.min(...all) - 0.6, mx = Math.max(...all) + 0.6;
  const X = (d: Day) => 14 + ((parse(d.date).getTime() - t0) / Math.max(1, t1 - t0)) * 292;
  const Y = (v: number) => 96 - ((v - mn) / (mx - mn)) * 82;
  const path = days.map((d, i) => `${i ? 'L' : 'M'}${X(d).toFixed(1)} ${Y(trend[i]).toFixed(1)}`).join(' ');
  const fmtD = (k: string) => parse(k).toLocaleDateString(locale(s.lang), { day: 'numeric', month: 'short' });
  return (
    <div className="stack" style={{ gap: 6 }}>
      <svg viewBox="0 0 320 112" width="100%" role="img" aria-label={t(`Графік ваги: тренд ${fmt(trend[trend.length - 1], s.lang, 1)} кг`, `Weight chart: trend ${fmt(trend[trend.length - 1], s.lang, 1)} kg`)}>
        {[0.25, 0.5, 0.75].map(k => <line key={k} x1="14" x2="306" y1={14 + k * 82} y2={14 + k * 82} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 5" />)}
        {days.map((d, i) => <circle key={i} cx={X(d)} cy={Y(vals[i])} r="3" fill="var(--ink2)" opacity=".35" />)}
        <path d={path} fill="none" stroke="var(--olive)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={X(days[days.length - 1])} cy={Y(trend[trend.length - 1])} r="5" fill="var(--olive)" stroke="var(--surface)" strokeWidth="2" />
      </svg>
      <div className="row-c" style={{ justifyContent: 'space-between' }}>
        <span className="lbl" style={{ fontSize: 11.5 }}>{fmtD(days[0].date)}</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{t('Тренд', 'Trend')}: {fmt(trend[trend.length - 1], s.lang, 1)} {t('кг', 'kg')}</span>
        <span className="lbl" style={{ fontSize: 11.5 }}>{fmtD(days[days.length - 1].date)}</span>
      </div>
      <span className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>{t('Лінія показує загальний напрямок. Коливання на пів кіло-кіло за день — це переважно вода, а не жир.', 'The line shows the overall direction. Day-to-day swings of half a kilo or so are mostly water, not fat.')}</span>
    </div>
  );
}
