import React, { useState } from "react";
import { TradeProvider } from "./context/TradeContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Overview from "./components/Overview";
import TradeLog from "./components/TradeLog";
import TradeForm from "./components/TradeForm";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import CalendarView from "./components/CalendarView";
import ImportExport from "./components/ImportExport";
import MistakesInsights from "./components/MistakesInsights";
import SampleDataLoader from "./components/SampleDataLoader";
import { useTrades } from "./context/TradeContext";

const NavItem = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-2.5 py-1.5 rounded-lg mb-0.5 flex items-center gap-2 text-[13px] transition-all duration-150 ${
      active 
        ? 'bg-apple-blue/12 dark:bg-apple-blue/18 text-apple-blue font-medium' 
        : 'text-apple-gray-600 dark:text-apple-gray-400 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800/60 active:bg-apple-gray-200 dark:active:bg-apple-gray-800'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    <span className="text-base leading-none">{icon}</span>
    <span className="truncate">{children}</span>
  </button>
);

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-[13px] text-apple-gray-600 dark:text-apple-gray-400 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800/60 active:bg-apple-gray-200 dark:active:bg-apple-gray-800 transition-all duration-150"
      aria-label="Toggle theme"
    >
      <span className="text-base leading-none">{theme === 'dark' ? '☀️' : '🌙'}</span>
      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
};

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { trades } = useTrades();

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <><SampleDataLoader /><Overview onAddTrade={() => setShowTradeForm(true)} /></>;
      case 'trades':
        return <TradeLog />;
      case 'mistakes':
        return <MistakesInsights />;
      case 'analytics':
        return <AnalyticsDashboard trades={trades} />;
      case 'calendar':
        return <CalendarView />;
      case 'import':
        return <ImportExport />;
      default:
        return <><SampleDataLoader /><Overview onAddTrade={() => setShowTradeForm(true)} /></>;
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-apple-gray-50 dark:bg-black transition-colors duration-200">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white/90 dark:bg-apple-gray-900/90 backdrop-blur-xl border-b border-apple-gray-200 dark:border-apple-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h1 className="text-[14px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">EdgeTrace</h1>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="p-1.5 rounded-lg text-apple-gray-900 dark:text-white hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[49px] left-0 right-0 bg-white/95 dark:bg-apple-gray-900/95 backdrop-blur-xl border-b border-apple-gray-200 dark:border-apple-gray-800 z-40 shadow-lg">
          <nav className="p-2">
            <NavItem active={activeTab === 'overview'} onClick={() => handleNavClick('overview')} icon="🏠">Overview</NavItem>
            <NavItem active={activeTab === 'trades'} onClick={() => handleNavClick('trades')} icon="📋">Trade Log</NavItem>
            <NavItem active={activeTab === 'mistakes'} onClick={() => handleNavClick('mistakes')} icon="🎯">Mistakes</NavItem>
            <NavItem active={activeTab === 'analytics'} onClick={() => handleNavClick('analytics')} icon="📈">Analytics</NavItem>
            <NavItem active={activeTab === 'calendar'} onClick={() => handleNavClick('calendar')} icon="📅">Calendar</NavItem>
            <NavItem active={activeTab === 'import'} onClick={() => handleNavClick('import')} icon="💾">Import & Export</NavItem>
            <div className="mt-2 pt-2 border-t border-apple-gray-200 dark:border-apple-gray-800 space-y-0.5">
              <ThemeToggle />
              <button onClick={() => { setShowTradeForm(true); setMobileMenuOpen(false); }} className="w-full px-2.5 py-1.5 bg-apple-blue hover:bg-[#0051D5] active:bg-[#004FC4] text-white rounded-lg text-[13px] font-medium transition-colors">+ New Trade</button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-xl flex-col border-r border-apple-gray-200 dark:border-apple-gray-800 transition-colors duration-200">
        <div className="px-3 py-4">
          <div className="flex items-center gap-2 mb-0.5 px-1">
            <span className="text-lg">📊</span>
            <h1 className="text-[14px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">EdgeTrace</h1>
          </div>
          <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 ml-7">Trading Journal & Analytics</p>
        </div>
        <nav className="flex-1 px-2">
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon="🏠">Overview</NavItem>
          <NavItem active={activeTab === 'trades'} onClick={() => setActiveTab('trades')} icon="📋">Trade Log</NavItem>
          <NavItem active={activeTab === 'mistakes'} onClick={() => setActiveTab('mistakes')} icon="🎯">Mistakes</NavItem>
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon="📈">Analytics</NavItem>
          <NavItem active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon="📅">Calendar</NavItem>
          <NavItem active={activeTab === 'import'} onClick={() => setActiveTab('import')} icon="💾">Import & Export</NavItem>
        </nav>
        <div className="p-2 border-t border-apple-gray-200 dark:border-apple-gray-800 space-y-0.5">
          <ThemeToggle />
          <button onClick={() => setShowTradeForm(true)} className="w-full px-2.5 py-1.5 bg-apple-blue hover:bg-[#0051D5] active:bg-[#004FC4] text-white rounded-lg text-[13px] font-medium transition-all duration-150 shadow-sm">+ New Trade</button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {renderContent()}
        </div>
      </main>
      
      {showTradeForm && <TradeForm onClose={() => setShowTradeForm(false)} />}
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <TradeProvider>
        <MainApp />
      </TradeProvider>
    </ThemeProvider>
  );
};

export default App;
