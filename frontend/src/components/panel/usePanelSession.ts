import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { PanelMeGuild, PlanTier } from "@adobos/shared";
import { fetchEntitlements } from "@/lib/api/entitlements";
import { fetchMe, logout } from "@/lib/api/me";
import { queryKeys } from "@/lib/query/keys";
import {
  clearSelectedGuildId,
  getSelectedGuildId,
  setSelectedGuildId,
} from "@/stores/guild";

export function usePanelSession() {
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    retry: false,
  });

  const me = meQuery.data ?? null;
  const selectedId = me
    ? (getSelectedGuildId() ?? me.guilds[0]?.id ?? "")
    : "";
  const selectedGuild =
    me?.guilds.find((guild) => guild.id === selectedId) ?? me?.guilds[0] ?? null;

  const entitlementsQuery = useQuery({
    queryKey: queryKeys.entitlements(selectedGuild?.id ?? null),
    queryFn: fetchEntitlements,
    enabled: Boolean(me && selectedGuild),
    retry: false,
  });

  const tier: PlanTier = entitlementsQuery.data?.tier ?? "free";

  useEffect(() => {
    if (meQuery.isError) {
      window.location.assign("/");
    }
  }, [meQuery.isError]);

  useEffect(() => {
    if (selectedId && getSelectedGuildId() !== selectedId) {
      setSelectedGuildId(selectedId);
    }
  }, [selectedId]);

  function selectGuild(guild: PanelMeGuild): void {
    setSelectedGuildId(guild.id);
    window.location.reload();
  }

  function signOut(): void {
    void logout().finally(() => {
      clearSelectedGuildId();
      window.location.assign("/");
    });
  }

  return {
    me,
    meQuery,
    selectedGuild,
    selectedId,
    tier,
    selectGuild,
    signOut,
  };
}
