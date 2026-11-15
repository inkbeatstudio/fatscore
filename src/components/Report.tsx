import { useState } from 'react';
import { getState, emitEffects, useApp } from '../store';
import { useT, openSheet } from './ui';
import { Icon } from './Icon';
import { addDays, today } from '../logic/dates';
import { buildCSV, buildHTML, rowsFor } from '../services/report';

async function deliver(blob: Blob, name: string) {
  const file = new File([blob], name, { type: blob.type });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: name }); return true; }
  } catch (e: any) { if (e?.name === 'AbortError') return false; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

export function openReport() { openSheet(close => <ReportSheet close={close} />); }
function ReportSheet({ close }: { close: () => void }) {
  const s = useApp();
  const t = useT();
  const [days, setDays] = useState(7);
  const logged = rowsFor(s, days).filter(r => r.d).length;
  const name = (ext: string) => `fatscore-${t('звіт', 'report')}-${addDays(today(), -days + 1)}_${today()}.${ext}`;
  const page = async () => {
    const blob = new Blob([buildHTML(getState(), days)], { type: 'text/html' });
    const w = window.open(URL.createObjectURL(blob), '_blank');
    if (!w) await deliver(blob, name('html'));
  };
  const csv = async () => {
    const ok = await deliver(new Blob([buildCSV(getState(), days)], { type: 'text/csv' }), name('csv'));
    if (ok) emitEffects([{ type: 'toast', icon: 'file', text: t('Таблицю збережено', 'Spreadsheet saved') }]);
  };
  return (
    <div className="stack" style={{ gap: 14 }}>
      <h2 className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{t('Звіт для лікаря чи дієтолога', 'Report for a doctor or dietitian')}</h2>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>{t('Їжа з грамами й калоріями, вода, кроки, тренування, сон, настрій і вага (якщо записуєш). Файл створюється лише на телефоні, а кому його надіслати — вирішуєш ти.', 'Food with grams and calories, water, steps, workouts, sleep, mood and weight (if you log it). The file is made on your phone only, and you decide who gets it.')}</p>
      <span className="lbl">{t('За який період', 'Period')}</span>
      <div className="seg">{[7, 14, 30].map(n => <button key={n} className={days === n ? 'on' : ''} onClick={() => setDays(n)}>{t(`${n} днів`, `${n} days`)}</button>)}</div>
      <p style={{ fontSize: 13.5, fontWeight: 600 }}>{t(`Днів із записами: ${logged} із ${days}`, `Days with entries: ${logged} of ${days}`)}</p>
      <button className="btn block press" data-autofocus disabled={!logged} onClick={page}><Icon name="file" size={20} />{t('Сторінка для друку або PDF', 'Printable page or PDF')}</button>
      <button className="btn ghost block press" disabled={!logged} onClick={csv}><Icon name="download" size={20} />{t('Таблиця CSV (Excel, Google Таблиці)', 'CSV spreadsheet (Excel, Google Sheets)')}</button>
      <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{t('На iPhone: відкрий сторінку → «Друк / зберегти PDF» → кнопка «Поділитися» → «Зберегти у Файли».', 'On iPhone: open the page → «Print / save PDF» → Share → «Save to Files».')}</p>
      <button className="btn ghost block press small" onClick={close}>{t('Закрити', 'Close')}</button>
    </div>
  );
}
