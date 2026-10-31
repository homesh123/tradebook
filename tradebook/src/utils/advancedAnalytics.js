import { calculateTradeMetrics, analyzeTrades } from './analytics';

export const getAdvancedMetrics = (trades) => {
  const closedTrades = trades
    .map(t => calculateTradeMetrics(t))
    .filter(t => t.status === 'closed');
  
  if (closedTrades.length < 2) {
    return {
      sharpeRatio: 0,
      recoveryFactor: 0,
      consistencyScore: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      avgHoldTime: 0,
      bestDay: null,
      worstDay: null,
      bestTime: null,
      worstTime: null,
      tradingDays: 0,
      profitableDays: 0
    };
  }
  
  // Sharpe Ratio
  const returns = closedTrades.map(t => t.pnl);
  const meanReturn = returns.reduce((a,b) => a+b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? meanReturn / stdDev : 0;
  
  // Recovery Factor
  let peak = 0, maxDrawdown = 0, running = 0;
  closedTrades.sort((a,b) => new Date(a.date) - new Date(b.date));
  closedTrades.forEach(t => {
    running += t.pnl;
    if (running > peak) peak = running;
    const dd = peak - running;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });
  const totalProfit = closedTrades.reduce((s,t) => s + t.pnl, 0);
  const recoveryFactor = maxDrawdown > 0 ? totalProfit / maxDrawdown : 0;
  
  // Consecutive wins/losses
  let maxConsecutiveWins = 0, maxConsecutiveLosses = 0;
  let currentWins = 0, currentLosses = 0;
  closedTrades.forEach(t => {
    if (t.pnl > 0) {
      currentWins++; currentLosses = 0;
      if (currentWins > maxConsecutiveWins) maxConsecutiveWins = currentWins;
    } else if (t.pnl < 0) {
      currentLosses++; currentWins = 0;
      if (currentLosses > maxConsecutiveLosses) maxConsecutiveLosses = currentLosses;
    }
  });
  
  // Consistency score (profitable days / trading days)
  const dailyPnL = {};
  closedTrades.forEach(t => {
    if (!dailyPnL[t.date]) dailyPnL[t.date] = 0;
    dailyPnL[t.date] += t.pnl;
  });
  const tradingDays = Object.keys(dailyPnL).length;
  const profitableDays = Object.values(dailyPnL).filter(p => p > 0).length;
  const consistencyScore = tradingDays > 0 ? (profitableDays / tradingDays) * 100 : 0;
  
  // Best/Worst day
  let bestDay = null, worstDay = null;
  Object.entries(dailyPnL).forEach(([date, pnl]) => {
    if (!bestDay || pnl > bestDay.pnl) bestDay = { date, pnl };
    if (!worstDay || pnl < worstDay.pnl) worstDay = { date, pnl };
  });
  
  // Time of day analysis
  const timeStats = {};
  closedTrades.forEach(t => {
    const hour = new Date(t.date + ' 12:00').getHours();
    const period = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
    if (!timeStats[period]) timeStats[period] = { pnl: 0, count: 0, wins: 0 };
    timeStats[period].pnl += t.pnl;
    timeStats[period].count++;
    if (t.pnl > 0) timeStats[period].wins++;
  });
  let bestTime = null, worstTime = null;
  Object.entries(timeStats).forEach(([period, stats]) => {
    if (!bestTime || stats.pnl > bestTime.stats.pnl) bestTime = { period, stats };
    if (!worstTime || stats.pnl < worstTime.stats.pnl) worstTime = { period, stats };
  });
  
  return {
    sharpeRatio,
    recoveryFactor,
    consistencyScore,
    maxConsecutiveWins,
    maxConsecutiveLosses,
    bestDay,
    worstDay,
    bestTime,
    worstTime,
    timeStats,
    tradingDays,
    profitableDays
  };
};

export const getEmotionPerformance = (trades) => {
  const emotionStats = {};
  trades.forEach(trade => {
    const metrics = calculateTradeMetrics(trade);
    if (metrics.status !== 'closed' || !trade.emotions) return;
    const emotion = trade.emotions.trim();
    if (!emotion) return;
    if (!emotionStats[emotion]) {
      emotionStats[emotion] = { pnl: 0, count: 0, wins: 0, losses: 0 };
    }
    emotionStats[emotion].pnl += metrics.pnl;
    emotionStats[emotion].count++;
    if (metrics.pnl > 0) emotionStats[emotion].wins++;
    else if (metrics.pnl < 0) emotionStats[emotion].losses++;
  });
  
  return Object.entries(emotionStats).map(([emotion, stats]) => ({
    emotion,
    ...stats,
    winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0,
    avgPnl: stats.count > 0 ? stats.pnl / stats.count : 0
  })).sort((a,b) => b.avgPnl - a.avgPnl);
};

export const getPlanAdherence = (trades) => {
  const followed = trades.filter(t => t.followedPlan === true);
  const notFollowed = trades.filter(t => t.followedPlan === false);
  
  const followedMetrics = analyzeTrades(followed);
  const notFollowedMetrics = analyzeTrades(notFollowed);
  
  return {
    followed: { count: followed.length, pnl: followedMetrics.totalPnl, winRate: followedMetrics.winRate },
    notFollowed: { count: notFollowed.length, pnl: notFollowedMetrics.totalPnl, winRate: notFollowedMetrics.winRate }
  };
};
