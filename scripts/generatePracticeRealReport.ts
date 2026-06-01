import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { DailyDashboard } from '../src/types/research';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const reportsDir = path.join(dataDir, 'reports');

const report: DailyDashboard = {
  date: '2026-06-01',
  generatedAt: '2026-06-01T21:45:00+08:00',
  marketOverview:
    '今日實測報告使用公開新聞與產業研究資料產生，不使用 mock data。AI 資料中心資本支出仍是主軸，訊號從 GPU 與雲端 capex 擴散到台積電先進製程/封裝、記憶體供給吃緊、光通訊、液冷與高壓電源。整體研究情緒偏多，但估值、AI 泡沫、電力接入與供應鏈瓶頸是主要風險。',
  marketSentiment: 'Bullish',
  topThemes: ['AI 資料中心 capex 上修', '記憶體與先進封裝瓶頸', '液冷 / 電源 / 光通訊升級'],
  stocksToWatch: ['NVDA', 'TSM', 'AVGO', 'MU', 'VRT', 'LITE', '2308.TW', '3017.TW'],
  biggestRisk:
    '市場已把多年 AI 基礎建設成長折現到許多股票；若 hyperscaler capex 放緩、電力接入延後、記憶體價格傷害雲端毛利，或 AI 投資回報被質疑，高估值供應鏈可能同步修正。',
  watchlistAlerts: [
    'TSM：AI/HPC 與先進封裝需求強，但公司本身也提醒需要小心驗證 AI 需求真實性。',
    'MU / HBM：記憶體報價與供給吃緊是正面訊號，但價格過快上漲也可能成為雲端 capex 成本壓力。',
    'VRT / 2308.TW / 3017.TW：液冷與電源升級受惠明確，短線需避免只因題材追價。',
    'LITE / 光通訊：AI cluster interconnect 需求上升，需追蹤 800G/1.6T 量產與元件短缺。'
  ],
  emotionalWarning:
    '這是一份研究練習，不是買賣建議。今天最重要的是把新聞轉成可驗證假設：誰直接受惠、誰只是題材、哪些瓶頸有數據支持，哪些需要等待財報確認。',
  news: [
    {
      id: 'real-news-csp-capex',
      title: 'TrendForce 上修 2026 年前九大 CSP capex 至約 8300 億美元',
      source: 'TrendForce, 2026-05-06',
      date: '2026-06-01',
      summary:
        'TrendForce 指出 Google、AWS、Meta、Microsoft、Oracle、ByteDance、Tencent、Alibaba、Baidu 等前九大 CSP 因 AI 需求上修 2026 年 capex，年增率預估由 61% 上修至 79%。這支持 AI 伺服器、GPU、ASIC、資料中心建設、電源與液冷供應鏈。',
      relatedTickers: ['NVDA', 'AVGO', 'TSM', 'MSFT', 'AMZN', 'GOOGL', 'META'],
      impact: 'Positive',
      confidence: 'High'
    },
    {
      id: 'real-news-big-tech-cost',
      title: '大型科技公司 AI capex 創高，記憶體與零組件成本成為核心變數',
      source: "Tom's Hardware / Financial Times summary, 2026-04-30",
      date: '2026-06-01',
      summary:
        'Google、Microsoft、Meta、Amazon 2026 年 capex 規模被報導將大幅高於前一年，Microsoft CFO 將部分預算上升歸因於記憶體與零組件成本。正面是供應鏈需求強，負面是成本壓力可能影響雲端投資回報。',
      relatedTickers: ['MSFT', 'GOOGL', 'META', 'AMZN', 'MU', 'NVDA'],
      impact: 'Neutral',
      confidence: 'Medium'
    },
    {
      id: 'real-news-tsmc-capex',
      title: '台積電 2026 年高 capex 支撐 AI/HPC 與先進封裝，但管理層警惕 AI 泡沫',
      source: "Tom's Hardware, 2026-01-15",
      date: '2026-06-01',
      summary:
        '報導指出台積電 2025 年營收創高，AI/HPC 處理器是重要動能；公司規劃 2026 年 520 至 560 億美元 capex，且部分投入先進封裝。這強化台積電與其設備、封裝、測試、材料供應鏈研究價值。',
      relatedTickers: ['TSM', 'ASX', 'AMAT', 'ASML', '2449.TW', '3037.TW'],
      impact: 'Positive',
      confidence: 'High'
    },
    {
      id: 'real-news-memory-pricing',
      title: 'AI server demand 推升 DRAM / NAND 報價，記憶體成為 capex 成本與受惠雙重焦點',
      source: 'TrendForce, 2026-03-31 / 2026-02-02',
      date: '2026-06-01',
      summary:
        'TrendForce 研究顯示 AI 與資料中心需求使 DRAM 供需更緊，server 與 HBM 應用吸收產能，2Q26 conventional DRAM 合約價仍有大幅上漲預期。Micron、HBM 供應鏈受惠，但雲端業者成本也上升。',
      relatedTickers: ['MU', 'Samsung', 'SK Hynix', 'NVDA'],
      impact: 'Positive',
      confidence: 'High'
    },
    {
      id: 'real-news-cooling-power',
      title: 'AI 機櫃功耗提高，液冷、電源與資料中心基礎設施成為第二層受惠主線',
      source: 'Motley Fool, 2026-05-22',
      date: '2026-06-01',
      summary:
        '市場討論資料中心電力與散熱產能是否可能在 2026 下半年至 2027 年過剩，但同時指出高密度 AI rack 使液冷與關鍵電力設備需求更具結構性。Vertiv 是明顯受惠者，台系散熱與電源供應鏈也值得追蹤。',
      relatedTickers: ['VRT', 'ETN', '2308.TW', '3017.TW', '2356.TW'],
      impact: 'Positive',
      confidence: 'Medium'
    },
    {
      id: 'real-news-optics',
      title: 'AI 光收發模組市場快速成長，元件短缺可能成為擴產瓶頸',
      source: 'TrendForce, 2026-04-20',
      date: '2026-06-01',
      summary:
        'TrendForce 預估 AI-focused optical transceiver 市場 2026 年可達 260 億美元，800G 以上光通訊需求受 AI cluster interconnect 推動。這使光模組、雷射、光引擎與封裝測試成為隱藏受惠研究方向。',
      relatedTickers: ['LITE', 'COHR', 'AVGO', '2345.TW'],
      impact: 'Positive',
      confidence: 'Medium'
    }
  ],
  themes: [
    {
      id: 'theme-real-csp-capex',
      name: 'AI 資料中心 capex 上修',
      whyItMatters:
        '大型雲端業者資本支出是 AI 硬體需求的源頭，上修代表 GPU、ASIC、伺服器、網路、電力與散熱需求仍有能見度。',
      relatedIndustries: ['雲端服務', 'GPU', 'ASIC', '伺服器 ODM', '資料中心建設', '電力基礎設施'],
      relatedCompanies: ['NVDA', 'AVGO', 'TSM', 'MSFT', 'AMZN', 'GOOGL', 'META'],
      shortTermImpact: 'AI 供應鏈情緒偏多，但財報指引與 capex 語氣會放大波動。',
      longTermImpact: '如果 AI 推論需求與 agentic AI 工作負載持續成長，資料中心升級週期可能延伸多年。',
      evidenceQuality: 'High'
    },
    {
      id: 'theme-real-memory-packaging',
      name: '記憶體與先進封裝瓶頸',
      whyItMatters:
        'AI 加速器不只需要晶圓代工，也需要 HBM、DRAM、先進封裝、載板、測試與設備。任何瓶頸都會把價值轉移給上游或第三層供應商。',
      relatedIndustries: ['HBM', 'DRAM', '晶圓代工', '先進封裝', 'ABF 載板', '測試'],
      relatedCompanies: ['TSM', 'MU', 'ASX', '3037.TW', '2449.TW', 'AMAT', 'ASML'],
      shortTermImpact: '記憶體報價與封裝產能是短線催化劑。',
      longTermImpact: 'chiplet、HBM、CoWoS/SoIC 類技術提高半導體後段與材料價值量。',
      evidenceQuality: 'High'
    },
    {
      id: 'theme-real-infra-bottlenecks',
      name: '液冷 / 電源 / 光通訊升級',
      whyItMatters:
        'AI rack 功率密度上升，使資料中心瓶頸從晶片延伸到電源、液冷、光通訊、連接器與施工資源。',
      relatedIndustries: ['液冷', '高壓電源', 'UPS', '光收發模組', '高速交換器', '連接器'],
      relatedCompanies: ['VRT', 'ETN', 'LITE', 'COHR', 'AVGO', '2308.TW', '3017.TW', '2345.TW'],
      shortTermImpact: '訂單、backlog、產品認證與元件短缺會快速影響股價。',
      longTermImpact: 'AI cluster 密度提高後，資料中心基礎設施價值占比可能持續提升。',
      evidenceQuality: 'Medium'
    }
  ],
  supplyChain: [
    {
      id: 'node-real-nvda',
      companyName: 'NVIDIA',
      ticker: 'NVDA',
      marketCountry: '美國',
      layer: 1,
      linkedThemeId: 'theme-real-csp-capex',
      whyItMayBenefit: 'GPU、networking 與 AI platform 仍是 hyperscaler capex 的核心採購項目。',
      evidenceStrength: 'High',
      visibility: 'Obvious',
      keyRisk: '高估值、客戶自研 ASIC、供應鏈交期與出口限制。'
    },
    {
      id: 'node-real-tsm',
      companyName: '台積電',
      ticker: 'TSM',
      marketCountry: '台灣 / 美國 ADR',
      layer: 1,
      linkedThemeId: 'theme-real-memory-packaging',
      whyItMayBenefit: 'AI/HPC 先進製程與先進封裝需求支撐高 capex 與長期產能建置。',
      evidenceStrength: 'High',
      visibility: 'Obvious',
      keyRisk: 'AI 投資回報若被質疑、地緣政治、海外廠成本與封裝擴產節奏。'
    },
    {
      id: 'node-real-avgo',
      companyName: 'Broadcom',
      ticker: 'AVGO',
      marketCountry: '美國',
      layer: 1,
      linkedThemeId: 'theme-real-csp-capex',
      whyItMayBenefit: '客製 ASIC、交換晶片與高速連接是 AI data center scale-out 的關鍵。',
      evidenceStrength: 'Medium',
      visibility: 'Obvious',
      keyRisk: '客製 ASIC 訂單集中、客戶自研與大型交易整合風險。'
    },
    {
      id: 'node-real-mu',
      companyName: 'Micron',
      ticker: 'MU',
      marketCountry: '美國',
      layer: 2,
      linkedThemeId: 'theme-real-memory-packaging',
      whyItMayBenefit: 'AI server 與 HBM/DRAM 需求緊俏，提高記憶體供應商定價力。',
      evidenceStrength: 'High',
      visibility: 'Obvious',
      keyRisk: '記憶體循環反轉、客戶庫存、capex 擴張造成供給回升。'
    },
    {
      id: 'node-real-vrt',
      companyName: 'Vertiv',
      ticker: 'VRT',
      marketCountry: '美國',
      layer: 2,
      linkedThemeId: 'theme-real-infra-bottlenecks',
      whyItMayBenefit: 'UPS、配電、機櫃與液冷設備直接受惠高密度 AI rack 部署。',
      evidenceStrength: 'Medium',
      visibility: 'Obvious',
      keyRisk: '市場擔心 2026 下半年至 2027 年電力/散熱供給過剩與估值壓縮。'
    },
    {
      id: 'node-real-lite',
      companyName: 'Lumentum',
      ticker: 'LITE',
      marketCountry: '美國',
      layer: 3,
      linkedThemeId: 'theme-real-infra-bottlenecks',
      whyItMayBenefit: 'AI data center 800G/1.6T 光通訊升級增加雷射與光元件需求。',
      evidenceStrength: 'Medium',
      visibility: 'Hidden',
      keyRisk: '光通訊週期波動、客戶認證與元件價格競爭。'
    },
    {
      id: 'node-real-accton',
      companyName: '智邦',
      ticker: '2345.TW',
      marketCountry: '台灣',
      layer: 3,
      linkedThemeId: 'theme-real-infra-bottlenecks',
      whyItMayBenefit: 'AI cluster 需要高速交換器與 white-box networking，台系網通供應鏈可能受惠。',
      evidenceStrength: 'Medium',
      visibility: 'Hidden',
      keyRisk: '客戶拉貨波動、產品組合與競爭壓力。'
    },
    {
      id: 'node-real-kyec',
      companyName: '京元電子',
      ticker: '2449.TW',
      marketCountry: '台灣',
      layer: 4,
      linkedThemeId: 'theme-real-memory-packaging',
      whyItMayBenefit: 'AI 晶片測試時間與複雜度提高，測試產能若緊張會形成瓶頸價值。',
      evidenceStrength: 'Low',
      visibility: 'Hidden',
      keyRisk: '客戶與 AI 相關占比不透明，需用財報與產能資料驗證。'
    },
    {
      id: 'node-real-delta',
      companyName: '台達電',
      ticker: '2308.TW',
      marketCountry: '台灣',
      layer: 4,
      linkedThemeId: 'theme-real-infra-bottlenecks',
      whyItMayBenefit: '資料中心電源、能源效率、風扇與熱管理方案可能受惠 AI power density 上升。',
      evidenceStrength: 'Medium',
      visibility: 'Hidden',
      keyRisk: 'AI 資料中心收入拆分不易，估值可能已提前反映。'
    },
    {
      id: 'node-real-auras',
      companyName: '奇鋐',
      ticker: '3017.TW',
      marketCountry: '台灣',
      layer: 4,
      linkedThemeId: 'theme-real-infra-bottlenecks',
      whyItMayBenefit: '液冷與高階散熱零組件有機會受惠高功耗伺服器升級。',
      evidenceStrength: 'Low',
      visibility: 'Hidden',
      keyRisk: '需確認液冷認證、出貨節奏與毛利率。'
    }
  ],
  beneficiaries: [
    {
      id: 'benefit-real-csp-capex',
      themeId: 'theme-real-csp-capex',
      directBeneficiaries: ['NVDA', 'AVGO', 'TSM', '雲端服務商'],
      indirectBeneficiaries: ['伺服器 ODM', '高速交換器', '資料中心施工與電力工程'],
      hiddenBeneficiaries: ['連接器', '線束', '機櫃', '電力接入工程', '電源管理 IC'],
      companiesMayBeHurt: ['低速網通零組件', '無 AI exposure 的傳統伺服器供應鏈'],
      reasoning: 'capex 上修先推升加速器與 ASIC，再向伺服器、網路、電源與建設供應鏈擴散。',
      evidenceQuality: 'High',
      researchPriorityScore: 95
    },
    {
      id: 'benefit-real-memory-packaging',
      themeId: 'theme-real-memory-packaging',
      directBeneficiaries: ['TSM', 'MU', 'SK Hynix', 'Samsung'],
      indirectBeneficiaries: ['ASX', 'AMAT', 'ASML', '3037.TW', '2449.TW'],
      hiddenBeneficiaries: ['測試介面', 'ABF 載板材料', '封裝設備', 'TSV 設備', '清洗檢測'],
      companiesMayBeHurt: ['記憶體重成本但缺乏定價力的下游客戶'],
      reasoning: 'AI 需求讓 HBM/DRAM/封裝產能緊張，瓶頸會提高供應商議價能力，也會放大成本壓力。',
      evidenceQuality: 'High',
      researchPriorityScore: 93
    },
    {
      id: 'benefit-real-infra',
      themeId: 'theme-real-infra-bottlenecks',
      directBeneficiaries: ['VRT', 'ETN', 'LITE', 'COHR'],
      indirectBeneficiaries: ['2308.TW', '3017.TW', '2345.TW'],
      hiddenBeneficiaries: ['CDU', '冷板', '光引擎', '高壓 DC 系統', '連接器與線纜'],
      companiesMayBeHurt: ['傳統低功率散熱供應商', '缺乏高速產品的網通廠'],
      reasoning: 'AI rack 功率與 data movement 上升後，散熱、電源與光通訊成為資料中心擴建的非晶片瓶頸。',
      evidenceQuality: 'Medium',
      researchPriorityScore: 89
    }
  ],
  companyResearch: [
    {
      id: 'company-real-tsm',
      companyName: '台積電',
      ticker: 'TSM',
      marketCountry: '台灣 / 美國 ADR',
      overview: '全球領先晶圓代工廠，AI/HPC 先進製程與先進封裝需求是目前最重要的研究主線。',
      businessModel: '提供先進製程晶圓代工、成熟製程與先進封裝服務，收入來自 fabless、IDM 與 HPC/AI 客戶。',
      revenueDrivers: ['AI/HPC 處理器', '先進製程稼動率', 'CoWoS/先進封裝', '主要客戶新平台'],
      latestFinancialReportSummary:
        '公開報導指出台積電 2025 年營收創高，AI/HPC 處理器占比高，2026 年 capex 規劃 520 至 560 億美元。',
      revenueGrowth: '偏正向，取決於 AI/HPC 需求與先進封裝供給。',
      grossMargin: '長期有定價力，但海外廠、折舊與先進封裝擴產會影響短期毛利。',
      eps: '受先進製程稼動率、匯率與 capex 折舊影響。',
      freeCashFlow: '高 capex 期間自由現金流壓力較大，但若 AI 需求真實，可支撐長期回收。',
      valuationRisk: '市場已視為 AI 核心資產，若 capex 回報被質疑，本益比可能壓縮。',
      technicalTrend: '研究觀點偏正向，但不追價；等待財報與需求驗證。',
      competitors: ['Samsung Foundry', 'Intel Foundry'],
      bullCase: 'AI/HPC、先進製程與先進封裝需求多年超預期。',
      baseCase: '需求強但需要逐季用營收、毛利與 capex 效率驗證。',
      bearCase: 'AI capex 泡沫、地緣政治、封裝擴產不順或客戶砍單。',
      keyRisks: ['地緣政治', '海外廠成本', 'AI demand overbuild', '先進封裝瓶頸'],
      finalView: 'Positive',
      suggestedAction: 'Watch',
      whatWouldChangeView: '若雲端 capex 明確下修、CoWoS 需求鬆動或毛利率明顯低於預期，需下修觀點。'
    },
    {
      id: 'company-real-mu',
      companyName: 'Micron',
      ticker: 'MU',
      marketCountry: '美國',
      overview: '記憶體供應商，AI server、HBM 與 DRAM 供給吃緊使其具備研究價值。',
      businessModel: '銷售 DRAM、NAND、HBM 與資料中心/終端記憶體產品。',
      revenueDrivers: ['HBM', 'server DRAM', 'enterprise SSD', '合約價上漲', 'AI server 採購'],
      latestFinancialReportSummary: '公開產業研究顯示 AI/data center demand 推升 DRAM/NAND 合約價格與供應商定價力。',
      revenueGrowth: '記憶體價格上行時營收彈性大。',
      grossMargin: '價格上行與產品組合改善可推升毛利，但循環反轉也很快。',
      eps: '高度受 ASP 與產能利用率影響。',
      freeCashFlow: '景氣上行有改善空間，仍需觀察 capex 與庫存。',
      valuationRisk: '記憶體股具有高循環性，市場容易在高峰給錯倍數。',
      technicalTrend: '題材與基本面共振，但需避免在報價過熱時追高。',
      competitors: ['SK Hynix', 'Samsung'],
      bullCase: 'HBM/DRAM 缺貨延續，AI server 對高階記憶體需求持續超預期。',
      baseCase: '價格上行支撐財報，但週期風險需每季追蹤。',
      bearCase: '客戶庫存回補結束、供給擴張或 AI capex 放緩。',
      keyRisks: ['記憶體循環', '庫存反轉', '客戶集中', 'capex 擴張'],
      finalView: 'Positive',
      suggestedAction: 'Watch',
      whatWouldChangeView: '若 DRAM/HBM 報價轉弱或 CSP 長約採購放緩，需下修。'
    },
    {
      id: 'company-real-vrt',
      companyName: 'Vertiv',
      ticker: 'VRT',
      marketCountry: '美國',
      overview: 'AI 資料中心電源、散熱與基礎設施供應商，是非晶片 AI infrastructure 的代表標的。',
      businessModel: '銷售 UPS、配電、switchgear、機櫃、液冷與資料中心服務。',
      revenueDrivers: ['AI rack power density', '液冷部署', '資料中心新建', 'brownfield retrofit', 'backlog 轉營收'],
      latestFinancialReportSummary: '公開報導指出市場同時關注 backlog 強勁與 2026/2027 供給過剩疑慮。',
      revenueGrowth: '資料中心 capex 高檔可支撐成長。',
      grossMargin: '產品組合與供應鏈成本決定毛利彈性。',
      eps: '營運槓桿高，但估值對成長失望敏感。',
      freeCashFlow: '大型專案轉交付後有改善空間。',
      valuationRisk: 'AI infrastructure 溢價已高，capex 放緩會壓縮倍數。',
      technicalTrend: '適合觀察回檔與財報確認，不適合純題材追高。',
      competitors: ['Eaton', 'Schneider Electric', 'nVent'],
      bullCase: '液冷成為高密度 AI rack 標配，backlog 持續擴張。',
      baseCase: '需求強但市場逐步檢視估值與交付品質。',
      bearCase: '電力接入延後、capex 正常化或設備供給過剩。',
      keyRisks: ['估值', '專案遞延', '供給過剩討論', '關稅與供應鏈成本'],
      finalView: 'Neutral',
      suggestedAction: 'Wait',
      whatWouldChangeView: '若回檔後估值合理且訂單/毛利持續改善，可轉正向；若 capex 放緩則轉負向。'
    },
    {
      id: 'company-real-lite',
      companyName: 'Lumentum',
      ticker: 'LITE',
      marketCountry: '美國',
      overview: '光通訊與雷射元件供應商，AI cluster 高速互連升級使其成為隱藏受惠研究標的。',
      businessModel: '提供光學元件、雷射與通訊相關產品給資料中心、電信與工業客戶。',
      revenueDrivers: ['800G/1.6T 光通訊', 'AI data center interconnect', '光元件供需', '客戶認證'],
      latestFinancialReportSummary: '產業研究指向 AI optical transceiver 市場快速成長，元件短缺可能成為瓶頸。',
      revenueGrowth: '取決於 AI 光通訊產品滲透與客戶拉貨。',
      grossMargin: '若高階光元件供給緊張，毛利有改善空間。',
      eps: '仍受光通訊週期與產品組合影響。',
      freeCashFlow: '需觀察庫存、capex 與高階產品出貨。',
      valuationRisk: '光通訊題材熱時估值容易提前反映。',
      technicalTrend: '研究優先級提高，但證據需用訂單與財報確認。',
      competitors: ['Coherent', 'Broadcom', 'Innolight'],
      bullCase: 'AI 800G/1.6T 升級推升雷射與光元件供需緊張。',
      baseCase: '受惠趨勢成立，但需確認量產、良率與客戶分散。',
      bearCase: '價格競爭、規格轉換慢於預期或客戶庫存調整。',
      keyRisks: ['產品週期', '客戶集中', '價格競爭', '認證進度'],
      finalView: 'Neutral',
      suggestedAction: 'Watch',
      whatWouldChangeView: '若看到 AI data center 光通訊訂單、毛利與 backlog 同步改善，可提高觀點。'
    }
  ],
  watchlist: [
    {
      id: 'watch-real-tsm',
      ticker: 'TSM',
      companyName: '台積電',
      currentView: 'Positive',
      keyNews: '2026 年高 capex 與 AI/HPC demand 支撐，但公司也強調需驗證需求真實性。',
      keyPriceLevels: '實測未接即時報價；先以財報與長期均線做觀察框架。',
      riskNotes: 'AI capex 下修、地緣政治、海外廠毛利。',
      lastUpdatedTime: '2026-06-01 21:45',
      status: 'Watching'
    },
    {
      id: 'watch-real-mu',
      ticker: 'MU',
      companyName: 'Micron',
      currentView: 'Positive',
      keyNews: 'AI server demand 推升 DRAM/HBM pricing power。',
      keyPriceLevels: '實測未接即時報價；等待報價與財報確認。',
      riskNotes: '記憶體循環與庫存反轉。',
      lastUpdatedTime: '2026-06-01 21:45',
      status: 'Researching'
    },
    {
      id: 'watch-real-vrt',
      ticker: 'VRT',
      companyName: 'Vertiv',
      currentView: 'Neutral',
      keyNews: '液冷與電源受惠清楚，但市場同時討論 2026/2027 供給過剩。',
      keyPriceLevels: '實測未接即時報價；等待估值與訂單品質確認。',
      riskNotes: 'capex 正常化、估值壓縮、專案遞延。',
      lastUpdatedTime: '2026-06-01 21:45',
      status: 'Waiting'
    },
    {
      id: 'watch-real-lite',
      ticker: 'LITE',
      companyName: 'Lumentum',
      currentView: 'Neutral',
      keyNews: 'AI optical transceiver 市場快速成長，元件短缺是潛在瓶頸。',
      keyPriceLevels: '實測未接即時報價；等待訂單與毛利率訊號。',
      riskNotes: '光通訊週期與價格競爭。',
      lastUpdatedTime: '2026-06-01 21:45',
      status: 'Researching'
    }
  ],
  ideaPipeline: [
    {
      id: 'idea-real-tsm',
      newsId: 'real-news-tsmc-capex',
      themeId: 'theme-real-memory-packaging',
      supplyChainNodeId: 'node-real-tsm',
      companyResearchId: 'company-real-tsm',
      finalView: 'Positive',
      explanation:
        '新聞指出台積電高 capex 與 AI/HPC 需求，主題連到先進製程/封裝瓶頸，供應鏈層級是直接核心受惠者，因此列為正向觀察。'
    },
    {
      id: 'idea-real-mu',
      newsId: 'real-news-memory-pricing',
      themeId: 'theme-real-memory-packaging',
      supplyChainNodeId: 'node-real-mu',
      companyResearchId: 'company-real-mu',
      finalView: 'Positive',
      explanation:
        'TrendForce 記憶體價格與 AI server demand 資料支持 HBM/DRAM 供給吃緊，Micron 是直接受惠者，但仍需用週期框架管理風險。'
    },
    {
      id: 'idea-real-vrt',
      newsId: 'real-news-cooling-power',
      themeId: 'theme-real-infra-bottlenecks',
      supplyChainNodeId: 'node-real-vrt',
      companyResearchId: 'company-real-vrt',
      finalView: 'Neutral',
      explanation:
        '液冷與電源升級邏輯明確，但市場同步擔心供給過剩與 capex 正常化，所以目前是等待而非追價。'
    },
    {
      id: 'idea-real-lite',
      newsId: 'real-news-optics',
      themeId: 'theme-real-infra-bottlenecks',
      supplyChainNodeId: 'node-real-lite',
      companyResearchId: 'company-real-lite',
      finalView: 'Neutral',
      explanation:
        'AI 光通訊市場成長與元件短缺指向第三層隱藏受惠者，Lumentum 需要進一步驗證訂單、良率與毛利。'
    }
  ]
};

async function main() {
  const json = `${JSON.stringify(report, null, 2)}\n`;
  await mkdir(reportsDir, { recursive: true });
  await writeFile(path.join(dataDir, 'latest.json'), json, 'utf8');
  await writeFile(path.join(reportsDir, `${report.date}.json`), json, 'utf8');
  console.log(`Generated real-source practice report for ${report.date}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
