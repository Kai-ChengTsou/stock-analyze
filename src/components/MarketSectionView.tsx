import { Badge } from './Badge';
import { Card } from './Card';
import { SectionHeader } from './SectionHeader';
import { TickerChip } from './TickerChip';
import { marketSections, newsById } from '../data/report';
import type { MarketSection } from '../types/research';
import { impactLabel, sentimentLabel } from '../utils/format';

interface MarketSectionViewProps {
  section: MarketSection;
  description: string;
}

export function MarketSectionView({ section, description }: MarketSectionViewProps) {
  return (
    <div>
      <SectionHeader eyebrow={section.region} title={section.title} description={description} />

      <div className="grid gap-3 md:grid-cols-3">
        <Card title="市場情緒" eyebrow="Sentiment" right={<Badge tone={section.sentiment}>{sentimentLabel[section.sentiment]}</Badge>}>
          <p className="text-sm leading-6 text-slate-300">{section.overview}</p>
        </Card>
        <Card title="追蹤指標" eyebrow="Indexes">
          <div className="flex flex-wrap gap-2">
            {section.keyIndexes.map((index) => (
              <span key={index} className="chip">{index}</span>
            ))}
          </div>
        </Card>
        <Card title="關注標的" eyebrow="Watch">
          <div className="flex flex-wrap gap-2">
            {section.stocksToWatch.length > 0 ? section.stocksToWatch.map((ticker) => (
              <TickerChip key={ticker} value={ticker} groupValues={section.stocksToWatch} />
            )) : <p className="text-sm text-slate-400">等待下一次完整市場掃描補上。</p>}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="今日主題" eyebrow="Themes">
          <div className="space-y-3">
            {section.topThemes.map((theme, index) => (
              <div key={theme} className="flex gap-3 rounded-lg bg-white/[0.045] p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-cyan-300/10 text-xs font-bold text-cyan-200">{index + 1}</span>
                <p className="text-sm leading-6 text-slate-200">{theme}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="重要新聞" eyebrow="News">
          <div className="space-y-3">
            {section.importantNewsIds.length > 0 ? section.importantNewsIds.map((newsId) => {
              const item = newsById(newsId);
              if (!item) return null;
              return (
                <article key={newsId} className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold leading-5 text-white">{item.title}</h3>
                    <Badge tone={item.impact}>{impactLabel[item.impact]}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{item.source}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
                </article>
              );
            }) : <p className="text-sm text-slate-400">沒有獨立新聞被歸到此市場。</p>}
          </div>
        </Card>
      </div>

      <Card title="風險" eyebrow="Risk">
        <div className="space-y-3">
          {section.risks.map((risk) => (
            <p key={risk} className="rounded-lg border border-amber-300/15 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">{risk}</p>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function USMarketPage() {
  return (
    <MarketSectionView
      section={marketSections.us}
      description="美股區塊獨立追蹤大盤、利率、美元、半導體、雲端 capex 與大型科技財報，避免和台股題材混在一起。"
    />
  );
}

export function TaiwanMarketPage() {
  return (
    <MarketSectionView
      section={marketSections.taiwan}
      description="台股區塊獨立追蹤加權、櫃買、外資、匯率、成交量、處置股、月營收與本土題材輪動。"
    />
  );
}
