import type { PanelMeUser } from "@adobos/shared";
import {
  Book,
  CircleHelp,
  LayoutGrid,
  Menu,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS: Array<[string, string, LucideIcon]> = [
  ["Modules", "#modules", LayoutGrid],
  ["Pricing", "#pricing", Tag],
  ["FAQ", "#faq", CircleHelp],
  ["Docs", "https://docs.tobot.io", Book],
];

export function Wordmark({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      tobot<span className="text-primary">.</span>
    </span>
  );
}

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14 14 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13 13 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10 10 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03M8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419s.956-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419s.956-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418"
      />
    </svg>
  );
}

function DiscordLoginButton({ compact }: { compact?: boolean }) {
  return (
    <a
      href="/auth/discord"
      data-astro-reload
      aria-label={compact ? "Login with Discord" : undefined}
      className={cn(
        "landing-discord-btn inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-tight",
        compact ? "size-[38px] p-0" : "h-[38px] px-[18px]",
      )}
    >
      <DiscordMark className="size-4 shrink-0" />
      {compact ? null : "Login with Discord"}
    </a>
  );
}

function AuthSlot({ user }: { user: PanelMeUser | null }) {
  return (
    <>
      <div className="landing-auth-guest">
        <div className="hidden md:block">
          <DiscordLoginButton />
        </div>
        <div className="md:hidden">
          <DiscordLoginButton compact />
        </div>
      </div>
      <a
        href="/dashboard"
        data-astro-reload
        className="landing-auth-user items-center gap-2"
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            width={38}
            height={38}
            className="hidden size-[38px] shrink-0 rounded-md object-cover md:block"
          />
        ) : null}
        <span className={buttonVariants({ size: "default" })}>
          Open dashboard
        </span>
      </a>
    </>
  );
}

export function LandingHeader({ user }: { user: PanelMeUser | null }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const filled = scrolled || menuOpen;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolled(!(entry?.isIntersecting ?? true));
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const close = () => setMenuOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  return (
    <>
      {/* Se llena al salir de una altura de barra (~64px). */}
      <div
        ref={sentinelRef}
        className="pointer-events-none absolute inset-x-0 top-0 h-16"
        aria-hidden
      />
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-[var(--dur-slow)] ease-[cubic-bezier(0.32,0.72,0,1)]",
          filled ? "landing-nav-filled" : "landing-nav-clear",
        )}
      >
        <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="relative flex h-14 items-center justify-between sm:h-16">
            <nav aria-label="Page sections" className="z-10 hidden md:block">
              <ul className="flex items-center gap-1">
                {NAV_LINKS.map(([label, href, Icon]) => (
                  <li key={label}>
                    <a
                      href={href}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-[var(--dur-fast)] hover:text-foreground"
                    >
                      <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              className="z-10 inline-flex size-9 items-center justify-center rounded-full text-foreground md:hidden"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X className="size-4" aria-hidden />
              ) : (
                <Menu className="size-4" aria-hidden />
              )}
            </button>

            <a
              href="/"
              aria-label="tobot. home"
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            >
              <Wordmark className="text-[1.35rem] sm:text-2xl" />
            </a>

            <div className="z-10 flex items-center justify-end">
              <AuthSlot user={user} />
            </div>
          </div>

          <div
            id={menuId}
            className={cn(
              "grid transition-[grid-template-rows] duration-[var(--dur-slow)] ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden",
              menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <nav
              className="overflow-hidden"
              aria-label="Page sections"
              aria-hidden={!menuOpen}
            >
              <ul className="flex flex-col gap-1 pb-3 pt-1">
                {NAV_LINKS.map(([label, href, Icon]) => (
                  <li key={label}>
                    <a
                      href={href}
                      tabIndex={menuOpen ? 0 : -1}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-foreground"
                    >
                      <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
