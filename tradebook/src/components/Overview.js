import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { useTrades } from '../context/TradeContext';
import { useSettings } from '../context/SettingsContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { buildInsights } from '../utils/behaviorAnalytics';
import { getTodayStatus } from '../utils/rules';
import { calculateTradeMetrics } from '../utils/analytics';
import { sampleTradesFull } from '../utils/sampleDataFull';
import { PageHeader, Card, Stat, Button, Tag, formatCurrency, signedCurrency, pnlClass, formatDate, todayStr, cx, useFeedback } from './ui';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const SEVERITY_DOT = { critical: 'bg-apple-red', serious: 'bg-apple-orange', warning: 'bg-apple-yellow', good: 'bg-apple-green' };

const Welcome = () => {
  const { openTradeForm, navigate } = useApp();
  const { importTrades } = useTrades();
  const { toast } = useFeedback();
  const steps = [
    { n: 1, title: 'Set your account & risk rules', text: 'Account size, max risk per trade, daily loss limit.', action: () => navigate('settings'), label: 'Open Settings' },
    { n: 2, title: 'Log or import trades', text: 'Add trades by hand, or import a CSV / MT5 report.', action: () => openTradeForm(), label: 'Log a trade' },
    { n: 3, title: 'Tag mistakes & emotions', text: 'Honest tags are what reveal your patterns.', action: () => navigate('help'), label: 'How it works' },
    { n: 4, title: 'Review & fix', text: 'Analytics ranks your leaks and tells you what to fix.', action: () => navigate('analytics'), label: 'See Analytics' },
  ];
  return (
    <Card>
      <div className="p-6 sm:p-8">
        <div className="text-3xl mb-2" aria-hidden>👋</div>
        <h2 className="text-[20px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">Welcome to EdgeTrace</h2>
        <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400 mt-1 max-w-xl">A trading journal built to find the mistakes and habits that cost you money – and to tell you exactly what to fix.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {steps.map(s => (
            <div key={s.n} className="p-4 rounded-apple bg-apple-gray-50 dark:bg-apple-gray-900/60 border border-apple-gray-200 dark:border-apple-gray-700 flex flex-col">
              <div className="w-6 h-6 rounded-full bg-apple-blue text-white text-[12px] font-semibold flex items-center justify-center mb-2">{s.n}</div>
              <div className="text-[13px] font-semibold text-apple-gray-900 dark:text-white">{s.title}</div>
              <div className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400 mt-0.5 flex-1">{s.text}</div>
              <button onClick={s.action} className="text-[12px] text-apple-blue font-medium mt-2 text-left">{s.label} ›</button>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 p-4 rounded-apple bg-apple-blue/8 dark:bg-apple-blue/15 border border-apple-blue/25">
          <div className="flex-1 min-w-[200px]">
            <div className="text-[13px] font-semibold text-apple-gray-900 dark:text-white">Just exploring?</div>
            <div className="text-[12px] text-apple-gray-600 dark:text-apple-gray-400">Load 30 demo trades with realistic mistakes to see every chart and suggestion.</div>
          </div>
          <Button onClick={() => { importTrades(sampleTradesFull); toast('Demo trades loaded'); }}>Load demo data</Button>
        </div>
      </div>
    </Card>
  );
};

const Overview = () => {
  const { trades } = useTrades();
  const { settings } = useSettings();
  const { openTradeForm, navigate } = useApp();
  const { theme } = useTheme();
  const today = todayStr();

  const insights = useMemo(() => buildInsights(trades, settings), [trades, settings]);
  const todayStatus = useMemo(() => getTodayStatus(trades, settings, today), [trades, settings, today]);
  const { analytics, mistakeStats, suggestions, disciplineScore, whatIf, cleanVsMistake } = insights;

  const openTrades = useMemo(() => trades.map(calculateTradeMetrics).filter(t => t.status === 'open'), [trades]);
  const recent = useMemo(() => [...trades].sort((a, b) => new Date(b.date) - new Date(a.date) || String(b.time || '').localeCompare(String(a.time || ''))).slice(0, 6).map(calculateTradeMetrics), [trades]);

  const start = parseFloat(settings.startingBalance) || 0;
  const balance = start + analytics.totalPnl;
  const returnPct = start > 0 ? (analytics.totalPnl / start) * 100 : null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={greeting} subtitle={formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })} actions={<Button onClick={() => openTradeForm()}>+ New Trade</Button>} />
        <Welcome />
      </div>
    );
  }

  const dark = theme === 'dark';
  const sparkData = {
    labels: ['Start', ...whatIf.points.map(p => p.date)],
    datasets: [{
      data: [start, ...whatIf.points.map(p => start + p.actual)],
      borderColor: analytics.totalPnl >= 0 ? '#34C759' : '#FF3B30',
      backgroundColor: analytics.totalPnl >= 0 ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)',
      fill: true,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      cubicInterpolationMode: 'monotone',
    }],
  };
  const sparkOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: dark ? '#333336' : '#fff', titleColor: dark ? '#F5F5F7' : '#1D1D1F', bodyColor: dark ? '#D2D2D7' : '#424245',
        borderColor: dark ? '#424245' : '#E8E8ED', borderWidth: 1, displayColors: false,
        callbacks: { label: (c) => `Balance ${formatCurrency(c.parsed.y)}` },
      },
    },
    scales: { x: { display: false }, y: { display: false } },
  };

  const lossBar = todayStatus.limit > 0 ? todayStatus.lossUsed : null;
  const topLeak = mistakeStats[0];

  return (
    <div className="space-y-6">
      <PageHeader title={greeting} subtitle={formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })} actions={<Button onClick={() => openTradeForm()}>+ New Trade</Button>} />

      {todayStatus.stopTrading && (
        <div role="alert" className="flex items-start gap-3 p-4 rounded-apple bg-apple-red/10 border border-apple-red/30">
          <span className="text-xl" aria-hidden>🛑</span>
          <div>
            <div className="text-[14px] font-semibold text-apple-red">Stop trading for today</div>
            <div className="text-[13px] text-apple-gray-700 dark:text-apple-gray-300">
              {todayStatus.limit > 0 && todayStatus.pnl <= -todayStatus.limit ? `You've reached your ${formatCurrency(todayStatus.limit)} daily loss limit. ` : ''}
              {todayStatus.maxTrades > 0 && todayStatus.count >= todayStatus.maxTrades ? `You've taken ${todayStatus.count} of ${todayStatus.maxTrades} allowed trades. ` : ''}
              Protecting capital today is a winning decision.
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Account */}
        <Card className="lg:col-span-2">
          <div className="p-5">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-apple-gray-500 dark:text-apple-gray-400">Account balance</div>
                <div className="text-[32px] font-semibold tracking-tight text-apple-gray-900 dark:text-white tabular-nums leading-tight">{formatCurrency(balance)}</div>
                <div className={cx('text-[13px] font-medium', pnlClass(analytics.totalPnl))}>
                  {signedCurrency(analytics.totalPnl)}{returnPct !== null && ` (${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%)`} <span className="text-apple-gray-500 font-normal">all time</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5 text-right">
                <Mini label="Win rate" value={`${analytics.winRate.toFixed(0)}%`} />
                <Mini label="Profit factor" value={analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)} />
                <Mini label="Expectancy" value={formatCurrency(analytics.expectancy, 0)} className={pnlClass(analytics.expectancy)} />
              </div>
            </div>
            <div className="h-[130px] mt-3 -mx-1"><Line data={sparkData} options={sparkOptions} /></div>
          </div>
        </Card>

        {/* Today */}
        <Card title="Today" subtitle="Your guardrails" right={<button onClick={() => navigate('settings')} className="text-[12px] text-apple-blue">Rules</button>}>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-[13px] text-apple-gray-600 dark:text-apple-gray-400">P&L today</span>
              <span className={cx('text-[20px] font-semibold tabular-nums', pnlClass(todayStatus.pnl))}>{signedCurrency(todayStatus.pnl)}</span>
            </div>
            <Gauge label="Trades taken" value={todayStatus.count} max={todayStatus.maxTrades} unit="" off="No limit set" />
            {lossBar !== null ? (
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-apple-gray-600 dark:text-apple-gray-400">Daily loss limit used</span>
                  <span className="text-apple-gray-900 dark:text-white tabular-nums">{lossBar.toFixed(0)}% of {formatCurrency(todayStatus.limit, 0)}</span>
                </div>
                <Bar pct={lossBar} />
              </div>
            ) : (
              <p className="text-[12px] text-apple-gray-500">Set a daily loss limit in Settings to track it here.</p>
            )}
            {todayStatus.open > 0 && <p className="text-[12px] text-apple-blue">{todayStatus.open} open position{todayStatus.open > 1 ? 's' : ''} today</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Discipline score" value={`${disciplineScore}/100`} valueClass={disciplineScore >= 75 ? 'text-apple-green' : disciplineScore >= 50 ? 'text-apple-orange' : 'text-apple-red'} sub={`${cleanVsMistake.clean.count} of ${analytics.closedTrades} trades clean`} onClick={() => navigate('analytics')} hint="Share of mistake-free trades and plan adherence" />
        <Stat label="Cost of mistakes" value={formatCurrency(mistakeStats.reduce((s, m) => s + m.cost, 0), 0)} valueClass="text-apple-red" sub={`${cleanVsMistake.mistake.count} trades with mistakes`} onClick={() => navigate('mistakes')} />
        <Stat label="Avg R" value={`${analytics.avgRMultiple >= 0 ? '+' : ''}${analytics.avgRMultiple.toFixed(2)}R`} valueClass={pnlClass(analytics.avgRMultiple)} sub="Return per unit of risk" hint="Average profit as a multiple of the risk you planned" />
        <Stat label="Max drawdown" value={formatCurrency(analytics.maxDrawdown, 0)} valueClass="text-apple-red" sub={start ? `${((analytics.maxDrawdown / start) * 100).toFixed(1)}% of account` : ''} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="🧠 What to work on" subtitle="Top suggestions from your journal" right={<button onClick={() => navigate('analytics')} className="text-[12px] text-apple-blue whitespace-nowrap">See all ›</button>}>
          {suggestions.length === 0 ? (
            <p className="p-5 text-[13px] text-apple-gray-500 dark:text-apple-gray-400">Log a few more closed trades with mistakes and emotions tagged to get personalised suggestions.</p>
          ) : (
            <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
              {suggestions.slice(0, 3).map((s, i) => (
                <div key={i} className="px-5 py-3 flex gap-3">
                  <span className={cx('w-2 h-2 rounded-full mt-1.5 shrink-0', SEVERITY_DOT[s.severity])} aria-hidden />
                  <div>
                    <div className="text-[13px] font-semibold text-apple-gray-900 dark:text-white">{s.title}</div>
                    <div className="text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mt-0.5">{s.action}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Biggest leak" subtitle="The mistake costing you the most" right={<button onClick={() => navigate('mistakes')} className="text-[12px] text-apple-blue whitespace-nowrap">All mistakes ›</button>}>
          {!topLeak ? (
            <p className="p-5 text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No mistakes tagged yet. Tag mistakes on your trades – even small ones – to find your leaks.</p>
          ) : (
            <div className="p-5">
              <div className="flex justify-between items-center p-4 rounded-lg bg-apple-red/8 dark:bg-apple-red/12 border border-apple-red/25">
                <div>
                  <div className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">{topLeak.label}</div>
                  <div className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400">{topLeak.count} times · {topLeak.frequency.toFixed(0)}% of trades · last {formatDate(topLeak.lastSeen)}</div>
                </div>
                <div className="text-[20px] font-semibold text-apple-red tabular-nums">−{formatCurrency(topLeak.cost, 0)}</div>
              </div>
              {whatIf.gap > 0 && (
                <p className="text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mt-3">Without trades that had mistakes, your P&L would be <strong className="text-apple-green">{formatCurrency(whatIf.disciplined)}</strong> instead of {formatCurrency(whatIf.actual)}.</p>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Recent trades" right={<button onClick={() => navigate('trades')} className="text-[12px] text-apple-blue">Trade Log ›</button>}>
          <TradeList list={recent} trades={trades} />
        </Card>
        <Card title="Open positions" subtitle={openTrades.length ? 'Click to add the exit and close it' : undefined}>
          {openTrades.length === 0 ? (
            <p className="p-5 text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No open positions.</p>
          ) : <TradeList list={openTrades} trades={trades} showRisk />}
        </Card>
      </div>
    </div>
  );
};

const Mini = ({ label, value, className = 'text-apple-gray-900 dark:text-white' }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-apple-gray-500 dark:text-apple-gray-400">{label}</div>
    <div className={cx('text-[17px] font-semibold tabular-nums', className)}>{value}</div>
  </div>
);

const Bar = ({ pct }) => (
  <div className="h-2 rounded-full bg-apple-gray-100 dark:bg-apple-gray-700 overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
    <div className={cx('h-full rounded-full transition-all', pct >= 100 ? 'bg-apple-red' : pct >= 70 ? 'bg-apple-orange' : 'bg-apple-green')} style={{ width: `${Math.min(100, pct)}%` }} />
  </div>
);

const Gauge = ({ label, value, max, off }) => (
  <div>
    <div className="flex justify-between text-[12px] mb-1">
      <span className="text-apple-gray-600 dark:text-apple-gray-400">{label}</span>
      <span className="text-apple-gray-900 dark:text-white tabular-nums">{max ? `${value} of ${max}` : value}</span>
    </div>
    {max ? <Bar pct={(value / max) * 100} /> : <p className="text-[11px] text-apple-gray-400">{off}</p>}
  </div>
);

const TradeList = ({ list, trades, showRisk }) => {
  const { openTradeForm } = useApp();
  return (
    <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
      {list.map(t => (
        <button key={t.id} onClick={() => openTradeForm(trades.find(x => x.id === t.id))} className="w-full text-left px-5 py-3 flex justify-between items-center hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/30 transition-colors">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-apple-gray-900 dark:text-white flex items-center gap-1.5">
              {t.pair}<span className={cx('text-[10px] font-semibold', t.side === 'long' ? 'text-apple-green' : 'text-apple-red')}>{t.side === 'long' ? '▲ LONG' : '▼ SHORT'}</span>
              {(t.mistakes || []).slice(0, 1).map(m => <Tag key={m} tone="red">{m}</Tag>)}
            </div>
            <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">{formatDate(t.date)}{showRisk && t.risk ? ` · risk ${formatCurrency(t.risk)}` : ''}</div>
          </div>
          <div className={cx('text-[13px] font-semibold tabular-nums', t.status === 'open' ? 'text-apple-blue' : pnlClass(t.pnl))}>{t.status === 'open' ? 'OPEN' : signedCurrency(t.pnl)}</div>
        </button>
      ))}
    </div>
  );
};

export default Overview;
