/** Constantes y factories por defecto de Scheduled Messages (Fase 7, MAINT-01). */

import type { ScheduledEmbedData, ScheduledFrequency } from "./contracts.js";
import { todayYmd } from "./internal.js";

export const SCHEDULED_MIN_INTERVAL_MINUTES = 15;
export const SCHEDULED_MAX_INTERVAL_MINUTES = 10_080;
export const DEFAULT_SCHEDULED_INTERVAL_MINUTES = 120;

export const DEFAULT_SCHEDULED_EMBED_COLOR = "#5865F2";
export const DEFAULT_SCHEDULED_TIMEZONE = "UTC";

export function defaultScheduledFrequency(): ScheduledFrequency {
  return {
    type: "daily",
    time: "12:00",
    days: [],
    dayOfMonth: 1,
    date: todayYmd(),
    repeatYearly: false,
    lastDayOfMonth: false,
    everyMinutes: DEFAULT_SCHEDULED_INTERVAL_MINUTES,
  };
}

export function defaultScheduledEmbedData(): ScheduledEmbedData {
  return {
    title: "Scheduled announcement",
    description: "Write the message content here.",
    color: DEFAULT_SCHEDULED_EMBED_COLOR,
    imageUrl: null,
  };
}
