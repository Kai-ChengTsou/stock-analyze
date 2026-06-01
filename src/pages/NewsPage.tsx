import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { dailyReport } from '../data/report';
import { confidenceLabel, impactLabel } from '../utils/format';

export function NewsPage() {
  return (
    <div>
      <SectionHeader title="今日重要市場新聞" description="每則新聞都保留來源、影響方向、信心程度與關聯 ticker，方便追蹤後續研究。" />
      <div className="space-y-4">
        {dailyReport.news.map((item) => (
          <Card
            key={item.id}
            title={item.title}
            eyebrow={`${item.source} · ${item.date}`}
            right={<Badge tone={item.impact}>{impactLabel[item.impact]}</Badge>}
          >
            <p className="text-sm leading-6 text-slate-300">{item.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.relatedTickers.map((ticker) => (
                <span key={ticker} className="chip">{ticker}</span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">信心程度：{confidenceLabel[item.confidence]}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
