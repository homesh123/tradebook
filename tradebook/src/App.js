import React, { useState } from "react";
import { TradeProvider } from "./context/TradeContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Overview from "./components/Overview";
import TradeLog from "./components/TradeLog";
import TradeForm from "./components/TradeForm";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import CalendarView from "./components/CalendarView";
import ImportExport from "./components/ImportExport";
import SampleDataLoader from "./components/SampleDataLoader";
import { useTrades } from "./context/TradeContext";

const NavItem = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 flex items-center gap-2.5 text-[13px] transition-colors ${
      active 
        ? 'bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue font-medium' 
        : 'text-apple-gray-600 dark:text-apple-gray-400 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800/50'
    }`}
  >
    <span className="text-base">{icon}</span>
    <span>{children}</span>
  </button>
);

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-[13px] text-apple-gray-600 dark:text-apple-gray-400 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800/50 transition-colors"
    >
      <span className="text-base">{theme === 'dark' ? '☀️' : '🌙'}</span>
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
    <div className="h-screen flex flex-col md:flex-row bg-apple-gray-50 dark:bg-black transition-colors">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-xl border-b border-apple-gray-200 dark:border-apple-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h1 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white">EdgeTrace</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-apple-gray-900 dark:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[57px] left-0 right-0 bg-white/95 dark:bg-apple-gray-900/95 backdrop-blur-xl border-b border-apple-gray-200 dark:border-apple-gray-800 z-40 shadow-lg">
          <nav className="p-3">
            <NavItem active={activeTab === 'overview'} onClick={() => handleNavClick('overview')} icon="🏠">Overview</NavItem>
            <NavItem active={activeTab === 'trades'} onClick={() => handleNavClick('trades')} icon="📋">Trade Log</NavItem>
            <NavItem active={activeTab === 'analytics'} onClick={() => handleNavClick('analytics')} icon="📈">Analytics</NavItem>
            <NavItem active={activeTab === 'calendar'} onClick={() => handleNavClick('calendar')} icon="📅">Calendar</NavItem>
            <NavItem active={activeTab === 'import'} onClick={() => handleNavClick('import')} icon="💾">Import & Export</NavItem>
            <div className="mt-2 pt-2 border-t border-apple-gray-200 dark:border-apple-gray-800 space-y-1">
              <ThemeToggle />
              <button onClick={() => { setShowTradeForm(true); setMobileMenuOpen(false); }} className="w-full px-3 py-2 bg-apple-blue text-white rounded-lg text-[13px] font-medium">+ New Trade</button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-[220px] bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-xl flex-col border-r border-apple-gray-200 dark:border-apple-gray-800 transition-colors">
        <div className="p-5 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📊</span>
            <h1 className="text-[15px] font-semibold text-apple-gray-900 dark:text-white tracking-tight">EdgeTrace</h1>
          </div>
          <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 ml-7">Trading Journal</p>
        </div>
        <nav className="flex-1 px-3">
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon="🏠">Overview</NavItem>
          <NavItem active={activeTab === 'trades'} onClick={() => setActiveTab('trades')} icon="📋">Trade Log</NavItem>
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon="📈">Analytics</NavItem>
          <NavItem active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon="📅">Calendar</NavItem>
          <NavItem active={activeTab === 'import'} onClick={() => setActiveTab('import')} icon="💾">Import & Export</NavItem>
        </nav>
        <div className="p-3 border-t border-apple-gray-200 dark:border-apple-gray-800 space-y-1">
          <ThemeToggle />
          <button onClick={() => setShowTradeForm(true)} className="w-full px-3 py-2 bg-apple-blue hover:bg-[#0051D5] active:bg-[#004FC4] text-white rounded-lg text-[13px] font-medium transition-colors shadow-sm">+ New Trade</button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
          {renderContent()}
        </div>
      </div>
      
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
