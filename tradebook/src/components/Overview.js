import React from 'react';
import { useTrades } from '../context/TradeContext';
import { analyzeTrades, analyzeMistakes } from '../utils/analytics';
import { calculateTradeMetrics } from '../utils/analytics';

const Overview = ({ onAddTrade }) => {
  const { trades } = useTrades();
  const analytics = analyzeTrades(trades);
  const mistakes = analyzeMistakes(trades);
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };
  
  const recentTrades = trades.slice(0, 5).map(t => calculateTradeMetrics(t));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Overview</h2>
        <button onClick={onAddTrade} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">+ Add Trade</button>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Total PnL</div>
          <div className={`text-xl font-bold ${analytics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(analytics.totalPnl)}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Win Rate</div>
          <div className="text-xl font-bold text-white">{analytics.winRate.toFixed(1)}%</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Profit Factor</div>
          <div className="text-xl font-bold text-white">
            {analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Expectancy</div>
          <div className={`text-xl font-bold ${analytics.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(analytics.expectancy)}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Avg R</div>
          <div className={`text-xl font-bold ${analytics.avgRMultiple >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {analytics.avgRMultiple >= 0 ? '+' : ''}{analytics.avgRMultiple.toFixed(2)}R
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Leak */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">🔥 Top Leak to Fix</h3>
          {mistakes.length === 0 ? (
            <p className="text-slate-400">No mistakes tracked yet. Tag mistakes on trades to identify your biggest leaks.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-red-900/20 border border-red-800 rounded">
                <div>
                  <div className="text-white font-medium capitalize">{mistakes[0].mistake.replace(/-/g, ' ')}</div>
                  <div className="text-sm text-slate-400">{mistakes[0].count} occurrence(s)</div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold">{formatCurrency(mistakes[0].totalCost)} lost</div>
                  <div className="text-sm text-slate-400">Focus here first</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Recent Trades */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Recent Trades</h3>
          {recentTrades.length === 0 ? (
            <p className="text-slate-400">No trades yet. Add your first trade to get started.</p>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((trade, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 border-b border-slate-700/50">
                  <div>
                    <div className="text-white">{trade.pair} <span className={trade.side === 'long' ? 'text-green-400' : 'text-red-400'}>{trade.side.toUpperCase()}</span></div>
                    <div className="text-xs text-slate-400">{trade.date}</div>
                  </div>
                  <div className={`font-medium ${trade.status === 'open' ? 'text-slate-400' : trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.status === 'open' ? 'OPEN' : (trade.pnl > 0 ? '+' : '') + formatCurrency(trade.pnl)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Action Items */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-slate-300">
          <li>• <strong>Focus on one fix:</strong> Pick your top leak and work on it for the next 7-10 trades</li>
          <li>• <strong>Track risk:</strong> Always log stop loss to see R-multiples and true risk-adjusted performance</li>
          <li>• <strong>Be honest:</strong> Tag mistakes even when they sting - that's where growth comes from</li>
          <li>• <strong>Review by setup:</strong> Check Analytics to find which setups actually have an edge</li>
        </ul>
      </div>
    </div>
  );
};

export default Overview;
