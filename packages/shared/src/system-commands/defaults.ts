/** Mapas de etiquetas legibles para la UI (Fase 7, MAINT-01). */

import type {
  SystemCommandCategory,
  SystemCommandParamType,
} from "./contracts.js";

export const SYSTEM_COMMAND_CATEGORY_LABELS: Record<
  SystemCommandCategory,
  string
> = {
  general: "General",
  moderation: "Moderation",
  community: "Community",
  economy: "Economy",
  security: "Security",
  roles: "Roles",
  messages: "Messages",
  welcome: "Welcome",
  support: "Support",
  automation: "Automation",
  integrations: "Integrations",
};

export const SYSTEM_COMMAND_PARAM_TYPE_LABELS: Record<
  SystemCommandParamType,
  string
> = {
  USER: "User",
  STRING: "Text",
  INTEGER: "Number",
  NUMBER: "Number",
  BOOLEAN: "Boolean",
  CHANNEL: "Channel",
  ROLE: "Role",
};
