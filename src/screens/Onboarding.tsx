import { useState } from 'react';
import { motion } from 'motion/react';
import { act, useApp } from '../store';
import { useT, Switch } from '../components/ui';
import { Character } from '../components/art';
import { Icon } from '../components/Icon';
import { CHARS } from '../data/characters';
import { dailyNorm } from '../logic/nutrition';
import { fmt } from '../i18n';
import { addDays, today } from '../logic/dates';
import { newDay, uid } from '../logic/game';
import { FOOD_BY_ID } from '../data/foods';
import type { CharId, Goal, MealKey, State } from '../types';

const GOALS: [Goal, string, string, string, string][] = [
  ['lose', 'Схуднути', 'Lose weight', 'Помірно, без зривів і голодування', 'Gently, no crash diets'],
  ['keep', 'Тримати вагу', 'Maintain', 'Баланс і енергія на щодень', 'Balance and daily energy'],
  ['gain', 'Набрати масу', 'Build muscle', 'Сила, білок, ріст у вагах', 'Strength, protein, progress'],
  ['habits', 'Просто здорові звички', 'Just healthy habits', 'Вода, рух, сон. Без цифр', 'Water, movement, sleep. No numbers']
];
const ACTS: [number, string, string, string, string][] = [
  [1.2, 'Майже без руху', 'Mostly sitting', 'Сидяча робота, мало ходжу', 'Desk job, little walking'],
  [1.375, 'Трохи руху', 'Lightly active', 'Прогулянки, 1–3 тренування на тиждень', 'Walks, 1–3 workouts a week'],
  [1.55, 'Помірна активність', 'Moderately active', '3–5 тренувань на тиждень', '3–5 workouts a week'],
  [1.725, 'Висока активність', 'Very active', '6–7 тренувань на тиждень', '6–7 workouts a week'],
  [1.9, 'Дуже висока', 'Athlete level', 'Фізична робота або двічі на день', 'Physical job or twice a day']
];

export default function Onboarding() {
  const s = useApp();
  const t = useT();
  const p = s.profile;
  const step = s.onb;
  const set = (fn: (st: State) => void) => act(st => { fn(st); });
  const next = () => { set(st => { st.onb++; }); scrollTo(0, 0); };
  const [nums, setNums] = useState({ age: String(p.age), height: String(p.height), weight: String(p.weight) });
  const [err, setErr] = useState('');
  const [names, setNames] = useState({ cname: p.cname, uname: p.uname });

  const dots = <div className="row-c" style={{ gap: 6 }} aria-hidden="true">{[1, 2, 3, 4, 5].map(i => <i key={i} style={{ height: 6, width: step >= i ? 34 : 18, borderRadius: 9, background: step >= i ? 'var(--ink)' : 'var(--line)', transition: 'all .4s var(--spring)' }} />)}</div>;
  const wrap = (children: React.ReactNode, center = false) => (
    <motion.main key={step} className="stack" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{ minHeight: '100dvh', padding: 'calc(24px + var(--safeT)) 22px calc(28px + var(--safeB))', gap: 20, justifyContent: center ? 'space-between' : undefined }}>
      {children}
    </motion.main>
  );
  const h1 = (x: string) => <h1 className="disp" style={{ fontWeight: 800, fontSize: 30, lineHeight: 1.08, letterSpacing: -0.8 }}>{x}</h1>;

  if (step === 0) return wrap(<>
    <div className="row-c" style={{ justifyContent: 'space-between' }}>
      <span className="disp" style={{ fontWeight: 800, fontSize: 18 }}>Fatscore</span>
      <div className="seg" style={{ width: 132 }}>
        <button className={s.lang === 'uk' ? 'on' : ''} onClick={() => set(st => { st.lang = 'uk'; st.profile.cname = CHARS[st.profile.char].name.uk; })}>УКР</button>
        <button className={s.lang === 'en' ? 'on' : ''} onClick={() => set(st => { st.lang = 'en'; st.profile.cname = CHARS[st.profile.char].name.en; })}>ENG</button>
      </div>
    </div>
    <div className="stack" style={{ gap: 14 }}>
      <span className="disp" style={{ fontWeight: 800, fontSize: 46, letterSpacing: -1.6, lineHeight: 0.95 }}>{t('Турбота про себе як гра', 'Self-care, played like a game')}</span>
      <p style={{ fontSize: 17, lineHeight: 1.45, fontWeight: 500, maxWidth: 340 }}>{t('Їжа, рух, вода й відпочинок прокачують твого персонажа. Він радіє кожній дрібниці й ніколи не соромить.', 'Food, movement, water and rest level up your companion. It cheers every small win and never shames you.')}</p>
    </div>
    <div style={{ position: 'relative', height: 260, flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: '50%', top: 10, width: 270, height: 270, marginLeft: -135, borderRadius: '50%', background: 'var(--blob)' }} />
      <div style={{ position: 'absolute', left: '-4%', top: 80, width: '40%', transform: 'rotate(-8deg)' }}><Character char="hare" eq={{ head: 'band' }} /></div>
      <div style={{ position: 'absolute', left: '27%', top: 20, width: '46%' }}><Character char="bear" eq={{ neck: 'scarf' }} /></div>
      <div style={{ position: 'absolute', right: '-4%', top: 90, width: '38%', transform: 'rotate(7deg)' }}><Character char="raccoon" eq={{ face: 'glasses' }} /></div>
    </div>
    <button className="btn block press" onClick={next}>{t('Почати', 'Get started')}</button>
  </>, true);

  if (step === 1) return wrap(<>
    {dots}{h1(t('Кілька важливих слів', 'A few important words'))}
    <p className="muted" style={{ fontSize: 15.5, lineHeight: 1.5 }}>{t('Fatscore допомагає будувати звички. Він не замінює лікаря і не ставить діагнозів.', 'Fatscore helps build habits. It doesn\'t replace a doctor or make diagnoses.')}</p>
    {(['adult', 'disc'] as const).map(k => (
      <button key={k} className={'check press' + (p[k] ? ' on' : '')} role="checkbox" aria-checked={p[k]} onClick={() => set(st => { st.profile[k] = !st.profile[k]; })}>
        <span className="bx">{p[k] && <Icon name="check" size={20} stroke={3} />}</span>
        {k === 'adult' ? t('Мені вже виповнилося 18 років', 'I am 18 or older')
          : t('Розумію, що це не медична порада. Якщо маю захворювання, вагітність або розлад харчової поведінки, спершу поговорю з лікарем.', 'I understand this is not medical advice. If I have a health condition, am pregnant or have an eating disorder, I\'ll talk to a doctor first.')}
      </button>
    ))}
    <p className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{t('Усі твої дані зберігаються лише на цьому пристрої. Ніяких акаунтів і серверів.', 'All your data stays on this device. No accounts, no servers.')}</p>
    <div style={{ flex: 1 }} />
    <button className="btn block press" disabled={!(p.adult && p.disc)} onClick={next}>{t('Далі', 'Next')}</button>
  </>);

  if (step === 2) return wrap(<>
    {dots}{h1(t('Що для тебе зараз головне?', 'What matters most right now?'))}
    <div className="stack" style={{ gap: 10 }}>
      {GOALS.map(([k, uk, en, suk, sen]) => (
        <button key={k} className={'opt press' + (p.goal === k ? ' sel' : '')} style={{ minHeight: 74 }} onClick={() => set(st => { st.profile.goal = k; if (k === 'habits') st.profile.noNum = true; })} aria-pressed={p.goal === k}>
          <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700 }}>{t(uk, en)}</span><span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{t(suk, sen)}</span></span>
          {p.goal === k && <span style={{ color: 'var(--olive)' }}><Icon name="check" stroke={3} /></span>}
        </button>
      ))}
    </div>
    <Switch on={p.noNum} onChange={() => set(st => { st.profile.noNum = !st.profile.noNum; })} label={t('Режим без цифр', 'No-numbers mode')} sub={t('Без калорій і грамів, лише кольори тарілки. Можна змінити будь-коли.', 'No calories or grams, just plate colours. Change anytime.')} />
    <div style={{ flex: 1 }} />
    <button className="btn block press" onClick={next}>{t('Далі', 'Next')}</button>
  </>);

  if (step === 3) {
    const lim = { age: [18, 100], height: [120, 230], weight: [35, 300] } as const;
    const save = () => {
      const v = { age: parseFloat(nums.age), height: parseFloat(nums.height.replace(',', '.')), weight: parseFloat(nums.weight.replace(',', '.')) };
      const ok = (Object.keys(lim) as (keyof typeof lim)[]).every(k => isFinite(v[k]) && v[k] >= lim[k][0] && v[k] <= lim[k][1]);
      if (!ok) { setErr(t('Перевір цифри: вік 18–100, зріст 120–230 см, вага 35–300 кг.', 'Check the numbers: age 18–100, height 120–230 cm, weight 35–300 kg.')); return; }
      set(st => { Object.assign(st.profile, v); st.days[today()].weight = v.weight; st.onb++; });
      scrollTo(0, 0);
    };
    return wrap(<>
      {dots}{h1(t('Трохи про тебе', 'A bit about you'))}
      <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.45 }}>{t('Потрібно для формули Міффліна — Сан Жеора. Вона рахує, скільки енергії тобі потрібно щодня.', 'This feeds the Mifflin–St Jeor formula, which estimates your daily energy needs.')}</p>
      <div className="seg">
        <button className={p.sex === 'f' ? 'on' : ''} onClick={() => set(st => { st.profile.sex = 'f'; })}>{t('Жіноча', 'Female')}</button>
        <button className={p.sex === 'm' ? 'on' : ''} onClick={() => set(st => { st.profile.sex = 'm'; })}>{t('Чоловіча', 'Male')}</button>
      </div>
      <div className="grid3">
        {([['age', t('Вік', 'Age'), 'numeric'], ['height', t('Зріст, см', 'Height, cm'), 'numeric'], ['weight', t('Вага, кг', 'Weight, kg'), 'decimal']] as const).map(([k, l, im]) => (
          <label key={k} className="stack" style={{ gap: 6 }}><span className="lbl">{l}</span>
            <input className="field" inputMode={im} value={nums[k]} onChange={e => { setNums({ ...nums, [k]: e.target.value }); setErr(''); }} /></label>
        ))}
      </div>
      {err && <p role="alert" style={{ color: 'var(--tomato)', fontSize: 13.5, fontWeight: 600 }}>{err}</p>}
      <span className="lbl">{t('Звичайний день', 'A typical day')}</span>
      <div className="stack" style={{ gap: 8 }}>
        {ACTS.map(([k, uk, en, suk, sen]) => (
          <button key={k} className={'opt press' + (p.act === k ? ' sel' : '')} style={{ minHeight: 62 }} onClick={() => set(st => { st.profile.act = k; })} aria-pressed={p.act === k}>
            <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{t(uk, en)}</span><span className="muted" style={{ fontSize: 12.5, fontWeight: 500 }}>{t(suk, sen)}</span></span>
          </button>
        ))}
      </div>
      <button className="btn block press" onClick={save}>{t('Порахувати', 'Calculate')}</button>
    </>);
  }

  if (step === 4) {
    const n = dailyNorm(p);
    const goalTxt = p.goal === 'lose' ? t('Мінус до 500 ккал від підтримки, щоб худнути не швидше ніж ~0,5 кг на тиждень.', 'Up to 500 kcal below maintenance, so you lose no faster than ~0.5 kg a week.')
      : p.goal === 'gain' ? t('Невеликий профіцит для набору маси без зайвого жиру.', 'A small surplus to build muscle without excess fat.')
        : t('Енергії рівно стільки, скільки витрачаєш.', 'As much energy as you use.');
    return wrap(<>
      {dots}{h1(p.noNum ? t('Готово', 'All set') : t('Твоя денна норма', 'Your daily target'))}
      {p.noNum ? <p style={{ fontSize: 16, lineHeight: 1.5 }}>{t('Ти обрав режим без цифр. Замість калорій персонаж стежитиме за кольорами на тарілці, водою, рухом і сном.', 'You chose no-numbers mode. Instead of calories, your companion will track plate colours, water, movement and sleep.')}</p> : <>
        <div style={{ background: 'var(--peach)', borderRadius: 30, padding: 22 }} className="stack">
          <span className="disp" style={{ fontWeight: 800, fontSize: 52, letterSpacing: -2, lineHeight: 1 }}>{fmt(n.target, s.lang)}</span>
          <span style={{ fontWeight: 600, color: 'var(--peachInk)' }}>{t('ккал на день', 'kcal a day')}</span>
          <div className="grid3" style={{ marginTop: 16 }}>
            {[[n.prot, t('білків', 'protein')], [n.fat, t('жирів', 'fat')], [n.carb, t('вуглеводів', 'carbs')]].map(([v, l]) => (
              <div key={String(l)}><span className="disp" style={{ fontWeight: 700, fontSize: 18 }}>{v} {t('г', 'g')}</span><span style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>{l}</span></div>
            ))}
          </div>
        </div>
        <div className="stack" style={{ gap: 8, fontSize: 14 }}>
          <div className="row" style={{ minHeight: 0, padding: '12px 14px' }}><span style={{ flex: 1 }}>{t('Базовий обмін у спокої', 'Resting metabolism')}</span><b>{fmt(n.bmr, s.lang)}</b></div>
          <div className="row" style={{ minHeight: 0, padding: '12px 14px' }}><span style={{ flex: 1 }}>{t('З урахуванням активності', 'With your activity')}</span><b>{fmt(n.tdee, s.lang)}</b></div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{goalTxt} {n.floored ? t(`Ми підняли норму до безпечного мінімуму ${n.min} ккал.`, `We raised it to the safe minimum of ${n.min} kcal.`) : t(`Нижче ${n.min} ккал норма ніколи не опуститься.`, `It never goes below ${n.min} kcal.`)}</p>
        </div>
      </>}
      <div style={{ flex: 1 }} />
      <button className="btn block press" onClick={next}>{t('Обрати персонажа', 'Choose a companion')}</button>
      <button className="btn ghost block press" onClick={() => set(st => { st.onb = 3; })}>{t('Змінити дані', 'Edit details')}</button>
    </>);
  }

  const finish = () => set(st => {
    st.profile.cname = (names.cname || CHARS[st.profile.char].name[st.lang]).trim().slice(0, 16);
    st.profile.uname = names.uname.trim().slice(0, 20);
    const y = addDays(today(), -1);
    if (!st.days[y] && !Object.keys(st.ach).length && st.startDate === today()) {
      const mk = (fid: string, g: number, meal: MealKey) => ({ id: uid('f'), food: FOOD_BY_ID[fid], g, meal, at: Date.now() - 86400000 });
      st.days[y] = { ...newDay(y), demo: true, water: 6, foods: [mk('oat_milk', 250, 'b'), mk('banana', 120, 'b'), mk('coffee_milk', 250, 'b'), mk('borsch', 300, 'l'), mk('bread_rye', 60, 'l'), mk('chicken', 150, 'd'), mk('buckwheat', 180, 'd'), mk('salad_ct', 200, 'd')] };
    }
    st.onb = 99;
  });

  return wrap(<>
    {dots}{h1(t('Хто буде поруч?', 'Who\'ll keep you company?'))}
    <div className="chips" style={{ margin: '0 -22px', padding: '6px 22px 14px', gap: 12, scrollSnapType: 'x mandatory' }}>
      {(Object.keys(CHARS) as CharId[]).map(k => {
        const c = CHARS[k], sel = p.char === k;
        return (
          <button key={k} className="press stack" aria-pressed={sel} onClick={() => { set(st => { st.profile.char = k; }); if (!names.cname || Object.values(CHARS).some(x => x.name.uk === names.cname || x.name.en === names.cname)) setNames(n => ({ ...n, cname: c.name[s.lang] })); }}
            style={{ scrollSnapAlign: 'center', flex: '0 0 78%', borderRadius: 30, padding: '16px 18px 20px', textAlign: 'left', gap: 6, whiteSpace: 'normal', background: sel ? 'var(--card)' : 'var(--surface)', boxShadow: `inset 0 0 0 ${sel ? 3 : 2}px ${sel ? 'var(--ink)' : 'var(--line)'}` }}>
            <div style={{ height: 210, display: 'flex', justifyContent: 'center' }}><div style={{ width: 194 }}><Character char={k} stage={2} /></div></div>
            <span className="disp" style={{ fontWeight: 700, fontSize: 20 }}>{t.l(c.name)}</span>
            <span className="muted" style={{ fontSize: 14, lineHeight: 1.4, fontWeight: 500 }}>{t.l(c.vibe)}</span>
            <span style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.4, marginTop: 4 }}>«{c.lines.hello[s.lang][0]}»</span>
          </button>
        );
      })}
    </div>
    <label className="stack" style={{ gap: 6 }}><span className="lbl">{t('Ім\'я персонажа', 'Companion\'s name')}</span><input className="field" maxLength={16} value={names.cname} onChange={e => setNames({ ...names, cname: e.target.value })} /></label>
    <label className="stack" style={{ gap: 6 }}><span className="lbl">{t('Як до тебе звертатися? Можна пропустити', 'What should we call you? Optional')}</span><input className="field" maxLength={20} value={names.uname} placeholder={t('Твоє ім\'я', 'Your name')} onChange={e => setNames({ ...names, uname: e.target.value })} /></label>
    <button className="btn block press" onClick={finish} style={{ marginTop: 6 }}>{t('Почати гру', 'Start playing')}</button>
  </>);
}
