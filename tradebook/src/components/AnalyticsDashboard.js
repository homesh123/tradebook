import React, { useMemo, useState } from 'react';
import { buildInsights, titleCase, R_BUCKETS } from '../utils/behaviorAnalytics';
import { useSettings } from '../context/SettingsContext';
import { useApp } from '../context/AppContext';
import { Button, PageHeader } from './ui';
import { getFixAdvice } from '../utils/mistakeAdvice';
import { useTheme } from '../context/ThemeContext';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const GREEN = '#34C759';
const RED = '#FF3B30';
const BLUE = '#007AFF';

// Fixed categorical order for mistake series (validated for color-vision deficiency).
const SERIES = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'],
};
const OTHER = { light: '#a1a1a6', dark: '#636366' };

const PERIODS = [
  { key: 'all', label: 'All trades' },
  { key: '50', label: 'Last 50' },
  { key: '20', label: 'Last 20' },
];

const SEVERITY = {
  critical: { label: 'Critical', icon: '⛔', cls: 'bg-apple-red/10 text-apple-red border-apple-red/30' },
  serious: { label: 'High', icon: '⚠️', cls: 'bg-apple-orange/10 text-apple-orange border-apple-orange/30' },
  warning: { label: 'Watch', icon: '👀', cls: 'bg-apple-yellow/10 text-apple-yellow border-apple-yellow/30' },
  good: { label: 'Tip', icon: '✅', cls: 'bg-apple-green/10 text-apple-green border-apple-green/30' },
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const signedCurrency = (val) => (val > 0 ? '+' : '') + formatCurrency(val);
const pnlClass = (val) => (val >= 0 ? 'text-apple-green' : 'text-apple-red');

const Card = ({ title, subtitle, children, className = '', right }) => (
  <div className={`bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden ${className}`}>
    {title && (
      <div className="px-5 py-3.5 border-b border-apple-gray-200 dark:border-apple-gray-700 flex justify-between items-start gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
    )}
    {children}
  </div>
);

const Stat = ({ label, value, sub, valueClass = 'text-apple-gray-900 dark:text-white' }) => (
  <div className="bg-white dark:bg-apple-gray-800 p-4 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
    <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">{label}</div>
    <div className={`text-[18px] sm:text-[22px] font-semibold tracking-tight ${valueClass}`}>{value}</div>
    {sub && <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">{sub}</div>}
  </div>
);

const Empty = ({ children }) => (
  <p className="p-5 text-[13px] text-apple-gray-500 dark:text-apple-gray-400">{children}</p>
);

const useChartTheme = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return useMemo(() => {
    const text = dark ? '#86868B' : '#6E6E73';
    const grid = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const surface = dark ? '#1D1D1F' : '#FFFFFF';
    const tooltip = {
      backgroundColor: dark ? '#333336' : '#FFFFFF',
      titleColor: dark ? '#F5F5F7' : '#1D1D1F',
      bodyColor: dark ? '#D2D2D7' : '#424245',
      borderColor: dark ? '#424245' : '#E8E8ED',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      boxPadding: 4,
    };
    const axis = (extra = {}) => ({
      ticks: { color: text, font: { size: 11 }, ...(extra.ticks || {}) },
      grid: { color: grid, drawTicks: false, ...(extra.grid || {}) },
      border: { display: false },
      ...extra.rest,
    });
    const base = ({ legend = false, money = false, percent = false, horizontal = false, stacked = false, xTicks = 8 } = {}) => {
      const valueTick = (v) => (money ? (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US') : percent ? v + '%' : v);
      const valueAxis = axis({ ticks: { callback: valueTick } });
      const catAxis = axis({ ticks: horizontal ? { autoSkip: false } : { maxTicksLimit: xTicks, autoSkip: true }, grid: { display: false } });
      if (stacked) { valueAxis.stacked = true; catAxis.stacked = true; }
      if (percent) { valueAxis.min = 0; valueAxis.max = 100; }
      return {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: legend
            ? { display: true, position: 'bottom', labels: { color: text, font: { size: 11 }, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded', padding: 14 } }
            : { display: false },
          tooltip,
        },
        scales: horizontal ? { x: valueAxis, y: catAxis } : { x: catAxis, y: valueAxis },
      };
    };
    return {
      dark,
      text,
      surface,
      base,
      series: dark ? SERIES.dark : SERIES.light,
      other: dark ? OTHER.dark : OTHER.light,
      barStyle: { borderRadius: 4, borderSkipped: 'start', maxBarThickness: 28, borderColor: surface },
    };
  }, [dark]);
};

const AnalyticsDashboard = ({ trades }) => {
  const ct = useChartTheme();
  const { settings } = useSettings();
  const { navigate, openTradeForm } = useApp();
  const [period, setPeriod] = useState('all');
  const [view, setView] = useState('charts');

  const scopedTrades = useMemo(() => {
    if (period === 'all') return trades;
    const n = parseInt(period, 10);
    return [...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, n);
  }, [trades, period]);

  const data = useMemo(() => buildInsights(scopedTrades, settings), [scopedTrades, settings]);

  const { closed, analytics, advanced, mistakeStats, cleanVsMistake, whatIf, plan, emotions, afterLoss, days, setups, rDist, combos, rules, hours, topKeys, timeline, disciplineTrend, daily, disciplineScore, suggestions } = data;

  if (closed.length === 0) {
    return (
      <div className="space-y-6">
        <Header period={period} setPeriod={setPeriod} view={view} setView={setView} />
        <Card>
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-[17px] font-semibold text-apple-gray-900 dark:text-white mb-2">No closed trades yet</h3>
            <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400">Log trades with an exit price, tag your mistakes and emotions, and this page will show where you lose money and how to fix it.</p>
            <div className="mt-4 flex gap-2 justify-center">
              <Button onClick={() => openTradeForm()}>Log a trade</Button>
              <Button variant="secondary" onClick={() => navigate('import')}>Import or load demo</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const keyColor = (key) => {
    const i = topKeys.indexOf(key);
    return i >= 0 ? ct.series[i] : ct.other;
  };

  // ---------- Chart data ----------
  const equityData = {
    labels: ['Start', ...whatIf.points.map(p => p.date)],
    datasets: [
      {
        label: 'Actual P&L',
        data: [0, ...whatIf.points.map(p => p.actual)],
        borderColor: BLUE,
        backgroundColor: 'rgba(0,122,255,0.08)',
        fill: true,
        borderWidth: 2,
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        pointHoverRadius: 5,
      },
      {
        label: 'Without mistake trades',
        data: [0, ...whatIf.points.map(p => p.disciplined)],
        borderColor: GREEN,
        borderDash: [6, 4],
        borderWidth: 2,
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
      },
    ],
  };
  const equityOptions = ct.base({ legend: true, money: true });
  equityOptions.plugins.tooltip = { ...equityOptions.plugins.tooltip, callbacks: { label: (c) => `${c.dataset.label}: ${signedCurrency(c.parsed.y)}` } };

  const topCost = mistakeStats.slice(0, 8);
  const mistakeCostData = {
    labels: topCost.map(m => m.label),
    datasets: [{
      label: 'Loss cost',
      data: topCost.map(m => m.cost),
      backgroundColor: 'rgba(255,59,48,0.85)',
      hoverBackgroundColor: RED,
      ...ct.barStyle,
      maxBarThickness: 22,
    }],
  };
  const mistakeCostOptions = ct.base({ money: true, horizontal: true });
  mistakeCostOptions.plugins.tooltip = {
    ...mistakeCostOptions.plugins.tooltip,
    callbacks: {
      label: (c) => {
        const m = topCost[c.dataIndex];
        return [`Lost: ${formatCurrency(m.cost)}`, `Times: ${m.count} (${m.frequency.toFixed(0)}% of trades)`, `Win rate: ${m.winRate.toFixed(0)}%`];
      },
    },
  };

  // Top mistakes keep their own color; the rest fold into one "Other" slice.
  const byCount = mistakeStats.slice().sort((a, b) => b.count - a.count);
  const freqSlices = [
    ...byCount.filter(m => topKeys.includes(m.mistake)).map(m => ({ label: m.label, count: m.count, color: keyColor(m.mistake) })),
  ];
  const otherCount = byCount.filter(m => !topKeys.includes(m.mistake)).reduce((s, m) => s + m.count, 0);
  if (otherCount) freqSlices.push({ label: 'Other', count: otherCount, color: ct.other });
  const frequencyData = {
    labels: freqSlices.map(f => f.label),
    datasets: [{
      data: freqSlices.map(f => f.count),
      backgroundColor: freqSlices.map(f => f.color),
      borderColor: ct.surface,
      borderWidth: 2,
      hoverOffset: 4,
    }],
  };
  const frequencyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { position: 'right', labels: { color: ct.text, font: { size: 11 }, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded', padding: 10 } },
      tooltip: { ...ct.base().plugins.tooltip, callbacks: { label: (c) => ` ${c.label}: ${c.parsed} trade${c.parsed > 1 ? 's' : ''}` } },
    },
  };

  const timelineData = {
    labels: timeline.labels,
    datasets: [...topKeys, 'other']
      .filter(k => (timeline.series[k] || []).some(v => v > 0))
      .map(k => ({
        label: k === 'other' ? 'Other' : titleCase(k),
        data: timeline.series[k],
        backgroundColor: keyColor(k),
        ...ct.barStyle,
        borderWidth: { top: 2 },
        borderRadius: 0,
        maxBarThickness: 32,
      })),
  };
  const timelineOptions = ct.base({ legend: true, stacked: true });
  timelineOptions.scales.y.ticks.precision = 0;
  timelineOptions.plugins.tooltip = {
    ...timelineOptions.plugins.tooltip,
    callbacks: { footer: (items) => `Trades this ${timeline.byWeek ? 'week' : 'month'}: ${timeline.tradeCounts[items[0].dataIndex]}` },
  };

  const disciplineData = {
    labels: disciplineTrend.map(p => `#${p.idx}`),
    datasets: [{
      label: 'Clean trades (last 5)',
      data: disciplineTrend.map(p => p.score),
      borderColor: GREEN,
      backgroundColor: 'rgba(52,199,89,0.10)',
      fill: true,
      borderWidth: 2,
      cubicInterpolationMode: 'monotone',
      pointRadius: 0,
      pointHoverRadius: 5,
    }],
  };
  const disciplineOptions = ct.base({ percent: true });
  disciplineOptions.plugins.tooltip = {
    ...disciplineOptions.plugins.tooltip,
    callbacks: {
      title: (items) => `Trade ${items[0].label} · ${disciplineTrend[items[0].dataIndex].date}`,
      label: (c) => `${c.parsed.y.toFixed(0)}% of last 5 trades were mistake-free`,
    },
  };

  const signedBar = (labels, values, tooltipLines) => {
    const opts = ct.base({ money: true, horizontal: true });
    opts.plugins.tooltip = { ...opts.plugins.tooltip, callbacks: { label: (c) => tooltipLines(c.dataIndex) } };
    return {
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: values.map(v => (v >= 0 ? 'rgba(52,199,89,0.85)' : 'rgba(255,59,48,0.85)')),
          hoverBackgroundColor: values.map(v => (v >= 0 ? GREEN : RED)),
          ...ct.barStyle,
          maxBarThickness: 22,
        }],
      },
      options: opts,
    };
  };

  const emotionChart = signedBar(
    emotions.map(e => e.emotion),
    emotions.map(e => e.avgPnl),
    (i) => {
      const e = emotions[i];
      return [`Avg P&L: ${signedCurrency(e.avgPnl)}`, `Win rate: ${e.winRate.toFixed(0)}% (${e.count} trades)`, `Mistakes on ${e.mistakeRate.toFixed(0)}% of trades`];
    }
  );

  const behaviorRows = [
    { label: 'Clean trades', ...cleanVsMistake.clean },
    { label: 'Trades with mistakes', ...cleanVsMistake.mistake },
    { label: 'Plan followed', ...plan.followed },
    { label: 'Plan broken', ...plan.broken },
    { label: 'Trade after a win', ...afterLoss.afterWin },
    { label: 'Trade after a loss', ...afterLoss.afterLoss },
  ].filter(r => r.count > 0);
  const behaviorChart = signedBar(
    behaviorRows.map(r => r.label),
    behaviorRows.map(r => r.avgPnl),
    (i) => {
      const r = behaviorRows[i];
      return [`Avg P&L per trade: ${signedCurrency(r.avgPnl)}`, `Win rate: ${r.winRate.toFixed(0)}%`, `Trades: ${r.count}`];
    }
  );

  const dayChart = (() => {
    const values = days.map(d => d.totalPnl);
    const opts = ct.base({ money: true });
    opts.plugins.tooltip = {
      ...opts.plugins.tooltip,
      callbacks: { label: (c) => { const d = days[c.dataIndex]; return [`Net: ${signedCurrency(d.totalPnl)}`, `Win rate: ${d.winRate.toFixed(0)}% (${d.count} trades)`]; } },
    };
    return {
      data: {
        labels: days.map(d => d.day),
        datasets: [{
          data: values,
          backgroundColor: values.map(v => (v >= 0 ? 'rgba(52,199,89,0.85)' : 'rgba(255,59,48,0.85)')),
          ...ct.barStyle,
        }],
      },
      options: opts,
    };
  })();

  const rChart = (() => {
    const opts = ct.base();
    opts.scales.y.ticks.precision = 0;
    opts.plugins.tooltip = { ...opts.plugins.tooltip, callbacks: { label: (c) => `${c.parsed.y} trade${c.parsed.y === 1 ? '' : 's'}` } };
    const colors = ['rgba(255,59,48,0.95)', 'rgba(255,59,48,0.7)', 'rgba(255,59,48,0.45)', 'rgba(52,199,89,0.45)', 'rgba(52,199,89,0.7)', 'rgba(52,199,89,0.85)', 'rgba(52,199,89,1)'];
    return {
      data: { labels: R_BUCKETS, datasets: [{ data: rDist.counts, backgroundColor: colors, ...ct.barStyle, maxBarThickness: 40 }] },
      options: opts,
    };
  })();

  const dailyChart = (() => {
    const opts = ct.base({ money: true, xTicks: 10 });
    opts.plugins.tooltip = { ...opts.plugins.tooltip, callbacks: { label: (c) => `Day P&L: ${signedCurrency(c.parsed.y)}` } };
    return {
      data: {
        labels: daily.map(d => d.date),
        datasets: [{
          data: daily.map(d => d.pnl),
          backgroundColor: daily.map(d => (d.pnl >= 0 ? 'rgba(52,199,89,0.85)' : 'rgba(255,59,48,0.85)')),
          ...ct.barStyle,
          maxBarThickness: 18,
        }],
      },
      options: opts,
    };
  })();

  const hourChart = (() => {
    const values = hours.map(h => h.totalPnl);
    const opts = ct.base({ money: true });
    opts.plugins.tooltip = {
      ...opts.plugins.tooltip,
      callbacks: { label: (c) => { const h = hours[c.dataIndex]; return [`Net: ${signedCurrency(h.totalPnl)}`, `Win rate: ${h.winRate.toFixed(0)}% (${h.count} trades)`]; } },
    };
    return {
      data: {
        labels: hours.map(h => h.label),
        datasets: [{ data: values, backgroundColor: values.map(v => (v >= 0 ? 'rgba(52,199,89,0.85)' : 'rgba(255,59,48,0.85)')), ...ct.barStyle }],
      },
      options: opts,
    };
  })();
  const ruleRows = [
    { label: 'Days the daily loss limit was hit', value: settings.dailyLossLimit ? rules.lossLimitDays.length : null, sub: settings.dailyLossLimit ? `Limit ${formatCurrency(settings.dailyLossLimit)} · net ${signedCurrency(rules.costOnLimitDays)}` : 'Set a daily loss limit in Settings' },
    { label: 'Days over the max trades limit', value: settings.maxTradesPerDay ? rules.overtradingDays.length : null, sub: settings.maxTradesPerDay ? `Limit ${settings.maxTradesPerDay}/day · net ${signedCurrency(rules.overtradingPnl)}` : 'Set max trades per day in Settings' },
    { label: 'Trades above max risk', value: settings.riskPerTradePct ? rules.oversized.length : null, sub: `Rule: ${settings.riskPerTradePct || 0}% of account per trade` },
    { label: 'Trades without a stop loss', value: rules.noStop.length, sub: 'Risk and R cannot be measured' },
  ];

  const scoreColor = disciplineScore >= 75 ? GREEN : disciplineScore >= 50 ? '#FF9500' : RED;
  const scoreLabel = disciplineScore >= 75 ? 'Disciplined' : disciplineScore >= 50 ? 'Inconsistent' : 'Undisciplined';
  const gaugeData = {
    datasets: [{
      data: [disciplineScore, 100 - disciplineScore],
      backgroundColor: [scoreColor, ct.dark ? '#333336' : '#E8E8ED'],
      borderWidth: 0,
      circumference: 240,
      rotation: -120,
    }],
  };
  const gaugeOptions = { responsive: true, maintainAspectRatio: false, cutout: '78%', plugins: { legend: { display: false }, tooltip: { enabled: false } } };

  const streak = advanced.maxConsecutiveWins >= advanced.maxConsecutiveLosses
    ? { value: `${advanced.maxConsecutiveWins}W`, cls: 'text-apple-green' }
    : { value: `${advanced.maxConsecutiveLosses}L`, cls: 'text-apple-red' };

  return (
    <div className="space-y-6">
      <Header period={period} setPeriod={setPeriod} view={view} setView={setView} />

      {/* Discipline score + headline numbers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:row-span-2">
          <div className="p-5 flex flex-col items-center text-center h-full">
            <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide self-start">Discipline Score</div>
            <div className="relative w-full h-[160px] mt-2">
              <Doughnut data={gaugeData} options={gaugeOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <div className="text-[40px] font-semibold tracking-tight text-apple-gray-900 dark:text-white leading-none">{disciplineScore}</div>
                <div className="text-[12px] font-medium mt-1" style={{ color: scoreColor }}>{scoreLabel}</div>
              </div>
            </div>
            <p className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">
              {cleanVsMistake.clean.count} of {closed.length} trades mistake-free
              {plan.followed.count + plan.broken.count > 0 && ` · plan followed on ${plan.followed.count} of ${plan.followed.count + plan.broken.count}`}
            </p>
            <div className="w-full mt-4 pt-4 border-t border-apple-gray-200 dark:border-apple-gray-700 grid grid-cols-2 gap-3 text-left">
              <div>
                <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">Mistakes cost you</div>
                <div className="text-[17px] font-semibold text-apple-red">{formatCurrency(mistakeStats.reduce((s, m) => s + m.cost, 0))}</div>
              </div>
              <div>
                <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">P&L if skipped</div>
                <div className={`text-[17px] font-semibold ${pnlClass(whatIf.disciplined)}`}>{formatCurrency(whatIf.disciplined)}</div>
              </div>
            </div>
          </div>
        </Card>
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total P&L" value={formatCurrency(analytics.totalPnl)} valueClass={pnlClass(analytics.totalPnl)} sub={`${analytics.closedTrades} closed trades`} />
          <Stat label="Win Rate" value={`${analytics.winRate.toFixed(1)}%`} sub={`${analytics.winningTrades}W / ${analytics.losingTrades}L`} />
          <Stat label="Profit Factor" value={analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)} sub="Gross win / gross loss" />
          <Stat label="Expectancy" value={formatCurrency(analytics.expectancy)} valueClass={pnlClass(analytics.expectancy)} sub="Per trade" />
          <Stat label="Avg Win / Loss" value={analytics.avgLoss > 0 ? `${(analytics.avgWin / analytics.avgLoss).toFixed(2)}x` : '—'} sub={`${formatCurrency(analytics.avgWin)} / ${formatCurrency(analytics.avgLoss)}`} />
          <Stat label="Avg R" value={`${analytics.avgRMultiple >= 0 ? '+' : ''}${analytics.avgRMultiple.toFixed(2)}R`} valueClass={pnlClass(analytics.avgRMultiple)} />
          <Stat label="Max Drawdown" value={formatCurrency(analytics.maxDrawdown)} valueClass="text-apple-red" sub={`Recovery factor ${advanced.recoveryFactor.toFixed(2)}`} />
          <Stat label="Max Streak" value={streak.value} valueClass={streak.cls} sub={`Best ${advanced.maxConsecutiveWins}W · worst ${advanced.maxConsecutiveLosses}L`} />
          <Stat label="Green Days" value={`${advanced.consistencyScore.toFixed(0)}%`} valueClass={advanced.consistencyScore >= 50 ? 'text-apple-green' : 'text-apple-red'} sub={`${advanced.profitableDays}/${advanced.tradingDays} days profitable`} />
          <Stat label="Largest Win" value={formatCurrency(analytics.largestWin)} valueClass="text-apple-green" />
          <Stat label="Largest Loss" value={formatCurrency(analytics.largestLoss)} valueClass="text-apple-red" />
          <Stat label="Sharpe (per trade)" value={advanced.sharpeRatio.toFixed(2)} valueClass={pnlClass(advanced.sharpeRatio)} sub="Mean / std dev of P&L" />
        </div>
      </div>

      {/* Coaching suggestions */}
      <Card title="🧠 Coach's Action Plan" subtitle="What your journal says to fix first, ranked by impact">
        {suggestions.length === 0 ? (
          <Empty>Log at least 3 closed trades with mistakes, emotions and plan adherence to get personalized suggestions.</Empty>
        ) : (
          <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
            {suggestions.map((s, i) => {
              const sev = SEVERITY[s.severity];
              return (
                <div key={i} className="p-4 sm:px-5 flex gap-3">
                  <div className="text-[13px] font-semibold text-apple-gray-400 w-5 shrink-0 pt-0.5">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[14px] font-semibold text-apple-gray-900 dark:text-white">{s.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${sev.cls}`}>{sev.icon} {sev.label}</span>
                    </div>
                    <p className="text-[13px] text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">{s.detail}</p>
                    <p className="text-[13px] text-apple-gray-900 dark:text-apple-gray-200 mt-1.5 leading-relaxed">
                      <span className="font-medium text-apple-blue">Do this: </span>{s.action}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {view === 'table' ? (
        <DataTables mistakeStats={mistakeStats} emotions={emotions} behaviorRows={behaviorRows} days={days} rDist={rDist} />
      ) : (
        <>
          {/* Equity vs disciplined equity */}
          <Card
            title="Equity Curve: Actual vs Disciplined"
            subtitle="Dashed line = your P&L if you had skipped every trade where you made a mistake"
            right={whatIf.gap !== 0 && (
              <div className="text-right shrink-0">
                <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">Discipline gap</div>
                <div className={`text-[15px] font-semibold ${pnlClass(whatIf.gap)}`}>{signedCurrency(whatIf.gap)}</div>
              </div>
            )}
          >
            <div className="p-4 h-[240px] sm:h-[300px]"><Line data={equityData} options={equityOptions} /></div>
          </Card>

          {/* Mistakes: cost and frequency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="What Each Mistake Costs You" subtitle="Total losses on trades tagged with the mistake">
              {topCost.length === 0 ? <Empty>No mistakes tagged yet. Tag mistakes on your trades to see what they cost.</Empty> : (
                <div className="p-4" style={{ height: Math.max(180, topCost.length * 36 + 40) }}><Bar data={mistakeCostData} options={mistakeCostOptions} /></div>
              )}
            </Card>
            <Card title="How Often Each Mistake Happens" subtitle="Share of all mistake occurrences">
              {mistakeStats.length === 0 ? <Empty>No mistakes tagged yet.</Empty> : (
                <div className="p-4 h-[240px]"><Doughnut data={frequencyData} options={frequencyOptions} /></div>
              )}
            </Card>
          </div>

          {/* Mistake trend + discipline trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Mistakes Over Time" subtitle={`Mistakes per ${timeline.byWeek ? 'week' : 'month'} – bars should shrink as you improve`}>
              {mistakeStats.length === 0 ? <Empty>No mistakes tagged yet.</Empty> : (
                <div className="p-4 h-[260px]"><Bar data={timelineData} options={timelineOptions} /></div>
              )}
            </Card>
            <Card title="Discipline Trend" subtitle="Rolling % of mistake-free trades (last 5 trades) – aim for 80%+">
              <div className="p-4 h-[260px]"><Line data={disciplineData} options={disciplineOptions} /></div>
            </Card>
          </div>

          {/* Behaviour: emotions + situations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Emotion vs Results" subtitle="Average P&L per trade by how you felt">
              {emotions.length === 0 ? <Empty>Record your emotions on each trade to see how your state of mind affects results.</Empty> : (
                <div className="p-4" style={{ height: Math.max(180, emotions.length * 32 + 40) }}><Bar data={emotionChart.data} options={emotionChart.options} /></div>
              )}
            </Card>
            <Card title="Behaviour Patterns" subtitle="Average P&L per trade in each situation">
              {behaviorRows.length === 0 ? <Empty>Not enough data yet.</Empty> : (
                <div className="p-4" style={{ height: Math.max(180, behaviorRows.length * 36 + 40) }}><Bar data={behaviorChart.data} options={behaviorChart.options} /></div>
              )}
            </Card>
          </div>

          {/* Timing + risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="P&L by Day of Week" subtitle="Find the days you should trade less">
              <div className="p-4 h-[240px]"><Bar data={dayChart.data} options={dayChart.options} /></div>
            </Card>
            <Card title="R-Multiple Distribution" subtitle={rDist.withR ? `${rDist.withR} trades with a stop loss · losses beyond -1R mean the stop was not respected` : 'Add stop losses to trades to see R-multiples'}>
              {rDist.withR === 0 ? <Empty>No trades with a stop loss yet.</Empty> : (
                <div className="p-4 h-[240px]"><Bar data={rChart.data} options={rChart.options} /></div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Risk Rule Breaks" subtitle="Your own rules from Settings, checked against every trade and day" right={<Button size="sm" variant="ghost" onClick={() => navigate('settings')}>Edit rules</Button>}>
              <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                {ruleRows.map(r => (
                  <div key={r.label} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] text-apple-gray-900 dark:text-white">{r.label}</div>
                      <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">{r.sub}</div>
                    </div>
                    <div className={`text-[20px] font-semibold tabular-nums ${r.value === null ? 'text-apple-gray-400' : r.value > 0 ? 'text-apple-red' : 'text-apple-green'}`}>{r.value === null ? 'Off' : r.value === 0 ? '0 ✓' : r.value}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="P&L by Entry Hour" subtitle={hours.length ? 'Find the hours where you trade best and worst' : 'Add an entry time to trades to unlock this chart'}>
              {hours.length === 0 ? <Empty>No trades with an entry time yet. Add the time in the trade form (or import from MT5) to see when you trade best.</Empty> : (
                <div className="p-4 h-[240px]"><Bar data={hourChart.data} options={hourChart.options} /></div>
              )}
            </Card>
          </div>

          <Card title="Daily P&L" subtitle="Net result per trading day">
            <div className="p-4 h-[220px] sm:h-[260px]"><Bar data={dailyChart.data} options={dailyChart.options} /></div>
          </Card>
        </>
      )}

      {/* Mistake breakdown with fixes */}
      {mistakeStats.length > 0 && (
        <Card title="Mistake Breakdown & Fixes" subtitle="Every mistake, its impact, trend and the rule that prevents it">
          <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
            {mistakeStats.map((m) => {
              const advice = getFixAdvice(m.mistake);
              const share = mistakeStats[0].cost > 0 ? (m.cost / mistakeStats[0].cost) * 100 : 0;
              return (
                <div key={m.mistake} className="p-4 sm:px-5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3 md:gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: keyColor(m.mistake) }} />
                      <span className="text-[14px] font-semibold text-apple-gray-900 dark:text-white">{m.label}</span>
                      <TrendBadge trend={m.trend} />
                    </div>
                    <div className="h-1.5 rounded-full bg-apple-gray-100 dark:bg-apple-gray-700 overflow-hidden mb-1.5">
                      <div className="h-full rounded-full bg-apple-red" style={{ width: `${Math.max(share, m.cost > 0 ? 3 : 0)}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-apple-gray-600 dark:text-apple-gray-400">
                      <span className="text-apple-red font-medium">{formatCurrency(m.cost)} lost</span>
                      <span>×{m.count} ({m.frequency.toFixed(0)}%)</span>
                      <span>Win rate {m.winRate.toFixed(0)}%</span>
                      <span>Last: {m.lastSeen}</span>
                    </div>
                  </div>
                  <div className="text-[12px] leading-relaxed bg-apple-gray-50 dark:bg-apple-gray-900/50 rounded-lg p-3">
                    <div><span className="font-medium text-apple-gray-900 dark:text-white">Rule: </span><span className="text-apple-gray-700 dark:text-apple-gray-300">{advice.rule}</span></div>
                    <div className="mt-1"><span className="font-medium text-apple-gray-900 dark:text-white">Fix: </span><span className="text-apple-gray-700 dark:text-apple-gray-300">{advice.solution}</span></div>
                    <div className="mt-1"><span className="font-medium text-apple-gray-900 dark:text-white">Prevent: </span><span className="text-apple-gray-700 dark:text-apple-gray-300">{advice.prevention}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Mistake chains */}
      {combos.length > 0 && (
        <Card title="Mistake Chains" subtitle="Mistakes that happen together on the same trade">
          <div className="p-4 sm:px-5 flex flex-wrap gap-2">
            {combos.slice(0, 8).map((c) => (
              <div key={c.pair.join('|')} className="px-3 py-2 rounded-lg bg-apple-gray-50 dark:bg-apple-gray-900/50 border border-apple-gray-200 dark:border-apple-gray-700 text-[12px]">
                <span className="font-medium text-apple-gray-900 dark:text-white">{titleCase(c.pair[0])}</span>
                <span className="text-apple-gray-400 mx-1.5">+</span>
                <span className="font-medium text-apple-gray-900 dark:text-white">{titleCase(c.pair[1])}</span>
                <span className="text-apple-gray-500 dark:text-apple-gray-400 ml-2">×{c.count}</span>
                <span className={`ml-2 font-medium ${pnlClass(c.pnl)}`}>{signedCurrency(c.pnl)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Setup performance */}
      <Card title="Performance by Setup" subtitle="High mistake rate on a losing setup = execution problem, not strategy problem">
        {setups.length === 0 ? <Empty>Tag trades with setups to see performance.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-apple-gray-200 dark:border-apple-gray-700">
                  {['Setup', 'Trades', 'Win Rate', 'P&L', 'Profit Factor', 'Mistake Rate'].map((h, i) => (
                    <th key={h} className={`${i === 0 ? 'text-left' : 'text-right'} px-5 py-2.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                {setups.map((s) => (
                  <tr key={s.setup} className="hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/30">
                    <td className="px-5 py-2.5 text-[13px] text-apple-gray-900 dark:text-white">{s.setup}</td>
                    <td className="px-5 py-2.5 text-right text-[13px] text-apple-gray-600 dark:text-apple-gray-400">{s.count} ({s.wins}W/{s.losses}L)</td>
                    <td className="px-5 py-2.5 text-right text-[13px] text-apple-gray-900 dark:text-white">{s.winRate.toFixed(1)}%</td>
                    <td className={`px-5 py-2.5 text-right text-[13px] font-medium ${pnlClass(s.totalPnl)}`}>{formatCurrency(s.totalPnl)}</td>
                    <td className="px-5 py-2.5 text-right text-[13px] text-apple-gray-900 dark:text-white">{s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)}</td>
                    <td className={`px-5 py-2.5 text-right text-[13px] ${s.mistakeRate >= 50 ? 'text-apple-red' : 'text-apple-gray-900 dark:text-white'}`}>{s.mistakeRate.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

const Header = ({ period, setPeriod, view, setView }) => (
  <PageHeader
    title="Analytics"
    subtitle="Find your mistakes, behaviour patterns and what to fix next"
    actions={
      <>
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
        <Segmented options={[{ key: 'charts', label: 'Charts' }, { key: 'table', label: 'Tables' }]} value={view} onChange={setView} />
      </>
    }
  />
);

const Segmented = ({ options, value, onChange }) => (
  <div className="inline-flex p-0.5 rounded-lg bg-apple-gray-200/70 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700">
    {options.map(o => (
      <button
        key={o.key}
        onClick={() => onChange(o.key)}
        aria-pressed={value === o.key}
        className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${value === o.key ? 'bg-white dark:bg-apple-gray-600 text-apple-gray-900 dark:text-white shadow-sm' : 'text-apple-gray-500 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'}`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const TrendBadge = ({ trend }) => {
  if (trend === 'up') return <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-apple-red/10 text-apple-red">▲ Increasing</span>;
  if (trend === 'down') return <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-apple-green/10 text-apple-green">▼ Improving</span>;
  return null;
};

// Table view of the chart data, for accessibility and exact numbers.
const DataTables = ({ mistakeStats, emotions, behaviorRows, days, rDist }) => {
  const Table = ({ title, headers, rows }) => (
    <Card title={title}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-apple-gray-200 dark:border-apple-gray-700">
              {headers.map((h, i) => <th key={h} className={`${i === 0 ? 'text-left' : 'text-right'} px-5 py-2 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium`}>{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => <td key={j} className={`${j === 0 ? 'text-left text-apple-gray-900 dark:text-white' : 'text-right text-apple-gray-600 dark:text-apple-gray-400'} px-5 py-2 text-[13px]`}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Table title="Mistakes" headers={['Mistake', 'Times', 'Lost', 'Net P&L', 'Win Rate']} rows={mistakeStats.map(m => [m.label, m.count, formatCurrency(m.cost), signedCurrency(m.totalPnl), `${m.winRate.toFixed(0)}%`])} />
      <Table title="Emotions" headers={['Emotion', 'Trades', 'Avg P&L', 'Win Rate', 'Mistake Rate']} rows={emotions.map(e => [e.emotion, e.count, signedCurrency(e.avgPnl), `${e.winRate.toFixed(0)}%`, `${e.mistakeRate.toFixed(0)}%`])} />
      <Table title="Behaviour Patterns" headers={['Situation', 'Trades', 'Avg P&L', 'Win Rate']} rows={behaviorRows.map(r => [r.label, r.count, signedCurrency(r.avgPnl), `${r.winRate.toFixed(0)}%`])} />
      <Table title="Day of Week" headers={['Day', 'Trades', 'Net P&L', 'Win Rate']} rows={days.map(d => [d.day, d.count, signedCurrency(d.totalPnl), `${d.winRate.toFixed(0)}%`])} />
      <Table title="R-Multiple Distribution" headers={['Bucket', 'Trades']} rows={R_BUCKETS.map((b, i) => [b, rDist.counts[i]])} />
    </div>
  );
};

export default AnalyticsDashboard;
