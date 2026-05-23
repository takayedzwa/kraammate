import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDate(date: Date | string, locale: "en" | "nl" = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatTime(date: Date | string, locale: "en" | "nl" = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: "en" | "nl" = "en") {
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`;
}

export function calculateAge(birthDate: Date | string): string {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays} days`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30.44);
    return `${months} month${months > 1 ? "s" : ""}`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30.44);
    if (remainingMonths > 0) {
      return `${years} year${years > 1 ? "s" : ""}, ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
    }
    return `${years} year${years > 1 ? "s" : ""}`;
  }
}

export function getGestationalAge(birthDate: Date | string, gestationalWeeks: number): string {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const correctedWeeks = gestationalWeeks + Math.floor(diffDays / 7);
  return `${correctedWeeks} weeks`;
}
