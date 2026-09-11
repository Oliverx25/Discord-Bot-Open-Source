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
          "group flex h-[34px] items-center gap-3 rounded-[var(--radius-sm)] border-l-2 px-2.5 text-[13px]",
          "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
          active
            ? "border-l-[var(--accent)] bg-[var(--bg-tint-accent)] font-semibold text-[var(--text-primary)]"
            : "border-l-transparent font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
        )}
        aria-current={active ? "page" : undefined}
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            active
              ? "text-[var(--text-accent)]"
              : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]",
          )}
          strokeWidth={2}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {soon ? (
          <Badge className="shrink-0" tone="pro" size="sm">
            Soon
          </Badge>
        ) : null}
      </a>
    </li>
  );
}
