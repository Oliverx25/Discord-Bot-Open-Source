/**
 * Normalización de inputs + formato legible de Scheduled Messages
 * (Fase 7, MAINT-01).
 */

import type { EmbedPayload } from "../messages.js";
import type {
  ScheduledEmbedData,
  ScheduledFrequency,
  ScheduledFrequencyType,
  ScheduledWeekday,
} from "./contracts.js";
import {
  DEFAULT_SCHEDULED_EMBED_COLOR,
  DEFAULT_SCHEDULED_INTERVAL_MINUTES,
  DEFAULT_SCHEDULED_TIMEZONE,
  defaultScheduledEmbedData,
  defaultScheduledFrequency,
  SCHEDULED_MAX_INTERVAL_MINUTES,
  SCHEDULED_MIN_INTERVAL_MINUTES,
} from "./defaults.js";
import { todayYmd } from "./internal.js";

const SNOWFLAKE_RE = /^\d{17,20}$/;

export function isValidIanaTimezone(value: string): boolean {
  const raw = value.trim();
  if (!raw || raw.length > 64) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: raw });
    return true;
  } catch {
    return false;
  }
}

export function normalizeScheduledTimezone(
  value: unknown,
  fallback = DEFAULT_SCHEDULED_TIMEZONE,
): string {
  const raw = String(value ?? "").trim();
  if (raw && isValidIanaTimezone(raw)) return raw;
  if (fallback && isValidIanaTimezone(fallback)) return fallback;
  return DEFAULT_SCHEDULED_TIMEZONE;
}

/** Zona del navegador / runtime, o UTC. */
export function detectLocalTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && isValidIanaTimezone(tz)) return tz;
  } catch {
    /* ignore */
  }
  return DEFAULT_SCHEDULED_TIMEZONE;
}

export function normalizeScheduledFrequencyType(
  value: unknown,
): ScheduledFrequencyType {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (raw === "weekly" || raw === "semanal") return "weekly";
  if (raw === "monthly" || raw === "mensual") return "monthly";
  if (
    raw === "specific_date" ||
    raw === "specificdate" ||
    raw === "fecha_especifica" ||
    raw === "fechaespecifica" ||
    raw === "once" ||
    raw === "one_shot"
  ) {
    return "specific_date";
  }
  if (
    raw === "interval" ||
    raw === "intervalo" ||
    raw === "every" ||
    raw === "bump"
  ) {
    return "interval";
  }
  return "daily";
}

export function normalizeScheduledWeekdays(value: unknown): ScheduledWeekday[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<ScheduledWeekday>();
  for (const raw of value) {
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n) || n < 0 || n > 6) continue;
    seen.add(n as ScheduledWeekday);
  }
  return [...seen].sort((a, b) => a - b);
}

export function normalizeScheduledClockTime(
  value: unknown,
  fallback = "12:00",
): string {
  const raw = String(value ?? "").trim();
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(raw);
  if (!match) return fallback;
  return `${match[1]!.padStart(2, "0")}:${match[2]!}`;
}

/** Normaliza `YYYY-MM-DD`. Fallback = hoy (local). */
export function normalizeScheduledDate(
  value: unknown,
  fallback = todayYmd(),
): string {
  const raw = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return fallback;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    year < 1970 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return fallback;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function clampScheduledIntervalMinutes(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_SCHEDULED_INTERVAL_MINUTES;
  return Math.max(
    SCHEDULED_MIN_INTERVAL_MINUTES,
    Math.min(SCHEDULED_MAX_INTERVAL_MINUTES, n),
  );
}

export function normalizeScheduledFrequency(
  input: Partial<ScheduledFrequency> | undefined,
): ScheduledFrequency {
  const base = defaultScheduledFrequency();
  if (!input) return base;
  const type = normalizeScheduledFrequencyType(input.type ?? base.type);
  return {
    type,
    time: normalizeScheduledClockTime(input.time ?? base.time),
    days: normalizeScheduledWeekdays(input.days),
    dayOfMonth: Math.max(
      1,
      Math.min(31, Math.round(Number(input.dayOfMonth) || 1)),
    ),
    date: normalizeScheduledDate(input.date ?? base.date),
    repeatYearly: Boolean(input.repeatYearly),
    lastDayOfMonth: Boolean(input.lastDayOfMonth),
    everyMinutes: clampScheduledIntervalMinutes(
      input.everyMinutes ?? base.everyMinutes,
    ),
  };
}

export function normalizeScheduledContent(value: unknown): string {
  return String(value ?? "")
    .trim()
    .slice(0, 2000);
}

export function normalizeScheduledPingRoleId(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const id = String(value).trim();
  if (!SNOWFLAKE_RE.test(id)) return null;
  return id;
}

function normalizeMediaRef(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("/uploads/")) return raw.slice(0, 500);
  if (/^https?:\/\//i.test(raw)) return raw.slice(0, 500);
  return null;
}

export function normalizeScheduledEmbedData(
  input: Partial<ScheduledEmbedData> | undefined,
): ScheduledEmbedData {
  const base = defaultScheduledEmbedData();
  if (!input) return base;
  const colorRaw = String(input.color ?? base.color).trim();
  let color = DEFAULT_SCHEDULED_EMBED_COLOR;
  if (/^#[0-9A-Fa-f]{6}$/.test(colorRaw)) color = colorRaw.toUpperCase();
  else if (/^[0-9A-Fa-f]{6}$/.test(colorRaw))
    color = `#${colorRaw.toUpperCase()}`;

  return {
    title:
      String(input.title ?? base.title)
        .trim()
        .slice(0, 256) || base.title,
    description: String(input.description ?? base.description)
      .trim()
      .slice(0, 4000),
    color,
    imageUrl: normalizeMediaRef(input.imageUrl),
  };
}

/** Mapea una plantilla de embed al mini-formulario del programador. */
export function embedPayloadToScheduledEmbedData(
  payload: EmbedPayload | undefined,
): ScheduledEmbedData {
  if (!payload) return defaultScheduledEmbedData();
  return normalizeScheduledEmbedData({
    title: payload.title?.trim() || defaultScheduledEmbedData().title,
    description:
      payload.description?.trim() || defaultScheduledEmbedData().description,
    color: payload.color,
    imageUrl: payload.imageUrl ?? null,
  });
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatIntervalSummary(everyMinutes: number): string {
  const n = clampScheduledIntervalMinutes(everyMinutes);
  if (n % 60 === 0) {
    const hours = n / 60;
    return hours === 1 ? "Every hour" : `Every ${hours} hours`;
  }
  return `Every ${n} minutes`;
}

/** Resumen legible del horario para la lista del dashboard. */
export function formatScheduledFrequencySummary(
  frequency: ScheduledFrequency,
  timezone?: string,
): string {
  const time = frequency.time || "12:00";
  let base: string;
  if (frequency.type === "interval") {
    base = formatIntervalSummary(frequency.everyMinutes);
  } else if (frequency.type === "daily") {
    base = `Every day at ${time}`;
  } else if (frequency.type === "monthly") {
    base = frequency.lastDayOfMonth
      ? `The last day of every month at ${time}`
      : `Day ${frequency.dayOfMonth} of every month at ${time}`;
  } else if (frequency.type === "specific_date") {
    const date = frequency.date || "—";
    base = frequency.repeatYearly
      ? `Every year on ${date.slice(5)} at ${time}`
      : `On ${date} at ${time} (once)`;
  } else {
    const days = frequency.days ?? [];
    if (days.length === 0) {
      base = `Every day at ${time}`;
    } else {
      const labels = days.map((d) => WEEKDAY_SHORT[d] ?? String(d)).join(", ");
      base = `${labels} a las ${time}`;
    }
  }
  if (timezone?.trim()) return `${base} (${timezone.trim()})`;
  return base;
}
