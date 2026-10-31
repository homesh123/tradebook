import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TradeProvider, useTrades } from "./context/TradeContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { SettingsProvider } from "./context/SettingsContext";
import { AppContext } from "./context/AppContext";
import { FeedbackProvider, cx } from "./components/ui";
import Overview from "./components/Overview";
import TradeLog from "./components/TradeLog";
import TradeForm from "./components/TradeForm";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import CalendarView from "./components/CalendarView";
import ImportExport from "./components/ImportExport";
import MistakesInsights from "./components/MistakesInsights";
import Settings from "./components/Settings";
import Help from "./components/Help";

const PAGES = [
  { key: 'overview', label: 'Overview', icon: '🏠', section: 'Journal' },
  { key: 'trades', label: 'Trade Log', icon: '📋', section: 'Journal' },
  { key: 'calendar', label: 'Calendar', icon: '📅', section: 'Journal' },
  { key: 'mistakes', label: 'Mistakes', icon: '🎯', section: 'Improve' },
  { key: 'analytics', label: 'Analytics', icon: '📈', section: 'Improve' },
  { key: 'import', label: 'Import & Export', icon: '💾', section: 'Data' },
  { key: 'settings', label: 'Settings', icon: '⚙️', section: 'Data' },
  { key: 'help', label: 'Help & Guide', icon: '❓', section: 'Data' },
];
const MOBILE_TABS = ['overview', 'trades', 'mistakes', 'analytics'];

const pageFromHash = () => {
  const key = window.location.hash.replace(/^#\/?/, '');
  return PAGES.some(p => p.key === key) ? key : 'overview';
};

const NavItem = ({ page, active, onClick }) => (
  <button
    onClick={onClick}
    className={cx(
      'w-full text-left px-2.5 py-1.5 rounded-lg mb-0.5 flex items-center gap-2 text-[13px] transition-colors duration-150',
      active
        ? 'bg-apple-blue/12 dark:bg-apple-blue/20 text-apple-blue font-medium'
        : 'text-apple-gray-600 dark:text-apple-gray-400 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800/60'
    )}
    aria-current={active ? 'page' : undefined}
  >
    <span className="text-base leading-none w-5 text-center" aria-hidden>{page.icon}</span>
    <span className="truncate">{page.label}</span>
  </button>
);

const ThemeToggle = ({ compact }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={cx('rounded-lg flex items-center gap-2 text-[13px] text-apple-gray-600 dark:text-apple-gray-400 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800/60 transition-colors', compact ? 'p-2' : 'w-full px-2.5 py-1.5')}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-base leading-none w-5 text-center" aria-hidden>{theme === 'dark' ? '☀️' : '🌙'}</span>
      {!compact && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );
};

const Logo = () => (
  <div className="flex items-center gap-2">
    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-apple-blue to-[#5856D6] text-white flex items-center justify-center text-[13px] font-bold shadow-sm" aria-hidden>E</span>
    <div>
      <div className="text-[14px] font-semibold text-apple-gray-900 dark:text-white tracking-tight leading-tight">EdgeTrace</div>
      <div className="text-[10px] text-apple-gray-500 dark:text-apple-gray-400 leading-tight">Trading Journal</div>
    </div>
  </div>
);

const MainApp = () => {
  const [page, setPage] = useState(pageFromHash);
  const [form, setForm] = useState(null); // null | { trade?: object, defaults?: object }
  const [moreOpen, setMoreOpen] = useState(false);
  const { trades } = useTrades();

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const p = PAGES.find(x => x.key === page);
    document.title = `${p ? p.label : 'Overview'} · EdgeTrace`;
    const main = document.getElementById('main');
    if (main) main.scrollTop = 0;
  }, [page]);

  const navigate = useCallback((key) => {
    setMoreOpen(false);
    if (window.location.hash !== `#/${key}`) window.location.hash = `/${key}`;
    setPage(key);
  }, []);
  const openTradeForm = useCallback((trade, defaults) => setForm({ trade, defaults }), []);

  // Keyboard shortcuts: N = new trade, 1-8 = pages, ? = help.
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (e.metaKey || e.ctrlKey || e.altKey || ['input', 'textarea', 'select'].includes(tag) || form) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openTradeForm(); }
      else if (e.key === '?') navigate('help');
      else if (/^[1-8]$/.test(e.key)) navigate(PAGES[parseInt(e.key, 10) - 1].key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [form, navigate, openTradeForm]);

  const actions = useMemo(() => ({ navigate, openTradeForm }), [navigate, openTradeForm]);

  const content = (() => {
    switch (page) {
      case 'trades': return <TradeLog />;
      case 'mistakes': return <MistakesInsights />;
      case 'analytics': return <AnalyticsDashboard trades={trades} />;
      case 'calendar': return <CalendarView />;
      case 'import': return <ImportExport />;
      case 'settings': return <Settings />;
      case 'help': return <Help />;
      default: return <Overview />;
    }
  })();

  const sections = ['Journal', 'Improve', 'Data'];

  return (
    <AppContext.Provider value={actions}>
      <div className="h-screen flex flex-col md:flex-row bg-apple-gray-50 dark:bg-black transition-colors duration-200">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-2 bg-white/85 dark:bg-apple-gray-900/85 backdrop-blur-xl border-b border-apple-gray-200 dark:border-apple-gray-800 sticky top-0 z-40">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle compact />
            <button onClick={() => openTradeForm()} className="px-3 py-1.5 bg-apple-blue text-white rounded-full text-[13px] font-medium" aria-label="New trade">+ Trade</button>
          </div>
        </header>

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[220px] shrink-0 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-xl flex-col border-r border-apple-gray-200 dark:border-apple-gray-800">
          <div className="px-4 py-4"><Logo /></div>
          <div className="px-2 mb-2">
            <button onClick={() => openTradeForm()} className="w-full px-2.5 py-2 bg-apple-blue hover:bg-[#0062CC] text-white rounded-lg text-[13px] font-medium shadow-sm transition-colors flex items-center justify-center gap-1.5">
              <span aria-hidden>＋</span> New Trade <kbd className="ml-1 text-[10px] opacity-70 font-sans">N</kbd>
            </button>
          </div>
          <nav className="flex-1 px-2 overflow-y-auto" aria-label="Main">
            {sections.map(section => (
              <div key={section} className="mb-3">
                <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-apple-gray-400">{section}</div>
                {PAGES.filter(p => p.section === section).map(p => (
                  <NavItem key={p.key} page={p} active={page === p.key} onClick={() => navigate(p.key)} />
                ))}
              </div>
            ))}
          </nav>
          <div className="p-2 border-t border-apple-gray-200 dark:border-apple-gray-800">
            <ThemeToggle />
            <p className="px-2.5 pt-1 text-[10px] text-apple-gray-400">Data stays on this device.</p>
          </div>
        </aside>

        {/* Main content */}
        <main id="main" className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
            {content}
          </div>
        </main>

        {/* Mobile tab bar */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-apple-gray-900/90 backdrop-blur-xl border-t border-apple-gray-200 dark:border-apple-gray-800 flex pb-[env(safe-area-inset-bottom)]" aria-label="Tabs">
          {MOBILE_TABS.map(key => {
            const p = PAGES.find(x => x.key === key);
            const active = page === key;
            return (
              <button key={key} onClick={() => navigate(key)} aria-current={active ? 'page' : undefined}
                className={cx('flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 min-h-[50px] text-[10px]', active ? 'text-apple-blue' : 'text-apple-gray-500')}>
                <span className="text-[18px] leading-none" aria-hidden>{p.icon}</span>{p.label.replace(' Log', 's')}
              </button>
            );
          })}
          <button onClick={() => setMoreOpen(o => !o)} aria-expanded={moreOpen}
            className={cx('flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 min-h-[50px] text-[10px]', moreOpen || !MOBILE_TABS.includes(page) ? 'text-apple-blue' : 'text-apple-gray-500')}>
            <span className="text-[18px] leading-none" aria-hidden>•••</span>More
          </button>
        </nav>
        {moreOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setMoreOpen(false)}>
            <div className="absolute bottom-[58px] right-2 left-2 bg-white dark:bg-apple-gray-800 rounded-2xl shadow-lg border border-apple-gray-200 dark:border-apple-gray-700 p-2 animate-sheet-in" onClick={e => e.stopPropagation()}>
              {PAGES.filter(p => !MOBILE_TABS.includes(p.key)).map(p => (
                <NavItem key={p.key} page={p} active={page === p.key} onClick={() => navigate(p.key)} />
              ))}
            </div>
          </div>
        )}

        {form && <TradeForm trade={form.trade} defaults={form.defaults} onClose={() => setForm(null)} />}
      </div>
    </AppContext.Provider>
  );
};

const App = () => (
  <ThemeProvider>
    <SettingsProvider>
      <TradeProvider>
        <FeedbackProvider>
          <MainApp />
        </FeedbackProvider>
      </TradeProvider>
    </SettingsProvider>
  </ThemeProvider>
);

export default App;
