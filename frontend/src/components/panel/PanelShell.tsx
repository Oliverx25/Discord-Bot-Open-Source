import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizePath, resolveOpenCategoryId } from "@/lib/navPath";
import { PanelGuildSwitcher } from "./PanelGuildSwitcher";
import { PanelSidebar } from "./PanelSidebar";
import { PanelUserMenu } from "./PanelUserMenu";
import { usePanelHost } from "./usePanelHost";
import { usePanelSession } from "./usePanelSession";

/** Chrome del panel. El QueryClient lo monta `PanelShellIsland`. */
export function PanelChrome({ currentPath }: { currentPath: string }) {
  const { me, meQuery, selectedGuild, tier, selectGuild, signOut } =
    usePanelSession();
  const loading = meQuery.isPending || meQuery.isError;
  const guilds = me?.guilds ?? [];
  const emptyGuilds = Boolean(me && guilds.length === 0);
  const missingBot = Boolean(selectedGuild && !selectedGuild.botPresent);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [path, setPath] = useState(() => normalizePath(currentPath));
  const routeCategoryId = useMemo(() => resolveOpenCategoryId(path), [path]);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(() =>
    resolveOpenCategoryId(normalizePath(currentPath)),
  );

  const menuHost = usePanelHost("panel-menu-host");
  const guildHost = usePanelHost("panel-guild-host");
  const userHost = usePanelHost("panel-user-host");
  const bannerHost = usePanelHost("panel-banner-host");
  const emptyHost = usePanelHost("panel-empty-host");

  useEffect(() => {
    setPath(normalizePath(currentPath));
  }, [currentPath]);

  useEffect(() => {
    setOpenCategoryId(routeCategoryId);
  }, [routeCategoryId]);

  useEffect(() => {
    function syncPath(): void {
      const next = normalizePath(window.location.pathname);
      setPath(next);
      setOpenCategoryId(resolveOpenCategoryId(next));
      setDrawerOpen(false);
    }
    document.addEventListener("astro:page-load", syncPath);
    document.addEventListener("astro:after-swap", syncPath);
    return () => {
      document.removeEventListener("astro:page-load", syncPath);
      document.removeEventListener("astro:after-swap", syncPath);
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <>
      <div className="flex h-dvh">
        <PanelSidebar
          currentPath={path}
          openCategoryId={openCategoryId}
          onOpenCategory={setOpenCategoryId}
          onNavigate={() => setDrawerOpen(false)}
          drawerOpen={drawerOpen}
          tier={tier}
        />
      </div>
      {drawerOpen ? (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-[var(--topbar-h)] z-40 bg-[rgba(5,7,5,0.75)] lg:hidden"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}
      {portal(
        menuHost,
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
          aria-expanded={drawerOpen}
          aria-controls="tobot-sidebar"
          onClick={() => setDrawerOpen((value) => !value)}
        >
          {drawerOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>,
      )}
      {portal(
        guildHost,
        <PanelGuildSwitcher
          guilds={guilds}
          selected={selectedGuild}
          loading={loading}
          onSelect={selectGuild}
        />,
      )}
      {portal(
        userHost,
        <PanelUserMenu
          user={me?.user ?? null}
          tier={tier}
          loading={loading}
          onSignOut={signOut}
        />,
      )}
      {portal(
        bannerHost,
        missingBot && selectedGuild ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-[var(--dash-pad)] py-2 text-sm">
            <p className="text-muted-foreground">
              tobot isn't in this server. Add it to use the dashboard.
            </p>
            <a
              href={`/auth/invite?guildId=${encodeURIComponent(selectedGuild.id)}`}
              data-astro-reload
              className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-primary hover:underline"
            >
              Add to the server
            </a>
          </div>
        ) : null,
      )}
      {portal(
        emptyHost,
        emptyGuilds ? (
          <div className="pointer-events-auto flex h-full flex-col items-center justify-center gap-3 bg-background px-6 text-center">
            <h2 className="font-display text-lg font-semibold">No servers</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Add tobot to a server where you can Manage Server. Discord will
              ask for the permissions; then come back and sign in with your
              account.
            </p>
            <a
              href="/auth/invite"
              data-astro-reload
              className="inline-flex h-[38px] items-center justify-center rounded-md border border-primary bg-primary px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-primary-foreground shadow-[var(--shadow-hard)]"
            >
              Add to a server
            </a>
            <Button type="button" variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        ) : null,
      )}
    </>
  );
}

function portal(host: HTMLElement | null, node: ReactNode) {
  if (!host || !node) return null;
  return createPortal(node, host);
}
