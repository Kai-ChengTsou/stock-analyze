import { useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { TickerChip } from '../components/TickerChip';
import { dailyReport } from '../data/report';
import type { CompanyResearch, TradingPlan, TradingPlanAction, TradingPlanConviction } from '../types/research';
import { toneClass } from '../utils/format';

const actionLabels: Record<TradingPlanAction, string> = {
  'Buy Now': '今日可小量',
  'Buy on Pullback': '等拉回',
  'Buy on Breakout': '等突破',
  Watch: '觀察',
  Avoid: '避開',
  'Take Profit': '分批停利',
};

const convictionLabels: Record<TradingPlanConviction, string> = {
  'High Conviction': '高信心',
  Emerging: '成形中',
  Speculative: '投機',
  Crowded: '擁擠',
  Avoid: '避開',
};

export function TradingPlanPage() {
  const [actionFilter, setActionFilter] = useState<string>('All');
  const plans = useMemo(() => dailyReport.tradingPlans?.length ? dailyReport.tradingPlans : derivePlans(dailyReport.companyResearch), []);
  const filteredPlans = useMemo(
    () => plans.filter((plan) => actionFilter === 'All' || plan.actionToday === actionFilter),
    [actionFilter, plans],
  );

  const buyableCount = plans.filter((plan) => ['Buy Now', 'Buy on Pullback', 'Buy on Breakout'].includes(plan.actionToday)).length;

  return (
    <div>
      <SectionHeader
        eyebrow="Trading Plan"
        title="今日交易計畫"
        description="把研究轉成可執行條件：不是無腦買進，而是用進場區、支撐壓力、失效條件與部位上限管理風險。"
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <CountCard label="計畫股票" value={`${plans.length}`} detail="tradingPlans 實際筆數或研究推導" />
        <CountCard label="可進攻候選" value={`${buyableCount}`} detail="Buy Now / Pullback / Breakout" />
        <CountCard label="目前顯示" value={`${filteredPlans.length}`} detail="套用動作篩選後" />
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
        <label className="text-xs text-slate-400">
          動作
          <select
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
          >
            <option value="All">全部</option>
            {Object.entries(actionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3">
        <p className="text-sm font-semibold text-amber-100">部位提醒</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          這裡使用 portfolio percentage，不用固定股數。實際買幾張/幾股要用你的總資金、單筆最大虧損、流動性與滑價換算。
        </p>
      </div>

      <div className="space-y-4">
        {filteredPlans.map((plan) => (
          <Card
            key={plan.id}
            title={`${plan.companyName} · ${plan.ticker}`}
            eyebrow={plan.marketCountry}
            right={<Badge tone={badgeTone(plan.actionToday)}>{actionLabels[plan.actionToday]}</Badge>}
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <MetaPill label={convictionLabels[plan.conviction]} value={plan.conviction} />
              <MetaPill label={plan.riskReward} />
              <MetaPill label={plan.timeHorizon} />
            </div>

            <p className="text-sm leading-6 text-slate-300">{plan.rationale}</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Info label="進場區" value={plan.entryZone} />
              <Info label="建議部位" value={plan.positionSizing} />
              <Info label="支撐" value={plan.supportLevel} />
              <Info label="壓力" value={plan.resistanceLevel} />
              <Info label="失效/停損條件" value={plan.invalidationLevel} />
              <Info label="風險報酬" value={plan.riskReward} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Case title="Bull case" value={plan.bullCase} tone="text-emerald-200" />
              <Case title="Base case" value={plan.baseCase} tone="text-sky-200" />
              <Case title="Bear case" value={plan.bearCase} tone="text-rose-200" />
            </div>

            <TagGroup label="確認訊號" values={plan.confirmationSignals} />
            <TagGroup label="避開條件" values={plan.avoidConditions} />
            <TagGroup label="關聯催化" values={plan.linkedCatalysts} />

            <div className="mt-4">
              <p className="mb-2 text-xs text-slate-400">相關公司</p>
              <TickerChip value={plan.ticker} groupValues={[plan.ticker]} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function derivePlans(companies: CompanyResearch[]): TradingPlan[] {
  return companies
    .filter((company) => company.finalView !== 'Negative')
    .slice(0, 12)
    .map((company) => {
      const isCrowded = company.opportunityStage === 'Crowded' || company.opportunityStage === 'Late';
      const isWeak = company.evidenceGrade === 'C' || company.evidenceGrade === 'D' || company.beneficiaryType === 'Radar only';
      const actionToday: TradingPlanAction = company.suggestedAction === 'Avoid'
        ? 'Avoid'
        : company.suggestedAction === 'Wait' || isWeak
          ? 'Watch'
          : isCrowded
            ? 'Buy on Pullback'
            : 'Buy on Breakout';
      const conviction: TradingPlanConviction = actionToday === 'Avoid'
        ? 'Avoid'
        : isWeak
          ? 'Speculative'
          : isCrowded
            ? 'Crowded'
            : company.finalView === 'Positive'
              ? 'Emerging'
              : 'Speculative';

      return {
        id: `derived-plan-${company.id}`,
        ticker: company.ticker,
        companyName: company.companyName,
        marketCountry: company.marketCountry,
        actionToday,
        conviction,
        rationale: company.whyItMattersToday ?? company.overview,
        entryZone: actionToday === 'Buy on Pullback' ? '等拉回接近短線支撐，且量縮不破趨勢再考慮。' : actionToday === 'Buy on Breakout' ? '等放量突破近期壓力並站穩，不追無量開高。' : '目前只觀察，不設主動買點。',
        supportLevel: '由 automation 依最新 K 線填入；若未填，先用近期大量低點/均線作觀察。',
        resistanceLevel: '由 automation 依最新 K 線填入；若未填，先看前高或大量套牢區。',
        invalidationLevel: company.invalidationConditions ?? company.whatWouldChangeView,
        positionSizing: actionToday === 'Watch' || actionToday === 'Avoid' ? '0%；等待條件成立。' : isCrowded ? '試單 1-2%，不可追成核心部位。' : '試單 1-3%，確認後才加碼。',
        riskReward: actionToday === 'Watch' || actionToday === 'Avoid' ? '尚未達可承擔風險報酬。' : '至少要求潛在上行大於下行風險 2:1。',
        timeHorizon: '1-10 個交易日，依催化延續性調整。',
        confirmationSignals: [company.catalystSummary ?? company.overview, company.priceVolumeBehavior ?? company.technicalTrend],
        avoidConditions: [company.whatWouldChangeView, ...company.keyRisks.slice(0, 2)],
        bullCase: company.bullCase,
        baseCase: company.baseCase,
        bearCase: company.bearCase,
        linkedCatalysts: company.revenueDrivers.slice(0, 3),
      };
    });
}

function badgeTone(action: TradingPlanAction) {
  if (['Buy Now', 'Buy on Pullback', 'Buy on Breakout'].includes(action)) return 'Positive';
  if (action === 'Avoid' || action === 'Take Profit') return 'Negative';
  return 'Neutral';
}

function CountCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
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

function TagGroup({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value?: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(value ?? label)}`}>
      {label}
    </span>
  );
}
