import type { Confidence, EvidenceGrade, EvidenceStrength, FinalView, Impact, OpportunityStage, Sentiment, SuggestedAction, WatchlistStatus } from '../types/research';

export const sentimentLabel: Record<Sentiment, string> = {
  Bullish: '偏多',
  Neutral: '中性',
  Bearish: '偏空',
};

export const impactLabel: Record<Impact, string> = {
  Positive: '正面',
  Neutral: '中性',
  Negative: '負面',
};

export const confidenceLabel: Record<Confidence | EvidenceStrength, string> = {
  High: '高',
  Medium: '中',
  Low: '低',
};

export const finalViewLabel: Record<FinalView, string> = {
  Positive: '正向',
  Neutral: '中性',
  Negative: '負向',
};

export const actionLabel: Record<SuggestedAction, string> = {
  Watch: '觀察',
  Wait: '等待',
  Avoid: '避開',
  'Consider buying only if conditions are met': '條件符合才考慮買進',
  'Consider selling if thesis breaks': '論點破壞則考慮賣出',
};

export const statusLabel: Record<WatchlistStatus, string> = {
  Watching: '觀察中',
  Waiting: '等待中',
  Avoiding: '避開',
  Researching: '研究中',
};

export const evidenceGradeLabel: Record<EvidenceGrade, string> = {
  A: 'A 官方/高可信',
  B: 'B 可靠媒體/數據',
  C: 'C 弱來源/傳聞',
  D: 'D 僅量價',
};

export const opportunityStageLabel: Record<OpportunityStage, string> = {
  Early: '早期',
  Confirming: '確認中',
  Crowded: '擁擠',
  Late: '偏晚',
  'Avoid/Wait': '避開/等待',
  'Avoid-Wait': '避開/等待',
};

export const toneClass = (value: string) => {
  if (['Bullish', 'Positive', 'High', 'A', 'B', 'Early', 'Confirming'].includes(value)) return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200';
  if (['Bearish', 'Negative', 'Low', 'C', 'D', 'Late', 'Avoid/Wait', 'Avoid-Wait'].includes(value)) return 'border-rose-400/25 bg-rose-400/10 text-rose-200';
  if (['Crowded'].includes(value)) return 'border-amber-400/25 bg-amber-400/10 text-amber-200';
  return 'border-sky-400/25 bg-sky-400/10 text-sky-200';
};
