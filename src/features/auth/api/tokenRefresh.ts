import { sisnetRequest } from '@/shared/lib/sisnet-client'
import type { TokenRefreshResponse } from '@/features/auth/types'

/** No requiere parámetros propios — el `session` viaja automático (ver api-contracts/auth.md). */
export function tokenRefresh(): Promise<TokenRefreshResponse> {
  return sisnetRequest({ opReq: 'seguri:acceso:acceso_jwt:TokenRefresh' })
}
