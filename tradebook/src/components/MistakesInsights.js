import React, { useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { analyzeMistakes, calculateTradeMetrics } from '../utils/analytics';
import { getFixAdvice } from '../utils/mistakeAdvice';

const MistakesInsights = () => {
  const { trades } = useTrades();
  const mistakes = analyzeMistakes(trades);
  const [expandedMistake, setExpandedMistake] = useState(null);
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };
  
  const totalMistakeCost = mistakes.reduce((sum, m) => sum + m.totalCost, 0);
  const tradesWithMistakes = trades.filter(t => Array.isArray(t.mistakes) && t.mistakes.length > 0).length;
  
  const getImpactLevel = (cost) => {
    if (cost > 500) return { level: 'Critical', color: 'text-apple-red', bg: 'bg-apple-red/10', border: 'border-apple-red/30' };
    if (cost > 200) return { level: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
    if (cost > 50) return { level: 'Medium', color: 'text-apple-yellow', bg: 'bg-apple-yellow/10', border: 'border-apple-yellow/30' };
    return { level: 'Low', color: 'text-apple-gray-500', bg: 'bg-apple-gray-500/10', border: 'border-apple-gray-500/30' };
  };
  
  const getTradesWithMistake = (mistakeKey) => {
    return trades.filter(t => {
      const mistakes = Array.isArray(t.mistakes) ? t.mistakes : [];
      return mistakes.some(m => m.toLowerCase() === mistakeKey);
    }).map(t => calculateTradeMetrics(t));
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] sm:text-[28px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">Mistake Pattern Analysis</h2>
        <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">Find repeating patterns and fix them systematically</p>
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
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">{trades.length > 0 ? ((tradesWithMistakes/trades.length)*100).toFixed(0) : 0}% of trades</div>
        </div>
        <div className="bg-white dark:bg-apple-gray-800 rounded-apple p-5 shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Repeating Patterns</div>
          <div className="text-[24px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">{mistakes.filter(m => m.count >= 2).length}</div>
        </div>
      </div>
      
      {mistakes.length === 0 ? (
        <div className="bg-white dark:bg-apple-gray-800 rounded-apple p-8 text-center shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-[17px] font-semibold text-apple-gray-900 dark:text-white mb-2">Clean Trading!</h3>
          <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400">Tag mistakes on your trades to uncover patterns and fix them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <h3 className="text-[17px] font-semibold text-apple-gray-900 dark:text-white">Pattern Detection</h3>
          </div>
          
          {mistakes.map((mistake, idx) => {
            const impact = getImpactLevel(mistake.totalCost);
            const advice = getFixAdvice(mistake.mistake);
            const mistakeTrades = getTradesWithMistake(mistake.mistake);
            const isExpanded = expandedMistake === mistake.mistake;
            const avgLoss = mistakeTrades.filter(t => t.pnl < 0).reduce((s,t) => s + Math.abs(t.pnl), 0) / (mistakeTrades.filter(t => t.pnl < 0).length || 1);
            
            return (
              <div key={idx} className={`bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple border ${impact.border} overflow-hidden transition-all`}>
                <button 
                  onClick={() => setExpandedMistake(isExpanded ? null : mistake.mistake)}
                  className="w-full p-5 text-left hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[16px] font-semibold text-apple-gray-900 dark:text-white capitalize">
                          {mistake.mistake.replace(/-/g, ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${impact.bg} ${impact.color}`}>
                          {impact.level}
                        </span>
                        {mistake.count >= 3 && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-apple-red/10 text-apple-red">REPEATING</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-[12px] text-apple-gray-600 dark:text-apple-gray-400">
                        <span>×{mistake.count} times</span>
                        <span>•</span>
                        <span className="text-apple-red font-medium">{formatCurrency(mistake.totalCost)} lost</span>
                        <span>•</span>
                        <span>Avg loss: {formatCurrency(avgLoss)}</span>
                      </div>
                    </div>
                    <div className="text-apple-gray-400">{isExpanded ? '▲' : '▼'}</div>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="border-t border-apple-gray-200 dark:border-apple-gray-700">
                    {/* Pattern Analysis */}
                    <div className="p-5 space-y-4">
                      <div>
                        <h4 className="text-[14px] font-semibold text-apple-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <span>📊</span> Pattern Analysis
                        </h4>
                        <p className="text-[13px] text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
                          This mistake occurred in <strong className="text-apple-gray-900 dark:text-white">{mistake.count}</strong> trade{mistake.count > 1 ? 's' : ''}, costing you <strong className="text-apple-red">{formatCurrency(mistake.totalCost)}</strong> total. 
                          {mistake.count >= 3 ? ' This is a strong recurring pattern that needs immediate attention.' : ' This pattern is starting to emerge.'}
                        </p>
                      </div>
                      
                      {/* Affected Trades */}
                      <div>
                        <h4 className="text-[14px] font-semibold text-apple-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <span>📋</span> Affected Trades
                        </h4>
                        <div className="bg-apple-gray-50 dark:bg-apple-gray-900/50 rounded-lg overflow-hidden">
                          <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                            {mistakeTrades.slice(0, 5).map((t, tidx) => (
                              <div key={tidx} className="px-4 py-2.5 flex justify-between items-center text-[12px]">
                                <div className="flex items-center gap-3">
                                  <span className="text-apple-gray-600 dark:text-apple-gray-400">{t.date}</span>
                                  <span className="font-medium text-apple-gray-900 dark:text-white">{t.pair}</span>
                                  <span className={t.side === 'long' ? 'text-apple-green' : 'text-apple-red'}>{t.side.toUpperCase()}</span>
                                </div>
                                <span className={t.pnl >= 0 ? 'text-apple-green' : 'text-apple-red'}>{t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Solution */}
                      <div className="bg-gradient-to-br from-apple-green/5 to-apple-blue/5 dark:from-apple-green/10 dark:to-apple-blue/10 border border-apple-green/30 rounded-lg p-4">
                        <h4 className="text-[14px] font-semibold text-apple-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <span>✅</span> Solution & Prevention
                        </h4>
                        <div className="space-y-3 text-[13px]">
                          <div>
                            <span className="font-medium text-apple-gray-900 dark:text-white">Rule to Follow:</span>
                            <p className="text-apple-gray-700 dark:text-apple-gray-300 mt-1">{advice.rule}</p>
                          </div>
                          <div>
                            <span className="font-medium text-apple-gray-900 dark:text-white">Action Steps:</span>
                            <p className="text-apple-gray-700 dark:text-apple-gray-300 mt-1 leading-relaxed">{advice.solution}</p>
                          </div>
                          <div>
                            <span className="font-medium text-apple-gray-900 dark:text-white">Prevention Method:</span>
                            <p className="text-apple-gray-700 dark:text-apple-gray-300 mt-1 leading-relaxed">{advice.prevention}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MistakesInsights;
