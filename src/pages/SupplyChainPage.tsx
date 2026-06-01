import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { dailyReport, themeName } from '../data/report';
import { confidenceLabel } from '../utils/format';

const layerLabels = {
  1: 'Layer 1 直接受惠者',
  2: 'Layer 2 關鍵供應商',
  3: 'Layer 3 上游供應商',
  4: 'Layer 4 隱藏 / 瓶頸受惠者',
};

export function SupplyChainPage() {
  return (
    <div>
      <SectionHeader title="供應鏈探索器" description="從明顯龍頭往下追第二層、第三層與瓶頸型受惠者，避免只停在大型股。" />
      <div className="space-y-4">
        {([1, 2, 3, 4] as const).map((layer) => (
          <section key={layer}>
            <h2 className="mb-3 text-sm font-semibold text-cyan-200">{layerLabels[layer]}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {dailyReport.supplyChain.filter((node) => node.layer === layer).map((node) => (
                <Card key={node.id} title={`${node.companyName} · ${node.ticker}`} eyebrow={themeName(node.linkedThemeId)} right={<Badge tone={node.evidenceStrength}>證據 {confidenceLabel[node.evidenceStrength]}</Badge>}>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="chip">{node.marketCountry}</span>
                    <span className="chip">{node.visibility === 'Obvious' ? '明顯受惠' : '隱藏受惠'}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">{node.whyItMayBenefit}</p>
                  <p className="mt-3 text-xs leading-5 text-rose-200">關鍵風險：{node.keyRisk}</p>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
