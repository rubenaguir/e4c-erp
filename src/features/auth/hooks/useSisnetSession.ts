import { useSyncExternalStore } from 'react'
import { getSisnetSession, subscribeSisnetSession } from '@/shared/lib/sisnet-client'

/** Store externo (ADR-011) — sin AuthContext, ver ADR-004. */
export function useSisnetSession(): string | null {
  return useSyncExternalStore(subscribeSisnetSession, getSisnetSession)
}
