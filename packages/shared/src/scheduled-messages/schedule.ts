/**
 * Cálculo de próximo/anterior disparo civil por zona horaria IANA
 * (Fase 7, MAINT-01).
 */

import type { ScheduledFrequency, ScheduledWeekday } from "./contracts.js";
import {
  clampScheduledIntervalMinutes,
  normalizeScheduledClockTime,
  normalizeScheduledDate,
  normalizeScheduledFrequency,
  normalizeScheduledTimezone,
} from "./normalize.js";

/** Año civil en una zona IANA. */
export function getCalendarYearInTimezone(
  timezone: string,
  at: Date = new Date(),
): number {
  return zonedDateParts(at, timezone).year;
}

export function isScheduledOneShot(frequency: ScheduledFrequency): boolean {
  return frequency.type === "specific_date" && !frequency.repeatYearly;
}

interface CivilParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: ScheduledWeekday;
}

const WEEKDAY_PREFIX = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseClock(time: string): { hour: number; minute: number } {
  const normalized = normalizeScheduledClockTime(time);
  const [hourRaw, minuteRaw] = normalized.split(":");
  return { hour: Number(hourRaw), minute: Number(minuteRaw) };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addCivilDays(
  year: number,
  month: number,
  day: number,
  delta: number,
): { year: number; month: number; day: number } {
  const utc = new Date(Date.UTC(year, month - 1, day + delta));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function tzOffsetMs(instant: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - instant.getTime();
}

/** Instante UTC de una fecha civil en una zona IANA. */
export function zonedCivilToUtc(
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const tz = normalizeScheduledTimezone(timezone);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset1 = tzOffsetMs(new Date(utcGuess), tz);
  let instant = new Date(utcGuess - offset1);
  const offset2 = tzOffsetMs(instant, tz);
  if (offset2 !== offset1) {
    instant = new Date(utcGuess - offset2);
  }
  return instant;
}

export function zonedDateParts(at: Date, timezone: string): CivilParts {
  const tz = normalizeScheduledTimezone(timezone);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(at);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "";
    const weekdayRaw = get("weekday").toLowerCase();
    const weekdayIndex = WEEKDAY_PREFIX.findIndex((prefix) =>
      weekdayRaw.startsWith(prefix),
    );
    return {
      year: Number(get("year")),
      month: Number(get("month")),
      day: Number(get("day")),
      hour: Number(get("hour")),
      minute: Number(get("minute")),
      second: Number(get("second")),
      weekday: (weekdayIndex >= 0 ? weekdayIndex : 0) as ScheduledWeekday,
    };
  } catch {
    return {
      year: at.getUTCFullYear(),
      month: at.getUTCMonth() + 1,
      day: at.getUTCDate(),
      hour: at.getUTCHours(),
      minute: at.getUTCMinutes(),
      second: at.getUTCSeconds(),
      weekday: at.getUTCDay() as ScheduledWeekday,
    };
  }
}

function monthlyDay(
  year: number,
  month: number,
  frequency: ScheduledFrequency,
): number {
  const last = daysInMonth(year, month);
  if (frequency.lastDayOfMonth) return last;
  return Math.min(Math.max(1, frequency.dayOfMonth), last);
}

function fireAtCivil(
  timezone: string,
  year: number,
  month: number,
  day: number,
  time: string,
): Date {
  const { hour, minute } = parseClock(time);
  return zonedCivilToUtc(timezone, year, month, day, hour, minute);
}

function nextDaily(from: Date, timezone: string, time: string): Date {
  const p = zonedDateParts(from, timezone);
  const today = fireAtCivil(timezone, p.year, p.month, p.day, time);
  if (today.getTime() > from.getTime()) return today;
  const n = addCivilDays(p.year, p.month, p.day, 1);
  return fireAtCivil(timezone, n.year, n.month, n.day, time);
}

function prevDaily(from: Date, timezone: string, time: string): Date {
  const p = zonedDateParts(from, timezone);
  const today = fireAtCivil(timezone, p.year, p.month, p.day, time);
  if (today.getTime() <= from.getTime()) return today;
  const n = addCivilDays(p.year, p.month, p.day, -1);
  return fireAtCivil(timezone, n.year, n.month, n.day, time);
}

function matchesWeekly(
  weekday: ScheduledWeekday,
  days: ScheduledWeekday[],
): boolean {
  return days.length === 0 || days.includes(weekday);
}

function nextWeekly(
  from: Date,
  timezone: string,
  time: string,
  days: ScheduledWeekday[],
): Date {
  if (days.length === 0) return nextDaily(from, timezone, time);
  const p = zonedDateParts(from, timezone);
  for (let i = 0; i <= 7; i++) {
    const civil = addCivilDays(p.year, p.month, p.day, i);
    const fire = fireAtCivil(
      timezone,
      civil.year,
      civil.month,
      civil.day,
      time,
    );
    const weekday = zonedDateParts(fire, timezone).weekday;
    if (matchesWeekly(weekday, days) && fire.getTime() > from.getTime()) {
      return fire;
    }
  }
  const fallback = addCivilDays(p.year, p.month, p.day, 7);
  return fireAtCivil(
    timezone,
    fallback.year,
    fallback.month,
    fallback.day,
    time,
  );
}

function prevWeekly(
  from: Date,
  timezone: string,
  time: string,
  days: ScheduledWeekday[],
): Date {
  if (days.length === 0) return prevDaily(from, timezone, time);
  const p = zonedDateParts(from, timezone);
  for (let i = 0; i <= 7; i++) {
    const civil = addCivilDays(p.year, p.month, p.day, -i);
    const fire = fireAtCivil(
      timezone,
      civil.year,
      civil.month,
      civil.day,
      time,
    );
    const weekday = zonedDateParts(fire, timezone).weekday;
    if (matchesWeekly(weekday, days) && fire.getTime() <= from.getTime()) {
      return fire;
    }
  }
  const fallback = addCivilDays(p.year, p.month, p.day, -7);
  return fireAtCivil(
    timezone,
    fallback.year,
    fallback.month,
    fallback.day,
    time,
  );
}

function monthlyFire(
  timezone: string,
  year: number,
  month: number,
  frequency: ScheduledFrequency,
): Date {
  return fireAtCivil(
    timezone,
    year,
    month,
    monthlyDay(year, month, frequency),
    frequency.time,
  );
}

function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const raw = month - 1 + delta;
  const y = year + Math.floor(raw / 12);
  const m = ((raw % 12) + 12) % 12;
  return { year: y, month: m + 1 };
}

function nextMonthly(
  from: Date,
  timezone: string,
  frequency: ScheduledFrequency,
): Date {
  const p = zonedDateParts(from, timezone);
  const thisMonth = monthlyFire(timezone, p.year, p.month, frequency);
  if (thisMonth.getTime() > from.getTime()) return thisMonth;
  const n = shiftMonth(p.year, p.month, 1);
  return monthlyFire(timezone, n.year, n.month, frequency);
}

function prevMonthly(
  from: Date,
  timezone: string,
  frequency: ScheduledFrequency,
): Date {
  const p = zonedDateParts(from, timezone);
  const thisMonth = monthlyFire(timezone, p.year, p.month, frequency);
  if (thisMonth.getTime() <= from.getTime()) return thisMonth;
  const n = shiftMonth(p.year, p.month, -1);
  return monthlyFire(timezone, n.year, n.month, frequency);
}

function parseYmd(date: string): { year: number; month: number; day: number } {
  const normalized = normalizeScheduledDate(date);
  return {
    year: Number(normalized.slice(0, 4)),
    month: Number(normalized.slice(5, 7)),
    day: Number(normalized.slice(8, 10)),
  };
}

function yearlyFire(
  timezone: string,
  year: number,
  frequency: ScheduledFrequency,
): Date {
  const { month, day } = parseYmd(frequency.date);
  const clamped = Math.min(day, daysInMonth(year, month));
  return fireAtCivil(timezone, year, month, clamped, frequency.time);
}

function nextSpecific(
  from: Date,
  timezone: string,
  frequency: ScheduledFrequency,
): Date | null {
  if (!frequency.repeatYearly) {
    const { year, month, day } = parseYmd(frequency.date);
    const fire = fireAtCivil(timezone, year, month, day, frequency.time);
    return fire.getTime() > from.getTime() ? fire : null;
  }
  const p = zonedDateParts(from, timezone);
  const thisYear = yearlyFire(timezone, p.year, frequency);
  if (thisYear.getTime() > from.getTime()) return thisYear;
  return yearlyFire(timezone, p.year + 1, frequency);
}

function prevSpecific(
  from: Date,
  timezone: string,
  frequency: ScheduledFrequency,
): Date | null {
  if (!frequency.repeatYearly) {
    const { year, month, day } = parseYmd(frequency.date);
    const fire = fireAtCivil(timezone, year, month, day, frequency.time);
    return fire.getTime() <= from.getTime() ? fire : null;
  }
  const p = zonedDateParts(from, timezone);
  const thisYear = yearlyFire(timezone, p.year, frequency);
  if (thisYear.getTime() <= from.getTime()) return thisYear;
  return yearlyFire(timezone, p.year - 1, frequency);
}

function upcomingRunAt(
  frequency: ScheduledFrequency,
  timezone: string,
  from: Date,
): Date | null {
  const tz = normalizeScheduledTimezone(timezone);
  switch (frequency.type) {
    case "interval":
      return null;
    case "daily":
      return nextDaily(from, tz, frequency.time);
    case "weekly":
      return nextWeekly(from, tz, frequency.time, frequency.days);
    case "monthly":
      return nextMonthly(from, tz, frequency);
    case "specific_date":
      return nextSpecific(from, tz, frequency);
    default:
      return nextDaily(from, tz, frequency.time);
  }
}

function previousRunAt(
  frequency: ScheduledFrequency,
  timezone: string,
  from: Date,
): Date | null {
  const tz = normalizeScheduledTimezone(timezone);
  switch (frequency.type) {
    case "interval":
      return null;
    case "daily":
      return prevDaily(from, tz, frequency.time);
    case "weekly":
      return prevWeekly(from, tz, frequency.time, frequency.days);
    case "monthly":
      return prevMonthly(from, tz, frequency);
    case "specific_date":
      return prevSpecific(from, tz, frequency);
    default:
      return prevDaily(from, tz, frequency.time);
  }
}

/**
 * Próximo envío a persistir. Si hay un tick civil ya vencido y no hay
 * `lastSentAt` posterior, devuelve ese instante (catch-up de un due).
 * Intervalo: ahora si nunca se envió; si no, lastSent + N minutos.
 */
export function computeNextRunAt(
  frequency: ScheduledFrequency,
  timezone: string,
  from: Date,
  lastSentAt?: Date | null,
): Date | null {
  const freq = normalizeScheduledFrequency(frequency);
  const tz = normalizeScheduledTimezone(timezone);
  if (freq.type === "interval") {
    const stepMs = clampScheduledIntervalMinutes(freq.everyMinutes) * 60_000;
    if (!lastSentAt) return from;
    return new Date(lastSentAt.getTime() + stepMs);
  }
  const previous = previousRunAt(freq, tz, from);
  if (
    previous &&
    (lastSentAt == null || lastSentAt.getTime() < previous.getTime())
  ) {
    return previous;
  }
  return upcomingRunAt(freq, tz, from);
}
