import { AlertTriangle, Brain, TrendingUp } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { MetricTile } from '../components/MetricTile';
import { SectionHeader } from '../components/SectionHeader';
import { dailyReport } from '../data/report';
import { sentimentLabel } from '../utils/format';

export function DashboardPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Daily Research"
        title="今日市場總覽"
        description="這不是交易訊號，而是每日研究脈絡、風險與候選標的的整理。"
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricTile label="今日市場情緒" value={sentimentLabel[dailyReport.marketSentiment]} detail="根據 mock 研究摘要判斷" tone="emerald" />
        <MetricTile label="值得關注股票" value={`${dailyReport.stocksToWatch.length} 檔`} detail={dailyReport.stocksToWatch.join(' / ')} tone="cyan" />
        <MetricTile label="主題數量" value={`${dailyReport.topThemes.length} 個`} detail="由新聞與供應鏈邏輯推導" tone="violet" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card title="今日市場總覽" eyebrow="Market" right={<Badge tone={dailyReport.marketSentiment}>{sentimentLabel[dailyReport.marketSentiment]}</Badge>}>
          <p className="text-base leading-7 text-slate-200">{dailyReport.marketOverview}</p>
        </Card>

        <Card title="今日最大風險" eyebrow="Risk" right={<AlertTriangle className="h-5 w-5 text-amber-200" />}>
          <p className="text-sm leading-6 text-amber-100">{dailyReport.biggestRisk}</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="今日三大主題" eyebrow="Themes">
          <div className="space-y-3">
            {dailyReport.topThemes.map((theme, index) => (
              <div key={theme} className="flex items-center gap-3 rounded-lg bg-white/[0.045] p-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/10 text-sm font-bold text-cyan-200">{index + 1}</span>
                <span className="font-medium text-white">{theme}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="今日最值得關注股票" eyebrow="Watch">
          <div className="flex flex-wrap gap-2">
            {dailyReport.stocksToWatch.map((ticker) => (
              <span key={ticker} className="chip">{ticker}</span>
            ))}
          </div>
        </Card>

        <Card title="情緒提醒" eyebrow="Behavior" right={<Brain className="h-5 w-5 text-cyan-200" />}>
          <p className="text-sm leading-6 text-slate-300">{dailyReport.emotionalWarning}</p>
        </Card>
      </div>

      <Card title="Watchlist Alerts" eyebrow="Alerts" right={<TrendingUp className="h-5 w-5 text-emerald-200" />}>
        <div className="space-y-3">
          {dailyReport.watchlistAlerts.map((alert) => (
            <p key={alert} className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-slate-300">{alert}</p>
          ))}
        </div>
      </Card>
    </div>
  );
}
