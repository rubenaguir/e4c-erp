import { sisnetRequest } from '@/shared/lib/sisnet-client'
import type { LoginParams, LoginResponse } from '@/features/auth/types'

/**
 * ADR-011: nunca enviar remember_me=false tal cual — PHP evalúa el string
 * "false" como verdadero. Si el usuario no marcó "recordarme", se omite el
 * parámetro por completo (equivale al default del backend).
 */
export function login(params: LoginParams): Promise<LoginResponse> {
  const { usuario, contrasena, sucursal, rememberMe, workspace = 'default' } = params

  return sisnetRequest({
    opReq: 'seguri:acceso:acceso_jwt:Login',
    params: {
      usuario,
      contrasena,
      sucursal,
      workspace,
      ...(rememberMe ? { remember_me: '1' } : {}),
    },
  })
}
