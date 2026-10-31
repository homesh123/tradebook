import React, { useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { sampleTrades } from '../utils/sampleData';
import { sampleTradesFull } from '../utils/sampleDataFull';

const SampleDataLoader = () => {
  const { trades, importTrades } = useTrades();
  const [loaded, setLoaded] = useState(false);
  
  if (trades.length > 0 || loaded) return null;
  
  const loadSample = () => {
    importTrades(sampleTradesFull);
    setLoaded(true);
  };
  
  const loadQuick = () => {
    importTrades(sampleTrades);
    setLoaded(true);
  };
  
  return (
    <div className="bg-gradient-to-r from-apple-blue/10 to-purple-500/10 dark:from-apple-blue/20 dark:to-purple-500/20 border border-apple-blue/30 rounded-apple p-5 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white mb-1">Explore with demo data</h3>
          <p className="text-[13px] text-apple-gray-600 dark:text-apple-gray-400">Load 30 trades with winners/losers and repeated mistakes to test Analytics & Mistakes sections</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadQuick} className="px-3 py-2 bg-apple-gray-200 dark:bg-apple-gray-700 hover:bg-apple-gray-300 dark:hover:bg-apple-gray-600 text-apple-gray-900 dark:text-white rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap">
            Quick (7 trades)
          </button>
          <button onClick={loadSample} className="px-4 py-2 bg-apple-blue hover:bg-[#0051D5] text-white rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap">
            Load Full Demo (30 trades)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SampleDataLoader;
