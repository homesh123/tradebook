import React from 'react';
import { useTrades } from '../context/TradeContext';
import { analyzeTrades, analyzeMistakes } from '../utils/analytics';
import { calculateTradeMetrics } from '../utils/analytics';

const MetricCard = ({ label, value, subtext, trend }) => (
  <div className="bg-white dark:bg-apple-gray-800 rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-apple-gray-200 dark:border-apple-gray-700 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all duration-200">
    <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider mb-1.5 font-medium">{label}</div>
    <div className={`text-[24px] sm:text-[28px] font-semibold tracking-tight leading-none mb-1 ${trend === 'up' ? 'text-apple-green' : trend === 'down' ? 'text-apple-red' : 'text-apple-gray-900 dark:text-white'}`}>
      {value}
    </div>
    {subtext && <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">{subtext}</div>}
  </div>
);

const Overview = ({ onAddTrade }) => {
  const { trades } = useTrades();
  const analytics = analyzeTrades(trades);
  const mistakes = analyzeMistakes(trades);
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };
  
  const recentTrades = trades.slice(0, 5).map(t => calculateTradeMetrics(t));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold text-apple-gray-900 dark:text-white tracking-tight leading-tight">Overview</h1>
          <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">Track performance and identify areas to improve</p>
        </div>
        <button onClick={onAddTrade} className="px-4 py-2 bg-apple-blue hover:bg-[#0051D5] active:bg-[#004FC4] text-white rounded-lg text-[13px] font-medium transition-all duration-150 shadow-sm hover:shadow-md self-start sm:self-auto">
          + New Trade
        </button>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <MetricCard label="Total P&L" value={formatCurrency(analytics.totalPnl)} trend={analytics.totalPnl >= 0 ? 'up' : 'down'} />
        <MetricCard label="Win Rate" value={`${analytics.winRate.toFixed(1)}%`} subtext={`${analytics.winningTrades}W · ${analytics.losingTrades}L`} />
        <MetricCard label="Profit Factor" value={analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)} />
        <MetricCard label="Expectancy" value={formatCurrency(analytics.expectancy)} subtext="per trade" trend={analytics.expectancy >= 0 ? 'up' : 'down'} />
        <MetricCard label="Avg R-Multiple" value={`${analytics.avgRMultiple >= 0 ? '+' : ''}${analytics.avgRMultiple.toFixed(2)}R`} trend={analytics.avgRMultiple >= 0 ? 'up' : 'down'} />
      </div>
      
      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Top Leak */}
        <div className="bg-white dark:bg-apple-gray-800 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-apple-gray-200 dark:border-apple-gray-700">
            <h2 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">Top Leak to Fix</h2>
          </div>
          <div className="p-5">
            {mistakes.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No mistakes tracked yet. Tag mistakes on trades to identify your biggest leaks.</p>
              </div>
            ) : (
              <div className="flex justify-between items-center p-4 bg-apple-red/8 dark:bg-apple-red/12 border border-apple-red/25 dark:border-apple-red/35 rounded-lg">
                <div>
                  <div className="text-[14px] text-apple-gray-900 dark:text-white font-medium capitalize">{mistakes[0].mistake.replace(/-/g, ' ')}</div>
                  <div className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">{mistakes[0].count} occurrence{mistakes[0].count > 1 ? 's' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] text-apple-red font-semibold">{formatCurrency(mistakes[0].totalCost)}</div>
                  <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">Focus here first</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Trades */}
        <div className="bg-white dark:bg-apple-gray-800 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-apple-gray-200 dark:border-apple-gray-700 flex justify-between items-center">
            <h2 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">Recent Trades</h2>
          </div>
          <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
            {recentTrades.length === 0 ? (
              <div className="p-5 text-center py-6">
                <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No trades yet. Add your first trade to get started.</p>
              </div>
            ) : (
              recentTrades.map((trade, idx) => (
                <div key={idx} className="px-5 py-3 flex justify-between items-center hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/40 transition-colors duration-150">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-[13px] text-apple-gray-900 dark:text-white font-medium">{trade.pair}</div>
                      <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 flex items-center gap-1.5">
                        <span className={trade.side === 'long' ? 'text-apple-green' : 'text-apple-red'}>{trade.side.toUpperCase()}</span>
                        <span>•</span>
                        <span>{trade.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-[13px] font-medium tabular-nums ${trade.status === 'open' ? 'text-apple-gray-400' : trade.pnl > 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                    {trade.status === 'open' ? 'OPEN' : `${trade.pnl > 0 ? '+' : ''}${formatCurrency(trade.pnl)}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
