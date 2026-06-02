import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { TickerChip } from '../components/TickerChip';
import { dailyReport } from '../data/report';
import { confidenceLabel } from '../utils/format';

export function ThemesPage() {
  return (
    <div>
      <SectionHeader title="市場主題分析" description="從新聞摘要萃取主題，再追蹤產業、公司與長短期影響。" />
      <div className="space-y-4">
        {dailyReport.themes.map((theme) => (
          <Card key={theme.id} title={theme.name} eyebrow="Theme" right={<Badge tone={theme.evidenceQuality}>證據 {confidenceLabel[theme.evidenceQuality]}</Badge>}>
            <p className="text-sm leading-6 text-slate-300">{theme.whyItMatters}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Info label="短期影響" value={theme.shortTermImpact} />
              <Info label="長期影響" value={theme.longTermImpact} />
            </div>
            <TagGroup label="相關產業" values={theme.relatedIndustries} />
            <TagGroup label="相關公司" values={theme.relatedCompanies} />
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

function TagGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <TickerChip key={value} value={value} groupValues={values} />
        ))}
      </div>
    </div>
  );
}
