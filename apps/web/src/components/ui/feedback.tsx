import { AlertCircle, Inbox, Loader2 } from "lucide-react";

export function LoadingBlock({
  label = "Loading…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-line/70 bg-sand/30 px-4 py-6 text-sm text-ink/60 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-forest" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
  className = "",
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-ink ${className}`}
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p>{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-forest underline-offset-2 hover:underline"
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border border-dashed border-line bg-sand/20 px-6 py-10 text-center ${className}`}
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink/45 shadow-sm ring-1 ring-line/70">
        <Inbox className="h-5 w-5" />
      </span>
      <p className="font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink/55">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
