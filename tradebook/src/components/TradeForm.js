import React, { useMemo, useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { useSettings } from '../context/SettingsContext';
import { calculateTradeMetrics, STANDARD_TAGS, STANDARD_MISTAKES, STANDARD_EMOTIONS, GRADES } from '../utils/analytics';
import { Sheet, Field, Chip, Button, Segmented, inputClass, formatCurrency, signedCurrency, pnlClass, todayStr, cx, useFeedback } from './ui';

const EMPTY = {
  date: '',
  time: '',
  pair: '',
  side: 'long',
  strategy: '',
  quantity: 1,
  multiplier: '',
  entry: '',
  exit: '',
  stopLoss: '',
  takeProfit: '',
  fees: 0,
  netPnl: '',
  grade: '',
  notes: '',
  tags: [],
  mistakes: [],
  emotions: '',
  followedPlan: null,
  screenshot: '',
};

const toForm = (trade) => {
  const f = { ...EMPTY, ...trade };
  ['multiplier', 'exit', 'stopLoss', 'takeProfit', 'netPnl'].forEach(k => { if (f[k] === null || f[k] === undefined) f[k] = ''; });
  f.tags = Array.isArray(f.tags) ? f.tags : [];
  f.mistakes = Array.isArray(f.mistakes) ? f.mistakes : [];
  return f;
};

const uniq = (list) => [...new Set(list.filter(Boolean))];

// Pill list with "add your own" input.
const ChipPicker = ({ options, selected, onToggle, tone, placeholder, onAddCustom, single }) => {
  const [custom, setCustom] = useState('');
  const add = () => {
    const v = custom.trim();
    if (!v) return;
    onAddCustom(v);
    setCustom('');
  };
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {options.map(o => (
        <Chip key={o} tone={tone} active={single ? selected === o : selected.includes(o)} onClick={() => onToggle(o)}>{o}</Chip>
      ))}
      <input
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder}
        aria-label={placeholder}
        className="px-2.5 py-1 rounded-full text-[12px] w-28 bg-transparent border border-dashed border-apple-gray-300 dark:border-apple-gray-600 text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:border-apple-blue"
      />
    </div>
  );
};

const Section = ({ title, children, right }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-apple-gray-500 dark:text-apple-gray-400">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const TradeForm = ({ trade, defaults, onClose }) => {
  const { addTrade, updateTrade, deleteTrade, restoreTrade } = useTrades();
  const { settings, updateSettings } = useSettings();
  const { toast, confirm } = useFeedback();
  const isEdit = Boolean(trade);
  const [form, setForm] = useState(() => toForm(trade || { ...EMPTY, date: todayStr(), ...defaults }));
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(() => Boolean(trade && (trade.multiplier || trade.netPnl || trade.screenshot)));

  const set = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };
  const onInput = (e) => set(e.target.name, e.target.value);
  const toggle = (field, item) => set(field, form[field].includes(item) ? form[field].filter(i => i !== item) : [...form[field], item]);

  const tagOptions = uniq([...STANDARD_TAGS, ...settings.customTags, ...form.tags]);
  const mistakeOptions = uniq([...STANDARD_MISTAKES, ...settings.customMistakes, ...form.mistakes]);
  const emotionOptions = uniq([...STANDARD_EMOTIONS, ...settings.customEmotions, form.emotions]);

  const addCustom = (listKey, field, value, single) => {
    const existing = { customTags: tagOptions, customMistakes: mistakeOptions, customEmotions: emotionOptions }[listKey];
    const match = existing.find(o => o.toLowerCase() === value.toLowerCase());
    if (!match) updateSettings({ [listKey]: [...settings[listKey], value] });
    const v = match || value;
    if (single) set(field, v);
    else if (!form[field].includes(v)) set(field, [...form[field], v]);
  };

  const clean = (f) => {
    const n = (v) => (v === '' || v === null || v === undefined || isNaN(parseFloat(v)) ? null : parseFloat(v));
    return {
      ...f,
      pair: f.pair.trim().toUpperCase(),
      quantity: n(f.quantity) || 1,
      multiplier: n(f.multiplier),
      entry: n(f.entry) || 0,
      exit: n(f.exit),
      stopLoss: n(f.stopLoss),
      takeProfit: n(f.takeProfit),
      fees: n(f.fees) || 0,
      netPnl: n(f.netPnl),
    };
  };

  const preview = useMemo(() => calculateTradeMetrics(clean(form)), [form]); // eslint-disable-line react-hooks/exhaustive-deps
  const accountRiskPct = preview.risk && settings.startingBalance ? (preview.risk / settings.startingBalance) * 100 : null;
  const overRisk = accountRiskPct !== null && settings.riskPerTradePct && accountRiskPct > settings.riskPerTradePct * 1.1;

  const validate = () => {
    const e = {};
    const c = clean(form);
    if (!c.pair) e.pair = 'Enter a symbol';
    if (!form.date) e.date = 'Pick a date';
    if (form.entry === '' || c.entry <= 0) e.entry = 'Entry price is required';
    if (c.quantity <= 0) e.quantity = 'Must be greater than 0';
    if (c.stopLoss !== null && c.entry) {
      if (form.side === 'long' && c.stopLoss >= c.entry) e.stopLoss = 'For a long, stop must be below entry';
      if (form.side === 'short' && c.stopLoss <= c.entry) e.stopLoss = 'For a short, stop must be above entry';
    }
    if (c.takeProfit !== null && c.entry) {
      if (form.side === 'long' && c.takeProfit <= c.entry) e.takeProfit = 'For a long, target must be above entry';
      if (form.side === 'short' && c.takeProfit >= c.entry) e.takeProfit = 'For a short, target must be below entry';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    const data = clean(form);
    if (isEdit) {
      updateTrade(trade.id, data);
      toast('Trade updated');
    } else {
      addTrade(data);
      toast(`${data.pair} ${data.side} logged`);
    }
    onClose();
  };

  const remove = async () => {
    const ok = await confirm({ title: 'Delete this trade?', message: `${trade.pair} on ${trade.date} will be removed from your journal.`, confirmLabel: 'Delete', destructive: true });
    if (!ok) return;
    deleteTrade(trade.id);
    onClose();
    toast('Trade deleted', { action: { label: 'Undo', onClick: () => restoreTrade(trade) } });
  };

  const footer = (
    <div className="flex items-center gap-2">
      {isEdit && <Button variant="plainDanger" onClick={remove}>Delete</Button>}
      <div className="flex-1" />
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Add Trade'}</Button>
    </div>
  );

  return (
    <Sheet title={isEdit ? `Edit ${trade.pair}` : 'New Trade'} onClose={onClose} footer={footer} wide>
      <form onSubmit={submit} className="p-5 space-y-6" noValidate>
        <Section title="Instrument">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Symbol" error={errors.pair} className="col-span-2">
              <input name="pair" value={form.pair} onChange={onInput} placeholder="AAPL, EURUSD, ES" autoComplete="off" className={inputClass(errors.pair)} />
            </Field>
            <Field label="Date" error={errors.date}>
              <input type="date" name="date" value={form.date} onChange={onInput} className={inputClass(errors.date)} />
            </Field>
            <Field label="Entry time" hint="Optional">
              <input type="time" name="time" value={form.time} onChange={onInput} className={inputClass()} />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented label="Side" value={form.side} onChange={(v) => set('side', v)} options={[{ key: 'long', label: '▲ Long' }, { key: 'short', label: '▼ Short' }]} />
            <input name="strategy" value={form.strategy} onChange={onInput} placeholder="Strategy / playbook (optional)" className={cx(inputClass(), 'flex-1 min-w-[180px]')} />
          </div>
        </Section>

        <Section title="Execution">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Entry price" error={errors.entry}>
              <input type="number" inputMode="decimal" step="any" name="entry" value={form.entry} onChange={onInput} className={inputClass(errors.entry)} />
            </Field>
            <Field label="Exit price" hint="Leave empty while the trade is open">
              <input type="number" inputMode="decimal" step="any" name="exit" value={form.exit} onChange={onInput} placeholder="Open" className={inputClass()} />
            </Field>
            <Field label="Quantity" error={errors.quantity}>
              <input type="number" inputMode="decimal" step="any" name="quantity" value={form.quantity} onChange={onInput} className={inputClass(errors.quantity)} />
            </Field>
            <Field label="Stop loss" error={errors.stopLoss} hint="Needed for R-multiple & risk">
              <input type="number" inputMode="decimal" step="any" name="stopLoss" value={form.stopLoss} onChange={onInput} className={inputClass(errors.stopLoss)} />
            </Field>
            <Field label="Take profit" error={errors.takeProfit}>
              <input type="number" inputMode="decimal" step="any" name="takeProfit" value={form.takeProfit} onChange={onInput} className={inputClass(errors.takeProfit)} />
            </Field>
            <Field label="Fees & commissions">
              <input type="number" inputMode="decimal" step="any" name="fees" value={form.fees} onChange={onInput} className={inputClass()} />
            </Field>
          </div>

          <button type="button" onClick={() => setShowAdvanced(s => !s)} className="text-[12px] text-apple-blue font-medium">
            {showAdvanced ? '▾' : '▸'} Futures, forex & broker P&L
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Point value / multiplier" hint="ES = 50, NQ = 20, 1 forex lot = 100000">
                <input type="number" inputMode="decimal" step="any" name="multiplier" value={form.multiplier} onChange={onInput} placeholder="1" className={inputClass()} />
              </Field>
              <Field label="Net P&L from broker" hint="Overrides the calculated P&L">
                <input type="number" inputMode="decimal" step="any" name="netPnl" value={form.netPnl} onChange={onInput} placeholder="Auto" className={inputClass()} />
              </Field>
              <Field label="Chart / screenshot link">
                <input type="url" name="screenshot" value={form.screenshot} onChange={onInput} placeholder="https://www.tradingview.com/x/…" className={inputClass()} />
              </Field>
            </div>
          )}

          {/* Live preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-apple-gray-50 dark:bg-apple-gray-900/60 border border-apple-gray-200 dark:border-apple-gray-700">
            <PreviewItem label="Risk" value={preview.risk ? formatCurrency(preview.risk) : '—'} sub={accountRiskPct !== null ? `${accountRiskPct.toFixed(2)}% of account` : 'Add a stop loss'} warn={overRisk} />
            <PreviewItem label="Planned R:R" value={preview.plannedRR ? `1 : ${preview.plannedRR.toFixed(2)}` : '—'} sub={preview.plannedRR ? (preview.plannedRR >= 2 ? 'Good asymmetry' : preview.plannedRR < 1 ? 'Reward < risk' : 'Acceptable') : 'Add stop & target'} warn={preview.plannedRR !== null && preview.plannedRR < 1} />
            <PreviewItem label="P&L" value={preview.status === 'closed' ? signedCurrency(preview.pnl) : 'Open'} valueClass={preview.status === 'closed' ? pnlClass(preview.pnl) : ''} />
            <PreviewItem label="R-multiple" value={preview.rMultiple !== null && preview.rMultiple !== undefined ? `${preview.rMultiple >= 0 ? '+' : ''}${preview.rMultiple.toFixed(2)}R` : '—'} valueClass={preview.rMultiple ? pnlClass(preview.rMultiple) : ''} />
          </div>
          {overRisk && (
            <p className="text-[12px] text-apple-orange">⚠️ This risks more than your {settings.riskPerTradePct}% per-trade rule. Consider reducing size.</p>
          )}
        </Section>

        <Section title="Setup">
          <ChipPicker options={tagOptions} selected={form.tags} tone="blue" onToggle={(t) => toggle('tags', t)} placeholder="+ Add setup" onAddCustom={(v) => addCustom('customTags', 'tags', v)} />
        </Section>

        <Section title="Mistakes" right={form.mistakes.length === 0 && <span className="text-[11px] text-apple-green">Clean trade ✓</span>}>
          <ChipPicker options={mistakeOptions} selected={form.mistakes} tone="red" onToggle={(m) => toggle('mistakes', m)} placeholder="+ Add mistake" onAddCustom={(v) => addCustom('customMistakes', 'mistakes', v)} />
        </Section>

        <Section title="Psychology & review">
          <div>
            <span className="block text-[12px] font-medium text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">How did you feel?</span>
            <ChipPicker single options={emotionOptions} selected={form.emotions} tone="orange" onToggle={(e) => set('emotions', form.emotions === e ? '' : e)} placeholder="+ Other" onAddCustom={(v) => addCustom('customEmotions', 'emotions', v, true)} />
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <span className="block text-[12px] font-medium text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Followed your plan?</span>
              <Segmented label="Followed plan" value={form.followedPlan === null ? 'na' : String(form.followedPlan)} onChange={(v) => set('followedPlan', v === 'na' ? null : v === 'true')}
                options={[{ key: 'true', label: 'Yes' }, { key: 'false', label: 'No' }, { key: 'na', label: 'Not sure' }]} />
            </div>
            <div>
              <span className="block text-[12px] font-medium text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Execution grade</span>
              <Segmented label="Execution grade" value={form.grade || ''} onChange={(v) => set('grade', form.grade === v ? '' : v)} options={GRADES.map(g => ({ key: g, label: g }))} />
            </div>
          </div>
          <Field label="Notes & lessons">
            <textarea name="notes" value={form.notes} onChange={onInput} rows="3" placeholder="Why did you take it? What would you do differently?" className={cx(inputClass(), 'resize-y')} />
          </Field>
        </Section>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Sheet>
  );
};

const PreviewItem = ({ label, value, sub, warn, valueClass = '' }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-apple-gray-500 dark:text-apple-gray-400">{label}</div>
    <div className={cx('text-[15px] font-semibold tabular-nums', warn ? 'text-apple-orange' : valueClass || 'text-apple-gray-900 dark:text-white')}>{value}</div>
    {sub && <div className={cx('text-[10px]', warn ? 'text-apple-orange' : 'text-apple-gray-500 dark:text-apple-gray-400')}>{sub}</div>}
  </div>
);

export default TradeForm;
