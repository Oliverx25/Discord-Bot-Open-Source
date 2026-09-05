import { Routes } from "discord.js";
import type { Constructor, RestClientCore } from "./core.js";

/** Escrituras/lecturas REST genéricas de guild que no dependen de un adaptador. */
export function GuildReadsMixin<TBase extends Constructor<RestClientCore>>(
  Base: TBase,
) {
  return class extends Base {
    async getBotGuildIds(): Promise<string[]> {
      const ids: string[] = [];
      let after: string | undefined;
      for (let page = 0; page < 100; page++) {
        const query = new URLSearchParams({ limit: "200" });
        if (after) query.set("after", after);
        const batch = (await this.restClient().get(Routes.userGuilds(), {
          query,
        })) as { id: string }[];
        for (const guild of batch) ids.push(guild.id);
        if (batch.length < 200) break;
        after = batch[batch.length - 1]!.id;
      }
      return ids;
    }

    async listActiveThreads(
      guildId: string,
    ): Promise<{ id: string; parentId: string | null; type: number }[]> {
      const res = (await this.restClient().get(
        Routes.guildActiveThreads(guildId),
      )) as {
        threads: { id: string; parent_id?: string | null; type: number }[];
      };
      return (res.threads ?? []).map((t) => ({
        id: t.id,
        parentId: t.parent_id ?? null,
        type: t.type,
      }));
    }
  };
}
