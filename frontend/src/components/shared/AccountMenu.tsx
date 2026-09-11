import { useState, type ReactNode } from "react";
import type { PanelMeUser } from "@adobos/shared";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { initialsFromName } from "@/components/ui/avatar";
import { logout } from "@/lib/api/me";
import { cn } from "@/lib/utils";
import { clearSelectedGuildId } from "@/stores/guild";

const itemClass =
  "flex w-full items-center rounded-sm px-[9px] py-[7px] text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-foreground";

export function AccountMenu({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children?: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  function close(): void {
    setOpen(false);
  }

  function signOut(): void {
    close();
    void logout().finally(() => {
      clearSelectedGuildId();
      window.location.assign("/");
    });
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      portalled
      align="end"
      contentWidth={200}
      className="w-[200px] rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-raised)] p-1 text-[var(--text-secondary)] shadow-[var(--shadow-2)]"
      trigger={trigger}
    >
      <div className="flex flex-col" role="menu">
        {children?.(close)}
        <a
          href="/dashboard/billing"
          role="menuitem"
          className={itemClass}
          onClick={close}
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
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
    </Popover>
  );
}

/** Avatar físico de la landing: la foto es el botón, sin nombre. */
export function LandingAvatarMenu({ user }: { user: PanelMeUser }) {
  const label = user.globalName || user.username || "Account";

  return (
    <AccountMenu
      trigger={
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="overflow-hidden"
          aria-label="Account menu"
          aria-haspopup="menu"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              width={38}
              height={38}
              className="size-full object-cover"
            />
          ) : (
            <span className="font-display text-xs font-bold normal-case tracking-normal">
              {initialsFromName(label)}
            </span>
          )}
        </Button>
      }
    >
      {(close) => (
        <a
          href="/dashboard"
          role="menuitem"
          className={itemClass}
          onClick={close}
        >
          Dashboard
        </a>
      )}
    </AccountMenu>
  );
}
