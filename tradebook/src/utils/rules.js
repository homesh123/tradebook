import { calculateTradeMetrics } from './analytics';

// Checks every trade/day against the trader's own risk rules from Settings.
export const getRuleViolations = (trades, settings) => {
  const closed = trades
    .map(calculateTradeMetrics)
    .filter(t => t && t.status === 'closed')
    .sort((a, b) => new Date(a.date) - new Date(b.date) || String(a.time || '').localeCompare(String(b.time || '')));

  const byDay = {};
  trades.forEach(t => {
    if (!byDay[t.date]) byDay[t.date] = { date: t.date, count: 0, pnl: 0 };
    byDay[t.date].count++;
  });
  closed.forEach(t => { byDay[t.date].pnl += t.pnl; });
  const days = Object.values(byDay);

  const limit = parseFloat(settings.dailyLossLimit) || 0;
  const maxTrades = parseInt(settings.maxTradesPerDay, 10) || 0;
  const riskPct = parseFloat(settings.riskPerTradePct) || 0;
  const start = parseFloat(settings.startingBalance) || 0;

  const lossLimitDays = limit > 0 ? days.filter(d => d.pnl <= -limit) : [];
  const overtradingDays = maxTrades > 0 ? days.filter(d => d.count > maxTrades) : [];

  // Risk per trade vs the allowed % of the account balance at that time.
  let balance = start;
  const oversized = [];
  closed.forEach(t => {
    if (riskPct > 0 && start > 0 && t.risk && t.risk > (balance * riskPct) / 100 * 1.1) {
      oversized.push({ ...t, riskPct: (t.risk / balance) * 100 });
    }
    balance += t.pnl;
  });
  const noStop = closed.filter(t => t.stopLoss === null || t.stopLoss === undefined || t.stopLoss === '');

  return {
    lossLimitDays,
    overtradingDays,
    oversized,
    noStop,
    total: lossLimitDays.length + overtradingDays.length + oversized.length,
    costOnLimitDays: lossLimitDays.reduce((s, d) => s + d.pnl, 0),
    overtradingPnl: overtradingDays.reduce((s, d) => s + d.pnl, 0),
  };
};

// Today's guardrail status (trades taken, P&L and remaining loss budget).
export const getTodayStatus = (trades, settings, today) => {
  const todays = trades.filter(t => t.date === today);
  const closed = todays.map(calculateTradeMetrics).filter(t => t.status === 'closed');
  const pnl = closed.reduce((s, t) => s + t.pnl, 0);
  const limit = parseFloat(settings.dailyLossLimit) || 0;
  const maxTrades = parseInt(settings.maxTradesPerDay, 10) || 0;
  const lossUsed = limit > 0 ? Math.min(100, Math.max(0, (-pnl / limit) * 100)) : 0;
  return {
    count: todays.length,
    open: todays.length - closed.length,
    pnl,
    limit,
    maxTrades,
    lossUsed,
    stopTrading: (limit > 0 && pnl <= -limit) || (maxTrades > 0 && todays.length >= maxTrades),
  };
};

// P&L by hour of entry, only for trades with a time recorded.
export const getHourStats = (closed) => {
  const hours = {};
  closed.forEach(t => {
    if (!t.time || !/^\d{1,2}:\d{2}/.test(t.time)) return;
    const h = parseInt(t.time.split(':')[0], 10);
    if (!hours[h]) hours[h] = { hour: h, list: [] };
    hours[h].list.push(t);
  });
  return Object.values(hours)
    .sort((a, b) => a.hour - b.hour)
    .map(h => {
      const totalPnl = h.list.reduce((s, t) => s + t.pnl, 0);
      const wins = h.list.filter(t => t.pnl > 0).length;
      return {
        hour: h.hour,
        label: `${String(h.hour).padStart(2, '0')}:00`,
        count: h.list.length,
        totalPnl,
        winRate: (wins / h.list.length) * 100,
      };
    });
};
