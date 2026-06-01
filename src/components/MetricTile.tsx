interface MetricTileProps {
  label: string;
  value: string;
  detail?: string;
  tone?: 'cyan' | 'emerald' | 'amber' | 'violet';
}

const toneClass = {
  cyan: 'border-cyan-300/20 bg-cyan-300/[0.07]',
  emerald: 'border-emerald-300/20 bg-emerald-300/[0.07]',
  amber: 'border-amber-300/20 bg-amber-300/[0.07]',
  violet: 'border-violet-300/20 bg-violet-300/[0.07]',
};

export function MetricTile({ label, value, detail, tone = 'cyan' }: MetricTileProps) {
  return (
    <div className={`rounded-lg border p-3 ${toneClass[tone]}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
      {detail && <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>}
    </div>
  );
}
