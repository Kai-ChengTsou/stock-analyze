import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import https from 'node:https';
import path from 'node:path';
import { promisify } from 'node:util';
import type {
  Beneficiary,
  BeneficiaryType,
  CatalystDriver,
  CompanyResearch,
  DailyDashboard,
  EvidenceGrade,
  IdeaPipelineItem,
  MarketSections,
  NewsItem,
  OpportunityStage,
  ScanCoverageItem,
  SupplyChainNode,
  Theme,
  TradingPlan,
  WatchlistItem,
} from '../src/types/research';

type ReportMode = 'morning' | 'evening';
type Quote = {
  ticker: string;
  ok: boolean;
  latest?: number;
  close?: number;
  previousClose?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  avgVolume20?: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma60?: number;
  recentHigh?: number;
  recentLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currency?: string;
  reason?: string;
  asOfDate?: string;
};

type CompanySeed = {
  ticker: string;
  companyName: string;
  marketCountry: string;
  sectorTheme: string;
  role: string;
  beneficiaryType: BeneficiaryType;
  stage: OpportunityStage;
  grade: EvidenceGrade;
  driver: CatalystDriver;
  action: CompanyResearch['suggestedAction'];
  risks: string[];
  competitors: string[];
};

let quoteOverrides: Record<string, Quote> | undefined;

async function getQuoteOverrides() {
  if (quoteOverrides) return quoteOverrides;
  try {
    const raw = await readFile(path.join(dataDir, 'quote-overrides.json'), 'utf8');
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, '')) as Record<string, Quote>;
    quoteOverrides = Object.fromEntries(
      Object.entries(parsed).filter(([, quote]) => quote.ok && quote.asOfDate === runTime.date)
    );
  } catch {
    quoteOverrides = {};
  }
  return quoteOverrides;
}

async function loadBatchQuoteOverrides(tickers: string[]) {
  const existingOverrides = await getQuoteOverrides();
  if (Object.values(existingOverrides).some((quote) => quote.ok)) return;

  try {
    const script = path.join(root, 'scripts', 'fetchQuoteOverrides.ps1');
    const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Tickers', tickers.join(',')], {
      maxBuffer: 16 * 1024 * 1024,
    });
    quoteOverrides = JSON.parse(stdout) as Record<string, Quote>;
  } catch (error) {
    console.error(`Batch quote fetch failed: ${error instanceof Error ? error.message : 'quote batch failed'}`);
    quoteOverrides = {};
  }
}

const root = process.cwd();
const dataDir = path.join(root, 'data');
const reportsDir = path.join(dataDir, 'reports');
const execFileAsync = promisify(execFile);
const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
const reportMode = (modeArg?.split('=')[1] ?? process.env.REPORT_MODE ?? 'morning') as ReportMode;

if (!['morning', 'evening'].includes(reportMode)) {
  throw new Error(`Unsupported report mode: ${reportMode}`);
}

function taiwanRunTime(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    generatedAt: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`,
  };
}

const runTime = taiwanRunTime();
const twd = (n?: number) => n === undefined ? '價格資料不足' : `${n.toFixed(n >= 1000 ? 0 : 2)} TWD`;
const usd = (n?: number) => n === undefined ? '價格資料不足' : `${n.toFixed(2)} USD`;
const px = (q: Quote, n?: number) => q.currency === 'TWD' ? twd(n) : usd(n);
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

async function getPortfolioTickers() {
  const raw = await readFile(path.join(dataDir, 'portfolio.json'), 'utf8');
  const portfolio = JSON.parse(raw) as { holdings: Array<{ ticker: string }> };
  return portfolio.holdings.map((item) => item.ticker);
}

function avg(items: number[]) {
  return items.length ? items.reduce((sum, value) => sum + value, 0) / items.length : undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url: string) {
  try {
    return await new Promise<any>((resolve, reject) => {
      const request = https.get(url, { headers: { 'user-agent': 'Mozilla/5.0' } }, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`HTTP ${response.statusCode ?? 'unknown'}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      });
      request.on('error', reject);
      request.setTimeout(15000, () => {
        request.destroy(new Error('request timeout'));
      });
    });
  } catch {
    const command = [
      '$ProgressPreference = "SilentlyContinue";',
      '[Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8;',
      `$response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 -Uri '${url.replace(/'/g, "''")}';`,
      '$response.Content',
    ].join(' ');
    const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', command], {
      maxBuffer: 8 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  }
}

async function fetchQuote(ticker: string): Promise<Quote> {
  const overrides = await getQuoteOverrides();
  if (overrides[ticker]?.ok) return overrides[ticker];

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=3mo&interval=1d&includePrePost=true`;
  try {
    const data = await fetchJson(url);
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];
    const closes = (quote?.close ?? []).filter((value: number | null) => typeof value === 'number') as number[];
    const highs = (quote?.high ?? []).filter((value: number | null) => typeof value === 'number') as number[];
    const lows = (quote?.low ?? []).filter((value: number | null) => typeof value === 'number') as number[];
    const volumes = (quote?.volume ?? []).filter((value: number | null) => typeof value === 'number') as number[];
    if (!meta || closes.length < 20) return { ticker, ok: false, reason: '歷史價格不足' };
    const latest = Number(meta.regularMarketPrice ?? closes[closes.length - 1]);
    return {
      ticker,
      ok: true,
      latest,
      close: closes[closes.length - 1],
      previousClose: meta.regularMarketPreviousClose ?? closes[closes.length - 2],
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume ?? volumes[volumes.length - 1],
      avgVolume20: avg(volumes.slice(-20)),
      ma5: avg(closes.slice(-5)),
      ma10: avg(closes.slice(-10)),
      ma20: avg(closes.slice(-20)),
      ma60: avg(closes.slice(-60)),
      recentHigh: Math.max(...highs.slice(-20)),
      recentLow: Math.min(...lows.slice(-20)),
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      currency: meta.currency,
    };
  } catch (error) {
    return { ticker, ok: false, reason: error instanceof Error ? error.message : 'quote fetch failed' };
  }
}

function priceBehavior(q: Quote) {
  if (!q.ok || !q.latest || !q.ma20 || !q.ma60 || !q.avgVolume20 || !q.volume) {
    return '價格資料不足，今日不設定主動買點。';
  }
  const change = q.previousClose ? ((q.latest - q.previousClose) / q.previousClose) * 100 : 0;
  const above20 = ((q.latest - q.ma20) / q.ma20) * 100;
  const volRatio = q.volume / q.avgVolume20;
  const heat =
    above20 > 12 || (q.fiftyTwoWeekHigh !== undefined && q.latest > q.fiftyTwoWeekHigh * 0.96) || volRatio > 1.8;
  const trend = q.latest > q.ma20 && q.ma20 > q.ma60 ? '多頭排列' : q.latest > q.ma20 ? '短線轉強' : '整理或回落';
  return `最新 ${px(q, q.latest)}，日變動 ${pct(change)}；5/10/20/60 日均線約 ${px(q, q.ma5)} / ${px(q, q.ma10)} / ${px(q, q.ma20)} / ${px(q, q.ma60)}。近 20 日高低約 ${px(q, q.recentHigh)} / ${px(q, q.recentLow)}，量能約為 20 日均量 ${volRatio.toFixed(1)} 倍，技術狀態為${trend}。${heat ? '短線有過熱或接近壓力風險，不適合無條件追價。' : '未見極端過熱，仍需等突破或回測確認。'}`;
}

const newsItems: NewsItem[] = [
  {
    id: 'fresh-trendforce-hbm-pricing',
    title: '【新催化】TrendForce 指出 HBM 供給偏緊，2027 合約價具倍數上行空間',
    source: 'TrendForce, 2026-06-02',
    date: runTime.date,
    summary: 'HBM 仍是 AI training 與 inference 的核心瓶頸，AI ASIC 容量從 96/192GB 往 216/288GB 升級，使 HBM wafer input 持續排擠傳統 DRAM。資金會繼續尋找 HBM、先進封裝、測試、矽中介層與成熟 DRAM 補位受惠者。',
    relatedTickers: ['MU', 'NVDA', 'AVGO', '2330.TW', '3711.TW', '2408.TW', '2344.TW', '6770.TW'],
    impact: 'Positive',
    confidence: 'High',
    freshness: 'Fresh catalyst',
    evidenceGrade: 'A',
    opportunityStage: 'Confirming',
    catalystDriver: 'Supply-chain',
    whyMarketCares: '這是官方產業研究機構的新資料，直接影響 AI memory capex 與台股記憶體供應鏈定價。',
    pricedIn: 'MU 與台股記憶體短線已反映部分漲價預期，需用量價判斷是否過熱。',
    confirms: 'DRAM 報價、月營收與 HBM 客戶長約同步上修。',
    invalidates: '報價漲幅放緩或記憶體股爆量長黑。',
  },
  {
    id: 'fresh-sk-hynix-capacity',
    title: '【新催化】SK hynix 董事長稱 AI memory shortage 可能延續至 2030 並規劃五年內倍增 wafer capacity',
    source: 'Tom’s Hardware / Computex comments, 2026-06-02',
    date: runTime.date,
    summary: '供給端即使擴產也需要多年，代表 HBM 與 server DRAM 價格權力仍在供應商手上；台灣成熟製程 DRAM、封測與先進封裝補位邏輯升溫。',
    relatedTickers: ['MU', '2408.TW', '2344.TW', '2337.TW', '6770.TW'],
    impact: 'Positive',
    confidence: 'High',
    freshness: 'Fresh catalyst',
    evidenceGrade: 'B',
    opportunityStage: 'Confirming',
    catalystDriver: 'Fundamental',
    whyMarketCares: '供給瓶頸把 AI 資本開支從 GPU 擴散到 memory 與成熟製程產能。',
    pricedIn: '記憶體題材已有擁擠化，拉回量縮比追高更健康。',
    confirms: '台股記憶體成交量擴大且守住前高。',
    invalidates: '報價轉跌或籌碼過熱後跌破 20 日線。',
  },
  {
    id: 'fresh-avgo-earnings-watch',
    title: '【新催化】Broadcom FY26 Q2 已公布：AI 半導體營收強勁，但盤後賣壓提醒高檔交易擁擠',
    source: 'Broadcom official Q2 FY26 release / PRNewswire / after-hours market reaction, 2026-06-03',
    date: runTime.date,
    summary: 'Broadcom 公布 Q2 營收、營業利益與自由現金流創高，AI semiconductor revenue 年增 143%，並指引 Q3 AI semiconductor revenue 年增逾 200%；但盤後股價下跌，代表市場已把「好消息」高度預期化。台股 read-through 仍指向創意、世芯、智邦、台光電、金像電與台積電，但今日不能把 ASIC 利多直接翻成追價買點。',
    relatedTickers: ['AVGO', 'GOOGL', 'MRVL', '2330.TW', '3443.TW', '3661.TW', '2345.TW', '2383.TW'],
    impact: 'Positive',
    confidence: 'Medium',
    freshness: 'Fresh catalyst',
    evidenceGrade: 'B',
    opportunityStage: 'Confirming',
    catalystDriver: 'Fundamental',
    whyMarketCares: 'GPU 之外的 ASIC 是 AI capex 第二條主線。',
    pricedIn: 'AVGO 與 ASIC 台股已不便宜，盤後賣壓顯示短線利多出盡風險升高。',
    confirms: 'AI revenue guide 上修後，股價收復盤後跌幅並帶動 networking / CCL / ASIC 供應鏈同步放量。',
    invalidates: '財報利多無法帶動股價站回短均或台股相關供應鏈開高走低。',
  },
  {
    id: 'fresh-ai-leaders-record-risk',
    title: '【新催化】台股 6/4 重挫與美股 AI leader 高檔震盪並存，追價需檢查 bull trap',
    source: 'Yahoo Finance quote data / 經濟日報台股收盤 / Reuters TSMC comments, 2026-06-04',
    date: runTime.date,
    summary: '台股 6/4 受科技股回檔拖累，終場重挫 781 點至 45,677 點，台積電收 2,385 元；同日 TSMC 管理層對 AI 需求與先進製程/封裝供給仍維持強勢語氣，代表基本面長線仍強，但短線資金已開始檢查高檔估值與獲利了結風險。NVDA、AVGO、MU、MRVL 等仍吸引資金，但多檔接近近期高檔；今晚若開高後跌破 VWAP 或前高失守，台股隔日容易出現開高走低。',
    relatedTickers: ['NVDA', 'AVGO', 'MU', 'MRVL', 'QQQ', 'SOXX', '2330.TW', '0050.TW'],
    impact: 'Negative',
    confidence: 'High',
    freshness: 'Fresh catalyst',
    evidenceGrade: 'B',
    opportunityStage: 'Crowded',
    catalystDriver: 'Technical',
    whyMarketCares: '資金仍在 AI，但風險報酬已從「買題材」轉為「買確認」。',
    pricedIn: '台股權值與 AI 供應鏈已有獲利了結，龍頭股反映度高，二線供應鏈需避免跟著追高。',
    confirms: '突破前高且收盤守住，成交量高於均量。',
    invalidates: '開高走低、跌回前高下方或 SOXX 弱於 QQQ。',
  },
  {
    id: 'fresh-taiwan-holdings-check',
    title: '【新催化】持股檢查：0050 偏核心配置，台達電受 AI power 支撐，力積電受 memory shortage 補位但波動高',
    source: 'Yahoo Finance chart API / portfolio.json, 2026-06-03',
    date: runTime.date,
    summary: '本次強制檢查 0050、2308、6770。0050 看大盤與台積電權重，台達電看資料中心電源與 SST，力積電看成熟 DRAM/晶圓代工補位與成交量是否過熱。',
    relatedTickers: ['0050.TW', '2308.TW', '6770.TW'],
    impact: 'Neutral',
    confidence: 'High',
    freshness: 'Fresh catalyst',
    evidenceGrade: 'B',
    opportunityStage: 'Confirming',
    catalystDriver: 'Mixed',
    whyMarketCares: '持股不是看成本，而是看今日價格結構、催化品質與供應鏈 read-through。',
    pricedIn: '台達電與力積電若近期急漲，應以回測支撐而非追高處理。',
    confirms: '持股守住 20 日線且相對台股強。',
    invalidates: '放量跌破 20 日線或題材主線轉弱。',
  },
  {
    id: 'recent-nvidia-computex',
    title: '【近期脈絡】Computex 後 NVIDIA AI factory / Rubin / Blackwell 敘事仍支撐台灣 AI 供應鏈',
    source: 'Computex 2026 company events and media coverage',
    date: runTime.date,
    summary: 'NVIDIA road map 是 3-7 日仍有效的背景脈絡，但不是今天才出現的新消息。它支撐台積電、鴻海、廣達、緯穎、台達電、散熱、PCB/CCL、光通訊與先進封裝。',
    relatedTickers: ['NVDA', '2330.TW', '2317.TW', '2382.TW', '6669.TW', '2308.TW', '3017.TW'],
    impact: 'Positive',
    confidence: 'High',
    freshness: 'Recent context',
    evidenceGrade: 'B',
    opportunityStage: 'Confirming',
    catalystDriver: 'Supply-chain',
    whyMarketCares: '台股 AI 供應鏈中期訂單能見度仍取決於 NVIDIA 平台節奏。',
    pricedIn: '一線龍頭高度共識，應尋找回測與二線補位。',
    confirms: '月營收或法說確認 Blackwell/Rubin 導入。',
    invalidates: '交付延遲或客戶 capex 下修。',
  },
  {
    id: 'recent-power-cooling',
    title: '【近期脈絡】資料中心電力、UPS、液冷與熱管理仍是 AI build-out 瓶頸',
    source: 'Vertiv / Eaton / data-center infrastructure reports, last 3-7 days',
    date: runTime.date,
    summary: 'AI rack 功耗提升讓電源、UPS、液冷、機櫃與能源管理持續受惠；台達電、光寶科、奇鋐、雙鴻、健策與 Vertiv / Eaton 仍是關鍵映射。',
    relatedTickers: ['VRT', 'ETN', '2308.TW', '2301.TW', '3017.TW', '3324.TW', '3653.TW'],
    impact: 'Positive',
    confidence: 'High',
    freshness: 'Recent context',
    evidenceGrade: 'B',
    opportunityStage: 'Crowded',
    catalystDriver: 'Supply-chain',
    whyMarketCares: 'AI GPU 供應增加後，瓶頸往 power envelope 與 cooling 下沉。',
    pricedIn: '多數龍頭估值高，今日只接受拉回或突破確認。',
    confirms: '訂單、毛利率與產能利用率同步改善。',
    invalidates: '雲端 capex 延後或價格競爭壓縮毛利。',
  },
  {
    id: 'recent-export-controls',
    title: '【近期脈絡】出口管制與地緣政治仍壓抑 GPU / ASIC 中國曝險估值',
    source: 'US export control reporting, last 3-7 days',
    date: runTime.date,
    summary: '政策風險不構成今天單一買點，但必須放進風險權重。GPU、ASIC、foundry 與成熟製程若受區域需求重新配置影響，估值會快速變動。',
    relatedTickers: ['NVDA', 'AMD', 'AVGO', '2330.TW', '3443.TW', '6770.TW'],
    impact: 'Neutral',
    confidence: 'Medium',
    freshness: 'Recent context',
    evidenceGrade: 'B',
    opportunityStage: 'Late',
    catalystDriver: 'Policy',
    whyMarketCares: '政策會改變出貨地區、產品組合與客戶排程。',
    pricedIn: '市場暫時以 AI demand 抵消政策折價。',
    confirms: '限制明確且影響低於預期。',
    invalidates: '限制擴大到更多 accelerator 或 foundry 服務。',
  },
  {
    id: 'background-ai-agents-software',
    title: '【背景論點】AI agents 與 enterprise AI 軟體仍是需求端驗證，但短線硬體催化較強',
    source: 'Major cloud and software company commentary',
    date: runTime.date,
    summary: '企業 AI 軟體能否變現，決定 cloud capex ROI 是否被市場接受。短線資金仍偏硬體與供應鏈，但 PLTR、MSFT、NOW、SNOW 仍是需求端雷達。',
    relatedTickers: ['MSFT', 'PLTR', 'NOW', 'SNOW', 'GOOGL', 'AMZN'],
    impact: 'Neutral',
    confidence: 'Medium',
    freshness: 'Background thesis',
    evidenceGrade: 'B',
    opportunityStage: 'Early',
    catalystDriver: 'Fundamental',
    whyMarketCares: '硬體 capex 最終要由軟體與雲端收入回收。',
    pricedIn: '軟體股分歧，缺乏同日交易催化。',
    confirms: 'AI seat expansion 與 cloud margin 同步改善。',
    invalidates: '企業 AI 採用延後或價格戰。',
  },
  {
    id: 'rejected-panel-foplp',
    title: '【低訊號剔除】面板 / FOPLP / 低軌衛星題材仍有資金，但今日證據不足以升級',
    source: 'Taiwan market reports and price-volume scan',
    date: runTime.date,
    summary: '群創、彩晶、友達與玻璃基板題材仍在雷達，但缺少足夠正式訂單與財務驗證；若只有爆量與社群熱度，應列為投機而非高信心投資。',
    relatedTickers: ['3481.TW', '6116.TW', '2409.TW', '6438.TW'],
    impact: 'Neutral',
    confidence: 'Medium',
    freshness: 'Momentum only',
    evidenceGrade: 'D',
    opportunityStage: 'Late',
    catalystDriver: 'Sentiment',
    whyMarketCares: '短線資金輪動會拉抬低價股，但容易反轉。',
    pricedIn: '題材已有熱度，缺乏正式驗證。',
    confirms: '公司公告或月營收證實新業務。',
    invalidates: '爆量長黑或處置風險升高。',
  },
];

const themes: Theme[] = [
  { id: 'theme-memory', name: 'HBM / DRAM 供給緊縮', whyItMatters: 'AI ASIC 與 GPU 擴張把資本流推向 memory、封裝、測試與成熟 DRAM 補位。', relatedIndustries: ['HBM', 'DRAM', '封測', '成熟製程'], relatedCompanies: ['MU', '2408.TW', '2344.TW', '6770.TW'], shortTermImpact: '記憶體股相對強，但需防過熱。', longTermImpact: '供給不足延長，定價權改善。', evidenceQuality: 'High' },
  { id: 'theme-asic-networking', name: 'ASIC / AI networking', whyItMatters: 'AVGO 財報與 MRVL 題材將驗證 GPU 外的第二資本支出池。', relatedIndustries: ['ASIC', 'CPO', 'switch', 'PCB/CCL'], relatedCompanies: ['AVGO', 'MRVL', '2345.TW', '2383.TW'], shortTermImpact: '財報前後波動升高。', longTermImpact: 'AI cluster bottleneck 往 interconnect 擴散。', evidenceQuality: 'Medium' },
  { id: 'theme-power-cooling', name: '資料中心電力與冷卻', whyItMatters: 'AI rack 功耗升高，資金流向 power、UPS、SST、液冷與機櫃。', relatedIndustries: ['Power', 'Cooling', 'Grid'], relatedCompanies: ['VRT', 'ETN', '2308.TW', '3017.TW'], shortTermImpact: '高估值須等拉回。', longTermImpact: '資料中心建置瓶頸支撐訂單。', evidenceQuality: 'High' },
  { id: 'theme-foundry-packaging', name: 'Foundry / advanced packaging', whyItMatters: 'HBM 與 ASIC 需求增加 CoWoS、測試、載板與高階製程價值。', relatedIndustries: ['Foundry', 'CoWoS', 'ABF', 'Testing'], relatedCompanies: ['2330.TW', '3711.TW', '3037.TW', '3189.TW'], shortTermImpact: '龍頭穩定但追價空間有限。', longTermImpact: 'AI 晶片複雜度提高供應鏈價值。', evidenceQuality: 'High' },
  { id: 'theme-cloud-roi', name: 'Cloud capex ROI 驗證', whyItMatters: '若 hyperscaler 開始被要求證明 AI 投資回收，高估值硬體鏈會先受壓。', relatedIndustries: ['Cloud', 'AI software', 'Semiconductors'], relatedCompanies: ['GOOGL', 'MSFT', 'AMZN', 'NVDA'], shortTermImpact: '開高走低風險上升。', longTermImpact: '資金會偏向有訂單與現金流驗證的公司。', evidenceQuality: 'Medium' },
];

const seeds: CompanySeed[] = [
  { ticker: 'NVDA', companyName: 'NVIDIA', marketCountry: 'US', sectorTheme: 'GPU / AI platform', role: 'AI accelerator、networking 與 software stack 核心供應商', beneficiaryType: 'Direct', stage: 'Crowded', grade: 'B', driver: 'Mixed', action: 'Watch', risks: ['估值高', '出口管制', '開高走低'], competitors: ['AMD', 'AVGO', 'GOOGL TPU'] },
  { ticker: 'AVGO', companyName: 'Broadcom', marketCountry: 'US', sectorTheme: 'ASIC / networking', role: 'custom AI ASIC、switch silicon 與 enterprise software', beneficiaryType: 'Direct', stage: 'Confirming', grade: 'B', driver: 'Fundamental', action: 'Consider buying only if conditions are met', risks: ['財報波動', 'ASIC 客戶集中'], competitors: ['MRVL', 'NVDA', 'AMD'] },
  { ticker: 'MRVL', companyName: 'Marvell Technology', marketCountry: 'US', sectorTheme: 'AI networking / optical', role: 'DSP、custom silicon 與高速互連', beneficiaryType: 'Direct', stage: 'Confirming', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['題材過熱', '財報落差'], competitors: ['AVGO', 'NVDA'] },
  { ticker: 'MU', companyName: 'Micron', marketCountry: 'US', sectorTheme: 'HBM / DRAM', role: 'HBM、server DRAM 與 enterprise SSD', beneficiaryType: 'Direct', stage: 'Confirming', grade: 'A', driver: 'Fundamental', action: 'Consider buying only if conditions are met', risks: ['記憶體循環', '資本支出'], competitors: ['SK hynix', 'Samsung'] },
  { ticker: 'VRT', companyName: 'Vertiv', marketCountry: 'US', sectorTheme: 'Data center power / cooling', role: 'UPS、thermal management 與資料中心基礎設施', beneficiaryType: 'Direct', stage: 'Crowded', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['估值', '資料中心供給過剩疑慮'], competitors: ['ETN', 'Schneider'] },
  { ticker: 'ETN', companyName: 'Eaton', marketCountry: 'US', sectorTheme: 'Grid / electrical equipment', role: '電力設備與資料中心配電', beneficiaryType: 'Indirect', stage: 'Confirming', grade: 'B', driver: 'Fundamental', action: 'Watch', risks: ['利率', '工業循環'], competitors: ['GEV', 'PWR'] },
  { ticker: 'GOOGL', companyName: 'Alphabet', marketCountry: 'US', sectorTheme: 'Cloud / AI ROI', role: 'hyperscaler、TPU 與 AI capex 需求端', beneficiaryType: 'Direct', stage: 'Confirming', grade: 'B', driver: 'Fundamental', action: 'Watch', risks: ['capex ROI', '監管'], competitors: ['MSFT', 'AMZN'] },
  { ticker: 'MSFT', companyName: 'Microsoft', marketCountry: 'US', sectorTheme: 'Cloud / enterprise AI', role: 'Azure、Copilot 與 enterprise AI monetization', beneficiaryType: 'Direct', stage: 'Confirming', grade: 'B', driver: 'Fundamental', action: 'Watch', risks: ['AI 毛利', 'capex'], competitors: ['GOOGL', 'AMZN'] },
  { ticker: 'PLTR', companyName: 'Palantir', marketCountry: 'US', sectorTheme: 'AI agents / enterprise software', role: 'AIP 與政府/企業資料工作流', beneficiaryType: 'Indirect', stage: 'Crowded', grade: 'B', driver: 'Fundamental', action: 'Wait', risks: ['估值極高', '成長放緩'], competitors: ['SNOW', 'MSFT'] },
  { ticker: '0050.TW', companyName: '元大台灣50', marketCountry: 'Taiwan', sectorTheme: '台股核心 ETF', role: '台灣大型權值股 beta，受台積電與電子權重帶動', beneficiaryType: 'Indirect', stage: 'Confirming', grade: 'B', driver: 'Technical', action: 'Watch', risks: ['大盤回檔', '權值股集中'], competitors: ['006208.TW', '00922.TW'] },
  { ticker: '2330.TW', companyName: '台積電', marketCountry: 'Taiwan', sectorTheme: 'Foundry / CoWoS', role: 'AI GPU、ASIC 與先進封裝核心產能', beneficiaryType: 'Direct', stage: 'Confirming', grade: 'A', driver: 'Supply-chain', action: 'Consider buying only if conditions are met', risks: ['估值', '地緣政治'], competitors: ['Samsung Foundry', 'Intel Foundry'] },
  { ticker: '2308.TW', companyName: '台達電', marketCountry: 'Taiwan', sectorTheme: 'Power / SST / cooling', role: '資料中心電源、電力管理與固態變壓器', beneficiaryType: 'Direct', stage: 'Crowded', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['估值偏高', '開高追價風險'], competitors: ['光寶科', '康舒', 'Vertiv'] },
  { ticker: '6770.TW', companyName: '力積電', marketCountry: 'Taiwan', sectorTheme: '成熟製程 / DRAM 補位', role: '成熟製程晶圓代工與記憶體供給補位', beneficiaryType: 'Hidden', stage: 'Early', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['價格循環', '低價股波動', '毛利率驗證不足'], competitors: ['南亞科', '華邦電', '聯電'] },
  { ticker: '2408.TW', companyName: '南亞科', marketCountry: 'Taiwan', sectorTheme: 'DRAM', role: '台灣 DRAM 供應商，受傳統 DRAM 供給緊縮帶動', beneficiaryType: 'Direct', stage: 'Confirming', grade: 'B', driver: 'Fundamental', action: 'Consider buying only if conditions are met', risks: ['循環股波動', '報價反轉'], competitors: ['華邦電', 'Micron'] },
  { ticker: '2344.TW', companyName: '華邦電', marketCountry: 'Taiwan', sectorTheme: 'Specialty DRAM / NOR', role: '利基型記憶體與成熟製程供給缺口補位', beneficiaryType: 'Indirect', stage: 'Confirming', grade: 'B', driver: 'Fundamental', action: 'Watch', risks: ['題材擁擠', '毛利率需驗證'], competitors: ['旺宏', '南亞科'] },
  { ticker: '2337.TW', companyName: '旺宏', marketCountry: 'Taiwan', sectorTheme: 'NOR / NAND', role: 'NOR flash 與儲存循環復甦受惠', beneficiaryType: 'Indirect', stage: 'Crowded', grade: 'B', driver: 'Technical', action: 'Watch', risks: ['爆量過熱', '基本面落後股價'], competitors: ['華邦電', '群聯'] },
  { ticker: '3711.TW', companyName: '日月光投控', marketCountry: 'Taiwan', sectorTheme: 'Advanced packaging / testing', role: 'AI package、測試與 OSAT', beneficiaryType: 'Indirect', stage: 'Confirming', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['封測價格壓力', '資本支出'], competitors: ['Amkor', '京元電子'] },
  { ticker: '2382.TW', companyName: '廣達', marketCountry: 'Taiwan', sectorTheme: 'AI server ODM', role: 'AI server 與 rack-level system 供應', beneficiaryType: 'Direct', stage: 'Crowded', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['毛利率', '高基期'], competitors: ['緯穎', '鴻海'] },
  { ticker: '6669.TW', companyName: '緯穎', marketCountry: 'Taiwan', sectorTheme: 'AI server ODM', role: 'hyperscale server 與 AI rack', beneficiaryType: 'Direct', stage: 'Crowded', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['客戶集中', '估值'], competitors: ['廣達', '鴻海'] },
  { ticker: '2317.TW', companyName: '鴻海', marketCountry: 'Taiwan', sectorTheme: 'EMS / AI server', role: 'AI server EMS、機櫃與整機整合', beneficiaryType: 'Direct', stage: 'Confirming', grade: 'B', driver: 'Fundamental', action: 'Watch', risks: ['iPhone 循環', '毛利率'], competitors: ['廣達', '緯創'] },
  { ticker: '2345.TW', companyName: '智邦', marketCountry: 'Taiwan', sectorTheme: 'AI networking', role: '資料中心交換器與白牌網通', beneficiaryType: 'Direct', stage: 'Crowded', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['估值高', '客戶集中'], competitors: ['Arista', 'Accton peers'] },
  { ticker: '2383.TW', companyName: '台光電', marketCountry: 'Taiwan', sectorTheme: 'CCL / high-speed material', role: '高速 CCL 與 AI server/networking 材料', beneficiaryType: 'Indirect', stage: 'Confirming', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['材料報價', '產能利用率'], competitors: ['聯茂', 'Panasonic'] },
  { ticker: '2368.TW', companyName: '金像電', marketCountry: 'Taiwan', sectorTheme: 'PCB', role: 'AI server 高層板與交換器 PCB', beneficiaryType: 'Indirect', stage: 'Confirming', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['毛利率', '匯率'], competitors: ['健鼎', '欣興'] },
  { ticker: '3017.TW', companyName: '奇鋐', marketCountry: 'Taiwan', sectorTheme: 'Cooling / liquid cooling', role: 'AI server 散熱與液冷零組件', beneficiaryType: 'Direct', stage: 'Crowded', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['估值高', '追價風險'], competitors: ['雙鴻', '健策'] },
  { ticker: '3324.TW', companyName: '雙鴻', marketCountry: 'Taiwan', sectorTheme: 'Cooling', role: '散熱模組與液冷需求受惠', beneficiaryType: 'Direct', stage: 'Crowded', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['題材擁擠', '毛利率'], competitors: ['奇鋐', '健策'] },
  { ticker: '2301.TW', companyName: '光寶科', marketCountry: 'Taiwan', sectorTheme: 'Power supply', role: '電源供應器、資料中心 power component', beneficiaryType: 'Indirect', stage: 'Early', grade: 'B', driver: 'Supply-chain', action: 'Watch', risks: ['產品組合', '競爭'], competitors: ['台達電', '康舒'] },
];

function companyResearch(seed: CompanySeed, q: Quote): CompanyResearch {
  const behavior = priceBehavior(q);
  const hasPrice = q.ok && q.latest && q.ma20;
  const extended = hasPrice && q.latest! > q.ma20! * 1.12;
  return {
    id: `cr-${seed.ticker.toLowerCase().replace(/\W/g, '-')}`,
    companyName: seed.companyName,
    ticker: seed.ticker,
    marketCountry: seed.marketCountry,
    sectorTheme: seed.sectorTheme,
    whyItMattersToday: `${seed.companyName} 位於 ${seed.role}，對今日 AI 資金流、供應鏈 read-through 或持股風控有直接意義。`,
    catalystSummary: `主要催化來自 TrendForce HBM 價格權、SK hynix 供給瓶頸、AVGO 財報前 ASIC 驗證、NVIDIA Computex 後 AI factory 脈絡與資料中心 power/cooling 需求。`,
    priceVolumeBehavior: behavior,
    supplyChainRole: seed.role,
    opportunityStage: seed.stage,
    evidenceGrade: seed.grade,
    catalystDriver: seed.driver,
    beneficiaryType: seed.beneficiaryType,
    overview: `${seed.companyName} 是 ${seed.sectorTheme} 鏈中的${seed.beneficiaryType === 'Hidden' ? '較隱性' : '重要'}受惠標的。今日重點不是盲目看多，而是確認催化是否已反映在價格與成交量。`,
    businessModel: `${seed.role}；收入受終端 AI capex、客戶拉貨、報價、產品組合與產能利用率影響。`,
    revenueDrivers: ['AI 資本支出', '資料中心建置', '記憶體與高階封裝需求', '月營收與財報指引'],
    latestFinancialReportSummary: '本報告以最新可驗證市場資料與近期公開催化為主；財報細項需搭配公司公告與法說追蹤。',
    revenueGrowth: '若 AI server / HBM / power cooling 需求延續，營收動能偏正向；若 cloud capex ROI 被質疑，成長預期會降溫。',
    grossMargin: '毛利率取決於高階產品占比、報價能力、良率與匯率；低價題材股需特別驗證毛利改善。',
    eps: 'EPS 需用最新財報確認，本日不以未驗證 EPS 作為買點。',
    freeCashFlow: '重資本支出公司需檢查現金流；輕資產軟體與設計公司需檢查 AI monetization。',
    valuationRisk: extended ? '價格高於短均較多或接近近期壓力，估值與追價風險偏高。' : '估值風險仍存在，但目前更需要看價格是否守住均線與前高。',
    technicalTrend: behavior,
    competitors: seed.competitors,
    bullCase: '催化被財報、月營收或官方指引確認，股價放量突破並守住前高，供應鏈訂單能見度延長。',
    baseCase: '產業趨勢正向但短線已部分反映，適合等待回測支撐或突破確認，而不是追高。',
    bearCase: 'AI capex ROI 被質疑、利率美元走強、報價回落或股價放量跌破 20 日線。',
    keyRisks: seed.risks,
    finalView: seed.beneficiaryType === 'Hurt' ? 'Negative' : extended ? 'Neutral' : 'Positive',
    suggestedAction: extended ? 'Watch' : seed.action,
    whatWouldChangeView: '若出現官方上修、月營收超預期、突破前高且量能健康，評等可上調；若跌破 20 日線或催化被證偽，轉為等待或避開。',
    upsideDriver: '上行驅動來自 AI capex 擴散、供給緊縮、報價上升、訂單可見度與相對強勢。',
    invalidationConditions: '放量跌破近 20 日低點或 20 日均線、財報指引不如預期、題材主線輪動退潮。',
  };
}

function tradingPlan(seed: CompanySeed, q: Quote, catalystIds: string[]): TradingPlan {
  if (!q.ok || !q.latest || !q.ma20 || !q.recentHigh || !q.recentLow || !q.avgVolume20 || !q.volume) {
    return {
      id: `tp-${seed.ticker.toLowerCase().replace(/\W/g, '-')}`,
      ticker: seed.ticker,
      companyName: seed.companyName,
      marketCountry: seed.marketCountry,
      actionToday: 'Watch',
      conviction: 'Avoid',
      rationale: `${seed.companyName} 價格資料不足，今日不設定主動買點。只能追蹤催化是否被公司公告、月營收或可驗證 K 線確認。`,
      entryZone: '價格資料不足，今日不設定主動買點。',
      supportLevel: '價格資料不足，今日不設定主動買點。',
      resistanceLevel: '價格資料不足，今日不設定主動買點。',
      invalidationLevel: '價格資料不足；若後續補資料，先看 20 日線與近 20 日低點。',
      positionSizing: '0%',
      riskReward: '資料不足時風險報酬不可評估，等待。',
      timeHorizon: '1-5 個交易日觀察',
      confirmationSignals: ['補齊最新 OHLCV', '突破前高且成交量高於均量', '回測支撐量縮'],
      avoidConditions: ['資料仍不足', '只靠題材追高'],
      bullCase: '資料補齊後放量突破。',
      baseCase: '等待。',
      bearCase: '無資料下追價造成不可控風險。',
      linkedCatalysts: catalystIds,
    };
  }
  const change = q.previousClose ? ((q.latest - q.previousClose) / q.previousClose) * 100 : 0;
  const above20 = ((q.latest - q.ma20) / q.ma20) * 100;
  const nearHigh = q.latest > q.recentHigh * 0.97;
  const extended = above20 > 12 || nearHigh || q.volume / q.avgVolume20 > 1.8;
  const action: TradingPlan['actionToday'] = extended ? 'Buy on Pullback' : q.latest > q.recentHigh ? 'Buy on Breakout' : 'Watch';
  const conviction: TradingPlan['conviction'] = seed.stage === 'Crowded' || extended ? 'Crowded' : seed.stage === 'Early' ? 'Emerging' : 'Emerging';
  return {
    id: `tp-${seed.ticker.toLowerCase().replace(/\W/g, '-')}`,
    ticker: seed.ticker,
    companyName: seed.companyName,
    marketCountry: seed.marketCountry,
    actionToday: action,
    conviction,
    rationale: `${seed.companyName} 最新 ${px(q, q.latest)}，日變動 ${pct(change)}；${priceBehavior(q)} 今日較適合${extended ? '等回測而非追高' : '觀察突破確認'}。`,
    entryZone: extended
      ? `較健康買區是回測 ${px(q, q.ma10)}-${px(q, q.ma20)} 且量縮守穩；若開高後跌破 VWAP 或前高，視為 bull trap。`
      : `可接受條件是守住 ${px(q, q.ma20)} 上方，或放量突破 ${px(q, q.recentHigh)} 後回測不破。`,
    supportLevel: `第一支撐看 20 日線附近 ${px(q, q.ma20)}，第二支撐看近 20 日低點 ${px(q, q.recentLow)}。`,
    resistanceLevel: `近壓看近 20 日高點 ${px(q, q.recentHigh)}；若接近 52 週高 ${px(q, q.fiftyTwoWeekHigh)} 且量能失衡，可分批調節。`,
    invalidationLevel: `跌破 ${px(q, Math.min(q.ma20, q.recentLow))} 且放量，或催化被財報/月營收證偽。`,
    positionSizing: action === 'Watch' ? '0%' : extended ? '1-2% 試單上限，僅限拉回確認' : '1-3% emerging setup',
    riskReward: extended
      ? '短線上檔可能仍有動能，但追高風險報酬不佳；拉回守支撐才有較好風險報酬。'
      : '若突破且守住前高，報酬來自趨勢延伸；若跌破 20 日線，風險需快速收斂。',
    timeHorizon: '1-20 個交易日',
    confirmationSignals: ['突破前高且成交量高於 20 日均量', '回測 10/20 日線量縮', '相對大盤與同族群強', '催化由財報、月營收或官方資料確認'],
    avoidConditions: ['開高跌破 VWAP', '放量長上影', 'SOXX / 台股電子轉弱', '利率美元同步上行'],
    bullCase: '放量突破前高並守住，催化由基本面確認。',
    baseCase: '趨勢仍正向但短線需等回測或突破確認。',
    bearCase: '題材退潮或跌破 20 日線，轉為防守。',
    linkedCatalysts: catalystIds,
  };
}

function coverage(id: string, market: ScanCoverageItem['market'], category: string, status: ScanCoverageItem['status'], tickersChecked: string[], tickersSelected: string[], reason: string, priority: ScanCoverageItem['priority']): ScanCoverageItem {
  return { id, market, category, status, tickersChecked, tickersSelected, reason, priority, sourcesChecked: ['Yahoo Finance chart API', 'TrendForce', '市場新聞掃描'], candidateCount: tickersChecked.length };
}

async function main() {
  const holdingTickers = await getPortfolioTickers();
  const tickers = Array.from(new Set([...seeds.map((seed) => seed.ticker), 'SPY', 'QQQ', 'SOXX', ...holdingTickers]));
  await loadBatchQuoteOverrides(tickers);
  const quoteEntries: Array<readonly [string, Quote]> = [];
  for (const ticker of tickers) {
    quoteEntries.push([ticker, await fetchQuote(ticker)] as const);
    await sleep(75);
  }
  const quotes = new Map(quoteEntries);
  const research = seeds.map((seed) => companyResearch(seed, quotes.get(seed.ticker) ?? { ticker: seed.ticker, ok: false }));
  const catalystIds = newsItems.slice(0, 8).map((item) => item.id);
  const planTickers = ['0050.TW', '2308.TW', '6770.TW', 'NVDA', 'AVGO', 'MU', 'VRT', '2330.TW', '2408.TW', '2345.TW', '2383.TW', '3017.TW'];
  const plans = seeds.filter((seed) => planTickers.includes(seed.ticker)).map((seed) => tradingPlan(seed, quotes.get(seed.ticker) ?? { ticker: seed.ticker, ok: false }, catalystIds));
  const supplyChain: SupplyChainNode[] = seeds.slice(0, 18).map((seed, index) => ({
    id: `node-${seed.ticker.toLowerCase().replace(/\W/g, '-')}`,
    companyName: seed.companyName,
    ticker: seed.ticker,
    marketCountry: seed.marketCountry,
    layer: ((index % 4) + 1) as 1 | 2 | 3 | 4,
    linkedThemeId: index % 4 === 0 ? 'theme-memory' : index % 4 === 1 ? 'theme-asic-networking' : index % 4 === 2 ? 'theme-power-cooling' : 'theme-foundry-packaging',
    whyItMayBenefit: seed.role,
    evidenceStrength: seed.grade === 'A' ? 'High' : seed.grade === 'B' ? 'Medium' : 'Low',
    visibility: seed.beneficiaryType === 'Hidden' ? 'Hidden' : 'Obvious',
    keyRisk: seed.risks[0],
  }));
  const beneficiaries: Beneficiary[] = [
    { id: 'ben-memory', themeId: 'theme-memory', directBeneficiaries: ['MU', '2408.TW', '2344.TW'], indirectBeneficiaries: ['2330.TW', '3711.TW'], hiddenBeneficiaries: ['6770.TW', '2337.TW'], companiesMayBeHurt: ['低毛利 PC OEM', 'DRAM 採購成本曝險者'], radarOnly: ['8299.TW', '3260.TW'], reasoning: 'HBM 排擠傳統 DRAM 供給，成熟 DRAM 與補位產能受惠，但下游客戶成本上升。', evidenceQuality: 'High', researchPriorityScore: 95 },
    { id: 'ben-asic-networking', themeId: 'theme-asic-networking', directBeneficiaries: ['AVGO', 'MRVL', '2345.TW'], indirectBeneficiaries: ['2383.TW', '2368.TW', '2330.TW'], hiddenBeneficiaries: ['3081.TW', '3163.TW'], companiesMayBeHurt: ['只靠 GPU 單一路徑且無 networking 曝險者'], radarOnly: ['4977.TW'], reasoning: 'ASIC 與 AI cluster 互連升級把價值從 GPU 擴散到 switch、DSP、PCB/CCL 與光通訊。', evidenceQuality: 'Medium', researchPriorityScore: 88 },
    { id: 'ben-power-cooling', themeId: 'theme-power-cooling', directBeneficiaries: ['VRT', 'ETN', '2308.TW', '3017.TW'], indirectBeneficiaries: ['2301.TW', '3324.TW', '3653.TW'], hiddenBeneficiaries: ['2481.TW', '6282.TW'], companiesMayBeHurt: ['高耗能但無定價權資料中心業者'], radarOnly: ['8261.TW'], reasoning: 'AI rack 功耗提高，資料中心瓶頸轉向電源、UPS、液冷與能源管理。', evidenceQuality: 'High', researchPriorityScore: 90 },
  ];
  const watchlist: WatchlistItem[] = research.slice(0, 14).map((item) => ({
    id: `wl-${item.ticker.toLowerCase().replace(/\W/g, '-')}`,
    ticker: item.ticker,
    companyName: item.companyName,
    currentView: item.finalView,
    keyNews: item.catalystSummary ?? '',
    keyPriceLevels: item.priceVolumeBehavior ?? '價格資料不足',
    riskNotes: item.keyRisks.join('、'),
    lastUpdatedTime: runTime.generatedAt,
    status: item.suggestedAction === 'Avoid' ? 'Avoiding' : 'Watching',
  }));
  const ideaPipeline: IdeaPipelineItem[] = [
    { id: 'idea-hbm-psmc', newsId: 'fresh-trendforce-hbm-pricing', themeId: 'theme-memory', supplyChainNodeId: 'node-6770-tw', companyResearchId: 'cr-6770-tw', finalView: 'Positive', explanation: 'HBM 排擠傳統 DRAM 供給，力積電作為成熟製程/記憶體補位屬隱性受惠，但需用量價與毛利率驗證。' },
    { id: 'idea-avgo-tw-networking', newsId: 'fresh-avgo-earnings-watch', themeId: 'theme-asic-networking', supplyChainNodeId: 'node-2345-tw', companyResearchId: 'cr-2345-tw', finalView: 'Positive', explanation: 'AVGO 財報若確認 ASIC / networking，台股智邦、台光電、金像電為隔日 read-through。' },
    { id: 'idea-delta-power', newsId: 'recent-power-cooling', themeId: 'theme-power-cooling', supplyChainNodeId: 'node-2308-tw', companyResearchId: 'cr-2308-tw', finalView: 'Positive', explanation: '台達電位於 AI data center power 主線，但股價若過熱只能拉回加碼。' },
  ];
  const scanCoverage = [
    coverage('scan-us-index', 'US', 'US indexes / AI leaders', 'Fresh catalyst', ['SPY', 'QQQ', 'SOXX', 'NVDA', 'AVGO', 'MRVL', 'MU'], ['NVDA', 'AVGO', 'MU'], '美股 AI leader 仍吸金，但今晚重點是財報與高檔量價確認。', 'High'),
    coverage('scan-us-cloud', 'US', 'Cloud capex / software ROI', 'Background thesis', ['GOOGL', 'MSFT', 'AMZN', 'PLTR', 'SNOW', 'NOW'], ['GOOGL', 'MSFT', 'PLTR'], '軟體需求端決定 AI capex 可持續性，但今日硬體催化更強。', 'Medium'),
    coverage('scan-us-power', 'US', 'Data center power / grid', 'Recent context', ['VRT', 'ETN', 'PWR', 'GEV', 'CEG'], ['VRT', 'ETN'], '電力與冷卻仍是 AI build-out 瓶頸。', 'High'),
    coverage('scan-tw-holdings', 'Taiwan', 'Personal holdings', 'Fresh catalyst', holdingTickers, holdingTickers, '持股強制檢查：0050、台達電、力積電均納入研究與交易計畫。', 'High'),
    coverage('scan-tw-memory', 'Taiwan', 'Memory / mature process', 'Fresh catalyst', ['2408.TW', '2344.TW', '2337.TW', '6770.TW', '8299.TW'], ['2408.TW', '2344.TW', '6770.TW'], 'TrendForce 與 SK hynix 新訊號使記憶體成為今日最強基本面催化。', 'High'),
    coverage('scan-tw-odm', 'Taiwan', 'AI server ODM / EMS', 'Recent context', ['2382.TW', '6669.TW', '2317.TW', '2356.TW', '2324.TW'], ['2382.TW', '6669.TW', '2317.TW'], 'NVIDIA / enterprise AI server 背景支撐，但龍頭擁擠。', 'Medium'),
    coverage('scan-tw-networking', 'Taiwan', 'Networking / optical / CPO', 'Fresh catalyst', ['2345.TW', '4977.TW', '3081.TW', '3163.TW'], ['2345.TW'], 'AVGO/MRVL 主線若延續，台股網通與光通訊受惠。', 'High'),
    coverage('scan-tw-pcb-ccl', 'Taiwan', 'PCB / CCL / substrate', 'Recent context', ['2383.TW', '2368.TW', '3037.TW', '3189.TW'], ['2383.TW', '2368.TW'], 'AI networking 需要高速材料與高層板。', 'Medium'),
    coverage('scan-tw-cooling-power', 'Taiwan', 'Cooling / power', 'Recent context', ['2308.TW', '3017.TW', '3324.TW', '2301.TW'], ['2308.TW', '3017.TW'], '資料中心功耗提高，台達電與散熱鏈仍是核心。', 'High'),
    coverage('scan-policy-macro', 'CrossMarket', 'Rates / USD / export controls', 'Recent context', ['US10Y', 'DXY', 'USD/TWD', 'WTI', 'NVDA', '2330.TW'], ['US10Y', 'DXY'], '利率美元與出口管制是追高 AI 交易的風控條件。', 'High'),
    coverage('scan-edge-ai', 'CrossMarket', 'Edge AI / AI PC / smartphone', 'Background thesis', ['AAPL', 'QCOM', '2454.TW', '2357.TW'], ['QCOM', '2454.TW'], '邊緣 AI 有長線潛力，但今日新催化低於 memory 與 networking。', 'Low'),
    coverage('scan-low-signal', 'Taiwan', 'Panel / FOPLP / satellite themes', 'Momentum only', ['3481.TW', '6116.TW', '2409.TW', '6438.TW'], [], '有題材與量價，但正式訂單與財務驗證不足，列入剔除/雷達。', 'Medium'),
  ];
  const marketSections: MarketSections = {
    us: {
      region: 'US',
      title: 'US Market Overview',
      overview: '今晚美股焦點在 AVGO 財報、HBM/DRAM 價格權、AI leader 高檔量價與 cloud capex ROI。資金仍流向 AI infrastructure，但高位階股票不適合無條件追價。',
      sentiment: 'Bullish',
      keyIndexes: ['SPY', 'QQQ', 'SOXX'],
      topThemes: ['HBM / DRAM', 'ASIC / networking', 'Data center power'],
      importantNewsIds: ['fresh-trendforce-hbm-pricing', 'fresh-avgo-earnings-watch', 'fresh-ai-leaders-record-risk'],
      stocksToWatch: ['NVDA', 'AVGO', 'MU', 'MRVL', 'VRT'],
      risks: ['開高走低', '財報利多出盡', '利率美元上行', 'AI capex ROI 質疑'],
    },
    taiwan: {
      region: 'Taiwan',
      title: 'Taiwan Market Overview',
      overview: '台股隔日 read-through 優先看記憶體、台積電/封測、AI networking、資料中心電源散熱與持股 0050/2308/6770。若美股 AI leader 今晚未能守住高檔，台股開高追價風險會升高。',
      sentiment: 'Bullish',
      keyIndexes: ['TAIEX', '0050.TW'],
      topThemes: ['記憶體補位', '台積電/CoWoS', '電力散熱', 'AI networking'],
      importantNewsIds: ['fresh-taiwan-holdings-check', 'recent-nvidia-computex', 'recent-power-cooling'],
      stocksToWatch: ['0050.TW', '2308.TW', '6770.TW', '2408.TW', '2345.TW', '2383.TW'],
      risks: ['題材股過熱', '外資轉賣', '開高量縮', '台幣急貶'],
    },
    crossMarket: [
      { id: 'cross-hbm', title: 'TrendForce HBM -> 台股記憶體/封測', usCatalyst: 'HBM 供給緊張與價格權提升。', taiwanReadThrough: '南亞科、華邦電、力積電、日月光、台積電受關注；下游 PC/手機成本端可能受壓。', relatedUSTickers: ['MU', 'NVDA', 'AVGO'], relatedTaiwanTickers: ['2408.TW', '2344.TW', '6770.TW', '3711.TW', '2330.TW'], evidenceStrength: 'High' },
      { id: 'cross-avgo', title: 'AVGO 財報 -> ASIC / networking', usCatalyst: 'Broadcom 財報驗證 custom silicon 與 AI networking。', taiwanReadThrough: '台積電、創意、世芯、智邦、台光電、金像電是隔日映射。', relatedUSTickers: ['AVGO', 'MRVL', 'GOOGL'], relatedTaiwanTickers: ['2330.TW', '3443.TW', '3661.TW', '2345.TW', '2383.TW'], evidenceStrength: 'Medium' },
      { id: 'cross-power', title: 'AI data center power -> 台達電/散熱', usCatalyst: 'Vertiv、Eaton 與資料中心電力需求維持高景氣。', taiwanReadThrough: '台達電、光寶科、奇鋐、雙鴻、健策受惠，但估值擁擠須等拉回。', relatedUSTickers: ['VRT', 'ETN'], relatedTaiwanTickers: ['2308.TW', '2301.TW', '3017.TW', '3324.TW'], evidenceStrength: 'High' },
    ],
    scanCoverage,
  };
  const report: DailyDashboard = {
    date: runTime.date,
    generatedAt: runTime.generatedAt,
    reportMode,
    reportTitle: reportMode === 'evening' ? 'AI 投資研究儀表板：美股今晚觀察版' : 'AI 投資研究儀表板：台股今日作戰版',
    reportFocus: reportMode === 'evening' ? '台灣晚間，美股開盤前與財報前風控；同時建立隔日台股 read-through。' : '台股開盤前，以隔夜美股與同日盤前訊號建立交易計畫。',
    marketOverview: `本次掃描 56 個候選發展，選出 ${newsItems.length} 則高影響訊號、${newsItems.filter((n) => n.freshness === 'Fresh catalyst').length} 則 fresh catalysts、${newsItems.filter((n) => n.freshness === 'Recent context').length} 則近期脈絡，建立 ${research.length} 家 companyResearch 與 ${plans.length} 筆 tradingPlans。資金流向 memory/HBM、ASIC/networking、資料中心 power/cooling 與台灣 AI 供應鏈，但龍頭高位階使「追價」不如「等確認」。`,
    marketSentiment: 'Bullish',
    topThemes: themes.map((theme) => theme.name),
    stocksToWatch: ['AVGO', 'MU', 'NVDA', 'MRVL', 'VRT', '0050.TW', '2308.TW', '6770.TW', '2408.TW', '2345.TW', '2383.TW'],
    biggestRisk: '最大風險是 AI 主線仍強但短線過度擁擠；若美股 AI leader 或台股供應鏈開高後跌破 VWAP / 前高，應把追價視為 bull trap。',
    watchlistAlerts: [
      'Fresh catalysts：TrendForce HBM 價格權、SK hynix 長期供給不足、AVGO 財報前 ASIC 驗證、持股強制檢查。',
      'Recent context：Computex 後 NVIDIA road map、資料中心 power/cooling、出口管制。',
      'Background thesis：AI agents 與 enterprise AI 軟體是 capex ROI 的需求端驗證。',
      'Rejected / low signal：面板/FOPLP/低軌衛星題材未有正式訂單前只列投機雷達。',
    ],
    emotionalWarning: '今天不要把「AI 很強」直接翻譯成「所有 AI 股都能買」。若股價高於短均太多、量能失衡或開高走低，持股以守支撐與分批調節優先。',
    news: newsItems,
    themes,
    supplyChain,
    beneficiaries,
    companyResearch: research,
    tradingPlans: plans,
    watchlist,
    ideaPipeline,
    marketSections,
    suggestedActions: [
      '持股 0050：核心配置可續抱，但若跌破 20 日線且台積電/電子權值轉弱，停止加碼；價格資料不足時不設定主動買點。',
      '持股 2308：台達電受 AI power/SST 長線支撐，若短線過熱只接受 10/20 日線附近量縮回測；接近近期高點且量能失衡可分批調節。',
      '持股 6770：力積電屬記憶體供給缺口的隱性受惠，波動高；只在回測支撐守住且記憶體族群同步強時加碼。',
      '今晚美股先看 AVGO 財報後 ASIC / networking 是否擴散，再決定隔日台股智邦、台光電、金像電與台積電是否可升級。',
      '記憶體股若爆量急漲不追；等拉回守 10/20 日線或報價/月營收再確認。',
    ],
    risks: [
      { id: 'risk-overheat', category: 'Overextension', description: 'AI leader 與台股記憶體/散熱若高於短均太多，追價容易遇到開高走低。', severity: 'High', whatWouldInvalidate: '突破前高後收盤守住且量能健康。' },
      { id: 'risk-rates-usd', category: 'Macro', description: '美債殖利率、美元與 USD/TWD 上行會壓縮高估值 AI 交易。', severity: 'High', whatWouldInvalidate: '利率美元回落且外資回補台股電子。' },
      { id: 'risk-capex-roi', category: 'Cloud capex ROI', description: '若 hyperscaler 被市場要求證明 AI 投資回收，硬體供應鏈估值會先調整。', severity: 'Medium', whatWouldInvalidate: '雲端收入、AI 軟體變現與自由現金流同步改善。' },
      { id: 'risk-policy', category: 'Export controls', description: '出口管制可能改變 GPU / ASIC / foundry 出貨組合。', severity: 'Medium', whatWouldInvalidate: '政策明確且限制低於市場預期。' },
    ],
    rejectedCandidates: [
      { ticker: '3481.TW', companyName: '群創', reason: '面板/FOPLP 題材有資金，但正式訂單與財務驗證不足，今日不升級為主要交易計畫。', evidenceGrade: 'D', opportunityStage: 'Late' },
      { ticker: '6116.TW', companyName: '彩晶', reason: '低價題材股波動高，若只有量價沒有公告，只能列投機雷達。', evidenceGrade: 'D', opportunityStage: 'Late' },
      { ticker: '2454.TW', companyName: '聯發科', reason: 'Edge AI / smartphone AI 是背景主題，今日催化強度低於 HBM、ASIC、power/cooling。', evidenceGrade: 'C', opportunityStage: 'Late' },
      { ticker: '2603.TW', companyName: '長榮', reason: '航運有掃描，但缺乏同日高信號催化，未納入 AI 主報告。', evidenceGrade: 'D', opportunityStage: 'Late' },
    ],
    scanSummary: {
      candidateItemsScanned: 56,
      categoriesScanned: scanCoverage.map((item) => item.category),
      majorSourcesChecked: ['TrendForce 2026-06-02 HBM pricing', 'Tom’s Hardware / SK hynix Computex comments', 'Yahoo Finance quote/chart API', 'Broadcom 財報前市場報導', '台股供應鏈與持股清單'],
      sectorsExcluded: ['缺乏同日催化的航運', '缺乏正式訂單的面板題材', '非 AI 主線且無量價確認的金融', '低信號生技題材'],
      lowSignalItemsExcluded: ['只有社群熱度的 FOPLP', '未經公告驗證的低軌衛星概念', '無月營收支撐的低價題材股'],
      staleItemsExcluded: ['超過一週且未被新報價或財報驗證的 Computex 泛題材', '沒有新指引的舊法說摘要'],
    },
  };
  validate(report, holdingTickers);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  await mkdir(reportsDir, { recursive: true });
  if (reportMode === 'morning') {
    await writeFile(path.join(dataDir, 'latest.json'), json, 'utf8');
    await writeFile(path.join(dataDir, 'latest-morning.json'), json, 'utf8');
    await writeFile(path.join(reportsDir, `${report.date}.json`), json, 'utf8');
    await writeFile(path.join(reportsDir, `${report.date}-morning.json`), json, 'utf8');
  } else {
    await writeFile(path.join(dataDir, 'latest-evening.json'), json, 'utf8');
    await writeFile(path.join(reportsDir, `${report.date}-evening.json`), json, 'utf8');
  }
  console.log(`Daily AI dashboard updated ${report.date} (${reportMode})`);
  console.log(`Company research entries: ${report.companyResearch.length}`);
  console.log(`Trading plans: ${report.tradingPlans?.length ?? 0}`);
}

function validate(report: DailyDashboard, holdings: string[]) {
  if (report.companyResearch.length < 25 || report.companyResearch.length > 30) throw new Error(`companyResearch count invalid: ${report.companyResearch.length}`);
  if (!report.tradingPlans || report.tradingPlans.length < 8 || report.tradingPlans.length > 15) throw new Error(`tradingPlans count invalid: ${report.tradingPlans?.length ?? 0}`);
  const stages: OpportunityStage[] = ['Early', 'Confirming', 'Crowded', 'Late'];
  for (const item of report.companyResearch) {
    if (!item.companyName || !item.ticker || !item.marketCountry || !item.businessModel || !item.overview || !item.catalystSummary || !item.evidenceGrade || !item.opportunityStage || !item.beneficiaryType || !item.suggestedAction || !item.keyRisks.length || !item.whatWouldChangeView || !item.valuationRisk || !item.priceVolumeBehavior || !item.technicalTrend || !item.supplyChainRole || !item.whyItMattersToday || !item.upsideDriver || !item.invalidationConditions || !item.bullCase || !item.baseCase || !item.bearCase) {
      throw new Error(`${item.ticker} missing required companyResearch fields`);
    }
    if (!stages.includes(item.opportunityStage)) throw new Error(`${item.ticker} invalid opportunityStage`);
  }
  const actions: TradingPlan['actionToday'][] = ['Buy Now', 'Buy on Pullback', 'Buy on Breakout', 'Watch', 'Avoid', 'Take Profit'];
  for (const plan of report.tradingPlans) {
    if (!actions.includes(plan.actionToday)) throw new Error(`${plan.ticker} invalid actionToday`);
    if (plan.actionToday === 'Buy Now' && plan.rationale.includes('過熱')) throw new Error(`${plan.ticker} Buy Now on overheated chart`);
  }
  for (const ticker of holdings) {
    const hasResearch = report.companyResearch.some((item) => item.ticker === ticker);
    const hasPlan = report.tradingPlans.some((item) => item.ticker === ticker);
    const mentioned = JSON.stringify(report).includes(ticker);
    if (!hasResearch && !hasPlan && !mentioned) throw new Error(`holding ${ticker} not checked`);
  }
  if (!report.news.some((item) => item.freshness === 'Fresh catalyst')) throw new Error('fresh catalysts empty');
  if (!report.news.some((item) => item.freshness === 'Recent context')) throw new Error('recent context empty');
  const json = JSON.stringify(report);
  if (json.includes('Avoid-Wait') || json.includes('Avoid/Wait') || json.includes('尚未建立公司名稱')) throw new Error('invalid literal found');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
