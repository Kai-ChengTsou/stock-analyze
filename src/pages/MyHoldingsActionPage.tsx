import { useState, type FormEvent } from 'react';
import portfolio from '../../data/portfolio.json';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { TickerChip } from '../components/TickerChip';
import { dailyReport } from '../data/report';
import type { CompanyResearch, Impact, TradingPlan } from '../types/research';
import { finalViewLabel } from '../utils/format';

interface PortfolioHolding {
  ticker: string;
  companyName: string;
  marketCountry: string;
  quantity?: number | null;
  averageCost?: number | null;
  targetWeight?: string | null;
  notes?: string;
}

type HoldingAction = 'Keep' | 'Add Only If' | 'Trim' | 'Exit / Avoid' | 'Needs Update';

interface EvidenceSummary {
  relatedNews: string[];
  supplySignals: string[];
  beneficiarySignals: string[];
  riskSignals: string[];
  marketSignals: string[];
  positiveCount: number;
  negativeCount: number;
  freshCount: number;
}

const actionLabels: Record<HoldingAction, string> = {
  Keep: '續抱',
  'Add Only If': '符合條件才加碼',
  Trim: '減碼/停利',
  'Exit / Avoid': '出場/避開',
  'Needs Update': '需要今日分析',
};

const HOLDINGS_PASSWORD = '0866';
const HOLDINGS_UNLOCK_KEY = 'holdings-page-unlocked';

export function MyHoldingsActionPage() {
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem(HOLDINGS_UNLOCK_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const holdings = portfolio.holdings as PortfolioHolding[];
  const rows = holdings.map((holding) => buildHoldingAction(holding));

  if (!isUnlocked) {
    return (
      <HoldingsLock
        error={error}
        password={password}
        onPasswordChange={(value) => {
          setPassword(value.replace(/\D/g, '').slice(0, 4));
          setError('');
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (password === HOLDINGS_PASSWORD) {
            sessionStorage.setItem(HOLDINGS_UNLOCK_KEY, 'true');
            setIsUnlocked(true);
            setError('');
            return;
          }
          setError('密碼錯誤，請輸入 4 位數密碼。');
        }}
      />
    );
  }

  return (
    <div>
      <SectionHeader
        eyebrow="My Holdings"
        title="我的持股行動"
        description="只針對目前持有部位回答：今天該續抱、加碼、減碼，還是等更多價格資料。此頁會優先讀取 tradingPlans。"
      />

      <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3">
        <p className="text-sm font-semibold text-amber-100">使用方式</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          這裡不會用固定股數下指令。automation 應用你的持股清單產生今日價格區間、失效條件與部位百分比；如果今天沒有足夠報價或新聞，行動會維持觀察。
        </p>
      </div>

      <div className="grid gap-4">
        {rows.map((row) => (
          <Card
            key={row.holding.ticker}
            title={`${row.holding.companyName} · ${row.holding.ticker}`}
            eyebrow={row.holding.marketCountry}
            right={<Badge tone={badgeTone(row.action)}>{actionLabels[row.action]}</Badge>}
          >
            <div className="mb-3">
              <TickerChip value={row.holding.ticker} groupValues={[row.holding.ticker]} />
            </div>

            <p className="text-sm leading-6 text-slate-300">{row.rationale}</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Info label="今日動作" value={row.actionDetail} />
              <Info label="可接受加碼區" value={row.entryZone} />
              <Info label="支撐/防守" value={row.supportLevel} />
              <Info label="壓力/減碼區" value={row.resistanceLevel} />
              <Info label="失效條件" value={row.invalidationLevel} />
              <Info label="部位建議" value={row.positionSizing} />
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <p className="text-sm font-semibold text-cyan-100">今日研究依據</p>
              <EvidenceGroup label="新聞/催化" values={row.evidence.relatedNews} />
              <EvidenceGroup label="供應鏈/受惠" values={[...row.evidence.supplySignals, ...row.evidence.beneficiarySignals]} />
              <EvidenceGroup label="市場/風險" values={[...row.evidence.marketSignals, ...row.evidence.riskSignals]} />
            </div>

            {row.company ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Case title="Bull case" value={row.company.bullCase} tone="text-emerald-200" />
                <Case title="Base case" value={row.company.baseCase} tone="text-sky-200" />
                <Case title="Bear case" value={row.company.bearCase} tone="text-rose-200" />
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <p className="text-xs text-slate-500">資料狀態</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{row.dataStatus}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HoldingsLock({
  error,
  password,
  onPasswordChange,
  onSubmit,
}: {
  error: string;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div>
      <SectionHeader
        eyebrow="Private"
        title="持股頁面已鎖定"
        description="這一頁包含個人持股清單；請輸入 4 位數密碼後查看。"
      />

      <Card title="輸入密碼" eyebrow="Holdings Lock">
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm text-slate-300">
            4 位數密碼
            <input
              autoComplete="off"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none transition focus:border-cyan-300/60"
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-rose-200">{error}</p> : null}
          <button
            className="w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            type="submit"
          >
            解鎖持股頁
          </button>
          <p className="text-xs leading-5 text-slate-500">
            這是分享網頁時的基本隱藏，不是銀行等級安全。真正私密資料不要放在公開靜態網站。
          </p>
        </form>
      </Card>
    </div>
  );
}

function buildHoldingAction(holding: PortfolioHolding) {
  const tradingPlan = dailyReport.tradingPlans?.find((plan) => sameTicker(plan.ticker, holding.ticker));
  const company = dailyReport.companyResearch.find((item) => sameTicker(item.ticker, holding.ticker));
  const evidence = collectEvidence(holding, company);

  if (tradingPlan) {
    return fromTradingPlan(holding, tradingPlan, company, evidence);
  }

  if (company) {
    return fromCompanyResearch(holding, company, evidence);
  }

  return {
    holding,
    company: undefined,
    evidence,
    action: 'Needs Update' as HoldingAction,
    rationale: `${holding.companyName} 目前不在今日 companyResearch 或 tradingPlans 裡。下一次 automation 應強制針對持股清單補上今日價格區、支撐壓力與失效條件。`,
    actionDetail: '暫不新增部位，等 automation 補齊今日分析。',
    entryZone: '價格資料不足，不設定主動買點。',
    supportLevel: '需要今日 K 線/均線/大量區更新。',
    resistanceLevel: '需要今日 K 線/前高/套牢區更新。',
    invalidationLevel: '若 automation 無法取得資料，維持觀察。',
    positionSizing: '0%；等待今日分析。',
    dataStatus: evidence.relatedNews.length || evidence.marketSignals.length
      ? '未在今日公司/交易計畫找到完整研究，但已列出可用的新聞、市場與風險線索。'
      : '未在今日報告找到對應研究。這不是賣出訊號，是資料不足訊號。',
  };
}

function fromTradingPlan(holding: PortfolioHolding, plan: TradingPlan, company: CompanyResearch | undefined, evidence: EvidenceSummary) {
  const action = refineAction(mapPlanAction(plan.actionToday), evidence);
  return {
    holding,
    company,
    evidence,
    action,
    rationale: plan.rationale,
    actionDetail: `${plan.actionToday}：${plan.confirmationSignals.join('；')}`,
    entryZone: plan.entryZone,
    supportLevel: plan.supportLevel,
    resistanceLevel: plan.resistanceLevel,
    invalidationLevel: plan.invalidationLevel,
    positionSizing: plan.positionSizing,
    dataStatus: '已整合今日 tradingPlans、companyResearch、新聞、供應鏈、受惠/受害與市場風險。tradingPlans 只負責價格執行層。',
  };
}

function fromCompanyResearch(holding: PortfolioHolding, company: CompanyResearch, evidence: EvidenceSummary) {
  const baseAction: HoldingAction = company.finalView === 'Negative' || company.suggestedAction === 'Avoid'
    ? 'Exit / Avoid'
    : company.opportunityStage === 'Crowded' || company.opportunityStage === 'Late'
      ? 'Trim'
      : company.suggestedAction === 'Watch'
        ? 'Add Only If'
        : 'Keep';
  const action = refineAction(baseAction, evidence);

  return {
    holding,
    company,
    evidence,
    action,
    rationale: company.whyItMattersToday ?? company.overview,
    actionDetail: `${finalViewLabel[company.finalView]}；${company.suggestedAction}`,
    entryZone: company.suggestedAction === 'Watch' ? '等量價確認或拉回支撐，不追高。' : '以既有部位續抱為主，不主動加碼。',
    supportLevel: '今日 tradingPlans 未提供，需由 automation 補最新支撐。',
    resistanceLevel: '今日 tradingPlans 未提供，需由 automation 補最新壓力。',
    invalidationLevel: company.invalidationConditions ?? company.whatWouldChangeView,
    positionSizing: action === 'Trim' ? '若已超出原定比重，可分批降回目標部位。' : '未提供成本與持股比重，先不建議擴大部位。',
    dataStatus: '未找到專屬 tradingPlan，因此用 companyResearch、新聞、供應鏈、受惠/受害與風險綜合推導。下一次 automation 應補上精確價格區。',
  };
}

function collectEvidence(holding: PortfolioHolding, company?: CompanyResearch): EvidenceSummary {
  const ticker = normalizeTicker(holding.ticker);
  const relatedNewsItems = dailyReport.news.filter((item) =>
    item.relatedTickers.some((relatedTicker) => sameTicker(relatedTicker, ticker)),
  );
  const supplyNodes = dailyReport.supplyChain.filter((node) => sameTicker(node.ticker, ticker));
  const beneficiarySignals = dailyReport.beneficiaries.flatMap((beneficiary) => {
    const details = beneficiary.details?.filter((detail) => sameTicker(detail.ticker, ticker)) ?? [];
    const directMatch = beneficiary.directBeneficiaries.some((item) => sameTicker(item, ticker));
    const indirectMatch = beneficiary.indirectBeneficiaries.some((item) => sameTicker(item, ticker));
    const hiddenMatch = beneficiary.hiddenBeneficiaries.some((item) => sameTicker(item, ticker));
    const hurtMatch = beneficiary.companiesMayBeHurt.some((item) => sameTicker(item, ticker));
    const signals = details.map((detail) => `${detail.type}: ${detail.linkage}`);
    if (directMatch) signals.push(`Direct beneficiary: ${beneficiary.reasoning}`);
    if (indirectMatch) signals.push(`Indirect beneficiary: ${beneficiary.reasoning}`);
    if (hiddenMatch) signals.push(`Hidden beneficiary: ${beneficiary.reasoning}`);
    if (hurtMatch) signals.push(`Potential loser: ${beneficiary.reasoning}`);
    return signals;
  });
  const marketSignals = [
    ...(dailyReport.marketSections?.taiwan.stocksToWatch.some((item) => sameTicker(item, ticker)) ? [dailyReport.marketSections.taiwan.overview] : []),
    ...(dailyReport.marketSections?.us.stocksToWatch.some((item) => sameTicker(item, ticker)) ? [dailyReport.marketSections.us.overview] : []),
    ...(dailyReport.marketSections?.crossMarket
      .filter((link) => [...link.relatedTaiwanTickers, ...link.relatedUSTickers].some((item) => sameTicker(item, ticker)))
      .map((link) => `${link.title}: ${link.taiwanReadThrough}`) ?? []),
  ];
  const riskSignals = [
    ...(company?.keyRisks ?? []),
    ...(dailyReport.risks?.filter((risk) => mentionsTickerOrCompany(risk.description, holding, company)).map((risk) => risk.description) ?? []),
  ];

  return {
    relatedNews: relatedNewsItems.map((item) => `${impactText(item.impact)} ${item.title}`).slice(0, 4),
    supplySignals: supplyNodes.map((node) => `${node.companyName}: ${node.whyItMayBenefit}`).slice(0, 3),
    beneficiarySignals: beneficiarySignals.slice(0, 4),
    riskSignals: riskSignals.slice(0, 4),
    marketSignals: marketSignals.slice(0, 3),
    positiveCount: relatedNewsItems.filter((item) => item.impact === 'Positive').length,
    negativeCount: relatedNewsItems.filter((item) => item.impact === 'Negative').length,
    freshCount: relatedNewsItems.filter((item) => item.freshness === 'Fresh catalyst').length,
  };
}

function refineAction(action: HoldingAction, evidence: EvidenceSummary): HoldingAction {
  if (evidence.negativeCount > evidence.positiveCount && action === 'Add Only If') return 'Keep';
  if (evidence.negativeCount > 0 && action === 'Keep') return 'Trim';
  if (evidence.freshCount > 0 && evidence.positiveCount > evidence.negativeCount && action === 'Trim') return 'Keep';
  return action;
}

function mapPlanAction(action: TradingPlan['actionToday']): HoldingAction {
  if (action === 'Buy Now' || action === 'Buy on Pullback' || action === 'Buy on Breakout') return 'Add Only If';
  if (action === 'Take Profit') return 'Trim';
  if (action === 'Avoid') return 'Exit / Avoid';
  return 'Keep';
}

function sameTicker(left: string, right: string) {
  return normalizeTicker(left) === normalizeTicker(right);
}

function normalizeTicker(ticker: string) {
  const trimmed = ticker.trim().toUpperCase();
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}.TW`;
  return trimmed;
}

function mentionsTickerOrCompany(text: string, holding: PortfolioHolding, company?: CompanyResearch) {
  return text.includes(holding.ticker) || text.includes(holding.companyName) || (company ? text.includes(company.companyName) : false);
}

function impactText(impact: Impact) {
  if (impact === 'Positive') return '正面';
  if (impact === 'Negative') return '負面';
  return '中性';
}

function badgeTone(action: HoldingAction) {
  if (action === 'Keep' || action === 'Add Only If') return 'Positive';
  if (action === 'Trim') return 'Neutral';
  return 'Negative';
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}

function EvidenceGroup({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) {
    return (
      <div className="mt-3">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 text-sm text-slate-500">今日沒有直接訊號。</p>
      </div>
    );
  }
  return (
    <div className="mt-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-2 space-y-2">
        {values.map((value) => (
          <p key={value} className="rounded-lg border border-white/10 bg-slate-950/35 px-3 py-2 text-sm leading-6 text-slate-300">
            {value}
          </p>
        ))}
      </div>
    </div>
  );
}

function Case({ title, value, tone }: { title: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <p className={`text-sm font-semibold ${tone}`}>{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{value}</p>
    </div>
  );
}
