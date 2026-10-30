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
        borderColor: 'rgb(0, 122, 255)',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  const equityOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Equity Curve',
        color: '#f5f5f7',
        font: { size: 14, weight: '600' }
      },
    },
    scales: {
      y: {
        ticks: { color: '#86868B', font: { size: 11 } },
        grid: { color: '#1D1D1F' }
      },
      x: {
        ticks: { color: '#86868B', font: { size: 11 }, maxTicksLimit: 6 },
        grid: { color: '#1D1D1F' }
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] sm:text-[28px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">Analytics</h2>
        <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">Performance insights and patterns</p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-apple-gray-800 p-4 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Total P&L</div>
          <div className={`text-[18px] sm:text-[22px] font-semibold tracking-tight ${analytics.totalPnl >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
            {formatCurrency(analytics.totalPnl)}
          </div>
        </div>
        <div className="bg-white dark:bg-apple-gray-800 p-4 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Win Rate</div>
          <div className="text-[18px] sm:text-[22px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">{analytics.winRate.toFixed(1)}%</div>
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">{analytics.winningTrades}W / {analytics.losingTrades}L</div>
        </div>
        <div className="bg-white dark:bg-apple-gray-800 p-4 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Profit Factor</div>
          <div className="text-[18px] sm:text-[22px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">
            {analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-apple-gray-800 p-4 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Expectancy</div>
          <div className={`text-[18px] sm:text-[22px] font-semibold tracking-tight ${analytics.expectancy >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
            {formatCurrency(analytics.expectancy)}
          </div>
        </div>
        <div className="bg-white dark:bg-apple-gray-800 p-4 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Avg R</div>
          <div className={`text-[18px] sm:text-[22px] font-semibold tracking-tight ${analytics.avgRMultiple >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
            {analytics.avgRMultiple >= 0 ? '+' : ''}{analytics.avgRMultiple.toFixed(2)}R
          </div>
        </div>
        <div className="bg-white dark:bg-apple-gray-800 p-4 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Max DD</div>
          <div className="text-[18px] sm:text-[22px] font-semibold text-apple-red tracking-tight">{formatCurrency(analytics.maxDrawdown)}</div>
        </div>
        <div className="bg-white dark:bg-apple-gray-800 p-4 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Largest Win</div>
          <div className="text-[18px] sm:text-[22px] font-semibold text-apple-green tracking-tight">{formatCurrency(analytics.largestWin)}</div>
        </div>
        <div className="bg-white dark:bg-apple-gray-800 p-4 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1">Largest Loss</div>
          <div className="text-[18px] sm:text-[22px] font-semibold text-apple-red tracking-tight">{formatCurrency(analytics.largestLoss)}</div>
        </div>
      </div>

      {/* Equity Curve */}
      {equityCurve.length > 1 && (
        <div className="bg-white dark:bg-apple-gray-800 p-4 sm:p-5 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700">
          <div className="h-[200px] sm:h-[280px]">
            <Line options={{...equityOptions, maintainAspectRatio: false}} data={equityData} />
          </div>
        </div>
      )}

      {/* Top Mistakes */}
      <div className="bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-apple-gray-200 dark:border-apple-gray-700">
          <h3 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">Biggest Leaks</h3>
        </div>
        {mistakes.length === 0 ? (
          <p className="p-5 text-[13px] text-apple-gray-500 dark:text-apple-gray-400">No mistakes tagged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-apple-gray-200 dark:border-apple-gray-700">
                  <th className="text-left px-5 py-2.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Mistake</th>
                  <th className="text-right px-5 py-2.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Count</th>
                  <th className="text-right px-5 py-2.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Cost</th>
                  <th className="text-right px-5 py-2.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                {mistakes.slice(0, 8).map((m, idx) => (
                  <tr key={idx} className="hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/30">
                    <td className="px-5 py-2.5 text-[13px] text-apple-gray-900 dark:text-white capitalize">{m.mistake.replace(/-/g, ' ')}</td>
                    <td className="px-5 py-2.5 text-right text-[13px] text-apple-gray-600 dark:text-apple-gray-400">{m.count}</td>
                    <td className="px-5 py-2.5 text-right text-[13px] text-apple-red">{formatCurrency(m.totalCost)}</td>
                    <td className={`px-5 py-2.5 text-right text-[13px] font-medium ${m.totalPnl >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
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
      <div className="bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-apple-gray-200 dark:border-apple-gray-700">
          <h3 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">Performance by Setup</h3>
        </div>
        {tagPerformance.length === 0 ? (
          <p className="p-5 text-[13px] text-apple-gray-500 dark:text-apple-gray-400">Tag trades with setups to see performance.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-apple-gray-200 dark:border-apple-gray-700">
                    <th className="text-left px-5 py-2.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Setup</th>
                    <th className="text-right px-5 py-2.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Trades</th>
                    <th className="text-right px-5 py-2.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Win Rate</th>
                    <th className="text-right px-5 py-2.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">P&L</th>
                    <th className="text-right px-5 py-2.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide font-medium">Profit Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                  {tagPerformance.map((t, idx) => (
                    <tr key={idx} className="hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/30">
                      <td className="px-5 py-2.5 text-[13px] text-apple-gray-900 dark:text-white capitalize">{t.tag.replace(/-/g, ' ')}</td>
                      <td className="px-5 py-2.5 text-right text-[13px] text-apple-gray-600 dark:text-apple-gray-400">{t.count} ({t.wins}W/{t.losses}L)</td>
                      <td className="px-5 py-2.5 text-right text-[13px] text-apple-gray-900 dark:text-white">{t.winRate.toFixed(1)}%</td>
                      <td className={`px-5 py-2.5 text-right text-[13px] font-medium ${t.totalPnl >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                        {formatCurrency(t.totalPnl)}
                      </td>
                      <td className="px-5 py-2.5 text-right text-[13px] text-apple-gray-900 dark:text-white">
                        {t.profitFactor === Infinity ? '∞' : t.profitFactor.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
              {tagPerformance.map((t, idx) => (
                <div key={idx} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[14px] font-medium text-apple-gray-900 dark:text-white capitalize">{t.tag.replace(/-/g, ' ')}</div>
                      <div className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400">{t.count} trades ({t.wins}W/{t.losses}L)</div>
                    </div>
                    <div className={`text-[15px] font-semibold ${t.totalPnl >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                      {formatCurrency(t.totalPnl)}
                    </div>
                  </div>
                  <div className="flex gap-4 text-[12px]">
                    <div><span className="text-apple-gray-500 dark:text-apple-gray-400">Win Rate:</span> <span className="text-apple-gray-900 dark:text-white">{t.winRate.toFixed(1)}%</span></div>
                    <div><span className="text-apple-gray-500 dark:text-apple-gray-400">PF:</span> <span className="text-apple-gray-900 dark:text-white">{t.profitFactor === Infinity ? '∞' : t.profitFactor.toFixed(2)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
