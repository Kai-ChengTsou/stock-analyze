import { AlertTriangle, CheckCircle2, SearchX } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { TickerChip } from '../components/TickerChip';
import { dailyReport } from '../data/report';
import { evidenceGradeLabel, opportunityStageLabel, toneClass } from '../utils/format';

export function ActionPlanPage() {
  const suggestedActions = dailyReport.suggestedActions ?? dailyReport.watchlistAlerts;
  const risks = dailyReport.risks ?? [
    {
      id: 'fallback-biggest-risk',
      category: '主要風險',
      description: dailyReport.biggestRisk,
      severity: 'High' as const,
      whatWouldInvalidate: dailyReport.emotionalWarning,
    },
  ];
  const rejectedCandidates = dailyReport.rejectedCandidates ?? [];
  const scanSummary = dailyReport.scanSummary;

  return (
    <div>
      <SectionHeader
        eyebrow="Action Plan"
        title="行動與風險"
        description="把 automation 的結論收斂成可執行的追蹤、等待、避開與下一步驗證。"
      />

      {scanSummary ? (
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <StatCard label="候選項目" value={`${scanSummary.candidateItemsScanned}`} detail="本次掃描新聞/量價/題材候選" />
          <StatCard label="掃描分類" value={`${scanSummary.categoriesScanned.length}`} detail={scanSummary.categoriesScanned.slice(0, 3).join(' / ')} />
          <StatCard label="主要來源" value={`${scanSummary.majorSourcesChecked.length}`} detail={scanSummary.majorSourcesChecked.slice(0, 3).join(' / ')} />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card title="今日建議行動" eyebrow="Suggested Actions" right={<CheckCircle2 className="h-5 w-5 text-emerald-200" />}>
          <div className="space-y-3">
            {suggestedActions.map((action) => (
              <p key={action} className="rounded-lg border border-emerald-300/15 bg-emerald-300/10 p-3 text-sm leading-6 text-emerald-50">{action}</p>
            ))}
          </div>
        </Card>

        <Card title="風險與失效條件" eyebrow="Risks" right={<AlertTriangle className="h-5 w-5 text-amber-200" />}>
          <div className="space-y-3">
            {risks.map((risk) => (
              <article key={risk.id} className="rounded-lg border border-amber-300/15 bg-amber-300/10 p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-amber-50">{risk.category}</span>
                  {risk.severity ? <Badge tone={risk.severity}>{risk.severity}</Badge> : null}
                </div>
                <p className="text-sm leading-6 text-amber-50">{risk.description}</p>
                {risk.whatWouldInvalidate ? <p className="mt-2 text-xs leading-5 text-amber-100/80">失效條件：{risk.whatWouldInvalidate}</p> : null}
              </article>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card title="低訊號 / 拒絕候選" eyebrow="Rejected Candidates" right={<SearchX className="h-5 w-5 text-rose-200" />}>
          {rejectedCandidates.length ? (
            <div className="space-y-3">
              {rejectedCandidates.map((candidate) => (
                <article key={candidate.ticker} className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{candidate.companyName}</p>
                      <div className="mt-1">
                        <TickerChip value={candidate.ticker} groupValues={rejectedCandidates.map((item) => item.ticker)} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {candidate.evidenceGrade ? <span className={`rounded-full border px-2.5 py-1 text-xs ${toneClass(candidate.evidenceGrade)}`}>{evidenceGradeLabel[candidate.evidenceGrade]}</span> : null}
                      {candidate.opportunityStage ? <span className={`rounded-full border px-2.5 py-1 text-xs ${toneClass(candidate.opportunityStage)}`}>{opportunityStageLabel[candidate.opportunityStage]}</span> : null}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{candidate.reason}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-300">目前報告尚未提供 rejectedCandidates；automation 可在下一次輸出低訊號候選與排除原因。</p>
          )}
        </Card>

        <Card title="掃描排除說明" eyebrow="Coverage Notes">
          {scanSummary ? (
            <div className="space-y-3">
              <InfoList title="刻意排除的產業" values={scanSummary.sectorsExcluded} />
              <InfoList title="低訊號排除" values={scanSummary.lowSignalItemsExcluded} />
              <InfoList title="過時排除" values={scanSummary.staleItemsExcluded} />
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-300">下一次 schema v2 報告會在這裡顯示掃描來源、排除項目與低訊號原因。</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{detail || '等待下一次掃描資料'}</p>
    </div>
  );
}

function InfoList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <p className="mb-2 text-xs font-semibold text-cyan-200">{title}</p>
      {values.length ? (
        <ul className="space-y-2">
          {values.map((value) => <li key={value} className="text-sm leading-6 text-slate-300">{value}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">沒有排除項目</p>
      )}
    </div>
  );
}
