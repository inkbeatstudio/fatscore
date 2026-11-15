import { useRef, useState } from 'react';
import { act, useApp, replaceState, resetState, emitEffects, getState } from '../store';
import { useT, openSheet, Switch, Stepper, ScreenHeader } from '../components/ui';
import { openReport } from '../components/Report';
import { Character } from '../components/art';
import { Coin, Icon } from '../components/Icon';
import { CHAR_IDS } from '../data/characters';
import { need, stageOf, streakInfo } from '../logic/game';
import { dailyNorm } from '../logic/nutrition';
import { today } from '../logic/dates';
import { fmt, plural } from '../i18n';
import { HabitEditor } from '../components/HabitEditor';
import StylePicker from '../components/StylePicker';
import { back, go } from '../nav';
import type { State } from '../types';

export default function Profile() {
  const s = useApp();
  const t = useT();
  const p = s.profile;
  const n = dailyNorm(p);
  const sk = streakInfo(s);
  const days = Object.values(s.days).filter(d => !d.demo);
  const totalWorkouts = days.reduce((a, d) => a + d.workouts.length, 0);
  const [uname, setUname] = useState(p.uname);

  return (
    <main className="screen">
      <ScreenHeader title={t('Профіль', 'Profile')} onBack={back} />

      <section className="pad" style={{ marginTop: 8 }}>
        <div className="row-c card" style={{ gap: 14, padding: 16 }}>
          <div style={{ width: 84, flexShrink: 0 }}><Character char={p.char} eq={s.eq} stage={stageOf(s.chars[p.char].lv).index} /></div>
          <div className="stack" style={{ gap: 6, flex: 1, minWidth: 0 }}>
            <input className="field" value={uname} maxLength={20} placeholder={t('Твоє ім\'я', 'Your name')} onChange={e => setUname(e.target.value)} onBlur={() => act(x => { x.profile.uname = uname.trim(); })} style={{ minHeight: 42, fontSize: 17, fontWeight: 700 }} aria-label={t('Ім\'я', 'Name')} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{t('Рівень профілю', 'Profile level')} {s.level}</span>
            <div className="bar" style={{ height: 8 }}><i style={{ width: Math.min(100, (s.xp / need(s.level)) * 100) + '%' }} /></div>
            <div className="row-c" style={{ gap: 12, fontSize: 13.5, fontWeight: 700 }}><span className="row-c" style={{ gap: 4 }}><Coin size={17} />{fmt(s.coins, s.lang)}</span><span className="row-c" style={{ gap: 4 }}><Icon name="star" size={16} stroke={2.6} style={{ color: 'var(--gold)' }} />{s.stars}</span></div>
          </div>
        </div>
      </section>

      <section className="pad grid3" style={{ marginTop: 10 }}>
        {[[s.stats.bestStreak || sk.streak, t('найдовша серія', 'best streak')], [fmt(s.km, s.lang, 1), t('км подорожі', 'km travelled')], [totalWorkouts, plural(s.lang, totalWorkouts, ['тренування', 'тренування', 'тренувань'], ['workout', 'workouts'])],
          [Object.keys(s.ach).length, t('досягнень', 'achievements')], [`${CHAR_IDS.filter(c => s.chars[c].own).length}/6`, t('героїв', 'heroes')], [s.owned.length, t('речей', 'items')]].map(([v, l], i) => (
          <div key={i} className="card stack" style={{ padding: '12px 8px', gap: 2, textAlign: 'center' }}><span className="disp" style={{ fontWeight: 700, fontSize: 19 }}>{v}</span><span className="muted" style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.25 }}>{l}</span></div>
        ))}
      </section>

      <section className="pad" style={{ marginTop: 12 }}>
        <button className="row press" onClick={() => go('friends')} style={{ minHeight: 66 }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--mustard)', color: '#3B1E3F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="user" size={24} /></span>
          <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700 }}>{t('Друзі', 'Friends')}</span><span className="muted" style={{ fontSize: 13 }}>{t('Твій код', 'Your code')}: {s.friendCode}</span></span>
          <Icon name="chevron" size={20} style={{ color: 'var(--ink2)' }} />
        </button>
      </section>

      <section className="pad stack" style={{ marginTop: 24, gap: 10 }}>
        <h2 className="sectionT">{t('Налаштування', 'Settings')}</h2>
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 14 }}>
          <span style={{ fontWeight: 600 }}>{t('Стиль оформлення', 'Design style')}</span>
          <StylePicker />
        </div>
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 14 }}>
          <span style={{ fontWeight: 600 }}>{t('Тема', 'Theme')}</span>
          <div className="seg">{([['light', 'Світла', 'Light'], ['dark', 'Темна', 'Dark'], ['system', 'Як у системі', 'System']] as const).map(([k, uk, en]) => <button key={k} className={s.settings.theme === k ? 'on' : ''} onClick={() => act(x => { x.settings.theme = k; })}>{t(uk, en)}</button>)}</div>
        </div>
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 14 }}>
          <span style={{ fontWeight: 600 }}>{t('Мова', 'Language')}</span>
          <div className="seg"><button className={s.lang === 'uk' ? 'on' : ''} onClick={() => act(x => { x.lang = 'uk'; })}>Українська</button><button className={s.lang === 'en' ? 'on' : ''} onClick={() => act(x => { x.lang = 'en'; })}>English</button></div>
        </div>
        <Switch on={s.settings.calm} onChange={() => act(x => { x.settings.calm = !x.settings.calm; })} label={t('Спокійний режим', 'Calm mode')} sub={t('Без лічильника серій і нагадувань про них. Для тих, кого ігрові цифри тиснуть.', 'No streak counter or streak nudges. For anyone who finds game numbers stressful.')} />
        <Switch on={p.noNum} onChange={() => act(x => { x.profile.noNum = !x.profile.noNum; })} label={t('Режим без цифр', 'No-numbers mode')} sub={t('Без калорій, грамів і ваги, лише кольори тарілки', 'No calories, grams or weight, just plate colours')} />
        <Switch on={s.settings.nudges} onChange={() => act(x => { x.settings.nudges = !x.settings.nudges; })} label={t('Мʼякі нагадування', 'Gentle reminders')} sub={t('Підказки на головній про воду й прийоми їжі. Одна за раз, можна сховати до завтра.', 'Hints on the home screen about water and meals. One at a time, hide until tomorrow.')} />
        {!p.noNum && <Switch on={s.settings.weightChart} onChange={() => act(x => { x.settings.weightChart = !x.settings.weightChart; })} label={t('Графік ваги в трендах', 'Weight chart in Trends')} sub={t('Вимкнено, доки сам не захочеш. Показує згладжений напрямок, а не щоденні стрибки.', 'Off until you want it. Shows the smoothed direction, not daily jumps.')} />}
        <Switch on={s.settings.sound} onChange={() => act(x => { x.settings.sound = !x.settings.sound; })} label={t('Звуки', 'Sounds')} sub={t('Мелодії святкувань і монет', 'Celebration and coin chimes')} />
        <Switch on={s.settings.haptics} onChange={() => act(x => { x.settings.haptics = !x.settings.haptics; })} label={t('Вібрація', 'Haptics')} sub={t('На Android. iPhone не дає сайтам вібрувати', 'On Android. iPhone doesn\'t allow websites to vibrate')} />
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
        <button className="btn ghost block press" onClick={() => openReport()}><Icon name="file" size={20} />{t('Звіт для лікаря чи дієтолога', 'Report for a doctor or dietitian')}</button>
        <Backup />
        <button className="btn ghost block press" style={{ color: 'var(--tomato)' }} onClick={() => openSheet(close => (
          <div className="stack" style={{ gap: 12 }}>
            <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Почати з нуля?', 'Start over?')}</h2>
            <p className="muted" style={{ lineHeight: 1.45 }}>{t('Зникнуть усі записи, герої, монети й речі на цьому пристрої. Спершу можна зберегти резервну копію.', 'All entries, heroes, coins and items on this device will be erased. You can save a backup first.')}</p>
            <button className="btn block press" onClick={() => { resetState(); close(); go('home'); }}>{t('Так, стерти все', 'Yes, erase everything')}</button>
            <button className="btn ghost block press" onClick={close} data-autofocus>{t('Залишити як є', 'Keep my data')}</button>
          </div>))}><Icon name="trash" size={20} />{t('Почати з нуля', 'Start over')}</button>
      </section>

      <section className="pad stack" style={{ marginTop: 24, gap: 8 }}>
        <h2 className="sectionT">{t('Про застосунок', 'About')}</h2>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{t('Fatscore не є медичною порадою і не замінює лікаря чи дієтолога. Якщо маєш захворювання, вагітність або розлад харчової поведінки, порадься з фахівцем. Застосунок для людей від 18 років.', 'Fatscore is not medical advice and doesn\'t replace a doctor or dietitian. If you have a health condition, are pregnant or have an eating disorder, talk to a professional. For adults 18+.')}</p>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{t('Приватність: усі дані, фото й маршрути зберігаються лише в цьому браузері. В інтернет іде лише пошуковий запит або штрихкод до Open Food Facts і запит плиток мапи OpenStreetMap.', 'Privacy: all data, photos and routes stay in this browser. Only food searches or barcodes go to Open Food Facts, and map tiles are loaded from OpenStreetMap.')}</p>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{t('Якщо їжа чи вага стали джерелом тривоги, тобі не треба справлятися самому. Звернись до лікаря або людини, якій довіряєш.', 'If food or weight have become a source of anxiety, you don\'t have to deal with it alone. Reach out to a doctor or someone you trust.')}</p>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Fatscore v0.3 · Open Food Facts (ODbL) · © OpenStreetMap</p>
      </section>
    </main>
  );
}

function Backup() {
  const t = useT();
  const file = useRef<HTMLInputElement>(null);
  const exportData = () => {
    const blob = new Blob([JSON.stringify(getState())], { type: 'application/json' });
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
