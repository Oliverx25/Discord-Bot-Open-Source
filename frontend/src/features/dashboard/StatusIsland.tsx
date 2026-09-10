import { useQuery } from "@tanstack/react-query";
import { Activity, Bot, Loader2 } from "lucide-react";
import type { HealthResponse } from "@adobos/shared";
import { fetchHealth } from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";

interface StatusIslandProps {
  initialHealth?: HealthResponse | null;
}

export function StatusIsland({ initialHealth = null }: StatusIslandProps) {
  const query = useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealth,
    initialData: initialHealth ?? undefined,
    refetchInterval: 15_000,
  });

  const data = query.data;
  const error = query.isError
    ? query.error instanceof Error
      ? query.error.message
      : "Unknown error"
    : null;

  return (
    <section className="rounded-lg border border-border bg-card p-5" aria-live="polite">
      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-foreground">
        <Activity className="size-4 text-primary" aria-hidden />
        System status
      </div>

      {query.isLoading && !data && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Checking API…
        </p>
      )}

      {error && !data && (
        <p className="mt-3 text-sm text-destructive">
          Couldn't reach the API. Start the backend on port 3000.
          <span className="mt-1 block text-muted-foreground">{error}</span>
        </p>
      )}

      {data && (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              API
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">{data.status}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Uptime
            </dt>
            <dd className="mt-0.5 font-mono font-medium text-foreground">
              {Math.floor(data.uptime)}s
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Discord
            </dt>
            <dd
              className={cn(
                "mt-0.5 inline-flex items-center gap-2 font-medium",
                data.botReady
                  ? "text-[var(--success)]"
                  : "text-[var(--warning)]",
              )}
            >
              <Bot className="size-4" aria-hidden />
              {data.botReady ? "Connected" : "Disconnected / no token"}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
