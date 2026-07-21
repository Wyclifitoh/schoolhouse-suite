import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve a logo_url to a full URL.
 * If the URL is a relative path (e.g. /uploads/logos/uuid.png), prepend the API base.
 * If it's already an absolute URL or a data URI, return as-is.
 */
export function resolveLogoUrl(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null;
  if (logoUrl.startsWith("data:") || logoUrl.startsWith("http")) return logoUrl;
  // Relative path — prepend API base (strip /api/v1)
  const apiBase = (import.meta.env.VITE_API_URL || "https://chuoapi.wikiteq.co.ke/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${apiBase}${logoUrl}`;
}
