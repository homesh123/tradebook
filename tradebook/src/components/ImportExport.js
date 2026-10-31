import React, { useMemo, useRef, useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { useSettings } from '../context/SettingsContext';
import { exportTradesCSV, importTradesCSV, exportBackupJSON, parseBackupJSON, csvTemplate, downloadFile } from '../utils/storage';
import { sampleTradesFull } from '../utils/sampleDataFull';
import { PageHeader, Card, Button, cx, useFeedback } from './ui';

const stamp = () => new Date().toISOString().slice(0, 10);

const ImportExport = () => {
  const { trades, importTrades, replaceAllTrades, clearAllTrades } = useTrades();
  const { settings, replaceSettings } = useSettings();
  const { toast, confirm } = useFeedback();
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const backupRef = useRef(null);

  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    try {
      const list = importTradesCSV(text);
      const existing = new Set(trades.map(t => t.id));
      return { list, dupes: list.filter(t => existing.has(t.id)).length, mt5: list.some(t => String(t.id).startsWith('mt5-')) };
    } catch (e) {
      return { error: e.message };
    }
  }, [text, trades]);

  const readFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setText(String(e.target.result || ''));
    reader.readAsText(file);
  };

  const doImport = () => {
    if (!parsed || !parsed.list || !parsed.list.length) return;
    const { added, skipped } = importTrades(parsed.list);
    toast(`Imported ${added} trade${added === 1 ? '' : 's'}${skipped ? ` · ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped` : ''}`);
    setText('');
    setFileName('');
  };

  const exportCSV = () => {
    downloadFile(exportTradesCSV(trades), `edgetrace_trades_${stamp()}.csv`, 'text/csv');
    toast(`Exported ${trades.length} trades`);
  };
  const exportJSON = () => {
    downloadFile(exportBackupJSON(trades, settings), `edgetrace_backup_${stamp()}.json`, 'application/json');
    toast('Backup downloaded');
  };

  const restore = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = parseBackupJSON(String(e.target.result));
        const ok = await confirm({
          title: 'Restore backup?',
          message: `This replaces your current ${trades.length} trades with ${data.trades.length} trades from the backup${data.settings ? ' and restores your settings' : ''}.`,
          confirmLabel: 'Restore',
          destructive: true,
        });
        if (!ok) return;
        replaceAllTrades(data.trades);
        if (data.settings) replaceSettings(data.settings);
        toast(`Restored ${data.trades.length} trades`);
      } catch (err) {
        toast(`Could not read backup: ${err.message}`, { tone: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const clearAll = async () => {
    const ok = await confirm({ title: 'Delete all trades?', message: `All ${trades.length} trades on this device will be permanently deleted. Download a backup first if you might need them.`, confirmLabel: 'Delete All', destructive: true });
    if (!ok) return;
    clearAllTrades();
    toast('All trades deleted');
  };

  const loadDemo = () => {
    const { added } = importTrades(sampleTradesFull);
    toast(added ? `Loaded ${added} demo trades` : 'Demo trades are already loaded', { tone: added ? 'success' : 'info' });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Import & Export" subtitle="Bring trades in from your broker, and keep backups of your journal" />

      <Card title="Import trades" subtitle="EdgeTrace CSV, generic CSV (date, symbol, side, entry, exit…) or an MT4/MT5 history report">
        <div className="p-5 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files[0]); }}
            className={cx('rounded-apple border-2 border-dashed p-6 text-center transition-colors', dragging ? 'border-apple-blue bg-apple-blue/5' : 'border-apple-gray-300 dark:border-apple-gray-600')}
          >
            <div className="text-2xl mb-1" aria-hidden>📄</div>
            <p className="text-[13px] text-apple-gray-600 dark:text-apple-gray-300">
              Drop a CSV file here, or <button className="text-apple-blue font-medium" onClick={() => fileRef.current.click()}>choose a file</button>
            </p>
            {fileName && <p className="text-[12px] text-apple-gray-500 mt-1">Selected: {fileName}</p>}
            <input ref={fileRef} type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={(e) => { readFile(e.target.files[0]); e.target.value = ''; }} />
          </div>

          <details className="group">
            <summary className="text-[12px] text-apple-blue font-medium cursor-pointer select-none">Or paste CSV text</summary>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows="6" placeholder="date,pair,side,quantity,entry,exit,stopLoss…"
              className="mt-2 w-full p-3 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white font-mono text-[12px] border border-transparent focus:border-apple-blue" />
          </details>

          {parsed && (
            <div className={cx('rounded-lg p-3 text-[13px]', parsed.error || !parsed.list.length ? 'bg-apple-red/10 text-apple-red' : 'bg-apple-blue/10 text-apple-gray-900 dark:text-white')}>
              {parsed.error ? `Could not read this file: ${parsed.error}` : !parsed.list.length ? 'No trades found. Check that the first row contains column headers.' : (
                <>Found <strong>{parsed.list.length}</strong> trade{parsed.list.length === 1 ? '' : 's'}{parsed.mt5 ? ' in MT5 format (broker profit + commission + swap used as net P&L)' : ''}.{parsed.dupes > 0 && ` ${parsed.dupes} already exist and will be skipped.`}</>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={doImport} disabled={!parsed || !parsed.list || !parsed.list.length}>Import Trades</Button>
            <Button variant="secondary" onClick={() => downloadFile(csvTemplate(), 'edgetrace_template.csv', 'text/csv')}>Download CSV template</Button>
            {text && <Button variant="ghost" onClick={() => { setText(''); setFileName(''); }}>Clear</Button>}
          </div>
          <p className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400">
            Tip: after importing from a broker, open each trade in the Trade Log to tag setups, mistakes and emotions – that’s where the insights come from.
          </p>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Export" subtitle="Spreadsheet-friendly CSV of all trades">
          <div className="p-5 space-y-3">
            <p className="text-[13px] text-apple-gray-600 dark:text-apple-gray-400">Open in Excel, Google Sheets or another journal.</p>
            <Button onClick={exportCSV} disabled={!trades.length}>Export {trades.length} trades (CSV)</Button>
          </div>
        </Card>
        <Card title="Backup & restore" subtitle="Everything: trades, settings and custom tags">
          <div className="p-5 space-y-3">
            <p className="text-[13px] text-apple-gray-600 dark:text-apple-gray-400">Your journal lives only in this browser. Back up regularly, and restore to move to another device.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportJSON} disabled={!trades.length}>Download backup</Button>
              <Button variant="secondary" onClick={() => backupRef.current.click()}>Restore from backup…</Button>
              <input ref={backupRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { restore(e.target.files[0]); e.target.value = ''; }} />
            </div>
          </div>
        </Card>
      </div>

      <Card title="Demo data" subtitle="30 realistic trades with repeated mistakes, to explore the analytics">
        <div className="p-5"><Button variant="secondary" onClick={loadDemo}>Load demo trades</Button></div>
      </Card>

      <Card title="Danger zone" className="border-apple-red/30 dark:border-apple-red/40">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[13px] text-apple-gray-600 dark:text-apple-gray-400">Permanently delete every trade stored on this device.</p>
          <Button variant="danger" onClick={clearAll} disabled={!trades.length}>Delete all trades</Button>
        </div>
      </Card>
    </div>
  );
};

export default ImportExport;
