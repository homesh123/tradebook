import React, { useState } from 'react';
import { useTrades } from '../context/TradeContext';

const MISTAKE_OPTIONS = ['FOMO', 'Chased Entry', 'Moved Stop', 'Revenge Trade', 'Overtrading', 'Ignored Plan', 'Early Entry', 'Late Exit', 'Poor Risk Management', 'Emotional'];
const TAG_OPTIONS = ['Breakout', 'Pullback', 'Reversal', 'Range', 'News', 'Scalp', 'Swing', 'Momentum', 'Support/Resistance', 'VWAP'];

const TradeForm = ({ onClose }) => {
  const { addTrade } = useTrades();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    pair: '',
    side: 'long',
    strategy: '',
    quantity: 1,
    entry: '',
    exit: '',
    stopLoss: '',
    takeProfit: '',
    fees: 0,
    notes: '',
    tags: [],
    mistakes: [],
    emotions: '',
    followedPlan: null
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.pair.trim()) newErrors.pair = 'Symbol is required';
    if (!formData.entry && formData.entry !== 0) newErrors.entry = 'Entry price is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (formData.exit !== '' && formData.exit !== null && formData.exit <= 0) newErrors.exit = 'Exit price must be greater than 0';
    if (formData.stopLoss !== '' && formData.stopLoss !== null && formData.stopLoss <= 0) newErrors.stopLoss = 'Stop loss must be greater than 0';
    if (formData.takeProfit !== '' && formData.takeProfit !== null && formData.takeProfit <= 0) newErrors.takeProfit = 'Take profit must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    addTrade({
      ...formData,
      quantity: parseFloat(formData.quantity) || 1,
      entry: parseFloat(formData.entry) || 0,
      exit: formData.exit === '' ? null : parseFloat(formData.exit),
      stopLoss: formData.stopLoss === '' ? null : parseFloat(formData.stopLoss),
      takeProfit: formData.takeProfit === '' ? null : parseFloat(formData.takeProfit),
      fees: parseFloat(formData.fees) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white dark:bg-apple-gray-800 rounded-apple max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-700">
        <div className="flex justify-between items-center px-6 py-4 border-b border-apple-gray-200 dark:border-apple-gray-700">
          <h2 className="text-[17px] font-semibold text-apple-gray-900 dark:text-white">New Trade</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 text-apple-gray-500 dark:text-apple-gray-400 transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors" required />
            </div>
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Symbol / Pair</label>
              <input type="text" name="pair" value={formData.pair} onChange={handleChange} placeholder="BTC/USDT, AAPL" className={`w-full px-3 py-2 rounded-lg ${errors.pair ? 'bg-apple-red/5 border-apple-red' : 'bg-apple-gray-100 dark:bg-apple-gray-700'} text-apple-gray-900 dark:text-white text-[13px] border border-apple-gray-200 dark:border-apple-gray-700 focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors placeholder:text-apple-gray-400`} required />
              {errors.pair && <p className="text-[11px] text-apple-red mt-1">{errors.pair}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Side</label>
              <select name="side" value={formData.side} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors">
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} step="any" className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors" required />
            </div>
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Fees</label>
              <input type="number" name="fees" value={formData.fees} onChange={handleChange} step="any" className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors" />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Entry</label>
              <input type="number" name="entry" value={formData.entry} onChange={handleChange} step="any" className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors" required />
            </div>
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Exit</label>
              <input type="number" name="exit" value={formData.exit} onChange={handleChange} step="any" placeholder="Open" className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors placeholder:text-apple-gray-400" />
            </div>
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Stop Loss</label>
              <input type="number" name="stopLoss" value={formData.stopLoss} onChange={handleChange} step="any" className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors" />
            </div>
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Take Profit</label>
              <input type="number" name="takeProfit" value={formData.takeProfit} onChange={handleChange} step="any" className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors" />
            </div>
          </div>
          
          <div>
            <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-2">Setup / Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map(tag => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleArrayItem('tags', tag)}
                  className={`px-2.5 py-1 rounded-full text-[12px] transition-colors ${
                    formData.tags.includes(tag) 
                      ? 'bg-apple-blue text-white' 
                      : 'bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-2">Mistakes</label>
            <div className="flex flex-wrap gap-1.5">
              {MISTAKE_OPTIONS.map(mistake => (
                <button
                  type="button"
                  key={mistake}
                  onClick={() => toggleArrayItem('mistakes', mistake)}
                  className={`px-2.5 py-1 rounded-full text-[12px] transition-colors ${
                    formData.mistakes.includes(mistake) 
                      ? 'bg-apple-red text-white' 
                      : 'bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-600'
                  }`}
                >
                  {mistake}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Emotions</label>
              <input type="text" name="emotions" value={formData.emotions} onChange={handleChange} placeholder="Calm, Confident" className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors placeholder:text-apple-gray-400" />
            </div>
            <div>
              <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Followed Plan</label>
              <select name="followedPlan" value={formData.followedPlan === null ? '' : formData.followedPlan.toString()} onChange={(e) => setFormData(prev => ({...prev, followedPlan: e.target.value === '' ? null : e.target.value === 'true'}))} className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors">
                <option value="">Not specified</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-[12px] text-apple-gray-600 dark:text-apple-gray-400 mb-1.5">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Trade thesis, execution, lessons..." className="w-full px-3 py-2 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-900 dark:text-white text-[13px] border border-transparent focus:border-apple-blue focus:bg-white dark:focus:bg-apple-gray-600 transition-colors resize-none placeholder:text-apple-gray-400"></textarea>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-apple-blue hover:bg-[#0051D5] active:bg-[#004FC4] text-white rounded-lg text-[13px] font-medium transition-colors">Add Trade</button>
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-apple-gray-100 dark:bg-apple-gray-700 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-600 text-apple-gray-900 dark:text-white rounded-lg text-[13px] font-medium transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeForm;
