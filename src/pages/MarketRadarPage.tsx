import { useMemo, useState } from 'react';
import { Building2, ExternalLink, Radar, X } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { dailyReport, marketSections } from '../data/report';
import type { ScanCoverageItem } from '../types/research';

const statusTone: Record<string, string> = {
  'Fresh catalyst': 'Positive',
  'Recent context': 'Neutral',
  'Background thesis': 'Medium',
  'Momentum only': 'High',
  'No signal': 'Low',
};

const statusLabel: Record<string, string> = {
  'Fresh catalyst': '新催化',
  'Recent context': '近期脈絡',
  'Background thesis': '背景論點',
  'Momentum only': '純動能',
  'No signal': '無明確訊號',
};

interface TickerInfo {
  ticker: string;
  companyName: string;
  market: string;
  description: string;
  source: '深入研究' | '供應鏈' | '觀察清單' | '雷達對照';
}

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
  '2409.TW': { companyName: '友達', market: 'Taiwan', description: '面板、Micro LED、車用顯示與低基期題材。' },
  '2317.TW': { companyName: '鴻海', market: 'Taiwan', description: 'AI server、電動車與全球 EMS 龍頭。' },
  '2356.TW': { companyName: '英業達', market: 'Taiwan', description: '伺服器、PC ODM 與 AI server 轉型候選。' },
  '3706.TW': { companyName: '神達', market: 'Taiwan', description: '伺服器、車用電子與 AI server 題材候選。' },
  '3324.TW': { companyName: '雙鴻', market: 'Taiwan', description: '散熱與液冷供應鏈代表。' },
  '3653.TW': { companyName: '健策', market: 'Taiwan', description: '均熱片、散熱與高階金屬件供應商。' },
  '2301.TW': { companyName: '光寶科', market: 'Taiwan', description: '電源、光電與 AI server power 供應鏈。' },
  '6282.TW': { companyName: '康舒', market: 'Taiwan', description: '電源供應器、資料中心與能源應用。' },
  '3675.TW': { companyName: '德微', market: 'Taiwan', description: '二極體與功率元件利基供應商。' },
  '6435.TW': { companyName: '大中', market: 'Taiwan', description: 'MOSFET 與功率半導體供應商。' },
  '6693.TW': { companyName: '廣閎科', market: 'Taiwan', description: '電源管理與功率 IC 題材候選。' },
  '8261.TW': { companyName: '富鼎', market: 'Taiwan', description: 'MOSFET 與功率元件供應商。' },
  '5285.TW': { companyName: '界霖', market: 'Taiwan', description: '導線架、功率半導體材料與車用應用。' },
  '6548.TW': { companyName: '長科*', market: 'Taiwan', description: '導線架與半導體封裝材料供應商。' },
  '2368.TW': { companyName: '金像電', market: 'Taiwan', description: 'AI server PCB 與高階伺服器板供應商。' },
  '3037.TW': { companyName: '欣興', market: 'Taiwan', description: 'ABF 載板、PCB 與先進封裝材料鏈。' },
  '3189.TW': { companyName: '景碩', market: 'Taiwan', description: 'IC 載板與高階封裝供應鏈。' },
  '4977.TW': { companyName: '眾達-KY', market: 'Taiwan', description: '光通訊模組與高速網路題材。' },
  '2454.TW': { companyName: '聯發科', market: 'Taiwan', description: '手機 SoC、Edge AI、ASIC 與車用平台。' },
  '3034.TW': { companyName: '聯詠', market: 'Taiwan', description: '顯示驅動 IC、TDDI 與面板需求指標。' },
  '3661.TW': { companyName: '世芯-KY', market: 'Taiwan', description: 'ASIC 設計服務與 AI 客製晶片供應鏈。' },
  '3443.TW': { companyName: '創意', market: 'Taiwan', description: 'ASIC / IP 設計服務與先進製程設計服務。' },
  '5274.TW': { companyName: '信驊', market: 'Taiwan', description: 'BMC 晶片與伺服器管理晶片龍頭。' },
  '4966.TW': { companyName: '譜瑞-KY', market: 'Taiwan', description: '高速介面、USB/PCIe retimer 與高速傳輸 IC。' },
  '2327.TW': { companyName: '國巨', market: 'Taiwan', description: 'MLCC、電阻與被動元件龍頭。' },
  '2492.TW': { companyName: '華新科', market: 'Taiwan', description: 'MLCC 與被動元件供應商。' },
  '3026.TW': { companyName: '禾伸堂', market: 'Taiwan', description: 'MLCC 與被動元件供應商。' },
  '6173.TW': { companyName: '信昌電', market: 'Taiwan', description: '被動元件與材料供應商。' },
  '3042.TW': { companyName: '晶技', market: 'Taiwan', description: '石英元件、車用與通訊頻率元件。' },
  '2359.TW': { companyName: '所羅門', market: 'Taiwan', description: '機器視覺、AI 機器人與自動化題材。' },
  '2049.TW': { companyName: '上銀', market: 'Taiwan', description: '線性滑軌、精密傳動與自動化設備。' },
  '1590.TW': { companyName: '亞德客-KY', market: 'Taiwan', description: '氣動元件與自動化設備需求指標。' },
  '2231.TW': { companyName: '為升', market: 'Taiwan', description: '車用電子、胎壓偵測與車電題材。' },
  '1536.TW': { companyName: '和大', market: 'Taiwan', description: '車用傳動零件與 EV 供應鏈。' },
  '2634.TW': { companyName: '漢翔', market: 'Taiwan', description: '航太、軍工與國防政策題材。' },
  '8033.TW': { companyName: '雷虎', market: 'Taiwan', description: '無人機與軍工題材。' },
  '2314.TW': { companyName: '台揚', market: 'Taiwan', description: '衛星通訊與網通設備。' },
  '6285.TW': { companyName: '啟碁', market: 'Taiwan', description: '車用、衛星通訊與網通設備供應商。' },
  '3491.TW': { companyName: '昇達科', market: 'Taiwan', description: '微波通訊、衛星與毫米波元件。' },
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
  '1598.TW': { companyName: '岱宇', market: 'Taiwan', description: '健身器材、醫療復健與消費景氣。' },
  '4128.TW': { companyName: '中天', market: 'Taiwan', description: '生技投資與政策題材觀察。' },
};

export function MarketRadarPage() {
  const [selectedCoverage, setSelectedCoverage] = useState<ScanCoverageItem | null>(null);
  const tickerInfo = useTickerInfo();
  const selectedCompanies = selectedCoverage?.tickersChecked.map((ticker) => resolveTickerInfo(ticker, tickerInfo)) ?? [];

  return (
    <div>
      <SectionHeader
        eyebrow="Coverage"
        title="全市場雷達"
        description="每天先掃完整市場，再把真正重要的訊號升級到晨報主文；這頁保留掃描覆蓋度與略過原因。"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {marketSections.scanCoverage.length > 0 ? marketSections.scanCoverage.map((item) => (
          <Card
            key={item.id}
            title={item.category}
            eyebrow={item.market}
            right={<Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>}
          >
            <p className="text-sm leading-6 text-slate-300">{item.reason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tickersChecked.length > 0 ? item.tickersChecked.map((ticker) => (
                <button
                  key={ticker}
                  type="button"
                  className="chip cursor-pointer transition hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-cyan-200/15 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                  onClick={() => setSelectedCoverage(item)}
                >
                  {ticker}
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </button>
              )) : <span className="text-sm text-slate-500">下一次掃描補上候選標的</span>}
            </div>
            <p className="mt-3 text-xs text-slate-400">優先級：{item.priority}</p>
          </Card>
        )) : (
          <Card title="等待掃描資料" eyebrow="Radar" right={<Radar className="h-5 w-5 text-cyan-200" />}>
            <p className="text-sm leading-6 text-slate-300">下一版晨報會列出台股與美股各產業掃描結果。</p>
          </Card>
        )}
      </div>

      {selectedCoverage ? (
        <div
          className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/70 p-3 backdrop-blur-sm sm:place-items-center"
          onClick={() => setSelectedCoverage(null)}
        >
          <section
            className="max-h-[82vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b111d] p-4 shadow-2xl shadow-black/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  {selectedCoverage.market} · {statusLabel[selectedCoverage.status]}
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-white">
                  <Building2 className="h-5 w-5 text-cyan-200" />
                  {selectedCoverage.category}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{selectedCoverage.reason}</p>
              </div>
              <button
                type="button"
                aria-label="關閉公司清單"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                onClick={() => setSelectedCoverage(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedCompanies.map((company) => (
                <article key={company.ticker} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-white">{company.companyName}</h3>
                      <p className="mt-1 text-xs text-cyan-200">{company.ticker} · {company.market}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-300">
                      {company.source}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{company.description}</p>
                </article>
              ))}
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              註：標記為「雷達對照」代表目前只在掃描宇宙中，還沒被升級成今日深入公司研究；若當天有新催化，才會進入公司研究頁。
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function useTickerInfo() {
  return useMemo(() => {
    const map = new Map<string, TickerInfo>();

    dailyReport.companyResearch.forEach((company) => {
      map.set(company.ticker, {
        ticker: company.ticker,
        companyName: company.companyName,
        market: company.marketCountry,
        description: company.overview,
        source: '深入研究',
      });
    });

    dailyReport.supplyChain.forEach((node) => {
      if (!map.has(node.ticker)) {
        map.set(node.ticker, {
          ticker: node.ticker,
          companyName: node.companyName,
          market: node.marketCountry,
          description: node.whyItMayBenefit,
          source: '供應鏈',
        });
      }
    });

    dailyReport.watchlist.forEach((item) => {
      if (!map.has(item.ticker)) {
        map.set(item.ticker, {
          ticker: item.ticker,
          companyName: item.companyName,
          market: item.ticker.endsWith('.TW') ? 'Taiwan' : 'US',
          description: item.keyNews,
          source: '觀察清單',
        });
      }
    });

    return map;
  }, []);
}

function resolveTickerInfo(ticker: string, reportTickerInfo: Map<string, TickerInfo>): TickerInfo {
  const reportInfo = reportTickerInfo.get(ticker);
  if (reportInfo) return reportInfo;

  const reference = tickerReference[ticker];
  if (reference) {
    return {
      ticker,
      ...reference,
      source: '雷達對照',
    };
  }

  return {
    ticker,
    companyName: '尚未建立公司名稱',
    market: ticker.endsWith('.TW') ? 'Taiwan' : 'US',
    description: '此代碼目前只在掃描清單中；若當天有新催化或資料驗證，會補入公司研究或雷達對照表。',
    source: '雷達對照',
  };
}
