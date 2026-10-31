const STORAGE_KEY = 'tradebook_trades_v1';

export const loadTrades = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load trades', e);
    return [];
  }
};

export const saveTrades = (trades) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch (e) {
    console.error('Failed to save trades', e);
  }
};

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

export const CSV_HEADERS = ['id', 'date', 'time', 'pair', 'side', 'strategy', 'quantity', 'multiplier', 'entry', 'exit', 'stopLoss', 'takeProfit', 'fees', 'netPnl', 'grade', 'notes', 'tags', 'mistakes', 'emotions', 'followedPlan', 'screenshot'];

const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const exportTradesCSV = (trades) => {
  if (!trades.length) return '';
  const rows = trades.map(t => [
    t.id, t.date, t.time, t.pair, t.side, t.strategy, t.quantity, t.multiplier, t.entry, t.exit, t.stopLoss, t.takeProfit, t.fees, t.netPnl, t.grade,
    t.notes,
    Array.isArray(t.tags) ? t.tags.join('|') : t.tags,
    Array.isArray(t.mistakes) ? t.mistakes.join('|') : t.mistakes,
    t.emotions,
    t.followedPlan === true ? 'yes' : t.followedPlan === false ? 'no' : '',
    t.screenshot,
  ].map(csvCell).join(','));
  return [CSV_HEADERS.join(','), ...rows].join('\n');
};

export const csvTemplate = () =>
  CSV_HEADERS.join(',') + '\n' +
  ',2024-03-01,09:45,AAPL,long,Breakout,10,1,185.20,188.90,183.50,190,1.00,,A,"Clean breakout on volume",Breakout|Momentum,,Calm,yes,';

// Splits CSV text into rows, honoring quoted fields that contain commas or newlines.
const parseCSV = (text, delimiter) => {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cur); cur = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      cur += ch;
    }
  }
  row.push(cur);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  return rows;
};

const toNum = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().replace(/\s/g, '');
  if (s === '') return null;
  const n = parseFloat(s.replace(/,(?=\d{1,2}$)/, '.').replace(/,/g, ''));
  return isNaN(n) ? null : n;
};

const toDateTime = (raw) => {
  if (!raw) return { date: null, time: '' };
  const m = String(raw).trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) {
    return {
      date: `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`,
      time: m[4] ? `${m[4].padStart(2, '0')}:${m[5]}` : '',
    };
  }
  const d = new Date(raw);
  if (isNaN(d)) return { date: null, time: '' };
  return { date: d.toISOString().slice(0, 10), time: '' };
};

export const importTradesCSV = (csvText) => {
  const firstLine = csvText.split(/\r?\n/)[0] || '';
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';
  const rows = parseCSV(csvText, delimiter);
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().replace(/^﻿/, ''));
  const lower = headers.map(h => h.toLowerCase());
  const isMT5 = lower.some(h => h === 'ticket' || h === 'open time' || h === 'position');
  const today = new Date().toISOString().slice(0, 10);
  const trades = [];

  rows.slice(1).forEach((values, rowIdx) => {
    if (isMT5) {
      const idx = (name) => lower.indexOf(name.toLowerCase());
      const get = (...names) => {
        for (const n of names) { const i = idx(n); if (i >= 0) return values[i]; }
        return '';
      };
      // MT5 reports have two "Price" columns: open price first, close price second.
      const priceIdx = lower.indexOf('price');
      const closePriceIdx = lower.indexOf('price', priceIdx + 1);
      const type = (get('Type') || '').toLowerCase();
      if (!type.includes('buy') && !type.includes('sell')) return; // skip balance/deposit rows
      const open = toDateTime(get('Open Time', 'Time'));
      const profit = toNum(get('Profit')) || 0;
      const commission = toNum(get('Commission')) || 0;
      const swap = toNum(get('Swap')) || 0;
      const exit = closePriceIdx >= 0 ? toNum(values[closePriceIdx]) : toNum(get('Close Price'));
      const ticket = get('Ticket', 'Position');
      trades.push({
        id: ticket ? `mt5-${ticket}` : newId(),
        date: open.date || today,
        time: open.time,
        pair: get('Item', 'Symbol'),
        side: type.includes('buy') ? 'long' : 'short',
        strategy: 'Imported',
        quantity: toNum(get('Size', 'Volume')) || 1,
        multiplier: null,
        entry: priceIdx >= 0 ? toNum(values[priceIdx]) || 0 : 0,
        exit,
        stopLoss: toNum(get('S/L', 'S / L')) || null,
        takeProfit: toNum(get('T/P', 'T / P')) || null,
        fees: Math.abs(commission + swap),
        // Broker profit already uses the real contract size; add commission & swap for net.
        netPnl: exit !== null ? profit + commission + swap : null,
        grade: '',
        notes: `MT5 import – ticket ${ticket}`,
        tags: [],
        mistakes: [],
        emotions: '',
        followedPlan: null,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    const obj = {};
    lower.forEach((h, i) => { obj[h.replace(/[\s_]/g, '')] = values[i] !== undefined ? values[i].trim() : ''; });
    const dt = toDateTime(obj.date);
    const split = (v) => (v ? v.split(/[|;]/).map(x => x.trim()).filter(Boolean) : []);
    const fp = (obj.followedplan || '').toLowerCase();
    trades.push({
      id: obj.id || newId() + rowIdx,
      date: dt.date || today,
      time: obj.time || dt.time || '',
      pair: obj.pair || obj.symbol || obj.ticker || '',
      side: /^(short|sell|s)$/i.test(obj.side || '') ? 'short' : 'long',
      strategy: obj.strategy || '',
      quantity: toNum(obj.quantity || obj.qty || obj.size) || 1,
      multiplier: toNum(obj.multiplier),
      entry: toNum(obj.entry || obj.entryprice) || 0,
      exit: toNum(obj.exit || obj.exitprice),
      stopLoss: toNum(obj.stoploss || obj.sl),
      takeProfit: toNum(obj.takeprofit || obj.tp),
      fees: toNum(obj.fees || obj.commission) || 0,
      netPnl: toNum(obj.netpnl || obj.pnl),
      grade: obj.grade || '',
      notes: obj.notes || '',
      tags: split(obj.tags),
      mistakes: split(obj.mistakes),
      emotions: obj.emotions || obj.emotion || '',
      followedPlan: ['yes', 'true', 'y', '1'].includes(fp) ? true : ['no', 'false', 'n', '0'].includes(fp) ? false : null,
      screenshot: obj.screenshot || '',
      createdAt: new Date().toISOString(),
    });
  });
  return trades.filter(t => t.pair);
};

// Full backup (trades + settings) as JSON.
export const exportBackupJSON = (trades, settings) =>
  JSON.stringify({ app: 'EdgeTrace', version: 2, exportedAt: new Date().toISOString(), trades, settings }, null, 2);

export const parseBackupJSON = (text) => {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return { trades: data, settings: null };
  if (!data || !Array.isArray(data.trades)) throw new Error('Not an EdgeTrace backup file');
  return { trades: data.trades, settings: data.settings || null };
};

export const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
