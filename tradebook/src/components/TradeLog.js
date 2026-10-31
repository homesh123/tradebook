import React, { useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { calculateTradeMetrics } from '../utils/analytics';

const TradeLog = () => {
  const { trades, deleteTrade } = useTrades();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.pair.toLowerCase().includes(search.toLowerCase()) || 
                         (trade.notes && trade.notes.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (filter === 'open') return trade.exit === null || trade.exit === undefined || trade.exit === '';
    if (filter === 'closed') return trade.exit !== null && trade.exit !== undefined && trade.exit !== '';
    if (filter === 'winners') {
      const m = calculateTradeMetrics(trade);
      return m && m.pnl > 0;
    }
    if (filter === 'losers') {
      const m = calculateTradeMetrics(trade);
      return m && m.pnl < 0;
    }
    return true;
  });
  
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };
  
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[24px] sm:text-[28px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">Trade Log</h2>
        <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">All your trades in one place</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white dark:bg-apple-gray-800 text-apple-gray-900 dark:text-white text-[13px] flex-1 border border-apple-gray-200 dark:border-apple-gray-700 focus:border-apple-blue transition-colors placeholder:text-apple-gray-400"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-white dark:bg-apple-gray-800 text-apple-gray-900 dark:text-white text-[13px] border border-apple-gray-200 dark:border-apple-gray-700 focus:border-apple-blue transition-colors">
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="winners">Winners</option>
          <option value="losers">Losers</option>
        </select>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-apple-gray-200 dark:border-apple-gray-700">
                <th className="text-left px-5 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Date</th>
                <th className="text-left px-5 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Symbol</th>
                <th className="text-left px-5 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Side</th>
                <th className="text-right px-5 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Qty</th>
                <th className="text-right px-5 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Entry</th>
                <th className="text-right px-5 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Exit</th>
                <th className="text-right px-5 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">P&L</th>
                <th className="text-right px-5 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">R</th>
                <th className="text-left px-5 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Tags</th>
                <th className="text-center px-5 py-3 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center px-5 py-12 text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No trades found</td>
                </tr>
              ) : (
                filteredTrades.map(trade => {
                  const metrics = calculateTradeMetrics(trade);
                  return (
                    <tr key={trade.id} className="hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/30 transition-colors">
                      <td className="px-5 py-3 text-[13px] text-apple-gray-600 dark:text-apple-gray-400">{trade.date}</td>
                      <td className="px-5 py-3 text-[13px] text-apple-gray-900 dark:text-white font-medium">{trade.pair}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-medium ${trade.side === 'long' ? 'text-apple-green' : 'text-apple-red'}`}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] text-apple-gray-900 dark:text-white">{trade.quantity}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-apple-gray-900 dark:text-white">{trade.entry}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-apple-gray-900 dark:text-white">{trade.exit || '—'}</td>
                      <td className={`px-5 py-3 text-right text-[13px] font-medium ${metrics.status === 'open' ? 'text-apple-gray-400' : metrics.pnl > 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                        {metrics.status === 'open' ? 'OPEN' : `${metrics.pnl > 0 ? '+' : ''}${formatCurrency(metrics.pnl)}`}
                      </td>
                      <td className={`px-5 py-3 text-right text-[13px] ${metrics.rMultiple > 0 ? 'text-apple-green' : metrics.rMultiple < 0 ? 'text-apple-red' : 'text-apple-gray-400'}`}>
                        {metrics.rMultiple !== null ? `${metrics.rMultiple >= 0 ? '+' : ''}${metrics.rMultiple.toFixed(2)}R` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {trade.tags && trade.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue rounded text-[11px]">{tag}</span>
                          ))}
                          {trade.mistakes && trade.mistakes.slice(0, 1).map((mistake, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-apple-red/10 dark:bg-apple-red/20 text-apple-red rounded text-[11px]">{mistake}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button onClick={() => deleteTrade(trade.id)} className="text-[12px] text-apple-red hover:underline">Delete</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filteredTrades.length === 0 ? (
          <div className="bg-white dark:bg-apple-gray-800 rounded-apple p-8 text-center text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No trades found</div>
        ) : (
          filteredTrades.map(trade => {
            const metrics = calculateTradeMetrics(trade);
            return (
              <div key={trade.id} className="bg-white dark:bg-apple-gray-800 rounded-apple p-4 shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[15px] font-medium text-apple-gray-900 dark:text-white">{trade.pair} <span className={`text-[12px] ${trade.side === 'long' ? 'text-apple-green' : 'text-apple-red'}`}>{trade.side.toUpperCase()}</span></div>
                    <div className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400">{trade.date}</div>
                  </div>
                  <div className={`text-[15px] font-semibold ${metrics.status === 'open' ? 'text-apple-gray-400' : metrics.pnl > 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                    {metrics.status === 'open' ? 'OPEN' : `${metrics.pnl > 0 ? '+' : ''}${formatCurrency(metrics.pnl)}`}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[12px] mb-2">
                  <div><span className="text-apple-gray-500 dark:text-apple-gray-400">Entry:</span> <span className="text-apple-gray-900 dark:text-white">{trade.entry}</span></div>
                  <div><span className="text-apple-gray-500 dark:text-apple-gray-400">Exit:</span> <span className="text-apple-gray-900 dark:text-white">{trade.exit || '—'}</span></div>
                  <div><span className="text-apple-gray-500 dark:text-apple-gray-400">Qty:</span> <span className="text-apple-gray-900 dark:text-white">{trade.quantity}</span></div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {trade.tags && trade.tags.map((tag, idx) => (<span key={idx} className="px-1.5 py-0.5 bg-apple-blue/10 text-apple-blue rounded text-[11px]">{tag}</span>))}
                  {trade.mistakes && trade.mistakes.map((mistake, idx) => (<span key={idx} className="px-1.5 py-0.5 bg-apple-red/10 text-apple-red rounded text-[11px]">{mistake}</span>))}
                </div>
                <button onClick={() => deleteTrade(trade.id)} className="text-[12px] text-apple-red">Delete</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TradeLog;
