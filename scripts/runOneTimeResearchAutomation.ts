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
];

const companyResearch: CompanyResearch[] = [
  company('company-nvda', 'NVIDIA', 'NVDA', '美國', 'AI platform 龍頭，晨報美股核心觀察名單。', '銷售 GPU、networking、CPU、軟體與 AI factory 平台。', ['Data center GPU', 'Networking', 'AI software', 'Hyperscaler capex'], '追蹤新產品、財報、供應鏈與出口限制。', 'AI data center 仍強，但市場要求更清楚的投資回收證據。', '高階平台毛利強，但競爭與產品轉換需追蹤。', '受 data center 出貨與 ASP 支撐。', '現金流強，但估值容錯低。', '市場已預支高成長。', '趨勢強但擁擠。', ['AMD', 'AVGO', 'Hyperscaler ASIC'], '平台規格持續主導 AI factory。', '需求強但估值需靠財報消化。', '出口限制或 capex 放緩。', ['估值', '出口限制', 'ASIC 替代'], 'Positive', 'Watch', '若 hyperscaler capex 或 backlog 轉弱則下修。'),
  company('company-msft', 'Microsoft', 'MSFT', '美國', 'AI 軟體與 Azure capex 的核心觀察公司。', '雲端、企業軟體、AI assistant、開發工具與平台服務。', ['Azure', 'Copilot', 'AI infra', 'Enterprise software'], '追蹤 Azure 成長、AI monetization 與 capex 效率。', 'AI 需求支撐雲端，但投資回報是市場焦點。', '雲端毛利與 AI 成本攤提需追蹤。', '軟體訂閱支撐 EPS。', '現金流極強。', '高品質但估值不低。', '穩健偏多。', ['GOOGL', 'AMZN', 'ORCL'], 'Copilot 與 Azure AI 形成長期 monetization。', 'AI 支出大但可被雲端成長吸收。', 'AI capex 壓縮毛利或增速放緩。', ['capex ROI', '雲端毛利', '監管'], 'Positive', 'Watch', '若 Azure 或 AI monetization 明顯失速則下修。'),
  company('company-avgo', 'Broadcom', 'AVGO', '美國', 'Custom ASIC 與 AI networking 主線。', '提供 ASIC、switch、connectivity 與基礎軟體。', ['ASIC', 'AI networking', 'Ethernet fabric', 'Cloud customers'], '追蹤 AI revenue 指引與大客戶專案。', 'AI networking 和 ASIC 提供高成長。', '產品 mix 佳但客戶集中。', '高附加價值產品支撐 EPS。', '現金流穩健。', 'AI 題材升溫後估值也有壓力。', '偏多但需財報確認。', ['MRVL', 'NVDA networking'], 'ASIC 與網通雙線加速。', 'AI 強、其他業務提供底盤。', '客戶專案延後。', ['客戶集中', '估值', '專案延遲'], 'Positive', 'Watch', '若 AI networking 指引轉弱則下修。'),
  company('company-mu', 'Micron', 'MU', '美國', 'HBM / DRAM / SSD 週期受惠者。', '銷售 DRAM、HBM、NAND 與資料中心 SSD。', ['HBM', 'Server DRAM', 'SSD', 'AI server'], '追蹤 HBM 供需、報價與庫存。', 'AI memory 受惠明確，但仍是循環股。', '報價上行時毛利彈性大。', 'ASP 與供需主導 EPS。', '景氣上行改善，capex 仍高。', '高 beta 記憶體股。', '偏多但波動大。', ['SK Hynix', 'Samsung'], 'HBM 供不應求延續。', 'AI 需求強但需週期框架管理。', '供給擴張快於需求。', ['循環', '供給', '庫存'], 'Positive', 'Watch', '若報價與 HBM 能見度轉弱則下修。'),
  company('company-dell', 'Dell Technologies', 'DELL', '美國', 'AI server 出貨與企業硬體 read-through。', '銷售 server、storage、PC 與服務。', ['AI server', 'Storage', 'Enterprise refresh'], '追蹤 AI server backlog、毛利與現金流。', '營收動能強，但毛利品質是關鍵。', 'AI server 未必帶來同步毛利提升。', '規模擴張支撐 EPS。', '大單可能增加營運資金壓力。', '財報後追高風險。', '事件驅動強。', ['SMCI', 'HPE', 'Lenovo'], 'AI server 需求延續且毛利改善。', '營收強、毛利普通。', '客戶延遲或成本吃掉利潤。', ['毛利', '客戶集中', '庫存'], 'Neutral', 'Wait', '若毛利與現金流同步改善則轉正面。'),
  company('company-vrt', 'Vertiv', 'VRT', '美國', '資料中心 power / thermal 基建代表。', '提供 UPS、配電、機櫃、液冷與服務。', ['Liquid cooling', 'Power density', 'Data center buildout'], '追蹤 backlog、液冷滲透與估值。', 'AI capex 往電力散熱下沉。', '方案化產品可支撐毛利。', '高成長可放大 EPS。', '專案交付影響現金流。', '估值已反映不少成長。', '等待回檔與財報驗證。', ['ETN', 'Schneider'], '液冷與電力升級成標配。', '需求強但估值高。', '資料中心建置延遲。', ['估值', '專案延遲', '競爭'], 'Neutral', 'Wait', '若估值修正且訂單品質改善則轉正面。'),
  company('company-tsmc', '台積電', '2330.TW', '台灣', '台股核心權值與 AI 製造樞紐。', '提供先進製程、成熟製程與先進封裝。', ['AI/HPC', '3nm', 'CoWoS', 'Advanced packaging'], '追蹤月營收、capex、CoWoS 與大客戶需求。', 'AI/HPC 支撐成長。', '海外廠成本與折舊需追蹤。', '先進製程稼動率支撐 EPS。', '高 capex 下仍需看回收。', '核心資產溢價高。', '長線強，短線受台股權值資金影響。', ['Samsung Foundry', 'Intel Foundry'], 'AI/HPC 多年需求延續。', '需求強但需消化 capex。', '地緣或封裝瓶頸。', ['地緣政治', 'CoWoS', 'capex'], 'Positive', 'Watch', '若 AI demand 或封裝需求鬆動則下修。'),
  company('company-winbond', '華邦電', '2344.TW', '台灣', 'DRAM / Flash 報價與低基期重估代表。', '銷售 specialty DRAM、NOR Flash、NAND 與利基記憶體。', ['DRAM pricing', 'Flash pricing', 'Edge AI memory', 'CUBE'], '追蹤報價、毛利、庫存與 CUBE 進度。', '報價與毛利改善支撐基本面。', '上行期毛利彈性大。', '循環上行可推 EPS。', '需看庫存與 capex。', '記憶體股高波動。', '強勢但需防循環反轉。', ['南亞科', '旺宏', 'Micron'], '報價延續上行且 CUBE 題材落地。', '受惠明確但仍是週期股。', '報價轉弱或庫存回升。', ['循環', '庫存', '題材過熱'], 'Positive', 'Watch', '若 DRAM / Flash 報價轉弱則下修。'),
  company('company-innolux', '群創', '3481.TW', '台灣', '面板本業加 FOPLP / 玻璃基板轉型題材。', '生產面板並推動先進封裝、玻璃基板與新應用。', ['Panel pricing', 'FOPLP', 'Glass substrate', 'SpaceX theme'], '追蹤面板報價、本業虧損改善與 FOPLP 訂單。', '題材強，但需基本面驗證。', '本業毛利仍受面板循環影響。', '轉盈速度是關鍵。', '資本支出與本業現金流需看。', '題材容易先行。', '動能強但證據品質中等。', ['友達', '彩晶'], 'FOPLP / 玻璃基板成功商轉。', '題材與低基期支撐估值。', '本業虧損或題材落空。', ['面板報價', '題材落地', '處置風險'], 'Neutral', 'Watch', '若 FOPLP 收入與毛利能見度提高則轉正面。'),
  company('company-hannstar', '彩晶', '6116.TW', '台灣', '面板低價題材與低軌衛星動能股。', '中小尺寸面板與相關應用。', ['Panel pricing', 'SpaceX theme', 'Momentum'], '追蹤成交量、處置、面板報價與是否有實際訂單。', '短線熱度高，但基本面證據較薄。', '本業改善仍需確認。', 'EPS 可見度低於華邦電等基本面股。', '現金流需看本業循環。', '追高風險高。', '列雷達，不直接當核心推薦。', ['群創', '友達'], '若低軌衛星或面板訂單被證實，估值可重估。', '目前偏資金行情。', '題材降溫或處置壓力。', ['證據不足', '處置', '波動'], 'Neutral', 'Wait', '若有明確訂單或財報改善再升級。'),
  company('company-compal', '仁寶', '2324.TW', '台灣', 'PC ODM 轉 AI server 的低基期候選。', '提供筆電、PC、server 與電子代工服務。', ['AI server', 'AI PC', 'ODM scale', 'Enterprise hardware'], '追蹤 AI server 營收占比、毛利與月營收。', '轉型故事成立但仍需數字證明。', 'ODM 毛利薄，產品 mix 是關鍵。', 'EPS 需要靠 AI server mix 改善。', '營運資金與庫存需管理。', '市場會等待證據。', '研究中。', ['廣達', '緯創', '英業達'], 'AI server 成為第三成長支柱。', '低基期轉型但驗證期較長。', 'PC 本業拖累或 AI server 毛利不足。', ['毛利', '轉型速度', '客戶集中'], 'Neutral', 'Watch', '若 AI server 營收占比與毛利同步改善則轉正面。'),
  company('company-delta', '台達電', '2308.TW', '台灣', 'AI 電源、散熱與資料中心基建方案商。', '提供電源、散熱、工業自動化、資料中心與能源方案。', ['AI data center power', 'Liquid cooling', 'HVDC', 'Microgrid'], '追蹤 AI 電源/散熱營收占比、毛利與新專案。', 'AI 基建支出下沉支撐成長。', '方案化有助毛利。', 'EPS 穩健但催化傳導較慢。', '現金流相對穩。', '題材轉營收需要時間。', '長線正向。', ['Vertiv', 'Eaton', '光寶科'], '電源與液冷成 AI 建設標配。', '基本面穩但需更多拆分。', '營收貢獻慢於股價期待。', ['接單透明度', '競爭', '資本支出'], 'Positive', 'Watch', '若 AI 基建貢獻不如預期則下修。'),
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
];

const marketSections: MarketSections = {
  us: {
    region: 'US',
    title: '美股晨報',
    overview: '美股每天獨立掃描大盤、SOX、利率、美元、油價、AI capex、雲端 monetization、半導體與資料中心基建。',
    sentiment: 'Bullish',
    keyIndexes: ['S&P 500', 'Nasdaq', 'SOX', 'US 10Y', 'DXY', 'WTI'],
    topThemes: ['AI capex 與投資回報', '半導體與 AI networking', '雲端 AI monetization', '利率與估值風險'],
    importantNewsIds: ['news-us-ai-capex', 'news-us-rates-risk', 'news-us-software-cloud'],
    stocksToWatch: ['NVDA', 'MSFT', 'AVGO', 'MU', 'DELL', 'VRT', 'GOOGL', 'AMZN'],
    risks: ['若利率、美元或油價上行，高估值 AI 交易可能先修正。', '若雲端 AI monetization 不如預期，硬體 capex 會被市場質疑。'],
  },
  taiwan: {
    region: 'Taiwan',
    title: '台股晨報',
    overview: '台股每天獨立掃描加權、櫃買、外資、匯率、成交量、月營收、法說、處置股與題材輪動。',
    sentiment: 'Bullish',
    keyIndexes: ['TAIEX', 'TPEx', 'TWD', '外資', '成交量', '處置股'],
    topThemes: ['記憶體報價與低基期', '面板 / FOPLP / SpaceX', 'AI server ODM', '散熱電源 PCB 光通訊'],
    importantNewsIds: ['news-tw-memory', 'news-tw-panel-foplp', 'news-tw-odm', 'news-tw-cooling-power', 'news-tw-pcb-optics', 'news-tw-monthly-sales'],
    stocksToWatch: ['2330.TW', '2344.TW', '3481.TW', '6116.TW', '2324.TW', '2382.TW', '6669.TW', '2308.TW', '3017.TW', '2345.TW'],
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
    coverage('scan-us-ai', 'US', '美股 AI 半導體 / 雲端 / 軟體', 'Fresh catalyst', ['NVDA', 'MSFT', 'AVGO', 'MU', 'DELL', 'VRT'], 'AI capex 是美股主軸，但要同步追 monetization。', 'High'),
    coverage('scan-tw-memory', 'Taiwan', '台股記憶體 / 儲存', 'Fresh catalyst', ['2344.TW', '2408.TW', '2337.TW', '8299.TW'], '記憶體報價與財報改善使此族群升級到主報候選。', 'High'),
    coverage('scan-tw-panel', 'Taiwan', '面板 / FOPLP / SpaceX', 'Momentum only', ['3481.TW', '2409.TW', '6116.TW'], '題材熱度高，但需區分本業改善與純動能。', 'High'),
    coverage('scan-tw-odm', 'Taiwan', 'AI server ODM', 'Fresh catalyst', ['2382.TW', '6669.TW', '2317.TW', '2324.TW', '2356.TW', '3706.TW'], '從龍頭擴散到低基期轉型股，需看月營收與毛利。', 'High'),
    coverage('scan-tw-cooling', 'Taiwan', '散熱 / 液冷 / 電源', 'Recent context', ['3017.TW', '3324.TW', '3653.TW', '2308.TW', '2301.TW', '6282.TW'], 'AI 建置瓶頸下沉，是台股二三層核心掃描區。', 'High'),
    coverage('scan-tw-pcb-optics', 'Taiwan', 'PCB / CCL / 光通訊', 'Recent context', ['2383.TW', '2368.TW', '3037.TW', '3189.TW', '2345.TW', '4977.TW'], 'AI cluster 擴建會傳導到高速網路與材料。', 'Medium'),
    coverage('scan-tw-non-tech', 'Taiwan', '金融 / 航運 / 原物料 / 生技', 'Background thesis', ['2881.TW', '2603.TW', '2002.TW', '6446.TW'], '每天掃描但只有出現新催化或資金主流時升級主報。', 'Medium'),
  ],
};

const report: DailyDashboard = {
  date,
  generatedAt: runTime.generatedAt,
  marketOverview:
    '本版晨報改為全市場掃描框架：先分開掃美股與台股，再用跨市場連動推導供應鏈。今天保留 12 則重要訊號與 12 家公司研究，涵蓋美股 AI capex、雲端與半導體，以及台股記憶體、面板/FOPLP、AI server ODM、散熱電源、PCB、光通訊與非科技雷達。',
  marketSentiment: 'Bullish',
  topThemes: ['美股 AI capex 與估值驗證', '台股記憶體與面板轉型題材', '台股 AI 基建供應鏈擴散', '全市場雷達避免漏掉非 AI 主流'],
  stocksToWatch: ['NVDA', 'MSFT', 'AVGO', 'MU', 'DELL', '2330.TW', '2344.TW', '3481.TW', '6116.TW', '2324.TW', '2308.TW', '2345.TW'],
  biggestRisk:
    '最大風險是把市場熱度誤判成基本面。美股要防 AI capex ROI 與高估值壓縮；台股要防處置股、低價題材股、面板與記憶體循環反轉，以及 AI server 轉型公司毛利沒有跟上營收。',
  watchlistAlerts: [
    '美股：NVDA / AVGO / MU / DELL 是 AI 硬體鏈核心，但要同步看 MSFT / GOOGL / AMZN 的 AI monetization。',
    '台股記憶體：華邦電、南亞科、旺宏、群聯要用報價、毛利、庫存與月營收交叉驗證。',
    '台股面板：群創、彩晶可以進雷達，但 FOPLP / SpaceX 題材要和面板本業分開標註。',
    '台股 ODM：仁寶、英業達、神達屬低基期轉型候選，不能直接套用廣達、緯穎的估值邏輯。',
    '全市場：金融、航運、原物料、生技若當天有新催化，會升級主報，不再被 AI 固定名單排擠。',
  ],
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
};

assertReportQuality(report);

async function main() {
  const json = `${JSON.stringify(report, null, 2)}\n`;
  await mkdir(reportsDir, { recursive: true });
  await writeFile(path.join(dataDir, 'latest.json'), json, 'utf8');
  await writeFile(path.join(reportsDir, `${report.date}.json`), json, 'utf8');
  console.log(`Full-market research automation updated ${report.date}`);
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
  return {
    id,
    companyName,
    ticker,
    marketCountry,
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
  return { id, themeId, directBeneficiaries, indirectBeneficiaries, hiddenBeneficiaries, companiesMayBeHurt, reasoning, evidenceQuality, researchPriorityScore };
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
  return { id, market, category, status, tickersChecked, reason, priority };
}

function assertReportQuality(dashboard: DailyDashboard) {
  if (dashboard.companyResearch.length < 10) {
    throw new Error(`Expected at least 10 companyResearch entries, got ${dashboard.companyResearch.length}`);
  }

  if (!dashboard.marketSections) {
    throw new Error('Expected marketSections for US/Taiwan split and full-market radar coverage');
  }

  if (dashboard.marketSections.scanCoverage.length < 8) {
    throw new Error(`Expected at least 8 scan coverage categories, got ${dashboard.marketSections.scanCoverage.length}`);
  }
}
