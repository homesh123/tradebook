const num = (v) => (v === null || v === undefined || v === '' || isNaN(parseFloat(v)) ? null : parseFloat(v));

// Shared trade definitions used across the app.
export const STANDARD_TAGS = ['Breakout', 'Pullback', 'Reversal', 'Range', 'News', 'Scalp', 'Swing', 'Momentum', 'Support/Resistance', 'VWAP'];
export const STANDARD_MISTAKES = ['FOMO', 'Chased Entry', 'Moved Stop', 'Revenge Trade', 'Overtrading', 'Ignored Plan', 'Early Entry', 'Late Exit', 'Early Exit', 'Oversized Position', 'No Stop Loss', 'Poor Risk Management', 'Emotional'];
export const STANDARD_EMOTIONS = ['Calm', 'Confident', 'Patient', 'Focused', 'Anxious', 'Impatient', 'Greedy', 'Fearful', 'Frustrated', 'Angry', 'Bored', 'Tired', 'Stressed', 'Nervous'];
export const GRADES = ['A+', 'A', 'B', 'C', 'D'];

export const isOpenTrade = (trade) => num(trade.exit) === null && num(trade.netPnl) === null;

/**
 * P&L model:
 * - gross = price move x quantity x multiplier (multiplier = point value / contract size, default 1)
 * - net   = gross - fees, unless the broker's net P&L is entered (netPnl), which wins.
 * - R     = (exit - entry) / (entry - stop), signed for direction (fees excluded).
 */
export const calculateTradeMetrics = (trade) => {
  if (!trade) return null;
  const entry = num(trade.entry) || 0;
  const exit = num(trade.exit);
  const quantity = num(trade.quantity) || 1;
  const multiplier = num(trade.multiplier) || 1;
  const fees = num(trade.fees) || 0;
  const stopLoss = num(trade.stopLoss);
  const takeProfit = num(trade.takeProfit);
  const override = num(trade.netPnl);
  const dir = trade.side === 'short' ? -1 : 1;

  const stopDistance = stopLoss !== null ? Math.abs(entry - stopLoss) : null;
  const risk = stopDistance ? stopDistance * quantity * multiplier : null;
  const plannedRR = stopDistance && takeProfit !== null ? Math.abs(takeProfit - entry) / stopDistance : null;

  if (exit === null && override === null) {
    return { ...trade, status: 'open', pnl: 0, rMultiple: null, pnlPercent: 0, risk, plannedRR };
  }

  const pnl = override !== null ? override : (exit - entry) * dir * quantity * multiplier - fees;
  // R-multiple is price based: how far price moved in your favour, measured in stop distances.
  // This is independent of contract size, so it stays correct for futures, forex and imports.
  let rMultiple = null;
  if (stopDistance && exit !== null) rMultiple = ((exit - entry) * dir) / stopDistance;
  else if (risk && risk > 0) rMultiple = pnl / risk;
  const costBasis = entry * quantity * multiplier;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  return { ...trade, status: 'closed', pnl, rMultiple, pnlPercent, risk, plannedRR };
};

export const analyzeTrades = (trades) => {
  const closedTrades = trades
    .map(t => calculateTradeMetrics(t))
    .filter(t => t.status === 'closed');
  
  if (closedTrades.length === 0) {
    return {
      totalTrades: trades.length,
      closedTrades: 0,
      openTrades: trades.filter(isOpenTrade).length,
      totalPnl: 0,
      winRate: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      avgRMultiple: 0,
      maxDrawdown: 0,
      largestWin: 0,
      largestLoss: 0,
      totalFees: 0
    };
  }
  
  const winningTrades = closedTrades.filter(t => t.pnl > 0);
  const losingTrades = closedTrades.filter(t => t.pnl < 0);
  const breakevenTrades = closedTrades.filter(t => t.pnl === 0);
  
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  
  const winRate = (winningTrades.length / closedTrades.length) * 100;
  const avgWin = winningTrades.length ? totalWins / winningTrades.length : 0;
  const avgLoss = losingTrades.length ? totalLosses / losingTrades.length : 0;
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  
  const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
  
  const rMultiples = closedTrades.filter(t => t.rMultiple !== null && !isNaN(t.rMultiple));
  const avgRMultiple = rMultiples.length ? rMultiples.reduce((sum, t) => sum + t.rMultiple, 0) / rMultiples.length : 0;
  
  const largestWin = winningTrades.length ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
  const largestLoss = losingTrades.length ? Math.min(...losingTrades.map(t => t.pnl)) : 0;
  
  // Calculate drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnl = 0;
  const sorted = [...closedTrades].sort((a,b) => new Date(a.date) - new Date(b.date));
  sorted.forEach(t => {
    runningPnl += t.pnl;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });
  
  const totalFees = closedTrades.reduce((sum, t) => sum + (parseFloat(t.fees) || 0), 0);
  
  return {
    totalTrades: trades.length,
    closedTrades: closedTrades.length,
    openTrades: trades.filter(isOpenTrade).length,
    totalPnl,
    winRate,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakevenTrades: breakevenTrades.length,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    avgRMultiple,
    maxDrawdown,
    largestWin,
    largestLoss,
    totalFees,
    closedTradesData: closedTrades
  };
};

export const analyzeMistakes = (trades) => {
  const mistakeCounts = {};
  const mistakePnl = {};
  const mistakeCosts = {};
  
  trades.forEach(trade => {
    const metrics = calculateTradeMetrics(trade);
    const mistakes = Array.isArray(trade.mistakes) ? trade.mistakes : [];
    if (mistakes.length === 0) return;
    mistakes.forEach(mistake => {
      if (!mistake || mistake.trim() === '') return;
      const key = mistake.trim().toLowerCase();
      mistakeCounts[key] = (mistakeCounts[key] || 0) + 1;
      if (metrics && metrics.pnl !== undefined) {
        if (!mistakePnl[key]) mistakePnl[key] = 0;
        mistakePnl[key] += metrics.pnl;
        if (metrics.pnl < 0) {
          if (!mistakeCosts[key]) mistakeCosts[key] = 0;
          mistakeCosts[key] += Math.abs(metrics.pnl);
        }
      }
    });
  });
  
  const result = Object.keys(mistakeCounts).map(key => ({
    mistake: key,
    count: mistakeCounts[key],
    totalPnl: mistakePnl[key] || 0,
    totalCost: mistakeCosts[key] || 0
  }));
  
  return result.sort((a,b) => b.totalCost - a.totalCost);
};

export const getPerformanceByTag = (trades) => {
  const tagStats = {};
  trades.forEach(trade => {
    const metrics = calculateTradeMetrics(trade);
    if (metrics.status !== 'closed') return;
    const tags = Array.isArray(trade.tags) ? trade.tags : [];
    if (tags.length === 0) return;
    tags.forEach(tag => {
      if (!tag || tag.trim() === '') return;
      const key = tag.trim().toLowerCase();
      if (!tagStats[key]) {
        tagStats[key] = { wins: 0, losses: 0, totalPnl: 0, count: 0, winsPnl: 0, lossesPnl: 0 };
      }
      tagStats[key].count++;
      tagStats[key].totalPnl += metrics.pnl;
      if (metrics.pnl > 0) {
        tagStats[key].wins++;
        tagStats[key].winsPnl += metrics.pnl;
      } else if (metrics.pnl < 0) {
        tagStats[key].losses++;
        tagStats[key].lossesPnl += Math.abs(metrics.pnl);
      }
    });
  });
  
  return Object.keys(tagStats).map(key => ({
    tag: key,
    ...tagStats[key],
    winRate: tagStats[key].count > 0 ? (tagStats[key].wins / tagStats[key].count) * 100 : 0,
    profitFactor: tagStats[key].lossesPnl > 0 ? tagStats[key].winsPnl / tagStats[key].lossesPnl : tagStats[key].winsPnl > 0 ? Infinity : 0
  })).sort((a,b) => b.totalPnl - a.totalPnl);
};

export const getEquityCurve = (trades) => {
  const closedTrades = trades
    .map(t => calculateTradeMetrics(t))
    .filter(t => t.status === 'closed')
    .sort((a,b) => new Date(a.date) - new Date(b.date));
  
  let running = 0;
  const curve = [{ date: closedTrades[0]?.date || new Date().toISOString().split('T')[0], value: 0, pnl: 0 }];
  closedTrades.forEach(t => {
    running += t.pnl;
    curve.push({ date: t.date, value: running, pnl: t.pnl });
  });
  return curve;
};
