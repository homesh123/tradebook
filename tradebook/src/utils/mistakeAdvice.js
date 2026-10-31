// Rules, action steps and prevention methods for each common trading mistake.
export const MISTAKE_ADVICE = {
  'fomo': { rule: 'Wait for setup confirmation', solution: 'Create a 3-point checklist and only enter if all points are true. Set alerts instead of chasing.', prevention: 'Use limit orders at planned zones' },
  'chased entry': { rule: 'No market orders out of zone', solution: 'Wait for pullback to entry zone. If price moves away, skip the trade.', prevention: 'Predefine exact entry price range' },
  'moved stop': { rule: 'Stop loss is never moved', solution: 'Accept the risk you defined. Moving stop is always emotional.', prevention: 'Use hard stops or mentally commit before entry' },
  'revenge trade': { rule: 'Cooldown after loss', solution: 'Mandatory 30-60 min break after any losing trade. No immediate re-entry.', prevention: 'Set daily loss limit of 2% account' },
  'overtrading': { rule: 'Quality over quantity', solution: 'Max 2-3 A+ setups per day. Track trades taken vs setups met.', prevention: 'End session after hitting trade limit' },
  'ignored plan': { rule: 'Follow playbook strictly', solution: 'Review playbook before each trade. Grade plan adherence after every trade.', prevention: 'Pre-trade checklist required' },
  'early entry': { rule: 'Wait for confirmation', solution: 'Define specific confirmation signals. Don\'t anticipate breakouts.', prevention: 'Use higher timeframe confirmation' },
  'late exit': { rule: 'Stick to exit plan', solution: 'Set take profit orders at pre-defined levels. Trail only per rules.', prevention: 'Review exit criteria before entry' },
  'poor risk management': { rule: 'Risk defined before entry', solution: 'Calculate position size from stop distance. Never risk >1% per trade.', prevention: 'Use position size calculator' },
  'emotional': { rule: 'Trade only in optimal state', solution: 'Rate readiness 1-10 before trading. Skip if below 7.', prevention: 'Morning routine check-in' }
  };

const DEFAULT_ADVICE = { rule: 'Define specific prevention rule', solution: 'Create concrete rule and track compliance.', prevention: 'Daily review required' };

export const getFixAdvice = (mistake) => MISTAKE_ADVICE[(mistake || '').trim().toLowerCase()] || DEFAULT_ADVICE;
