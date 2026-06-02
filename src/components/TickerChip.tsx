import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, ExternalLink, X } from 'lucide-react';
import { dailyReport } from '../data/report';

interface TickerInfo {
  ticker: string;
  companyName: string;
  market: string;
  description: string;
  source: '深入研究' | '供應鏈' | '觀察清單' | '雷達對照';
}

const tickerPattern = /^([A-Z]{1,5}|\d{4}\.TW)$/;

const tickerReference: Record<string, Omit<TickerInfo, 'ticker' | 'source'>> = {
  SPY: { companyName: 'SPDR S&P 500 ETF', market: 'US', description: '美股大型股風險偏好與資金流向代理。' },
  QQQ: { companyName: 'Invesco QQQ ETF', market: 'US', description: 'Nasdaq 100 / 大型科技股風險偏好代理。' },
  SOXX: { companyName: 'iShares Semiconductor ETF', market: 'US', description: '美股半導體族群 read-through 指標。' },
  NVDA: { companyName: 'NVIDIA', market: 'US', description: 'AI accelerator、GPU、networking 與 AI 平台規格制定者。' },
  MSFT: { companyName: 'Microsoft', market: 'US', description: 'Azure、OpenAI 生態、企業 AI 與 cloud capex 觀察指標。' },
  AVGO: { companyName: 'Broadcom', market: 'US', description: 'AI ASIC、networking、VMware 與 custom silicon 需求代表。' },
  MU: { companyName: 'Micron', market: 'US', description: 'HBM、DRAM、NAND 與記憶體循環 read-through 指標。' },
  MRVL: { companyName: 'Marvell Technology', market: 'US', description: 'AI custom silicon、光通訊 DSP、資料中心 networking 與 storage silicon。' },
  AMD: { companyName: 'Advanced Micro Devices', market: 'US', description: 'AI GPU、CPU、server share 與 accelerator 競爭格局觀察。' },
  INTC: { companyName: 'Intel', market: 'US', description: 'CPU、foundry、PC/server cycle 與美國半導體政策觀察。' },
  TSM: { companyName: 'TSMC ADR', market: 'US', description: '台積電 ADR，先進製程與先進封裝需求的美股代理。' },
  GOOGL: { companyName: 'Alphabet', market: 'US', description: 'Google Cloud、AI 搜尋與自研 TPU 觀察指標。' },
  AMZN: { companyName: 'Amazon', market: 'US', description: 'AWS capex、AI 雲端需求與自研晶片觀察指標。' },
  META: { companyName: 'Meta Platforms', market: 'US', description: 'AI capex、廣告 monetization 與 Llama 生態觀察指標。' },
  AAPL: { companyName: 'Apple', market: 'US', description: 'AI device、供應鏈與消費電子需求觀察指標。' },
  TSLA: { companyName: 'Tesla', market: 'US', description: 'EV、能源儲存、機器人與自動駕駛題材指標。' },
  ORCL: { companyName: 'Oracle', market: 'US', description: 'AI cloud、資料庫與 GPU 雲端基建觀察指標。' },
  PLTR: { companyName: 'Palantir', market: 'US', description: '政府與企業 AI 軟體、AIP adoption 與 defense AI 觀察。' },
  SNOW: { companyName: 'Snowflake', market: 'US', description: '企業資料平台與 AI 應用 monetization 指標。' },
  DDOG: { companyName: 'Datadog', market: 'US', description: '雲端監控、AI infra observability 與企業軟體需求。' },
  MDB: { companyName: 'MongoDB', market: 'US', description: '開發者資料庫與 AI app backend 需求觀察。' },
  CRM: { companyName: 'Salesforce', market: 'US', description: '企業 AI agent、CRM 軟體與 monetization 指標。' },
  NOW: { companyName: 'ServiceNow', market: 'US', description: '企業 workflow automation 與 AI agent adoption 指標。' },
  ETN: { companyName: 'Eaton', market: 'US', description: '資料中心配電、電力設備與電氣化需求。' },
  GEV: { companyName: 'GE Vernova', market: 'US', description: '電網、發電設備與 AI data center 電力瓶頸。' },
  CEG: { companyName: 'Constellation Energy', market: 'US', description: '核能與資料中心長約電力需求觀察。' },
  NEE: { companyName: 'NextEra Energy', market: 'US', description: '再生能源、公用事業與資料中心用電需求。' },
  VST: { companyName: 'Vistra', market: 'US', description: '電力供給、核電/天然氣與 AI 用電題材。' },
  PWR: { companyName: 'Quanta Services', market: 'US', description: '電網工程與資料中心電力基建供應商。' },
  CRWD: { companyName: 'CrowdStrike', market: 'US', description: '雲端資安與企業安全預算指標。' },
  PANW: { companyName: 'Palo Alto Networks', market: 'US', description: '平台化資安與企業安全支出指標。' },
  NET: { companyName: 'Cloudflare', market: 'US', description: '網路邊緣、資安與 AI inference infra 觀察。' },
  LMT: { companyName: 'Lockheed Martin', market: 'US', description: '美國國防預算與軍工科技指標。' },
  RTX: { companyName: 'RTX', market: 'US', description: '國防航太、飛彈系統與商用航太需求。' },
  DELL: { companyName: 'Dell Technologies', market: 'US', description: 'AI server backlog、enterprise hardware 與資料中心建置需求。' },
  HPE: { companyName: 'HPE', market: 'US', description: '企業伺服器、AI systems 與 hybrid cloud 基建觀察。' },
  SMCI: { companyName: 'Super Micro Computer', market: 'US', description: 'AI server 整機、液冷機櫃與高波動硬體鏈指標。' },
  VRT: { companyName: 'Vertiv', market: 'US', description: '資料中心電力、散熱、UPS 與 AI data center 基建代表。' },
  ANET: { companyName: 'Arista Networks', market: 'US', description: 'AI data center switching、ethernet networking 與 cloud capex 觀察。' },
  '2408.TW': { companyName: '南亞科', market: 'Taiwan', description: 'DRAM、利基記憶體與記憶體報價循環受惠候選。' },
  '2337.TW': { companyName: '旺宏', market: 'Taiwan', description: 'NOR Flash、NAND 與利基記憶體循環觀察標的。' },
  '8299.TW': { companyName: '群聯', market: 'Taiwan', description: 'NAND 控制 IC、SSD 模組與儲存需求觀察標的。' },
  '2344.TW': { companyName: '華邦電', market: 'Taiwan', description: 'DRAM、NOR Flash、利基記憶體與報價循環觀察。' },
  '3481.TW': { companyName: '群創', market: 'Taiwan', description: '面板、FOPLP、玻璃基板與低基期轉型題材。' },
  '2409.TW': { companyName: '友達', market: 'Taiwan', description: '面板、Micro LED、車用顯示與低基期題材。' },
  '6116.TW': { companyName: '彩晶', market: 'Taiwan', description: '中小尺寸面板、低基期與題材資金動能觀察。' },
  '2330.TW': { companyName: '台積電', market: 'Taiwan', description: '先進製程、CoWoS、先進封裝與全球 AI accelerator 供應鏈核心。' },
  '2317.TW': { companyName: '鴻海', market: 'Taiwan', description: 'AI server、電動車與全球 EMS 龍頭。' },
  '2382.TW': { companyName: '廣達', market: 'Taiwan', description: 'AI server、雲端資料中心與高階伺服器 ODM 龍頭。' },
  '2324.TW': { companyName: '仁寶', market: 'Taiwan', description: 'PC ODM、AI server 轉型與低基期伺服器候選。' },
  '2356.TW': { companyName: '英業達', market: 'Taiwan', description: '伺服器、PC ODM 與 AI server 轉型候選。' },
  '3706.TW': { companyName: '神達', market: 'Taiwan', description: '伺服器、車用電子與 AI server 題材候選。' },
  '6669.TW': { companyName: '緯穎', market: 'Taiwan', description: 'AI server、雲端資料中心與高階伺服器 ODM 代表。' },
  '3231.TW': { companyName: '緯創', market: 'Taiwan', description: 'AI server、ODM、智慧工廠與 NVIDIA supply-chain read-through。' },
  '2308.TW': { companyName: '台達電', market: 'Taiwan', description: '電源、散熱、資料中心基建、工業自動化與電動車。' },
  '3017.TW': { companyName: '奇鋐', market: 'Taiwan', description: '散熱、液冷、AI server thermal solution 代表。' },
  '3324.TW': { companyName: '雙鴻', market: 'Taiwan', description: '散熱模組、液冷與 AI server thermal solution。' },
  '3653.TW': { companyName: '健策', market: 'Taiwan', description: '均熱片、散熱零組件與高階 AI server thermal 供應鏈。' },
  '2301.TW': { companyName: '光寶科', market: 'Taiwan', description: '電源、光電、雲端電源與資料中心基建。' },
  '6282.TW': { companyName: '康舒', market: 'Taiwan', description: '電源供應器、資料中心電源與車用電源題材。' },
  '2345.TW': { companyName: '智邦', market: 'Taiwan', description: '白牌交換器、AI networking 與資料中心網路供應鏈。' },
  '2383.TW': { companyName: '台光電', market: 'Taiwan', description: 'CCL、高速材料與 AI server / networking PCB 供應鏈核心。' },
  '2368.TW': { companyName: '金像電', market: 'Taiwan', description: 'AI server PCB 與高階伺服器板供應商。' },
  '3037.TW': { companyName: '欣興', market: 'Taiwan', description: 'ABF 載板、PCB 與先進封裝材料鏈。' },
  '3189.TW': { companyName: '景碩', market: 'Taiwan', description: 'IC 載板與高階封裝供應鏈。' },
  '4977.TW': { companyName: '眾達-KY', market: 'Taiwan', description: '光通訊模組與高速網路題材。' },
  '3081.TW': { companyName: '聯亞', market: 'Taiwan', description: '光通訊磊晶、雷射元件與高速光通訊供應鏈。' },
  '3163.TW': { companyName: '波若威', market: 'Taiwan', description: '光纖元件、光通訊模組與資料中心網路題材。' },
  '2454.TW': { companyName: '聯發科', market: 'Taiwan', description: '手機 SoC、Edge AI、ASIC 與車用平台。' },
  '3034.TW': { companyName: '聯詠', market: 'Taiwan', description: '顯示驅動 IC、TDDI 與面板需求指標。' },
  '3661.TW': { companyName: '世芯-KY', market: 'Taiwan', description: 'ASIC 設計服務與 AI 客製晶片供應鏈。' },
  '3443.TW': { companyName: '創意', market: 'Taiwan', description: 'ASIC / IP 設計服務與先進製程設計服務。' },
  '5274.TW': { companyName: '信驊', market: 'Taiwan', description: 'BMC 晶片與伺服器管理晶片龍頭。' },
  '4966.TW': { companyName: '譜瑞-KY', market: 'Taiwan', description: '高速介面、USB/PCIe retimer 與高速傳輸 IC。' },
  '2481.TW': { companyName: '強茂', market: 'Taiwan', description: '二極體、MOSFET、功率元件與車用/電源供應鏈。' },
  '5425.TW': { companyName: '台半', market: 'Taiwan', description: '功率半導體、二極體、MOSFET 與車用/工控應用。' },
  '3675.TW': { companyName: '德微', market: 'Taiwan', description: '二極體、MOSFET 與功率元件供應商。' },
  '6435.TW': { companyName: '大中', market: 'Taiwan', description: 'MOSFET 與功率元件，電源與車用題材候選。' },
  '8261.TW': { companyName: '富鼎', market: 'Taiwan', description: 'MOSFET 與功率元件供應商。' },
  '2327.TW': { companyName: '國巨', market: 'Taiwan', description: 'MLCC、電阻與被動元件龍頭。' },
  '2492.TW': { companyName: '華新科', market: 'Taiwan', description: 'MLCC 與被動元件供應商。' },
  '3026.TW': { companyName: '禾伸堂', market: 'Taiwan', description: 'MLCC 與被動元件供應商。' },
  '6173.TW': { companyName: '信昌電', market: 'Taiwan', description: '被動元件與材料供應商。' },
  '3042.TW': { companyName: '晶技', market: 'Taiwan', description: '石英元件、車用與通訊頻率元件。' },
  '2881.TW': { companyName: '富邦金', market: 'Taiwan', description: '金控、壽險與金融股風向球。' },
  '2882.TW': { companyName: '國泰金', market: 'Taiwan', description: '金控、壽險與利率/匯率敏感股。' },
  '2884.TW': { companyName: '玉山金', market: 'Taiwan', description: '銀行型金控與高品質金融股代表。' },
  '2885.TW': { companyName: '元大金', market: 'Taiwan', description: '證券、ETF 與資本市場交易量受惠。' },
  '2886.TW': { companyName: '兆豐金', market: 'Taiwan', description: '銀行型金控與高股息金融代表。' },
  '2603.TW': { companyName: '長榮', market: 'Taiwan', description: '貨櫃航運與運價循環指標。' },
  '2609.TW': { companyName: '陽明', market: 'Taiwan', description: '貨櫃航運與運價循環指標。' },
  '2002.TW': { companyName: '中鋼', market: 'Taiwan', description: '鋼鐵景氣、原物料與基建需求指標。' },
  '1301.TW': { companyName: '台塑', market: 'Taiwan', description: '石化與原物料景氣指標。' },
  '1303.TW': { companyName: '南亞', market: 'Taiwan', description: '塑化、電子材料與景氣循環指標。' },
  '6505.TW': { companyName: '台塑化', market: 'Taiwan', description: '煉油、油價與能源景氣指標。' },
  '6446.TW': { companyName: '藥華藥', market: 'Taiwan', description: '新藥、生技與海外銷售題材。' },
  '4743.TW': { companyName: '合一', market: 'Taiwan', description: '新藥與生技題材股。' },
  '4162.TW': { companyName: '智擎', market: 'Taiwan', description: '新藥授權與生技里程碑題材。' },
};

export function TickerChip({ value, groupValues }: { value: string; groupValues?: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const info = useTickerInfo(value);
  const groupInfos = useMemo(
    () => (groupValues ?? [value]).filter((item) => tickerPattern.test(item)).map((ticker) => resolveTickerInfo(ticker)),
    [groupValues, value],
  );

  if (!tickerPattern.test(value)) {
    return <span className="chip">{value}</span>;
  }

  return (
    <>
      <button
        type="button"
        className="chip cursor-pointer transition hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-cyan-200/15 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
        onClick={() => setIsOpen(true)}
      >
        {value}
        <ExternalLink className="h-3 w-3 opacity-70" />
      </button>

      {isOpen ? createPortal(<TickerModal info={info} groupInfos={groupInfos} onClose={() => setIsOpen(false)} />, document.body) : null}
    </>
  );
}

function TickerModal({ info, groupInfos, onClose }: { info: TickerInfo; groupInfos: TickerInfo[]; onClose: () => void }) {
  const isGroup = groupInfos.length > 1;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/70 p-3 backdrop-blur-sm sm:place-items-center" onClick={onClose}>
      <section
        className="max-h-[82vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b111d] p-4 shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              {isGroup ? `${groupInfos.length} tickers` : `${info.market} · ${info.source}`}
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-white">
              <Building2 className="h-5 w-5 text-cyan-200" />
              {isGroup ? '完整相關公司清單' : info.companyName}
            </h2>
            <p className="mt-1 text-sm text-cyan-200">
              {isGroup ? `由 ${info.ticker} 開啟` : info.ticker}
            </p>
          </div>
          <button
            type="button"
            aria-label="關閉股票資訊"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isGroup ? (
          <div className="mt-4 space-y-3">
            {groupInfos.map((company) => (
              <article key={company.ticker} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-white">{company.companyName}</h3>
                    <p className="mt-1 text-xs text-cyan-200">{company.ticker} · {company.market}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-300">{company.source}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{company.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-300">{info.description}</p>
        )}
      </section>
    </div>
  );
}

function useTickerInfo(ticker: string): TickerInfo {
  return useMemo(() => resolveTickerInfo(ticker), [ticker]);
}

function resolveTickerInfo(ticker: string): TickerInfo {
  const company = dailyReport.companyResearch.find((item) => item.ticker === ticker);
  if (company) {
    return {
      ticker,
      companyName: company.companyName,
      market: company.marketCountry,
      description: company.overview,
      source: '深入研究',
    };
  }

  const node = dailyReport.supplyChain.find((item) => item.ticker === ticker);
  if (node) {
    return {
      ticker,
      companyName: node.companyName,
      market: node.marketCountry,
      description: node.whyItMayBenefit,
      source: '供應鏈',
    };
  }

  const watch = dailyReport.watchlist.find((item) => item.ticker === ticker);
  if (watch) {
    return {
      ticker,
      companyName: watch.companyName,
      market: ticker.endsWith('.TW') ? 'Taiwan' : 'US',
      description: watch.keyNews,
      source: '觀察清單',
    };
  }

  const reference = tickerReference[ticker];
  if (reference) return { ticker, ...reference, source: '雷達對照' };

  return {
    ticker,
    companyName: '尚未建立公司名稱',
    market: ticker.endsWith('.TW') ? 'Taiwan' : 'US',
    description: '此代碼目前只在掃描清單中；若當天有新催化或資料驗證，會補入公司研究或雷達對照表。',
    source: '雷達對照',
  };
}
