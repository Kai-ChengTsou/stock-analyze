import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { dailyReport } from '../data/report';
import { actionLabel, finalViewLabel } from '../utils/format';

export function CompanyResearchPage() {
  return (
    <div>
      <SectionHeader title="公司研究" description="每家公司都呈現商業模式、財務摘要、三情境、風險與行動建議。" />
      <div className="space-y-4">
        {dailyReport.companyResearch.map((company) => (
          <Card
            key={company.id}
            title={`${company.companyName} · ${company.ticker}`}
            eyebrow={company.marketCountry}
            right={<Badge tone={company.finalView}>{finalViewLabel[company.finalView]}</Badge>}
          >
            <p className="text-sm leading-6 text-slate-300">{company.overview}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
            <TagGroup label="競爭者" values={company.competitors} />
            <TagGroup label="關鍵風險" values={company.keyRisks} />

            <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
              <p className="text-sm font-semibold text-cyan-100">建議動作：{actionLabel[company.suggestedAction]}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">改變觀點的新資訊：{company.whatWouldChangeView}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
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

function TagGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="chip">{value}</span>
        ))}
      </div>
    </div>
  );
}
