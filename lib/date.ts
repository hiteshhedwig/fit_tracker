import { format, parseISO } from "date-fns";

export const appTimeZone = process.env.APP_TIME_ZONE || "Asia/Kolkata";

export function getTodayKey() {
  return dateKeyInTimeZone(new Date(), appTimeZone);
}

export function dateKeyInTimeZone(date: Date, timeZone = appTimeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function displayDate(dateKey: string) {
  return format(parseISO(dateKey), "EEE, d MMM");
}

export function mondayForDateKey(dateKey: string) {
  const date = parseISO(dateKey);
  const day = date.getUTCDay() || 7;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day + 1));
  return format(monday, "yyyy-MM-dd");
}

export function addDaysToKey(dateKey: string, days: number) {
  const date = parseISO(dateKey);
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
  return format(next, "yyyy-MM-dd");
}
