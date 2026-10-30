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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search by symbol or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded bg-slate-700 text-white flex-1 min-w-[200px]"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 rounded bg-slate-700 text-white">
          <option value="all">All Trades</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="winners">Winners</option>
          <option value="losers">Losers</option>
        </select>
      </div>
      
      <div className="bg-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-3 text-slate-400">Date</th>
              <th className="text-left p-3 text-slate-400">Pair</th>
              <th className="text-left p-3 text-slate-400">Side</th>
              <th className="text-right p-3 text-slate-400">Qty</th>
              <th className="text-right p-3 text-slate-400">Entry</th>
              <th className="text-right p-3 text-slate-400">Exit</th>
              <th className="text-right p-3 text-slate-400">SL/TP</th>
              <th className="text-right p-3 text-slate-400">PnL</th>
              <th className="text-right p-3 text-slate-400">R</th>
              <th className="text-left p-3 text-slate-400">Tags/Mistakes</th>
              <th className="text-left p-3 text-slate-400">Notes</th>
              <th className="text-center p-3 text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center p-8 text-slate-400">No trades found</td>
              </tr>
            ) : (
              filteredTrades.map(trade => {
                const metrics = calculateTradeMetrics(trade);
                return (
                  <tr key={trade.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-3 text-slate-300">{trade.date}</td>
                    <td className="p-3 text-white font-medium">{trade.pair}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${trade.side === 'long' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-300">{trade.quantity}</td>
                    <td className="p-3 text-right text-slate-300">{trade.entry}</td>
                    <td className="p-3 text-right text-slate-300">{trade.exit || '-'}</td>
                    <td className="p-3 text-right text-slate-400 text-xs">
                      {trade.stopLoss ? `SL:${trade.stopLoss}` : ''} {trade.takeProfit ? `TP:${trade.takeProfit}` : ''}
                    </td>
                    <td className={`p-3 text-right font-medium ${metrics.pnl > 0 ? 'text-green-400' : metrics.pnl < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {metrics.status === 'open' ? 'OPEN' : formatCurrency(metrics.pnl)}
                    </td>
                    <td className={`p-3 text-right ${metrics.rMultiple > 0 ? 'text-green-400' : metrics.rMultiple < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {metrics.rMultiple !== null ? (metrics.rMultiple >= 0 ? '+' : '') + metrics.rMultiple.toFixed(2) + 'R' : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {trade.tags && trade.tags.map((tag, idx) => (
                          <span key={idx} className="px-1 py-0.5 bg-blue-900 text-blue-300 rounded text-xs">{tag}</span>
                        ))}
                        {trade.mistakes && trade.mistakes.map((mistake, idx) => (
                          <span key={idx} className="px-1 py-0.5 bg-red-900 text-red-300 rounded text-xs">{mistake}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 text-sm max-w-xs truncate">{trade.notes}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => deleteTrade(trade.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeLog;
