import { useMemo, useState } from 'react';
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
  GOOGL: { companyName: 'Alphabet', market: 'US', description: 'Google Cloud、AI 搜尋與自研 TPU 觀察指標。' },
  AMZN: { companyName: 'Amazon', market: 'US', description: 'AWS capex、AI 雲端需求與自研晶片觀察指標。' },
  META: { companyName: 'Meta Platforms', market: 'US', description: 'AI capex、廣告 monetization 與 Llama 生態觀察指標。' },
  AAPL: { companyName: 'Apple', market: 'US', description: 'AI device、供應鏈與消費電子需求觀察指標。' },
  TSLA: { companyName: 'Tesla', market: 'US', description: 'EV、能源儲存、機器人與自動駕駛題材指標。' },
  ORCL: { companyName: 'Oracle', market: 'US', description: 'AI cloud、資料庫與 GPU 雲端基建觀察指標。' },
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
  '2408.TW': { companyName: '南亞科', market: 'Taiwan', description: 'DRAM、利基記憶體與記憶體報價循環受惠候選。' },
  '2337.TW': { companyName: '旺宏', market: 'Taiwan', description: 'NOR Flash、NAND 與利基記憶體循環觀察標的。' },
  '8299.TW': { companyName: '群聯', market: 'Taiwan', description: 'NAND 控制 IC、SSD 模組與儲存需求觀察標的。' },
  '2409.TW': { companyName: '友達', market: 'Taiwan', description: '面板、Micro LED、車用顯示與低基期題材。' },
  '2317.TW': { companyName: '鴻海', market: 'Taiwan', description: 'AI server、電動車與全球 EMS 龍頭。' },
  '2356.TW': { companyName: '英業達', market: 'Taiwan', description: '伺服器、PC ODM 與 AI server 轉型候選。' },
  '3706.TW': { companyName: '神達', market: 'Taiwan', description: '伺服器、車用電子與 AI server 題材候選。' },
  '6669.TW': { companyName: '緯穎', market: 'Taiwan', description: 'AI server、雲端資料中心與高階伺服器 ODM 代表。' },
  '2383.TW': { companyName: '台光電', market: 'Taiwan', description: 'CCL、高速材料與 AI server / networking PCB 供應鏈核心。' },
  '2368.TW': { companyName: '金像電', market: 'Taiwan', description: 'AI server PCB 與高階伺服器板供應商。' },
  '3037.TW': { companyName: '欣興', market: 'Taiwan', description: 'ABF 載板、PCB 與先進封裝材料鏈。' },
  '3189.TW': { companyName: '景碩', market: 'Taiwan', description: 'IC 載板與高階封裝供應鏈。' },
  '4977.TW': { companyName: '眾達-KY', market: 'Taiwan', description: '光通訊模組與高速網路題材。' },
  '3081.TW': { companyName: '聯亞', market: 'Taiwan', description: '光通訊磊晶、雷射元件與高速光通訊供應鏈。' },
  '3163.TW': { companyName: '波若威', market: 'Taiwan', description: '光纖元件、光通訊模組與資料中心網路題材。' },
  '2881.TW': { companyName: '富邦金', market: 'Taiwan', description: '金控、壽險與金融股風向球。' },
  '2603.TW': { companyName: '長榮', market: 'Taiwan', description: '貨櫃航運與運價循環指標。' },
  '2002.TW': { companyName: '中鋼', market: 'Taiwan', description: '鋼鐵景氣、原物料與基建需求指標。' },
  '6446.TW': { companyName: '藥華藥', market: 'Taiwan', description: '新藥、生技與海外銷售題材。' },
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

      {isOpen ? <TickerModal info={info} groupInfos={groupInfos} onClose={() => setIsOpen(false)} /> : null}
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
