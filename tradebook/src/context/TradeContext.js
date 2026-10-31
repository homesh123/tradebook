import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadTrades, saveTrades, newId } from '../utils/storage';

const TradeContext = createContext();

export const useTrades = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrades must be used within a TradeProvider');
  }
  return context;
};

export const TradeProvider = ({ children }) => {
  // Load synchronously so the first render already has the journal (no empty flash).
  const [trades, setTrades] = useState(loadTrades);
  const loading = false;

  useEffect(() => {
    saveTrades(trades);
  }, [trades]);

  const addTrade = (trade) => {
    const newTrade = {
      id: trade.id || newId(),
      ...trade,
      createdAt: trade.createdAt || new Date().toISOString()
    };
    setTrades(prev => [newTrade, ...prev]);
    return newTrade;
  };

  const updateTrade = (id, updates) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
  };

  const deleteTrade = (id) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  // Adds trades, skipping any whose id already exists. Returns { added, skipped }.
  const importTrades = (importedTrades) => {
    const existing = new Set(trades.map(t => t.id));
    const fresh = importedTrades.filter(t => !existing.has(t.id));
    setTrades(prev => [...fresh, ...prev]);
    return { added: fresh.length, skipped: importedTrades.length - fresh.length };
  };

  const replaceAllTrades = (next) => setTrades(next);

  // Re-inserts a deleted trade (used by Undo).
  const restoreTrade = (trade) => setTrades(prev => (prev.some(t => t.id === trade.id) ? prev : [trade, ...prev]));

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
      replaceAllTrades,
      restoreTrade,
      clearAllTrades,
      loading
    }}>
      {children}
    </TradeContext.Provider>
  );
};
