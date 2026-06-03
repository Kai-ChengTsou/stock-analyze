import { useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { TickerChip } from '../components/TickerChip';
import { dailyReport } from '../data/report';
import { actionLabel, evidenceGradeLabel, finalViewLabel, opportunityStageLabel, toneClass } from '../utils/format';

export function CompanyResearchPage() {
  const [marketFilter, setMarketFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [evidenceFilter, setEvidenceFilter] = useState('All');

  const filteredCompanies = useMemo(
    () => dailyReport.companyResearch.filter((company) => {
      const normalizedMarket = normalizeMarket(company.marketCountry);
      const marketMatch = marketFilter === 'All' || normalizedMarket === marketFilter;
      const stageMatch = stageFilter === 'All' || company.opportunityStage === stageFilter;
      const evidenceMatch = evidenceFilter === 'All' || company.evidenceGrade === evidenceFilter;
      return marketMatch && stageMatch && evidenceMatch;
    }),
    [evidenceFilter, marketFilter, stageFilter],
  );

  return (
    <div>
      <SectionHeader title="公司研究" description="每家公司都呈現催化、量價、供應鏈角色、證據品質、機會階段、風險與行動建議。" />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <CountCard label="深入研究公司" value={`${dailyReport.companyResearch.length}`} detail="companyResearch 實際筆數" />
        <CountCard label="目前顯示" value={`${filteredCompanies.length}`} detail="套用市場/階段/證據篩選後" />
        <CountCard label="雷達掃描公司" value={`${countScannedTickers()}`} detail="scanCoverage 內的去重 ticker 數" />
      </div>

      <div className="mb-4 grid gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-3 md:grid-cols-3">
        <SelectFilter
          label="市場"
          value={marketFilter}
          options={[
            { value: 'All', label: '全部' },
            { value: 'US', label: '美股' },
            { value: 'Taiwan', label: '台股' },
          ]}
          onChange={setMarketFilter}
        />
        <SelectFilter
          label="階段"
          value={stageFilter}
          options={[
            { value: 'All', label: '全部' },
            { value: 'Early', label: opportunityStageLabel.Early },
            { value: 'Confirming', label: opportunityStageLabel.Confirming },
            { value: 'Crowded', label: opportunityStageLabel.Crowded },
            { value: 'Late', label: opportunityStageLabel.Late },
            { value: 'Avoid/Wait', label: opportunityStageLabel['Avoid/Wait'] },
          ]}
          onChange={setStageFilter}
        />
        <SelectFilter
          label="證據"
          value={evidenceFilter}
          options={[
            { value: 'All', label: '全部' },
            { value: 'A', label: evidenceGradeLabel.A },
            { value: 'B', label: evidenceGradeLabel.B },
            { value: 'C', label: evidenceGradeLabel.C },
            { value: 'D', label: evidenceGradeLabel.D },
          ]}
          onChange={setEvidenceFilter}
        />
      </div>

      <div className="space-y-4">
        {filteredCompanies.map((company) => {
          const blockTickers = uniqueTickers([company.ticker, ...company.competitors]);

          return (
          <Card
            key={company.id}
            title={`${company.companyName} · ${company.ticker}`}
            eyebrow={marketLabel(company.marketCountry)}
            right={<Badge tone={company.finalView}>{finalViewLabel[company.finalView]}</Badge>}
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {company.sectorTheme ? <MetaPill label={company.sectorTheme} /> : null}
              {company.opportunityStage ? <MetaPill label={opportunityStageLabel[company.opportunityStage]} value={company.opportunityStage} /> : null}
              {company.evidenceGrade ? <MetaPill label={evidenceGradeLabel[company.evidenceGrade]} value={company.evidenceGrade} /> : null}
              {company.catalystDriver ? <MetaPill label={company.catalystDriver} /> : null}
              {company.beneficiaryType ? <MetaPill label={company.beneficiaryType} /> : null}
            </div>
            <p className="text-sm leading-6 text-slate-300">{company.overview}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {company.whyItMattersToday ? <Info label="今日重要性" value={company.whyItMattersToday} /> : null}
              {company.catalystSummary ? <Info label="催化/脈絡" value={company.catalystSummary} /> : null}
              {company.priceVolumeBehavior ? <Info label="量價行為" value={company.priceVolumeBehavior} /> : null}
              {company.supplyChainRole ? <Info label="供應鏈角色" value={company.supplyChainRole} /> : null}
              <Info label="商業模式" value={company.businessModel} />
              <Info label="最新財報摘要" value={company.latestFinancialReportSummary} />
              <Info label="營收成長" value={company.revenueGrowth} />
              <Info label="毛利率" value={company.grossMargin} />
              <Info label="EPS" value={company.eps} />
              <Info label="自由現金流" value={company.freeCashFlow} />
              <Info label="估值風險" value={company.valuationRisk} />
              <Info label="技術趨勢" value={company.technicalTrend} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Case title="Bull case" value={company.bullCase} tone="text-emerald-200" />
              <Case title="Base case" value={company.baseCase} tone="text-sky-200" />
              <Case title="Bear case" value={company.bearCase} tone="text-rose-200" />
            </div>

            <TagGroup label="營收驅動" values={company.revenueDrivers} />
            <TagGroup label="競爭者" values={company.competitors} groupValues={blockTickers} />
            <TagGroup label="關鍵風險" values={company.keyRisks} />

            <div className="mt-4">
              <p className="mb-2 text-xs text-slate-400">公司研究清單</p>
              <TickerChip value={company.ticker} groupValues={blockTickers} />
            </div>

            <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
              <p className="text-sm font-semibold text-cyan-100">建議動作：{actionLabel[company.suggestedAction]}</p>
              {company.upsideDriver ? <p className="mt-2 text-sm leading-6 text-slate-300">上行驅動：{company.upsideDriver}</p> : null}
              {company.invalidationConditions ? <p className="mt-2 text-sm leading-6 text-rose-100">失效條件：{company.invalidationConditions}</p> : null}
              <p className="mt-2 text-sm leading-6 text-slate-300">改變觀點的新資訊：{company.whatWouldChangeView}</p>
            </div>
          </Card>
        )})}
        {filteredCompanies.length === 0 ? (
          <Card title="沒有符合篩選的公司" eyebrow="Company Research">
            <p className="text-sm leading-6 text-slate-300">放寬市場、階段或證據篩選即可看到更多研究項目。</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs text-slate-400">
      {label}
      <select
        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/40"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}

function MetaPill({ label, value = label }: { label: string; value?: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-xs ${toneClass(value)}`}>{label}</span>;
}

function CountCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function countScannedTickers() {
  const tickers = dailyReport.marketSections?.scanCoverage.flatMap((item) => item.tickersChecked) ?? [];
  return new Set(tickers).size;
}

function normalizeMarket(marketCountry: string) {
  const normalized = marketCountry.trim().toLowerCase();
  if (['us', 'usa', 'u.s.', 'u.s.a.', 'united states', 'america', '美國', '美国'].includes(normalized)) return 'US';
  if (['taiwan', 'tw', '台灣', '台湾'].includes(normalized)) return 'Taiwan';
  return marketCountry;
}

function marketLabel(marketCountry: string) {
  const normalized = normalizeMarket(marketCountry);
  if (normalized === 'US') return '美股';
  if (normalized === 'Taiwan') return '台股';
  return marketCountry;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.045] p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}

function Case({ title, value, tone }: { title: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <p className={`text-xs font-semibold ${tone}`}>{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{value}</p>
    </div>
  );
}

function TagGroup({ label, values, groupValues = values }: { label: string; values: string[]; groupValues?: string[] }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <TickerChip key={value} value={value} groupValues={groupValues} />
        ))}
      </div>
    </div>
  );
}

function uniqueTickers(values: string[]) {
  return Array.from(new Set(values));
}
