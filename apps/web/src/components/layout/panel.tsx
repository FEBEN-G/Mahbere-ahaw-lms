export function Panel({
  children,
  className = "",
  title,
  description,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-line/80 bg-white/90 shadow-[0_1px_0_rgba(19,35,28,0.04),0_12px_32px_-20px_rgba(19,35,28,0.25)] backdrop-blur-sm transition-shadow hover:shadow-[0_1px_0_rgba(19,35,28,0.04),0_18px_40px_-18px_rgba(19,35,28,0.28)] ${className}`}
    >
      {title ? (
        <div className="flex flex-col gap-3 border-b border-line/70 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-ink/55">{description}</p>
            ) : null}
          </div>
          {action ? (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              {action}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="group rounded-2xl border border-line/80 bg-white/90 p-4 shadow-[0_1px_0_rgba(19,35,28,0.04)] transition-all hover:-translate-y-0.5 hover:border-moss/40 hover:shadow-[0_16px_30px_-22px_rgba(31,77,58,0.45)]">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}
