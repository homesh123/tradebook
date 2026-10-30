import React from 'react';
import { useTrades } from '../context/TradeContext';
import { analyzeMistakes, calculateTradeMetrics } from '../utils/analytics';

const MistakesInsights = () => {
  const { trades } = useTrades();
  const mistakes = analyzeMistakes(trades);
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };
  
  const totalMistakeCost = mistakes.reduce((sum, m) => sum + m.totalCost, 0);
  const tradesWithMistakes = trades.filter(t => Array.isArray(t.mistakes) && t.mistakes.length > 0).length;
  
  const getFixAdvice = (mistake) => {
    const advice = {
      'fomo': 'Wait for your setup criteria to be fully met. Use a checklist before entry.',
      'chased entry': 'Set limit orders at your planned entry zone, avoid market orders in FOMO.',
      'moved stop': 'Never move stop away from price. If invalidated, accept the loss.',
      'revenge trade': 'Take a break after 2 consecutive losses. Cool down for at least 30 min.',
      'overtrading': 'Set a max daily trade limit. Quality over quantity.',
      'ignored plan': 'Review your playbook before each session. Grade adherence daily.',
      'early entry': 'Wait for confirmation. Use proper entry triggers, not anticipation.',
      'late exit': 'Stick to take profit rules or use trailing stop per plan.',
      'poor risk management': 'Risk 1% max per trade. Always define risk before entry.',
      'emotional': 'Journal emotions pre-trade. If not in optimal state, skip trade.'
    };
    return advice[mistake] || 'Define a specific rule to prevent this mistake and review it daily.';
  };
  
  const getImpactLevel = (cost) => {
    if (cost > 500) return { level: 'Critical', color: 'text-apple-red', bg: 'bg-apple-red/10' };
    if (cost > 200) return { level: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (cost > 50) return { level: 'Medium', color: 'text-apple-yellow', bg: 'bg-apple-yellow/10' };
    return { level: 'Low', color: 'text-apple-gray-500', bg: 'bg-apple-gray-500/10' };
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] sm:text-[28px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">Mistake Analysis</h2>
        <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">Turn your mistakes into actionable improvements</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-apple-gray-800 rounded-apple p-5 shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Total Cost</div>
          <div className="text-[24px] font-semibold text-apple-red tracking-tight">{formatCurrency(totalMistakeCost)}</div>
        </div>
        <div className="bg-white dark:bg-apple-gray-800 rounded-apple p-5 shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Trades with Mistakes</div>
          <div className="text-[24px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">{tradesWithMistakes}</div>
        </div>
        <div className="bg-white dark:bg-apple-gray-800 rounded-apple p-5 shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Unique Mistakes</div>
          <div className="text-[24px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">{mistakes.length}</div>
        </div>
      </div>
      
      {mistakes.length === 0 ? (
        <div className="bg-white dark:bg-apple-gray-800 rounded-apple p-8 text-center shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-[17px] font-semibold text-apple-gray-900 dark:text-white mb-2">Clean Trading So Far!</h3>
          <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No mistakes tagged yet. Keep it up, or tag mistakes when they happen to track improvement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔥</span>
            <h3 className="text-[17px] font-semibold text-apple-gray-900 dark:text-white">Priority Fix List</h3>
          </div>
          
          {mistakes.map((mistake, idx) => {
            const impact = getImpactLevel(mistake.totalCost);
            return (
              <div key={idx} className="bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[16px] font-semibold text-apple-gray-900 dark:text-white capitalize">
                          #{idx + 1}. {mistake.mistake.replace(/-/g, ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${impact.bg} ${impact.color}`}>
                          {impact.level}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-[13px] text-apple-gray-600 dark:text-apple-gray-400">
                        <span>Occurrences: <strong className="text-apple-gray-900 dark:text-white">{mistake.count}</strong></span>
                        <span>Total Cost: <strong className="text-apple-red">{formatCurrency(mistake.totalCost)}</strong></span>
                        <span>Net Impact: <strong className={mistake.totalPnl >= 0 ? 'text-apple-green' : 'text-apple-red'}>{formatCurrency(mistake.totalPnl)}</strong></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/20 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-base">💡</span>
                      <span className="text-[13px] font-medium text-apple-gray-900 dark:text-white">Action Plan</span>
                    </div>
                    <p className="text-[13px] text-apple-gray-700 dark:text-apple-gray-300 leading-relaxed">
                      {getFixAdvice(mistake.mistake)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Improvement Tracker */}
      {mistakes.length > 0 && (
        <div className="bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-apple-gray-200 dark:border-apple-gray-700">
            <h3 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">Weekly Focus</h3>
          </div>
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-apple-blue/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <p className="text-[14px] text-apple-gray-900 dark:text-white font-medium mb-1">
                  This Week's Goal: Eliminate "{mistakes[0].mistake.replace(/-/g, ' ')}"
                </p>
                <p className="text-[13px] text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
                  Focus exclusively on preventing this mistake for your next 10 trades. Review your action plan before every trade and grade yourself honestly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MistakesInsights;
