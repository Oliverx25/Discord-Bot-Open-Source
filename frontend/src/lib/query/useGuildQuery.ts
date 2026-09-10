import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useStore } from "@nanostores/react";
import { $guildId } from "@/stores/guild";

type GuildQueryOptions<T> = Omit<
  UseQueryOptions<T, Error>,
  "queryKey" | "queryFn"
>;

/** Query keyed por guild seleccionado; no dispara sin `guildId`. */
export function useGuildQuery<T>(
  key: (guildId: string | null) => readonly unknown[],
  queryFn: () => Promise<T>,
  options?: GuildQueryOptions<T>,
) {
  const guildId = useStore($guildId);
  const query = useQuery({
    queryKey: key(guildId),
    queryFn,
    enabled: Boolean(guildId) && (options?.enabled ?? true),
    ...options,
  });
  return { ...query, guildId };
}
