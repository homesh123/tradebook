// Single source of truth for EdgeTrace's public, crawlable content pages.
// build-seo-pages.js turns this into static HTML, sitemap.xml and llms(-full).txt.
//
// Writing rules (SEO / AEO / GEO):
// - Every section is a question a trader would actually ask, answered in the first sentence.
// - Use concrete numbers, formulas and worked examples – they are what answer engines quote.
// - Keep facts consistent with the app's calculations (src/utils/analytics.js).

const SITE = {
  name: 'EdgeTrace',
  url: 'https://homesh123.github.io/tradebook/',
  appUrl: 'https://homesh123.github.io/tradebook/#/overview',
  tagline: 'Free trading journal that finds and fixes your trading mistakes',
  description:
    'EdgeTrace is a free, private trading journal for stocks, forex, futures and crypto. Log trades, tag mistakes and emotions, and get analytics that show what each mistake costs you and exactly how to fix it.',
  updated: '2026-10-31',
  author: 'EdgeTrace',
};

const PAGES = [
  {
    slug: 'trading-journal',
    nav: 'Trading Journal',
    title: 'Free Trading Journal App – Find Your Mistakes | EdgeTrace',
    h1: 'A free trading journal that shows what your mistakes cost',
    description:
      'Free online trading journal for stocks, forex, futures and crypto. Tag mistakes and emotions, track risk rules and get a ranked plan to fix them.',
    intro:
      'EdgeTrace is a free trading journal that runs in your browser. You log each trade with the behaviour behind it – setup, mistakes, emotion and whether you followed your plan – and EdgeTrace calculates how much every mistake costs you, spots repeating patterns such as revenge trading or tilt, checks your risk rules and ranks what to fix first.',
    sections: [
      {
        h2: 'What is a trading journal?',
        p: [
          'A trading journal is a record of every trade you take – entry, exit, size, stop loss and result – plus the reasons and emotions behind it. Reviewing it turns individual wins and losses into data, so you can see which setups make money and which habits lose it.',
          'Most traders do not lose because their strategy has no edge; they lose because of execution mistakes: chasing entries, moving stops, oversizing or revenge trading. A journal is the only reliable way to measure those mistakes.',
        ],
      },
      {
        h2: 'Why do traders need a trading journal to become profitable?',
        p: ['Because you cannot fix what you do not measure. A journal shows three things that memory hides:'],
        list: [
          'Which mistakes repeat, and how much money each one has cost you.',
          'Whether your trades without mistakes are profitable – if they are, discipline alone will make you profitable.',
          'When you trade worst: after losses, in certain emotional states, on certain days or hours.',
        ],
      },
      {
        h2: 'What does EdgeTrace do differently from a spreadsheet?',
        p: ['A spreadsheet stores trades; EdgeTrace interprets them. It automatically:'],
        list: [
          'Ranks every mistake by the money it cost and shows whether it is getting more or less frequent.',
          'Draws your equity curve next to a "disciplined" curve – your P&L if you had skipped every trade with a mistake.',
          'Detects tilt: how your win rate and mistake rate change on the trade after a loss.',
          'Scores your discipline from 0 to 100 and tracks it over time.',
          'Checks your own risk rules – max risk per trade, daily loss limit and max trades per day – and flags every break.',
          'Writes a ranked action plan, with a concrete rule for each problem.',
        ],
      },
      {
        h2: 'Which markets and brokers does EdgeTrace support?',
        p: [
          'Any market where you can record an entry, exit and size: stocks, ETFs, options, futures, forex and crypto. Futures and forex are handled with a point-value multiplier (for example ES = 50, NQ = 20, one standard forex lot = 100,000) or by entering the exact net P&L from your broker.',
          'You can import trades from a CSV file or directly from a MetaTrader 4 / MetaTrader 5 account history report, and export everything to CSV or a full JSON backup.',
        ],
      },
      {
        h2: 'Is EdgeTrace free and is my trading data private?',
        p: [
          'Yes. EdgeTrace is free, needs no account and has no server: your trades are stored only in your own browser. Nothing is uploaded. Use the built-in backup to move your journal between devices.',
        ],
      },
      {
        h2: 'How do I start journaling my trades?',
        list: [
          'Open EdgeTrace and set your starting balance and risk rules in Settings.',
          'Log a trade (press N) or import a CSV / MT5 history file.',
          'Tag the setup, any mistakes, your emotion and whether you followed your plan.',
          'Review the Overview daily and Analytics weekly, and fix the top suggestion first.',
        ],
      },
    ],
    faqs: [
      { q: 'What is the best free trading journal?', a: 'The best free trading journal is one you will use after every trade and that turns your data into decisions. EdgeTrace is free, private (data stays in your browser) and focuses on behaviour: it ranks your mistakes by cost, detects tilt and gives you a prioritized fix plan.' },
      { q: 'Do I need to create an account to use EdgeTrace?', a: 'No. EdgeTrace works instantly in the browser with no sign-up. Your data is stored locally on your device.' },
      { q: 'Can I import trades from MetaTrader 5?', a: 'Yes. Export your account history from MT4 or MT5 as CSV and import it. EdgeTrace uses broker profit plus commission and swap as the exact net P&L and skips duplicate tickets.' },
    ],
  },

  {
    slug: 'trading-mistakes',
    nav: 'Trading Mistakes',
    title: 'Common Trading Mistakes and How to Fix Them | EdgeTrace',
    h1: 'Common trading mistakes and exactly how to fix them',
    description:
      'FOMO, revenge trading, moved stops, overtrading, oversizing: the costliest trading mistakes, each with a rule, a fix and a prevention method.',
    intro:
      'The most common trading mistakes are execution errors, not strategy errors: entering late out of FOMO, moving a stop loss, revenge trading after a loss, overtrading and risking too much per trade. Each one can be fixed with a specific rule. Below is every mistake EdgeTrace tracks, with the rule to follow, the action steps and how to prevent it.',
    mistakes: true,
    sections: [
      {
        h2: 'How do I find out which trading mistakes cost me the most?',
        p: [
          'Tag every trade with the mistakes you made – honestly, even small ones – then add up the losses on trades with each tag. That number is the cost of the mistake. EdgeTrace does this automatically and ranks mistakes from most to least expensive, so you always know which habit to fix first.',
        ],
      },
      {
        h2: 'Why do trading mistakes repeat?',
        p: [
          'Mistakes repeat because they are emotional responses to the same triggers – a missed move, a loss, a winning streak. They also chain together: a FOMO entry is often chased, and a chased entry often leads to a moved stop. Tracking which mistakes occur together lets you stop the chain at the first link.',
        ],
      },
      {
        h2: 'What is the fastest way to stop making trading mistakes?',
        list: [
          'Work on one mistake at a time – the one that costs the most.',
          'Turn it into a written rule you can check before every trade.',
          'Use a pre-trade checklist; if any item is unchecked, do not trade.',
          'Review every trade the same day and tag mistakes while memory is fresh.',
          'Measure progress: the mistake should appear less often in your recent trades than in older ones.',
        ],
      },
    ],
    faqs: [
      { q: 'What is the most common trading mistake?', a: 'FOMO (fear of missing out) and the chased entry it causes are among the most common. The fix is to define your entry zone in advance, use limit orders or alerts, and skip the trade if price has already left the zone.' },
      { q: 'What is revenge trading?', a: 'Revenge trading is taking an impulsive trade right after a loss to "win the money back". It usually breaks your plan and position-size rules. Fix it with a mandatory 30–60 minute break after any loss and a hard daily loss limit.' },
      { q: 'Should I ever move my stop loss?', a: 'Never move a stop loss further from your entry. Doing so increases the risk you agreed to and turns small losses into large ones. Trailing a stop toward profit is fine only if it is part of your written plan.' },
    ],
  },

  {
    slug: 'trading-metrics',
    nav: 'Metrics Glossary',
    title: 'Profit Factor, Expectancy & R-Multiple Explained | EdgeTrace',
    h1: 'Trading performance metrics explained, with formulas and examples',
    description:
      'Formulas and worked examples for profit factor, expectancy, R-multiple, win rate, risk:reward, max drawdown and Sharpe ratio.',
    intro:
      'The trading metrics that matter most are expectancy (average profit per trade), profit factor (gross profit ÷ gross loss), R-multiple (result measured in units of risk) and maximum drawdown (largest peak-to-trough fall). Together they tell you whether you have an edge, how big it is and how painful it is to trade.',
    glossary: [
      { term: 'Win rate', def: 'The percentage of closed trades that made money.', formula: 'Win rate = winning trades ÷ closed trades × 100', example: '17 winners out of 30 trades = 56.7% win rate. A high win rate alone does not mean profitability – it depends on how big wins are compared with losses.' },
      { term: 'Profit factor', def: 'Gross profit divided by gross loss. Above 1.0 is profitable; 1.5 is solid; 2.0 or more is excellent.', formula: 'Profit factor = sum of winning trades ÷ |sum of losing trades|', example: '$3,000 of wins and $1,500 of losses gives a profit factor of 2.0.' },
      { term: 'Expectancy', def: 'The average amount you can expect to win or lose per trade. Positive expectancy means you have an edge.', formula: 'Expectancy = (win rate × average win) − (loss rate × average loss)', example: '55% × $165 − 45% × $61 = $63.30 per trade.' },
      { term: 'R-multiple', def: 'The result of a trade measured in units of the risk you planned (R). +2R means you made twice what you risked; −1R is a full planned loss.', formula: 'R = (exit − entry) ÷ (entry − stop loss), reversed for short trades', example: 'Long at 100, stop 98 (risk 2), exit 106: R = 6 ÷ 2 = +3R. A loss bigger than −1R means the stop was moved, ignored or slipped.' },
      { term: 'Risk:reward ratio (planned R:R)', def: 'Distance to your target compared with distance to your stop, decided before entry.', formula: 'R:R = |target − entry| ÷ |entry − stop|', example: 'Entry 50, stop 49, target 53 = 1:3. With 1:3 you are profitable even at a 30% win rate.' },
      { term: 'Average win / average loss', def: 'How large winning trades are relative to losing trades.', formula: 'Payoff ratio = average win ÷ average loss', example: '$165 average win ÷ $61 average loss = 2.7×.' },
      { term: 'Maximum drawdown', def: 'The largest drop of your equity from a peak to a later low. It measures how painful your strategy is to trade.', formula: 'Max drawdown = max(peak equity − subsequent equity)', example: 'Equity rises to $12,000, falls to $10,800, then recovers: drawdown = $1,200 (10%).' },
      { term: 'Recovery factor', def: 'Net profit relative to the worst drawdown. Higher means profits comfortably outweigh the pain.', formula: 'Recovery factor = net profit ÷ max drawdown', example: '$6,000 net profit with a $1,500 max drawdown = 4.0.' },
      { term: 'Sharpe ratio (per trade)', def: 'Average trade result divided by the variability of results. Higher means smoother, more consistent returns.', formula: 'Sharpe = mean trade P&L ÷ standard deviation of trade P&L', example: 'Mean $67, standard deviation $150 → 0.45.' },
      { term: 'Green-day percentage', def: 'The share of trading days that ended with a net profit – a measure of consistency.', formula: 'Green days = profitable days ÷ trading days × 100', example: '17 green days out of 30 = 57%.' },
      { term: 'Position size', def: 'How many shares, contracts or lots to trade so that hitting your stop loses exactly your planned risk.', formula: 'Size = (account × risk %) ÷ (stop distance × point value)', example: '$10,000 account, 1% risk ($100), stop $2 away on a stock: 50 shares.' },
      { term: 'Discipline score', def: 'EdgeTrace’s 0–100 measure of how consistently you follow your process: 60% share of mistake-free trades plus 40% plan adherence.', formula: 'Score = (clean-trade share × 0.6 + plan-followed share × 0.4) × 100', example: '16 of 30 clean trades and plan followed on 16 of 30 → 53 ("inconsistent").' },
    ],
    sections: [
      {
        h2: 'Which trading metric matters most?',
        p: [
          'Expectancy matters most, because it combines win rate and the size of wins and losses into one number: the average profit per trade. A strategy with positive expectancy makes money over enough trades; negative expectancy loses money no matter how often it wins.',
        ],
      },
      {
        h2: 'Is a high win rate good in trading?',
        p: [
          'Not by itself. A 90% win rate with tiny wins and occasional huge losses loses money, while a 35% win rate with 1:3 risk:reward is profitable. Always read win rate together with average win ÷ average loss, or simply look at expectancy and profit factor.',
        ],
      },
    ],
    faqs: [
      { q: 'What is a good profit factor in trading?', a: 'A profit factor above 1.0 means a strategy is profitable. Around 1.5 is solid, 2.0 or more is excellent, and anything consistently above 3 over many trades is exceptional and worth checking for overfitting or small sample size.' },
      { q: 'How do you calculate expectancy in trading?', a: 'Expectancy = (win rate × average win) − (loss rate × average loss). For example, with a 55% win rate, $165 average win and $61 average loss: 0.55 × 165 − 0.45 × 61 = $63.30 expected per trade.' },
      { q: 'What does R-multiple mean?', a: 'R-multiple expresses a trade’s result in units of the risk you planned. If you risk $100 and make $300, that trade is +3R. Measuring in R lets you compare trades of different sizes and spot losses that exceeded your plan.' },
    ],
  },

  {
    slug: 'risk-management',
    nav: 'Risk Management',
    title: 'Position Sizing, the 1% Rule & Daily Loss Limits | EdgeTrace',
    h1: 'Trading risk management rules that keep you in the game',
    description:
      'How to size positions, apply the 1% risk rule and set a daily loss limit, with formulas and examples for stocks, futures and forex.',
    intro:
      'Good risk management means deciding before every trade how much you can lose, sizing the position so a stop-out costs exactly that amount, and stopping for the day when a pre-set loss limit is reached. Most professional traders risk 0.5%–2% of their account per trade.',
    sections: [
      {
        h2: 'How much should I risk per trade?',
        p: [
          'Most professional traders risk between 0.5% and 2% of their account on a single trade; 1% is the most common rule. At 1% risk, ten losses in a row cost about 10% of the account – painful but survivable. At 10% risk, the same streak would cost about 65%.',
        ],
      },
      {
        h2: 'How do I calculate position size?',
        p: ['Position size = (account balance × risk %) ÷ (stop distance × point value).'],
        list: [
          'Stocks: $20,000 account, 1% risk = $200. Entry $50, stop $48 (distance $2). Size = 200 ÷ 2 = 100 shares.',
          'Futures (ES, $50 per point): $50,000 account, 1% = $500. Stop 5 points away = $250 per contract. Size = 2 contracts.',
          'Forex (EUR/USD, $10 per pip per standard lot): $10,000 account, 1% = $100. Stop 20 pips = $200 per lot. Size = 0.5 lots.',
        ],
      },
      {
        h2: 'What is a daily loss limit and why use one?',
        p: [
          'A daily loss limit is the maximum you allow yourself to lose in one day; when you reach it, you stop trading until tomorrow. It protects you from tilt – the spiral of emotional trades after losses – which is where most account-destroying days come from. A common starting point is 2–3× your per-trade risk.',
        ],
      },
      {
        h2: 'Why limit the number of trades per day?',
        p: [
          'A maximum number of trades per day stops overtrading: forcing low-quality setups out of boredom or to recover losses. Pick a number that matches how many A+ setups your strategy realistically produces in a session, typically 2–5 for day traders.',
        ],
      },
      {
        h2: 'How does EdgeTrace enforce risk rules?',
        list: [
          'The trade form shows risk in $ and as % of your account as you type, and warns when it exceeds your max risk.',
          'The Overview tracks today’s trades and loss against your limits and shows a "Stop trading for today" banner when one is hit.',
          'Analytics counts every day you broke the loss limit or max trades, every oversized trade and every trade without a stop.',
        ],
      },
    ],
    faqs: [
      { q: 'What is the 1% rule in trading?', a: 'The 1% rule means never risking more than 1% of your account on a single trade. With a $10,000 account the maximum loss per trade is $100, and position size is chosen so that hitting the stop loss costs exactly that.' },
      { q: 'What is a good daily loss limit?', a: 'A common daily loss limit is 2–3 times your per-trade risk, for example 2–3% of the account if you risk 1% per trade. The exact number matters less than stopping every single time you reach it.' },
      { q: 'Should every trade have a stop loss?', a: 'Yes. Without a stop loss you cannot size the position, measure R-multiples or cap the loss. Decide the stop before entry and place it as a real order.' },
    ],
  },

  {
    slug: 'trading-psychology',
    nav: 'Trading Psychology',
    title: 'Trading Psychology: Tilt, FOMO & Revenge Trading | EdgeTrace',
    h1: 'Trading psychology: measure your emotions instead of fighting them',
    description:
      'How fear, greed, FOMO and frustration hurt results, how to spot tilt and revenge trading in your own data, and how to build measurable discipline.',
    intro:
      'Trading psychology is how your emotional state changes your decisions. The practical way to improve it is to measure it: record how you felt on every trade, then compare results by emotion, and compare the trade after a loss with the trade after a win. The data usually shows a clear pattern you can build rules around.',
    sections: [
      {
        h2: 'How do emotions affect trading performance?',
        p: [
          'Calm, patient and focused states tend to produce planned trades; anxious, greedy, frustrated or angry states produce impulsive ones – chased entries, oversized positions and moved stops. When traders tag emotions consistently, trades taken while angry or greedy almost always have a negative average result.',
        ],
      },
      {
        h2: 'What is tilt in trading and how do I detect it?',
        p: [
          'Tilt is a state where losses trigger emotional, rule-breaking trades. You can detect it in a journal by comparing the trade right after a loss with the trade right after a win: if win rate drops or the share of trades with mistakes rises after losses, you trade on tilt. EdgeTrace calculates this automatically under Behaviour Patterns.',
        ],
      },
      {
        h2: 'How can I become a more disciplined trader?',
        list: [
          'Write your plan before the session: setups, max risk, daily loss limit, max trades.',
          'Rate your emotional state before trading; trade smaller or not at all when it is poor.',
          'Use a mandatory break after every loss.',
          'Grade execution (A+ to D) separately from outcome – a well-executed losing trade is a good trade.',
          'Track a discipline score over time and aim for 80%+ mistake-free trades.',
        ],
      },
      {
        h2: 'What is the "discipline gap"?',
        p: [
          'The discipline gap is the difference between your actual P&L and the P&L you would have made by skipping every trade where you made a mistake. When it is large, your strategy already works – the fastest path to profitability is following it, not finding a new one.',
        ],
      },
    ],
    faqs: [
      { q: 'How do I stop revenge trading?', a: 'Make a rule that you take a 30–60 minute break after any losing trade and stop for the day at a fixed daily loss limit. Track the trade after each loss in your journal so you can see whether the rule is working.' },
      { q: 'How do I deal with FOMO in trading?', a: 'Define entry zones before the session and set alerts instead of watching every tick. If price leaves your zone, the trade is gone – there will always be another setup. Tag FOMO trades to see what they really cost.' },
      { q: 'Does journaling emotions really help trading?', a: 'Yes, because it turns vague feelings into data. Once you can see that, for example, trades taken while frustrated lose $60 on average, it becomes much easier to follow a rule to sit out in that state.' },
    ],
  },

  {
    slug: 'guide',
    nav: 'How-to Guide',
    title: 'How to Use a Trading Journal: Step-by-Step Guide | EdgeTrace',
    h1: 'How to use a trading journal: step-by-step guide',
    description:
      'Step-by-step: set risk rules, log or import trades (CSV, MT4/MT5), tag mistakes and emotions, and run a daily and weekly review routine.',
    intro:
      'To use a trading journal well: set your risk rules, log every trade right after entry, tag mistakes and emotions right after exit, review daily against your limits, and review weekly to choose one mistake to fix. This guide shows each step in EdgeTrace.',
    howto: [
      { name: 'Set your account and risk rules', text: 'Open Settings and enter your starting balance, maximum risk per trade (for example 1%), daily loss limit and maximum trades per day.' },
      { name: 'Log or import your trades', text: 'Press N or click New Trade to log a trade, or import a CSV file or MT4/MT5 account history from Import & Export. Leave the exit empty while a trade is open.' },
      { name: 'Tag the behaviour behind each trade', text: 'After the exit, tag the setup, any mistakes, your emotion, whether you followed your plan and an execution grade, and write one lesson.' },
      { name: 'Check your guardrails daily', text: 'Before and during the session, check the Overview for today’s P&L, trades taken and loss limit. Stop when the "Stop trading for today" banner appears.' },
      { name: 'Review weekly and fix one thing', text: 'Open Analytics, read the Coach’s Action Plan and the Mistakes Over Time chart, and pick the top mistake as your focus for the next 20 trades.' },
    ],
    sections: [
      {
        h2: 'What should I record for every trade?',
        list: [
          'Symbol, date, entry time, side (long/short), entry, exit, quantity and fees.',
          'Stop loss and take profit – required for risk, R-multiple and planned risk:reward.',
          'Point value for futures/forex, or the broker’s net P&L.',
          'Setup, mistakes, emotion, whether you followed your plan and an execution grade.',
          'A short note: why you took it and what you would do differently.',
        ],
      },
      {
        h2: 'How do I import trades from MT4 or MT5?',
        p: [
          'In MetaTrader, open the account history, right-click and save it as a report, then export or copy it as CSV with the columns Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Time, Price, Commission, Swap and Profit. In EdgeTrace, open Import & Export and drop the file. Duplicate tickets are skipped, so you can re-import a growing history safely.',
        ],
      },
      {
        h2: 'What CSV format does EdgeTrace accept?',
        p: [
          'Columns (any order): date, time, pair or symbol, side, quantity, multiplier, entry, exit, stopLoss, takeProfit, fees, netPnl, grade, notes, tags, mistakes, emotions, followedPlan, screenshot. Separate multiple tags or mistakes with a vertical bar (|). A ready-made template can be downloaded in the app.',
        ],
      },
      {
        h2: 'How often should I review my trading journal?',
        p: [
          'Briefly after every trade (to tag it honestly), at the end of each day (to check rules and write one lesson) and in depth once a week (to choose the next mistake to fix and confirm the previous one is fading).',
        ],
      },
    ],
    faqs: [
      { q: 'How long does it take to journal a trade?', a: 'About 30–60 seconds with EdgeTrace: most fields are taps on predefined chips, and the risk, R:R and P&L are calculated for you.' },
      { q: 'Can I use EdgeTrace on my phone?', a: 'Yes. The layout adapts to phones with a bottom tab bar. Because data is stored per browser, use Backup and Restore to move your journal between desktop and phone.' },
    ],
  },

  {
    slug: 'faq',
    nav: 'FAQ',
    title: 'EdgeTrace Trading Journal FAQ | EdgeTrace',
    h1: 'Frequently asked questions',
    description:
      'Answers about EdgeTrace: cost, privacy, supported markets, MT5 and CSV import, how P&L and R-multiples are calculated, backups and mobile use.',
    intro: 'Quick answers about using EdgeTrace, how it calculates your statistics and how your data is stored.',
    sections: [],
    faqs: [
      { q: 'Is EdgeTrace free?', a: 'Yes. EdgeTrace is completely free and requires no account.' },
      { q: 'Where is my trading data stored?', a: 'Only in your own browser’s local storage. EdgeTrace has no server and never uploads your trades. Clearing browser data deletes them, so download a backup regularly.' },
      { q: 'Which markets can I journal?', a: 'Stocks, ETFs, options, futures, forex and crypto – anything with an entry, exit and size. Use the point-value multiplier for futures and forex, or enter the broker’s net P&L.' },
      { q: 'How is P&L calculated?', a: 'P&L = (exit − entry) × quantity × multiplier − fees, reversed for short trades. If you enter the broker’s net P&L, that exact value is used instead.' },
      { q: 'How is the R-multiple calculated?', a: 'R = (exit − entry) ÷ (entry − stop loss), reversed for shorts. It is price based, so it stays correct for any contract size.' },
      { q: 'Can I import from MetaTrader 4 or 5?', a: 'Yes. Import an MT4/MT5 history CSV; broker profit plus commission and swap is used as net P&L and duplicate tickets are skipped.' },
      { q: 'Can I export my data?', a: 'Yes – as CSV for spreadsheets, or as a JSON backup that includes trades, settings and custom tags and can be restored on another device.' },
      { q: 'What is the discipline score?', a: 'A 0–100 score combining the share of mistake-free trades (60%) and plan adherence (40%). 75+ is disciplined, 50–74 inconsistent, below 50 undisciplined.' },
      { q: 'Why don’t I see suggestions yet?', a: 'You need at least three closed trades. Suggestions improve as you tag mistakes, emotions and plan adherence consistently.' },
      { q: 'Does EdgeTrace work offline?', a: 'Once loaded, the app runs in your browser and stores data locally, so journaling does not depend on a server.' },
    ],
  },
];

module.exports = { SITE, PAGES };
