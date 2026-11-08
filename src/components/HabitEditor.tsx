import { useState } from 'react';
import { act, useApp } from '../store';
import { useT } from './ui';
import { Icon, ICON_CHOICES } from './Icon';
import { uid } from '../logic/game';

export function HabitEditor({ close }: { close: () => void }) {
  const s = useApp();
  const t = useT();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('leaf');
  const add = () => { if (!name.trim()) return; act(x => { x.habits.push({ id: uid('h'), name: name.trim().slice(0, 40), icon }); }); setName(''); };
  return (
    <div className="stack" style={{ gap: 12 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Мої звички', 'My habits')}</h2>
      <form className="stack" style={{ gap: 10 }} onSubmit={e => { e.preventDefault(); add(); }}>
        <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder={t('Вітаміни, медитація, без солодкого після 18:00…', 'Vitamins, meditation, stretching…')} aria-label={t('Назва звички', 'Habit name')} data-autofocus maxLength={40} />
        <div className="chips" style={{ flexWrap: 'wrap' }}>{ICON_CHOICES.map(i => <button type="button" key={i} className={'chip press' + (icon === i ? ' on' : '')} onClick={() => setIcon(i)} aria-label={i} style={{ width: 44, padding: 0, justifyContent: 'center' }}><Icon name={i} size={20} /></button>)}</div>
        <button className="btn block press" type="submit" disabled={!name.trim()}>{t('Додати звичку', 'Add habit')}</button>
      </form>
      {s.habits.map(h => (
        <div key={h.id} className="row" style={{ minHeight: 54 }}>
          <Icon name={h.icon} size={22} style={{ color: 'var(--ink2)' }} />
          <span style={{ flex: 1, fontWeight: 600 }}>{h.name}</span>
          <button className="icon-btn press" onClick={() => act(x => { x.habits = x.habits.filter(y => y.id !== h.id); })} aria-label={t(`Видалити звичку ${h.name}`, `Delete habit ${h.name}`)}><Icon name="trash" size={20} /></button>
        </div>
      ))}
      <button className="btn ghost block press" onClick={close}>{t('Готово', 'Done')}</button>
    </div>
  );
}

