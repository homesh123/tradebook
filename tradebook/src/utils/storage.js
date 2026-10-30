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
  const headers = ['id','date','pair','side','strategy','setup','quantity','entry','exit','stopLoss','takeProfit','fees','notes','tags','mistakes','emotions','followedPlan'];
  const rows = trades.map(t => {
    const tags = Array.isArray(t.tags) ? t.tags.join('|') : (t.tags || '');
    const mistakes = Array.isArray(t.mistakes) ? t.mistakes.join('|') : (t.mistakes || '');
    return [
      t.id || '',
      t.date || '',
      t.pair || '',
      t.side || '',
      t.strategy || '',
      t.setup || '',
      t.quantity || '',
      t.entry || '',
      t.exit || '',
      t.stopLoss || '',
      t.takeProfit || '',
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

export const importTradesCSV = (csvText) => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const trades = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // simple CSV parse (handles quoted commas)
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
      } else {
        current += ch;
      }
    }
    values.push(current);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    // normalize
    trades.push({
      id: obj.id || Date.now().toString() + Math.random().toString(36).substr(2,5),
      date: obj.date || new Date().toISOString().split('T')[0],
      pair: obj.pair || '',
      side: obj.side || 'long',
      strategy: obj.strategy || '',
      setup: obj.setup || '',
      quantity: parseFloat(obj.quantity) || 1,
      entry: parseFloat(obj.entry) || 0,
      exit: obj.exit === '' ? null : parseFloat(obj.exit),
      stopLoss: obj.stopLoss === '' ? null : parseFloat(obj.stopLoss),
      takeProfit: obj.takeProfit === '' ? null : parseFloat(obj.takeProfit),
      fees: parseFloat(obj.fees) || 0,
      notes: obj.notes || '',
      tags: obj.tags ? obj.tags.split('|').filter(x=>x) : [],
      mistakes: obj.mistakes ? obj.mistakes.split('|').filter(x=>x) : [],
      emotions: obj.emotions || '',
      followedPlan: obj.followedPlan === 'yes' ? true : (obj.followedPlan === 'no' ? false : null),
      createdAt: new Date().toISOString()
    });
  }
  return trades;
};
