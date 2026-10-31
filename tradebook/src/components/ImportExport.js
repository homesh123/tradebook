import React, { useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { exportTradesCSV, importTradesCSV } from '../utils/storage';

const ImportExport = () => {
  const { trades, importTrades, clearAllTrades } = useTrades();
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');

  const handleExport = () => {
    const csv = exportTradesCSV(trades);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradebook_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage('Exported successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImport = () => {
    try {
      const imported = importTradesCSV(importText);
      if (imported.length === 0) {
        setMessage('No trades found to import');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      importTrades(imported);
      setImportText('');
      setMessage(`Imported ${imported.length} trade(s)!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setMessage('Error importing CSV');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Import / Export</h2>
      
      {message && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded">
          {message}
        </div>
      )}
      
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Export Trades</h3>
        <p className="text-slate-400 mb-4">Download all your trades as CSV for backup or analysis in other tools.</p>
        <button onClick={handleExport} disabled={trades.length === 0} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded">
          Export {trades.length} Trade(s) to CSV
        </button>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Import Trades</h3>
        <p className="text-slate-400 mb-4">Import trades from CSV. You can paste CSV content or upload a file.</p>
        
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Upload CSV File</label>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="text-slate-300" />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Or Paste CSV Content</label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows="6"
            placeholder="id,date,pair,side,entry,exit,..."
            className="w-full p-2 rounded bg-slate-700 text-white font-mono text-sm"
          ></textarea>
        </div>
        
        <button onClick={handleImport} disabled={!importText.trim()} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded">
          Import Trades
        </button>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-lg border border-red-900">
        <h3 className="text-lg font-semibold text-red-400 mb-3">Danger Zone</h3>
        <p className="text-slate-400 mb-4">Clear all trades from this device. This action cannot be undone.</p>
        <button onClick={() => {
          if (window.confirm('Are you sure you want to delete all trades? This cannot be undone.')) {
            clearAllTrades();
            setMessage('All trades cleared');
            setTimeout(() => setMessage(''), 3000);
          }
        }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
          Clear All Trades
        </button>
      </div>
    </div>
  );
};

export default ImportExport;
