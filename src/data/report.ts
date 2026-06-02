import report from '../../data/latest.json';
import type { DailyDashboard, MarketRegion, MarketSection, MarketSections, Sentiment } from '../types/research';

export const dailyReport = report as DailyDashboard;

export const themeName = (themeId: string) =>
  dailyReport.themes.find((theme) => theme.id === themeId)?.name ?? '未知主題';

export const newsTitle = (newsId: string) =>
  dailyReport.news.find((news) => news.id === newsId)?.title ?? '未知新聞';

export const supplyNode = (nodeId: string) =>
  dailyReport.supplyChain.find((node) => node.id === nodeId);

export const companyResearch = (companyId: string) =>
  dailyReport.companyResearch.find((company) => company.id === companyId);

const usTickerPattern = /^[A-Z]{1,5}$/;
const taiwanTickerPattern = /^\d{4}\.TW$/;

const tickerRegion = (ticker: string): MarketRegion | undefined => {
  if (taiwanTickerPattern.test(ticker)) return 'Taiwan';
  if (usTickerPattern.test(ticker)) return 'US';
  return undefined;
};

const hasRegionTicker = (tickers: string[], region: MarketRegion) =>
  tickers.some((ticker) => tickerRegion(ticker) === region);

const deriveThemes = (region: MarketRegion) =>
  dailyReport.themes
    .filter((theme) => hasRegionTicker(theme.relatedCompanies, region))
    .map((theme) => theme.name)
    .slice(0, 4);

const deriveNewsIds = (region: MarketRegion) =>
  dailyReport.news
    .filter((item) => hasRegionTicker(item.relatedTickers, region))
    .map((item) => item.id)
    .slice(0, 8);

const deriveStocks = (region: MarketRegion) =>
  Array.from(new Set(dailyReport.stocksToWatch.filter((ticker) => tickerRegion(ticker) === region))).slice(0, 12);

const buildFallbackSection = (region: 'US' | 'Taiwan'): MarketSection => {
  const isUS = region === 'US';
  const stocks = deriveStocks(region);
  const themes = deriveThemes(region);
  const newsIds = deriveNewsIds(region);

  return {
    region,
    title: isUS ? '美股市場' : '台股市場',
    overview: isUS
      ? '由現有報表自動整理美股相關訊號；新版晨報會獨立掃描美股大盤、利率、美元、SOX、雲端 capex 與大型科技財報。'
      : '由現有報表自動整理台股相關訊號；新版晨報會獨立掃描台股大盤、櫃買、外資、成交量、題材輪動、月營收與處置股。',
    sentiment: dailyReport.marketSentiment as Sentiment,
    keyIndexes: isUS ? ['S&P 500', 'Nasdaq', 'SOX', 'US 10Y', 'DXY'] : ['TAIEX', 'TPEx', 'TWD', '外資', '成交量'],
    topThemes: themes.length > 0 ? themes : dailyReport.topThemes,
    importantNewsIds: newsIds,
    stocksToWatch: stocks,
    risks: [dailyReport.biggestRisk],
  };
};

export const marketSections: MarketSections =
  dailyReport.marketSections ?? {
    us: buildFallbackSection('US'),
    taiwan: buildFallbackSection('Taiwan'),
    crossMarket: dailyReport.supplyChain
      .filter((node) => tickerRegion(node.ticker) === 'Taiwan')
      .slice(0, 6)
      .map((node) => ({
        id: `fallback-link-${node.id}`,
        title: `${themeName(node.linkedThemeId)} -> ${node.companyName}`,
        usCatalyst: themeName(node.linkedThemeId),
        taiwanReadThrough: node.whyItMayBenefit,
        relatedUSTickers: dailyReport.stocksToWatch.filter((ticker) => tickerRegion(ticker) === 'US').slice(0, 5),
        relatedTaiwanTickers: [node.ticker],
        evidenceStrength: node.evidenceStrength,
      })),
    scanCoverage: [
      {
        id: 'fallback-us-market',
        market: 'US',
        category: '美股大盤與大型科技',
        status: 'Recent context',
        tickersChecked: deriveStocks('US'),
        reason: '目前由既有報表推導；下一版晨報會先獨立掃描完整美股市場。',
        priority: 'High',
      },
      {
        id: 'fallback-taiwan-market',
        market: 'Taiwan',
        category: '台股題材與供應鏈',
        status: 'Recent context',
        tickersChecked: deriveStocks('Taiwan'),
        reason: '目前由既有報表推導；下一版晨報會先獨立掃描完整台股市場。',
        priority: 'High',
      },
    ],
  };

export const newsById = (newsId: string) =>
  dailyReport.news.find((news) => news.id === newsId);
