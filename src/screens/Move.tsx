import { useEffect, useRef, useState } from 'react';
import { act, useApp, emitEffects } from '../store';
import { useT, openSheet, ScreenHeader } from '../components/ui';
import { back, go } from '../nav';
import { parseTrackFile, ACT_MET } from '../services/geo';
import { dkey, daysBetween } from '../logic/dates';
import { Character } from '../components/art';
import { Icon } from '../components/Icon';
import { addSteps, addWorkout, logStrength, removeWorkout, setRest, stageOf } from '../logic/game';
import { metKcal } from '../logic/nutrition';
import { CARDIO, SHORT, STRENGTH, type ShortW } from '../data/exercise';
import { today } from '../logic/dates';
import { fmt, plural } from '../i18n';
import { haptic } from '../services/feedback';

export default function Move() {
  const s = useApp();
  const t = useT();
  const d = s.days[today()];
  const nn = s.profile.noNum;
  const [mode, setMode] = useState<'strength' | 'cardio' | 'short'>('strength');
  const [custom, setCustom] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const importFile = async (f: File) => {
    try {
      const r = parseTrackFile(await f.text());
      const date = dkey(new Date(r.start));
      const names = { walk: { uk: 'Прогулянка', en: 'Walk' }, run: { uk: 'Біг', en: 'Run' }, bike: { uk: 'Велосипед', en: 'Ride' }, hike: { uk: 'Похід', en: 'Hike' } };
      if (daysBetween(date, today()) < 0) throw new Error('future');
      act(x => addWorkout(x, { kind: 'cardio', name: names[r.kind], detail: `${r.min} ${t('хв', 'min')}`, min: r.min, km: r.km, kcal: metKcal(ACT_MET[r.kind], x.profile.weight, r.min), source: 'gpx', route: r.route }, date));
    } catch { emitEffects([{ type: 'toast', icon: 'info', text: t('Не вдалося прочитати файл. Потрібен GPX або TCX з маршрутом.', 'Couldn\'t read the file. A GPX or TCX file with a route is needed.') }]); }
  };

  return (
    <main className="screen">
      <ScreenHeader title={t('Рух', 'Move')} onBack={back} />

      <section className="pad" style={{ marginTop: 10 }}>
        <div className="stack" style={{ background: 'var(--mustard)', color: '#3B1E3F', borderRadius: 28, padding: '18px 18px 16px', gap: 10 }}>
          <div className="row-c" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="disp" style={{ fontWeight: 800, fontSize: 30 }}>{fmt(d.steps, s.lang)}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{t('кроків сьогодні', 'steps today')}</span>
          </div>
          <div className="row-c" style={{ gap: 8, flexWrap: 'wrap' }}>
            {[1000, 3000, 5000].map(v => <button key={v} className="chip press" style={{ background: '#FFF1D6', color: '#3B1E3F', boxShadow: 'none' }} onClick={() => act(x => addSteps(x, v))}>+{fmt(v, s.lang)}</button>)}
            <form className="row-c" style={{ gap: 6, flex: 1, minWidth: 140 }} onSubmit={e => { e.preventDefault(); const v = parseInt(custom); if (v > 0) { act(x => addSteps(x, v)); setCustom(''); } }}>
              <input className="field" inputMode="numeric" value={custom} onChange={e => setCustom(e.target.value)} placeholder={t('Свої', 'Custom')} aria-label={t('Кількість кроків', 'Number of steps')} style={{ minHeight: 40, background: '#FFF1D6', color: '#3B1E3F', boxShadow: 'none', fontSize: 15 }} />
              <button className="chip press" type="submit" style={{ background: '#3B1E3F', color: '#FFF1D6', boxShadow: 'none' }}>OK</button>
            </form>
          </div>
        </div>
      </section>

      <section className="pad grid2" style={{ marginTop: 12 }}>
        <button className="press stack" onClick={() => go('track')} style={{ gap: 8, padding: 16, borderRadius: 24, background: 'var(--ink)', color: 'var(--bg)', textAlign: 'left', minHeight: 128 }}>
          <Icon name="map" size={28} />
          <span style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.2 }}>{t('Записати маршрут з GPS', 'Record a GPS route')}</span>
          <span style={{ fontSize: 12.5, opacity: 0.8 }}>{t('Прогулянка, біг, велосипед', 'Walk, run, ride')}</span>
        </button>
        <button className="press stack" onClick={() => file.current?.click()} style={{ gap: 8, padding: 16, borderRadius: 24, background: 'var(--surface)', textAlign: 'left', minHeight: 128 }}>
          <Icon name="upload" size={28} style={{ color: 'var(--olive)' }} />
          <span style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.2 }}>{t('Імпорт з годинника', 'Import from a watch')}</span>
          <span className="muted" style={{ fontSize: 12.5 }}>{t('Файл GPX або TCX', 'GPX or TCX file')}</span>
        </button>
        <input ref={file} type="file" accept=".gpx,.tcx,application/gpx+xml,application/xml,text/xml" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} />
      </section>
      <section className="pad" style={{ marginTop: 10 }}>
        <details className="card" style={{ padding: '12px 16px' }}>
          <summary style={{ fontWeight: 700, fontSize: 14.5, cursor: 'pointer', minHeight: 32, display: 'flex', alignItems: 'center' }}>{t('Як підключити фітнес-трекер', 'How to connect a fitness tracker')}</summary>
          <div className="stack" style={{ gap: 8, fontSize: 13.5, lineHeight: 1.5, marginTop: 8 }}>
            <p><b>{t('Вже зараз:', 'Right now:')}</b> {t('експортуй тренування як GPX або TCX із Garmin Connect, Strava, Polar Flow, Coros, Suunto чи Samsung Health і натисни «Імпорт з годинника». Відстань, час і маршрут додадуться в щоденник за правильний день.', 'export a workout as GPX or TCX from Garmin Connect, Strava, Polar Flow, Coros, Suunto or Samsung Health and tap «Import from a watch». Distance, time and route go into your diary on the right day.')}</p>
            <p><b>{t('У мобільному застосунку:', 'In the mobile app:')}</b> {t('кроки, сон і тренування автоматично з Health Connect (Android) та Apple Health (iPhone, Apple Watch), фоновий GPS.', 'automatic steps, sleep and workouts from Health Connect (Android) and Apple Health (iPhone, Apple Watch), background GPS.')}</p>
            <p><b>{t('З сервером:', 'With a server:')}</b> {t('пряма синхронізація зі Strava, Garmin, Fitbit, Polar.', 'direct sync with Strava, Garmin, Fitbit, Polar.')}</p>
          </div>
        </details>
      </section>

      <section className="pad stack" style={{ marginTop: 22, gap: 12 }}>
        <h2 className="sectionT">{t('Записати тренування', 'Log a workout')}</h2>
        <div className="seg" role="tablist">
          {([['strength', t('Силове', 'Strength')], ['cardio', t('Кардіо', 'Cardio')], ['short', t('Коротке', 'Quick')]] as const).map(([k, l]) =>
            <button key={k} role="tab" aria-selected={mode === k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>)}
        </div>
        {mode === 'strength' && <StrengthForm />}
        {mode === 'cardio' && <CardioForm />}
        {mode === 'short' && SHORT.map(w => (
          <button key={w.id} className="row press" style={{ minHeight: 72 }} onClick={() => openSheet(close => <Timer w={w} close={close} />)}>
            <span style={{ width: 46, height: 46, borderRadius: 15, background: 'var(--mustard)', color: '#3B1E3F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="play" size={22} /></span>
            <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{t.l(w.name)}</span>
              <span className="muted" style={{ fontSize: 12.5 }}>{w.min} {t('хв', 'min')}, {w.moves.length} {plural(s.lang, w.moves.length, ['вправа', 'вправи', 'вправ'], ['move', 'moves'])}. {t(`${s.profile.cname} робить разом з тобою`, `${s.profile.cname} does it with you`)}</span></span>
          </button>
        ))}
      </section>

      <section className="pad" style={{ marginTop: 20 }}>
        <div className="row-c" style={{ background: 'var(--oliveLight)', borderRadius: 24, padding: 16, gap: 14 }}>
          <span style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--olive)', color: '#FFF8EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="rest" /></span>
          <div style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{d.rest ? t('Сьогодні день відпочинку', 'Today is a rest day') : t('День відпочинку', 'Rest day')}</span>
            <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.35, display: 'block' }}>{d.rest ? t('Відновлення зараховано, серія не переривається.', 'Recovery counted, your streak is safe.') : t('Відпочинок теж дає досвід і зберігає серію. М\'язи ростуть саме тоді.', 'Rest also earns XP and keeps your streak. Muscles grow while you rest.')}</span></div>
          {!d.rest && <button className="btn olive small press" onClick={() => act(x => setRest(x))}>{t('Відпочиваю', 'Resting')}</button>}
        </div>
      </section>

      {d.workouts.length > 0 && <section className="pad stack" style={{ marginTop: 20, gap: 8 }}>
        <h2 className="sectionT">{t('Сьогодні', 'Today')}</h2>
        {d.workouts.map(w => (
          <div key={w.id} className="row">
            <span style={{ color: 'var(--tomato)', display: 'flex' }}><Icon name="dumbbell" size={24} /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontWeight: 600, fontSize: 15 }}>{t.l(w.name)}</span>
              <span className="muted" style={{ fontSize: 12.5 }}>{w.detail}{w.km ? `, ${fmt(w.km, s.lang, 1)} ${t('км', 'km')}` : ''}{nn ? '' : `, ≈${fmt(w.kcal, s.lang)} ${t('ккал', 'kcal')}`}</span></span>
            <button className="icon-btn press" onClick={() => act(x => removeWorkout(x, w.id))} aria-label={t('Видалити тренування', 'Delete workout')}><Icon name="close" size={20} /></button>
          </div>
        ))}
      </section>}

      {Object.keys(s.prs).length > 0 && <section className="pad stack" style={{ marginTop: 20, gap: 8 }}>
        <h2 className="sectionT">{t('Мої рекорди', 'My records')}</h2>
        <div className="grid2">
          {Object.entries(s.prs).map(([id, pr]) => { const ex = STRENGTH.find(x => x.id === id); return (
            <div key={id} className="card stack" style={{ padding: 14, gap: 2 }}>
              <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{ex ? t.l(ex.name) : id}</span>
              <span className="disp" style={{ fontWeight: 700, fontSize: 18 }}>{pr.w ? `${fmt(pr.w, s.lang, 1)} ${t('кг', 'kg')} × ${pr.r}` : `${pr.r}`}</span>
            </div>); })}
        </div>
      </section>}
    </main>
  );
}

function StrengthForm() {
  const s = useApp();
  const t = useT();
  const [ex, setEx] = useState(STRENGTH[0].id);
  const [sets, setSets] = useState([{ w: '', r: '' }]);
  const [err, setErr] = useState('');
  const def = STRENGTH.find(x => x.id === ex)!;
  const pr = s.prs[ex];
  const save = () => {
    const parsed = sets.map(x => ({ w: parseFloat(x.w.replace(',', '.')) || 0, r: parseInt(x.r) || 0 })).filter(x => x.r > 0 && x.r < 1000 && x.w >= 0 && x.w < 1000);
    if (!parsed.length) { setErr(t('Додай хоча б один підхід з повтореннями.', 'Add at least one set with reps.')); return; }
    act(x => logStrength(x, ex, def.name, parsed, x.profile.weight));
    setSets([{ w: sets[sets.length - 1].w, r: '' }]);
  };
  return (
    <div className="stack" style={{ gap: 10 }}>
      <label className="stack" style={{ gap: 6 }}><span className="lbl">{t('Вправа', 'Exercise')}</span>
        <select className="field" value={ex} onChange={e => setEx(e.target.value)}>{STRENGTH.map(x => <option key={x.id} value={x.id}>{t.l(x.name)}</option>)}</select></label>
      {pr && <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{t('Твій рекорд', 'Your best')}: {pr.w ? `${pr.w} ${t('кг', 'kg')} × ${pr.r}` : pr.r}</span>}
      {sets.map((x, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
          <span className="lbl" style={{ width: 22, textAlign: 'center' }}>{i + 1}</span>
          <input className="field" inputMode="decimal" placeholder={def.bw ? t('кг (необов.)', 'kg (opt.)') : t('кг', 'kg')} value={x.w} aria-label={t(`Вага, підхід ${i + 1}`, `Weight, set ${i + 1}`)} onChange={e => { setSets(sets.map((y, j) => (j === i ? { ...y, w: e.target.value } : y))); setErr(''); }} />
          <input className="field" inputMode="numeric" placeholder={ex === 'plank' ? t('секунд', 'seconds') : t('повтори', 'reps')} value={x.r} aria-label={t(`Повторення, підхід ${i + 1}`, `Reps, set ${i + 1}`)} onChange={e => { setSets(sets.map((y, j) => (j === i ? { ...y, r: e.target.value } : y))); setErr(''); }} />
          <button className="icon-btn press" disabled={sets.length === 1} style={{ opacity: sets.length === 1 ? 0.3 : 1 }} onClick={() => setSets(sets.filter((_, j) => j !== i))} aria-label={t('Прибрати підхід', 'Remove set')}><Icon name="close" size={18} /></button>
        </div>
      ))}
      {err && <p role="alert" style={{ color: 'var(--tomato)', fontWeight: 600, fontSize: 13.5 }}>{err}</p>}
      <div className="row-c" style={{ gap: 8 }}>
        <button className="btn ghost press" style={{ flex: 1 }} onClick={() => sets.length < 12 && setSets([...sets, { w: sets[sets.length - 1].w, r: '' }])}>+ {t('підхід', 'set')}</button>
        <button className="btn press" style={{ flex: 1.3 }} onClick={save}>{t('Зберегти', 'Save')}</button>
      </div>
    </div>
  );
}

function CardioForm() {
  const s = useApp();
  const t = useT();
  const [type, setType] = useState(CARDIO[0].id);
  const [min, setMin] = useState(30);
  const c = CARDIO.find(x => x.id === type)!;
  const km = c.kmh ? Math.round(((c.kmh * min) / 60) * 10) / 10 : 0;
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row-c" style={{ gap: 8, flexWrap: 'wrap' }}>{CARDIO.map(x => <button key={x.id} className={'chip press' + (type === x.id ? ' on' : '')} onClick={() => setType(x.id)}>{t.l(x.name)}</button>)}</div>
      <label className="stack" style={{ gap: 6 }}><span className="lbl">{t('Тривалість', 'Duration')}: {min} {t('хв', 'min')}{km ? ` · ≈${fmt(km, s.lang, 1)} ${t('км', 'km')}` : ''}</span>
        <input type="range" min={5} max={180} step={5} value={min} onChange={e => setMin(+e.target.value)} style={{ width: '100%', accentColor: 'var(--tomato)', height: 32 }} /></label>
      <button className="btn block press" onClick={() => act(x => addWorkout(x, { kind: 'cardio', name: c.name, detail: `${min} ${t('хв', 'min')}`, min, kcal: metKcal(c.met, x.profile.weight, min), km: km || undefined }))}>{t('Записати', 'Log it')}</button>
    </div>
  );
}

function Timer({ w, close }: { w: ShortW; close: () => void }) {
  const s = useApp();
  const t = useT();
  const total = w.min * 60;
  const [left, setLeft] = useState(total);
  const [paused, setPaused] = useState(false);
  const done = useRef(false);
  const per = Math.max(20, Math.floor(total / w.moves.length));
  const mi = Math.min(w.moves.length - 1, Math.floor((total - left) / per));
  const prevMi = useRef(mi);
  const finish = (l = left) => {
    if (done.current) return; done.current = true;
    const m = Math.max(1, Math.round((total - l) / 60));
    close();
    act(x => addWorkout(x, { kind: 'short', name: w.name, detail: `${m} ${t('хв', 'min')}`, min: m, kcal: metKcal(w.met, x.profile.weight, m) }));
  };
  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => setLeft(l => { if (l <= 1) { clearInterval(iv); setTimeout(() => finish(0), 0); return 0; } return l - 1; }), 1000);
    return () => clearInterval(iv);
  }, [paused]);
  useEffect(() => { if (mi !== prevMi.current) { prevMi.current = mi; haptic(20); } }, [mi]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  return (
    <div className="stack" style={{ gap: 10, alignItems: 'center', textAlign: 'center' }}>
      <span className="lbl">{t.l(w.name)}</span>
      <div style={{ width: 190 }}><Character char={s.profile.char} eq={s.eq} stage={stageOf(s.level).index} exercise={!paused} /></div>
      <div className="disp" style={{ fontWeight: 800, fontSize: 54, letterSpacing: -2 }} role="timer">{mm}:{ss}</div>
      <div className="bar" style={{ width: '100%' }}><i style={{ width: `${((total - left) / total) * 100}%`, background: 'var(--tomato)' }} /></div>
      <p style={{ fontWeight: 700, fontSize: 19, marginTop: 4 }} aria-live="polite">{t.l(w.moves[mi])}</p>
      {mi < w.moves.length - 1 && <p className="muted" style={{ fontSize: 13 }}>{t('Далі', 'Next')}: {t.l(w.moves[mi + 1])}</p>}
      <div className="row-c" style={{ gap: 10, width: '100%', marginTop: 8 }}>
        <button className="btn ghost press" style={{ flex: 1 }} onClick={() => setPaused(!paused)}><Icon name={paused ? 'play' : 'pause'} size={20} />{paused ? t('Далі', 'Resume') : t('Пауза', 'Pause')}</button>
        <button className="btn press" style={{ flex: 1.3 }} onClick={() => finish()}>{t('Завершити', 'Finish')}</button>
      </div>
      <p className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>{t('Слухай тіло: якщо щось болить, зупинись. Можна завершити будь-коли, хвилини зарахуються.', 'Listen to your body: stop if anything hurts. You can finish anytime — minutes still count.')}</p>
    </div>
  );
}
