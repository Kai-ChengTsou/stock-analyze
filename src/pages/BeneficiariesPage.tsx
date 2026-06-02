import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { TickerChip } from '../components/TickerChip';
import { dailyReport, themeName } from '../data/report';
import { confidenceLabel } from '../utils/format';

export function BeneficiariesPage() {
  return (
    <div>
      <SectionHeader title="受惠者尋找器" description="按主題拆成直接、間接、隱藏受惠與可能受傷公司，並給出研究優先級。" />
      <div className="space-y-4">
        {dailyReport.beneficiaries.map((item) => (
          <Card key={item.id} title={themeName(item.themeId)} eyebrow="Beneficiary Finder" right={<Badge tone={item.evidenceQuality}>優先 {item.researchPriorityScore}</Badge>}>
            <p className="text-sm leading-6 text-slate-300">{item.reasoning}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Group title="直接受惠" values={item.directBeneficiaries} />
              <Group title="間接受惠" values={item.indirectBeneficiaries} />
              <Group title="隱藏受惠" values={item.hiddenBeneficiaries} />
              <Group title="可能受傷" values={item.companiesMayBeHurt} danger />
            </div>
            <p className="mt-3 text-xs text-slate-400">證據品質：{confidenceLabel[item.evidenceQuality]}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Group({ title, values, danger = false }: { title: string; values: string[]; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.045] p-3">
      <p className={`mb-2 text-xs font-semibold ${danger ? 'text-rose-200' : 'text-cyan-200'}`}>{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <TickerChip key={value} value={value} groupValues={values} />
        ))}
      </div>
    </div>
  );
}
