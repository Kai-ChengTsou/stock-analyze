import { Link2 } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { TickerChip } from '../components/TickerChip';
import { marketSections } from '../data/report';
import { confidenceLabel } from '../utils/format';

export function CrossMarketPage() {
  const pageTickers = uniqueTickers(
    marketSections.crossMarket.flatMap((link) => [...link.relatedUSTickers, ...link.relatedTaiwanTickers]),
  );

  return (
    <div>
      <SectionHeader
        eyebrow="Linkage"
        title="跨市場連動"
        description="把美股催化拆回台股供應鏈，區分跟漲、實質受惠與需要再驗證的題材。"
      />

      <div className="space-y-4">
        {marketSections.crossMarket.length > 0 ? marketSections.crossMarket.map((link) => (
          <Card
            key={link.id}
            title={link.title}
            eyebrow="US -> Taiwan"
            right={<Badge tone={link.evidenceStrength}>證據 {confidenceLabel[link.evidenceStrength]}</Badge>}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="美股催化" value={link.usCatalyst} />
              <Info label="台股 read-through" value={link.taiwanReadThrough} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TagGroup label="美股關聯" values={link.relatedUSTickers} groupValues={pageTickers} />
              <TagGroup label="台股關聯" values={link.relatedTaiwanTickers} groupValues={pageTickers} />
            </div>
          </Card>
        )) : (
          <Card title="等待下一次掃描" eyebrow="Empty" right={<Link2 className="h-5 w-5 text-cyan-200" />}>
            <p className="text-sm leading-6 text-slate-300">下一版晨報會把美股新聞如何影響台股供應鏈獨立列出。</p>
          </Card>
        )}
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

function TagGroup({ label, values, groupValues }: { label: string; values: string[]; groupValues: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.length > 0 ? values.map((value) => (
          <TickerChip key={value} value={value} groupValues={groupValues} />
        )) : <span className="text-sm text-slate-500">無</span>}
      </div>
    </div>
  );
}

function uniqueTickers(values: string[]) {
  return Array.from(new Set(values));
}
