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
    <fieldset
      className="m-0 inline-flex w-full min-w-0 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-0.5"
    >
      <legend className="sr-only">Interface theme</legend>
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
              "h-7 flex-1 gap-1 px-1.5 font-sans text-[11px] font-medium normal-case tracking-normal",
              active
                ? "bg-[var(--bg-raised)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
            aria-label={option.label}
            aria-pressed={active}
            onClick={() => onSelect(option.id)}
          >
            <Icon className="size-3.5" aria-hidden />
          </Button>
        );
      })}
    </fieldset>
  );
}
