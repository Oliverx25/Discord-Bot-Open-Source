/** Funciones de consulta/derivación sobre el catálogo (Fase 7, MAINT-01). */

import { SYSTEM_COMMAND_CATALOG } from "./catalog.js";
import type {
  SystemCommandDefinition,
  SystemCommandDiscordPermPreset,
  SystemCommandPermission,
} from "./contracts.js";
import { DISCORD_OPTION_TYPE } from "./contracts.js";

/** Discord-style syntax: `/ban <user> [reason]`. */
export function formatSystemCommandSyntax(
  def: Pick<SystemCommandDefinition, "name" | "options">,
): string {
  const parts = def.options.map((p) =>
    p.required ? `<${p.name}>` : `[${p.name}]`,
  );
  return parts.length > 0 ? `/${def.name} ${parts.join(" ")}` : `/${def.name}`;
}

export function getSystemCommandDefinition(
  name: string,
): SystemCommandDefinition | undefined {
  return SYSTEM_COMMAND_CATALOG.find((c) => c.name === name);
}

export function listSystemCommandNames(): string[] {
  return SYSTEM_COMMAND_CATALOG.map((c) => c.name);
}

export function defaultSystemCommandPermission(
  guildId: string,
  def: SystemCommandDefinition,
): SystemCommandPermission {
  return {
    guildId,
    commandName: def.name,
    enabled: def.defaultEnabled,
    allowedRoles: [],
    ignoredChannels: [],
    ephemeral: def.defaultEphemeral,
  };
}

/** Cuerpo mínimo REST de un slash (sin token). */
export function toDiscordSlashCommandBody(def: SystemCommandDefinition): {
  name: string;
  description: string;
  options?: Array<{
    type: number;
    name: string;
    description: string;
    required?: boolean;
    autocomplete?: boolean;
    min_value?: number;
    max_value?: number;
    choices?: Array<{ name: string; value: string | number }>;
  }>;
  /** Discord bitfield string, o `null` = visible para todos. */
  default_member_permissions?: string | null;
} {
  const options = def.options.map((o) => ({
    type: DISCORD_OPTION_TYPE[o.type],
    name: o.name,
    description: (o.description ?? o.name).slice(0, 100),
    required: o.required,
    ...(o.autocomplete ? { autocomplete: true } : {}),
    ...(o.minValue !== undefined ? { min_value: o.minValue } : {}),
    ...(o.maxValue !== undefined ? { max_value: o.maxValue } : {}),
    ...(o.choices?.length
      ? {
          choices: o.choices.slice(0, 25).map((c) => ({
            name: c.name.slice(0, 100),
            value: c.value,
          })),
        }
      : {}),
  }));
  return {
    name: def.name,
    description: def.description.slice(0, 100),
    ...(options.length ? { options } : {}),
  };
}

export function resolveDiscordPermPreset(
  def: SystemCommandDefinition,
): SystemCommandDiscordPermPreset {
  if (!def.requiresAdminByDefault) return "public";
  if (
    def.name === "givexp" ||
    def.name === "removexp" ||
    def.name === "setlevel"
  ) {
    return "administrator";
  }
  if (def.category === "moderation") return "moderation";
  return "manage_guild";
}
