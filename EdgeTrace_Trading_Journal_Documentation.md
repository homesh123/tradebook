# EdgeTrace - Trading Journal & Analytics Platform

## Project Overview

EdgeTrace is a comprehensive trading journal and analytics web application designed specifically for traders who want to track their trading history, analyze performance, identify costly mistakes, and systematically improve their edge. The app focuses on behavioral improvement by helping traders fix their biggest leaks one at a time rather than chasing vanity metrics.

**Live Application:** [https://homesh123.github.io/tradebook/](https://homesh123.github.io/tradebook/)  
**Repository:** [https://github.com/homesh123/tradebook](https://github.com/homesh123/tradebook)

## Requirements & Discussion Summary

### Initial Requirement
"I am a trader, I want best trading journal and history management app which can give me analytics, what mistakes I am doing in trading and what trades are going well"

### Key Requirements Identified
- Best-in-class trading journal with comprehensive history management
- Analytics dashboard showing performance metrics
- Mistake identification and tracking system
- Clear insights on winning vs losing trades
- Actionable advice on what to improve
- Easy data import/export for portability
- Mobile-responsive design
- Focus on fixing mistakes to improve trading

### Technology Preferences
- Can use PyScript and Node.js if backend needed
- Deploy as GitHub Pages
- Use Apple UX standard / "best UI UX pro max" design approach
- Light and dark theme support
- Mobile responsive
- Test with sample MT5 data

## Features Implemented

### 1. Trade Logging & History Management
- **Trade Entry Form**: Comprehensive form to log trades with all relevant details
- **Trade Log Table**: Filterable and searchable list of all trades
- **Quick Filters**: View All, Open, Closed, Winners, or Losers
- **Search Functionality**: Search by symbol/pair or notes
- **Trade Details Tracked**:
  - Date, Symbol/Pair, Side (Long/Short)
  - Quantity, Entry Price, Exit Price
  - Stop Loss, Take Profit
  - Fees/Commissions
  - Strategy/Playbook
  - Tags/Setups
  - Mistakes Made
  - Emotions
  - Plan Adherence (Yes/No/Not Specified)
  - Notes/Trade Thesis

### 2. Analytics Dashboard
- **Core Performance Metrics**:
  - Total P&L
  - Win Rate (with W/L breakdown)
  - Profit Factor
  - Expectancy per trade
  - Average R-Multiple
- **Risk Metrics**:
  - Max Drawdown
  - Largest Win
  - Largest Loss
- **Visualizations**:
  - Equity Curve (cumulative P&L over time)
- **Setup Performance Analysis**:
  - Performance breakdown by strategy/tag
  - Trades count, win rate, P&L, profit factor per setup
  - Identifies which setups have an edge
- **Biggest Leaks Section**: Quick overview of most costly mistakes

### 3. Mistake Tracking & Pattern Analysis
- **Predefined Mistake Categories**:
  - FOMO
  - Chased Entry
  - Moved Stop
  - Revenge Trade
  - Overtrading
  - Ignored Plan
  - Early Entry
  - Late Exit
  - Poor Risk Management
  - Emotional
- **Pattern Detection**:
  - Identifies repeating mistakes (2+, 3+ occurrences flagged as "REPEATING")
  - Calculates frequency and total cost per mistake
  - Shows impact level (Critical/High/Medium/Low)
- **Affected Trades View**: Lists all trades where each mistake occurred with P&L
- **Actionable Solutions**:
  - **Rule to Follow**: Clear rule to prevent the mistake
  - **Action Steps**: Specific actions to take
  - **Prevention Method**: Long-term prevention strategy
- **Priority System**: Ranked by total cost to focus on biggest leaks first
- **Weekly Focus Goal**: Automatically suggests focusing on #1 mistake for next 10 trades

### 4. Calendar View
- Monthly heatmap displaying daily P&L
- Color-coded: Green (profitable), Red (losing), Gray (no trades/breakeven)
- Month navigation
- Quick visual pattern recognition

### 5. Data Import/Export
- **CSV Export**: Download all trades with complete details
- **CSV Import**: Import from standard format or MT5 history
- **MT5 Support**: Auto-detects MT5 format (Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Time, Commission, Swap, Profit)
- **Demo Data Loader**: 
  - Quick load (7 trades)
  - Full demo load (30 trades with varied results and repeated mistakes)
- **Local Storage**: All data persists in browser, privacy-first

### 6. UI/UX Design
- **Apple Human Interface Guidelines** inspired design
- **Theme Support**: Light and dark mode (dark mode default)
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Mobile Navigation**: Hamburger menu for mobile devices
- **Micro-interactions**: Smooth transitions and hover states
- **Accessibility**: Focus states, reduced motion support
- **Clean Typography**: SF Pro Display/Text fonts
- **Card-based Layout**: Modern, clean information hierarchy

## Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| React | Frontend framework | 18.2.0 |
| Tailwind CSS | Styling | 3.3.5 |
| Chart.js | Data visualization | 4.4.0 |
| react-chartjs-2 | React wrapper for Chart.js | 5.2.0 |
| Create React App | Build tooling | 5.0.1 |
| gh-pages | GitHub Pages deployment | 6.1.0 |

## Architecture

### Component Structure
```
src/
├── components/
│   ├── AnalyticsDashboard.js  # Performance metrics, charts, setup analysis
│   ├── CalendarView.js       # Monthly P&L heatmap
│   ├── ImportExport.js       # CSV import/export functionality
│   ├── MistakesInsights.js   # Pattern detection & improvement guidance
│   ├── Overview.js           # Main dashboard with key metrics
│   ├── SampleDataLoader.js   # Demo data loading
│   ├── TradeForm.js          # Trade entry modal
│   └── TradeLog.js           # Trade history table/cards
├── context/
│   ├── ThemeContext.js       # Theme state management
│   └── TradeContext.js       # Trade data state management
└── utils/
    ├── analytics.js          # Metric calculations
    ├── sampleData.js         # Quick sample dataset
    ├── sampleDataFull.js     # Comprehensive 30-trade dataset
    └── storage.js            # localStorage & CSV parsing
```

### Key Calculations

**Trade-Level Metrics:**
- PnL (Long): `(Exit - Entry) * Quantity - Fees`
- PnL (Short): `(Entry - Exit) * Quantity - Fees`
- Risk: `|Entry - StopLoss| * Quantity` (or `|StopLoss - Entry| * Quantity` for short)
- R-Multiple: `PnL / Risk`

**Portfolio Metrics:**
- Win Rate: `(Winning Trades / Closed Trades) * 100`
- Profit Factor: `Total Gross Profit / |Total Gross Loss|`
- Expectancy: `(WinRate * AvgWin) - ((1-WinRate) * AvgLoss)`
- Max Drawdown: Peak-to-trough decline in cumulative P&L

## Demo Data

### Files Created
1. **EdgeTrace_Demo_Data_Full.csv** (`/workspace/app/EdgeTrace_Demo_Data_Full.csv`)
   - Standard format with all fields
   - 30 trades across Jan-Feb 2024
   - Mix of winning/losing trades
   - Multiple repeated mistakes for testing

2. **EdgeTrace_MT5_Demo_Data.csv** (`/workspace/app/EdgeTrace_MT5_Demo_Data.csv`)
   - MT5 history export format
   - 30 trades with realistic MT5 structure
   - Compatible with built-in importer

### Sample Data in App
- Quick Load: 7 trades for fast preview
- Full Demo: 30 trades with comprehensive mistake patterns

## Development Timeline

1. **Exploration**: Reviewed existing React app structure
2. **Core Development**: Built trade management, analytics engine, storage layer
3. **Analytics**: Implemented all metrics, charts, and calculations
4. **Mistake System**: Created pattern detection and improvement guidance
5. **UI/UX**: Applied Apple design system, themes, responsiveness
6. **Data Import**: Added CSV and MT5 import support
7. **Testing**: Tested with MT5 sample data, verified all features
8. **Deployment**: Built and deployed to GitHub Pages
9. **Documentation**: Created comprehensive docs

## Usage Instructions

### For End Users
1. Visit [https://homesh123.github.io/tradebook/](https://homesh123.github.io/tradebook/)
2. Click "Load Full Demo (30 trades)" on Overview to explore with sample data
3. Navigate through tabs: Overview, Trade Log, Mistakes, Analytics, Calendar, Import & Export
4. Add your own trades with "+ New Trade"
5. Tag mistakes to build your improvement database
6. Review Mistakes tab regularly for actionable insights

### For Developers
```bash
cd tradebook
npm install
npm start        # Development server
npm run build    # Production build
npm run deploy   # Deploy to GitHub Pages
```

## Key Design Principles

- **Fix One Thing**: Focus on biggest leak, not everything at once
- **Data-Driven**: Decisions based on actual trade data and costs
- **Actionable**: Every insight comes with concrete steps
- **Privacy-First**: All data stored locally, no external servers
- **Portable**: Easy import/export to avoid vendor lock-in
- **Mobile-First**: Great experience on any device
- **Honest**: Shows real costs of mistakes, not sugar-coated

## Branch Information
- **Working Branch**: `kilo/dry-bobcat-te9`
- **All changes committed and pushed to GitHub**

## Deployment Status
✅ Built successfully  
✅ Deployed to GitHub Pages  
✅ All features tested with demo data  
✅ MT5 import tested and working  
✅ Mobile responsive verified  
✅ Analytics and mistake tracking validated
