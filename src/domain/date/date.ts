import type { DayOfWeek, LocalDate } from "./types";

function assertValidMonth(month: number): void {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${month}`);
  }
}

export function daysInMonth(year: number, month: number): number {
  assertValidMonth(month);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidLocalDate(date: LocalDate): boolean {
  if (
    !Number.isInteger(date.year) ||
    !Number.isInteger(date.month) ||
    !Number.isInteger(date.day)
  ) {
    return false;
  }

  if (date.month < 1 || date.month > 12) {
    return false;
  }

  const maxDay = daysInMonth(date.year, date.month);
  return date.day >= 1 && date.day <= maxDay;
}

function toUtcDate(date: LocalDate): Date {
  if (!isValidLocalDate(date)) {
    throw new RangeError(`Invalid LocalDate: ${JSON.stringify(date)}`);
  }

  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}

function fromUtcDate(date: Date): LocalDate {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function dayOfWeek(date: LocalDate): DayOfWeek {
  const utc = toUtcDate(date);
  return utc.getUTCDay() as DayOfWeek;
}

export function addDays(date: LocalDate, delta: number): LocalDate {
  const utc = toUtcDate(date);
  utc.setUTCDate(utc.getUTCDate() + delta);
  return fromUtcDate(utc);
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseISODate(value: string): LocalDate | null {
  if (!ISO_DATE_REGEX.test(value)) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = value.split("-");
  const parsed: LocalDate = {
    year: Number.parseInt(yearStr, 10),
    month: Number.parseInt(monthStr, 10),
    day: Number.parseInt(dayStr, 10),
  };

  if (!isValidLocalDate(parsed)) {
    return null;
  }

  return parsed;
}

export function toISODate(date: LocalDate): string {
  if (!isValidLocalDate(date)) {
    throw new RangeError(`Invalid LocalDate: ${JSON.stringify(date)}`);
  }

  const year = String(date.year).padStart(4, "0");
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function compareDate(a: LocalDate, b: LocalDate): -1 | 0 | 1 {
  if (a.year !== b.year) {
    return a.year < b.year ? -1 : 1;
  }
  if (a.month !== b.month) {
    return a.month < b.month ? -1 : 1;
  }
  if (a.day !== b.day) {
    return a.day < b.day ? -1 : 1;
  }
  return 0;
}
