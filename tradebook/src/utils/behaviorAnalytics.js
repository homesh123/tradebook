import { calculateTradeMetrics, analyzeTrades } from './analytics';
import { getAdvancedMetrics } from './advancedAnalytics';
import { getRuleViolations, getHourStats } from './rules';
import { getFixAdvice } from './mistakeAdvice';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const normalizeMistakes = (trade) =>
  (Array.isArray(trade.mistakes) ? trade.mistakes : [])
    .map(m => (m || '').trim().toLowerCase())
    .filter(Boolean);

export const titleCase = (s) => (s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const summarize = (list) => {
  const count = list.length;
  const wins = list.filter(t => t.pnl > 0).length;
  const totalPnl = list.reduce((s, t) => s + t.pnl, 0);
  return {
    count,
    wins,
    losses: list.filter(t => t.pnl < 0).length,
    totalPnl,
    avgPnl: count ? totalPnl / count : 0,
    winRate: count ? (wins / count) * 100 : 0,
  };
};

// Closed trades, enriched with metrics and normalized mistakes, oldest first.
export const getClosedTrades = (trades) =>
  trades
    .map(t => calculateTradeMetrics(t))
    .filter(t => t && t.status === 'closed')
    .map(t => ({ ...t, mistakeKeys: normalizeMistakes(t) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date) || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));

// Clean trades (no mistakes tagged) vs trades with at least one mistake.
export const getCleanVsMistake = (closed) => ({
  clean: summarize(closed.filter(t => t.mistakeKeys.length === 0)),
  mistake: summarize(closed.filter(t => t.mistakeKeys.length > 0)),
});

// Actual equity vs equity if every trade tagged with a mistake had been skipped.
export const getWhatIfEquity = (closed) => {
  let actual = 0;
  let disciplined = 0;
  const points = closed.map((t, idx) => {
    actual += t.pnl;
    if (t.mistakeKeys.length === 0) disciplined += t.pnl;
    return { idx: idx + 1, date: t.date, actual, disciplined };
  });
  return { points, actual, disciplined, gap: disciplined - actual };
};

// Per-mistake stats including whether the mistake is getting more or less frequent.
export const getMistakeStats = (closed) => {
  const total = closed.length;
  const half = Math.floor(total / 2);
  const stats = {};
  closed.forEach((t, idx) => {
    new Set(t.mistakeKeys).forEach(key => {
      if (!stats[key]) stats[key] = { mistake: key, trades: [], firstHalf: 0, secondHalf: 0 };
      stats[key].trades.push(t);
      if (idx < half) stats[key].firstHalf++;
      else stats[key].secondHalf++;
    });
  });
  return Object.values(stats).map(s => {
    const sum = summarize(s.trades);
    const cost = s.trades.filter(t => t.pnl < 0).reduce((acc, t) => acc + Math.abs(t.pnl), 0);
    // Compare frequency in the older half of the journal with the newer half.
    const firstRate = half ? s.firstHalf / half : 0;
    const secondRate = total - half ? s.secondHalf / (total - half) : 0;
    let trend = 'flat';
    if (total >= 6) {
      if (secondRate > firstRate * 1.25 && s.secondHalf - s.firstHalf >= 1) trend = 'up';
      else if (secondRate < firstRate * 0.75 && s.firstHalf - s.secondHalf >= 1) trend = 'down';
    }
    return {
      mistake: s.mistake,
      label: titleCase(s.mistake),
      ...sum,
      cost,
      frequency: total ? (sum.count / total) * 100 : 0,
      lastSeen: s.trades[s.trades.length - 1].date,
      trend,
    };
  }).sort((a, b) => b.cost - a.cost || b.count - a.count);
};

// Mistake counts per period (month, or ISO week when the journal spans < ~3 months).
export const getMistakeTimeline = (closed, topKeys) => {
  if (!closed.length) return { labels: [], series: {}, tradeCounts: [] };
  const span = (new Date(closed[closed.length - 1].date) - new Date(closed[0].date)) / 86400000;
  const byWeek = span < 90;
  const periodOf = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (!byWeek) return dateStr.slice(0, 7);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return monday.toISOString().slice(0, 10);
  };
  const periods = [];
  const index = {};
  closed.forEach(t => {
    const p = periodOf(t.date);
    if (!(p in index)) { index[p] = periods.length; periods.push(p); }
  });
  const series = {};
  [...topKeys, 'other'].forEach(k => { series[k] = new Array(periods.length).fill(0); });
  const tradeCounts = new Array(periods.length).fill(0);
  closed.forEach(t => {
    const i = index[periodOf(t.date)];
    tradeCounts[i]++;
    t.mistakeKeys.forEach(k => {
      series[topKeys.includes(k) ? k : 'other'][i]++;
    });
  });
  const fmt = (p) => {
    if (!byWeek) {
      const [y, m] = p.split('-');
      return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    return 'Wk ' + new Date(p + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  return { labels: periods.map(fmt), series, tradeCounts, byWeek };
};

// Discipline (share of clean trades) per period – should trend upward as habits improve.
export const getDisciplineTrend = (closed, window = 5) =>
  closed.map((t, idx) => {
    const slice = closed.slice(Math.max(0, idx - window + 1), idx + 1);
    const clean = slice.filter(s => s.mistakeKeys.length === 0).length;
    return { idx: idx + 1, date: t.date, score: (clean / slice.length) * 100 };
  });

export const getEmotionStats = (closed) => {
  const groups = {};
  closed.forEach(t => {
    const e = (t.emotions || '').trim();
    if (!e) return;
    const key = titleCase(e.toLowerCase());
    (groups[key] = groups[key] || []).push(t);
  });
  return Object.entries(groups)
    .map(([emotion, list]) => ({
      emotion,
      ...summarize(list),
      mistakeRate: (list.filter(t => t.mistakeKeys.length > 0).length / list.length) * 100,
    }))
    .sort((a, b) => b.avgPnl - a.avgPnl);
};

export const getPlanStats = (closed) => ({
  followed: summarize(closed.filter(t => t.followedPlan === true)),
  broken: summarize(closed.filter(t => t.followedPlan === false)),
  unknown: closed.filter(t => t.followedPlan !== true && t.followedPlan !== false).length,
});

export const getDayOfWeekStats = (closed) => {
  const days = DAY_NAMES.map(name => ({ day: name, list: [] }));
  closed.forEach(t => {
    const d = new Date(t.date + 'T00:00:00');
    if (!isNaN(d)) days[d.getDay()].list.push(t);
  });
  // Monday-first, hide weekend days with no trades.
  return [1, 2, 3, 4, 5, 6, 0]
    .map(i => days[i])
    .filter((d, i) => d.list.length > 0 || i < 5)
    .map(d => ({ day: d.day, ...summarize(d.list) }));
};

// How the trader performs right after a loss vs after a win (tilt detection).
export const getAfterLossStats = (closed) => {
  const afterLoss = [];
  const afterWin = [];
  for (let i = 1; i < closed.length; i++) {
    if (closed[i - 1].pnl < 0) afterLoss.push(closed[i]);
    else if (closed[i - 1].pnl > 0) afterWin.push(closed[i]);
  }
  const mistakeRate = (list) => list.length ? (list.filter(t => t.mistakeKeys.length > 0).length / list.length) * 100 : 0;
  return {
    afterLoss: { ...summarize(afterLoss), mistakeRate: mistakeRate(afterLoss) },
    afterWin: { ...summarize(afterWin), mistakeRate: mistakeRate(afterWin) },
  };
};

export const getSetupStats = (closed) => {
  const groups = {};
  closed.forEach(t => {
    const keys = Array.isArray(t.tags) && t.tags.length ? t.tags : (t.strategy ? [t.strategy] : []);
    keys.forEach(k => {
      const key = titleCase((k || '').trim().toLowerCase());
      if (key) (groups[key] = groups[key] || []).push(t);
    });
  });
  return Object.entries(groups).map(([setup, list]) => {
    const sum = summarize(list);
    const winsPnl = list.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
    const lossPnl = Math.abs(list.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
    return {
      setup,
      ...sum,
      profitFactor: lossPnl > 0 ? winsPnl / lossPnl : winsPnl > 0 ? Infinity : 0,
      mistakeRate: (list.filter(t => t.mistakeKeys.length > 0).length / list.length) * 100,
    };
  }).sort((a, b) => b.totalPnl - a.totalPnl);
};

export const R_BUCKETS = ['≤ -2R', '-2 to -1R', '-1 to 0R', '0 to 1R', '1 to 2R', '2 to 3R', '≥ 3R'];

export const getRDistribution = (closed) => {
  const counts = new Array(R_BUCKETS.length).fill(0);
  let withR = 0;
  closed.forEach(t => {
    const r = t.rMultiple;
    if (r === null || r === undefined || isNaN(r)) return;
    withR++;
    const i = r <= -2 ? 0 : r <= -1 ? 1 : r < 0 ? 2 : r < 1 ? 3 : r < 2 ? 4 : r < 3 ? 5 : 6;
    counts[i]++;
  });
  return { counts, withR, bigLosses: counts[0] };
};

// Mistakes that tend to happen together on the same trade.
export const getMistakeCombos = (closed) => {
  const combos = {};
  closed.forEach(t => {
    const keys = [...new Set(t.mistakeKeys)].sort();
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const k = `${keys[i]}|${keys[j]}`;
        if (!combos[k]) combos[k] = { pair: [keys[i], keys[j]], count: 0, pnl: 0 };
        combos[k].count++;
        combos[k].pnl += t.pnl;
      }
    }
  });
  return Object.values(combos).sort((a, b) => b.count - a.count || a.pnl - b.pnl);
};

export const getDailyPnl = (closed) => {
  const days = {};
  closed.forEach(t => { days[t.date] = (days[t.date] || 0) + t.pnl; });
  return Object.entries(days).sort(([a], [b]) => new Date(a) - new Date(b)).map(([date, pnl]) => ({ date, pnl }));
};

// 0-100 score: mostly share of clean trades, partly plan adherence.
export const getDisciplineScore = (closed, plan) => {
  if (!closed.length) return 0;
  const cleanShare = closed.filter(t => t.mistakeKeys.length === 0).length / closed.length;
  const rated = plan.followed.count + plan.broken.count;
  const planShare = rated ? plan.followed.count / rated : cleanShare;
  return Math.round((cleanShare * 0.6 + planShare * 0.4) * 100);
};

const fmt$ = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

// Turn the numbers into a prioritized list of coaching suggestions.
export const getSuggestions = ({ closed, mistakeStats, cleanVsMistake, whatIf, plan, emotions, afterLoss, days, setups, rDist, combos, rules, hours, settings }) => {
  const out = [];
  if (closed.length < 3) return out;

  const top = mistakeStats[0];
  if (top && top.cost > 0) {
    const advice = getFixAdvice(top.mistake);
    out.push({
      severity: 'critical',
      title: `#1 leak: ${top.label}`,
      detail: `Happened on ${top.count} trade${top.count > 1 ? 's' : ''} (${top.frequency.toFixed(0)}% of trades) and cost ${fmt$(top.cost)} in losses.`,
      action: `${advice.rule}. ${advice.solution}`,
    });
  }

  if (whatIf.gap > 0 && cleanVsMistake.mistake.count > 0) {
    out.push({
      severity: 'critical',
      title: 'Your rules already make money',
      detail: `Clean trades won ${cleanVsMistake.clean.winRate.toFixed(0)}% vs ${cleanVsMistake.mistake.winRate.toFixed(0)}% for trades with mistakes. Skipping mistake trades would have changed your P&L from ${fmt$(whatIf.actual)} to ${fmt$(whatIf.disciplined)}.`,
      action: 'Before every entry, run a pre-trade checklist. If any box is unchecked, do not take the trade.',
    });
  }

  if (rules && rules.lossLimitDays.length) {
    out.push({
      severity: 'critical',
      title: 'Daily loss limit broken',
      detail: `You hit your ${fmt$(settings.dailyLossLimit)} daily loss limit on ${rules.lossLimitDays.length} day${rules.lossLimitDays.length > 1 ? 's' : ''} (total ${fmt$(rules.costOnLimitDays)}).`,
      action: 'When the limit is reached, close the platform for the day. Set the limit as a hard stop with your broker if possible.',
    });
  }

  if (rules && rules.overtradingDays.length) {
    out.push({
      severity: 'serious',
      title: 'Overtrading days',
      detail: `${rules.overtradingDays.length} day${rules.overtradingDays.length > 1 ? 's' : ''} went over your ${settings.maxTradesPerDay}-trade limit, netting ${fmt$(rules.overtradingPnl)}.`,
      action: 'Count trades on a sticky note. When you reach the limit, you are done – no exceptions.',
    });
  }

  if (rules && rules.oversized.length) {
    const worstRisk = Math.max(...rules.oversized.map(t => t.riskPct));
    out.push({
      severity: 'serious',
      title: 'Position size above your risk rule',
      detail: `${rules.oversized.length} trade${rules.oversized.length > 1 ? 's' : ''} risked more than ${settings.riskPerTradePct}% of the account (up to ${worstRisk.toFixed(1)}%).`,
      action: 'Size every position from the stop distance: size = (account × risk%) ÷ stop distance. The trade form shows this live.',
    });
  }

  if (rules && closed.length >= 5 && rules.noStop.length / closed.length >= 0.2) {
    out.push({
      severity: 'serious',
      title: 'Trades without a stop loss',
      detail: `${rules.noStop.length} of ${closed.length} trades have no stop loss recorded, so risk and R-multiples can't be measured.`,
      action: 'Decide and log the stop before entering. No stop = no trade.',
    });
  }

  if (afterLoss.afterLoss.count >= 3 && afterLoss.afterWin.count >= 1 &&
      (afterLoss.afterLoss.winRate + 10 < afterLoss.afterWin.winRate || afterLoss.afterLoss.mistakeRate > afterLoss.afterWin.mistakeRate + 15)) {
    out.push({
      severity: 'serious',
      title: 'Tilt after losses',
      detail: `After a losing trade your next trade wins ${afterLoss.afterLoss.winRate.toFixed(0)}% of the time with mistakes on ${afterLoss.afterLoss.mistakeRate.toFixed(0)}% of them (after a win: ${afterLoss.afterWin.winRate.toFixed(0)}% win, ${afterLoss.afterWin.mistakeRate.toFixed(0)}% mistakes).`,
      action: 'Enforce a cooldown after every loss (walk away 30 min) and a hard daily stop after 2 losses.',
    });
  }

  if (plan.broken.count > 0 && plan.followed.count > 0 && plan.followed.avgPnl > plan.broken.avgPnl) {
    out.push({
      severity: 'serious',
      title: 'Breaking your plan is expensive',
      detail: `Plan followed: ${plan.followed.winRate.toFixed(0)}% win rate, ${fmt$(plan.followed.avgPnl)} avg. Plan broken: ${plan.broken.winRate.toFixed(0)}% win rate, ${fmt$(plan.broken.avgPnl)} avg across ${plan.broken.count} trades.`,
      action: 'Write the entry, stop and target before clicking buy/sell. No written plan = no trade.',
    });
  }

  const negEmotions = emotions.filter(e => e.count >= 2 && e.avgPnl < 0);
  if (negEmotions.length) {
    const worst = negEmotions[negEmotions.length - 1];
    const best = emotions[0];
    out.push({
      severity: 'warning',
      title: `Trading while ${worst.emotion.toLowerCase()} hurts you`,
      detail: `${negEmotions.map(e => e.emotion).join(', ')} trades lose on average (${worst.emotion}: ${fmt$(worst.avgPnl)} per trade).${best && best.avgPnl > 0 ? ` You trade best when ${best.emotion.toLowerCase()} (${fmt$(best.avgPnl)} avg).` : ''}`,
      action: 'Rate your emotional state before each session. If you feel any of these, trade half size or sit out.',
    });
  }

  const rising = mistakeStats.filter(m => m.trend === 'up');
  if (rising.length) {
    out.push({
      severity: 'warning',
      title: 'Mistakes getting more frequent',
      detail: `${rising.map(m => m.label).join(', ')} showed up more often in your recent trades than earlier ones.`,
      action: 'Pick ONE of these as your focus for the next 20 trades and review every trade against it.',
    });
  }

  if (combos.length && combos[0].count >= 2) {
    const c = combos[0];
    out.push({
      severity: 'warning',
      title: 'Mistakes come in chains',
      detail: `${titleCase(c.pair[0])} + ${titleCase(c.pair[1])} happened together ${c.count} times (net ${fmt$(c.pnl)}). One mistake triggers the next.`,
      action: 'When you notice the first mistake, close the platform – don\'t let it compound.',
    });
  }

  if (rDist.bigLosses > 0) {
    out.push({
      severity: 'serious',
      title: 'Losses bigger than planned risk',
      detail: `${rDist.bigLosses} trade${rDist.bigLosses > 1 ? 's' : ''} lost 2R or more – the stop was moved, ignored or missing.`,
      action: 'Use hard stop orders placed at entry. Never widen a stop once in a trade.',
    });
  }

  const losingSetups = setups.filter(s => s.count >= 3 && s.totalPnl < 0);
  if (losingSetups.length) {
    const s = losingSetups[losingSetups.length - 1];
    out.push({
      severity: 'warning',
      title: `${s.setup} setup is losing`,
      detail: `${s.count} trades, ${s.winRate.toFixed(0)}% win rate, ${fmt$(s.totalPnl)} net. Mistakes on ${s.mistakeRate.toFixed(0)}% of them.`,
      action: s.mistakeRate >= 50 ? 'The setup may be fine – execution is not. Paper-trade it until you can enter it cleanly.' : 'Pause this setup and backtest it before risking more money on it.',
    });
  }

  const tradedDays = days.filter(d => d.count >= 2);
  if (tradedDays.length >= 3) {
    const worstDay = [...tradedDays].sort((a, b) => a.totalPnl - b.totalPnl)[0];
    if (worstDay.totalPnl < 0) {
      out.push({
        severity: 'good',
        title: `Watch your ${worstDay.day}s`,
        detail: `${worstDay.day} is your weakest day: ${fmt$(worstDay.totalPnl)} over ${worstDay.count} trades (${worstDay.winRate.toFixed(0)}% win rate).`,
        action: `Trade smaller on ${worstDay.day}s or only take A+ setups that day.`,
      });
    }
  }

  if (hours && hours.filter(h => h.count >= 2).length >= 3) {
    const worstHour = [...hours].filter(h => h.count >= 2).sort((a, b) => a.totalPnl - b.totalPnl)[0];
    if (worstHour.totalPnl < 0) {
      out.push({
        severity: 'warning',
        title: `Weak hour: ${worstHour.label}`,
        detail: `Trades entered around ${worstHour.label} netted ${fmt$(worstHour.totalPnl)} over ${worstHour.count} trades (${worstHour.winRate.toFixed(0)}% win rate).`,
        action: 'Avoid new entries in this hour, or only take your best setup.',
      });
    }
  }

  const improving = mistakeStats.filter(m => m.trend === 'down');
  if (improving.length) {
    out.push({
      severity: 'good',
      title: 'Progress – keep going',
      detail: `${improving.map(m => m.label).join(', ')} happened less often recently. Your reviews are working.`,
      action: 'Keep journaling every trade; consistency in review is what builds consistency in results.',
    });
  }

  const rank = { critical: 0, serious: 1, warning: 2, good: 3 };
  return out.map((o, i) => ({ ...o, i })).sort((a, b) => rank[a.severity] - rank[b.severity] || a.i - b.i);
};

// Everything the Overview and Analytics pages need, computed in one pass.
export const buildInsights = (trades, settings) => {
  const closed = getClosedTrades(trades);
  const analytics = analyzeTrades(trades);
  const advanced = getAdvancedMetrics(trades);
  const mistakeStats = getMistakeStats(closed);
  const cleanVsMistake = getCleanVsMistake(closed);
  const whatIf = getWhatIfEquity(closed);
  const plan = getPlanStats(closed);
  const emotions = getEmotionStats(closed);
  const afterLoss = getAfterLossStats(closed);
  const days = getDayOfWeekStats(closed);
  const setups = getSetupStats(closed);
  const rDist = getRDistribution(closed);
  const combos = getMistakeCombos(closed);
  const rules = getRuleViolations(trades, settings);
  const hours = getHourStats(closed);
  const topKeys = mistakeStats.slice().sort((a, b) => b.count - a.count).slice(0, 5).map(m => m.mistake);
  const timeline = getMistakeTimeline(closed, topKeys);
  const disciplineTrend = getDisciplineTrend(closed);
  const daily = getDailyPnl(closed);
  const disciplineScore = getDisciplineScore(closed, plan);
  const suggestions = getSuggestions({ closed, mistakeStats, cleanVsMistake, whatIf, plan, emotions, afterLoss, days, setups, rDist, combos, rules, hours, settings });
  return { closed, analytics, advanced, mistakeStats, cleanVsMistake, whatIf, plan, emotions, afterLoss, days, setups, rDist, combos, rules, hours, topKeys, timeline, disciplineTrend, daily, disciplineScore, suggestions };
};
