import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  applyTheme,
  getStoredTheme,
  setThemePreference,
  type ThemePreference,
} from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS: {
  id: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("dark");
  const activeIndex = OPTIONS.findIndex((option) => option.id === preference);

  useEffect(() => {
    const stored = getStoredTheme();
    setPreference(stored);
    applyTheme(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange(): void {
      if (getStoredTheme() === "system") applyTheme("system");
    }
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  function onSelect(next: ThemePreference): void {
    setPreference(next);
    setThemePreference(next);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Appearance
        </span>
        <span className="font-mono text-[10px] text-[var(--text-muted)]">
          {OPTIONS[activeIndex]?.label}
        </span>
      </div>
      <fieldset className="relative isolate grid grid-cols-3 w-full min-w-0 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-0.5">
        <legend className="sr-only">Interface theme</legend>
        <span
          className="pointer-events-none absolute inset-y-0.5 left-0.5 z-0 rounded-[var(--radius-xs)] border border-[var(--border-strong)] bg-[var(--bg-raised)] shadow-[var(--shadow-hard-neutral-hover)] transition-[transform,background-color,border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-snap)] motion-reduce:transition-none"
          style={{
            width: "calc((100% - 0.25rem) / 3)",
            transform: `translateX(${activeIndex * 100}%)`,
          }}
          aria-hidden
        />
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = preference === option.id;
          return (
            <Button
              key={option.id}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "relative z-10 h-7 min-w-0 rounded-[var(--radius-xs)] px-1.5 font-sans text-[11px] font-medium normal-case tracking-normal transition-[color,background-color] duration-[var(--dur-fast)]",
                active
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
              aria-label={option.label}
              aria-pressed={active}
              title={option.label}
              onClick={() => onSelect(option.id)}
            >
              <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
            </Button>
          );
        })}
      </fieldset>
    </div>
  );
}
