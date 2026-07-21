/**
 * Tipos del módulo auth — reflejan specs/api-contracts/auth.md.
 * No inventar campos que no estén ahí (ver CLAUDE.md, "Reglas de implementación").
 */

export interface SucursalUsuario {
  /** formato empresa_id|sucursal_id|instancia_id — pasar tal cual a Login. */
  empresa_sucursal_id: string
  descripcion: string
}

export interface SearchSucursalesUsuarioParams {
  usuario_id: string
  [key: string]: unknown
}

/** Ojo: la llave es "record" (singular), no "records" — así viene del backend. */
export interface SearchSucursalesUsuarioResponse {
  record: SucursalUsuario[]
}

export interface SisnetUser {
  id: string
  email: string
  name: string
  company: string
  office: string
  /** No tipado en detalle — el piloto no lo consume (ver specs/api-contracts/auth.md). */
  permissionMatrix: unknown
  roles: unknown[]
}

export interface LoginParams {
  usuario: string
  contrasena: string
  /** formato empresa_id|sucursal_id|instancia_id, viene de SucursalUsuario.empresa_sucursal_id. */
  sucursal: string
  rememberMe: boolean
  workspace?: string
}

export interface LoginResponse {
  success: true
  session: string
  usuario: string
  empresa: string
  sucursal: string
  serviceToken: string
  /** string "Y-m-d H:i:s" — no epoch (ver specs/api-contracts/auth.md). */
  expiresAt: string
  user: SisnetUser
}

/** TokenRefresh delega en ValidateSession en el backend — mismo shape que Login. */
export type TokenRefreshResponse = LoginResponse
