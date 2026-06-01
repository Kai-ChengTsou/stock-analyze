interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <header className="mb-4">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>}
      <h1 className="mt-2 text-2xl font-bold text-white">{title}</h1>
      {description && <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>}
    </header>
  );
}
