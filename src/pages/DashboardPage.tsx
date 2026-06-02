import { AlertTriangle, Brain, Link2, Radar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { MetricTile } from '../components/MetricTile';
import { SectionHeader } from '../components/SectionHeader';
import { dailyReport, marketSections } from '../data/report';
import { sentimentLabel } from '../utils/format';

export function DashboardPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Daily Research"
        title="今日全市場總覽"
        description="先掃全市場，再分成美股、台股與跨市場連動，最後挑出真正值得深入研究的訊號。"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricTile label="整體市場情緒" value={sentimentLabel[dailyReport.marketSentiment]} detail="綜合美股、台股與主題動能" tone="emerald" />
        <MetricTile label="美股關注" value={`${marketSections.us.stocksToWatch.length} 檔`} detail={marketSections.us.stocksToWatch.join(' / ') || '等待掃描'} tone="cyan" />
        <MetricTile label="台股關注" value={`${marketSections.taiwan.stocksToWatch.length} 檔`} detail={marketSections.taiwan.stocksToWatch.join(' / ') || '等待掃描'} tone="cyan" />
        <MetricTile label="掃描分類" value={`${marketSections.scanCoverage.length} 類`} detail="全市場雷達覆蓋度" tone="violet" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MarketSummaryCard title="美股晨報" to="/us-market" section={marketSections.us} />
        <MarketSummaryCard title="台股晨報" to="/taiwan-market" section={marketSections.taiwan} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card title="全市場摘要" eyebrow="Market" right={<Badge tone={dailyReport.marketSentiment}>{sentimentLabel[dailyReport.marketSentiment]}</Badge>}>
          <p className="text-base leading-7 text-slate-200">{dailyReport.marketOverview}</p>
        </Card>

        <Card title="今日最大風險" eyebrow="Risk" right={<AlertTriangle className="h-5 w-5 text-amber-200" />}>
          <p className="text-sm leading-6 text-amber-100">{dailyReport.biggestRisk}</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="今日主題" eyebrow="Themes">
          <div className="space-y-3">
            {dailyReport.topThemes.map((theme, index) => (
              <div key={theme} className="flex items-center gap-3 rounded-lg bg-white/[0.045] p-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/10 text-sm font-bold text-cyan-200">{index + 1}</span>
                <span className="font-medium text-white">{theme}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="跨市場連動" eyebrow="US -> Taiwan" right={<Link2 className="h-5 w-5 text-cyan-200" />}>
          <p className="text-sm leading-6 text-slate-300">把美股催化拆回台股供應鏈，分辨實質受惠、跟漲與需要驗證的題材。</p>
          <Link className="mt-4 inline-flex text-sm font-semibold text-cyan-200 hover:text-cyan-100" to="/cross-market">查看連動</Link>
        </Card>

        <Card title="全市場雷達" eyebrow="Coverage" right={<Radar className="h-5 w-5 text-cyan-200" />}>
          <p className="text-sm leading-6 text-slate-300">保留每天掃過的產業分類、候選標的、是否有新催化，以及略過原因。</p>
          <Link className="mt-4 inline-flex text-sm font-semibold text-cyan-200 hover:text-cyan-100" to="/market-radar">查看雷達</Link>
        </Card>
      </div>

      <Card title="Watchlist Alerts" eyebrow="Alerts" right={<TrendingUp className="h-5 w-5 text-emerald-200" />}>
        <div className="space-y-3">
          {dailyReport.watchlistAlerts.map((alert) => (
            <p key={alert} className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-slate-300">{alert}</p>
          ))}
        </div>
      </Card>

      <Card title="情緒提醒" eyebrow="Behavior" right={<Brain className="h-5 w-5 text-cyan-200" />}>
        <p className="text-sm leading-6 text-slate-300">{dailyReport.emotionalWarning}</p>
      </Card>
    </div>
  );
}

function MarketSummaryCard({ title, to, section }: { title: string; to: string; section: typeof marketSections.us }) {
  return (
    <Card title={title} eyebrow={section.region} right={<Badge tone={section.sentiment}>{sentimentLabel[section.sentiment]}</Badge>}>
      <p className="text-sm leading-6 text-slate-300">{section.overview}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {section.topThemes.slice(0, 3).map((theme) => (
          <span key={theme} className="chip">{theme}</span>
        ))}
      </div>
      <Link className="mt-4 inline-flex text-sm font-semibold text-cyan-200 hover:text-cyan-100" to={to}>打開{title}</Link>
    </Card>
  );
}
