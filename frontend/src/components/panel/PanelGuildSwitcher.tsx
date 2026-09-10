import { useEffect, useState } from "react";
import type { PanelMeGuild } from "@adobos/shared";
import { ChevronDown, Plus } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { setSelectedGuildId } from "@/stores/guild";
import { guildTag } from "./guildTag";

function GuildGlyph({
  name,
  iconUrl,
}: {
  name: string;
  iconUrl: string | null;
}) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[var(--bg-hover)] font-display text-[10px] font-bold">
      {iconUrl ? (
        <Avatar className="size-6 rounded-sm">
          <AvatarImage src={iconUrl} alt="" />
          <AvatarFallback className="rounded-sm bg-transparent font-display text-[10px] font-bold">
            {guildTag(name)}
          </AvatarFallback>
        </Avatar>
      ) : (
        guildTag(name)
      )}
    </span>
  );
}

export function PanelGuildSwitcher({
  guilds,
  selected,
}: {
  guilds: PanelMeGuild[];
  selected: PanelMeGuild | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (selected) setSelectedGuildId(selected.id);
  }, [selected]);

  function selectGuild(guild: PanelMeGuild): void {
    setOpen(false);
    if (selected?.id === guild.id) return;
    setSelectedGuildId(guild.id);
    window.location.reload();
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      portalled
      rootClassName="relative max-w-full"
      className="tobot-glass w-72 rounded-md p-1 shadow-none"
      trigger={
        <button
          type="button"
          disabled={guilds.length === 0}
          aria-label="Switch server"
          aria-expanded={open}
          data-open={open ? "" : undefined}
          className="tobot-glass flex h-[38px] max-w-[18rem] items-center gap-2 rounded-md px-2.5 text-left transition-[border-color,background] duration-[var(--dur-fast)] disabled:opacity-60"
        >
          {selected ? (
            <GuildGlyph name={selected.name} iconUrl={selected.iconUrl} />
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-[var(--bg-hover)] font-display text-[10px] font-bold">
              —
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight">
            {selected?.name ?? "No server"}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-[var(--dur-fast)]",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      }
    >
      <ul className="max-h-80 overflow-y-auto p-1">
        {guilds.map((guild) => {
          const active = selected?.id === guild.id;
          return (
            <li key={guild.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (!active) selectGuild(guild);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px]",
                  active
                    ? "bg-[var(--bg-tint-accent)] text-primary"
                    : "text-foreground hover:bg-[var(--bg-hover)]",
                )}
              >
                <GuildGlyph name={guild.name} iconUrl={guild.iconUrl} />
                <span className="min-w-0 flex-1 truncate">{guild.name}</span>
                {guild.botPresent ? null : (
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    no bot
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <a
        href="/auth/invite"
        data-astro-reload
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground hover:bg-[var(--bg-hover)] hover:text-foreground"
        onClick={() => setOpen(false)}
      >
        <Plus className="size-4" aria-hidden />
        Add to a server
      </a>
    </Popover>
  );
}
