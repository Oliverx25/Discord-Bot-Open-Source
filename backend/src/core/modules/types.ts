import type { FeatureKey, ModuleId } from "@adobos/shared";
import type {
  APIApplicationCommandOption,
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import type { RequestHandler, Router } from "express";
import type { BotGateway } from "../discord/botGateway.js";

/** Definición mínima de un slash command registrado por un módulo. */
export interface ChatInputCommandDefinition {
  name: string;
  description: string;
  /** Opciones Discord para el sync REST (usuario, duración, etc.). */
  options?: APIApplicationCommandOption[];
  handle: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

/** Handler para slash que no están en el registry (comandos custom por guild). */
export type FallbackChatHandler = (
  interaction: ChatInputCommandInteraction,
) => Promise<boolean>;

export type ButtonHandler = (interaction: ButtonInteraction) => Promise<void>;

export type SelectHandler = (
  interaction: StringSelectMenuInteraction,
) => Promise<void>;

export type ModalHandler = (
  interaction: ModalSubmitInteraction,
) => Promise<void>;

export type AutocompleteHandler = (
  interaction: AutocompleteInteraction,
) => Promise<void>;

export type RawRouteMethod = "get" | "post" | "put" | "patch" | "delete";

/** Ruta con body crudo (webhooks). Se monta antes de express.json(). */
export interface RawRoute {
  method: RawRouteMethod;
  path: string;
  handler: RequestHandler;
}

/**
 * Contexto que el kernel inyecta a cada módulo en `register`.
 * Los módulos solo hablan con el core a través de esta API.
 */
export interface ModuleContext {
  /**
   * Client vivo de discord.js. `null` en el rol `api` (sin gateway): solo se
   * usa desde `registerGateway` / `registerJobs`, que no corren en `api`.
   */
  client: Client | null;
  /**
   * Puerto HTTP → Discord. Las rutas del panel deben usar esto en vez de
   * `client` directo, para que el rol `api` pueda servir sin gateway vivo.
   * En `all` / `gateway` es un `LocalClientGateway` sobre `client`; en `api`
   * un `RestGateway`.
   */
  botGateway: BotGateway;
  on: <K extends keyof ClientEvents>(
    event: K,
    handler: (...args: ClientEvents[K]) => void,
  ) => void;
  once: <K extends keyof ClientEvents>(
    event: K,
    handler: (...args: ClientEvents[K]) => void,
  ) => void;
  route: (
    basePath: string,
    router: Router,
    opts?: { feature?: FeatureKey },
  ) => void;
  /** Webhook / body Buffer. Path absoluto (ej. `/api/billing/webhook`). */
  rawRoute: (
    method: RawRouteMethod,
    path: string,
    handler: RequestHandler,
  ) => void;
  command: (def: ChatInputCommandDefinition) => void;
  autocomplete: (commandName: string, handler: AutocompleteHandler) => void;
  /** Un solo fallback para slash no registrados (custom-commands). */
  fallbackChat: (handler: FallbackChatHandler) => void;
  /** Prefijo o customId exacto. Prefijos terminan en `_` (ej. `autorole_`). */
  button: (prefixOrId: string, handler: ButtonHandler) => void;
  /** Prefijo o customId exacto de String Select. Prefijos terminan en `_`. */
  select: (prefixOrId: string, handler: SelectHandler) => void;
  /** Prefijo o customId exacto de modal submit. Prefijos terminan en `_`. */
  modal: (prefixOrId: string, handler: ModalHandler) => void;
}

/** Fases de registro de un módulo. El kernel llama solo las del rol activo. */
export type ModuleRegisterFn = (ctx: ModuleContext) => void;

/**
 * Contrato plug-and-play de un bloque Lego del bot. Cada módulo declara solo
 * las fases que necesita:
 * - `registerHttp`  → rutas del panel. Roles: `all`, `api`.
 * - `registerGateway` → listeners de gateway + comandos + interacciones. Roles: `all`, `gateway`.
 * - `registerJobs`  → schedulers, colas, side-effects de crons. Roles: `all`, `worker`.
 */
export interface AdobosModule {
  id: ModuleId;
  name: string;
  /** GatewayIntentBits adicionales a fusionar en el Client. */
  intents?: number[];
  registerHttp?: ModuleRegisterFn;
  registerGateway?: ModuleRegisterFn;
  registerJobs?: ModuleRegisterFn;
}

export interface RegisteredRoute {
  basePath: string;
  router: Router;
  feature?: FeatureKey;
}
