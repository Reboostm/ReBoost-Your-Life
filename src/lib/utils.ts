import { format, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from "date-fns";
import { Period } from "@/types";

export function parseDuration(input: string): number | null {
  const cleaned = input.trim();

  // "4:03" or "4:3" -> minutes:seconds
  const colonMatch = cleaned.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1]);
    const secs = parseInt(colonMatch[2]);
    if (secs < 60) return mins * 60 + secs;
  }

  // "4m3s" or "4m 3s"
  const msMatch = cleaned.match(/^(\d+)\s*m\s*(\d+)\s*s?$/i);
  if (msMatch) {
    return parseInt(msMatch[1]) * 60 + parseInt(msMatch[2]);
  }

  // Just minutes "4m" or "4 min"
  const mMatch = cleaned.match(/^(\d+)\s*(m|min|mins|minutes?)$/i);
  if (mMatch) return parseInt(mMatch[1]) * 60;

  // Just seconds "243s" or "243 sec"
  const sMatch = cleaned.match(/^(\d+)\s*(s|sec|secs|seconds?)$/i);
  if (sMatch) return parseInt(sMatch[1]);

  // Plain number treated as seconds if > 60, minutes if <= 59
  const numMatch = cleaned.match(/^(\d+)$/);
  if (numMatch) {
    const n = parseInt(numMatch[1]);
    return n > 59 ? n : n * 60;
  }

  return null;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatSteps(steps: number): string {
  if (steps >= 1000) return `${(steps / 1000).toFixed(1)}k`;
  return steps.toString();
}

export function getDateRange(period: Period, date: Date = new Date()): { start: string; end: string } {
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  switch (period) {
    case "today":
      return { start: fmt(date), end: fmt(date) };
    case "week":
      return {
        start: fmt(startOfWeek(date, { weekStartsOn: 1 })),
        end: fmt(endOfWeek(date, { weekStartsOn: 1 })),
      };
    case "month":
      return { start: fmt(startOfMonth(date)), end: fmt(endOfMonth(date)) };
    case "year":
      return { start: fmt(startOfYear(date)), end: fmt(endOfYear(date)) };
    case "all":
      return { start: "2000-01-01", end: fmt(new Date(2099, 11, 31)) };
    default:
      return { start: fmt(date), end: fmt(date) };
  }
}

export function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return format(date, "MMM d");
}

export function getPeriodLabel(period: Period): string {
  switch (period) {
    case "today": return "Today";
    case "week": return "This Week";
    case "month": return "This Month";
    case "year": return "This Year";
    case "all": return "All Time";
  }
}
