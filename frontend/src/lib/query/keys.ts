export const queryKeys = {
  me: ["me"] as const,
  health: ["health"] as const,
  entitlements: (guildId: string | null) =>
    ["entitlements", guildId] as const,
  guildAssets: (guildId: string | null) =>
    ["guild-assets", guildId] as const,
  autoMod: (guildId: string | null) => ["auto-mod", guildId] as const,
  billing: (guildId: string | null) => ["billing", guildId] as const,
  actionLogs: (guildId: string | null) =>
    ["action-logs", guildId] as const,
  actionLogsHistory: (
    guildId: string | null,
    filters: Record<string, unknown>,
  ) => ["action-logs-history", guildId, filters] as const,
  tickets: (guildId: string | null) => ["tickets", guildId] as const,
  ticketsInbox: (
    guildId: string | null,
    filters: Record<string, unknown>,
  ) => ["tickets-inbox", guildId, filters] as const,
  giveaways: (guildId: string | null) => ["giveaways", guildId] as const,
  levels: (guildId: string | null) => ["levels", guildId] as const,
  economy: (guildId: string | null) => ["economy", guildId] as const,
  economyIncome: (guildId: string | null) =>
    ["economy-income", guildId] as const,
  economyCasino: (guildId: string | null) =>
    ["economy-casino", guildId] as const,
  economyShop: (guildId: string | null) =>
    ["economy-shop", guildId] as const,
  roles: (guildId: string | null) => ["roles", guildId] as const,
  reminders: (guildId: string | null) => ["reminders", guildId] as const,
  starboard: (guildId: string | null) => ["starboard", guildId] as const,
  antiRaid: (guildId: string | null) => ["anti-raid", guildId] as const,
  autoDelete: (guildId: string | null) =>
    ["auto-delete", guildId] as const,
  autoReplies: (guildId: string | null) =>
    ["auto-replies", guildId] as const,
  forms: (guildId: string | null) => ["forms", guildId] as const,
  scheduled: (guildId: string | null) => ["scheduled", guildId] as const,
  customCommands: (guildId: string | null) =>
    ["custom-commands", guildId] as const,
  systemCommands: (guildId: string | null) =>
    ["system-commands", guildId] as const,
  voiceRooms: (guildId: string | null) =>
    ["voice-rooms", guildId] as const,
  streamAlerts: (guildId: string | null) =>
    ["stream-alerts", guildId] as const,
  welcome: (kind: string, guildId: string | null) =>
    ["welcome", kind, guildId] as const,
  canvasEvent: (kind: string, guildId: string | null) =>
    ["canvas-event", kind, guildId] as const,
  botProfile: (guildId: string | null) =>
    ["bot-profile", guildId] as const,
  autoroles: (guildId: string | null) => ["autoroles", guildId] as const,
  auditLog: (guildId: string | null) => ["audit-log", guildId] as const,
};
