import { useQuery } from "@tanstack/react-query";
import { useStore } from "@nanostores/react";
import type { FeatureKey, GuildEntitlements, LimitKey } from "@adobos/shared";
import { isUnlimited, TIER_CATALOG, tierHasFeature } from "@adobos/shared";
import { fetchEntitlements } from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";
import { $guildId } from "@/stores/guild";

export function useEntitlements(): {
  entitlements: GuildEntitlements | null;
  loading: boolean;
  can: (feature: FeatureKey) => boolean;
  limitOf: (key: LimitKey) => number;
  isUnlimited: (key: LimitKey) => boolean;
} {
  const guildId = useStore($guildId);
  const query = useQuery({
    queryKey: queryKeys.entitlements(guildId),
    queryFn: fetchEntitlements,
    enabled: Boolean(guildId),
    retry: false,
  });

  const entitlements = query.data ?? null;
  const tier = entitlements?.tier ?? "free";
  return {
    entitlements,
    loading: query.isLoading,
    can: (feature) =>
      entitlements
        ? entitlements.features.includes(feature)
        : tierHasFeature(tier, feature),
    limitOf: (key) =>
      entitlements?.limits[key] ?? TIER_CATALOG.free.limits[key],
    isUnlimited: (key) =>
      entitlements ? isUnlimited(entitlements.limits[key]) : false,
  };
}
