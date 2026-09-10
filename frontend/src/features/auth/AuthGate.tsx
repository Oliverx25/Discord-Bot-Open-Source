import { useQuery } from "@tanstack/react-query";
import type { PanelMeGuild, PlanTier } from "@adobos/shared";
import { PLAN_TIER_LABEL } from "@adobos/shared";
import { fetchEntitlements } from "@/lib/api/entitlements";
import { fetchMe, logout } from "@/lib/api/me";
import {
  clearSelectedGuildId,
  getSelectedGuildId,
  setSelectedGuildId,
} from "@/stores/guild";
import { queryKeys } from "@/lib/query/keys";
import { Button } from "@/components/ui/button";

export function AuthGate() {
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    retry: false,
  });

  const me = meQuery.data ?? null;
  const selected = me
    ? (getSelectedGuildId() ?? me.guilds[0]?.id ?? "")
    : "";

  const entitlementsQuery = useQuery({
    queryKey: queryKeys.entitlements(selected || null),
    queryFn: fetchEntitlements,
    enabled: Boolean(me && selected),
    retry: false,
  });

  const tier: PlanTier = entitlementsQuery.data?.tier ?? "free";

  if (meQuery.isError) {
    if (typeof window !== "undefined") window.location.assign("/login");
    return null;
  }

  if (me && me.guilds.length === 0) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <h2 className="font-display text-lg font-semibold">No servers</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Add tobot to a server where you can Manage Server. Discord will ask
          for the permissions; then come back and sign in with your account.
        </p>
        <a
          href="/auth/invite"
          data-astro-reload
          className="inline-flex h-[38px] items-center justify-center rounded-md border border-primary bg-primary px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-primary-foreground shadow-[var(--shadow-hard)]"
        >
          Add to a server
        </a>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            void logout().finally(() => {
              clearSelectedGuildId();
              window.location.assign("/login");
            });
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="border-b border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground lg:px-8">
        Checking session…
      </div>
    );
  }

  const selectedGuild =
    me.guilds.find((g) => g.id === selected) ?? me.guilds[0]!;
  const selectedMissingBot = !selectedGuild.botPresent;

  if (selected && getSelectedGuildId() !== selected) {
    setSelectedGuildId(selected);
  }

  function onChange(guild: PanelMeGuild): void {
    setSelectedGuildId(guild.id);
    window.location.reload();
  }

  return (
    <div className="border-b border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm lg:px-8">
        <label className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Server
          </span>
          <select
            className="max-w-[16rem] truncate rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
            value={selected}
            onChange={(event) => {
              const guild = me.guilds.find((g) => g.id === event.target.value);
              if (guild) onChange(guild);
            }}
          >
            {me.guilds.map((guild) => (
              <option key={guild.id} value={guild.id}>
                {guild.botPresent ? guild.name : `${guild.name} (no bot)`}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/general/billing"
            className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:border-primary hover:text-foreground"
          >
            {PLAN_TIER_LABEL[tier]}
          </a>
          <span className="truncate font-mono text-xs text-muted-foreground">
            {me.user.username}
          </span>
          <button
            type="button"
            className="font-mono text-xs uppercase tracking-[0.1em] text-primary hover:underline"
            onClick={() => {
              void logout().finally(() => {
                clearSelectedGuildId();
                window.location.assign("/login");
              });
            }}
          >
            Sign out
          </button>
        </div>
      </div>
      {selectedMissingBot ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-sm lg:px-8">
          <p className="text-muted-foreground">
            tobot isn't in this server. Add it to use the dashboard.
          </p>
          <a
            href={`/auth/invite?guildId=${encodeURIComponent(selectedGuild.id)}`}
            data-astro-reload
            className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-primary hover:underline"
          >
            Add to the server
          </a>
        </div>
      ) : null}
    </div>
  );
}
