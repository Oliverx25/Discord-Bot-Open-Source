import type { ChannelSummary } from "./guildReads.js";

/** Un permission overwrite de canal. `allow`/`deny` son bitfields como string. */
export interface ChannelOverwrite {
  id: string;
  /** 0 = rol, 1 = miembro. */
  type: number;
  allow: string;
  deny: string;
}

/** Alta de un canal de guild (tickets). */
export interface CreateChannelInput {
  name: string;
  /** `ChannelType` numérico. */
  type: number;
  parentId?: string | null;
  topic?: string;
  permissionOverwrites?: {
    id: string;
    type: number;
    allow?: string;
    deny?: string;
  }[];
  reason?: string;
}

/** Gestión de canales: alta/baja, overwrites de permisos (anti-raid lockdown, tickets). */
export interface ChannelsGateway {
  /** Borra un canal del guild. No-op si ya no existe. */
  deleteChannel(
    guildId: string,
    channelId: string,
    reason?: string,
  ): Promise<void>;
  /** ID del usuario del bot. */
  getBotUserId(): Promise<string>;
  createChannel(
    guildId: string,
    input: CreateChannelInput,
  ): Promise<ChannelSummary>;
  /** Overwrites de un canal del guild. `null` si el canal no existe / no es del guild. */
  getChannelOverwrites(
    guildId: string,
    channelId: string,
  ): Promise<ChannelOverwrite[] | null>;
  /** PUT absoluto de un overwrite (rol o miembro) — reemplaza allow/deny. */
  putChannelOverwrite(
    channelId: string,
    overwriteId: string,
    input: { type: number; allow: string; deny: string; reason?: string },
  ): Promise<void>;
  /** Quita un overwrite del canal. No-op si no existía. */
  deleteChannelOverwrite(
    channelId: string,
    overwriteId: string,
    reason?: string,
  ): Promise<void>;
  /** Reemplaza **todos** los overwrites del canal. */
  setChannelOverwrites(
    channelId: string,
    overwrites: ChannelOverwrite[],
    reason?: string,
  ): Promise<void>;
}
