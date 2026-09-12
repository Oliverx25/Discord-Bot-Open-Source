/** Tipos e interfaces del catálogo de slash commands nativos (Fase 7, MAINT-01). */

export type SystemCommandCategory =
  | "general"
  | "moderation"
  | "community"
  | "economy"
  | "security"
  | "roles"
  | "messages"
  | "welcome"
  | "support"
  | "automation"
  | "integrations";

/** Tipo Discord de un parámetro slash. */
export type SystemCommandParamType =
  | "USER"
  | "STRING"
  | "INTEGER"
  | "NUMBER"
  | "BOOLEAN"
  | "CHANNEL"
  | "ROLE";

/** Códigos ApplicationCommandOptionType de Discord. */
export const DISCORD_OPTION_TYPE: Record<SystemCommandParamType, number> = {
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  NUMBER: 10,
};

export interface SystemCommandOption {
  name: string;
  type: SystemCommandParamType;
  required: boolean;
  description?: string;
  minValue?: number;
  maxValue?: number;
  /** Discord: habilita sugerencias al escribir (STRING / INTEGER / NUMBER). */
  autocomplete?: boolean;
  /** Opciones fijas (STRING / INTEGER / NUMBER). Máx. 25. */
  choices?: Array<{ name: string; value: string | number }>;
}

export interface SystemCommandDefinition {
  name: string;
  description: string;
  category: SystemCommandCategory;
  /** Valor por defecto de `enabled` si no hay fila en DB. */
  defaultEnabled: boolean;
  /** Opciones slash (Discord + documentación del Sheet). */
  options: SystemCommandOption[];
  /** Si true, la UI muestra el toggle de respuesta efímera. */
  supportsEphemeral: boolean;
  /** Valor por defecto del flag ephemeral. */
  defaultEphemeral: boolean;
  /**
   * Si no hay roles configurados, exige permiso de moderación / admin de Discord.
   */
  requiresAdminByDefault: boolean;
}

/** @deprecated Alias de `options` para UI legacy. */
export type SystemCommandParameter = SystemCommandOption;

export interface SystemCommandPermission {
  guildId: string;
  commandName: string;
  enabled: boolean;
  allowedRoles: string[];
  ignoredChannels: string[];
  ephemeral: boolean;
}

/** Vista unificada catálogo + permisos guardados (dashboard). */
export interface SystemCommandConfig extends SystemCommandDefinition {
  enabled: boolean;
  allowedRoles: string[];
  ignoredChannels: string[];
  ephemeral: boolean;
  /** Alias de `options` para el Sheet/tabla de parámetros. */
  parameters: SystemCommandOption[];
}

export interface SystemCommandsListResponse {
  commands: SystemCommandConfig[];
}

export type UpdateSystemCommandsRequest = {
  commands: Array<{
    commandName: string;
    enabled: boolean;
    allowedRoles: string[];
    ignoredChannels: string[];
    ephemeral: boolean;
  }>;
};

export interface SystemCommandsUpdateResponse {
  commands: SystemCommandConfig[];
}

/**
 * Preset de visibilidad nativa en Discord (autocompletado).
 * `public` → null (todos). El backend mapea a PermissionFlagsBits.
 */
export type SystemCommandDiscordPermPreset =
  | "public"
  | "moderation"
  | "manage_guild"
  | "administrator";
