import React from 'react';
import { useTrades } from '../context/TradeContext';
import { analyzeTrades, analyzeMistakes } from '../utils/analytics';
import { calculateTradeMetrics } from '../utils/analytics';

const MetricCard = ({ label, value, subtext, trend }) => (
  <div className="bg-white dark:bg-apple-gray-800 rounded-apple p-5 shadow-apple border border-apple-gray-200 dark:border-apple-gray-700 transition-colors">
    <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">{label}</div>
    <div className={`text-[28px] font-semibold tracking-tight mb-0.5 ${trend === 'up' ? 'text-apple-green' : trend === 'down' ? 'text-apple-red' : 'text-apple-gray-900 dark:text-white'}`}>
      {value}
    </div>
    {subtext && <div className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400">{subtext}</div>}
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[28px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">Overview</h2>
          <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">Your trading performance at a glance</p>
        </div>
        <button onClick={onAddTrade} className="px-4 py-2 bg-apple-blue hover:bg-[#0051D5] active:bg-[#004FC4] text-white rounded-lg text-[13px] font-medium transition-colors shadow-sm">
          + New Trade
        </button>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Total P&L" value={formatCurrency(analytics.totalPnl)} trend={analytics.totalPnl >= 0 ? 'up' : 'down'} />
        <MetricCard label="Win Rate" value={`${analytics.winRate.toFixed(1)}%`} subtext={`${analytics.winningTrades}W / ${analytics.losingTrades}L`} />
        <MetricCard label="Profit Factor" value={analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)} />
        <MetricCard label="Expectancy" value={formatCurrency(analytics.expectancy)} subtext="per trade" trend={analytics.expectancy >= 0 ? 'up' : 'down'} />
        <MetricCard label="Avg R-Multiple" value={`${analytics.avgRMultiple >= 0 ? '+' : ''}${analytics.avgRMultiple.toFixed(2)}R`} trend={analytics.avgRMultiple >= 0 ? 'up' : 'down'} />
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Leak */}
        <div className="bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden transition-colors">
          <div className="px-5 py-4 border-b border-apple-gray-200 dark:border-apple-gray-700">
            <h3 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">Top Leak to Fix</h3>
          </div>
          <div className="p-5">
            {mistakes.length === 0 ? (
              <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No mistakes tracked yet. Tag mistakes on trades to identify your biggest leaks.</p>
            ) : (
              <div className="flex justify-between items-center p-4 bg-apple-red/5 dark:bg-apple-red/10 border border-apple-red/20 dark:border-apple-red/30 rounded-lg">
                <div>
                  <div className="text-[14px] text-apple-gray-900 dark:text-white font-medium capitalize">{mistakes[0].mistake.replace(/-/g, ' ')}</div>
                  <div className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">{mistakes[0].count} occurrence{mistakes[0].count > 1 ? 's' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-[16px] text-apple-red font-semibold">{formatCurrency(mistakes[0].totalCost)}</div>
                  <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">Focus here first</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Trades */}
        <div className="bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden transition-colors">
          <div className="px-5 py-4 border-b border-apple-gray-200 dark:border-apple-gray-700">
            <h3 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">Recent Trades</h3>
          </div>
          <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
            {recentTrades.length === 0 ? (
              <div className="p-5">
                <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No trades yet. Add your first trade to get started.</p>
              </div>
            ) : (
              recentTrades.map((trade, idx) => (
                <div key={idx} className="px-5 py-3 flex justify-between items-center hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/30 transition-colors">
                  <div>
                    <div className="text-[13px] text-apple-gray-900 dark:text-white font-medium">
                      {trade.pair} <span className={`text-[11px] ${trade.side === 'long' ? 'text-apple-green' : 'text-apple-red'}`}>{trade.side.toUpperCase()}</span>
                    </div>
                    <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">{trade.date}</div>
                  </div>
                  <div className={`text-[13px] font-medium ${trade.status === 'open' ? 'text-apple-gray-400' : trade.pnl > 0 ? 'text-apple-green' : 'text-apple-red'}`}>
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
