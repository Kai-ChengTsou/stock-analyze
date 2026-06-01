import { ArrowRight } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { companyResearch, newsTitle, supplyNode, themeName, dailyReport } from '../data/report';
import { finalViewLabel } from '../utils/format';

export function IdeaPipelinePage() {
  return (
    <div>
      <SectionHeader title="Idea Pipeline" description="把新聞如何變成主題、供應鏈節點、候選公司與最終觀點完整攤開。" />
      <div className="space-y-4">
        {dailyReport.ideaPipeline.map((idea) => {
          const node = supplyNode(idea.supplyChainNodeId);
          const company = companyResearch(idea.companyResearchId);
          return (
            <Card key={idea.id} title={company ? `${company.companyName} · ${company.ticker}` : '候選公司'} eyebrow="Why selected" right={<Badge tone={idea.finalView}>{finalViewLabel[idea.finalView]}</Badge>}>
              <div className="grid gap-2 text-sm md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                <Step label="新聞" value={newsTitle(idea.newsId)} />
                <Arrow />
                <Step label="主題" value={themeName(idea.themeId)} />
                <Arrow />
                <Step label="供應鏈層級" value={node ? `Layer ${node.layer} · ${node.companyName}` : '未知節點'} />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <Step label="候選公司研究" value={company ? company.businessModel : '尚未建立'} />
                <Arrow />
                <Step label="最終觀點" value={finalViewLabel[idea.finalView]} />
              </div>
              <p className="mt-4 rounded-lg bg-white/[0.045] p-3 text-sm leading-6 text-slate-300">{idea.explanation}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Step({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-24 rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <p className="text-xs text-cyan-200">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}

function Arrow() {
  return <ArrowRight className="mx-auto hidden h-4 w-4 text-slate-500 md:block" />;
}
