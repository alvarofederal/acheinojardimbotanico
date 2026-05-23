import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte texto em slug URL-friendly (sem acentos, minúsculo, hífens).
 * Ex: "Jardim Botânico" → "jardim-botanico"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

/** URL base canônica do site (produção ou local). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://acheinojardimbotanico.com.br"
