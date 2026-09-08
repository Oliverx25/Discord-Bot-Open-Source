/**
 * Configuración standalone (reemplaza plugin_pokemon_config del SaaS).
 */

import {
  normalizePokemonEmbedColor,
  normalizePokemonGeneration,
  normalizePokemonLanguage,
  type PokemonApiLanguage,
  type PokemonConfig,
  type PokemonGeneration,
  defaultPokemonConfig,
} from "../shared/pokemon.js";

export class PokemonError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "PokemonError";
  }
}

export interface PokemonAccessContext {
  memberRoleIds?: string[];
  isAdministrator?: boolean;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
}

/** Config global desde variables de entorno. */
export function getDexConfig(guildId = ""): PokemonConfig {
  const base = defaultPokemonConfig(guildId);
  return {
    ...base,
    isActive: true,
    defaultGeneration: normalizePokemonGeneration(
      process.env.DEFAULT_GENERATION,
      9 as PokemonGeneration,
    ),
    language: normalizePokemonLanguage(
      process.env.LANGUAGE,
      "es" as PokemonApiLanguage,
    ),
    embedColor: normalizePokemonEmbedColor(
      process.env.EMBED_COLOR,
      base.embedColor,
    ),
    forceEphemeral: envBool("FORCE_EPHEMERAL", true),
    allowedChannels: [],
    allowedRoles: [],
  };
}

/** Alias compatible con los handlers migrados. */
export function getPokemonConfig(guildId?: string): PokemonConfig {
  return getDexConfig(guildId ?? "");
}

/**
 * En Dex-Bot el módulo siempre está activo (sin panel SaaS).
 * Conserva la misma firma que el guard del monorepo.
 */
export function assertPokemonCommandAllowed(
  guildId: string,
  _commandName: string,
  _channelId: string | null,
  _access: PokemonAccessContext = {},
): PokemonConfig {
  if (!guildId) {
    throw new PokemonError(
      "Este comando solo funciona en un servidor.",
      400,
      "MISSING_GUILD",
    );
  }
  return getDexConfig(guildId);
}
