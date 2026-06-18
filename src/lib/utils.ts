import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateRange(start: Date | string, end: Date | string, timeZone = "Africa/Nairobi") {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  const dateFmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  });
  const timeFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
  if (sameDay) {
    return `${dateFmt.format(s)} · ${timeFmt.format(s)}–${timeFmt.format(e)}`;
  }
  return `${dateFmt.format(s)} – ${dateFmt.format(e)}`;
}

export function formatTime(d: Date | string, timeZone = "Africa/Nairobi") {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(d));
}

export function formatDate(d: Date | string, timeZone = "Africa/Nairobi") {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(d));
}

export function formatDay(d: Date | string, timeZone = "Africa/Nairobi") {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(new Date(d));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function groupBy<T, K extends string | number>(items: T[], key: (t: T) => K) {
  const out = new Map<K, T[]>();
  for (const it of items) {
    const k = key(it);
    if (!out.has(k)) out.set(k, []);
    out.get(k)!.push(it);
  }
  return out;
}

export function relativeTime(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(d).toLocaleDateString("en-GB");
}
