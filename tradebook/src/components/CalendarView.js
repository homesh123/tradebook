import React from 'react';
import { useTrades } from '../context/TradeContext';
import { calculateTradeMetrics } from '../utils/analytics';

const CalendarView = () => {
  const { trades } = useTrades();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };
  
  const getDayPnL = (day) => {
    if (!day) return null;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    let totalPnl = 0;
    trades.forEach(trade => {
      if (trade.date === dateStr) {
        const metrics = calculateTradeMetrics(trade);
        if (metrics.status === 'closed') {
          totalPnl += metrics.pnl;
        }
      }
    });
    return totalPnl;
  };
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = getDaysInMonth(currentDate);
  
  const formatCurrency = (val) => {
    if (val === 0) return '$0';
    const sign = val > 0 ? '+' : '';
    return sign + '$' + Math.abs(val).toFixed(0);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Trading Calendar</h2>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600">←</button>
          <span className="text-white font-medium">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600">→</button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Today</button>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-slate-400 text-sm py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const pnl = getDayPnL(day);
            return (
              <div
                key={idx}
                className={`min-h-[80px] p-2 rounded ${
                  day === null ? 'bg-slate-900/50' : 
                  pnl > 0 ? 'bg-green-900/30 border border-green-700' :
                  pnl < 0 ? 'bg-red-900/30 border border-red-700' :
                  'bg-slate-700/30 border border-slate-600'
                }`}
              >
                {day && (
                  <>
                    <div className="text-slate-300 text-sm mb-1">{day}</div>
                    {pnl !== null && pnl !== 0 && (
                      <div className={`text-xs font-medium ${pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(pnl)}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-900/30 border border-green-700 rounded"></div>
          <span className="text-slate-300">Profitable Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-900/30 border border-red-700 rounded"></div>
          <span className="text-slate-300">Losing Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-700/30 border border-slate-600 rounded"></div>
          <span className="text-slate-300">No Trades / Breakeven</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
