import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, cx } from './ui';

// Help content. Each topic is a title plus paragraphs / bullet lists, so it can be searched.
const TOPICS = [
  {
    id: 'start', icon: '🚀', title: 'Getting started', page: 'overview',
    body: [
      'EdgeTrace is a trading journal focused on one thing: finding the mistakes and behaviours that cost you money, and telling you how to fix them.',
      ['1. Open Settings and enter your starting balance, max risk per trade, daily loss limit and max trades per day.',
        '2. Log trades with the + New Trade button (or press N), or import a CSV / MT5 report from Import & Export.',
        '3. On every trade, tag the setup, any mistakes, how you felt and whether you followed your plan. Be honest – these tags power every insight.',
        '4. Review the Overview daily and Analytics weekly. Work on the #1 suggestion until it disappears.'],
      'Just exploring? Load the demo data from the Overview or Import & Export page.',
    ],
  },
  {
    id: 'workflow', icon: '🔁', title: 'A pro trader’s daily routine', page: 'overview',
    body: [
      ['Before the session: check Overview → "What to work on" and Today’s guardrails. Pick one rule to focus on.',
        'During the session: log each trade right after you enter it (leave Exit empty – it shows as OPEN). The live preview tells you the risk in $ and % before you commit.',
        'After each exit: open the trade, add the exit price, tag mistakes, emotion, plan adherence and an execution grade.',
        'When the Overview shows "Stop trading for today", stop. The limit exists for days like this.',
        'Weekly: open Analytics, read the Coach’s Action Plan, check Mistakes Over Time and the Discipline Trend. Your goal is a rising discipline score and shrinking mistake bars.'],
    ],
  },
  {
    id: 'logging', icon: '✏️', title: 'Logging a trade', page: 'trades',
    body: [
      'Click + New Trade (or press N). Click any trade anywhere in the app to edit it, close it or delete it.',
      ['Symbol, date and entry time – time is optional but unlocks the "P&L by entry hour" chart.',
        'Side – Long (buy) or Short (sell).',
        'Entry / Exit – leave Exit empty while the trade is open.',
        'Quantity – shares, contracts, coins or units.',
        'Stop loss & take profit – needed for risk, R-multiple and planned risk:reward. The form checks they are on the correct side of entry.',
        'Fees – commissions and swaps; subtracted from P&L.',
        'Futures, forex & broker P&L – Point value/multiplier converts price moves into dollars (ES = 50, NQ = 20, MES = 5, 1 standard forex lot = 100,000). "Net P&L from broker" overrides the calculation with the exact number from your statement.',
        'Setup, Mistakes, Emotion – pick from the list or type your own and press Enter. Custom items are saved for next time.',
        'Followed plan & execution grade (A+ to D) – how well you executed, independent of the result.',
        'Notes – thesis, what happened and the lesson.'],
      'The live preview shows risk in $ and % of your account, planned R:R, P&L and R-multiple, and warns when a trade breaks your max-risk rule.',
    ],
  },
  {
    id: 'tradelog', icon: '📋', title: 'Trade Log', page: 'trades',
    body: [
      'Every trade in one list. Search by symbol, notes, setup, mistake, strategy or emotion. Filter by result (winners, losers, open, trades with mistakes), side, setup, mistake and date range, and sort by date, P&L or R.',
      'The summary line shows the count, net P&L and win rate of whatever is currently filtered – e.g. filter by the "FOMO" mistake to see exactly what FOMO costs you.',
      'Deleting asks for confirmation and can be undone from the notification.',
    ],
  },
  {
    id: 'calendar', icon: '📅', title: 'Calendar', page: 'calendar',
    body: [
      'Monthly view of daily P&L. Green days are profitable, red days are losing; darker colour means a bigger result. The last column shows each week’s total.',
      'Click a day to see its trades, mistakes and notes, or to add a trade on that date. Days where your daily loss limit was hit are flagged.',
    ],
  },
  {
    id: 'mistakes', icon: '🎯', title: 'Mistakes', page: 'mistakes',
    body: [
      'Every mistake you tagged, ranked by how much money it cost (sum of losses on trades with that mistake). Impact levels: Critical > $500, High > $200, Medium > $50.',
      'Expand a mistake to see the trades affected, plus a rule to follow, action steps and a prevention method.',
      'A mistake tagged 3+ times is marked REPEATING – that is a habit, not an accident.',
    ],
  },
  {
    id: 'analytics', icon: '📈', title: 'Analytics', page: 'analytics',
    body: [
      'Filter by All / Last 50 / Last 20 trades to see whether recent behaviour is improving. Switch to Tables for exact numbers.',
      ['Discipline score – 60% share of mistake-free trades + 40% plan adherence. 75+ disciplined, 50–74 inconsistent, under 50 undisciplined.',
        'Coach’s Action Plan – ranked suggestions (Critical → Tip) generated from your data, each with a concrete "Do this".',
        'Equity curve: Actual vs Disciplined – the dashed line is your P&L if you had skipped every trade with a mistake. The gap is the price of indiscipline.',
        'What each mistake costs you / How often each happens – the money and the frequency side of each mistake.',
        'Mistakes over time – stacked mistakes per week or month. These bars should shrink.',
        'Discipline trend – rolling % of mistake-free trades over the last 5. Aim for 80%+.',
        'Emotion vs results – average P&L per trade for each emotional state.',
        'Behaviour patterns – clean vs mistake trades, plan followed vs broken, and the trade after a win vs after a loss (tilt detection).',
        'P&L by day of week and by entry hour – when you trade best and worst.',
        'R-multiple distribution – losses beyond −1R mean the stop was moved, ignored or missing.',
        'Risk rule breaks – days over the daily loss limit or max trades, trades above max risk, trades without a stop.',
        'Mistake breakdown, mistake chains (mistakes that happen together) and performance by setup.'],
    ],
  },
  {
    id: 'overview', icon: '🏠', title: 'Overview', page: 'overview',
    body: [
      'Your daily dashboard: account balance (starting balance + net P&L) with equity curve, today’s P&L and guardrails, discipline score, cost of mistakes, top 3 suggestions, your biggest leak, recent trades and open positions.',
      'When today’s loss reaches your daily loss limit, or you hit your max trades, a "Stop trading for today" banner appears.',
    ],
  },
  {
    id: 'import', icon: '💾', title: 'Import, export & backup', page: 'import',
    body: [
      ['CSV import – drop a file or paste text. Columns (any order, case-insensitive): date, time, pair/symbol, side (long/short/buy/sell), quantity, multiplier, entry, exit, stopLoss, takeProfit, fees, netPnl, grade, notes, tags, mistakes (separate multiple values with |), emotions, followedPlan (yes/no), screenshot. Download the template to start.',
        'MT4/MT5 – export your account history as CSV (columns Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Time, Price, Commission, Swap, Profit). Broker profit + commission + swap is used as the exact net P&L.',
        'Duplicates (same id / ticket) are skipped automatically, so you can re-import a growing history file safely.',
        'Export CSV – all trades in a spreadsheet-friendly format.',
        'Backup / Restore – a JSON file with all trades, settings and custom lists. Use it to move to another browser or device.'],
      'After importing from a broker, open each trade to add setups, mistakes and emotions.',
    ],
  },
  {
    id: 'settings', icon: '⚙️', title: 'Settings & risk rules', page: 'settings',
    body: [
      ['Starting balance – base for account balance, % return, drawdown % and risk %.',
        'Max risk per trade (%) – trades risking more than this (+10% tolerance) are flagged in the form and in Analytics.',
        'Daily loss limit ($) – drives the Overview guardrail, Calendar flags and Analytics rule breaks. 0 turns it off.',
        'Max trades per day – flags overtrading days. 0 turns it off.',
        'Custom lists – remove setups, mistakes or emotions you added.'],
    ],
  },
  {
    id: 'glossary', icon: '📖', title: 'Metrics glossary',
    body: [
      ['P&L – (exit − entry) × quantity × multiplier − fees (reversed for shorts), or the broker net P&L if entered.',
        'Win rate – winning trades ÷ closed trades.',
        'Profit factor – gross profit ÷ gross loss. Above 1.0 is profitable; 1.5+ is solid; 2+ is excellent.',
        'Expectancy – average $ won or lost per trade: win rate × avg win − loss rate × avg loss.',
        'R-multiple – how far price moved in your favour measured in stop distances: (exit − entry) ÷ (entry − stop), reversed for shorts. +2R = made twice what you risked. Price based, so it is correct for any contract size.',
        'Planned R:R – distance to target ÷ distance to stop.',
        'Max drawdown – largest peak-to-trough fall of the equity curve.',
        'Recovery factor – net profit ÷ max drawdown.',
        'Sharpe (per trade) – average trade P&L ÷ standard deviation of trade P&L. Higher = smoother results.',
        'Green days – % of trading days with a positive net result.',
        'Discipline score – see Analytics.',
        'Cost of a mistake – the sum of losses on trades tagged with it.'],
    ],
  },
  {
    id: 'shortcuts', icon: '⌨️', title: 'Keyboard shortcuts',
    body: [['N – new trade', '1–8 – jump to Overview, Trade Log, Calendar, Mistakes, Analytics, Import & Export, Settings, Help', '? – this help page', 'Esc – close a dialog', 'Enter – save the trade form']],
  },
  {
    id: 'faq', icon: '💬', title: 'FAQ & privacy',
    body: [
      ['Where is my data? Only in this browser’s local storage. Nothing is sent to a server.',
        'Will I lose my data? Clearing browser data or using private browsing removes it. Download a backup regularly.',
        'Can I use it on my phone? Yes – the layout adapts, with a tab bar at the bottom. Use backup/restore to move data between devices.',
        'Why is my futures/forex P&L wrong? Set the point value / multiplier, or enter the broker’s net P&L in the trade form.',
        'Why don’t I see suggestions? You need at least 3 closed trades. Tag mistakes, emotions and plan adherence to get the most out of it.'],
    ],
  },
];

const PAGE_LABELS = { overview: 'Overview', trades: 'Trade Log', calendar: 'Calendar', mistakes: 'Mistakes', analytics: 'Analytics', import: 'Import & Export', settings: 'Settings' };

const flatten = (body) => body.map(b => (Array.isArray(b) ? b.join(' ') : b)).join(' ').toLowerCase();

const Help = () => {
  const { navigate } = useApp();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState('start');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOPICS;
    return TOPICS.filter(t => t.title.toLowerCase().includes(q) || flatten(t.body).includes(q));
  }, [query]);

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Help & Guide" subtitle="How EdgeTrace works, and how to use it to become a consistently profitable trader" />

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray-400" aria-hidden>⌕</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help (e.g. R-multiple, MT5, daily loss limit)…" aria-label="Search help"
          className="w-full pl-8 pr-3 py-2.5 rounded-apple bg-white dark:bg-apple-gray-800 text-apple-gray-900 dark:text-white text-[14px] border border-apple-gray-200 dark:border-apple-gray-700 focus:border-apple-blue placeholder:text-apple-gray-400" />
      </div>

      {results.length === 0 && <p className="text-[13px] text-apple-gray-500">No help topics match “{query}”.</p>}

      <Card>
        <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
          {results.map(t => {
            const expanded = query.trim() ? true : open === t.id;
            return (
              <div key={t.id}>
                <button onClick={() => setOpen(expanded && !query ? null : t.id)} aria-expanded={expanded}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700/30">
                  <span className="text-lg w-6 text-center" aria-hidden>{t.icon}</span>
                  <span className="flex-1 text-[14px] font-semibold text-apple-gray-900 dark:text-white">{t.title}</span>
                  <span className={cx('text-apple-gray-400 text-[12px] transition-transform', expanded && 'rotate-90')} aria-hidden>›</span>
                </button>
                {expanded && (
                  <div className="px-5 pb-5 pl-14 space-y-3 text-[13px] leading-relaxed text-apple-gray-700 dark:text-apple-gray-300">
                    {t.body.map((b, i) => Array.isArray(b) ? (
                      <ul key={i} className="space-y-1.5 list-disc pl-4 marker:text-apple-gray-400">
                        {b.map((li, j) => <li key={j}>{li}</li>)}
                      </ul>
                    ) : <p key={i}>{b}</p>)}
                    {t.page && <button onClick={() => navigate(t.page)} className="text-apple-blue font-medium text-[13px]">Open {PAGE_LABELS[t.page]} ›</button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-[12px] text-apple-gray-500 dark:text-apple-gray-400">Full documentation for developers and power users is in <code>docs/DOCUMENTATION.md</code> in the project repository.</p>
    </div>
  );
};

export default Help;
