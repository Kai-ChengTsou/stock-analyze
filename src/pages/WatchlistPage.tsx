import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { dailyReport } from '../data/report';
import { finalViewLabel, statusLabel } from '../utils/format';

export function WatchlistPage() {
  return (
    <div>
      <SectionHeader title="Watchlist" description="追蹤目前觀點、關鍵新聞、價格區間、風險註記與狀態。" />
      <div className="space-y-4">
        {dailyReport.watchlist.map((item) => (
          <Card key={item.id} title={`${item.companyName} · ${item.ticker}`} eyebrow={`更新 ${item.lastUpdatedTime}`} right={<Badge tone={item.currentView}>{finalViewLabel[item.currentView]}</Badge>}>
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="狀態" value={statusLabel[item.status]} />
              <Info label="關鍵新聞" value={item.keyNews} />
              <Info label="關鍵價格位置" value={item.keyPriceLevels} />
              <Info label="風險註記" value={item.riskNotes} danger />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.045] p-3">
      <p className={`text-xs ${danger ? 'text-rose-200' : 'text-slate-400'}`}>{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}
