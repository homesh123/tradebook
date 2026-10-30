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

export const exportTradesCSV = (trades) => {
  if (!trades.length) return '';
  const headers = ['id','date','pair','side','strategy','quantity','entry','exit','stopLoss','takeProfit','fees','notes','tags','mistakes','emotions','followedPlan'];
  const rows = trades.map(t => {
    const tags = Array.isArray(t.tags) ? t.tags.join('|') : (t.tags || '');
    const mistakes = Array.isArray(t.mistakes) ? t.mistakes.join('|') : (t.mistakes || '');
    return [
      t.id || '',
      t.date || '',
      t.pair || '',
      t.side || '',
      t.strategy || '',
      t.quantity || '',
      t.entry || '',
      t.exit === null || t.exit === undefined ? '' : t.exit,
      t.stopLoss === null || t.stopLoss === undefined ? '' : t.stopLoss,
      t.takeProfit === null || t.takeProfit === undefined ? '' : t.takeProfit,
      t.fees || 0,
      `"${(t.notes || '').replace(/"/g,'""')}"`,
      `"${tags.replace(/"/g,'""')}"`,
      `"${mistakes.replace(/"/g,'""')}"`,
      t.emotions || '',
      t.followedPlan === true ? 'yes' : (t.followedPlan === false ? 'no' : '')
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
};

const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (ch === '"') {
      if (inQuotes && line[j+1] === '"') {
        current += '"';
        j++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else if (ch === '\t' && !inQuotes && values.length === 0 && line.includes('\t')) {
      // try tab
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
};

export const importTradesCSV = (csvText) => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  
  // Try to detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  
  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
  const trades = [];
  
  // Check if it's MT5 format
  const isMT5 = headers.some(h => h.toLowerCase().includes('ticket') || h.toLowerCase().includes('open time') || h.toLowerCase() === 'type');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    let values;
    if (delimiter === ',') {
      values = parseCSVLine(line);
    } else {
      values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
    }
    
    if (isMT5) {
      // MT5 format
      const getVal = (name) => {
        const idx = headers.findIndex(h => h.toLowerCase() === name.toLowerCase() || h.toLowerCase().includes(name.toLowerCase()));
        return idx >= 0 ? values[idx] : '';
      };
      
      const type = getVal('Type').toLowerCase();
      const side = type.includes('buy') ? 'long' : 'sell';
      const openTime = getVal('Open Time');
      const closeTime = getVal('Close Time');
      const item = getVal('Item') || getVal('Symbol');
      const size = parseFloat(getVal('Size')) || 1;
      const priceOpen = parseFloat(getVal('Price').replace(',', '.')) || 0;
      const priceClose = parseFloat(getVal('Price Close') || values[headers.findIndex(h => h.toLowerCase() === 'price' && h !== headers[headers.findIndex(h2=>h2.toLowerCase()==='price')])]) || 0;
      // MT5 sometimes has Price for open and another Price for close
      const priceIdx = headers.findIndex(h => h.toLowerCase() === 'price');
      const priceCloseIdx = headers.findIndex((h,idx) => h.toLowerCase() === 'price' && idx > priceIdx);
      const actualClose = priceCloseIdx >= 0 ? values[priceCloseIdx] : getVal('Close Price');
      const closePrice = parseFloat((actualClose || '0').toString().replace(',', '.')) || 0;
      const profit = parseFloat(getVal('Profit').replace(',', '.')) || 0;
      const commission = Math.abs(parseFloat(getVal('Commission').replace(',', '.')) || 0);
      const swap = Math.abs(parseFloat(getVal('Swap').replace(',', '.')) || 0);
      const sl = parseFloat(getVal('S/L').replace(',', '.')) || null;
      const tp = parseFloat(getVal('T/P').replace(',', '.')) || null;
      
      let date = new Date().toISOString().split('T')[0];
      if (openTime) {
        try {
          const d = new Date(openTime.replace(/\./g, '-'));
          if (!isNaN(d.getTime())) date = d.toISOString().split('T')[0];
        } catch(e) {}
      }
      
      trades.push({
        id: getVal('Ticket') || Date.now().toString() + Math.random().toString(36).substr(2,5),
        date: date,
        pair: item,
        side: side,
        strategy: 'Imported',
        quantity: size,
        entry: priceOpen,
        exit: closePrice > 0 ? closePrice : null,
        stopLoss: sl,
        takeProfit: tp,
        fees: commission + swap,
        notes: `MT5 import - Ticket: ${getVal('Ticket')}, Profit: ${profit}`,
        tags: [],
        mistakes: [],
        emotions: '',
        followedPlan: null,
        createdAt: new Date().toISOString()
      });
    } else {
      // Standard format
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h.toLowerCase()] = values[idx] !== undefined ? values[idx].replace(/"/g, '') : '';
      });
      
      trades.push({
        id: obj.id || Date.now().toString() + Math.random().toString(36).substr(2,5),
        date: obj.date || new Date().toISOString().split('T')[0],
        pair: obj.pair || obj.symbol || '',
        side: (obj.side || 'long').toLowerCase(),
        strategy: obj.strategy || '',
        quantity: parseFloat(obj.quantity) || 1,
        entry: parseFloat(obj.entry) || 0,
        exit: obj.exit === '' || obj.exit === undefined ? null : parseFloat(obj.exit),
        stopLoss: obj.stoploss === '' || obj.stoploss === undefined ? null : parseFloat(obj.stoploss),
        takeProfit: obj.takeprofit === '' || obj.takeprofit === undefined ? null : parseFloat(obj.takeprofit),
        fees: parseFloat(obj.fees) || 0,
        notes: obj.notes || '',
        tags: obj.tags ? obj.tags.split('|').filter(x=>x) : [],
        mistakes: obj.mistakes ? obj.mistakes.split('|').filter(x=>x) : [],
        emotions: obj.emotions || '',
        followedPlan: obj.followedplan === 'yes' ? true : (obj.followedplan === 'no' ? false : null),
        createdAt: new Date().toISOString()
      });
    }
  }
  return trades;
};
