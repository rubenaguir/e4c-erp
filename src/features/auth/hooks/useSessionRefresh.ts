import { useEffect, useRef } from 'react'
import {
  getSisnetSession,
  getSisnetTokenRefreshDelayMs,
  getSisnetTokenRemainingMs,
  setSisnetForceLogoutHandler,
  setSisnetSession,
} from '@/shared/lib/sisnet-client'
import { useSisnetSession } from '@/features/auth/hooks/useSisnetSession'
import { useTokenRefresh } from '@/features/auth/hooks/useTokenRefresh'

const VISIBILITY_REFRESH_THRESHOLD_MS = 10 * 60 * 1000

/**
 * Orquesta el ciclo de vida de la sesión (ADR-011): engancha forceLogout,
 * programa el refresh proactivo al 80% del tiempo restante del token, y
 * revalida al volver a foco si quedan menos de 10 minutos de vida.
 * Se monta una sola vez, en src/app/App.tsx.
 */
export function useSessionRefresh(): void {
  const session = useSisnetSession()
  const { mutateAsync: refresh } = useTokenRefresh()
  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  })

  useEffect(() => {
    setSisnetForceLogoutHandler(() => setSisnetSession(null))
    return () => setSisnetForceLogoutHandler(null)
  }, [])

  useEffect(() => {
    if (!session) return
    const delay = getSisnetTokenRefreshDelayMs(session)
    if (delay === null) return

    const timeoutId = window.setTimeout(() => {
      refreshRef.current().catch((error: unknown) => {
        console.error('[auth] TokenRefresh proactivo falló', error)
      })
    }, delay)

    return () => window.clearTimeout(timeoutId)
  }, [session])

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      const current = getSisnetSession()
      if (!current) return

      const remaining = getSisnetTokenRemainingMs(current)
      if (remaining !== null && remaining < VISIBILITY_REFRESH_THRESHOLD_MS) {
        refreshRef.current().catch((error: unknown) => {
          console.error('[auth] TokenRefresh en visibilitychange falló', error)
        })
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])
}
