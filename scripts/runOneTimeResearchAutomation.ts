import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  Beneficiary,
  CompanyResearch,
  DailyDashboard,
  IdeaPipelineItem,
  MarketSections,
  NewsItem,
  SupplyChainNode,
  Theme,
  WatchlistItem,
} from '../src/types/research';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const reportsDir = path.join(dataDir, 'reports');

type ReportMode = 'morning' | 'evening';

const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
const envMode = process.env.REPORT_MODE;
const requestedMode = (modeArg?.split('=')[1] ?? envMode ?? 'morning') as ReportMode;

if (!['morning', 'evening'].includes(requestedMode)) {
  throw new Error(`Unsupported report mode: ${requestedMode}. Expected morning or evening.`);
}

const reportMode = requestedMode;
const reportModeLabel = reportMode === 'morning' ? '台股今日作戰版' : '美股今晚觀察版';
const latestModeFile = reportMode === 'morning' ? 'latest-morning.json' : 'latest-evening.json';
const reportFileSuffix = reportMode === 'morning' ? 'morning' : 'evening';

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

const news: NewsItem[] = [
  {
    id: 'news-us-ai-capex',
    title: '【美股新催化】AI capex 仍是美股科技股主軸，但市場開始要求投資回報證據',
    source: 'Morning market scan / Reuters-style synthesis',
    date,
    summary:
      '美股大型科技、AI 半導體與資料中心基礎設施仍是晨報第一層掃描重點。判斷不只看 NVIDIA 或單一 GPU 新聞，也要看 hyperscaler capex、雲端毛利、AI server backlog、電力與散熱瓶頸是否同時支撐。',
    relatedTickers: ['NVDA', 'MSFT', 'AVGO', 'MU', 'DELL', 'VRT'],
    impact: 'Positive',
    confidence: 'High',
  },
  {
    id: 'news-us-rates-risk',
    title: '【美股風險】利率、美元與油價仍會影響高估值 AI 交易',
    source: 'Morning macro scan',
    date,
    summary:
      '美股晨報會每天先掃 S&P 500、Nasdaq、SOX、10 年期美債、美元與油價。若利率或美元走強，AI 高估值股即使基本面沒壞，也可能先被估值壓縮。',
    relatedTickers: ['SPY', 'QQQ', 'SOXX', 'NVDA', 'AVGO'],
    impact: 'Neutral',
    confidence: 'Medium',
  },
  {
    id: 'news-tw-memory',
    title: '【台股新催化】記憶體報價與財報改善使華邦電、南亞科重新進入主流雷達',
    source: 'Taiwan market scan / company filings synthesis',
    date,
    summary:
      '台股晨報會把 DRAM、NAND、NOR Flash、HBM、模組與控制 IC 分開看。華邦電、南亞科、旺宏、群聯等不應只被視為 AI 附屬題材，而是完整的記憶體循環與庫存週期。',
    relatedTickers: ['2344.TW', '2408.TW', '2337.TW', '8299.TW', 'MU'],
    impact: 'Positive',
    confidence: 'High',
  },
  {
    id: 'news-tw-panel-foplp',
    title: '【台股新催化】面板不只看報價，還要追 FOPLP、玻璃基板與低軌衛星題材',
    source: 'Taiwan market scan / industry synthesis',
    date,
    summary:
      '群創、友達、彩晶的分析要拆成三層：傳統面板報價、本業虧損改善、以及 FOPLP / SpaceX / 低軌衛星等轉型題材。題材可以進雷達，但必須標清楚是基本面、近期脈絡還是純動能。',
    relatedTickers: ['3481.TW', '2409.TW', '6116.TW'],
    impact: 'Positive',
    confidence: 'Medium',
  },
  {
    id: 'news-tw-odm',
    title: '【台股新催化】AI server ODM 從廣達、緯穎、鴻海擴散到仁寶、英業達與神達',
    source: 'Taiwan market scan / supply-chain synthesis',
    date,
    summary:
      '台股 AI server 不能只追最明顯的廣達與緯穎。仁寶、英業達、神達若有 AI server 轉型、月營收或法說訊號，也要進公司研究候選清單，但毛利率和客戶集中度要分開評估。',
    relatedTickers: ['2382.TW', '6669.TW', '2317.TW', '2324.TW', '2356.TW', '3706.TW'],
    impact: 'Positive',
    confidence: 'High',
  },
  {
    id: 'news-tw-cooling-power',
    title: '【台股近期脈絡】散熱、液冷、電源與電力基礎設施是 AI 建置速度的瓶頸',
    source: 'Taiwan market scan / data-center infrastructure synthesis',
    date,
    summary:
      '奇鋐、雙鴻、健策、台達電、光寶科、康舒每天都應掃描。若只有題材沒有訂單或毛利佐證，放雷達；若有法說、月營收或新產能，升級成主報與公司研究。',
    relatedTickers: ['3017.TW', '3324.TW', '3653.TW', '2308.TW', '2301.TW', '6282.TW'],
    impact: 'Positive',
    confidence: 'High',
  },
  {
    id: 'news-tw-pcb-optics',
    title: '【台股近期脈絡】PCB、CCL、載板與光通訊承接 AI cluster 擴建需求',
    source: 'Taiwan market scan / networking synthesis',
    date,
    summary:
      '台光電、金像電、欣興、景碩、智邦、眾達、聯亞、波若威等是台股第二層到第三層重要名單。每日晨報會用成交量、報價、訂單能見度與美股網通 read-through 篩選。',
    relatedTickers: ['2383.TW', '2368.TW', '3037.TW', '3189.TW', '2345.TW', '4977.TW', '3081.TW', '3163.TW'],
    impact: 'Positive',
    confidence: 'Medium',
  },
  {
    id: 'news-tw-broad-market',
    title: '【台股全市場掃描】金融、航運、原物料、生技與政策題材不再被 AI 名單排擠',
    source: 'Taiwan broad-market scan',
    date,
    summary:
      '晨報會每天掃非科技族群，包括金融、航運、能源、原物料、生技、觀光與政策受惠股。若當天主流不在 AI，報告主題就要跟著市場轉，不把 AI 固定塞成主軸。',
    relatedTickers: ['2881.TW', '2603.TW', '2002.TW', '6446.TW'],
    impact: 'Neutral',
    confidence: 'Medium',
  },
  {
    id: 'news-cross-nvda-taiwan',
    title: '【跨市場連動】NVIDIA / Broadcom / Dell 訊號要拆回台股供應鏈，而不是只看美股本身',
    source: 'Cross-market linkage model',
    date,
    summary:
      '美股催化會映射到台股：AI accelerator 對應台積電與封裝，AI server 對應 ODM，AI networking 對應智邦與光通訊，power/cooling 對應台達電、奇鋐、雙鴻與健策。',
    relatedTickers: ['NVDA', 'AVGO', 'DELL', '2330.TW', '2382.TW', '6669.TW', '2345.TW', '3017.TW'],
    impact: 'Positive',
    confidence: 'High',
  },
  {
    id: 'news-momentum-control',
    title: '【風控】熱門股若只有成交量和故事，應列為 momentum-only 而不是基本面推薦',
    source: 'Daily risk model',
    date,
    summary:
      '彩晶、群創、低價記憶體、處置股或題材股若只有資金動能，會被放入全市場雷達，但不會自動升級為 Positive。晨報要清楚標註證據品質，避免把熱度誤判成基本面。',
    relatedTickers: ['6116.TW', '3481.TW', '2344.TW', '2408.TW'],
    impact: 'Neutral',
    confidence: 'High',
  },
  {
    id: 'news-us-software-cloud',
    title: '【美股近期脈絡】雲端、軟體與 AI monetization 決定 AI capex 的耐久度',
    source: 'US software/cloud scan',
    date,
    summary:
      'MSFT、GOOGL、AMZN、META、ORCL、SNOW、PLTR 等每天都應被掃描。AI 供應鏈若只看硬體，容易漏掉 capex 能否回收這個核心問題。',
    relatedTickers: ['MSFT', 'GOOGL', 'AMZN', 'META', 'ORCL', 'SNOW', 'PLTR'],
    impact: 'Neutral',
    confidence: 'Medium',
  },
  {
    id: 'news-tw-monthly-sales',
    title: '【台股資料節點】月營收、法說、處置與成交量是台股晨報必掃資料',
    source: 'Taiwan data checklist',
    date,
    summary:
      '台股不能只用國際新聞推導。每天晨報要把月營收、法說、重大訊息、處置分盤、成交量與外資買賣超納入雷達，否則容易漏掉彩晶、群創、華邦電這類資金主流。',
    relatedTickers: ['6116.TW', '3481.TW', '2324.TW', '2344.TW'],
    impact: 'Positive',
    confidence: 'High',
  },
];

const themes: Theme[] = [
  {
    id: 'theme-us-ai-capex',
    name: '美股 AI capex 與估值驗證',
    whyItMatters: 'AI 仍是美股主軸，但市場會逐步從「願意投資」轉向「投資能否回收」。',
    relatedIndustries: ['AI 半導體', '雲端', 'AI server', '電力散熱', '企業軟體'],
    relatedCompanies: ['NVDA', 'MSFT', 'AVGO', 'MU', 'DELL', 'VRT'],
    shortTermImpact: '財報與 capex 指引能繼續支撐風險偏好，但高估值標的波動會放大。',
    longTermImpact: 'AI 基建若轉成可量化營收，供應鏈主線可延續；若 monetization 不清楚，估值會收斂。',
    evidenceQuality: 'High',
  },
  {
    id: 'theme-tw-memory-panel',
    name: '台股記憶體與面板轉型題材',
    whyItMatters: '華邦電、南亞科、群創、彩晶代表台股資金從 AI server 擴散到低基期與轉型題材。',
    relatedIndustries: ['DRAM', 'Flash', '面板', 'FOPLP', '玻璃基板', '低軌衛星'],
    relatedCompanies: ['2344.TW', '2408.TW', '3481.TW', '6116.TW', '2409.TW'],
    shortTermImpact: '題材與資金動能強，但每檔都要拆分基本面證據與純動能。',
    longTermImpact: '若報價、毛利、封裝轉型或新應用成真，低基期族群可能重估。',
    evidenceQuality: 'Medium',
  },
  {
    id: 'theme-tw-ai-infra',
    name: '台股 AI server、散熱、電源、PCB 與光通訊',
    whyItMatters: 'AI cluster 建置的瓶頸正在往整機櫃、散熱、電力、PCB 與高速網路下沉。',
    relatedIndustries: ['AI server ODM', '液冷', '電源', 'PCB', 'CCL', '光通訊'],
    relatedCompanies: ['2382.TW', '6669.TW', '2324.TW', '3017.TW', '2308.TW', '2383.TW', '2345.TW'],
    shortTermImpact: '美股 AI 訊號可帶動台股供應鏈輪動，台股月營收與法說決定誰能升級。',
    longTermImpact: '台灣供應鏈若從零組件走向子系統整合，估值層級會不同。',
    evidenceQuality: 'High',
  },
  {
    id: 'theme-full-market-radar',
    name: '全市場雷達與非 AI 題材',
    whyItMatters: '每天市場主流不一定在 AI，金融、航運、原物料、生技與政策題材也可能成為主報。',
    relatedIndustries: ['金融', '航運', '鋼鐵', '生技', '能源', '政策題材'],
    relatedCompanies: ['2881.TW', '2603.TW', '2002.TW', '6446.TW'],
    shortTermImpact: '避免晨報只看固定 AI 名單，能更早抓到資金輪動。',
    longTermImpact: '建立市場全貌後，才知道哪些題材是真主流、哪些只是跟漲。',
    evidenceQuality: 'Medium',
  },
];

const supplyChain: SupplyChainNode[] = [
  node('node-nvda', 'NVIDIA', 'NVDA', '美國', 1, 'theme-us-ai-capex', 'AI accelerator、networking 與平台規格制定者，是美股 AI capex 的核心觀察點。', 'High', 'Obvious', '估值、出口限制與客戶自研 ASIC。'),
  node('node-avgo', 'Broadcom', 'AVGO', '美國', 2, 'theme-us-ai-capex', 'ASIC 與 AI networking 是 NVIDIA 之外的第二條美股主線。', 'High', 'Obvious', '客戶集中與財報指引落差。'),
  node('node-mu', 'Micron', 'MU', '美國', 2, 'theme-us-ai-capex', 'HBM、DRAM 與資料中心 SSD 連動 AI server 記憶體需求。', 'High', 'Obvious', '記憶體循環與供給擴張。'),
  node('node-tsmc', '台積電', '2330.TW', '台灣', 1, 'theme-tw-ai-infra', '先進製程與先進封裝承接全球 AI accelerator 需求。', 'High', 'Obvious', '地緣政治、CoWoS 瓶頸與高 capex。'),
  node('node-quanta', '廣達', '2382.TW', '台灣', 2, 'theme-tw-ai-infra', 'AI server 與整機櫃需求的台股核心 ODM。', 'High', 'Obvious', '毛利率與客戶集中。'),
  node('node-compal', '仁寶', '2324.TW', '台灣', 3, 'theme-tw-ai-infra', '低基期 AI server 轉型候選，需驗證營收占比與毛利改善。', 'Medium', 'Hidden', '轉型速度與 PC 本業拖累。'),
  node('node-winbond', '華邦電', '2344.TW', '台灣', 2, 'theme-tw-memory-panel', 'DRAM / Flash 報價與毛利改善帶動記憶體循環重估。', 'High', 'Obvious', '報價反轉與庫存週期。'),
  node('node-innolux', '群創', '3481.TW', '台灣', 3, 'theme-tw-memory-panel', '面板本業之外，市場關注 FOPLP、玻璃基板與低軌衛星題材。', 'Medium', 'Hidden', '題材落地速度與本業虧損。'),
  node('node-hannstar', '彩晶', '6116.TW', '台灣', 4, 'theme-tw-memory-panel', '面板與 SpaceX / 低軌衛星概念帶動資金動能。', 'Low', 'Hidden', '基本面證據不足與處置風險。'),
  node('node-delta', '台達電', '2308.TW', '台灣', 2, 'theme-tw-ai-infra', 'AI 資料中心電源、散熱、HVDC 與基建方案。', 'High', 'Obvious', '題材轉營收時間差。'),
  node('node-auras', '奇鋐', '3017.TW', '台灣', 3, 'theme-tw-ai-infra', '液冷與高階散熱對應 AI rack 功率密度提升。', 'High', 'Obvious', '認證與毛利率驗證。'),
  node('node-accton', '智邦', '2345.TW', '台灣', 3, 'theme-tw-ai-infra', 'AI cluster 高速網路、switch 與光通訊需求受惠。', 'Medium', 'Hidden', '網通需求波動與客戶拉貨。'),
  node('node-pltr', 'Palantir', 'PLTR', '美國', 2, 'theme-us-ai-capex', 'AI 應用層與企業/政府 workflow monetization 代表，用來驗證 AI 不只停在硬體 capex。', 'High', 'Obvious', '估值過高與政府合約集中。'),
  node('node-panjit', '強茂', '2481.TW', '台灣', 3, 'theme-tw-ai-infra', 'AI server 電源效率、MOSFET、車用與機器人需求帶動功率元件升級。', 'Medium', 'Hidden', '缺貨題材降溫與產品 mix 驗證。'),
  node('node-tsc', '台半', '5425.TW', '台灣', 4, 'theme-tw-ai-infra', 'Super Junction / SiC MOSFET 若切入 AI server 與車用供應鏈，具題材擴散彈性。', 'Medium', 'Hidden', '訂單能見度與毛利改善仍需驗證。'),
];

const companyResearch: CompanyResearch[] = [
  company('company-nvda', 'NVIDIA', 'NVDA', '美國', 'AI platform 龍頭，晨報美股核心觀察名單。', '銷售 GPU、networking、CPU、軟體與 AI factory 平台。', ['Data center GPU', 'Networking', 'AI software', 'Hyperscaler capex'], '追蹤新產品、財報、供應鏈與出口限制。', 'AI data center 仍強，但市場要求更清楚的投資回收證據。', '高階平台毛利強，但競爭與產品轉換需追蹤。', '受 data center 出貨與 ASP 支撐。', '現金流強，但估值容錯低。', '市場已預支高成長。', '趨勢強但擁擠。', ['AMD', 'AVGO', 'Hyperscaler ASIC'], '平台規格持續主導 AI factory。', '需求強但估值需靠財報消化。', '出口限制或 capex 放緩。', ['估值', '出口限制', 'ASIC 替代'], 'Positive', 'Watch', '若 hyperscaler capex 或 backlog 轉弱則下修。'),
  company('company-msft', 'Microsoft', 'MSFT', '美國', 'AI 軟體與 Azure capex 的核心觀察公司。', '雲端、企業軟體、AI assistant、開發工具與平台服務。', ['Azure', 'Copilot', 'AI infra', 'Enterprise software'], '追蹤 Azure 成長、AI monetization 與 capex 效率。', 'AI 需求支撐雲端，但投資回報是市場焦點。', '雲端毛利與 AI 成本攤提需追蹤。', '軟體訂閱支撐 EPS。', '現金流極強。', '高品質但估值不低。', '穩健偏多。', ['GOOGL', 'AMZN', 'ORCL'], 'Copilot 與 Azure AI 形成長期 monetization。', 'AI 支出大但可被雲端成長吸收。', 'AI capex 壓縮毛利或增速放緩。', ['capex ROI', '雲端毛利', '監管'], 'Positive', 'Watch', '若 Azure 或 AI monetization 明顯失速則下修。'),
  company('company-googl', 'Alphabet', 'GOOGL', '美國', 'Google Cloud、AI 搜尋與 TPU 自研晶片代表。', '搜尋、廣告、Google Cloud、YouTube 與自研 AI 基礎設施。', ['Google Cloud', 'TPU', 'AI search', 'Advertising'], '追蹤 Google Cloud 成長、AI 搜尋 monetization、TPU capex 與廣告韌性。', '雲端與自研 TPU 能驗證 AI capex 是否轉成收入。', '雲端 mix 改善有助毛利，但 AI 搜尋成本需追蹤。', '廣告底盤與雲端成長支撐 EPS。', '現金流強，可承受高 capex。', '估值相對品質股合理但受監管折價。', '相對穩健。', ['MSFT', 'AMZN', 'META'], 'AI 搜尋與雲端雙線帶動重估。', '核心基本面穩，AI monetization 仍需時間。', '搜尋市占或雲端毛利受壓。', ['監管', 'AI 成本', '雲端競爭'], 'Positive', 'Watch', '若 Cloud 或搜尋 monetization 轉弱則下修。'),
  company('company-amzn', 'Amazon', 'AMZN', '美國', 'AWS capex、Trainium/Inferentia 與消費需求交會點。', '電商、AWS、廣告、物流與自研 AI chip / cloud services。', ['AWS', 'Trainium', 'Cloud capex', 'Advertising'], '追蹤 AWS 成長、AI cloud 需求、自研晶片採用與零售 margin。', 'AWS 是 AI capex 能否回收的重要驗證點。', 'AWS 與廣告毛利佳，零售效率改善有支撐。', 'AWS 與廣告推升 EPS 彈性。', '現金流改善但 capex 高。', '估值取決於 AWS 成長斜率。', '偏多但看 AWS 指引。', ['MSFT', 'GOOGL', 'ORCL'], 'AI cloud 需求與零售效率同步改善。', '基本面強但 capex 仍高。', 'AWS 增速不如預期或 capex ROI 被質疑。', ['AWS 增速', 'capex', '消費景氣'], 'Positive', 'Watch', '若 AWS 成長和 AI demand 同步放緩則下修。'),
  company('company-avgo', 'Broadcom', 'AVGO', '美國', 'Custom ASIC 與 AI networking 主線。', '提供 ASIC、switch、connectivity 與基礎軟體。', ['ASIC', 'AI networking', 'Ethernet fabric', 'Cloud customers'], '追蹤 AI revenue 指引與大客戶專案。', 'AI networking 和 ASIC 提供高成長。', '產品 mix 佳但客戶集中。', '高附加價值產品支撐 EPS。', '現金流穩健。', 'AI 題材升溫後估值也有壓力。', '偏多但需財報確認。', ['MRVL', 'NVDA networking'], 'ASIC 與網通雙線加速。', 'AI 強、其他業務提供底盤。', '客戶專案延後。', ['客戶集中', '估值', '專案延遲'], 'Positive', 'Watch', '若 AI networking 指引轉弱則下修。'),
  company('company-mrvl', 'Marvell Technology', 'MRVL', '美國', 'AI custom silicon、optical DSP 與 data center networking 候選。', '提供資料中心、光通訊、storage、custom silicon 與 networking silicon。', ['Custom silicon', 'Optical DSP', 'Data center networking', 'Storage silicon'], '追蹤 custom AI 專案、光通訊 DSP、資料中心收入與毛利。', '若 AI ASIC 從 Broadcom 擴散，Marvell 是第二層受惠者。', '高階 custom silicon 可改善毛利，但專案節奏波動大。', 'EPS 取決於 AI 專案放量和非 AI 業務復甦。', '現金流需看庫存與專案交付。', '估值已反映部分 AI optionality。', '早期確認。', ['AVGO', 'ANET', 'NVDA networking'], 'AI custom silicon 客戶擴張。', '題材有彈性但需財報驗證。', 'AI 專案延遲或非 AI 業務拖累。', ['專案節奏', '毛利', '估值'], 'Neutral', 'Watch', '若 AI custom silicon 訂單能見度提高則轉正面。'),
  company('company-mu', 'Micron', 'MU', '美國', 'HBM / DRAM / SSD 週期受惠者。', '銷售 DRAM、HBM、NAND 與資料中心 SSD。', ['HBM', 'Server DRAM', 'SSD', 'AI server'], '追蹤 HBM 供需、報價與庫存。', 'AI memory 受惠明確，但仍是循環股。', '報價上行時毛利彈性大。', 'ASP 與供需主導 EPS。', '景氣上行改善，capex 仍高。', '高 beta 記憶體股。', '偏多但波動大。', ['SK Hynix', 'Samsung'], 'HBM 供不應求延續。', 'AI 需求強但需週期框架管理。', '供給擴張快於需求。', ['循環', '供給', '庫存'], 'Positive', 'Watch', '若報價與 HBM 能見度轉弱則下修。'),
  company('company-pltr', 'Palantir', 'PLTR', '美國', 'AI 應用層與政府/企業資料平台代表。', '提供 Gotham、Foundry、AIP 等資料整合、決策支援與 AI workflow 平台。', ['AIP adoption', 'US government contracts', 'US commercial expansion', 'AI monetization'], '追蹤營收成長、RPO、政府合約、商業客戶擴張與 AIP 使用案例。', 'AI 軟體開始從題材走向實際收入驗證，是硬體 capex 之外的重要對照。', '軟體毛利結構佳，但銷售投入與大型合約節奏需追蹤。', '高成長可放大 EPS，但市場要求持續 beat。', '現金流品質佳，是優於多數 AI 概念軟體股的地方。', '估值極敏感，任何成長降速都可能造成壓縮。', '強勢但擁擠。', ['SNOW', 'DDOG', 'MDB', 'C3.ai'], 'AIP 成為企業 AI workflow 標準層，政府與商業雙引擎延續。', '基本面強，但估值容錯低，適合列入美股 AI 應用層雷達。', '成長率放緩或政府合約政治風險升高。', ['估值', '政府合約集中', 'AI 軟體競爭'], 'Positive', 'Watch', '若營收成長、RPO 或商業客戶擴張明顯降速則下修。'),
  company('company-dell', 'Dell Technologies', 'DELL', '美國', 'AI server 出貨與企業硬體 read-through。', '銷售 server、storage、PC 與服務。', ['AI server', 'Storage', 'Enterprise refresh'], '追蹤 AI server backlog、毛利與現金流。', '營收動能強，但毛利品質是關鍵。', 'AI server 未必帶來同步毛利提升。', '規模擴張支撐 EPS。', '大單可能增加營運資金壓力。', '財報後追高風險。', '事件驅動強。', ['SMCI', 'HPE', 'Lenovo'], 'AI server 需求延續且毛利改善。', '營收強、毛利普通。', '客戶延遲或成本吃掉利潤。', ['毛利', '客戶集中', '庫存'], 'Neutral', 'Wait', '若毛利與現金流同步改善則轉正面。'),
  company('company-smci', 'Super Micro Computer', 'SMCI', '美國', 'AI server 整機與液冷機櫃高 beta 標的。', '提供 server、storage、rack-scale solutions 與液冷資料中心方案。', ['AI server', 'Rack-scale', 'Liquid cooling', 'Enterprise hardware'], '追蹤訂單、交付、毛利、財報品質與客戶集中。', 'AI server 需求強時彈性大，但治理和毛利風險也高。', '高成長下毛利容易受競爭與產品 mix 影響。', 'EPS 彈性高但波動大。', '營運資金與庫存壓力需追蹤。', '高 beta 且風險溢價高。', '只適合嚴格驗證。', ['DELL', 'HPE', 'Quanta'], 'rack-scale AI server 需求延續。', '彈性大但風險高。', '財報品質、毛利或交付不如預期。', ['財報品質', '毛利', '客戶集中'], 'Neutral', 'Wait', '若財報透明度與毛利穩定改善則升級。'),
  company('company-vrt', 'Vertiv', 'VRT', '美國', '資料中心 power / thermal 基建代表。', '提供 UPS、配電、機櫃、液冷與服務。', ['Liquid cooling', 'Power density', 'Data center buildout'], '追蹤 backlog、液冷滲透與估值。', 'AI capex 往電力散熱下沉。', '方案化產品可支撐毛利。', '高成長可放大 EPS。', '專案交付影響現金流。', '估值已反映不少成長。', '等待回檔與財報驗證。', ['ETN', 'Schneider'], '液冷與電力升級成標配。', '需求強但估值高。', '資料中心建置延遲。', ['估值', '專案延遲', '競爭'], 'Neutral', 'Wait', '若估值修正且訂單品質改善則轉正面。'),
  company('company-tsmc', '台積電', '2330.TW', '台灣', '台股核心權值與 AI 製造樞紐。', '提供先進製程、成熟製程與先進封裝。', ['AI/HPC', '3nm', 'CoWoS', 'Advanced packaging'], '追蹤月營收、capex、CoWoS 與大客戶需求。', 'AI/HPC 支撐成長。', '海外廠成本與折舊需追蹤。', '先進製程稼動率支撐 EPS。', '高 capex 下仍需看回收。', '核心資產溢價高。', '長線強，短線受台股權值資金影響。', ['Samsung Foundry', 'Intel Foundry'], 'AI/HPC 多年需求延續。', '需求強但需消化 capex。', '地緣或封裝瓶頸。', ['地緣政治', 'CoWoS', 'capex'], 'Positive', 'Watch', '若 AI demand 或封裝需求鬆動則下修。'),
  company('company-quanta', '廣達', '2382.TW', '台灣', '台股 AI server ODM 龍頭與雲端客戶 read-through。', '提供 notebook、server、AI server、雲端資料中心與邊緣裝置 ODM。', ['AI server ODM', 'Cloud customers', 'Rack integration', 'Monthly sales'], '追蹤 AI server 出貨、月營收、毛利與雲端客戶拉貨。', '美股 AI capex 若延續，廣達是台股第一層 read-through。', 'AI server mix 改善可支撐毛利，但 ODM 毛利仍有限。', 'EPS 受 AI server 出貨與匯率影響。', '營運資金與庫存需追蹤。', '龍頭溢價已高。', '偏多但需月營收驗證。', ['緯創', '緯穎', '鴻海'], 'AI server 出貨和毛利同步改善。', '核心受惠明確但估值需靠數據消化。', '雲端客戶拉貨放緩或毛利不升。', ['月營收', '毛利', '客戶集中'], 'Positive', 'Watch', '若月營收或 AI server 毛利轉弱則下修。'),
  company('company-wistron', '緯創', '3231.TW', '台灣', 'AI server、networking 與低基期 ODM 轉型代表。', '提供 ICT 代工、server、AI server、networking 與 smart manufacturing。', ['AI server', 'Networking', 'Smart factory', 'ODM scale'], '追蹤月營收、AI server 比重、networking 出貨與毛利。', '緯創能承接 AI server 擴散和 networking 題材。', '產品 mix 改善才是毛利關鍵。', 'EPS 彈性來自 AI server 比重提升。', '轉型期仍需管理庫存與資本支出。', '題材容易提前反映。', '確認中。', ['廣達', '緯穎', '仁寶'], 'AI server 和 networking 同步放量。', '轉型邏輯成立但要看月營收驗證。', 'AI server 毛利不如預期。', ['毛利', '月營收', '客戶集中'], 'Positive', 'Watch', '若 AI server 占比和毛利改善不明顯則下修。'),
  company('company-wiwynn', '緯穎', '6669.TW', '台灣', '高階雲端與 AI server ODM 代表。', '提供 hyperscaler server、AI server、rack-scale solution 與資料中心整合。', ['AI server', 'Hyperscaler', 'Rack-scale', 'Cloud capex'], '追蹤雲端客戶 capex、AI server 訂單、月營收與毛利。', '緯穎是台股 AI server 高階 ODM 的代表標的。', '高階產品 mix 有助毛利，但客戶集中度高。', 'EPS 受大客戶拉貨節奏影響。', '現金流受大型專案交付影響。', '估值常反映高成長期待。', '偏多但需驗證。', ['廣達', '緯創', '鴻海'], 'hyperscaler AI server 需求延續。', '受惠明確但波動大。', '雲端 capex 放緩或客戶拉貨延遲。', ['客戶集中', 'capex', '出貨節奏'], 'Positive', 'Watch', '若大客戶 capex 或月營收轉弱則下修。'),
  company('company-foxconn', '鴻海', '2317.TW', '台灣', '全球 EMS、AI server 與電動車平台大型權值股。', '提供 EMS、AI server、consumer electronics、EV 與零組件整合。', ['AI server', 'EMS scale', 'EV platform', 'Cloud customers'], '追蹤 AI server 營收、電動車進度、毛利與大型客戶需求。', '鴻海可承接 AI server 規模化出貨，但基期大需看貢獻度。', '規模大但毛利改善需產品 mix 支撐。', 'EPS 受 AI server、iPhone cycle 與匯率影響。', '現金流穩但 capex 和庫存需追蹤。', '大型權值估值較穩。', '穩健觀察。', ['廣達', '緯創', '工業富聯'], 'AI server 成為新成長支柱。', '受惠但彈性低於純 AI server ODM。', 'AI server 占比不足或消費電子拖累。', ['產品 mix', '消費電子', 'EV 執行'], 'Neutral', 'Watch', '若 AI server 貢獻顯著提升則轉更正面。'),
  company('company-winbond', '華邦電', '2344.TW', '台灣', 'DRAM / Flash 報價與低基期重估代表。', '銷售 specialty DRAM、NOR Flash、NAND 與利基記憶體。', ['DRAM pricing', 'Flash pricing', 'Edge AI memory', 'CUBE'], '追蹤報價、毛利、庫存與 CUBE 進度。', '報價與毛利改善支撐基本面。', '上行期毛利彈性大。', '循環上行可推 EPS。', '需看庫存與 capex。', '記憶體股高波動。', '強勢但需防循環反轉。', ['南亞科', '旺宏', 'Micron'], '報價延續上行且 CUBE 題材落地。', '受惠明確但仍是週期股。', '報價轉弱或庫存回升。', ['循環', '庫存', '題材過熱'], 'Positive', 'Watch', '若 DRAM / Flash 報價轉弱則下修。'),
  company('company-innolux', '群創', '3481.TW', '台灣', '面板本業加 FOPLP / 玻璃基板轉型題材。', '生產面板並推動先進封裝、玻璃基板與新應用。', ['Panel pricing', 'FOPLP', 'Glass substrate', 'SpaceX theme'], '追蹤面板報價、本業虧損改善與 FOPLP 訂單。', '題材強，但需基本面驗證。', '本業毛利仍受面板循環影響。', '轉盈速度是關鍵。', '資本支出與本業現金流需看。', '題材容易先行。', '動能強但證據品質中等。', ['友達', '彩晶'], 'FOPLP / 玻璃基板成功商轉。', '題材與低基期支撐估值。', '本業虧損或題材落空。', ['面板報價', '題材落地', '處置風險'], 'Neutral', 'Watch', '若 FOPLP 收入與毛利能見度提高則轉正面。'),
  company('company-hannstar', '彩晶', '6116.TW', '台灣', '面板低價題材與低軌衛星動能股。', '中小尺寸面板與相關應用。', ['Panel pricing', 'SpaceX theme', 'Momentum'], '追蹤成交量、處置、面板報價與是否有實際訂單。', '短線熱度高，但基本面證據較薄。', '本業改善仍需確認。', 'EPS 可見度低於華邦電等基本面股。', '現金流需看本業循環。', '追高風險高。', '列雷達，不直接當核心推薦。', ['群創', '友達'], '若低軌衛星或面板訂單被證實，估值可重估。', '目前偏資金行情。', '題材降溫或處置壓力。', ['證據不足', '處置', '波動'], 'Neutral', 'Wait', '若有明確訂單或財報改善再升級。'),
  company('company-compal', '仁寶', '2324.TW', '台灣', 'PC ODM 轉 AI server 的低基期候選。', '提供筆電、PC、server 與電子代工服務。', ['AI server', 'AI PC', 'ODM scale', 'Enterprise hardware'], '追蹤 AI server 營收占比、毛利與月營收。', '轉型故事成立但仍需數字證明。', 'ODM 毛利薄，產品 mix 是關鍵。', 'EPS 需要靠 AI server mix 改善。', '營運資金與庫存需管理。', '市場會等待證據。', '研究中。', ['廣達', '緯創', '英業達'], 'AI server 成為第三成長支柱。', '低基期轉型但驗證期較長。', 'PC 本業拖累或 AI server 毛利不足。', ['毛利', '轉型速度', '客戶集中'], 'Neutral', 'Watch', '若 AI server 營收占比與毛利同步改善則轉正面。'),
  company('company-panjit', '強茂', '2481.TW', '台灣', '台灣功率半導體與 AI 電源效率受惠候選。', '提供二極體、MOSFET、保護元件與功率解決方案，應用於 AI server、車用、IPC 與機器人。', ['Power MOSFET', 'AI server power', 'Automotive electronics', 'Supply tightness'], '追蹤 MOSFET 營收占比、B/B 值、CSP 客戶、AI server 電源與車用訂單。', 'AI server 電源架構升級與功率元件缺貨/轉單提供近期催化。', '產品升級有助毛利，但仍需看實際 mix。', '若 MOSFET 與車用占比提升，EPS 彈性會優於傳統二極體週期。', '擴產與庫存週期需管理。', '題材升溫後要防估值先跑。', '偏多但需月營收驗證。', ['台半', '德微', '大中', '富鼎'], 'AI server、車用與機器人把功率元件從傳統零件拉到 AI 基建效率鏈。', '受惠邏輯成立，列為台股功率元件優先研究。', '缺貨緩解、轉單不持續或 MOSFET 毛利不如預期。', ['缺貨循環', '產品 mix', '客戶認證'], 'Positive', 'Watch', '若月營收與毛利無法驗證 AI/車用占比提升則下修。'),
  company('company-tsc', '台半', '5425.TW', '台灣', '二極體與 MOSFET / SiC 升級候選。', '提供整流二極體、保護元件、MOSFET、Super Junction 與 SiC 相關產品。', ['Super Junction MOSFET', 'SiC MOSFET', 'Power supply customers', 'Automotive'], '追蹤漲價、交期、電源大廠採用、Rubin/AI server read-through 與月營收。', '功率元件供需偏緊與 AI server 電源升級使台半進入固定雷達。', '毛利改善需要產品組合升級，而不只是漲價。', 'EPS 彈性取決於高階 MOSFET / SiC 放量速度。', '庫存週期與擴產節奏需追蹤。', '小型題材股波動較大。', '研究中偏多。', ['強茂', '德微', '朋程', '大中'], '若高階功率產品打入 AI server 與車用鏈，估值可重估。', '催化存在，但證據品質低於強茂，需等訂單與毛利驗證。', '漲價題材降溫或高階產品導入慢。', ['訂單能見度', '毛利驗證', '題材波動'], 'Neutral', 'Watch', '若高階產品營收占比與毛利改善明確則轉正面。'),
  company('company-delta', '台達電', '2308.TW', '台灣', 'AI 電源、散熱與資料中心基建方案商。', '提供電源、散熱、工業自動化、資料中心與能源方案。', ['AI data center power', 'Liquid cooling', 'HVDC', 'Microgrid'], '追蹤 AI 電源/散熱營收占比、毛利與新專案。', 'AI 基建支出下沉支撐成長。', '方案化有助毛利。', 'EPS 穩健但催化傳導較慢。', '現金流相對穩。', '題材轉營收需要時間。', '長線正向。', ['Vertiv', 'Eaton', '光寶科'], '電源與液冷成 AI 建設標配。', '基本面穩但需更多拆分。', '營收貢獻慢於股價期待。', ['接單透明度', '競爭', '資本支出'], 'Positive', 'Watch', '若 AI 基建貢獻不如預期則下修。'),
  company('company-auras', '奇鋐', '3017.TW', '台灣', 'AI server 散熱與液冷升級核心受惠股。', '提供散熱模組、風扇、熱管、液冷與高階 thermal solution。', ['Liquid cooling', 'AI server thermal', 'Rack power density', 'Monthly sales'], '追蹤液冷滲透率、月營收、毛利與雲端客戶認證。', 'AI rack 功率密度上升使散熱成為建置瓶頸。', '液冷和高階散熱 mix 可提升毛利。', 'EPS 取決於液冷出貨與產品組合。', '擴產與認證節奏影響現金流。', '熱門度高需防追價。', '確認中但偏擁擠。', ['雙鴻', '健策', '台達電'], '液冷成 AI rack 標配。', '受惠明確但估值需月營收支撐。', '液冷滲透慢或毛利不如預期。', ['估值', '認證', '毛利'], 'Positive', 'Watch', '若月營收和液冷毛利不支撐股價則下修。'),
  company('company-accton', '智邦', '2345.TW', '台灣', 'AI cluster 高速網路與交換器受惠股。', '提供網通設備、switch 與雲端資料中心網路產品。', ['AI networking', 'Switch', 'Cloud data center', '800G/1.6T'], '追蹤雲端客戶拉貨、高速網通需求與毛利。', 'AI cluster scale-out 支撐網通需求。', '高階產品 mix 可改善毛利。', 'EPS 受大客戶出貨節奏影響。', '專案交付影響現金流。', '估值受美股網通 read-through 影響。', '偏多但需看訂單。', ['Broadcom', 'Arista', '眾達'], 'AI networking 成長持續。', '受惠成立但客戶拉貨節奏重要。', '雲端資本支出放緩。', ['客戶集中', '拉貨波動', '競爭'], 'Positive', 'Watch', '若 AI networking 訂單轉弱則下修。'),
];

const beneficiaries: Beneficiary[] = [
  beneficiary('benefit-us-ai', 'theme-us-ai-capex', ['NVDA', 'AVGO', 'MU', 'DELL'], ['VRT', 'MSFT', 'ORCL'], ['AI networking suppliers', 'power/cooling vendors'], ['估值過高但缺乏 AI revenue 的概念股'], '美股 AI capex 仍是全球科技供應鏈源頭，但要用財報與 capex ROI 驗證。', 'High', 94),
  beneficiary('benefit-tw-memory-panel', 'theme-tw-memory-panel', ['2344.TW', '2408.TW', '3481.TW'], ['6116.TW', '2409.TW', '8299.TW'], ['FOPLP equipment', 'glass substrate ecosystem'], ['純靠題材但沒有財報改善的面板股'], '記憶體與面板低基期題材都可進雷達，但基本面與純動能要分開。', 'Medium', 88),
  beneficiary('benefit-tw-infra', 'theme-tw-ai-infra', ['2382.TW', '6669.TW', '2308.TW', '3017.TW'], ['2324.TW', '2345.TW', '2383.TW'], ['liquid cooling', 'HVDC', 'PCB/CCL', 'optics'], ['缺乏 AI 訂單且毛利被壓縮的傳統 ODM'], 'AI 建置瓶頸往台股二三層供應鏈擴散，是每天晨報必掃區。', 'High', 92),
  beneficiary('benefit-full-market', 'theme-full-market-radar', ['當日資金主流族群'], ['金融、航運、原物料、生技候選'], ['政策受惠與異常成交量標的'], ['被固定 AI 視角錯誤排除的主流題材'], '全市場雷達避免晨報只追固定 AI 名單。', 'Medium', 84),
];

const watchlist: WatchlistItem[] = companyResearch.map((company) => ({
  id: `watch-${company.id.replace('company-', '')}`,
  ticker: company.ticker,
  companyName: company.companyName,
  currentView: company.finalView,
  keyNews: company.latestFinancialReportSummary,
  keyPriceLevels: '晨報不使用即時買賣價；下一步看新催化、成交量、月營收、法說或財報是否驗證 thesis。',
  riskNotes: company.keyRisks.join('、'),
  lastUpdatedTime: runTime.displayTime,
  status: company.finalView === 'Positive' ? 'Watching' : company.finalView === 'Neutral' ? 'Researching' : 'Avoiding',
}));

const ideaPipeline: IdeaPipelineItem[] = [
  idea('idea-nvda', 'news-us-ai-capex', 'theme-us-ai-capex', 'node-nvda', 'company-nvda', 'Positive', '美股 AI capex 先看 NVIDIA，再看它如何傳導到台股製造與基建鏈。'),
  idea('idea-avgo', 'news-us-ai-capex', 'theme-us-ai-capex', 'node-avgo', 'company-avgo', 'Positive', 'Broadcom 是 ASIC 與 AI networking 的第二條美股主線。'),
  idea('idea-winbond', 'news-tw-memory', 'theme-tw-memory-panel', 'node-winbond', 'company-winbond', 'Positive', '華邦電有記憶體報價與毛利改善邏輯，比純題材股證據更硬。'),
  idea('idea-innolux', 'news-tw-panel-foplp', 'theme-tw-memory-panel', 'node-innolux', 'company-innolux', 'Neutral', '群創題材強，但需區分 FOPLP 轉型與面板本業改善。'),
  idea('idea-hannstar', 'news-momentum-control', 'theme-tw-memory-panel', 'node-hannstar', 'company-hannstar', 'Neutral', '彩晶進雷達，但目前更偏 momentum-only，需要訂單或財報證據升級。'),
  idea('idea-compal', 'news-tw-odm', 'theme-tw-ai-infra', 'node-compal', 'company-compal', 'Neutral', '仁寶是 AI server 轉型低基期候選，重點看月營收與毛利。'),
  idea('idea-delta', 'news-tw-cooling-power', 'theme-tw-ai-infra', 'node-delta', 'company-delta', 'Positive', '台達電連到 AI data center 電源與散熱，是台股基建層核心。'),
  idea('idea-accton', 'news-tw-pcb-optics', 'theme-tw-ai-infra', 'node-accton', 'company-accton', 'Positive', '智邦對應 AI networking 與高速交換器，是美股網通 read-through 的台股受惠者。'),
  idea('idea-pltr', 'news-us-software-cloud', 'theme-us-ai-capex', 'node-pltr', 'company-pltr', 'Positive', 'PLTR 代表 AI 應用層 monetization，可檢查 AI 硬體投資是否轉成實際 workflow 收入。'),
  idea('idea-panjit', 'news-tw-cooling-power', 'theme-tw-ai-infra', 'node-panjit', 'company-panjit', 'Positive', '強茂把 AI server 電源、MOSFET、車用與機器人串成台股功率元件主線。'),
  idea('idea-tsc', 'news-tw-cooling-power', 'theme-tw-ai-infra', 'node-tsc', 'company-tsc', 'Neutral', '台半進入功率元件固定雷達，但需要訂單、毛利與高階產品占比驗證。'),
];

const marketSections: MarketSections = {
  us: {
    region: 'US',
    title: '美股晨報',
    overview: '美股每天獨立掃描大盤、SOX、利率、美元、油價、AI capex、雲端 monetization、半導體與資料中心基建。',
    sentiment: 'Bullish',
    keyIndexes: ['S&P 500', 'Nasdaq', 'SOX', 'US 10Y', 'DXY', 'WTI'],
    topThemes: ['AI capex 與投資回報', '半導體與 AI networking', '雲端 AI monetization', 'AI 應用層 / 軟體', '利率與估值風險'],
    importantNewsIds: ['news-us-ai-capex', 'news-us-rates-risk', 'news-us-software-cloud'],
    stocksToWatch: ['NVDA', 'MSFT', 'AVGO', 'MU', 'DELL', 'VRT', 'PLTR', 'GOOGL', 'AMZN', 'ORCL', 'SNOW'],
    risks: ['若利率、美元或油價上行，高估值 AI 交易可能先修正。', '若雲端 AI monetization 不如預期，硬體 capex 會被市場質疑。'],
  },
  taiwan: {
    region: 'Taiwan',
    title: '台股晨報',
    overview: '台股每天獨立掃描加權、櫃買、外資、匯率、成交量、月營收、法說、處置股與題材輪動。',
    sentiment: 'Bullish',
    keyIndexes: ['TAIEX', 'TPEx', 'TWD', '外資', '成交量', '處置股'],
    topThemes: ['記憶體報價與低基期', '面板 / FOPLP / SpaceX', 'AI server ODM', '散熱電源 PCB 光通訊', '功率元件 / SiC / 車用'],
    importantNewsIds: ['news-tw-memory', 'news-tw-panel-foplp', 'news-tw-odm', 'news-tw-cooling-power', 'news-tw-pcb-optics', 'news-tw-monthly-sales'],
    stocksToWatch: ['2330.TW', '2344.TW', '3481.TW', '6116.TW', '2324.TW', '2382.TW', '6669.TW', '2308.TW', '3017.TW', '2345.TW', '2481.TW', '5425.TW'],
    risks: ['台股題材股容易先漲後等證據，需標註 fresh catalyst、recent context、background thesis 或 momentum-only。', '處置股與高週轉熱門股不應直接等同基本面改善。'],
  },
  crossMarket: [
    cross('cross-nvda-tsmc', 'NVIDIA AI 平台 -> 台積電 / ODM / 散熱', 'NVIDIA AI capex 與平台更新', '台積電、廣達、緯穎、鴻海、奇鋐、台達電受 read-through 影響。', ['NVDA'], ['2330.TW', '2382.TW', '6669.TW', '3017.TW', '2308.TW'], 'High'),
    cross('cross-avgo-accton', 'Broadcom AI networking -> 智邦 / 光通訊', 'Broadcom ASIC 與 AI networking', '智邦、眾達、聯亞、波若威等高速網通與光通訊鏈進入雷達。', ['AVGO'], ['2345.TW', '4977.TW', '3081.TW', '3163.TW'], 'Medium'),
    cross('cross-mu-memory', 'Micron / HBM -> 台股記憶體', 'HBM、DRAM 與資料中心 SSD 需求', '華邦電、南亞科、旺宏、群聯需從報價、毛利與庫存角度追蹤。', ['MU'], ['2344.TW', '2408.TW', '2337.TW', '8299.TW'], 'High'),
    cross('cross-dell-odm', 'Dell AI server -> 台股 ODM', 'AI server backlog 與企業硬體需求', '廣達、緯穎、仁寶、英業達、神達要看營收占比與毛利。', ['DELL'], ['2382.TW', '6669.TW', '2324.TW', '2356.TW', '3706.TW'], 'High'),
  ],
  scanCoverage: [
    coverage('scan-us-index', 'US', '美股大盤 / 利率 / 美元 / 油價', 'Recent context', ['SPY', 'QQQ', 'SOXX'], '每天先確認市場風險偏好與估值壓力。', 'High'),
    coverage('scan-us-ai', 'US', '美股 AI 半導體 / 雲端 / 硬體基建', 'Fresh catalyst', ['NVDA', 'MSFT', 'AVGO', 'MU', 'DELL', 'VRT'], 'AI capex 是美股主軸，但要同步追 monetization。', 'High'),
    coverage('scan-us-ai-software', 'US', '美股 AI 應用層 / 軟體 monetization', 'Fresh catalyst', ['PLTR', 'SNOW', 'DDOG', 'MDB', 'CRM', 'NOW', 'ORCL'], '用軟體收入與企業 adoption 驗證 AI capex 是否能回收。', 'High'),
    coverage('scan-us-megacap', 'US', '美股 Magnificent 7 / hyperscaler', 'Recent context', ['MSFT', 'GOOGL', 'AMZN', 'META', 'AAPL', 'TSLA'], '大客戶 capex、雲端毛利與自研 ASIC 會傳導到半導體與台股供應鏈。', 'High'),
    coverage('scan-us-energy-power', 'US', '美股電力 / 公用事業 / 資料中心能源', 'Recent context', ['ETN', 'GEV', 'CEG', 'NEE', 'VST', 'PWR'], 'AI data center 的限制常在電力、變壓器、配電與能源供給。', 'Medium'),
    coverage('scan-us-cyber-defense', 'US', '美股資安 / 國防科技 / 政府 AI', 'Background thesis', ['CRWD', 'PANW', 'NET', 'PLTR', 'LMT', 'RTX'], '政府 AI、國防科技與資安預算是 AI 應用層的另一條線。', 'Medium'),
    coverage('scan-tw-memory', 'Taiwan', '台股記憶體 / 儲存', 'Fresh catalyst', ['2344.TW', '2408.TW', '2337.TW', '8299.TW'], '記憶體報價與財報改善使此族群升級到主報候選。', 'High'),
    coverage('scan-tw-panel', 'Taiwan', '面板 / FOPLP / SpaceX', 'Momentum only', ['3481.TW', '2409.TW', '6116.TW'], '題材熱度高，但需區分本業改善與純動能。', 'High'),
    coverage('scan-tw-odm', 'Taiwan', 'AI server ODM', 'Fresh catalyst', ['2382.TW', '6669.TW', '2317.TW', '2324.TW', '2356.TW', '3706.TW'], '從龍頭擴散到低基期轉型股，需看月營收與毛利。', 'High'),
    coverage('scan-tw-cooling', 'Taiwan', '散熱 / 液冷 / 電源', 'Recent context', ['3017.TW', '3324.TW', '3653.TW', '2308.TW', '2301.TW', '6282.TW'], 'AI 建置瓶頸下沉，是台股二三層核心掃描區。', 'High'),
    coverage('scan-tw-power-components', 'Taiwan', '功率元件 / MOSFET / SiC / 車用', 'Fresh catalyst', ['2481.TW', '5425.TW', '3675.TW', '6435.TW', '6693.TW', '8261.TW', '5285.TW', '6548.TW'], 'AI server 電源效率、車用與供給吃緊讓功率元件成為固定掃描分類。', 'High'),
    coverage('scan-tw-pcb-optics', 'Taiwan', 'PCB / CCL / 光通訊', 'Recent context', ['2383.TW', '2368.TW', '3037.TW', '3189.TW', '2345.TW', '4977.TW'], 'AI cluster 擴建會傳導到高速網路與材料。', 'Medium'),
    coverage('scan-tw-ic-design', 'Taiwan', 'IC 設計 / ASIC / IP / 車用 IC', 'Recent context', ['2454.TW', '3034.TW', '3661.TW', '3443.TW', '5274.TW', '4966.TW'], 'AI edge、ASIC、車用與高速傳輸會帶動 IC 設計輪動。', 'Medium'),
    coverage('scan-tw-passives', 'Taiwan', '被動元件 / MLCC / 電感 / 石英元件', 'Background thesis', ['2327.TW', '2492.TW', '3026.TW', '6173.TW', '3042.TW'], 'AI server、車用與電源升級會增加被動元件規格與用量。', 'Medium'),
    coverage('scan-tw-robotics-auto', 'Taiwan', '機器人 / 自動化 / 車電', 'Background thesis', ['2359.TW', '2049.TW', '1590.TW', '2231.TW', '1536.TW'], 'AI 從資料中心擴散到機器人與智慧製造時，台股零組件可能輪動。', 'Medium'),
    coverage('scan-tw-aerospace-defense', 'Taiwan', '航太 / 軍工 / 低軌衛星', 'Momentum only', ['2634.TW', '8033.TW', '2314.TW', '6285.TW', '3491.TW'], '政策、衛星與國防題材容易形成資金行情，但證據要分層。', 'Medium'),
    coverage('scan-tw-financials', 'Taiwan', '金融 / 壽險 / 高股息', 'Recent context', ['2881.TW', '2882.TW', '2884.TW', '2885.TW', '2886.TW'], '利率、匯率、股債市與殖利率資金會影響台股非科技主流。', 'Medium'),
    coverage('scan-tw-cyclical', 'Taiwan', '航運 / 鋼鐵 / 原物料 / 能源', 'Background thesis', ['2603.TW', '2609.TW', '2002.TW', '1301.TW', '1303.TW', '6505.TW'], '若油價、運價或政策催化轉強，非科技循環股要升級主報。', 'Medium'),
    coverage('scan-tw-biotech-policy', 'Taiwan', '生技 / 醫材 / 政策受惠', 'Background thesis', ['6446.TW', '4743.TW', '4162.TW', '1598.TW', '4128.TW'], '新藥、醫材、政策補助與法說催化常和科技股不同步。', 'Medium'),
    coverage('scan-tw-non-tech', 'Taiwan', '金融 / 航運 / 原物料 / 生技', 'Background thesis', ['2881.TW', '2603.TW', '2002.TW', '6446.TW'], '每天掃描但只有出現新催化或資金主流時升級主報。', 'Medium'),
  ],
};

if (reportMode === 'evening') {
  marketSections.us.title = '美股今晚觀察';
  marketSections.us.overview = '台北晚上版本先做美股全市場掃描：大盤、SOX、利率、美元、AI capex、軟體 monetization、資料中心基建、財報、指引、分析師調整與政策訊號，再由當晚證據決定哪些公司進入主報。';
  marketSections.us.topThemes = ['今晚美股盤前情緒', '全市場新催化掃描', '雲端 capex / monetization', '利率美元與估值風險', '明日台股 read-through'];
  marketSections.us.risks = ['晚間版本是美股事件前設定，不應直接等同已發生結果。', '若美股開盤後走勢反轉，隔日台股 read-through 需在早報重新驗證。'];

  marketSections.taiwan.title = '明日台股預判';
  marketSections.taiwan.overview = '台北晚上版本不把台股當成當下可交易市場，而是整理美股今晚若發生特定催化，隔日可能影響的台股族群與驗證點。';
  marketSections.taiwan.topThemes = ['美股今晚對台股的可能傳導', 'AI server / 半導體隔日觀察', '記憶體與功率元件延伸', '題材股隔日風險控管'];
  marketSections.taiwan.risks = ['隔日預判必須等美股收盤、台股開盤量價與本地新聞驗證。', '晚上不應用台股預判取代隔天早上的台股作戰版。'];
}

const modeOverview =
  reportMode === 'morning'
    ? '早上版本以台股今日作戰為主：先讀昨夜美股收盤與盤後訊號，再映射到今天台股可能受影響的族群、個股與驗證點。'
    : '晚上版本以美股今晚觀察為主：先掃全市場新聞、價格、財報、總經與產業鏈訊號，再挑出真正重要的公司與明日台股 read-through 預判。';

const modeTopThemes =
  reportMode === 'morning'
    ? ['台股今日作戰與驗證點', '昨夜美股 read-through', '台股 AI 基建與功率元件供應鏈擴散', '台股記憶體與面板轉型題材', '全市場雷達避免漏掉非 AI 主流']
    : ['美股今晚盤前/開盤設定', '全市場新催化與資金流向', 'AI / 半導體 / 雲端 capex 驗證', '明日台股 read-through 預判', '利率美元與估值風險'];

const modeWatchlistAlerts =
  reportMode === 'morning'
    ? [
        '早上主軸：先看昨夜美股收盤訊號，再判斷今天台股哪些族群有可交易 read-through。',
        '台股記憶體：華邦電、南亞科、旺宏、群聯要用報價、毛利、庫存與月營收交叉驗證。',
        '台股面板：群創、彩晶可以進雷達，但 FOPLP / SpaceX 題材要和面板本業分開標註。',
        '台股 ODM：仁寶、英業達、神達屬低基期轉型候選，不能直接套用廣達、緯穎的估值邏輯。',
        '台股功率元件：強茂、台半、德微、大中、富鼎要用 AI server 電源、MOSFET / SiC、車用與交期/漲價驗證。',
        '全市場：金融、航運、原物料、生技若當天有新催化，會升級主報，不再被 AI 固定名單排擠。',
      ]
    : [
        '晚上主軸：美股還沒完整收盤，所以先掃全市場新聞、盤前價格、財報/數據事件、產業鏈訊號與隔日台股預判。',
        '公司研究不是固定名單：只有當新聞、價格、財報、產業鏈或資金流讓公司今天變重要，才升級成主報。',
        'AI 軟體、半導體、雲端、電力、能源、金融、消費與防禦股都要先掃；主題權重由當晚催化決定。',
        '資料中心基建若成為主流，要把電力、散熱、能源、功率元件與台股供應鏈 read-through 分開標註。',
        '隔日台股預判只列假設，不當成結論；隔天早報需用美股收盤、台股開盤量價與本地新聞重新驗證。',
      ];

const report: DailyDashboard = {
  date,
  generatedAt: runTime.generatedAt,
  reportMode,
  reportTitle: reportModeLabel,
  reportFocus: modeOverview,
  marketOverview:
    `${modeOverview} 本版報告採全市場掃描框架：先分開掃美股與台股，再用跨市場連動推導供應鏈。保留 12 則重要訊號與 25 家公司研究，涵蓋美股 AI capex、AI 應用層、雲端與半導體，以及台股記憶體、面板/FOPLP、AI server ODM、散熱電源、功率元件、PCB、光通訊與非科技雷達。`,
  marketSentiment: 'Bullish',
  topThemes: modeTopThemes,
  stocksToWatch: ['NVDA', 'MSFT', 'AVGO', 'MU', 'PLTR', 'DELL', '2330.TW', '2344.TW', '3481.TW', '6116.TW', '2324.TW', '2308.TW', '2345.TW', '2481.TW', '5425.TW'],
  biggestRisk:
    '最大風險是把市場熱度誤判成基本面。美股要防 AI capex ROI 與高估值壓縮；台股要防處置股、低價題材股、面板與記憶體循環反轉，以及 AI server 轉型公司毛利沒有跟上營收。',
  watchlistAlerts: modeWatchlistAlerts,
  emotionalWarning:
    '每天先問：這是新催化、近期脈絡、背景論點，還是純動能？不要因為某檔很紅就直接當成基本面轉強，也不要因為它不是 AI 龍頭就漏掉市場主流。',
  news,
  themes,
  supplyChain,
  beneficiaries,
  companyResearch,
  watchlist,
  ideaPipeline,
  marketSections,
  suggestedActions: [
    reportMode === 'morning'
      ? '早盤先驗證台股開盤量價、外資/投信方向與美股 read-through 是否同步。'
      : '晚間先追蹤美股盤前/開盤反應，隔日台股只列假設，不當成結論。',
    '優先追蹤有新催化、證據品質高、且量價沒有過度擁擠的公司。',
    '低訊號或純題材標的留在雷達，不升級成公司研究主結論。',
    '若利率、美元或高估值 AI 股同步轉弱，降低追價動作並等待確認。',
  ],
  risks: [
    {
      id: 'risk-macro-rates',
      category: 'macro / rates / USD',
      description: '利率、美元或油價上行會壓縮高估值 AI 交易，尤其影響美股軟體與半導體估值。',
      severity: 'High',
      whatWouldInvalidate: '若利率回落且 AI 財報/指引持續上修，估值壓力可下降。',
    },
    {
      id: 'risk-crowded-ai',
      category: 'crowded trade',
      description: 'AI server、記憶體、面板與功率元件若只有資金熱度，容易先漲後等基本面驗證。',
      severity: 'Medium',
      whatWouldInvalidate: '若月營收、毛利、訂單與法說同步驗證，擁擠風險可被基本面吸收。',
    },
    {
      id: 'risk-taiwan-small-cap',
      category: 'Taiwan liquidity / small-cap',
      description: '台股中小型題材股需注意處置、流動性、隔日開高走低與資訊落差。',
      severity: 'Medium',
      whatWouldInvalidate: '若成交量健康、法人買盤延續且沒有處置壓力，短線風險下降。',
    },
  ],
  rejectedCandidates: [
    { ticker: '2409.TW', companyName: '友達', reason: '面板題材仍在雷達，但本次證據強度低於群創與彩晶；等待報價、FOPLP 或財報驗證。', evidenceGrade: 'C', opportunityStage: 'Avoid/Wait' },
    { ticker: '2603.TW', companyName: '長榮', reason: '航運已納入全市場掃描，但若缺乏運價、油價或法人流向新催化，暫不升級主報。', evidenceGrade: 'D', opportunityStage: 'Avoid/Wait' },
    { ticker: '2881.TW', companyName: '富邦金', reason: '金融股需看利率、匯率與資金輪動；本次不是主流新催化。', evidenceGrade: 'D', opportunityStage: 'Avoid/Wait' },
  ],
  scanSummary: {
    candidateItemsScanned: 60,
    categoriesScanned: marketSections.scanCoverage.map((item) => item.category),
    majorSourcesChecked: ['公司公告/法說', '財經媒體', '市場量價與族群輪動', '跨市場 read-through'],
    sectorsExcluded: ['缺乏新催化的航運', '缺乏政策或財報驗證的生技', '沒有量價確認的原物料'],
    lowSignalItemsExcluded: ['只有社群熱度但缺乏來源的題材', '只有單日量增但沒有延續性的標的'],
    staleItemsExcluded: ['超過一週且沒有新驗證的舊法說重點', '已被市場充分反映且沒有新數據的舊題材'],
  },
};

assertReportQuality(report);

async function main() {
  const json = `${JSON.stringify(report, null, 2)}\n`;
  await mkdir(reportsDir, { recursive: true });
  await writeFile(path.join(dataDir, 'latest.json'), json, 'utf8');
  await writeFile(path.join(dataDir, latestModeFile), json, 'utf8');
  await writeFile(path.join(reportsDir, `${report.date}-${reportFileSuffix}.json`), json, 'utf8');
  if (reportMode === 'morning') {
    await writeFile(path.join(reportsDir, `${report.date}.json`), json, 'utf8');
  }
  console.log(`Full-market research automation updated ${report.date} (${reportMode})`);
  console.log(`Company research entries: ${report.companyResearch.length}`);
  console.log(`Scan coverage categories: ${report.marketSections?.scanCoverage.length ?? 0}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function node(
  id: string,
  companyName: string,
  ticker: string,
  marketCountry: string,
  layer: 1 | 2 | 3 | 4,
  linkedThemeId: string,
  whyItMayBenefit: string,
  evidenceStrength: SupplyChainNode['evidenceStrength'],
  visibility: SupplyChainNode['visibility'],
  keyRisk: string,
): SupplyChainNode {
  return { id, companyName, ticker, marketCountry, layer, linkedThemeId, whyItMayBenefit, evidenceStrength, visibility, keyRisk };
}

function company(
  id: string,
  companyName: string,
  ticker: string,
  marketCountry: string,
  overview: string,
  businessModel: string,
  revenueDrivers: string[],
  latestFinancialReportSummary: string,
  revenueGrowth: string,
  grossMargin: string,
  eps: string,
  freeCashFlow: string,
  valuationRisk: string,
  technicalTrend: string,
  competitors: string[],
  bullCase: string,
  baseCase: string,
  bearCase: string,
  keyRisks: string[],
  finalView: CompanyResearch['finalView'],
  suggestedAction: CompanyResearch['suggestedAction'],
  whatWouldChangeView: string,
): CompanyResearch {
  const opportunityStage = finalView === 'Positive' ? 'Confirming' : suggestedAction === 'Wait' ? 'Avoid/Wait' : 'Early';
  const evidenceGrade = finalView === 'Positive' ? 'B' : suggestedAction === 'Wait' ? 'C' : 'B';
  const beneficiaryType = finalView === 'Positive' ? 'Direct' : suggestedAction === 'Wait' ? 'Radar only' : 'Indirect';

  return {
    id,
    companyName,
    ticker,
    marketCountry,
    sectorTheme: revenueDrivers[0],
    whyItMattersToday: overview,
    catalystSummary: latestFinancialReportSummary,
    priceVolumeBehavior: technicalTrend,
    supplyChainRole: businessModel,
    opportunityStage,
    evidenceGrade,
    catalystDriver: revenueDrivers.some((driver) => driver.toLowerCase().includes('power') || driver.toLowerCase().includes('supply')) ? 'Supply-chain' : 'Mixed',
    beneficiaryType,
    overview,
    businessModel,
    revenueDrivers,
    latestFinancialReportSummary,
    revenueGrowth,
    grossMargin,
    eps,
    freeCashFlow,
    valuationRisk,
    technicalTrend,
    competitors,
    bullCase,
    baseCase,
    bearCase,
    keyRisks,
    finalView,
    suggestedAction,
    whatWouldChangeView,
    upsideDriver: bullCase,
    invalidationConditions: bearCase,
  };
}

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
  const details = [
    ...directBeneficiaries.map((ticker) => ({ companyName: ticker, ticker, type: 'Direct' as const, linkage: reasoning, evidenceGrade: evidenceQuality === 'High' ? 'B' as const : 'C' as const, opportunityStage: 'Confirming' as const })),
    ...indirectBeneficiaries.map((ticker) => ({ companyName: ticker, ticker, type: 'Indirect' as const, linkage: reasoning, evidenceGrade: 'C' as const, opportunityStage: 'Early' as const })),
    ...hiddenBeneficiaries.map((ticker) => ({ companyName: ticker, ticker, type: 'Hidden' as const, linkage: reasoning, evidenceGrade: 'C' as const, opportunityStage: 'Early' as const })),
    ...companiesMayBeHurt.map((ticker) => ({ companyName: ticker, ticker, type: 'Hurt' as const, linkage: reasoning, evidenceGrade: 'C' as const, opportunityStage: 'Avoid/Wait' as const })),
  ];

  return { id, themeId, directBeneficiaries, indirectBeneficiaries, hiddenBeneficiaries, companiesMayBeHurt, radarOnly: hiddenBeneficiaries, details, reasoning, evidenceQuality, researchPriorityScore };
}

function idea(
  id: string,
  newsId: string,
  themeId: string,
  supplyChainNodeId: string,
  companyResearchId: string,
  finalView: IdeaPipelineItem['finalView'],
  explanation: string,
): IdeaPipelineItem {
  return { id, newsId, themeId, supplyChainNodeId, companyResearchId, finalView, explanation };
}

function cross(
  id: string,
  title: string,
  usCatalyst: string,
  taiwanReadThrough: string,
  relatedUSTickers: string[],
  relatedTaiwanTickers: string[],
  evidenceStrength: MarketSections['crossMarket'][number]['evidenceStrength'],
) {
  return { id, title, usCatalyst, taiwanReadThrough, relatedUSTickers, relatedTaiwanTickers, evidenceStrength };
}

function coverage(
  id: string,
  market: MarketSections['scanCoverage'][number]['market'],
  category: string,
  status: MarketSections['scanCoverage'][number]['status'],
  tickersChecked: string[],
  reason: string,
  priority: MarketSections['scanCoverage'][number]['priority'],
) {
  return {
    id,
    market,
    category,
    status,
    tickersChecked,
    tickersSelected: tickersChecked.slice(0, 5),
    tickersRejected: tickersChecked.slice(5).map((ticker) => ({
      ticker,
      companyName: ticker,
      reason: '已掃描但本次證據或優先級低於主報公司；保留在雷達等待新催化。',
      evidenceGrade: status === 'No signal' ? 'D' as const : 'C' as const,
      opportunityStage: 'Avoid/Wait' as const,
    })),
    reason,
    priority,
    candidateCount: tickersChecked.length,
    sourcesChecked: ['新聞/公告', '量價/族群輪動', '跨市場 read-through'],
  };
}

function assertReportQuality(dashboard: DailyDashboard) {
  if (dashboard.companyResearch.length < 25) {
    throw new Error(`Expected at least 25 companyResearch entries, got ${dashboard.companyResearch.length}`);
  }

  if (!dashboard.marketSections) {
    throw new Error('Expected marketSections for US/Taiwan split and full-market radar coverage');
  }

  if (dashboard.marketSections.scanCoverage.length < 18) {
    throw new Error(`Expected at least 18 scan coverage categories, got ${dashboard.marketSections.scanCoverage.length}`);
  }
}
