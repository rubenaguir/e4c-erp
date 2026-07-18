import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Helper estándar de shadcn/ui para combinar clases de Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
