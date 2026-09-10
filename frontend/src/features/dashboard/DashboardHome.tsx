import type { HealthResponse } from "@adobos/shared";
import { motion } from "motion/react";
import { StatusIsland } from "@/features/dashboard/StatusIsland";
import { getReadyModules } from "@/lib/nav";

interface DashboardHomeProps {
  initialHealth?: HealthResponse | null;
}

export function DashboardHome({ initialHealth = null }: DashboardHomeProps) {
  const ready = getReadyModules();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-lg border border-border bg-card p-6 sm:p-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          01 / modules
        </p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          tobot<span className="text-primary">.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Moderation, logs, welcomes, levels and economy from one place. Turn on
          one module, watch it work, then add the next.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusIsland initialHealth={initialHealth} />

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-base font-semibold">Ready modules</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Features available right now.
          </p>
          <ul className="mt-4 grid gap-px bg-border sm:grid-cols-1">
            {ready.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.14 }}
                  className="bg-card"
                >
                  <a
                    href={item.href}
                    className="group flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground group-hover:text-primary">
                        {item.label}
                      </span>
                      {item.blurb && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.blurb}
                        </span>
                      )}
                    </span>
                  </a>
                </motion.li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
