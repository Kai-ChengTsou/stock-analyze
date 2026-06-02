export type Sentiment = 'Bullish' | 'Neutral' | 'Bearish';
export type Impact = 'Positive' | 'Neutral' | 'Negative';
export type Confidence = 'Low' | 'Medium' | 'High';
export type EvidenceStrength = 'Low' | 'Medium' | 'High';
export type FinalView = 'Positive' | 'Neutral' | 'Negative';
export type SuggestedAction =
  | 'Watch'
  | 'Wait'
  | 'Avoid'
  | 'Consider buying only if conditions are met'
  | 'Consider selling if thesis breaks';
export type WatchlistStatus = 'Watching' | 'Waiting' | 'Avoiding' | 'Researching';
export type MarketRegion = 'US' | 'Taiwan' | 'CrossMarket';
export type CatalystType = 'Fresh catalyst' | 'Recent context' | 'Background thesis' | 'Momentum only' | 'No signal';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  relatedTickers: string[];
  impact: Impact;
  confidence: Confidence;
}

export interface Theme {
  id: string;
  name: string;
  whyItMatters: string;
  relatedIndustries: string[];
  relatedCompanies: string[];
  shortTermImpact: string;
  longTermImpact: string;
  evidenceQuality: EvidenceStrength;
}

export interface SupplyChainNode {
  id: string;
  companyName: string;
  ticker: string;
  marketCountry: string;
  layer: 1 | 2 | 3 | 4;
  linkedThemeId: string;
  whyItMayBenefit: string;
  evidenceStrength: EvidenceStrength;
  visibility: 'Obvious' | 'Hidden';
  keyRisk: string;
}

export interface Beneficiary {
  id: string;
  themeId: string;
  directBeneficiaries: string[];
  indirectBeneficiaries: string[];
  hiddenBeneficiaries: string[];
  companiesMayBeHurt: string[];
  reasoning: string;
  evidenceQuality: EvidenceStrength;
  researchPriorityScore: number;
}

export interface CompanyResearch {
  id: string;
  companyName: string;
  ticker: string;
  marketCountry: string;
  overview: string;
  businessModel: string;
  revenueDrivers: string[];
  latestFinancialReportSummary: string;
  revenueGrowth: string;
  grossMargin: string;
  eps: string;
  freeCashFlow: string;
  valuationRisk: string;
  technicalTrend: string;
  competitors: string[];
  bullCase: string;
  baseCase: string;
  bearCase: string;
  keyRisks: string[];
  finalView: FinalView;
  suggestedAction: SuggestedAction;
  whatWouldChangeView: string;
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  companyName: string;
  currentView: FinalView;
  keyNews: string;
  keyPriceLevels: string;
  riskNotes: string;
  lastUpdatedTime: string;
  status: WatchlistStatus;
}

export interface IdeaPipelineItem {
  id: string;
  newsId: string;
  themeId: string;
  supplyChainNodeId: string;
  companyResearchId: string;
  finalView: FinalView;
  explanation: string;
}

export interface MarketSection {
  region: MarketRegion;
  title: string;
  overview: string;
  sentiment: Sentiment;
  keyIndexes: string[];
  topThemes: string[];
  importantNewsIds: string[];
  stocksToWatch: string[];
  risks: string[];
}

export interface CrossMarketLink {
  id: string;
  title: string;
  usCatalyst: string;
  taiwanReadThrough: string;
  relatedUSTickers: string[];
  relatedTaiwanTickers: string[];
  evidenceStrength: EvidenceStrength;
}

export interface ScanCoverageItem {
  id: string;
  market: MarketRegion;
  category: string;
  status: CatalystType;
  tickersChecked: string[];
  reason: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface MarketSections {
  us: MarketSection;
  taiwan: MarketSection;
  crossMarket: CrossMarketLink[];
  scanCoverage: ScanCoverageItem[];
}

export interface DailyDashboard {
  date: string;
  generatedAt: string;
  marketOverview: string;
  marketSentiment: Sentiment;
  topThemes: string[];
  stocksToWatch: string[];
  biggestRisk: string;
  watchlistAlerts: string[];
  emotionalWarning: string;
  news: NewsItem[];
  themes: Theme[];
  supplyChain: SupplyChainNode[];
  beneficiaries: Beneficiary[];
  companyResearch: CompanyResearch[];
  watchlist: WatchlistItem[];
  ideaPipeline: IdeaPipelineItem[];
  marketSections?: MarketSections;
}
