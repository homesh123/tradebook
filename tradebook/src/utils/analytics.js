export const calculateTradeMetrics = (trade) => {
  if (!trade) return null;
  const entry = parseFloat(trade.entry) || 0;
  const exit = trade.exit === null || trade.exit === undefined || trade.exit === '' ? null : parseFloat(trade.exit);
  const quantity = parseFloat(trade.quantity) || 1;
  const fees = parseFloat(trade.fees) || 0;
  const stopLoss = trade.stopLoss === null || trade.stopLoss === undefined || trade.stopLoss === '' ? null : parseFloat(trade.stopLoss);
  
  if (exit === null || exit === undefined) {
    return { ...trade, status: 'open', pnl: 0, rMultiple: null, pnlPercent: 0 };
  }
  
  let pnl;
  if (trade.side === 'short') {
    pnl = (entry - exit) * quantity - fees;
  } else {
    pnl = (exit - entry) * quantity - fees;
  }
  
  let risk = null;
  if (stopLoss !== null) {
    if (trade.side === 'short') {
      risk = Math.abs(stopLoss - entry) * quantity;
    } else {
      risk = Math.abs(entry - stopLoss) * quantity;
    }
  }
  const rMultiple = risk && risk > 0 ? pnl / risk : null;
  const costBasis = entry * quantity;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  
  return { ...trade, status: 'closed', pnl, rMultiple, pnlPercent, risk };
};

export const analyzeTrades = (trades) => {
  const closedTrades = trades
    .map(t => calculateTradeMetrics(t))
    .filter(t => t.status === 'closed');
  
  if (closedTrades.length === 0) {
    return {
      totalTrades: trades.length,
      closedTrades: 0,
      openTrades: trades.filter(t => t.status !== 'closed' && (t.exit === null || t.exit === undefined || t.exit === '')).length,
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
    openTrades: trades.filter(t => t.exit === null || t.exit === undefined || t.exit === '').length,
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
