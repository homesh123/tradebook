import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'tradebook_settings_v1';

export const DEFAULT_SETTINGS = {
  startingBalance: 10000,
  riskPerTradePct: 1,
  dailyLossLimit: 0,
  maxTradesPerDay: 0,
  customTags: [],
  customMistakes: [],
  customEmotions: [],
};

export const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  const updateSettings = (updates) => setSettings(prev => ({ ...prev, ...updates }));
  const replaceSettings = (next) => setSettings({ ...DEFAULT_SETTINGS, ...next });

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, replaceSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
};
