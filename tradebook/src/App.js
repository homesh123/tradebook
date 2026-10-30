import React, { useState } from "react";
import { TradeProvider } from "./context/TradeContext";
import Overview from "./components/Overview";
import TradeLog from "./components/TradeLog";
import TradeForm from "./components/TradeForm";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import CalendarView from "./components/CalendarView";
import ImportExport from "./components/ImportExport";
import { useTrades } from "./context/TradeContext";

const NavItem = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-2 rounded mb-1 ${
      active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
    }`}
  >
    {children}
  </button>
);

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTradeForm, setShowTradeForm] = useState(false);
  const { trades } = useTrades();

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview onAddTrade={() => setShowTradeForm(true)} />;
      case 'trades':
        return <TradeLog />;
      case 'analytics':
        return <AnalyticsDashboard trades={trades} />;
      case 'calendar':
        return <CalendarView />;
      case 'import':
        return <ImportExport />;
      default:
        return <Overview onAddTrade={() => setShowTradeForm(true)} />;
    }
  };

  return (
    <div className="h-screen flex bg-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">📊 EdgeTrace</h1>
          <p className="text-xs text-slate-400">Trading Journal & Analytics</p>
        </div>
        <nav className="flex-1 p-4">
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            🏠 Overview
          </NavItem>
          <NavItem active={activeTab === 'trades'} onClick={() => setActiveTab('trades')}>
            📋 Trade Log
          </NavItem>
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
            📈 Analytics
          </NavItem>
          <NavItem active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')}>
            📅 Calendar
          </NavItem>
          <NavItem active={activeTab === 'import'} onClick={() => setActiveTab('import')}>
            💾 Import/Export
          </NavItem>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => setShowTradeForm(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            + Add Trade
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
      
      {showTradeForm && <TradeForm onClose={() => setShowTradeForm(false)} />}
    </div>
  );
};

const App = () => {
  return (
    <TradeProvider>
      <MainApp />
    </TradeProvider>
  );
};

export default App;
