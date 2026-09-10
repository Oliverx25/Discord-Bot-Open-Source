import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useStore } from "@nanostores/react";
import { type ReactNode, useMemo, useState } from "react";
import { $guildId } from "@/stores/guild";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function DashboardProviders({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  const guildId = useStore($guildId);

  const persist = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSyncStoragePersister({
      storage: window.sessionStorage,
      key: `tobot-query:${guildId ?? "none"}`,
    });
  }, [guildId]);

  if (!persist) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister: persist, maxAge: 1000 * 60 * 60 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
