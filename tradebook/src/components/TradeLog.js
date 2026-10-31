import React, { useMemo, useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { useApp } from '../context/AppContext';
import { calculateTradeMetrics } from '../utils/analytics';
import { PageHeader, Card, Button, Segmented, Tag, EmptyState, inputClass, signedCurrency, pnlClass, formatDate, cx, useFeedback } from './ui';

const PAGE_SIZE = 50;

const SORTS = {
  newest: (a, b) => new Date(b.date) - new Date(a.date) || String(b.time || '').localeCompare(String(a.time || '')),
  oldest: (a, b) => new Date(a.date) - new Date(b.date) || String(a.time || '').localeCompare(String(b.time || '')),
  best: (a, b) => b.pnl - a.pnl,
  worst: (a, b) => a.pnl - b.pnl,
  r: (a, b) => (b.rMultiple ?? -Infinity) - (a.rMultiple ?? -Infinity),
};

const selectClass = 'px-3 py-2 rounded-lg bg-white dark:bg-apple-gray-800 text-apple-gray-900 dark:text-white text-[13px] border border-apple-gray-200 dark:border-apple-gray-700 focus:border-apple-blue';

const TradeLog = () => {
  const { trades, deleteTrade, restoreTrade } = useTrades();
  const { openTradeForm, navigate } = useApp();
  const { toast, confirm } = useFeedback();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [side, setSide] = useState('');
  const [setup, setSetup] = useState('');
  const [mistake, setMistake] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('newest');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  const enriched = useMemo(() => trades.map(calculateTradeMetrics), [trades]);
  const allSetups = useMemo(() => [...new Set(trades.flatMap(t => t.tags || []))].sort(), [trades]);
  const allMistakes = useMemo(() => [...new Set(trades.flatMap(t => t.mistakes || []))].sort(), [trades]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(t => {
      if (q) {
        const hay = [t.pair, t.notes, t.strategy, t.emotions, ...(t.tags || []), ...(t.mistakes || [])].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status === 'open' && t.status !== 'open') return false;
      if (status === 'winners' && !(t.status === 'closed' && t.pnl > 0)) return false;
      if (status === 'losers' && !(t.status === 'closed' && t.pnl < 0)) return false;
      if (status === 'mistakes' && !(t.mistakes || []).length) return false;
      if (side && t.side !== side) return false;
      if (setup && !(t.tags || []).includes(setup)) return false;
      if (mistake && !(t.mistakes || []).includes(mistake)) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      return true;
    }).sort(SORTS[sort]);
  }, [enriched, search, status, side, setup, mistake, from, to, sort]);

  const summary = useMemo(() => {
    const closed = filtered.filter(t => t.status === 'closed');
    const wins = closed.filter(t => t.pnl > 0).length;
    return {
      count: filtered.length,
      closed: closed.length,
      pnl: closed.reduce((s, t) => s + t.pnl, 0),
      winRate: closed.length ? (wins / closed.length) * 100 : 0,
    };
  }, [filtered]);

  const activeFilters = [side, setup, mistake, from, to].filter(Boolean).length;
  const resetFilters = () => { setSide(''); setSetup(''); setMistake(''); setFrom(''); setTo(''); setSearch(''); setStatus('all'); };

  const remove = async (trade) => {
    const ok = await confirm({ title: 'Delete this trade?', message: `${trade.pair} on ${formatDate(trade.date)} will be removed.`, confirmLabel: 'Delete', destructive: true });
    if (!ok) return;
    const original = trades.find(t => t.id === trade.id);
    deleteTrade(trade.id);
    toast('Trade deleted', { action: { label: 'Undo', onClick: () => restoreTrade(original) } });
  };

  const edit = (t) => openTradeForm(trades.find(x => x.id === t.id));
  const rText = (t) => (t.rMultiple !== null && t.rMultiple !== undefined ? `${t.rMultiple >= 0 ? '+' : ''}${t.rMultiple.toFixed(2)}R` : '—');
  const shown = filtered.slice(0, limit);

  if (trades.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Trade Log" subtitle="Every trade, searchable and editable" />
        <Card>
          <EmptyState icon="📋" title="Your journal is empty"
            action={<div className="flex gap-2 justify-center"><Button onClick={() => openTradeForm()}>Log your first trade</Button><Button variant="secondary" onClick={() => navigate('import')}>Import CSV</Button></div>}>
            Log trades by hand or import them from your broker. Tag mistakes and emotions so EdgeTrace can find your patterns.
          </EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Trade Log" subtitle="Every trade, searchable and editable – click a trade to edit or close it" actions={<Button onClick={() => openTradeForm()}>+ New Trade</Button>} />

      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray-400 text-[13px]" aria-hidden>⌕</span>
            <input type="search" placeholder="Search symbol, notes, setup, mistake…" value={search} onChange={(e) => setSearch(e.target.value)}
              aria-label="Search trades"
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-apple-gray-800 text-apple-gray-900 dark:text-white text-[13px] border border-apple-gray-200 dark:border-apple-gray-700 focus:border-apple-blue placeholder:text-apple-gray-400" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Segmented label="Status" value={status} onChange={setStatus} options={[
              { key: 'all', label: 'All' }, { key: 'winners', label: 'Winners' }, { key: 'losers', label: 'Losers' }, { key: 'open', label: 'Open' }, { key: 'mistakes', label: 'Mistakes' },
            ]} />
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className={selectClass}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="best">Best P&L</option>
              <option value="worst">Worst P&L</option>
              <option value="r">Highest R</option>
            </select>
            <Button variant="secondary" onClick={() => setShowFilters(s => !s)} aria-expanded={showFilters}>
              Filters{activeFilters ? ` · ${activeFilters}` : ''}
            </Button>
          </div>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 rounded-apple bg-white dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700">
            <select value={side} onChange={(e) => setSide(e.target.value)} aria-label="Side" className={inputClass()}>
              <option value="">Long & short</option><option value="long">Long only</option><option value="short">Short only</option>
            </select>
            <select value={setup} onChange={(e) => setSetup(e.target.value)} aria-label="Setup" className={inputClass()}>
              <option value="">Any setup</option>{allSetups.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={mistake} onChange={(e) => setMistake(e.target.value)} aria-label="Mistake" className={inputClass()}>
              <option value="">Any mistake</option>{allMistakes.map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" className={inputClass()} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" className={inputClass()} />
          </div>
        )}
      </div>

      {/* Summary of the current selection */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-apple-gray-600 dark:text-apple-gray-400">
        <span><strong className="text-apple-gray-900 dark:text-white">{summary.count}</strong> trades</span>
        <span>Net <strong className={pnlClass(summary.pnl)}>{signedCurrency(summary.pnl)}</strong></span>
        <span>Win rate <strong className="text-apple-gray-900 dark:text-white">{summary.winRate.toFixed(0)}%</strong> of {summary.closed} closed</span>
        {(activeFilters > 0 || search || status !== 'all') && <button onClick={resetFilters} className="text-apple-blue">Clear filters</button>}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon="🔍" title="No matching trades">Try a different search or clear the filters.</EmptyState></Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-apple-gray-200 dark:border-apple-gray-700">
                    {['Date', 'Symbol', 'Side', 'Qty', 'Entry', 'Exit', 'P&L', 'R', 'Setup & mistakes', ''].map((h, i) => (
                      <th key={i} className={cx('px-4 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium', i >= 3 && i <= 7 ? 'text-right' : 'text-left')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                  {shown.map(t => (
                    <tr key={t.id} onClick={() => edit(t)} className="cursor-pointer hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-[13px] text-apple-gray-600 dark:text-apple-gray-400 whitespace-nowrap">{formatDate(t.date)}{t.time && <span className="text-apple-gray-400"> · {t.time}</span>}</td>
                      <td className="px-4 py-3 text-[13px] text-apple-gray-900 dark:text-white font-medium">
                        {t.pair}{t.grade && <span className="ml-1.5 text-[10px] text-apple-gray-500 border border-apple-gray-300 dark:border-apple-gray-600 rounded px-1">{t.grade}</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className={cx('text-[11px] font-semibold', t.side === 'long' ? 'text-apple-green' : 'text-apple-red')}>{t.side === 'long' ? '▲ LONG' : '▼ SHORT'}</span></td>
                      <td className="px-4 py-3 text-right text-[13px] text-apple-gray-900 dark:text-white tabular-nums">{t.quantity}</td>
                      <td className="px-4 py-3 text-right text-[13px] text-apple-gray-900 dark:text-white tabular-nums">{t.entry}</td>
                      <td className="px-4 py-3 text-right text-[13px] text-apple-gray-900 dark:text-white tabular-nums">{t.exit ?? '—'}</td>
                      <td className={cx('px-4 py-3 text-right text-[13px] font-medium tabular-nums', t.status === 'open' ? 'text-apple-blue' : pnlClass(t.pnl))}>{t.status === 'open' ? 'OPEN' : signedCurrency(t.pnl)}</td>
                      <td className={cx('px-4 py-3 text-right text-[13px] tabular-nums', pnlClass(t.rMultiple || 0))}>{rText(t)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {(t.tags || []).slice(0, 2).map(x => <Tag key={x}>{x}</Tag>)}
                          {(t.mistakes || []).slice(0, 2).map(x => <Tag key={x} tone="red">{x}</Tag>)}
                          {(t.mistakes || []).length > 2 && <Tag tone="gray">+{t.mistakes.length - 2}</Tag>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={(e) => { e.stopPropagation(); remove(t); }} className="text-[12px] text-apple-gray-400 hover:text-apple-red px-1" aria-label={`Delete ${t.pair} trade`}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile list */}
          <div className="md:hidden bg-white dark:bg-apple-gray-800 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 divide-y divide-apple-gray-200 dark:divide-apple-gray-700 overflow-hidden">
            {shown.map(t => (
              <button key={t.id} onClick={() => edit(t)} className="w-full text-left p-4 active:bg-apple-gray-50 dark:active:bg-apple-gray-700/40">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[15px] font-medium text-apple-gray-900 dark:text-white">
                      {t.pair} <span className={cx('text-[11px] font-semibold', t.side === 'long' ? 'text-apple-green' : 'text-apple-red')}>{t.side === 'long' ? '▲' : '▼'} {t.side.toUpperCase()}</span>
                    </div>
                    <div className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400">{formatDate(t.date)} · {t.entry} → {t.exit ?? 'open'}</div>
                  </div>
                  <div className="text-right">
                    <div className={cx('text-[15px] font-semibold tabular-nums', t.status === 'open' ? 'text-apple-blue' : pnlClass(t.pnl))}>{t.status === 'open' ? 'OPEN' : signedCurrency(t.pnl)}</div>
                    <div className="text-[11px] text-apple-gray-500">{rText(t)}</div>
                  </div>
                </div>
                {((t.tags || []).length > 0 || (t.mistakes || []).length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(t.tags || []).map(x => <Tag key={x}>{x}</Tag>)}
                    {(t.mistakes || []).map(x => <Tag key={x} tone="red">{x}</Tag>)}
                  </div>
                )}
              </button>
            ))}
          </div>

          {filtered.length > limit && (
            <div className="text-center">
              <Button variant="secondary" onClick={() => setLimit(l => l + PAGE_SIZE)}>Show more ({filtered.length - limit} left)</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TradeLog;
