interface CardProps {
  title?: string;
  eyebrow?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

export function Card({ title, eyebrow, right, children }: CardProps) {
  return (
    <section className="panel p-4">
      {(title || eyebrow || right) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{eyebrow}</p>}
            {title && <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
