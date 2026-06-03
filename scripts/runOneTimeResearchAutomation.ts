import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  Beneficiary,
  BeneficiaryType,
  CatalystDriver,
  CompanyResearch,
  DailyDashboard,
  EvidenceGrade,
  FinalView,
  IdeaPipelineItem,
  MarketSections,
  NewsItem,
  OpportunityStage,
  ScanCoverageItem,
  SupplyChainNode,
  Theme,
  WatchlistItem,
} from '../src/types/research';

type ReportMode = 'morning' | 'evening';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const reportsDir = path.join(dataDir, 'reports');
const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
const reportMode = (modeArg?.split('=')[1] ?? process.env.REPORT_MODE ?? 'morning') as ReportMode;

if (!['morning', 'evening'].includes(reportMode)) {
  throw new Error(`Unsupported report mode: ${reportMode}. Expected morning or evening.`);
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
    displayTime: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`,
  };
}

const runTime = taiwanRunTime();
const date = runTime.date;
const modeLabel = reportMode === 'morning' ? '台股今日作戰版' : '美股今晚觀察版';
const latestModeFile = reportMode === 'morning' ? 'latest-morning.json' : 'latest-evening.json';
const reportFileSuffix = reportMode === 'morning' ? 'morning' : 'evening';

const freshnessLabel = (freshness: NonNullable<NewsItem['freshness']>) =>
  freshness === 'Fresh catalyst'
    ? '新催化'
    : freshness === 'Recent context'
      ? '近期脈絡'
      : freshness === 'Background thesis'
        ? '背景論點'
        : freshness === 'Momentum only'
          ? '純量價'
          : '無訊號';

function news(
  id: string,
  title: string,
  source: string,
  summary: string,
  relatedTickers: string[],
  impact: NewsItem['impact'],
  confidence: NewsItem['confidence'],
  freshness: NonNullable<NewsItem['freshness']>,
  evidenceGrade: EvidenceGrade,
  catalystDriver: CatalystDriver,
  whyMarketCares: string,
  pricedIn: string,
  confirms: string,
  invalidates: string,
): NewsItem {
  return {
    id,
    title: `【${freshnessLabel(freshness)}】${title}`,
    source,
    date,
    summary,
    relatedTickers,
    impact,
    confidence,
    freshness,
    evidenceGrade,
    opportunityStage: freshness === 'Fresh catalyst' ? 'Confirming' : freshness === 'Momentum only' ? 'Crowded' : 'Early',
    catalystDriver,
    whyMarketCares,
    pricedIn,
    confirms,
    invalidates,
  };
}

const newsItems: NewsItem[] = [
  news(
    'fresh-us-ai-record-close',
    '美股大型科技與 AI 基礎建設續強，S&P 500 與 Nasdaq 刷新高，SOX 維持風險偏好',
    '2026-06-02 美股收盤、Reuters / MarketWatch / Nasdaq 市場綜合',
    '昨夜美股由 AI、半導體與大型科技延續領漲，市場仍願意給 AI capex 受益鏈較高風險承受度。台股早盤 read-through 先看台積電、AI server ODM、網通、散熱電源與記憶體能否接棒，而非單看 NVIDIA 一檔。',
    ['NVDA', 'AVGO', 'MRVL', 'AMD', 'MU', '2330.TW', '2382.TW', '6669.TW'],
    'Positive',
    'High',
    'Fresh catalyst',
    'B',
    'Technical',
    '指數創高代表資金仍在 AI 主線內，但也提高追價後的波動風險。',
    '龍頭股已有擁擠，第二層供應鏈需用量價與營收確認。',
    '台股 AI 供應鏈早盤放量並守住漲幅。',
    '美股期貨轉弱或台股開高走低。',
  ),
  news(
    'fresh-mrvl-jensen',
    'Jensen Huang 點名 Marvell 具 AI 基建關鍵地位，ASIC / 光互連題材升溫',
    '2026-06-02 CNBC / Barron\'s / 市場報導綜合',
    'Marvell 因 NVIDIA CEO 對 AI infrastructure 角色的公開評論獲資金重估，市場焦點從 GPU 延伸到 custom silicon、DSP、光模組與高速互連。台股對應智邦、眾達、聯亞、波若威、台光電與金像電。',
    ['MRVL', 'AVGO', 'NVDA', '2345.TW', '4977.TW', '3081.TW', '3163.TW', '2383.TW'],
    'Positive',
    'High',
    'Fresh catalyst',
    'B',
    'Supply-chain',
    'AI cluster 擴建瓶頸正在往網路與光互連下沉。',
    'MRVL 短線已反映一部分情緒，台股需看實際委買與成交量。',
    '光通訊、交換器與高速板材同步轉強。',
    'MRVL 漲幅回吐或台股網通族群量縮。',
  ),
  news(
    'fresh-hpe-earnings',
    'HPE 財報與 AI server demand 強於預期，企業 AI 基建需求仍有支撐',
    '2026-06-02 HPE 財報與盤後市場反應綜合',
    'HPE 盤後財報釋出伺服器與 AI 訂單訊號，有助緩和市場對企業端 AI infrastructure 只靠 hyperscaler 的疑慮。台股 read-through 指向廣達、緯穎、鴻海、英業達、神達，以及電源、散熱與機櫃零組件。',
    ['HPE', 'DELL', 'SMCI', '2382.TW', '6669.TW', '2317.TW', '2356.TW', '3706.TW'],
    'Positive',
    'High',
    'Fresh catalyst',
    'B',
    'Fundamental',
    '企業 AI server 需求若擴散，台灣 ODM 受益面會比單一雲端客戶更寬。',
    '龍頭 ODM 評價偏高，低基期 ODM 還需要毛利率驗證。',
    'ODM 族群開盤強於大盤且非只靠單一低價股。',
    'HPE 指引細節顯示毛利壓力或訂單能見度不足。',
  ),
  news(
    'fresh-google-ai-debt',
    'Alphabet AI 投資與債務融資引發 ROI 討論，capex 交易進入驗證期',
    '2026-06-02 Bloomberg / Reuters / 債市與科技股報導綜合',
    'Alphabet 因 AI investment / financing 訊號讓市場重新檢查大型科技 capex 是否會壓縮自由現金流。這不是 AI 空頭訊號，而是提醒高估值硬體供應鏈接下來要看 monetization 與雲端毛利。',
    ['GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'AVGO'],
    'Neutral',
    'Medium',
    'Fresh catalyst',
    'B',
    'Macro',
    'AI 基建需求仍強，但市場開始要求投資回收證據。',
    '大型科技仍有現金流支撐，短線不宜過度解讀成需求反轉。',
    '雲端營收與毛利同步改善。',
    '科技債利差擴大或雲端股全面轉弱。',
  ),
  news(
    'fresh-us-rates-dollar',
    '美債殖利率、美元與油價仍是 AI 高估值交易的逆風檢查項',
    '2026-06-02 MacroMicro / Investing / 市場價格綜合',
    '美股創高下，10 年期美債、美元指數、USD/TWD 與油價仍需放在第一層檢查。若利率與美元走強，台股高本益比 AI server、散熱與光通訊會先受估值壓縮。',
    ['QQQ', 'SOXX', 'NVDA', '2330.TW', '6669.TW', '3017.TW'],
    'Neutral',
    'Medium',
    'Fresh catalyst',
    'B',
    'Macro',
    '資金成本決定高估值 AI 交易的持續性。',
    '目前仍屬風險偏好環境，但不適合忽略匯率與利率。',
    '利率回落且美元不再上行。',
    'DXY 與美債殖利率同步上行。',
  ),
  news(
    'fresh-tw-preopen-ai',
    '台股盤前焦點集中 AI server、台積電、記憶體與網通光通訊',
    '2026-06-03 台灣盤前券商與財經媒體綜合',
    '台灣今日開盤前的有效訊號不是固定名單，而是美股 AI 基建延續、MRVL 光互連題材、HPE server demand 與記憶體報價脈絡共同指向的族群輪動。',
    ['2330.TW', '2382.TW', '6669.TW', '2345.TW', '2344.TW', '2408.TW'],
    'Positive',
    'Medium',
    'Fresh catalyst',
    'B',
    'Mixed',
    '台股早盤最容易反應美股隔夜 read-through。',
    '熱門族群已有擁擠，不宜把所有 AI 名單都列為買點。',
    '開盤後買盤擴散到二線但成交結構健康。',
    '開高後量縮或資金轉往非科技防禦股。',
  ),
  news(
    'recent-nvidia-computex',
    'Computex 後 NVIDIA Blackwell / Rubin / AI factory 敘事仍支撐台灣供應鏈',
    '2026-05-28 至 2026-06-02 Computex 與產業鏈報導綜合',
    'NVIDIA 平台節奏仍是台股中期背景，但今天只作為近期脈絡，不當成新的同日新聞。台積電、鴻海、廣達、緯穎、台達電、奇鋐、雙鴻、台光電與智邦仍是核心映射。',
    ['NVDA', '2330.TW', '2317.TW', '2382.TW', '6669.TW', '2308.TW', '3017.TW'],
    'Positive',
    'High',
    'Recent context',
    'B',
    'Supply-chain',
    'NVIDIA road map 對台灣供應鏈訂單能見度仍有影響。',
    '市場已高度熟悉，今天需要用新量價確認。',
    '供應鏈法說或月營收再上修。',
    'Blackwell 交付或客戶導入延遲。',
  ),
  news(
    'recent-memory-pricing',
    'DRAM / NAND / HBM 漲價與庫存循環仍支持記憶體雷達',
    '2026-05-29 至 2026-06-03 TrendForce / 產業報價與市場報導綜合',
    '記憶體不是只有 AI 題材，還有供需循環、報價、庫存與毛利率修復。台股南亞科、華邦電、旺宏、群聯可列研究，但需區分 DRAM、NOR、NAND 控制 IC 與 HBM 的受益程度。',
    ['MU', '2344.TW', '2408.TW', '2337.TW', '8299.TW'],
    'Positive',
    'Medium',
    'Recent context',
    'B',
    'Fundamental',
    '記憶體循環改善可成為台股 AI 之外的主流資金池。',
    '低價記憶體股容易過熱，需看報價與營收。',
    '報價續漲、月營收與毛利改善。',
    '報價漲幅放緩或庫存回補結束。',
  ),
  news(
    'recent-power-cooling',
    '資料中心電力、液冷與散熱仍是 AI 建置瓶頸',
    '2026-05-30 至 2026-06-03 Data center power / cooling 產業報導綜合',
    'AI cluster 功耗提高讓電源、散熱、液冷、UPS 與機櫃成為持續主題。台股台達電、奇鋐、雙鴻、健策、光寶科、康舒受益，但高評價個股要避免追高。',
    ['VRT', 'ETN', '2308.TW', '3017.TW', '3324.TW', '3653.TW', '2301.TW'],
    'Positive',
    'High',
    'Recent context',
    'B',
    'Supply-chain',
    '資料中心擴建速度受限於電力與熱管理。',
    '龍頭散熱與電源已非便宜。',
    '新產能、訂單與毛利率同步改善。',
    '雲端 capex 放緩或競爭導致毛利下滑。',
  ),
  news(
    'recent-export-control',
    'AI 晶片出口管制與中國替代鏈仍影響 GPU / ASIC 需求配置',
    '2026-05-28 至 2026-06-03 美國出口管制與供應鏈報導綜合',
    '政策風險仍是背景壓力：NVIDIA、AMD、Broadcom 與台積電會受產品組合與客戶地區影響；台股 IP、ASIC、成熟製程與中國替代鏈也會被重新定價。',
    ['NVDA', 'AMD', 'AVGO', '2330.TW', '3443.TW', '3035.TW'],
    'Neutral',
    'Medium',
    'Recent context',
    'B',
    'Policy',
    '政策會改變可出貨市場與產品組合。',
    '非同日新規，作為風險權重處理。',
    '新規明確且影響低於預期。',
    '限制擴大到更多 AI accelerator 或 ASIC。',
  ),
  news(
    'recent-pcb-ccl',
    'AI server 高速 PCB / CCL / 載板需求維持高景氣',
    '2026-05-29 至 2026-06-03 台灣 PCB / CCL 產業報導綜合',
    'AI server 與高速交換器需要高階材料與高層板，台光電、金像電、欣興、景碩仍在供應鏈第二層。今天要看是否跟著 MRVL / AI networking 題材出現同步資金。',
    ['2383.TW', '2368.TW', '3037.TW', '3189.TW', 'MRVL', 'AVGO'],
    'Positive',
    'Medium',
    'Recent context',
    'B',
    'Supply-chain',
    '網路升級會拉動高速板材與載板需求。',
    '族群波段已有漲幅，需看實際訂單能見度。',
    '報價、產能利用率或月營收上修。',
    'AI networking 題材退潮且成交量萎縮。',
  ),
  news(
    'momentum-panel',
    '群創、彩晶與面板轉型題材仍有資金熱度，但證據需分級',
    '2026-05-30 至 2026-06-03 台灣面板 / FOPLP / 低軌衛星題材報導綜合',
    '面板族群近期熱度來自本業報價改善、FOPLP、玻璃基板與低軌衛星想像。群創、彩晶可列雷達，但彩晶等低價題材股應標示弱訊號或量價，不應升級成高信心基本面。',
    ['3481.TW', '6116.TW', '2409.TW'],
    'Neutral',
    'Medium',
    'Momentum only',
    'D',
    'Sentiment',
    '資金輪動可能讓非 AI 主線短線放量。',
    '題材多，基本面證據混雜。',
    'FOPLP 或低軌衛星訂單有正式驗證。',
    '處置、爆量長黑或公司澄清題材。',
  ),
];

const themes: Theme[] = [
  {
    id: 'theme-ai-infra',
    name: 'AI 基礎建設從 GPU 擴散到 server、ASIC、networking、power 與 cooling',
    whyItMatters: '美股新高與 HPE / MRVL 訊號顯示 AI 交易仍在，但市場焦點開始從單一 GPU 龍頭擴散到整個資料中心瓶頸。',
    relatedIndustries: ['AI accelerator', 'AI server ODM', 'ASIC', '光互連', '液冷散熱', '電源'],
    relatedCompanies: ['NVDA', 'MRVL', 'HPE', '2382.TW', '6669.TW', '2308.TW', '3017.TW'],
    shortTermImpact: '台股早盤優先看 AI server、網通光通訊、PCB/CCL、散熱與電源是否同步放量。',
    longTermImpact: 'AI capex 若持續擴大，供應鏈價值會從晶片向系統整合、電力與熱管理分配。',
    evidenceQuality: 'High',
  },
  {
    id: 'theme-memory',
    name: '記憶體循環與 AI HBM 需求交疊',
    whyItMatters: 'DRAM/NAND 報價修復與 HBM 需求讓記憶體族群重新進入主流雷達，但不同產品線受益差異大。',
    relatedIndustries: ['DRAM', 'HBM', 'NAND', 'NOR Flash', '控制 IC'],
    relatedCompanies: ['MU', '2344.TW', '2408.TW', '2337.TW', '8299.TW'],
    shortTermImpact: '台股記憶體早盤若量價續強，可作為 AI 之外的第二資金池。',
    longTermImpact: '若報價與毛利率同步回升，低基期記憶體可從反彈轉為循環修復。',
    evidenceQuality: 'Medium',
  },
  {
    id: 'theme-cloud-roi',
    name: 'Cloud capex 仍強，但 AI ROI 開始被市場檢驗',
    whyItMatters: 'Alphabet 融資與大型科技 capex 討論提醒市場，AI infrastructure 需求不是問題，回收期與自由現金流才是下一階段驗證點。',
    relatedIndustries: ['Cloud', 'AI software', 'Enterprise AI', 'Semiconductors'],
    relatedCompanies: ['GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'AVGO'],
    shortTermImpact: '高估值 AI 硬體若缺乏新訂單訊號，容易受利率與 ROI 討論壓抑。',
    longTermImpact: 'AI software monetization 成功，才會延長硬體 capex 週期。',
    evidenceQuality: 'Medium',
  },
  {
    id: 'theme-taiwan-rotation',
    name: '台股資金從 AI 龍頭向二線供應鏈與題材股輪動',
    whyItMatters: '早盤不應固定看單一 watchlist，需比較 AI 龍頭、低基期 ODM、記憶體、面板、功率元件與非科技族群的相對強度。',
    relatedIndustries: ['AI server', '記憶體', '面板/FOPLP', '功率元件', '金融航運雷達'],
    relatedCompanies: ['2330.TW', '2324.TW', '2344.TW', '3481.TW', '5425.TW', '2881.TW'],
    shortTermImpact: '若主流擴散，低基期供應鏈會有交易機會；若只剩題材股，需降風險。',
    longTermImpact: '真正能從雷達升級的公司，必須出現月營收、毛利或訂單驗證。',
    evidenceQuality: 'Medium',
  },
];

function company(
  id: string,
  companyName: string,
  ticker: string,
  marketCountry: string,
  sectorTheme: string,
  supplyChainRole: string,
  whyItMattersToday: string,
  catalystSummary: string,
  evidenceGrade: EvidenceGrade,
  opportunityStage: OpportunityStage,
  beneficiaryType: BeneficiaryType,
  suggestedAction: CompanyResearch['suggestedAction'],
  finalView: FinalView,
  priceVolumeBehavior: string,
  keyRisks: string[],
  whatWouldChangeView: string,
): CompanyResearch {
  return {
    id,
    companyName,
    ticker,
    marketCountry,
    sectorTheme,
    whyItMattersToday,
    catalystSummary,
    priceVolumeBehavior,
    supplyChainRole,
    opportunityStage,
    evidenceGrade,
    catalystDriver: sectorTheme.includes('總經') ? 'Macro' : sectorTheme.includes('政策') ? 'Policy' : sectorTheme.includes('量價') ? 'Technical' : 'Supply-chain',
    beneficiaryType,
    overview: whyItMattersToday,
    businessModel: supplyChainRole,
    revenueDrivers: [sectorTheme, supplyChainRole, catalystSummary],
    latestFinancialReportSummary: catalystSummary,
    revenueGrowth: '以近期財報、月營收與法說訊號追蹤；本報告重點在今日催化與供應鏈 read-through。',
    grossMargin: '需用下一次財報或法說確認毛利率是否跟上需求與出貨。',
    eps: '短線不以 EPS 單點做結論，避免把題材熱度誤判成獲利上修。',
    freeCashFlow: '大型美股需檢查 capex 對 FCF 的壓力；台股供應鏈需看庫存與應收帳款。',
    valuationRisk: priceVolumeBehavior,
    technicalTrend: priceVolumeBehavior,
    competitors: [],
    bullCase: '新催化延續，量價與基本面驗證同步出現。',
    baseCase: '列入今日研究與觀察，等待更多營收、毛利或訂單證據。',
    bearCase: whatWouldChangeView,
    keyRisks,
    finalView,
    suggestedAction,
    whatWouldChangeView,
    upsideDriver: catalystSummary,
    invalidationConditions: whatWouldChangeView,
  };
}

const companyResearch: CompanyResearch[] = [
  company('c-nvda', 'NVIDIA', 'NVDA', '美國', 'AI accelerator / networking', 'GPU、Blackwell / Rubin 平台與 AI networking 規格制定者', '美股 AI 主線續強時仍是台股 read-through 的第一源頭。', '美股創高與 Computex 後 AI factory 敘事延續，但今日不是單一新財報催化。', 'B', 'Crowded', 'Direct', 'Watch', 'Positive', '高評價且擁擠，適合作為方向指標，不適合用台股早盤情緒追高。', ['出口管制', 'ASIC 替代', '交付延遲', '高估值'], '若 Blackwell 交付放慢、客戶 capex 下修或出口管制擴大。'),
  company('c-mrvl', 'Marvell Technology', 'MRVL', '美國', 'ASIC / optical interconnect', '資料中心 custom silicon、DSP、光互連與網路晶片', 'Jensen Huang 評論讓 MRVL 成為今日 fresh catalyst，台股光通訊與網通連動度高。', '市場重新定價 AI networking 與 ASIC 第二主線。', 'B', 'Confirming', 'Direct', 'Watch', 'Positive', '急漲後需防回吐；若量價轉弱會拖累台股光通訊。', ['估值擴張過快', '客戶集中', '光通訊需求不如預期'], '若 MRVL 漲勢無法延續或 AI networking 訂單證據不足。'),
  company('c-hpe', 'Hewlett Packard Enterprise', 'HPE', '美國', 'Enterprise AI server', '企業伺服器、AI infrastructure 與混合雲硬體', '財報與 AI server demand 訊號可支撐企業端需求擴散假設。', '盤後財報強化 AI server 需求不只來自 hyperscaler 的論點。', 'B', 'Confirming', 'Indirect', 'Watch', 'Positive', '財報後若開高回落，表示市場仍質疑毛利與訂單品質。', ['毛利率壓力', '企業 IT 預算波動', '競爭激烈'], '若指引顯示 AI server 毛利低或訂單能見度不足。'),
  company('c-avgo', 'Broadcom', 'AVGO', '美國', 'ASIC / networking', '客製 ASIC、交換晶片與 AI networking', 'MRVL 題材會讓 AVGO 的 ASIC / networking 地位被一起重估。', '近期仍是 NVIDIA 以外最重要的 AI 半導體平台股之一。', 'B', 'Crowded', 'Direct', 'Watch', 'Positive', '估值已反映高成長，財報前後波動風險大。', ['客戶集中', 'VMware 整合', '估值'], '若 AI ASIC 訂單或 networking 增速低於市場預期。'),
  company('c-mu', 'Micron', 'MU', '美國', 'HBM / DRAM', 'HBM、DRAM、NAND 與資料中心記憶體', '記憶體報價與 AI HBM 需求讓台股南亞科、華邦電、旺宏有 read-through。', 'HBM 與 DRAM 循環仍是近一週重要脈絡。', 'B', 'Confirming', 'Direct', 'Watch', 'Positive', '記憶體股波動大，報價與庫存循環反轉會快速改變評價。', ['報價反轉', '供給擴張', '庫存回補結束'], '若 DRAM/NAND 報價漲勢放緩或 HBM 指引轉弱。'),
  company('c-googl', 'Alphabet', 'GOOGL', '美國', 'Cloud capex / AI ROI', 'Google Cloud、AI 模型、搜尋與廣告現金流', 'AI 投資與融資討論使市場重新檢查 capex ROI。', '對硬體供應鏈是需求支撐，也是自由現金流壓力提醒。', 'B', 'Avoid/Wait', 'Indirect', 'Wait', 'Neutral', '若 AI capex 被視為拖累 FCF，雲端與硬體鏈估值都會受壓。', ['AI 投資回收期', '反壟斷', '廣告景氣'], '若雲端毛利與 AI monetization 無法支撐高 capex。'),
  company('c-msft', 'Microsoft', 'MSFT', '美國', 'Cloud / AI software', 'Azure、Copilot、企業軟體與 AI 平台', '用來驗證 AI capex 能否由軟體與雲端營收回收。', '不是今日 fresh catalyst，但對整體 AI ROI 是背景核心。', 'B', 'Confirming', 'Indirect', 'Watch', 'Positive', '估值高，若雲端增速放慢會壓抑 AI 硬體鏈。', ['雲端毛利', 'capex 高峰', 'Copilot 變現速度'], '若 Azure AI 需求或 Copilot monetization 轉弱。'),
  company('c-amd', 'Advanced Micro Devices', 'AMD', '美國', 'AI accelerator', 'GPU、CPU 與資料中心加速器', '若市場追尋 NVIDIA 外的 AI accelerator 替代，AMD 仍在雷達。', '近期不是最強 fresh catalyst，列為二線 AI accelerator 觀察。', 'C', 'Early', 'Indirect', 'Watch', 'Neutral', '相對 NVDA 需要更明確的 MI 系列出貨與毛利驗證。', ['競爭壓力', '軟體生態', '資料中心 GPU 市占'], '若 AI GPU 出貨或指引未跟上市場預期。'),
  company('c-tsmc', '台積電', '2330.TW', '台灣', 'Foundry / CoWoS', '先進製程、CoWoS、AI accelerator 代工核心', '台股早盤最直接承接美股 AI 半導體與 NVIDIA road map read-through。', '美股 AI 主線與 Computex 脈絡支撐，但需看台股開盤量價。', 'B', 'Confirming', 'Direct', 'Watch', 'Positive', '高權值，若外資買盤不足，指數易開高震盪。', ['地緣政治', '高 capex', '匯率', 'CoWoS 瓶頸'], '若美股半導體轉弱或外資大幅調節權值股。'),
  company('c-quanta', '廣達', '2382.TW', '台灣', 'AI server ODM', 'AI server、整機櫃與雲端伺服器 ODM', 'HPE 與美股 AI server 訊號直接指向台灣 ODM 龍頭。', '企業端 AI server demand 若擴散，廣達仍是明顯受益者。', 'B', 'Crowded', 'Direct', 'Watch', 'Positive', '市場已高度認同，追價需等量價與月營收確認。', ['毛利率', '客戶集中', '估值擁擠'], '若 AI server 出貨放緩或毛利率低於預期。'),
  company('c-wiwynn', '緯穎', '6669.TW', '台灣', 'AI server ODM', '雲端資料中心伺服器與 AI rack 解決方案', '美股 AI server / HPE 需求訊號有助緯穎維持高關注。', '與廣達同屬台股 AI server 高信心但高估值群。', 'B', 'Crowded', 'Direct', 'Watch', 'Positive', '高本益比與高股價使波動放大。', ['客戶集中', '供應瓶頸', '估值'], '若主要客戶 capex 或 AI server 訂單減速。'),
  company('c-foxconn', '鴻海', '2317.TW', '台灣', 'AI server EMS', 'EMS、AI server、電動車與消費電子製造', 'AI server 擴散與 NVIDIA 平台脈絡使鴻海持續在核心雷達。', '較廣達/緯穎更大盤與多元，但 AI server 毛利貢獻仍需驗證。', 'B', 'Confirming', 'Direct', 'Watch', 'Positive', '若消費電子拖累或 AI server 毛利不清楚，股價彈性受限。', ['iPhone 循環', '毛利率', '資本支出'], '若 AI server 營收占比與毛利改善不如預期。'),
  company('c-inventec', '英業達', '2356.TW', '台灣', 'AI server ODM', '伺服器、筆電與 AI server 代工', '低基期 ODM 在 HPE server demand 脈絡下可列觀察。', '需要用月營收與毛利率證明 AI server 轉型，而非只跟題材。', 'C', 'Early', 'Indirect', 'Watch', 'Neutral', '低基期有彈性，但基本面證據低於龍頭。', ['PC 本業', '毛利率', '轉型速度'], '若 AI server 營收占比遲遲無法放大。'),
  company('c-mitac', '神達', '3706.TW', '台灣', 'AI server / edge server', '伺服器、車載與資料中心設備', '企業 AI server 題材擴散時，神達是低基期候選。', '列為 radar-only 到早期之間，需等待更明確訂單與獲利訊號。', 'C', 'Early', 'Indirect', 'Watch', 'Neutral', '題材彈性高但證據品質不如一線 ODM。', ['訂單能見度', '毛利率', '流動性'], '若公司無法提出 AI server 訂單或營收驗證。'),
  company('c-compal', '仁寶', '2324.TW', '台灣', 'AI server / PC ODM', 'PC ODM 與伺服器轉型', 'AI server 低基期轉型名單，早盤若資金擴散可觀察。', '仍需清楚區分 PC 本業與 AI server 新業務。', 'C', 'Early', 'Radar only', 'Watch', 'Neutral', '較適合觀察，不應直接套用廣達估值。', ['PC 需求', 'AI server 占比低', '毛利率'], '若 AI server 轉型缺乏月營收或客戶佐證。'),
  company('c-delta', '台達電', '2308.TW', '台灣', 'Power / liquid cooling', '電源、UPS、熱管理、資料中心電力解決方案', '資料中心電力瓶頸與 AI rack 功耗提升使台達電持續受益。', '近期 power/cooling 是 AI 建置瓶頸主題，屬高品質但非低估值。', 'B', 'Confirming', 'Direct', 'Watch', 'Positive', '估值不便宜，若資料中心訂單無新增會整理。', ['估值', '匯率', '產品組合'], '若資料中心電源與散熱訂單不如預期。'),
  company('c-avc', '奇鋐', '3017.TW', '台灣', 'Cooling / liquid cooling', '伺服器散熱、液冷模組與熱管理', 'AI server 功耗提升讓散熱仍是台股核心供應鏈。', '受益主題明確，但股價通常反映速度快。', 'B', 'Crowded', 'Direct', 'Watch', 'Positive', '散熱龍頭交易擁擠，追高需嚴控。', ['估值', '競爭', '良率'], '若液冷導入速度或毛利率低於市場預期。'),
  company('c-auras', '雙鴻', '3324.TW', '台灣', 'Cooling', '伺服器與電子產品散熱解決方案', '與奇鋐同屬 AI server 散熱 read-through。', '近期脈絡仍正向，今日需看是否有資金續航。', 'B', 'Crowded', 'Direct', 'Watch', 'Positive', '高波動且與族群情緒高度連動。', ['估值', '客戶集中', '毛利率'], '若散熱族群開高走低或訂單訊號轉弱。'),
  company('c-lotes', '嘉澤', '3533.TW', '台灣', 'Connector / high-speed', '高速連接器與伺服器零組件', 'AI server 高速連接需求使嘉澤保有二線受益位置。', '不是今日 fresh catalyst，但供應鏈位置與基本面品質仍值得列入。', 'B', 'Confirming', 'Indirect', 'Watch', 'Positive', '股價高且流動性較集中，需看量價。', ['客戶導入節奏', '估值', '競爭'], '若高速連接器需求或月營收失速。'),
  company('c-accton', '智邦', '2345.TW', '台灣', 'AI networking', '資料中心交換器與網通設備', 'MRVL / AVGO AI networking 題材直接映射台股智邦。', '今日 fresh catalyst 讓智邦相對其他網通更重要。', 'B', 'Confirming', 'Direct', 'Watch', 'Positive', '若美股 networking 題材回落，智邦容易跟著震盪。', ['客戶集中', '產品切換', '估值'], '若 AI networking 訂單或美股 MRVL/AVGO 表現轉弱。'),
  company('c-elaser', '眾達-KY', '4977.TW', '台灣', 'Optical module', '光收發模組與資料中心光通訊', 'MRVL 題材使光模組成為今日台股重要 read-through。', '證據來自產業題材與量價，需避免過度外推。', 'C', 'Early', 'Indirect', 'Watch', 'Neutral', '中小型股波動高，需看成交量延續。', ['流動性', '訂單能見度', '毛利率'], '若光通訊族群無法跟隨 MRVL 題材放量。'),
  company('c-landmark', '聯亞', '3081.TW', '台灣', 'Optical component', '光通訊磊晶與元件', 'AI 光互連與資料中心升級讓聯亞進入今日雷達。', '屬二線光通訊受益，證據品質低於大型網通。', 'C', 'Early', 'Hidden', 'Watch', 'Neutral', '題材敏感度高但基本面仍需確認。', ['良率', '客戶認證', '流動性'], '若光通訊訂單與營收未能跟上題材。'),
  company('c-elite-material', '台光電', '2383.TW', '台灣', 'CCL / high-speed material', '高階銅箔基板與 AI server 高速材料', 'AI networking 與 server 擴建對高速板材需求持續。', 'MRVL 題材可帶動 CCL/PCB 第二層 read-through。', 'B', 'Confirming', 'Direct', 'Watch', 'Positive', '市場認同度高，需看報價與產能利用率。', ['原料成本', '客戶認證', '估值'], '若高速材料需求或月營收低於預期。'),
  company('c-kgce', '金像電', '2368.TW', '台灣', 'PCB', 'AI server 與交換器高層板', 'AI server 與 networking 同步升溫時，PCB 是必要中游。', '今日可跟台光電、欣興一起觀察資金是否擴散。', 'B', 'Confirming', 'Indirect', 'Watch', 'Positive', '高階 PCB 族群已累積漲幅，需看量價。', ['產能利用率', '報價', '競爭'], '若 PCB 族群成交量萎縮或月營收不支持。'),
  company('c-unimicron', '欣興', '3037.TW', '台灣', 'Substrate / PCB', 'IC 載板、PCB 與高階電子互連材料', 'AI server 與先進封裝拉動載板與高階 PCB 雷達。', '受益路徑較廣，但短線催化不如 MRVL 直接。', 'C', 'Early', 'Indirect', 'Watch', 'Neutral', '需確認載板景氣與毛利復甦。', ['載板循環', '產能利用率', '報價'], '若載板復甦延遲或毛利未改善。'),
  company('c-winbond', '華邦電', '2344.TW', '台灣', 'Memory', 'DRAM、NOR Flash 與記憶體製造', '記憶體循環改善與低基期資金使華邦電進入今日主雷達。', '需用報價、月營收與毛利率驗證，不只靠 AI 題材。', 'B', 'Confirming', 'Direct', 'Watch', 'Positive', '低價記憶體容易過熱，避免追爆量。', ['報價反轉', '庫存', '資本支出'], '若記憶體報價轉弱或月營收未改善。'),
  company('c-nyc', '南亞科', '2408.TW', '台灣', 'DRAM', 'DRAM 製造與記憶體循環受益', 'DRAM 報價與記憶體資金輪動使南亞科成為今日重要觀察。', '受益較直接但仍需注意產業循環反轉。', 'B', 'Confirming', 'Direct', 'Watch', 'Positive', '波段漲幅後需看量價與法人買盤。', ['DRAM 報價', '庫存', '供給擴張'], '若 DRAM 價格漲勢放緩或同業指引轉弱。'),
  company('c-mxic', '旺宏', '2337.TW', '台灣', 'NOR Flash', 'NOR Flash 與非揮發性記憶體', '記憶體輪動若擴散，旺宏可作為 NOR Flash 代表。', '訊號較弱，列早期觀察而非高信心買點。', 'C', 'Early', 'Indirect', 'Watch', 'Neutral', 'NOR 復甦節奏需比 DRAM 更謹慎。', ['NOR 報價', '需求復甦', '庫存'], '若 NOR 報價或終端需求未改善。'),
  company('c-phison', '群聯', '8299.TW', '台灣', 'NAND controller', 'NAND 控制 IC、SSD 模組與儲存解決方案', 'NAND 循環與資料中心儲存需求使群聯保留研究價值。', '比低價記憶體更偏控制 IC 與儲存模組，需分開看。', 'B', 'Early', 'Indirect', 'Watch', 'Positive', 'NAND 報價與庫存管理會放大獲利波動。', ['NAND 價格', '庫存損益', '需求波動'], '若 NAND 報價轉弱或庫存評價損失擴大。'),
  company('c-guc', '創意', '3443.TW', '台灣', 'ASIC design service', 'ASIC 設計服務、先進製程設計與 IP 整合', 'MRVL / AVGO ASIC 主線使台股 ASIC 服務再度值得掃描。', '受益邏輯存在，但今日缺乏公司級新催化，列早期。', 'C', 'Early', 'Hidden', 'Watch', 'Neutral', '客戶專案週期長且營收辨識不穩。', ['客戶專案延遲', '先進製程成本', '競爭'], '若 ASIC 專案沒有新 tape-out 或營收貢獻。'),
  company('c-innolux', '群創', '3481.TW', '台灣', 'Panel / FOPLP', '面板、先進封裝轉型與玻璃基板題材', '面板/FOPLP 題材仍有資金熱度，但應與 AI 基本面分開標示。', '列為弱訊號與量價觀察，不升級成高信心基本面。', 'D', 'Avoid/Wait', 'Radar only', 'Wait', 'Neutral', '題材交易熱，若沒有正式訂單容易回落。', ['面板報價', '題材落空', '處置風險'], '若 FOPLP 或玻璃基板缺乏正式驗證且股價爆量轉弱。'),
  company('c-hannstar', '彩晶', '6116.TW', '台灣', 'Panel / momentum', '中小尺寸面板與題材股', '近期有面板與低軌衛星題材熱度，但證據品質偏量價。', '填入雷達以避免漏看資金主流，但標示 Avoid/Wait。', 'D', 'Avoid/Wait', 'Radar only', 'Wait', 'Neutral', '低價題材股容易受處置與隔日開高走低影響。', ['處置風險', '題材真偽', '流動性'], '若公司未釋出實質訂單且量價轉弱。'),
  company('c-gmt', '迅得', '6438.TW', '台灣', 'Advanced packaging equipment', '自動化設備、半導體與先進封裝設備', '先進封裝與 FOPLP 題材延伸時可列隱性受益雷達。', '證據尚屬間接，今日不作高信心結論。', 'C', 'Early', 'Hidden', 'Watch', 'Neutral', '需確認設備訂單與營收貢獻。', ['訂單能見度', '毛利率', '題材過熱'], '若先進封裝設備訂單未出現。'),
  company('c-forcecon', '力致', '3483.TW', '台灣', 'Cooling / notebook-server thermal', '散熱模組與熱管理零組件', '散熱主題若從龍頭擴散，力致可作二線雷達。', '證據較弱，列 radar-only / 早期觀察。', 'C', 'Early', 'Radar only', 'Watch', 'Neutral', '需確認伺服器散熱占比與毛利。', ['產品組合', '競爭', '流動性'], '若散熱族群轉弱或公司營收無法跟進。'),
].filter((item) => !['c-msft', 'c-amd', 'c-lotes', 'c-unimicron'].includes(item.id));

const supplyChain: SupplyChainNode[] = [
  ['node-nvda', 'NVIDIA', 'NVDA', '美國', 1, 'theme-ai-infra', 'AI accelerator 與平台規格制定者，台股供應鏈 read-through 第一源頭。', 'High', 'Obvious', '出口管制與估值擁擠。'],
  ['node-mrvl', 'Marvell Technology', 'MRVL', '美國', 2, 'theme-ai-infra', 'ASIC、DSP 與光互連催化 AI networking 第二主線。', 'High', 'Obvious', '急漲後回吐與客戶集中。'],
  ['node-tsmc', '台積電', '2330.TW', '台灣', 1, 'theme-ai-infra', '先進製程與 CoWoS 承接 AI accelerator 需求。', 'High', 'Obvious', '地緣政治與 capex。'],
  ['node-quanta', '廣達', '2382.TW', '台灣', 2, 'theme-ai-infra', 'AI server 與整機櫃核心 ODM。', 'High', 'Obvious', '估值與毛利率。'],
  ['node-delta', '台達電', '2308.TW', '台灣', 3, 'theme-ai-infra', '資料中心電源、UPS 與熱管理。', 'High', 'Obvious', '訂單與估值。'],
  ['node-accton', '智邦', '2345.TW', '台灣', 3, 'theme-ai-infra', 'AI networking 與資料中心交換器。', 'High', 'Obvious', '客戶集中。'],
  ['node-emc', '台光電', '2383.TW', '台灣', 3, 'theme-ai-infra', '高速 CCL 與 AI server 材料。', 'Medium', 'Obvious', '報價與產能利用率。'],
  ['node-winbond', '華邦電', '2344.TW', '台灣', 3, 'theme-memory', '記憶體循環修復與低基期資金。', 'Medium', 'Obvious', '報價反轉。'],
  ['node-guc', '創意', '3443.TW', '台灣', 3, 'theme-ai-infra', 'ASIC 設計服務，受 custom silicon 主線支撐。', 'Medium', 'Hidden', '專案週期。'],
  ['node-panel', '群創', '3481.TW', '台灣', 4, 'theme-taiwan-rotation', 'FOPLP / 玻璃基板題材雷達。', 'Low', 'Hidden', '題材驗證不足。'],
].map(([id, companyName, ticker, marketCountry, layer, linkedThemeId, whyItMayBenefit, evidenceStrength, visibility, keyRisk]) => ({
  id,
  companyName,
  ticker,
  marketCountry,
  layer,
  linkedThemeId,
  whyItMayBenefit,
  evidenceStrength,
  visibility,
  keyRisk,
})) as SupplyChainNode[];

function beneficiary(
  id: string,
  themeId: string,
  directBeneficiaries: string[],
  indirectBeneficiaries: string[],
  hiddenBeneficiaries: string[],
  companiesMayBeHurt: string[],
  reasoning: string,
  evidenceQuality: Beneficiary['evidenceQuality'],
  researchPriorityScore: number,
): Beneficiary {
  const detail = (ticker: string, type: BeneficiaryType) => ({
    companyName: companyResearch.find((item) => item.ticker === ticker)?.companyName ?? ticker,
    ticker,
    type,
    linkage: reasoning,
    evidenceGrade: evidenceQuality === 'High' ? ('B' as EvidenceGrade) : ('C' as EvidenceGrade),
    opportunityStage: type === 'Hurt' ? ('Avoid/Wait' as OpportunityStage) : ('Early' as OpportunityStage),
    nextVerification: '等待今日量價、月營收、法說或公司公告確認。',
  });
  return {
    id,
    themeId,
    directBeneficiaries,
    indirectBeneficiaries,
    hiddenBeneficiaries,
    companiesMayBeHurt,
    radarOnly: hiddenBeneficiaries,
    details: [
      ...directBeneficiaries.map((ticker) => detail(ticker, 'Direct')),
      ...indirectBeneficiaries.map((ticker) => detail(ticker, 'Indirect')),
      ...hiddenBeneficiaries.map((ticker) => detail(ticker, 'Hidden')),
      ...companiesMayBeHurt.map((ticker) => detail(ticker, 'Hurt')),
    ],
    reasoning,
    evidenceQuality,
    researchPriorityScore,
  };
}

const beneficiaries: Beneficiary[] = [
  beneficiary('ben-ai-infra', 'theme-ai-infra', ['NVDA', 'MRVL', '2382.TW', '6669.TW', '2308.TW', '2345.TW'], ['2317.TW', '2356.TW', '2368.TW', '2383.TW'], ['3081.TW', '4977.TW', '3443.TW'], ['GOOGL'], 'AI 基建擴張直接拉動 accelerator、server、networking、power/cooling；但雲端資本支出方會承擔 ROI 壓力。', 'High', 95),
  beneficiary('ben-memory', 'theme-memory', ['MU', '2344.TW', '2408.TW'], ['2337.TW', '8299.TW'], [], ['PC OEM 毛利較弱者'], '記憶體報價與庫存循環修復可帶動 DRAM/NAND/NOR，但受益程度需按產品線分拆。', 'Medium', 78),
  beneficiary('ben-rotation', 'theme-taiwan-rotation', ['3481.TW'], ['6438.TW', '3483.TW'], ['6116.TW'], ['追高題材股'], '資金輪動能提供交易機會，但低證據題材必須放在雷達或等待區。', 'Low', 55),
];

const watchlist: WatchlistItem[] = companyResearch.slice(0, 14).map((item) => ({
  id: `watch-${item.id}`,
  ticker: item.ticker,
  companyName: item.companyName,
  currentView: item.finalView,
  keyNews: item.catalystSummary ?? item.whyItMattersToday ?? '',
  keyPriceLevels: item.priceVolumeBehavior ?? '等待今日開盤量價確認。',
  riskNotes: item.keyRisks.join('、'),
  lastUpdatedTime: runTime.generatedAt,
  status: item.suggestedAction === 'Wait' ? 'Waiting' : item.finalView === 'Positive' ? 'Watching' : 'Researching',
}));

const ideaPipeline: IdeaPipelineItem[] = [
  { id: 'idea-mrvl-to-tw-optics', newsId: 'fresh-mrvl-jensen', themeId: 'theme-ai-infra', supplyChainNodeId: 'node-mrvl', companyResearchId: 'c-accton', finalView: 'Positive', explanation: 'MRVL fresh catalyst 先映射到 AI networking，再篩台股交換器與光通訊是否同步放量。' },
  { id: 'idea-hpe-to-odm', newsId: 'fresh-hpe-earnings', themeId: 'theme-ai-infra', supplyChainNodeId: 'node-quanta', companyResearchId: 'c-quanta', finalView: 'Positive', explanation: 'HPE 企業 AI server demand 支持 ODM 需求擴散，但龍頭估值已高，開盤量價是關鍵。' },
  { id: 'idea-memory-cycle', newsId: 'recent-memory-pricing', themeId: 'theme-memory', supplyChainNodeId: 'node-winbond', companyResearchId: 'c-winbond', finalView: 'Positive', explanation: '記憶體報價脈絡可成為台股第二主線，需用月營收與報價交叉驗證。' },
  { id: 'idea-panel-wait', newsId: 'momentum-panel', themeId: 'theme-taiwan-rotation', supplyChainNodeId: 'node-panel', companyResearchId: 'c-hannstar', finalView: 'Neutral', explanation: '面板與 FOPLP 題材有資金熱度，但證據品質偏弱，先列雷達，不作高信心結論。' },
];

function coverage(
  id: string,
  market: ScanCoverageItem['market'],
  category: string,
  status: ScanCoverageItem['status'],
  tickersChecked: string[],
  tickersSelected: string[],
  reason: string,
  priority: ScanCoverageItem['priority'],
): ScanCoverageItem {
  return {
    id,
    market,
    category,
    status,
    tickersChecked,
    tickersSelected,
    tickersRejected: tickersChecked
      .filter((ticker) => !tickersSelected.includes(ticker))
      .map((ticker) => ({
        ticker,
        companyName: companyResearch.find((item) => item.ticker === ticker)?.companyName ?? ticker,
        reason: '已掃描，但今日催化、證據品質或相對強度低於主報公司；保留在雷達。',
        evidenceGrade: status === 'Fresh catalyst' ? 'C' : 'D',
        opportunityStage: 'Avoid/Wait',
      })),
    reason,
    priority,
    candidateCount: tickersChecked.length,
    sourcesChecked: ['新聞/公告', '量價/期貨', '財報/指引', '供應鏈 read-through'],
  };
}

const marketSections: MarketSections = {
  us: {
    region: 'US',
    title: '美股市場總覽',
    overview: '昨夜美股風險偏好仍偏多，AI 半導體、AI networking 與 enterprise AI server 是 fresh catalyst；但 Alphabet capex / financing 與利率美元提醒市場已進入 ROI 驗證期。',
    sentiment: 'Bullish',
    keyIndexes: ['S&P 500', 'Nasdaq Composite', 'SOX', 'US 10Y', 'DXY', 'WTI'],
    topThemes: ['AI infrastructure 擴散', 'MRVL / ASIC / optical interconnect', 'HPE enterprise AI server demand', 'Cloud capex ROI 檢查'],
    importantNewsIds: ['fresh-us-ai-record-close', 'fresh-mrvl-jensen', 'fresh-hpe-earnings', 'fresh-google-ai-debt', 'fresh-us-rates-dollar'],
    stocksToWatch: ['NVDA', 'MRVL', 'HPE', 'AVGO', 'MU', 'GOOGL', 'MSFT', 'AMD'],
    risks: ['高估值 AI 交易擁擠', '利率與美元走強', 'cloud capex ROI 被市場質疑', '出口管制擴大'],
  },
  taiwan: {
    region: 'Taiwan',
    title: '台股市場總覽',
    overview: '台灣 2026-06-03 早盤前採 morning mode：先用美股 AI 基建訊號映射台股，再檢查本地記憶體、面板、功率元件與非科技雷達，避免固定 watchlist。',
    sentiment: 'Bullish',
    keyIndexes: ['TAIEX', 'TPEx', '台幣匯率', '外資買賣超', '成交量', '櫃買 AI 族群'],
    topThemes: ['AI server ODM', '台積電 / CoWoS', '記憶體循環', 'AI networking / 光通訊', 'PCB/CCL', '散熱電源'],
    importantNewsIds: ['fresh-tw-preopen-ai', 'fresh-mrvl-jensen', 'fresh-hpe-earnings', 'recent-memory-pricing', 'momentum-panel'],
    stocksToWatch: ['2330.TW', '2382.TW', '6669.TW', '2345.TW', '2383.TW', '2344.TW', '2408.TW', '3017.TW', '2308.TW'],
    risks: ['開高走低', '題材股處置', '台幣急貶或外資轉賣', '記憶體與面板基本面證據不足'],
  },
  crossMarket: [
    { id: 'cross-mrvl-optics', title: 'MRVL -> 台股網通光通訊', usCatalyst: 'MRVL 因 AI infrastructure / optical interconnect 題材成為 fresh catalyst。', taiwanReadThrough: '優先看智邦、眾達、聯亞、波若威與高速材料族群是否同步放量。', relatedUSTickers: ['MRVL', 'AVGO', 'NVDA'], relatedTaiwanTickers: ['2345.TW', '4977.TW', '3081.TW', '3163.TW', '2383.TW'], evidenceStrength: 'High' },
    { id: 'cross-hpe-odm', title: 'HPE -> 台股 AI server ODM', usCatalyst: 'HPE 財報顯示 enterprise AI server demand 仍有支撐。', taiwanReadThrough: '廣達、緯穎、鴻海為直接受益；英業達、神達、仁寶是低基期但需驗證毛利。', relatedUSTickers: ['HPE', 'DELL', 'SMCI'], relatedTaiwanTickers: ['2382.TW', '6669.TW', '2317.TW', '2356.TW', '3706.TW', '2324.TW'], evidenceStrength: 'High' },
    { id: 'cross-cloud-roi', title: 'Alphabet capex ROI -> 高估值 AI 鏈風險', usCatalyst: 'GOOGL AI financing / capex 討論使市場檢查投資回收。', taiwanReadThrough: '高本益比 AI server、散熱與光通訊若開高無量，需降低追價。', relatedUSTickers: ['GOOGL', 'MSFT', 'AMZN', 'META'], relatedTaiwanTickers: ['6669.TW', '3017.TW', '3324.TW', '2345.TW'], evidenceStrength: 'Medium' },
    { id: 'cross-memory', title: 'MU / memory pricing -> 台股記憶體', usCatalyst: 'HBM 與 DRAM/NAND 循環仍在近期脈絡。', taiwanReadThrough: '南亞科、華邦電、旺宏、群聯需分產品線驗證，不可全部視為 HBM 受益。', relatedUSTickers: ['MU', 'WDC', 'STX'], relatedTaiwanTickers: ['2408.TW', '2344.TW', '2337.TW', '8299.TW'], evidenceStrength: 'Medium' },
  ],
  scanCoverage: [
    coverage('scan-us-index', 'US', 'US equities / indexes', 'Fresh catalyst', ['SPY', 'QQQ', 'SOXX', 'NVDA', 'AVGO', 'MRVL', 'HPE'], ['NVDA', 'MRVL', 'HPE', 'AVGO'], '美股創高與 AI 基建股強勢，是台股 morning run 第一層訊號。', 'High'),
    coverage('scan-us-semi', 'US', 'Semiconductors / ASIC / HBM', 'Fresh catalyst', ['NVDA', 'AVGO', 'MRVL', 'AMD', 'MU', 'ARM', 'QCOM'], ['NVDA', 'MRVL', 'AVGO', 'MU'], 'AI accelerator、custom silicon 與記憶體仍是主線。', 'High'),
    coverage('scan-us-software', 'US', 'AI software / cloud monetization', 'Recent context', ['MSFT', 'GOOGL', 'AMZN', 'META', 'ORCL', 'PLTR', 'SNOW'], ['MSFT', 'GOOGL'], '主要用來驗證 capex ROI，不是今日台股最直接催化。', 'Medium'),
    coverage('scan-us-dc-power', 'US', 'Data center power / grid / cooling', 'Recent context', ['VRT', 'ETN', 'PWR', 'CEG', 'GEV', 'NEE'], ['VRT', 'ETN'], '資料中心電力與散熱是 AI 建置瓶頸，但今日台股催化較間接。', 'Medium'),
    coverage('scan-tw-foundry', 'Taiwan', 'Foundry / advanced packaging', 'Recent context', ['2330.TW', '3443.TW', '3035.TW', '6438.TW', '3711.TW'], ['2330.TW', '3443.TW', '6438.TW'], 'NVIDIA road map 與 ASIC 主線支撐，但今日需看量價。', 'High'),
    coverage('scan-tw-odm', 'Taiwan', 'AI server ODM / EMS', 'Fresh catalyst', ['2382.TW', '6669.TW', '2317.TW', '2356.TW', '3706.TW', '2324.TW'], ['2382.TW', '6669.TW', '2317.TW', '2356.TW'], 'HPE server demand 是 fresh catalyst，台灣 ODM 受益最直接。', 'High'),
    coverage('scan-tw-networking', 'Taiwan', 'Networking / optical', 'Fresh catalyst', ['2345.TW', '4977.TW', '3081.TW', '3163.TW', '6285.TW'], ['2345.TW', '4977.TW', '3081.TW'], 'MRVL 題材讓 AI networking 與光互連成為今日重點。', 'High'),
    coverage('scan-tw-pcb', 'Taiwan', 'PCB / CCL / substrate', 'Recent context', ['2383.TW', '2368.TW', '3037.TW', '3189.TW', '8046.TW'], ['2383.TW', '2368.TW', '3037.TW'], 'AI networking 與 server 高速材料需求延續。', 'Medium'),
    coverage('scan-tw-cooling', 'Taiwan', 'Cooling / liquid cooling', 'Recent context', ['3017.TW', '3324.TW', '3653.TW', '3483.TW'], ['3017.TW', '3324.TW', '3653.TW'], '液冷與散熱仍是 AI rack 瓶頸，但族群擁擠。', 'Medium'),
    coverage('scan-tw-power', 'Taiwan', 'Power / UPS / power components', 'Recent context', ['2308.TW', '2301.TW', '6282.TW', '2481.TW', '5425.TW', '8261.TW', '3707.TW'], ['2308.TW', '2301.TW', '2481.TW'], '資料中心電力與 AI server 電源拉動，但功率元件需看報價與訂單。', 'Medium'),
    coverage('scan-tw-memory', 'Taiwan', 'Memory / storage', 'Recent context', ['2344.TW', '2408.TW', '2337.TW', '8299.TW', '3260.TW'], ['2344.TW', '2408.TW', '2337.TW', '8299.TW'], '記憶體報價與庫存循環是 3-7 日仍有效脈絡。', 'High'),
    coverage('scan-tw-panel', 'Taiwan', 'Panel / FOPLP / glass substrate', 'Momentum only', ['3481.TW', '6116.TW', '2409.TW', '6438.TW'], ['3481.TW', '6116.TW', '6438.TW'], '有資金與題材，但證據品質分化，避免過度解讀。', 'Medium'),
    coverage('scan-edge-ai', 'CrossMarket', 'Edge AI / PC / smartphone', 'Recent context', ['AAPL', 'QCOM', '2454.TW', '2357.TW', '3231.TW'], ['2454.TW', 'QCOM'], '邊緣 AI 仍在背景，但今日 fresh catalyst 低於資料中心。', 'Medium'),
    coverage('scan-macro', 'CrossMarket', 'Macro rates / USD/TWD / oil', 'Fresh catalyst', ['US10Y', 'DXY', 'USD/TWD', 'WTI', 'TAIEX'], ['US10Y', 'DXY', 'USD/TWD'], '利率美元油價是追高 AI 交易的風控檢查。', 'High'),
    coverage('scan-nontech', 'Taiwan', 'Financials / shipping / materials / biotech', 'No signal', ['2881.TW', '2603.TW', '2002.TW', '6446.TW', '2609.TW'], [], '有掃描但今日相對新催化不足，未升級主報。', 'Low'),
    coverage('scan-policy', 'CrossMarket', 'Policy / export controls', 'Recent context', ['NVDA', 'AMD', 'AVGO', '2330.TW', '3443.TW'], ['NVDA', 'AMD', '2330.TW'], '出口管制仍是背景風險，今日沒有明確新規。', 'Medium'),
  ],
};

const freshCount = newsItems.filter((item) => item.freshness === 'Fresh catalyst').length;
const recentCount = newsItems.filter((item) => item.freshness === 'Recent context').length;
const report: DailyDashboard = {
  date,
  generatedAt: runTime.generatedAt,
  reportMode,
  reportTitle: modeLabel,
  reportFocus: reportMode === 'morning' ? '台灣時間早上、台股開盤前的作戰版：用昨夜美股與同日盤前訊號，映射今日台股供應鏈與風控。' : '台灣晚間的美股觀察版：用盤前與近期訊號規劃美股與隔日台股 read-through。',
  marketOverview: `本次掃描約 56 個候選項，選出 12 則重要訊號、${freshCount} 則新催化與 ${recentCount} 則近期脈絡，並建立 ${companyResearch.length} 家公司研究。市場主軸是 AI 基礎建設仍強，但 cloud capex ROI、利率美元與台股題材股擁擠度要同步控管。`,
  marketSentiment: 'Bullish',
  topThemes: themes.map((theme) => theme.name),
  stocksToWatch: ['MRVL', 'HPE', 'NVDA', 'AVGO', 'MU', 'GOOGL', '2330.TW', '2382.TW', '6669.TW', '2345.TW', '2383.TW', '2344.TW', '2408.TW', '3017.TW', '2308.TW'],
  biggestRisk: '最大風險是把美股 AI 創高與台股題材股放量直接等同於基本面上修；今天必須用台股開盤量價、外資方向、月營收與公司公告驗證。',
  watchlistAlerts: [
    'Fresh catalysts：MRVL 光互連、HPE AI server demand、美股 AI 指數創高、Alphabet capex ROI 討論。',
    'Recent context：Computex 後 NVIDIA road map、記憶體報價、資料中心電力散熱、PCB/CCL 與出口管制。',
    'Background thesis：AI capex 長期仍在，但下一階段市場會要求 monetization 與自由現金流證據。',
    'Low signal：面板/FOPLP/低軌衛星題材有量價熱度，但未有正式訂單前只能列雷達。',
  ],
  emotionalWarning: '今天若台股開高，不要把所有 AI 名單都追成同一筆交易；先分新催化、近期脈絡、背景論點與純量價，再決定倉位。',
  news: newsItems,
  themes,
  supplyChain,
  beneficiaries,
  companyResearch,
  watchlist,
  ideaPipeline,
  marketSections,
  suggestedActions: [
    '台股開盤前先設定 MRVL -> 智邦/光通訊、HPE -> ODM、MU/報價 -> 記憶體三條驗證線。',
    '只在 fresh catalyst 對應族群開盤放量且沒有開高走低時提高關注；若只有題材股孤軍放量，降低追價。',
    '高估值 AI server、散熱與光通訊用 Watch，不用無條件買進；低證據面板題材用 Wait。',
    '追蹤 USD/TWD、US10Y、DXY 與外資台指期/現貨方向，作為是否降風險的第一條件。',
  ],
  risks: [
    { id: 'risk-rates', category: 'Macro rates / USD', description: '美債殖利率或美元走強會壓縮 AI 高估值交易。', severity: 'High', whatWouldInvalidate: '利率回落、美元走弱且半導體買盤擴散。' },
    { id: 'risk-roi', category: 'Cloud capex ROI', description: 'Alphabet 融資與 capex 討論代表市場開始要求 AI 投資回收證據。', severity: 'Medium', whatWouldInvalidate: '雲端營收、AI 軟體變現與自由現金流同步改善。' },
    { id: 'risk-tw-momentum', category: 'Taiwan momentum', description: '面板、記憶體與低價題材股若只有量價，容易隔日反轉或被處置。', severity: 'Medium', whatWouldInvalidate: '公司公告、月營收或法說給出實質訂單與毛利改善。' },
  ],
  rejectedCandidates: [
    { ticker: '2409.TW', companyName: '友達', reason: '面板與 FOPLP 題材仍在雷達，但今日相對訊號弱於群創與彩晶，暫不列主研究。', evidenceGrade: 'D', opportunityStage: 'Avoid/Wait' },
    { ticker: '2603.TW', companyName: '長榮', reason: '航運有掃描，缺乏同日運價或油價催化，未升級主報。', evidenceGrade: 'D', opportunityStage: 'Avoid/Wait' },
    { ticker: '2881.TW', companyName: '富邦金', reason: '金融股受利率與匯率影響，但今日市場主軸不在金融。', evidenceGrade: 'D', opportunityStage: 'Avoid/Wait' },
    { ticker: '2454.TW', companyName: '聯發科', reason: 'Edge AI / smartphone 在背景雷達，今日 fresh catalyst 低於資料中心 AI。', evidenceGrade: 'C', opportunityStage: 'Avoid/Wait' },
  ],
  scanSummary: {
    candidateItemsScanned: 56,
    categoriesScanned: marketSections.scanCoverage.map((item) => item.category),
    majorSourcesChecked: ['Reuters / MarketWatch / CNBC / Barron\'s 市場報導', 'HPE 財報與盤後反應', 'TrendForce 與記憶體報價脈絡', '台灣盤前券商與財經媒體', '美債、美元、油價與 USD/TWD'],
    sectorsExcluded: ['缺乏同日催化的航運', '缺乏政策新訊號的生技', '缺乏報價/法人流向的原物料', '沒有財報或公告支撐的純題材股'],
    lowSignalItemsExcluded: ['只靠社群熱度的低軌衛星概念', '只有單日爆量但沒有公司公告的 FOPLP 概念', '未能對應 AI server 訂單的低價 ODM 題材'],
    staleItemsExcluded: ['超過一週且沒有新驗證的 Computex 泛 AI 敘事', '市場已充分反映但沒有新增數據的舊法說重點'],
  },
};

function assertReportQuality(dashboard: DailyDashboard) {
  if (dashboard.companyResearch.length < 25 || dashboard.companyResearch.length > 30) {
    throw new Error(`companyResearch.length must be 25-30, got ${dashboard.companyResearch.length}`);
  }
  if (dashboard.marketOverview.includes(`${dashboard.companyResearch.length}`) === false) {
    throw new Error('marketOverview must mention the actual companyResearch count.');
  }
  const allowedStages: OpportunityStage[] = ['Early', 'Confirming', 'Crowded', 'Late', 'Avoid/Wait'];
  for (const item of dashboard.companyResearch) {
    const missing = ['companyName', 'ticker', 'marketCountry', 'evidenceGrade', 'opportunityStage', 'beneficiaryType', 'suggestedAction', 'keyRisks', 'whatWouldChangeView'].filter((key) => {
      const value = item[key as keyof CompanyResearch];
      return value === undefined || value === null || (Array.isArray(value) && value.length === 0) || value === '';
    });
    if (missing.length > 0) throw new Error(`${item.ticker} missing ${missing.join(', ')}`);
    if (!allowedStages.includes(item.opportunityStage as OpportunityStage)) throw new Error(`${item.ticker} invalid opportunityStage`);
    if (item.companyName === '尚未建立公司名稱') throw new Error(`${item.ticker} has unresolved company name`);
  }
  if (dashboard.news.filter((item) => item.freshness === 'Fresh catalyst').length === 0) throw new Error('fresh catalysts must not be empty');
  if (dashboard.news.filter((item) => item.freshness === 'Recent context').length === 0) throw new Error('recent important news must not be empty');
  const json = JSON.stringify(dashboard);
  if (json.includes('Avoid-Wait')) throw new Error('Found invalid Avoid-Wait value');
  if (json.includes('尚未建立公司名稱')) throw new Error('Found unresolved company name');
}

async function main() {
  assertReportQuality(report);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  await mkdir(reportsDir, { recursive: true });
  if (reportMode === 'morning') {
    await writeFile(path.join(dataDir, 'latest.json'), json, 'utf8');
    await writeFile(path.join(dataDir, 'latest-morning.json'), json, 'utf8');
    await writeFile(path.join(reportsDir, `${report.date}.json`), json, 'utf8');
    await writeFile(path.join(reportsDir, `${report.date}-morning.json`), json, 'utf8');
  } else {
    await writeFile(path.join(dataDir, latestModeFile), json, 'utf8');
    await writeFile(path.join(reportsDir, `${report.date}-${reportFileSuffix}.json`), json, 'utf8');
  }
  console.log(`Full-market research automation updated ${report.date} (${reportMode})`);
  console.log(`Company research entries: ${report.companyResearch.length}`);
  console.log(`Fresh catalysts: ${report.news.filter((item) => item.freshness === 'Fresh catalyst').length}`);
  console.log(`Recent context: ${report.news.filter((item) => item.freshness === 'Recent context').length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
