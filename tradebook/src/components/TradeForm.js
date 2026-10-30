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
    setup: '',
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

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Add New Trade</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 rounded bg-slate-700 text-white" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Pair/Symbol</label>
              <input type="text" name="pair" value={formData.pair} onChange={handleChange} placeholder="BTC/USDT, AAPL" className="w-full p-2 rounded bg-slate-700 text-white" required />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Side</label>
              <select name="side" value={formData.side} onChange={handleChange} className="w-full p-2 rounded bg-slate-700 text-white">
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} step="any" className="w-full p-2 rounded bg-slate-700 text-white" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Fees</label>
              <input type="number" name="fees" value={formData.fees} onChange={handleChange} step="any" className="w-full p-2 rounded bg-slate-700 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Entry Price</label>
              <input type="number" name="entry" value={formData.entry} onChange={handleChange} step="any" className="w-full p-2 rounded bg-slate-700 text-white" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Exit Price (leave empty if open)</label>
              <input type="number" name="exit" value={formData.exit} onChange={handleChange} step="any" className="w-full p-2 rounded bg-slate-700 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Stop Loss</label>
              <input type="number" name="stopLoss" value={formData.stopLoss} onChange={handleChange} step="any" className="w-full p-2 rounded bg-slate-700 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Take Profit</label>
              <input type="number" name="takeProfit" value={formData.takeProfit} onChange={handleChange} step="any" className="w-full p-2 rounded bg-slate-700 text-white" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Strategy/Playbook</label>
            <input type="text" name="strategy" value={formData.strategy} onChange={handleChange} placeholder="e.g., My Breakout Strategy" className="w-full p-2 rounded bg-slate-700 text-white" />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Setup/Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleArrayItem('tags', tag)}
                  className={`px-2 py-1 rounded text-sm ${formData.tags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Mistakes Made</label>
            <div className="flex flex-wrap gap-2">
              {MISTAKE_OPTIONS.map(mistake => (
                <button
                  type="button"
                  key={mistake}
                  onClick={() => toggleArrayItem('mistakes', mistake)}
                  className={`px-2 py-1 rounded text-sm ${formData.mistakes.includes(mistake) ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                >
                  {mistake}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Emotions</label>
              <input type="text" name="emotions" value={formData.emotions} onChange={handleChange} placeholder="Calm, Anxious, Confident" className="w-full p-2 rounded bg-slate-700 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Followed Plan?</label>
              <select name="followedPlan" value={formData.followedPlan === null ? '' : formData.followedPlan.toString()} onChange={(e) => setFormData(prev => ({...prev, followedPlan: e.target.value === '' ? null : e.target.value === 'true'}))} className="w-full p-2 rounded bg-slate-700 text-white">
                <option value="">Not specified</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Trade thesis, execution notes, lessons learned..." className="w-full p-2 rounded bg-slate-700 text-white"></textarea>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">Add Trade</button>
            <button type="button" onClick={onClose} className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeForm;
