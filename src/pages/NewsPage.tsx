import { useState } from 'react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { TickerChip } from '../components/TickerChip';
import { dailyReport } from '../data/report';
import type { NewsItem } from '../types/research';
import { confidenceLabel, impactLabel } from '../utils/format';

const freshNewsKeywords = ['新催化', '資料節點'];
const contextNewsKeywords = ['近期脈絡', '全市場掃描', '跨市場連動', '風控', '風險'];

const isFreshNews = (item: NewsItem) =>
  freshNewsKeywords.some((keyword) => item.title.includes(keyword)) &&
  !contextNewsKeywords.some((keyword) => item.title.includes(keyword));

type NewsFilter = 'fresh' | 'context';

export function NewsPage() {
  const [activeFilter, setActiveFilter] = useState<NewsFilter>('fresh');
  const freshNews = dailyReport.news.filter(isFreshNews);
  const recentContextNews = dailyReport.news.filter((item) => !isFreshNews(item));
  const visibleNews = activeFilter === 'fresh' ? freshNews : recentContextNews;
  const activeCopy =
    activeFilter === 'fresh'
      ? {
          title: '最近很重要的新聞',
          eyebrow: 'Fresh Catalysts',
          description: '偏今天、昨夜或盤前最可能影響台股/美股判斷的訊號。',
        }
      : {
          title: '這幾天很重要的新聞',
          eyebrow: 'Recent Context',
          description: '不是單日新催化，但會影響接下來幾天主題延續、風險控管與公司研究方向。',
        };

  return (
    <div>
      <SectionHeader
        title="今日重要市場新聞"
        description="先看最新會動盤的催化，再看這幾天累積的重要脈絡；每則都保留來源、影響方向、信心程度與關聯 ticker。"
      />

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-1.5">
        <FilterButton
          active={activeFilter === 'fresh'}
          count={freshNews.length}
          label="最近重要"
          onClick={() => setActiveFilter('fresh')}
        />
        <FilterButton
          active={activeFilter === 'context'}
          count={recentContextNews.length}
          label="這幾天重要"
          onClick={() => setActiveFilter('context')}
        />
      </div>

      <NewsSection
        title={activeCopy.title}
        eyebrow={activeCopy.eyebrow}
        description={activeCopy.description}
        items={visibleNews}
      />
    </div>
  );
}

function FilterButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-cyan-300/20 via-emerald-300/10 to-blue-300/15 text-white shadow-lg shadow-cyan-950/20'
          : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
      }`}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="ml-2 rounded-full border border-white/10 bg-black/15 px-2 py-0.5 text-[11px]">{count}</span>
    </button>
  );
}

function NewsSection({
  title,
  eyebrow,
  description,
  items,
}: {
  title: string;
  eyebrow: string;
  description: string;
  items: NewsItem[];
}) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">{items.length} 則</span>
      </div>

      <div className="space-y-4">
        {items.length > 0 ? items.map((item) => <NewsCard key={item.id} item={item} />) : (
          <Card title="目前沒有符合分類的新聞" eyebrow={eyebrow}>
            <p className="text-sm leading-6 text-slate-300">下一次 automation 產生報告後，這裡會依新聞標籤自動分類。</p>
          </Card>
        )}
      </div>
    </section>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Card
      title={item.title}
      eyebrow={`${item.source} · ${item.date}`}
      right={<Badge tone={item.impact}>{impactLabel[item.impact]}</Badge>}
    >
      <p className="text-sm leading-6 text-slate-300">{item.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.relatedTickers.map((ticker) => (
          <TickerChip key={ticker} value={ticker} />
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">信心程度：{confidenceLabel[item.confidence]}</p>
    </Card>
  );
}
