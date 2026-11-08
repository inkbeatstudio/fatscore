import { useRef, useState } from 'react';
import { act, useApp, replaceState, resetState, emitEffects, getState } from '../store';
import { useT, openSheet, Switch, Stepper, ScreenHeader } from '../components/ui';
import { Character } from '../components/art';
import { Icon } from '../components/Icon';
import { ACHS } from '../data/items';
import { CHARS } from '../data/characters';
import { logWeight, stageOf, streakInfo } from '../logic/game';
import { dailyNorm } from '../logic/nutrition';
import { addDays, today, parse } from '../logic/dates';
import { fmt, locale, plural } from '../i18n';
import { MOODS, MoodFace } from '../components/moods';
import { HabitEditor } from '../components/HabitEditor';
import type { CharId, State } from '../types';
import type { Tab } from '../App';

export default function Profile({ go }: { go: (t: Tab) => void }) {
  const s = useApp();
  const t = useT();
  const p = s.profile;
  const st = stageOf(s.level);
  const sk = streakInfo(s);
  const n = dailyNorm(p);
  const days = Object.values(s.days).filter(d => !d.demo);
  const totalWorkouts = days.reduce((a, d) => a + d.workouts.length, 0);
  const got = ACHS.filter(a => s.ach[a.id]).length;

  return (
    <main className="screen">
      <ScreenHeader title={t('Профіль', 'Profile')} onBack={() => go('home')} />

      <section className="pad row-c" style={{ gap: 16, marginTop: 8 }}>
        <div style={{ width: 112, flexShrink: 0 }}><Character char={p.char} eq={s.eq} stage={st.index} /></div>
        <div className="stack" style={{ gap: 4, minWidth: 0, flex: 1 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 22 }}>{p.cname}</span>
          <span className="muted" style={{ fontWeight: 600, fontSize: 14 }}>{t.l(CHARS[p.char].kind)}, {t('рівень', 'level')} {s.level}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{t('Стадія', 'Stage')} {st.index} {t('з', 'of')} 5: {t.l(st.name)}</span>
          {st.next && <span className="muted" style={{ fontSize: 12.5 }}>{t(`Наступна стадія на ${st.next} рівні`, `Next stage at level ${st.next}`)}</span>}
          <button className="chip press" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => openSheet(close => <CharPicker close={close} />)}>{t('Змінити персонажа', 'Change companion')}</button>
        </div>
      </section>

      <section className="pad grid3" style={{ marginTop: 18 }}>
        {[[sk.streak, plural(s.lang, sk.streak, ['день поспіль', 'дні поспіль', 'днів поспіль'], ['day streak', 'day streak'])],
          [sk.reserveLeft, t('днів запасу цього тижня', 'reserve days this week')],
          [`${sk.weekActive}/7`, t('активних днів тижня', 'active days this week')],
          [fmt(s.km, s.lang, 1), t('км подорожі', 'km travelled')],
          [totalWorkouts, plural(s.lang, totalWorkouts, ['тренування', 'тренування', 'тренувань'], ['workout', 'workouts'])],
          [`${got}/${ACHS.length}`, t('досягнень', 'achievements')]].map(([v, l], i) => (
          <div key={i} className="card stack" style={{ padding: '12px 10px', gap: 2, textAlign: 'center' }}>
            <span className="disp" style={{ fontWeight: 700, fontSize: 20 }}>{v}</span>
            <span className="muted" style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.25 }}>{l}</span>
          </div>
        ))}
      </section>
      <p className="pad muted" style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 10 }}>{t('Серія м\'яка: пропущений день покриває «день запасу» (два на тиждень). День відпочинку теж рахується як активний.', 'The streak is gentle: a missed day uses a «reserve day» (two per week). Rest days count as active too.')}</p>

      <section className="pad stack" style={{ marginTop: 22, gap: 12 }}>
        <h2 className="sectionT">{t('Досягнення', 'Achievements')}</h2>
        <div className="grid3">
          {ACHS.map(a => { const has = !!s.ach[a.id]; const hide = a.secret && !has; return (
            <div key={a.id} className="card stack" style={{ padding: '12px 8px', alignItems: 'center', gap: 6, textAlign: 'center', minHeight: 122, opacity: has ? 1 : 0.55 }}>
              <span style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: has ? 'var(--mustard)' : 'var(--track)', color: '#3B1E3F' }}><Icon name={hide ? 'lock' : has ? 'trophy' : 'star'} size={22} /></span>
              <span style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2 }}>{hide ? t('Таємне', 'Secret') : t.l(a.name)}</span>
              <span className="muted" style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.25 }}>{hide ? t('Відкрий, щоб дізнатися', 'Unlock to reveal') : t.l(a.desc)}</span>
            </div>); })}
        </div>
      </section>

      <Progress />

      <section className="pad stack" style={{ marginTop: 24, gap: 10 }}>
        <h2 className="sectionT">{t('Налаштування', 'Settings')}</h2>
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 14 }}>
          <span style={{ fontWeight: 600 }}>{t('Мова', 'Language')}</span>
          <div className="seg"><button className={s.lang === 'uk' ? 'on' : ''} onClick={() => act(x => { x.lang = 'uk'; })}>Українська</button><button className={s.lang === 'en' ? 'on' : ''} onClick={() => act(x => { x.lang = 'en'; })}>English</button></div>
        </div>
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 14 }}>
          <span style={{ fontWeight: 600 }}>{t('Тема', 'Theme')}</span>
          <div className="seg">{([['light', 'Світла', 'Light'], ['dark', 'Темна', 'Dark'], ['system', 'Як у системі', 'System']] as const).map(([k, uk, en]) => <button key={k} className={s.settings.theme === k ? 'on' : ''} onClick={() => act(x => { x.settings.theme = k; })}>{t(uk, en)}</button>)}</div>
        </div>
        <Switch on={s.settings.sound} onChange={() => act(x => { x.settings.sound = !x.settings.sound; })} label={t('Звуки', 'Sounds')} sub={t('Мелодії святкувань і монет', 'Celebration and coin chimes')} />
        <Switch on={s.settings.haptics} onChange={() => act(x => { x.settings.haptics = !x.settings.haptics; })} label={t('Вібрація', 'Haptics')} sub={t('На Android. iPhone не дає сайтам вібрувати', 'On Android. iPhone doesn\'t allow websites to vibrate')} />
        <Switch on={p.noNum} onChange={() => act(x => { x.profile.noNum = !x.profile.noNum; })} label={t('Режим без цифр', 'No-numbers mode')} sub={t('Без калорій і грамів, лише кольори тарілки', 'No calories or grams, just plate colours')} />
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, padding: 14 }}>
          <span style={{ fontWeight: 600 }}>{t('Норма води, склянок по 250 мл', 'Water goal, 250 ml glasses')}</span>
          <Stepper value={p.waterGoal} onChange={v => act(x => { x.profile.waterGoal = v; })} min={4} max={16} />
        </div>
        {!p.noNum && <div className="row" style={{ padding: 14, flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>{t('Денна норма', 'Daily target')}: {fmt(n.target, s.lang)} {t('ккал', 'kcal')}</span>
          <span className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>{t(`Білки ${n.prot} г, жири ${n.fat} г, вуглеводи ${n.carb} г, клітковина ${n.fiber} г. Нижче ${n.min} ккал норма не опускається.`, `Protein ${n.prot} g, fat ${n.fat} g, carbs ${n.carb} g, fibre ${n.fiber} g. Never below ${n.min} kcal.`)}</span>
        </div>}
        <button className="btn ghost block press" onClick={() => act(x => { x.onb = 2; })}><Icon name="edit" size={20} />{t('Змінити мої дані й мету', 'Edit my details and goal')}</button>
        <button className="btn ghost block press" onClick={() => openSheet(close => <HabitEditor close={close} />)}><Icon name="leaf" size={20} />{t('Мої звички', 'My habits')}</button>
        <Backup />
        <button className="btn ghost block press" style={{ color: 'var(--tomato)' }} onClick={() => openSheet(close => (
          <div className="stack" style={{ gap: 12 }}>
            <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Почати з нуля?', 'Start over?')}</h2>
            <p className="muted" style={{ lineHeight: 1.45 }}>{t('Зникнуть усі записи, рівень, монети й речі на цьому пристрої. Спершу можна зберегти резервну копію.', 'All entries, levels, coins and items on this device will be erased. You can save a backup first.')}</p>
            <button className="btn block press" onClick={() => { resetState(); close(); location.hash = ''; }}>{t('Так, стерти все', 'Yes, erase everything')}</button>
            <button className="btn ghost block press" onClick={close} data-autofocus>{t('Залишити як є', 'Keep my data')}</button>
          </div>))}><Icon name="trash" size={20} />{t('Почати з нуля', 'Start over')}</button>
      </section>

      <section className="pad stack" style={{ marginTop: 24, gap: 8 }}>
        <h2 className="sectionT">{t('Про застосунок', 'About')}</h2>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{t('Fatscore не є медичною порадою і не замінює лікаря чи дієтолога. Якщо маєш захворювання, вагітність або розлад харчової поведінки, порадься з фахівцем. Застосунок для людей від 18 років.', 'Fatscore is not medical advice and doesn\'t replace a doctor or dietitian. If you have a health condition, are pregnant or have an eating disorder, talk to a professional. For adults 18+.')}</p>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{t('Приватність: усі дані зберігаються лише в цьому браузері (IndexedDB). Ми нічого не надсилаємо на сервери. В інтернет іде лише пошуковий запит або штрихкод до Open Food Facts, коли ти сам шукаєш продукт.', 'Privacy: all data stays in this browser (IndexedDB). Nothing is sent to our servers. Only your search text or barcode goes to Open Food Facts when you search for a product.')}</p>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{t('Якщо їжа чи вага стали джерелом тривоги, тобі не треба справлятися самому. Звернись до лікаря або людини, якій довіряєш.', 'If food or weight have become a source of anxiety, you don\'t have to deal with it alone. Reach out to a doctor or someone you trust.')}</p>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Fatscore v0.1 · {t('Дані про продукти', 'Food data')}: Open Food Facts (ODbL)</p>
      </section>
    </main>
  );
}

function Progress() {
  const s = useApp();
  const t = useT();
  const [w, setW] = useState('');
  const weights = Object.values(s.days).filter(d => d.weight != null && !d.demo).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  const last7 = Array.from({ length: 7 }, (_, i) => s.days[addDays(today(), i - 6)]);
  const last14 = Array.from({ length: 14 }, (_, i) => s.days[addDays(today(), i - 13)]);
  const dayLbl = (k: string) => parse(k).toLocaleDateString(locale(s.lang), { weekday: 'narrow' });
  const nn = s.profile.noNum;
  let chart = null;
  if (weights.length >= 2) {
    const vals = weights.map(d => d.weight!);
    const mn = Math.min(...vals) - 0.5, mx = Math.max(...vals) + 0.5;
    const pts = vals.map((v, i) => [10 + (i / (vals.length - 1)) * 300, 90 - ((v - mn) / (mx - mn)) * 80]);
    chart = <svg viewBox="0 0 320 100" width="100%" height="100" role="img" aria-label={t('Графік ваги', 'Weight chart')}>
      <path d={'M' + pts.map(p => p.join(' ')).join(' L')} fill="none" stroke="var(--tomato)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--tomato)" />)}
    </svg>;
  }
  return (
    <section className="pad stack" style={{ marginTop: 24, gap: 12 }}>
      <h2 className="sectionT">{t('Прогрес', 'Progress')}</h2>
      <div className="card stack" style={{ padding: 14, gap: 10 }}>
        <span style={{ fontWeight: 700 }}>{t('Сон за тиждень', 'Sleep this week')}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 6, alignItems: 'end', height: 110 }}>
          {last7.map((d, i) => { const h = d?.sleep?.hours || 0; const key = addDays(today(), i - 6); return (
            <div key={i} className="stack" style={{ alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700 }}>{h ? fmt(h, s.lang, 1) : ''}</span>
              <div style={{ width: '70%', height: `${Math.min(100, (h / 10) * 100) * 0.7}%`, minHeight: 4, borderRadius: 8, background: h >= 7 ? 'var(--olive)' : h ? 'var(--mustard)' : 'var(--track)' }} />
              <span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>{dayLbl(key)}</span>
            </div>); })}
        </div>
      </div>
      <div className="card stack" style={{ padding: 14, gap: 10 }}>
        <span style={{ fontWeight: 700 }}>{t('Настрій за два тижні', 'Mood, last two weeks')}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0,1fr))', gap: 3 }}>
          {last14.map((d, i) => { const m = MOODS.find(x => x.v === d?.mood); return (
            <span key={i} title={m ? t(m.uk, m.en) : ''} style={{ aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: m ? ['', '#C9B7C9', '#F3D8AE', '#C9D58E', '#F0B429'][m.v] : 'var(--track)', color: '#3B1E3F' }}>{m && <MoodFace path={m.path} size={16} />}</span>); })}
        </div>
        <MoodInsight />
      </div>
      {!nn && <div className="card stack" style={{ padding: 14, gap: 10 }}>
        <span style={{ fontWeight: 700 }}>{t('Вага', 'Weight')}</span>
        {chart || <p className="muted" style={{ fontSize: 13.5 }}>{t('Записуй вагу раз на кілька днів, і тут з\'явиться графік. Вага коливається щодня — дивись на тенденцію.', 'Log your weight every few days and a chart will appear. Weight fluctuates daily — look at the trend.')}</p>}
        <form className="row-c" style={{ gap: 8 }} onSubmit={e => { e.preventDefault(); const v = parseFloat(w.replace(',', '.')); if (v >= 30 && v <= 300) { act(x => logWeight(x, v)); setW(''); } }}>
          <input className="field" inputMode="decimal" value={w} onChange={e => setW(e.target.value)} placeholder={t(`Сьогодні, кг (зараз ${s.profile.weight})`, `Today, kg (now ${s.profile.weight})`)} aria-label={t('Вага сьогодні', 'Weight today')} />
          <button className="btn small press" type="submit" style={{ minHeight: 52 }}>{t('Записати', 'Log')}</button>
        </form>
        <span className="muted" style={{ fontSize: 12 }}>{t('Вагу бачиш лише ти. Її можна не записувати зовсім.', 'Only you see your weight. You don\'t have to log it at all.')}</span>
      </div>}
    </section>
  );
}

/** Зв'язок «рух — настрій» з власних даних, без медичних висновків */
function MoodInsight() {
  const s = useApp();
  const t = useT();
  const days = Object.values(s.days).filter(d => d.mood != null && !d.demo);
  if (days.length < 6) return <p className="muted" style={{ fontSize: 13 }}>{t('Через тиждень-два тут з\'являться твої закономірності.', 'In a week or two your patterns will show up here.')}</p>;
  const act1 = days.filter(d => d.workouts.length || d.steps >= 5000), rest = days.filter(d => !(d.workouts.length || d.steps >= 5000));
  if (act1.length < 2 || rest.length < 2) return null;
  const avg = (a: typeof days) => a.reduce((x, d) => x + (d.mood || 0), 0) / a.length;
  const diff = avg(act1) - avg(rest);
  if (Math.abs(diff) < 0.3) return <p style={{ fontSize: 13.5 }}>{t('Поки настрій не залежить помітно від руху. Продовжуй відмічати.', 'So far your mood doesn\'t clearly depend on movement. Keep checking in.')}</p>;
  return <p style={{ fontSize: 13.5, fontWeight: 600 }}>{diff > 0 ? t('У дні з рухом твій настрій у середньому кращий.', 'On active days your mood tends to be better.') : t('У спокійні дні настрій буває кращим. Відпочинок теж важливий.', 'Your mood tends to be better on quiet days. Rest matters too.')}</p>;
}

function CharPicker({ close }: { close: () => void }) {
  const s = useApp();
  const t = useT();
  return (
    <div className="stack" style={{ gap: 10 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Обери персонажа', 'Choose a companion')}</h2>
      <p className="muted" style={{ fontSize: 13.5 }}>{t('Рівень, речі й досягнення зберігаються.', 'Level, items and achievements are kept.')}</p>
      {(Object.keys(CHARS) as CharId[]).map(k => (
        <button key={k} className={'opt press' + (s.profile.char === k ? ' sel' : '')} onClick={() => { act(x => { const old = CHARS[x.profile.char].name; if (x.profile.cname === old.uk || x.profile.cname === old.en) x.profile.cname = CHARS[k].name[x.lang]; x.profile.char = k; }); close(); }}>
          <div style={{ width: 64, flexShrink: 0 }}><Character char={k} stage={stageOf(s.level).index} eq={s.eq} /></div>
          <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700 }}>{t.l(CHARS[k].name)}</span><span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{t.l(CHARS[k].vibe)}</span></span>
        </button>
      ))}
    </div>
  );
}

function Backup() {
  const t = useT();
  const file = useRef<HTMLInputElement>(null);
  const exportData = () => {
    const blob = new Blob([JSON.stringify(useAppSnapshot(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fatscore-backup-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    emitEffects([{ type: 'toast', icon: 'download', text: t('Резервну копію збережено', 'Backup saved') }]);
  };
  const importData = async (f: File) => {
    try {
      const j = JSON.parse(await f.text()) as State;
      if (!j || typeof j !== 'object' || !j.profile || !j.days) throw new Error('bad');
      replaceState(j);
      emitEffects([{ type: 'toast', icon: 'check', text: t('Дані відновлено', 'Data restored') }]);
    } catch { emitEffects([{ type: 'toast', icon: 'info', text: t('Це не схоже на файл резервної копії Fatscore', 'This doesn\'t look like a Fatscore backup') }]); }
  };
  return (
    <div className="grid2">
      <button className="btn ghost small press" onClick={exportData}><Icon name="download" size={18} />{t('Зберегти копію', 'Back up')}</button>
      <button className="btn ghost small press" onClick={() => file.current?.click()}><Icon name="upload" size={18} />{t('Відновити', 'Restore')}</button>
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ''; }} />
    </div>
  );
}
const useAppSnapshot = () => getState();
