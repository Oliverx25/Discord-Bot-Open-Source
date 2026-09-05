/** Contratos Scheduled Messages (horario persistido + embeds) — Fase 7, MAINT-01. */

export type ScheduledFrequencyType =
  | "daily"
  | "weekly"
  | "monthly"
  | "specific_date"
  | "interval";

/** 0 = Domingo … 6 = Sábado. */
export type ScheduledWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ScheduledFrequency {
  type: ScheduledFrequencyType;
  /** Hora 24h `HH:mm`. Ignorada en `interval`. */
  time: string;
  /** Semanal: días seleccionados. Vacío = todos. */
  days: ScheduledWeekday[];
  /** Mensual: día del mes 1–31 (se clamp al último día civil). */
  dayOfMonth: number;
  /** Fecha específica: `YYYY-MM-DD`. */
  date: string;
  /**
   * Fecha específica: si true, se repite cada año (mismo día/mes).
   * Si false, solo el año de `date` y luego se desactiva.
   */
  repeatYearly: boolean;
  /** Mensual: dispara el último día civil del mes. */
  lastDayOfMonth: boolean;
  /** Intervalo: cada N minutos (≥ 15). */
  everyMinutes: number;
}

export interface ScheduledEmbedData {
  title: string;
  description: string;
  color: string;
  /** URL http(s) o ruta `/uploads/…`. */
  imageUrl: string | null;
}

export interface ScheduledMessage {
  id: number;
  guildId: string;
  channelId: string;
  /** Etiqueta corta para la lista (derivada del título). */
  label: string;
  /** Zona IANA del horario (ej. America/Mexico_City). */
  timezone: string;
  frequency: ScheduledFrequency;
  embedData: ScheduledEmbedData;
  /** Texto plano opcional (además del embed). */
  content: string;
  /** Rol a mencionar; `allowedMentions` por mensaje. */
  pingRoleId: string | null;
  isActive: boolean;
  /** Próximo (o due) envío persistido. */
  nextRunAt: string | null;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledMessagesListResponse {
  messages: ScheduledMessage[];
}

export interface ScheduledMessageResponse {
  message: ScheduledMessage;
}

export type CreateScheduledMessageRequest = {
  channelId: string;
  timezone: string;
  frequency: ScheduledFrequency;
  embedData: ScheduledEmbedData;
  content?: string;
  pingRoleId?: string | null;
  isActive?: boolean;
};

export type UpdateScheduledMessageRequest = Partial<{
  channelId: string;
  timezone: string;
  frequency: ScheduledFrequency;
  embedData: ScheduledEmbedData;
  content: string;
  pingRoleId: string | null;
  isActive: boolean;
}>;
