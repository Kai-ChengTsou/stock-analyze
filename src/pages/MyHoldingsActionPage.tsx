import portfolio from '../../data/portfolio.json';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { TickerChip } from '../components/TickerChip';
import { dailyReport } from '../data/report';
import type { CompanyResearch, TradingPlan } from '../types/research';
import { finalViewLabel } from '../utils/format';

interface PortfolioHolding {
  ticker: string;
  companyName: string;
  marketCountry: string;
  notes?: string;
}

type HoldingAction = 'Keep' | 'Add Only If' | 'Trim' | 'Exit / Avoid' | 'Needs Update';

const actionLabels: Record<HoldingAction, string> = {
  Keep: '續抱',
  'Add Only If': '符合條件才加碼',
  Trim: '減碼/停利',
  'Exit / Avoid': '出場/避開',
  'Needs Update': '需要今日分析',
};

export function MyHoldingsActionPage() {
  const holdings = portfolio.holdings as PortfolioHolding[];
  const rows = holdings.map((holding) => buildHoldingAction(holding));

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

function buildHoldingAction(holding: PortfolioHolding) {
  const tradingPlan = dailyReport.tradingPlans?.find((plan) => sameTicker(plan.ticker, holding.ticker));
  const company = dailyReport.companyResearch.find((item) => sameTicker(item.ticker, holding.ticker));

  if (tradingPlan) {
    return fromTradingPlan(holding, tradingPlan, company);
  }

  if (company) {
    return fromCompanyResearch(holding, company);
  }

  return {
    holding,
    company: undefined,
    action: 'Needs Update' as HoldingAction,
    rationale: `${holding.companyName} 目前不在今日 companyResearch 或 tradingPlans 裡。下一次 automation 應強制針對持股清單補上今日價格區、支撐壓力與失效條件。`,
    actionDetail: '暫不新增部位，等 automation 補齊今日分析。',
    entryZone: '價格資料不足，不設定主動買點。',
    supportLevel: '需要今日 K 線/均線/大量區更新。',
    resistanceLevel: '需要今日 K 線/前高/套牢區更新。',
    invalidationLevel: '若 automation 無法取得資料，維持觀察。',
    positionSizing: '0%；等待今日分析。',
    dataStatus: '未在今日報告找到對應研究。這不是賣出訊號，是資料不足訊號。',
  };
}

function fromTradingPlan(holding: PortfolioHolding, plan: TradingPlan, company?: CompanyResearch) {
  const action = mapPlanAction(plan.actionToday);
  return {
    holding,
    company,
    action,
    rationale: plan.rationale,
    actionDetail: `${plan.actionToday}：${plan.confirmationSignals.join('；')}`,
    entryZone: plan.entryZone,
    supportLevel: plan.supportLevel,
    resistanceLevel: plan.resistanceLevel,
    invalidationLevel: plan.invalidationLevel,
    positionSizing: plan.positionSizing,
    dataStatus: '已讀取今日 tradingPlans，這是優先使用的持股行動資料。',
  };
}

function fromCompanyResearch(holding: PortfolioHolding, company: CompanyResearch) {
  const action: HoldingAction = company.finalView === 'Negative' || company.suggestedAction === 'Avoid'
    ? 'Exit / Avoid'
    : company.opportunityStage === 'Crowded' || company.opportunityStage === 'Late'
      ? 'Trim'
      : company.suggestedAction === 'Watch'
        ? 'Add Only If'
        : 'Keep';

  return {
    holding,
    company,
    action,
    rationale: company.whyItMattersToday ?? company.overview,
    actionDetail: `${finalViewLabel[company.finalView]}；${company.suggestedAction}`,
    entryZone: company.suggestedAction === 'Watch' ? '等量價確認或拉回支撐，不追高。' : '以既有部位續抱為主，不主動加碼。',
    supportLevel: '今日 tradingPlans 未提供，需由 automation 補最新支撐。',
    resistanceLevel: '今日 tradingPlans 未提供，需由 automation 補最新壓力。',
    invalidationLevel: company.invalidationConditions ?? company.whatWouldChangeView,
    positionSizing: action === 'Trim' ? '若已超出原定比重，可分批降回目標部位。' : '未提供成本與持股比重，先不建議擴大部位。',
    dataStatus: '未找到專屬 tradingPlan，暫用 companyResearch 推導。下一次 automation 應補上精確價格區。',
  };
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

function Case({ title, value, tone }: { title: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <p className={`text-sm font-semibold ${tone}`}>{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{value}</p>
    </div>
  );
}
