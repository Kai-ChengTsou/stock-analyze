import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { TickerChip } from '../components/TickerChip';
import { dailyReport, themeName } from '../data/report';
import { confidenceLabel, evidenceGradeLabel, opportunityStageLabel } from '../utils/format';

export function BeneficiariesPage() {
  return (
    <div>
      <SectionHeader title="受惠者尋找器" description="按主題拆成直接、間接、隱藏受惠與可能受傷公司，並給出研究優先級。" />
      <div className="space-y-4">
        {dailyReport.beneficiaries.map((item) => {
          const blockTickers = uniqueTickers([
            ...item.directBeneficiaries,
            ...item.indirectBeneficiaries,
            ...item.hiddenBeneficiaries,
            ...item.companiesMayBeHurt,
            ...(item.radarOnly ?? []),
            ...(item.details?.map((detail) => detail.ticker) ?? []),
          ]);

          return (
          <Card key={item.id} title={themeName(item.themeId)} eyebrow="Beneficiary Finder" right={<Badge tone={item.evidenceQuality}>優先 {item.researchPriorityScore}</Badge>}>
            <p className="text-sm leading-6 text-slate-300">{item.reasoning}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Group title="直接受惠" values={item.directBeneficiaries} groupValues={blockTickers} />
              <Group title="間接受惠" values={item.indirectBeneficiaries} groupValues={blockTickers} />
              <Group title="隱藏受惠" values={item.hiddenBeneficiaries} groupValues={blockTickers} />
              <Group title="可能受傷" values={item.companiesMayBeHurt} groupValues={blockTickers} danger />
              {item.radarOnly?.length ? <Group title="雷達觀察" values={item.radarOnly} groupValues={blockTickers} /> : null}
            </div>
            {item.details?.length ? (
              <div className="mt-4 space-y-3">
                {item.details.map((detail) => (
                  <article key={`${detail.type}-${detail.ticker}`} className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{detail.companyName} · {detail.ticker}</p>
                        <p className="mt-1 text-xs text-cyan-200">{detail.type}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {detail.evidenceGrade ? <span className="chip">{evidenceGradeLabel[detail.evidenceGrade]}</span> : null}
                        {detail.opportunityStage ? <span className="chip">{opportunityStageLabel[detail.opportunityStage]}</span> : null}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{detail.linkage}</p>
                    {detail.nextVerification ? <p className="mt-2 text-xs leading-5 text-slate-400">下一步驗證：{detail.nextVerification}</p> : null}
                  </article>
                ))}
              </div>
            ) : null}
            <p className="mt-3 text-xs text-slate-400">證據品質：{confidenceLabel[item.evidenceQuality]}</p>
          </Card>
        )})}
      </div>
    </div>
  );
}

function Group({ title, values, groupValues, danger = false }: { title: string; values: string[]; groupValues: string[]; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.045] p-3">
      <p className={`mb-2 text-xs font-semibold ${danger ? 'text-rose-200' : 'text-cyan-200'}`}>{title}</p>
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
