# EdgeTrace – Trading Journal & Behaviour Analytics

EdgeTrace is a browser-based trading journal built to answer one question:
**"What am I doing wrong, what does it cost me, and how do I fix it?"**

It records every trade together with the *behaviour* behind it (setups, mistakes, emotions,
plan adherence, execution grade), checks it against your own risk rules, and turns the
result into charts and a ranked action plan.

- Live app: `https://homesh123.github.io/tradebook/`
- Source: `tradebook/` (React + Tailwind, Create React App)
- In-app help: **Help & Guide** page (press `?`)

---

## 1. Quick start (traders)

1. **Settings** → enter starting balance, max risk per trade (%), daily loss limit ($), max trades per day.
2. **+ New Trade** (or press `N`) to log a trade, or **Import & Export** to import a CSV / MT5 report.
3. Tag each trade honestly: setup, mistakes, emotion, followed plan, execution grade.
4. Check **Overview** every session, **Analytics** every week. Fix the #1 suggestion first.

Want to explore first? Click **Load demo data** on the Overview (30 trades with realistic mistakes).

### Recommended routine

| When | What |
|---|---|
| Before the session | Overview → "What to work on" + Today's guardrails. Pick one rule to focus on. |
| On entry | Log the trade with no exit (shows as OPEN). The live preview shows $ risk, % of account and R:R. |
| On exit | Open the trade, add the exit, tag mistakes/emotion/plan/grade, write the lesson. |
| Limit hit | Overview shows **Stop trading for today**. Stop. |
| Weekly | Analytics → Coach's Action Plan, Mistakes Over Time, Discipline Trend. |

---

## 2. Features by page

### Overview
- Account balance (starting balance + net P&L), all-time return %, equity sparkline.
- **Today**: P&L, trades taken vs max, % of daily loss limit used; red "Stop trading" banner when a limit is reached.
- Discipline score, cost of mistakes, average R, max drawdown (% of account).
- Top 3 coaching suggestions, biggest leak, recent trades, open positions (click to close).
- First-run welcome checklist and demo-data loader.

### Trade Log
- Search across symbol, notes, setup, mistakes, strategy, emotion.
- Segments: All / Winners / Losers / Open / Mistakes. Filters: side, setup, mistake, date range. Sort: date, P&L, R.
- Live summary of the current selection (count, net P&L, win rate).
- Click any row to edit or close the trade; delete with confirmation and **Undo**.
- Responsive list on mobile; loads 50 rows at a time.

### Trade form (add / edit)
| Field | Notes |
|---|---|
| Symbol, date, entry time | Time is optional; enables "P&L by entry hour". |
| Side | Long / Short. |
| Entry, exit, quantity | Leave exit empty for open trades. |
| Stop loss, take profit | Validated to be on the correct side of entry. Required for risk & R. |
| Fees | Subtracted from P&L. |
| Point value / multiplier | Futures & forex: ES 50, NQ 20, MES 5, CL 1000, 1 forex lot 100,000. |
| Net P&L from broker | Optional exact P&L; overrides the calculation. |
| Chart / screenshot link | e.g. TradingView snapshot URL. |
| Setup, mistakes, emotion | Pick or type your own (Enter). Custom values are remembered. |
| Followed plan, execution grade | Yes/No/Not sure; A+ – D. |
| Notes | Thesis and lessons. |

The **live preview** shows risk in $ and % of account, planned R:R, P&L and R, and warns when
the trade exceeds your max-risk rule.

### Calendar
- Monday-first month grid, colour intensity scaled to the size of the day's P&L, weekly totals column.
- Month P&L, green days, best and worst day.
- Click a day → its trades, mistakes, notes; add a trade on that date. Days that hit the daily loss limit are flagged.
- Opens on the latest month that has trades.

### Mistakes
- Every tagged mistake ranked by cost (sum of losses on trades with that mistake), with impact level
  (Critical > $500, High > $200, Medium > $50) and a REPEATING badge at 3+ occurrences.
- Expand for affected trades (clickable) and a fix plan: rule, action steps, prevention.

### Analytics
Period filter (All / Last 50 / Last 20) and Charts/Tables toggle.

| Section | What it shows |
|---|---|
| Discipline score | 60% × share of mistake-free trades + 40% × plan adherence (0–100). |
| KPI tiles | P&L, win rate, profit factor, expectancy, avg win/loss, avg R, max drawdown, streaks, green days, largest win/loss, per-trade Sharpe. |
| Coach's Action Plan | Ranked suggestions (Critical → Tip) with a concrete "Do this". |
| Equity: actual vs disciplined | Dashed line = P&L had every mistake trade been skipped. |
| Mistake cost / frequency | Money lost per mistake; share of occurrences. |
| Mistakes over time | Stacked count per week (or month for long journals). |
| Discipline trend | Rolling % of clean trades over the last 5 trades. |
| Emotion vs results | Avg P&L per emotion. |
| Behaviour patterns | Clean vs mistake, plan followed vs broken, after a win vs after a loss. |
| Day of week / entry hour | When you trade best and worst. |
| R-multiple distribution | Losses beyond −1R = stop not respected. |
| Risk rule breaks | Loss-limit days, overtrading days, oversized trades, trades without a stop. |
| Daily P&L | Net result per day. |
| Mistake breakdown, chains, setups | Fix plan per mistake, mistakes that occur together, setup table with mistake rate. |

### Import & Export
- **CSV import** (drag & drop, file picker or paste) with a preview and duplicate detection by id.
- **MT4/MT5** history reports: broker profit + commission + swap is stored as exact net P&L; balance rows skipped.
- **CSV template**, **CSV export**, **JSON backup / restore** (trades + settings + custom lists), demo data, delete all.

### Settings
Account balance, max risk %, daily loss limit, max trades/day, custom lists, theme, keyboard shortcuts, privacy notes.

### Help & Guide
Searchable in-app help covering every page, a metrics glossary, shortcuts and FAQ.

---

## 3. Calculations

| Metric | Formula |
|---|---|
| P&L | `(exit − entry) × qty × multiplier − fees` (sign reversed for shorts), or `netPnl` if entered |
| Risk ($) | `|entry − stop| × qty × multiplier` |
| R-multiple | `(exit − entry) / |entry − stop|`, signed for direction (price based, fees excluded) |
| Planned R:R | `|target − entry| / |entry − stop|` |
| Win rate | wins ÷ closed trades |
| Profit factor | gross profit ÷ gross loss |
| Expectancy | `winRate × avgWin − lossRate × avgLoss` |
| Max drawdown | largest peak-to-trough drop of cumulative P&L |
| Recovery factor | net profit ÷ max drawdown |
| Sharpe (per trade) | mean trade P&L ÷ std-dev of trade P&L |
| Mistake cost | sum of losses on trades tagged with the mistake |
| Discipline score | `round((cleanShare × 0.6 + planShare × 0.4) × 100)` |
| Mistake trend | frequency in the newer half of the journal vs the older half (±25%) |
| Oversized trade | risk > max risk % × balance at the time (10% tolerance) |

---

## 4. Data & privacy

- No backend. Data lives in the browser's `localStorage`:
  - `tradebook_trades_v1` – array of trades
  - `tradebook_settings_v1` – settings and custom lists
  - `tradebook_theme` – `dark` / `light`
- Clearing site data deletes the journal → use **Download backup** regularly.

### Trade object

```json
{
  "id": "string", "date": "YYYY-MM-DD", "time": "HH:MM",
  "pair": "ES", "side": "long|short", "strategy": "string",
  "quantity": 2, "multiplier": 50, "entry": 5000, "exit": 5010,
  "stopLoss": 4990, "takeProfit": 5030, "fees": 4.2, "netPnl": null,
  "grade": "A", "notes": "string", "tags": ["Breakout"], "mistakes": ["FOMO"],
  "emotions": "Calm", "followedPlan": true, "screenshot": "url",
  "createdAt": "ISO", "updatedAt": "ISO"
}
```

### CSV columns
`id, date, time, pair, side, strategy, quantity, multiplier, entry, exit, stopLoss, takeProfit, fees, netPnl, grade, notes, tags, mistakes, emotions, followedPlan, screenshot`
— multiple tags/mistakes separated by `|`; `followedPlan` = `yes` / `no`. Aliases accepted:
`symbol`, `ticker`, `qty`, `size`, `sl`, `tp`, `commission`, `pnl`, `emotion`.

---

## 5. SEO, AEO and GEO

EdgeTrace is a JavaScript app with hash routes, which search engines and AI answer engines index
poorly. The public, crawlable layer is generated from one content file:

| File | Purpose |
|---|---|
| `tradebook/scripts/seo-content.js` | **Edit this** – site facts and every guide page (questions, answers, FAQs, glossary, how-to steps). |
| `tradebook/scripts/build-seo-pages.js` | Generator – runs automatically before every build (`prebuild`), or with `npm run seo`. |
| `public/<slug>/index.html` | Static guide pages: trading-journal, trading-mistakes, trading-metrics, risk-management, trading-psychology, guide, faq. |
| `public/index.html` | Homepage metadata, Open Graph/Twitter cards, JSON-LD and prerendered content between `<!--seo-…:start/end-->` markers. |
| `public/sitemap.xml` | All indexable URLs. |
| `public/robots.txt` | Allows all crawlers, explicitly including AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended). |
| `public/llms.txt`, `public/llms-full.txt` | Summary and full-text Markdown for AI engines (llms.txt convention). |
| `public/og-image.png` | 1200×630 social share image. |
| `public/404.html` | Helpful not-found page (noindex). |

What each layer does:
- **SEO** – unique titles (≤ 60 chars) and descriptions (≤ 155), canonical URLs, sitemap, internal linking, breadcrumbs,
  one H1 per page, crawlable homepage content for non-JS crawlers, `max-snippet:-1` / `max-image-preview:large`.
- **AEO (answer engines, featured snippets)** – each section is a real question answered in its first sentence,
  a "Short answer" box at the top, and `FAQPage`, `HowTo`, `DefinedTermSet` and `ItemList` structured data.
- **GEO (generative engines)** – concrete formulas and worked examples that are easy to quote, consistent entity
  facts (`WebApplication`, `Organization`), `llms.txt` / `llms-full.txt`, and AI crawlers allowed in robots.txt.

When content changes, bump `SITE.updated` in `seo-content.js` so `dateModified` and the sitemap stay accurate.

### Off-site steps that need the owner
These cannot be done from the code and have the biggest remaining impact:
1. Add the site to **Google Search Console** and **Bing Webmaster Tools** and submit `sitemap.xml`
   (Bing also feeds ChatGPT search and Copilot).
2. Consider a **custom domain** (e.g. `edgetrace.app`) – a `github.io/project` sub-path gives limited domain authority.
   Update `SITE.url` and the URLs in `public/index.html`, `robots.txt` and `404.html` if you do.
3. Earn mentions and links: list EdgeTrace on Product Hunt, AlternativeTo, trading subreddits/forums and
   "best trading journal" roundups – AI engines lean heavily on third-party mentions.
4. Validate with Google's Rich Results Test and the Schema.org validator after deploying.

---

## 6. Developer guide

```bash
cd tradebook
npm install
npm start          # dev server at http://localhost:3000/tradebook
npm run build      # production build in tradebook/build
npm run deploy     # build + copy into the repository root (served by GitHub Pages)
```

Deployment: GitHub Pages serves the **root of the `gh-pages` branch** at `/tradebook/`.
`npm run deploy` runs `scripts/publish.js`, which copies `build/` over the root
`index.html`, `static/`, etc. Commit and push to `gh-pages` to publish.

### Structure

```
tradebook/src
├── App.js                    # shell: sidebar, mobile tab bar, hash routing (#/page), shortcuts
├── context/
│   ├── TradeContext.js       # trades CRUD, import with de-dupe, undo restore, persistence
│   ├── SettingsContext.js    # account & risk rules, custom lists
│   ├── ThemeContext.js       # light / dark
│   └── AppContext.js         # navigate(page), openTradeForm(trade?, defaults?)
├── components/
│   ├── ui.js                 # Card, Stat, Button, Segmented, Field, Chip, Sheet, toasts, confirm
│   ├── Overview.js  TradeLog.js  TradeForm.js  CalendarView.js
│   ├── MistakesInsights.js  AnalyticsDashboard.js
│   └── ImportExport.js  Settings.js  Help.js
└── utils/
    ├── analytics.js          # P&L model, core stats, standard tag/mistake/emotion lists
    ├── advancedAnalytics.js  # Sharpe, recovery, streaks, consistency
    ├── behaviorAnalytics.js  # mistakes, emotions, tilt, timelines, suggestions, buildInsights()
    ├── rules.js              # risk-rule violations, today's guardrails, hour stats
    ├── mistakeAdvice.js      # rule / fix / prevention per mistake
    ├── storage.js            # localStorage, CSV & MT5 import/export, JSON backup
    └── sampleDataFull.js     # demo trades
```

### Design system
Apple Human Interface–inspired: SF system font stack, 12px card radius, hairline borders,
segmented controls, bottom sheets on mobile, tab bar navigation on phones, toasts with Undo,
confirmation sheets for destructive actions, focus moved into dialogs and restored on close,
`Esc` to dismiss, keyboard shortcuts, `tabular-nums` for figures, colour never the only signal
(▲/▼, +/−, labels). Charts use Chart.js with theme-aware colours and a validated
colour-blind-safe categorical palette.
