import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Shared Apple-style building blocks so every page looks and behaves the same.

export const cx = (...classes) => classes.filter(Boolean).join(' ');

export const formatCurrency = (val, digits = 2) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(val || 0);
export const signedCurrency = (val, digits = 2) => (val > 0 ? '+' : '') + formatCurrency(val, digits);
export const pnlClass = (val) => (val > 0 ? 'text-apple-green' : val < 0 ? 'text-apple-red' : 'text-apple-gray-500 dark:text-apple-gray-400');
export const formatDate = (dateStr, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', opts);
};
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
    <div>
      <h1 className="text-[26px] sm:text-[30px] font-semibold text-apple-gray-900 dark:text-white tracking-tight leading-tight">{title}</h1>
      {subtitle && <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2 items-center">{actions}</div>}
  </div>
);

export const Card = ({ title, subtitle, right, children, className = '', bodyClassName = '' }) => (
  <section className={cx('bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700 overflow-hidden', className)}>
    {title && (
      <header className="px-5 py-3.5 border-b border-apple-gray-200 dark:border-apple-gray-700 flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export const Stat = ({ label, value, sub, valueClass = 'text-apple-gray-900 dark:text-white', hint, onClick }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      title={hint}
      className={cx('text-left bg-white dark:bg-apple-gray-800 p-4 rounded-apple shadow-apple border border-apple-gray-200 dark:border-apple-gray-700', onClick && 'hover:border-apple-blue/50 transition-colors')}
    >
      <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
        {label}
        {hint && <span aria-hidden className="text-[10px] text-apple-gray-400">ⓘ</span>}
      </div>
      <div className={cx('text-[19px] sm:text-[22px] font-semibold tracking-tight tabular-nums', valueClass)}>{value}</div>
      {sub && <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">{sub}</div>}
    </Tag>
  );
};

const BUTTON_VARIANTS = {
  primary: 'bg-apple-blue hover:bg-[#0062CC] active:bg-[#0051A8] text-white shadow-sm',
  secondary: 'bg-apple-gray-100 dark:bg-apple-gray-700 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-600 text-apple-gray-900 dark:text-white',
  danger: 'bg-apple-red hover:bg-[#E0352B] text-white',
  ghost: 'text-apple-blue hover:bg-apple-blue/10',
  plainDanger: 'text-apple-red hover:bg-apple-red/10',
};

export const Button = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => (
  <button
    type="button"
    {...props}
    className={cx(
      'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap',
      size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-2 text-[13px] min-h-[36px]',
      BUTTON_VARIANTS[variant],
      className
    )}
  >
    {children}
  </button>
);

export const Segmented = ({ options, value, onChange, label }) => (
  <div role="group" aria-label={label} className="inline-flex p-0.5 rounded-lg bg-apple-gray-200/70 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700">
    {options.map(o => (
      <button
        type="button"
        key={o.key}
        onClick={() => onChange(o.key)}
        aria-pressed={value === o.key}
        className={cx(
          'px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors',
          value === o.key ? 'bg-white dark:bg-apple-gray-600 text-apple-gray-900 dark:text-white shadow-sm' : 'text-apple-gray-500 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const inputClass = (error) => cx(
  'w-full px-3 py-2 rounded-lg text-[13px] text-apple-gray-900 dark:text-white border transition-colors placeholder:text-apple-gray-400',
  'bg-apple-gray-100 dark:bg-apple-gray-700 focus:bg-white dark:focus:bg-apple-gray-600',
  error ? 'border-apple-red bg-apple-red/5' : 'border-transparent focus:border-apple-blue'
);

export const Field = ({ label, hint, error, children, className = '' }) => (
  <label className={cx('block', className)}>
    <span className="block text-[12px] font-medium text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">{label}</span>
    {children}
    {error ? <span className="block text-[11px] text-apple-red mt-1">{error}</span> : hint && <span className="block text-[11px] text-apple-gray-500 dark:text-apple-gray-400 mt-1">{hint}</span>}
  </label>
);

const CHIP_TONES = {
  blue: 'bg-apple-blue text-white',
  red: 'bg-apple-red text-white',
  green: 'bg-apple-green text-white',
  orange: 'bg-apple-orange text-white',
};

export const Chip = ({ active, tone = 'blue', onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cx(
      'px-2.5 py-1 rounded-full text-[12px] transition-colors',
      active ? CHIP_TONES[tone] : 'bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-600'
    )}
  >
    {children}
  </button>
);

export const Tag = ({ tone = 'blue', children }) => {
  const tones = {
    blue: 'bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue',
    red: 'bg-apple-red/10 dark:bg-apple-red/20 text-apple-red',
    green: 'bg-apple-green/10 dark:bg-apple-green/20 text-apple-green',
    gray: 'bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-600 dark:text-apple-gray-300',
    orange: 'bg-apple-orange/10 dark:bg-apple-orange/20 text-apple-orange',
  };
  return <span className={cx('px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap', tones[tone])}>{children}</span>;
};

export const EmptyState = ({ icon, title, children, action }) => (
  <div className="p-10 text-center">
    {icon && <div className="text-4xl mb-3" aria-hidden>{icon}</div>}
    <h3 className="text-[17px] font-semibold text-apple-gray-900 dark:text-white mb-1.5">{title}</h3>
    <p className="text-[13px] text-apple-gray-500 dark:text-apple-gray-400 max-w-md mx-auto">{children}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// Modal sheet: Escape closes, focus moves inside, body scroll locked.
export const Sheet = ({ title, onClose, children, footer, wide }) => {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    const first = ref.current && ref.current.querySelector('input, select, textarea, button:not([data-close])');
    if (first) first.focus();
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      // Only the top-most sheet reacts, so Escape on a confirm doesn't close the form under it.
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] === ref.current) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm sm:p-4 animate-fade-in" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={cx('bg-white dark:bg-apple-gray-800 w-full rounded-t-2xl sm:rounded-apple shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-700 max-h-[92vh] flex flex-col animate-sheet-in', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-apple-gray-200 dark:border-apple-gray-700 shrink-0">
          <h2 className="text-[17px] font-semibold text-apple-gray-900 dark:text-white">{title}</h2>
          <button data-close type="button" onClick={onClose} aria-label="Close" className="w-7 h-7 flex items-center justify-center rounded-full bg-apple-gray-100 dark:bg-apple-gray-700 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-600 text-apple-gray-500 dark:text-apple-gray-400 text-[12px]">✕</button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-apple-gray-200 dark:border-apple-gray-700 shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

// ---------- Toasts & confirm dialogs ----------
const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  const toast = useCallback((message, { tone = 'success', action, duration = 3500 } = {}) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-2), { id, message, tone, action }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const confirm = useCallback((opts) => new Promise(resolve => setConfirmState({ ...opts, resolve })), []);
  const closeConfirm = (result) => { confirmState.resolve(result); setConfirmState(null); };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div aria-live="polite" className="fixed z-[60] bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center w-[calc(100%-2rem)] sm:w-auto">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg bg-apple-gray-800/95 dark:bg-apple-gray-100/95 text-white dark:text-apple-gray-900 text-[13px] backdrop-blur-xl animate-sheet-in">
            <span aria-hidden>{t.tone === 'error' ? '⚠️' : t.tone === 'info' ? 'ℹ️' : '✓'}</span>
            <span>{t.message}</span>
            {t.action && (
              <button type="button" onClick={() => { t.action.onClick(); dismiss(t.id); }} className="font-semibold text-apple-blue">{t.action.label}</button>
            )}
          </div>
        ))}
      </div>
      {confirmState && (
        <Sheet title={confirmState.title || 'Are you sure?'} onClose={() => closeConfirm(false)}
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => closeConfirm(false)}>Cancel</Button>
              <Button variant={confirmState.destructive ? 'danger' : 'primary'} onClick={() => closeConfirm(true)}>{confirmState.confirmLabel || 'OK'}</Button>
            </div>
          }
        >
          <p className="px-5 py-4 text-[13px] text-apple-gray-600 dark:text-apple-gray-300 leading-relaxed">{confirmState.message}</p>
        </Sheet>
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => useContext(FeedbackContext);
