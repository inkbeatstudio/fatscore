import { useApp, emitEffects } from '../store';
import { useT, ScreenHeader } from '../components/ui';
import { Character } from '../components/art';
import { Icon } from '../components/Icon';
import { addDays, today, weekKey } from '../logic/dates';
import { isActive, stageOf } from '../logic/game';
import { back } from '../nav';

/** Друзі, чат і ліги потребують сервера. Тут — чесний анонс і те, що працює вже зараз */
export default function Friends() {
  const s = useApp();
  const t = useT();
  const copy = async (text: string, done: string) => {
    try { await navigator.clipboard.writeText(text); emitEffects([{ type: 'toast', icon: 'check', text: done }]); }
    catch { emitEffects([{ type: 'toast', icon: 'info', text: t('Не вдалося скопіювати. Виділи текст вручну.', 'Couldn\'t copy. Select the text manually.') }]); }
  };
  const wk = weekKey(today());
  const days = Array.from({ length: 7 }, (_, i) => s.days[addDays(wk, i)]).filter(Boolean);
  const summary = t(
    `Мій тиждень у Fatscore: активних днів ${days.filter(isActive).length}/7, тренувань ${days.reduce((a, d) => a + d!.workouts.length, 0)}, кроків ${days.reduce((a, d) => a + d!.steps, 0)}. ${s.profile.cname} уже на ${s.chars[s.profile.char].lv} рівні! Мій код друга: ${s.friendCode}`,
    `My week in Fatscore: ${days.filter(isActive).length}/7 active days, ${days.reduce((a, d) => a + d!.workouts.length, 0)} workouts, ${days.reduce((a, d) => a + d!.steps, 0)} steps. ${s.profile.cname} is level ${s.chars[s.profile.char].lv}! My friend code: ${s.friendCode}`);
  const soon: [string, string, string, string, string][] = [
    ['user', 'Друзі за кодом', 'Friends by code', 'Додай друга за кодом, заходь у гості до його героя, дари речі.', 'Add a friend by code, visit their hero, send gifts.'],
    ['edit', 'Чат', 'Chat', 'Особисті й групові повідомлення, стікери підтримки від героїв.', 'Direct and group messages, support stickers from heroes.'],
    ['star', 'Спільні цілі', 'Shared goals', '«Разом 500 км за місяць» і спільний бос, якого перемагають тренування команди.', '«500 km together this month» and a team boss beaten by workouts.'],
    ['trophy', 'Тижневі ліги', 'Weekly leagues', 'Групи по 20–30 людей, рахується досвід за регулярність, а не вага. Можна вимкнути.', 'Groups of 20–30, XP for consistency, never weight. Can be turned off.'],
    ['globe', 'Telegram', 'Telegram', 'Бот у груповому чаті веде челендж і щовечора публікує підсумок.', 'A bot in your group chat runs a challenge and posts a nightly summary.']
  ];
  return (
    <main className="screen">
      <ScreenHeader title={t('Друзі', 'Friends')} onBack={back} />
      <section className="pad stack" style={{ marginTop: 6, alignItems: 'center', textAlign: 'center', gap: 8 }}>
        <div className="row-c" style={{ justifyContent: 'center' }}>
          {(['hare', 'bear', 'raccoon'] as const).map((c, i) => <div key={c} style={{ width: 96, marginLeft: i ? -18 : 0, transform: `rotate(${(i - 1) * 6}deg)` }}><Character char={c} stage={c === s.profile.char ? stageOf(s.chars[c].lv).index : 2} /></div>)}
        </div>
        <h2 className="disp" style={{ fontWeight: 800, fontSize: 22 }}>{t('Разом веселіше', 'Better together')}</h2>
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.5, maxWidth: 360 }}>{t('Друзі, чат і ліги з\'являться в наступному оновленні: для них потрібен сервер з акаунтами. Твої дані про здоров\'я й тоді не показуватимуться нікому без твого дозволу.', 'Friends, chat and leagues arrive in the next update: they need a server with accounts. Even then, your health data won\'t be shown to anyone without your permission.')}</p>
      </section>
      <section className="pad stack" style={{ marginTop: 16, gap: 10 }}>
        <div className="card stack" style={{ padding: 16, gap: 8, alignItems: 'center' }}>
          <span className="lbl">{t('Твій код друга', 'Your friend code')}</span>
          <span className="disp" style={{ fontWeight: 800, fontSize: 28, letterSpacing: 2 }}>{s.friendCode}</span>
          <button className="btn small press" onClick={() => copy(s.friendCode, t('Код скопійовано', 'Code copied'))}><Icon name="check" size={18} />{t('Скопіювати', 'Copy')}</button>
        </div>
        <button className="btn ghost block press" onClick={() => copy(summary, t('Підсумок скопійовано — встав у будь-який чат', 'Summary copied — paste it into any chat'))}><Icon name="upload" size={18} />{t('Поділитися підсумком тижня', 'Share my week')}</button>
      </section>
      <section className="pad stack" style={{ marginTop: 20, gap: 8 }}>
        <h2 className="sectionT">{t('Що буде', 'Coming soon')}</h2>
        {soon.map(([ic, uk, en, duk, den]) => (
          <div key={uk} className="row" style={{ alignItems: 'flex-start', padding: 14 }}>
            <span style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={ic} size={22} /></span>
            <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 700 }}>{t(uk, en)}</span><span className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>{t(duk, den)}</span></span>
          </div>
        ))}
      </section>
    </main>
  );
}
