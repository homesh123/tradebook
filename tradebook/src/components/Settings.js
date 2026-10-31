import React from 'react';
import { useSettings, DEFAULT_SETTINGS } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, Field, Button, Segmented, inputClass, useFeedback } from './ui';

const NumberSetting = ({ label, hint, value, onChange, prefix, suffix, step = 'any' }) => (
  <Field label={label} hint={hint}>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-apple-gray-400">{prefix}</span>}
      <input type="number" min="0" step={step} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
        className={`${inputClass()} ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''}`} />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-apple-gray-400">{suffix}</span>}
    </div>
  </Field>
);

const CustomList = ({ title, items, onRemove }) => (
  <div>
    <div className="text-[12px] font-medium text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">{title}</div>
    {items.length === 0 ? (
      <p className="text-[12px] text-apple-gray-400">None yet – add your own from the trade form.</p>
    ) : (
      <div className="flex flex-wrap gap-1.5">
        {items.map(i => (
          <span key={i} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full text-[12px] bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-800 dark:text-apple-gray-200">
            {i}
            <button onClick={() => onRemove(i)} aria-label={`Remove ${i}`} className="w-4 h-4 rounded-full text-[10px] text-apple-gray-500 hover:bg-apple-gray-300 dark:hover:bg-apple-gray-600">✕</button>
          </span>
        ))}
      </div>
    )}
  </div>
);

const SHORTCUTS = [
  ['N', 'New trade'],
  ['1 – 8', 'Jump to a page'],
  ['?', 'Help & guide'],
  ['Esc', 'Close a dialog'],
  ['Enter', 'Save the trade form'],
];

const Settings = () => {
  const { settings, updateSettings, replaceSettings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const { navigate } = useApp();
  const { toast, confirm } = useFeedback();
  const set = (key) => (value) => updateSettings({ [key]: value });
  const removeFrom = (key) => (item) => updateSettings({ [key]: settings[key].filter(x => x !== item) });

  const maxRisk$ = settings.startingBalance && settings.riskPerTradePct ? (settings.startingBalance * settings.riskPerTradePct) / 100 : 0;

  const reset = async () => {
    const ok = await confirm({ title: 'Reset settings?', message: 'Account size and risk rules go back to defaults. Your trades are not affected.', confirmLabel: 'Reset' });
    if (!ok) return;
    replaceSettings({ ...DEFAULT_SETTINGS, customTags: settings.customTags, customMistakes: settings.customMistakes, customEmotions: settings.customEmotions });
    toast('Settings reset');
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Settings" subtitle="Your account and the rules EdgeTrace holds you to. Changes save automatically." />

      <Card title="Account & risk rules" subtitle="Used for risk % warnings, guardrails on the Overview and rule-break analytics">
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          <NumberSetting label="Starting account balance" prefix="$" value={settings.startingBalance} onChange={set('startingBalance')} hint="Equity and % returns are measured from this" />
          <NumberSetting label="Max risk per trade" suffix="%" step="0.1" value={settings.riskPerTradePct} onChange={set('riskPerTradePct')}
            hint={maxRisk$ ? `≈ $${maxRisk$.toLocaleString('en-US', { maximumFractionDigits: 0 })} per trade at your starting balance` : 'Pro traders usually risk 0.5% – 2%'} />
          <NumberSetting label="Daily loss limit" prefix="$" value={settings.dailyLossLimit} onChange={set('dailyLossLimit')} hint="Stop trading for the day after losing this much. 0 = off" />
          <NumberSetting label="Max trades per day" step="1" value={settings.maxTradesPerDay} onChange={set('maxTradesPerDay')} hint="Protects against overtrading. 0 = off" />
        </div>
      </Card>

      <Card title="Your custom lists" subtitle="Setups, mistakes and emotions you added in the trade form">
        <div className="p-5 space-y-4">
          <CustomList title="Setups" items={settings.customTags} onRemove={removeFrom('customTags')} />
          <CustomList title="Mistakes" items={settings.customMistakes} onRemove={removeFrom('customMistakes')} />
          <CustomList title="Emotions" items={settings.customEmotions} onRemove={removeFrom('customEmotions')} />
          <p className="text-[11px] text-apple-gray-400">Removing an item only hides it from the picker – trades already tagged keep it.</p>
        </div>
      </Card>

      <Card title="Appearance">
        <div className="p-5 flex items-center justify-between">
          <span className="text-[13px] text-apple-gray-900 dark:text-white">Theme</span>
          <Segmented label="Theme" value={theme} onChange={(v) => v !== theme && toggleTheme()} options={[{ key: 'light', label: 'Light' }, { key: 'dark', label: 'Dark' }]} />
        </div>
      </Card>

      <Card title="Keyboard shortcuts">
        <div className="p-5 grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {SHORTCUTS.map(([k, d]) => (
            <div key={k} className="flex justify-between text-[13px]">
              <span className="text-apple-gray-600 dark:text-apple-gray-300">{d}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-apple-gray-100 dark:bg-apple-gray-700 border border-apple-gray-200 dark:border-apple-gray-600 text-[11px] font-sans text-apple-gray-700 dark:text-apple-gray-200">{k}</kbd>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Data & privacy">
        <div className="p-5 space-y-3 text-[13px] text-apple-gray-600 dark:text-apple-gray-400">
          <p>EdgeTrace has no server. Your trades and settings are stored only in this browser (local storage). Clearing browser data deletes them, so download a backup regularly.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('import')}>Backup & restore</Button>
            <Button variant="ghost" onClick={reset}>Reset settings to defaults</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
