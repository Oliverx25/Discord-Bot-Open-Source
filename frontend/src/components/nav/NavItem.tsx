import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface NavItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  soon?: boolean;
  onNavigate?: () => void;
}

export function NavItem({
  label,
  href,
  icon: Icon,
  active,
  soon,
  onNavigate,
}: NavItemProps) {
  return (
    <li>
      <a
        href={href}
        onClick={onNavigate}
        className={cn(
          "group relative flex h-[34px] items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium",
          "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
          "focus-visible:outline-none",
          active
            ? "bg-[var(--bg-tint-accent)] text-primary shadow-[inset_0_0_0_1px_rgba(198,255,61,0.30)]"
            : "text-muted-foreground hover:bg-[var(--bg-hover)] hover:text-foreground",
        )}
        aria-current={active ? "page" : undefined}
      >
        {active ? (
          <span
            className="absolute inset-y-1 left-0 w-0.5 bg-primary"
            aria-hidden
          />
        ) : null}
        <Icon
          className={cn(
            "size-4 shrink-0",
            active
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground",
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {soon ? (
          <Badge className="border-primary/30 bg-[var(--bg-tint-accent)] text-primary">
            Soon
          </Badge>
        ) : null}
      </a>
    </li>
  );
}
