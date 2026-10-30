import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadTrades, saveTrades } from '../utils/storage';

const TradeContext = createContext();

export const useTrades = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrades must be used within a TradeProvider');
  }
  return context;
};

export const TradeProvider = ({ children }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loaded = loadTrades();
    setTrades(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveTrades(trades);
    }
  }, [trades, loading]);

  const addTrade = (trade) => {
    const newTrade = {
      id: trade.id || Date.now().toString() + Math.random().toString(36).substr(2,9),
      ...trade,
      createdAt: trade.createdAt || new Date().toISOString()
    };
    setTrades(prev => [newTrade, ...prev]);
    return newTrade;
  };

  const updateTrade = (id, updates) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTrade = (id) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const importTrades = (importedTrades) => {
    setTrades(prev => [...importedTrades, ...prev]);
  };

  const clearAllTrades = () => {
    setTrades([]);
  };

  return (
    <TradeContext.Provider value={{
      trades,
      addTrade,
      updateTrade,
      deleteTrade,
      importTrades,
      clearAllTrades,
      loading
    }}>
      {children}
    </TradeContext.Provider>
  );
};
