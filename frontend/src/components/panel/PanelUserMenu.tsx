import { useState } from "react";
import { PLAN_TIER_LABEL, type PanelMeUser, type PlanTier } from "@adobos/shared";
import { ChevronDown } from "lucide-react";
import { initialsFromName } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { logout } from "@/lib/api/me";
import { cn } from "@/lib/utils";
import { clearSelectedGuildId } from "@/stores/guild";

const itemClass =
  "flex w-full items-center rounded-sm px-[9px] py-[7px] text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-foreground";

const menuClass =
  "w-[200px] rounded-md border border-[var(--border-default)] bg-[var(--bg-raised)] p-1 text-[var(--text-secondary)] shadow-[var(--shadow-2)]";

function AccountMenuItems({ onClose }: { onClose: () => void }) {
  function signOut(): void {
    onClose();
    void logout().finally(() => {
      clearSelectedGuildId();
      window.location.assign("/");
    });
  }

  return (
    <div className="flex flex-col" role="menu">
      <a
        href="/dashboard/general/billing"
        role="menuitem"
        className={itemClass}
        onClick={onClose}
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
  );
}

function UserAvatarPhysical({
  user,
  as = "button",
  ...props
}: {
  user: PanelMeUser | null;
  as?: "button" | "span";
} & Omit<ButtonProps, "variant" | "size" | "plate" | "children">) {
  const url = user?.avatarUrl ?? null;
  const label = user?.globalName || user?.username || "Account";

  return (
    <Button
      as={as}
      size="icon"
      variant="secondary"
      className="border-0 p-0 hover:border-0"
      plate={
        url ? (
          <img
            src={url}
            alt=""
            className="size-full origin-center scale-150 object-cover blur-[12px]"
          />
        ) : undefined
      }
      {...props}
    >
      {url ? (
        <>
          <img
            src={url}
            alt=""
            className="absolute inset-0 size-full scale-125 object-cover blur-md"
            aria-hidden
          />
          <img
            src={url}
            alt=""
            width={38}
            height={38}
            className="relative size-full object-cover"
          />
        </>
      ) : (
        <span className="font-display text-xs font-bold text-[var(--text-secondary)]">
          {user ? initialsFromName(label) : "—"}
        </span>
      )}
    </Button>
  );
}

export function PanelUserMenu({
  user,
  tier,
}: {
  user: PanelMeUser | null;
  tier: PlanTier;
}) {
  const [open, setOpen] = useState(false);
  const paid = tier !== "free";
  const url = user?.avatarUrl ?? null;
  const label = user?.globalName || user?.username || "Account";

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      portalled
      align="end"
      contentWidth={200}
      className={menuClass}
      trigger={
        <Button
          type="button"
          variant="secondary"
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "h-[38px] justify-start gap-0 p-0 pr-2.5 font-sans font-medium normal-case tracking-normal",
            open && "border-primary text-[var(--text-accent)]",
          )}
        >
          {url ? (
            <img
              src={url}
              alt=""
              width={38}
              height={38}
              className="size-[38px] shrink-0 object-cover"
            />
          ) : (
            <span className="flex size-[38px] shrink-0 items-center justify-center bg-[var(--bg-raised)] font-display text-xs font-bold text-[var(--text-secondary)]">
              {user ? initialsFromName(label) : "—"}
            </span>
          )}
          <span className="hidden min-w-0 flex-1 items-center gap-2 px-2.5 sm:flex">
            <span className="max-w-[9rem] truncate text-[13px] font-semibold leading-none tracking-tight">
              {user?.username ?? ""}
            </span>
            <Badge tone={paid ? "pro" : "free"}>{PLAN_TIER_LABEL[tier]}</Badge>
          </span>
          <ChevronDown
            className={cn(
              "mr-0.5 size-[13px] shrink-0 text-[var(--text-muted)] transition-transform duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      }
    >
      <AccountMenuItems onClose={() => setOpen(false)} />
    </Popover>
  );
}

/** Avatar físico de la landing: solo la foto, abre el menú de cuenta. */
export function LandingAvatarMenu({ user }: { user: PanelMeUser }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      portalled
      align="end"
      contentWidth={200}
      className={menuClass}
      trigger={
        <UserAvatarPhysical
          user={user}
          aria-label="Account menu"
          aria-expanded={open}
        />
      }
    >
      <AccountMenuItems onClose={() => setOpen(false)} />
    </Popover>
  );
}
