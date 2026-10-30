import React from 'react';
import { analyzeTrades, analyzeMistakes, getPerformanceByTag, getEquityCurve } from '../utils/analytics';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard = ({ trades }) => {
  const analytics = analyzeTrades(trades);
  const mistakes = analyzeMistakes(trades);
  const tagPerformance = getPerformanceByTag(trades);
  const equityCurve = getEquityCurve(trades);

  const equityData = {
    labels: equityCurve.map((p, idx) => idx === 0 ? 'Start' : p.date),
    datasets: [
      {
        label: 'Cumulative PnL ($)',
        data: equityCurve.map(p => p.value),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const equityOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Equity Curve',
        color: '#e2e8f0'
      },
    },
    scales: {
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Total PnL</div>
          <div className={`text-xl font-bold ${analytics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(analytics.totalPnl)}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Win Rate</div>
          <div className="text-xl font-bold text-white">{analytics.winRate.toFixed(1)}%</div>
          <div className="text-xs text-slate-400">{analytics.winningTrades}W / {analytics.losingTrades}L</div>
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
          <div className="text-xs text-slate-400">per trade</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Avg R-Multiple</div>
          <div className={`text-xl font-bold ${analytics.avgRMultiple >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {analytics.avgRMultiple >= 0 ? '+' : ''}{analytics.avgRMultiple.toFixed(2)}R
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Max Drawdown</div>
          <div className="text-xl font-bold text-red-400">{formatCurrency(analytics.maxDrawdown)}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Largest Win</div>
          <div className="text-xl font-bold text-green-400">{formatCurrency(analytics.largestWin)}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Largest Loss</div>
          <div className="text-xl font-bold text-red-400">{formatCurrency(analytics.largestLoss)}</div>
        </div>
      </div>

      {/* Equity Curve */}
      {equityCurve.length > 1 && (
        <div className="bg-slate-800 p-4 rounded-lg">
          <Line options={equityOptions} data={equityData} />
        </div>
      )}

      {/* Top Mistakes */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Biggest Leaks (Mistakes Costing Money)</h3>
        {mistakes.length === 0 ? (
          <p className="text-slate-400">No mistakes tagged yet. Tag mistakes on your trades to see them here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400">Mistake</th>
                  <th className="text-right py-2 text-slate-400">Count</th>
                  <th className="text-right py-2 text-slate-400">Total Cost</th>
                  <th className="text-right py-2 text-slate-400">Total PnL Impact</th>
                </tr>
              </thead>
              <tbody>
                {mistakes.slice(0, 10).map((m, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50">
                    <td className="py-2 text-white capitalize">{m.mistake.replace(/-/g, ' ')}</td>
                    <td className="py-2 text-right text-slate-300">{m.count}</td>
                    <td className="py-2 text-right text-red-400">{formatCurrency(m.totalCost)}</td>
                    <td className={`py-2 text-right ${m.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(m.totalPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance by Tag/Setup */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Performance by Setup/Tag</h3>
        {tagPerformance.length === 0 ? (
          <p className="text-slate-400">Tag your trades with setups (e.g., breakout, pullback) to see performance by strategy.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400">Setup/Tag</th>
                  <th className="text-right py-2 text-slate-400">Trades</th>
                  <th className="text-right py-2 text-slate-400">Win Rate</th>
                  <th className="text-right py-2 text-slate-400">Total PnL</th>
                  <th className="text-right py-2 text-slate-400">Profit Factor</th>
                </tr>
              </thead>
              <tbody>
                {tagPerformance.map((t, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50">
                    <td className="py-2 text-white capitalize">{t.tag.replace(/-/g, ' ')}</td>
                    <td className="py-2 text-right text-slate-300">{t.count} ({t.wins}W/{t.losses}L)</td>
                    <td className="py-2 text-right text-slate-300">{t.winRate.toFixed(1)}%</td>
                    <td className={`py-2 text-right ${t.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(t.totalPnl)}
                    </td>
                    <td className="py-2 text-right text-slate-300">
                      {t.profitFactor === Infinity ? '∞' : t.profitFactor.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
