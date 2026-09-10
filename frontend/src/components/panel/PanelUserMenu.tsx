import { useState } from "react";
import { PLAN_TIER_LABEL, type PanelMeUser, type PlanTier } from "@adobos/shared";
import { ChevronDown } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  initialsFromName,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const itemClass =
  "flex w-full items-center rounded-sm px-[9px] py-[7px] text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-foreground";

export function PanelUserMenu({
  user,
  tier,
  loading,
  onSignOut,
}: {
  user: PanelMeUser | null;
  tier: PlanTier;
  loading: boolean;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const label = user?.globalName || user?.username || "Account";
  const paid = tier !== "free";

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      portalled
      align="end"
      contentWidth={200}
      className="w-[200px] rounded-md border border-[var(--border-default)] bg-[var(--bg-raised)] p-1 text-[var(--text-secondary)] shadow-[var(--shadow-2)]"
      trigger={
        <button
          type="button"
          disabled={loading}
          aria-label="Account menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-md bg-transparent p-0.5 text-left outline-none hover:bg-[var(--bg-hover)] focus-visible:shadow-[var(--ring-focus)] disabled:opacity-40"
        >
          <Avatar className="size-[38px] rounded-md border-0 bg-[var(--bg-raised)]">
            {user?.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt="" className="rounded-md" />
            ) : null}
            <AvatarFallback className="rounded-md bg-[var(--bg-raised)] font-display text-xs font-bold text-[var(--text-secondary)]">
              {user ? initialsFromName(label) : "—"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col items-start gap-0.5 sm:flex">
            <span className="max-w-[9rem] truncate text-[13px] font-semibold leading-tight tracking-tight">
              {loading ? "…" : (user?.username ?? "")}
            </span>
            <Badge
              className={cn(
                "h-[18px] px-1.5 text-[10px] tracking-[0.14em]",
                paid
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-[var(--border-strong)] bg-[var(--bg-hover)] text-[var(--text-secondary)]",
              )}
            >
              {PLAN_TIER_LABEL[tier]}
            </Badge>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-[var(--text-muted)] transition-transform duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      }
    >
      <div className="flex flex-col" role="menu">
        <a
          href="/dashboard/general/billing"
          role="menuitem"
          className={itemClass}
          onClick={() => setOpen(false)}
        >
          Billing
        </a>
        <div className="my-1 h-px bg-[var(--border-subtle)]" />
        <button
          type="button"
          role="menuitem"
          className={cn(
            itemClass,
            "text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]",
          )}
          onClick={() => {
            setOpen(false);
            onSignOut();
          }}
        >
          Sign out
        </button>
      </div>
    </Popover>
  );
}
