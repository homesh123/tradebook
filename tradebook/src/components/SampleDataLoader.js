import React from 'react';
import { useTrades } from '../context/TradeContext';
import { sampleTrades } from '../utils/sampleData';

const SampleDataLoader = () => {
  const { trades, importTrades } = useTrades();
  
  if (trades.length > 0) return null;
  
  const loadSample = () => {
    importTrades(sampleTrades);
  };
  
  return (
    <div className="bg-gradient-to-r from-apple-blue/10 to-purple-500/10 dark:from-apple-blue/20 dark:to-purple-500/20 border border-apple-blue/30 rounded-apple p-5 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white mb-1">Try with sample data</h3>
          <p className="text-[13px] text-apple-gray-600 dark:text-apple-gray-400">Load 7 sample trades to explore all features including analytics, mistakes, and calendar</p>
        </div>
        <button onClick={loadSample} className="px-4 py-2 bg-apple-blue hover:bg-[#0051D5] text-white rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap">
          Load Sample Data
        </button>
      </div>
    </div>
  );
};

export default SampleDataLoader;
