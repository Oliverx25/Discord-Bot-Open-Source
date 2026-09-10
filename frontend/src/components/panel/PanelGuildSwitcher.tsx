import { useEffect, useState } from "react";
import type { PanelMeGuild } from "@adobos/shared";
import { ChevronDown, Plus } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
    <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[var(--border-default)] bg-[var(--bg-raised)] font-display text-[10px] font-bold text-[var(--text-secondary)]">
      {iconUrl ? (
        <Avatar className="size-6 rounded-sm bg-transparent">
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

const itemClass =
  "flex w-full cursor-pointer items-center gap-3 rounded-sm px-[9px] py-[7px] text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-foreground";

export function PanelGuildSwitcher({
  guilds,
  selected,
}: {
  guilds: PanelMeGuild[];
  selected: PanelMeGuild | null;
}) {
  const [open, setOpen] = useState(false);
  const joined = guilds.filter((guild) => guild.botPresent);

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
      className="w-72 rounded-md border-[var(--border-default)] bg-[var(--bg-raised)] p-1 shadow-[var(--shadow-2)]"
      trigger={
        <Button
          type="button"
          variant="secondary"
          aria-label="Switch server"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "max-w-[18rem] justify-start px-2.5 font-sans text-sm font-medium normal-case tracking-normal",
            open && "border-primary text-[var(--text-accent)]",
          )}
        >
          {selected ? (
            <GuildGlyph name={selected.name} iconUrl={selected.iconUrl} />
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-[var(--border-default)] bg-[var(--bg-raised)] font-display text-[10px] font-bold text-[var(--text-muted)]">
              —
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">
            {selected?.name ?? "No server"}
          </span>
          <ChevronDown
            className={cn(
              "size-[13px] shrink-0 text-[var(--text-muted)] transition-transform duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      }
    >
      <ul className="max-h-80 overflow-y-auto" role="listbox">
        {joined.map((guild) => {
          const active = selected?.id === guild.id;
          return (
            <li key={guild.id}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  if (!active) selectGuild(guild);
                  else setOpen(false);
                }}
                className={cn(
                  itemClass,
                  active &&
                    "bg-[var(--bg-tint-accent)] text-primary hover:bg-[var(--bg-tint-accent)] hover:text-primary",
                )}
              >
                <GuildGlyph name={guild.name} iconUrl={guild.iconUrl} />
                <span className="min-w-0 flex-1 truncate">{guild.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="my-1 h-px bg-[var(--border-subtle)]" />
      <a
        href="/auth/invite"
        data-astro-reload
        className={itemClass}
        onClick={() => setOpen(false)}
      >
        <Plus className="size-4 text-[var(--text-muted)]" aria-hidden />
        Add to a server
      </a>
    </Popover>
  );
}
