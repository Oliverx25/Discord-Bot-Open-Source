import type { PlanTier } from "@adobos/shared";
import { NavLinks } from "@/components/nav/NavLinks";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";
import { PanelPlanCard } from "./PanelPlanCard";

function Wordmark() {
  return (
    <span className="font-display text-xl font-extrabold tracking-tight">
      tobot<span className="text-primary">.</span>
    </span>
  );
}

export function PanelSidebar({
  currentPath,
  openCategoryId,
  onOpenCategory,
  onNavigate,
  drawerOpen,
  tier,
}: {
  currentPath: string;
  openCategoryId: string | null;
  onOpenCategory: (id: string | null) => void;
  onNavigate?: () => void;
  drawerOpen: boolean;
  tier: PlanTier;
}) {
  return (
    <aside
      id="tobot-sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-dvh w-[var(--sidebar-w)] flex-col",
        "max-lg:top-[var(--topbar-h)] max-lg:h-[calc(100dvh-var(--topbar-h))]",
        "bg-background",
        "transition-transform duration-[var(--dur-slow)] ease-[var(--ease-standard)]",
        "lg:sticky lg:top-0 lg:translate-x-0",
        drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="flex h-[var(--topbar-h)] shrink-0 items-center px-3.5">
        <a href="/dashboard" className="min-w-0" aria-label="tobot. dashboard">
          <Wordmark />
        </a>
      </div>

      <NavLinks
        currentPath={currentPath}
        openCategoryId={openCategoryId}
        onOpenCategory={onOpenCategory}
        onNavigate={onNavigate}
      />

      <div className="flex shrink-0 flex-col gap-3 p-3">
        <PanelPlanCard tier={tier} />
        <ThemeToggle />
      </div>
    </aside>
  );
}
