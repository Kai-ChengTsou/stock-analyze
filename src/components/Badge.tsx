import { toneClass } from '../utils/format';

interface BadgeProps {
  children: React.ReactNode;
  tone?: string;
}

export function Badge({ children, tone = 'Neutral' }: BadgeProps) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass(tone)}`}>{children}</span>;
}
