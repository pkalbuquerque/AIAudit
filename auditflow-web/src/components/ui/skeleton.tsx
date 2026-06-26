/* Skeleton de carregamento + alerta de erro com retry — usados em todas as
   listas/detalhes integrados à API. */

import { I } from "./icons";

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-line/60 ${className}`}
      style={style}
      aria-hidden
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white border border-line rounded-lg overflow-hidden p-5 flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white border border-line rounded-lg p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-12" />
        </div>
      ))}
    </div>
  );
}

export function ErrorAlert({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-lg border p-5 flex items-start gap-3 text-[13px]"
      style={{ borderColor: "rgba(229,83,60,0.35)", background: "rgba(229,83,60,0.05)" }}
    >
      <I.alert size={16} className="mt-0.5 shrink-0" style={{ color: "#E5533C" }} />
      <div className="flex-1">
        <div className="text-text font-medium mb-0.5">Não foi possível carregar os dados</div>
        <div className="text-sub">{message}</div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 h-9 px-3.5 rounded-md border border-line bg-white text-[12.5px] text-text inline-flex items-center gap-1.5 hover:bg-paper"
        >
          <I.refresh size={13} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
