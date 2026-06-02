import { Radar } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { marketSections } from '../data/report';

const statusTone: Record<string, string> = {
  'Fresh catalyst': 'Positive',
  'Recent context': 'Neutral',
  'Background thesis': 'Medium',
  'Momentum only': 'High',
  'No signal': 'Low',
};

const statusLabel: Record<string, string> = {
  'Fresh catalyst': '新催化',
  'Recent context': '近期脈絡',
  'Background thesis': '背景論點',
  'Momentum only': '純動能',
  'No signal': '無明確訊號',
};

export function MarketRadarPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Coverage"
        title="全市場雷達"
        description="每天先掃完整市場，再把真正重要的訊號升級到晨報主文；這頁保留掃描覆蓋度與略過原因。"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {marketSections.scanCoverage.length > 0 ? marketSections.scanCoverage.map((item) => (
          <Card
            key={item.id}
            title={item.category}
            eyebrow={item.market}
            right={<Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>}
          >
            <p className="text-sm leading-6 text-slate-300">{item.reason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tickersChecked.length > 0 ? item.tickersChecked.map((ticker) => (
                <span key={ticker} className="chip">{ticker}</span>
              )) : <span className="text-sm text-slate-500">下一次掃描補上候選標的</span>}
            </div>
            <p className="mt-3 text-xs text-slate-400">優先級：{item.priority}</p>
          </Card>
        )) : (
          <Card title="等待掃描資料" eyebrow="Radar" right={<Radar className="h-5 w-5 text-cyan-200" />}>
            <p className="text-sm leading-6 text-slate-300">下一版晨報會列出台股與美股各產業掃描結果。</p>
          </Card>
        )}
      </div>
    </div>
  );
}
