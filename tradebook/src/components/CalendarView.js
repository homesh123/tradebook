import React, { useMemo, useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { calculateTradeMetrics } from '../utils/analytics';
import { PageHeader, Card, Button, Stat, Tag, signedCurrency, formatCurrency, pnlClass, formatDate, todayStr, cx } from './ui';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

const CalendarView = () => {
  const { trades } = useTrades();
  const { openTradeForm } = useApp();
  const { settings } = useSettings();

  // Start on the current month, or the latest month with trades if this month is empty.
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    const thisMonth = ymd(now.getFullYear(), now.getMonth(), 1).slice(0, 7);
    if (trades.length && !trades.some(t => (t.date || '').startsWith(thisMonth))) {
      const latest = trades.map(t => t.date).sort().pop();
      const d = new Date(latest + 'T00:00:00');
      if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthKey = `${year}-${pad(month + 1)}`;

  const byDay = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!(t.date || '').startsWith(monthKey)) return;
      const m = calculateTradeMetrics(t);
      if (!map[t.date]) map[t.date] = { pnl: 0, count: 0, closed: 0, wins: 0, mistakes: 0, trades: [] };
      const d = map[t.date];
      d.count++;
      d.trades.push(m);
      if ((t.mistakes || []).length) d.mistakes++;
      if (m.status === 'closed') { d.closed++; d.pnl += m.pnl; if (m.pnl > 0) d.wins++; }
    });
    return map;
  }, [trades, monthKey]);

  const days = Object.values(byDay);
  const monthPnl = days.reduce((s, d) => s + d.pnl, 0);
  const tradedDays = days.filter(d => d.closed > 0);
  const greenDays = tradedDays.filter(d => d.pnl > 0).length;
  const dayEntries = Object.entries(byDay).filter(([, d]) => d.closed > 0);
  const best = dayEntries.sort((a, b) => b[1].pnl - a[1].pnl)[0];
  const worst = dayEntries.sort((a, b) => a[1].pnl - b[1].pnl)[0];
  const maxAbs = Math.max(1, ...days.map(d => Math.abs(d.pnl)));
  const limit = parseFloat(settings.dailyLossLimit) || 0;

  // Monday-first grid with a weekly total at the end of each row.
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const today = todayStr();
  const sel = selected && byDay[selected];
  const move = (delta) => { setCursor(new Date(year, month + delta, 1)); setSelected(null); };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendar"
        subtitle="Daily results at a glance – click a day to see its trades"
        actions={
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" onClick={() => move(-1)} aria-label="Previous month">‹</Button>
            <span className="min-w-[140px] text-center text-[15px] font-semibold text-apple-gray-900 dark:text-white">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <Button variant="secondary" onClick={() => move(1)} aria-label="Next month">›</Button>
            <Button variant="ghost" onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); setSelected(today); }}>Today</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Month P&L" value={signedCurrency(monthPnl)} valueClass={pnlClass(monthPnl)} sub={(() => { const n = days.reduce((s, d) => s + d.count, 0); return `${n} trade${n === 1 ? '' : 's'}`; })()} />
        <Stat label="Green days" value={tradedDays.length ? `${greenDays}/${tradedDays.length}` : '—'} sub={tradedDays.length ? `${((greenDays / tradedDays.length) * 100).toFixed(0)}% of trading days` : 'No trades this month'} />
        <Stat label="Best day" value={best ? signedCurrency(best[1].pnl) : '—'} valueClass="text-apple-green" sub={best ? formatDate(best[0]) : ''} />
        <Stat label="Worst day" value={worst ? signedCurrency(worst[1].pnl) : '—'} valueClass={worst && worst[1].pnl < 0 ? 'text-apple-red' : ''} sub={worst ? formatDate(worst[0]) : ''} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <Card bodyClassName="p-2 sm:p-4">
          <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,0.9fr)] gap-1 sm:gap-1.5">
            {[...WEEKDAYS, 'Week'].map(d => (
              <div key={d} className="text-center text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-apple-gray-500 dark:text-apple-gray-400 py-1.5">{d}</div>
            ))}
            {weeks.map((week, wi) => {
              const weekPnl = week.reduce((s, d) => s + (d && byDay[ymd(year, month, d)] ? byDay[ymd(year, month, d)].pnl : 0), 0);
              const weekCount = week.reduce((s, d) => s + (d && byDay[ymd(year, month, d)] ? byDay[ymd(year, month, d)].count : 0), 0);
              return (
                <React.Fragment key={wi}>
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="min-h-[58px] sm:min-h-[84px]" />;
                    const key = ymd(year, month, day);
                    const d = byDay[key];
                    const intensity = d && d.closed ? 0.12 + 0.4 * (Math.abs(d.pnl) / maxAbs) : 0;
                    const breached = d && limit > 0 && d.pnl <= -limit;
                    return (
                      <button
                        key={di}
                        onClick={() => setSelected(key)}
                        aria-label={`${formatDate(key)}${d ? `, ${d.count} trades, ${signedCurrency(d.pnl)}` : ', no trades'}`}
                        aria-pressed={selected === key}
                        style={d && d.closed ? { backgroundColor: d.pnl >= 0 ? `rgba(52,199,89,${intensity})` : `rgba(255,59,48,${intensity})` } : undefined}
                        className={cx(
                          'min-h-[58px] sm:min-h-[84px] p-1.5 sm:p-2 rounded-lg text-left flex flex-col transition-shadow border',
                          d ? 'border-transparent' : 'bg-apple-gray-50 dark:bg-apple-gray-900/50 border-apple-gray-100 dark:border-apple-gray-800',
                          selected === key && 'ring-2 ring-apple-blue',
                          'hover:ring-2 hover:ring-apple-blue/40'
                        )}
                      >
                        <span className={cx('text-[11px] sm:text-[12px] font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full', key === today ? 'bg-apple-red text-white' : 'text-apple-gray-600 dark:text-apple-gray-300')}>{day}</span>
                        {d && (
                          <div className="mt-auto">
                            {d.closed > 0 && <div className={cx('text-[10px] sm:text-[12px] font-semibold tabular-nums leading-tight', d.pnl >= 0 ? 'text-apple-green' : 'text-apple-red')}>{signedCurrency(d.pnl, 0)}</div>}
                            <div className="hidden sm:block text-[10px] text-apple-gray-600 dark:text-apple-gray-400">
                              {d.count} trade{d.count > 1 ? 's' : ''}{d.mistakes ? ` · ${d.mistakes}⚠︎` : ''}{breached ? ' · limit hit' : ''}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                  <div className="min-h-[58px] sm:min-h-[84px] p-1.5 sm:p-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700/40 flex flex-col justify-end">
                    {weekCount > 0 && (
                      <>
                        <div className={cx('text-[10px] sm:text-[12px] font-semibold tabular-nums', pnlClass(weekPnl))}>{signedCurrency(weekPnl, 0)}</div>
                        <div className="hidden sm:block text-[10px] text-apple-gray-500">{weekCount} trade{weekCount === 1 ? '' : 's'}</div>
                      </>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 px-1 text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-apple-green/40" /> Profitable day (darker = bigger)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-apple-red/40" /> Losing day</span>
            <span>⚠︎ = trades with mistakes</span>
          </div>
        </Card>

        <Card title={selected ? formatDate(selected, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Day details'}
          subtitle={sel ? `${sel.count} trade${sel.count > 1 ? 's' : ''} · ${signedCurrency(sel.pnl)}` : undefined}
          right={selected && <Button size="sm" variant="ghost" onClick={() => openTradeForm(undefined, { date: selected })}>+ Add</Button>}>
          {!selected ? (
            <p className="p-5 text-[13px] text-apple-gray-500 dark:text-apple-gray-400">Select a day to review its trades, mistakes and notes.</p>
          ) : !sel ? (
            <p className="p-5 text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No trades on this day.</p>
          ) : (
            <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
              {limit > 0 && sel.pnl <= -limit && (
                <p className="px-5 py-2.5 text-[12px] text-apple-red bg-apple-red/5">Daily loss limit of {formatCurrency(limit)} was hit on this day.</p>
              )}
              {sel.trades.map(t => (
                <button key={t.id} onClick={() => openTradeForm(trades.find(x => x.id === t.id))} className="w-full text-left px-5 py-3 hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/30">
                  <div className="flex justify-between">
                    <span className="text-[13px] font-medium text-apple-gray-900 dark:text-white">{t.pair} <span className={cx('text-[11px]', t.side === 'long' ? 'text-apple-green' : 'text-apple-red')}>{t.side.toUpperCase()}</span>{t.time && <span className="text-[11px] text-apple-gray-400"> · {t.time}</span>}</span>
                    <span className={cx('text-[13px] font-semibold tabular-nums', t.status === 'open' ? 'text-apple-blue' : pnlClass(t.pnl))}>{t.status === 'open' ? 'OPEN' : signedCurrency(t.pnl)}</span>
                  </div>
                  {(t.mistakes || []).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{t.mistakes.map(m => <Tag key={m} tone="red">{m}</Tag>)}</div>}
                  {t.notes && <p className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400 mt-1 line-clamp-2">{t.notes}</p>}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CalendarView;
