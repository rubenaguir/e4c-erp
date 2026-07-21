/**
 * Cliente HTTP hacia Sisnet V3 (php/interfase_jwt.php).
 *
 * Ver ADR-004, ADR-007 y ADR-009 en docs/decisiones.md, y el shape real de
 * error documentado en specs/api-contracts/README.md — no inventar formas
 * alternativas de request/response aquí sin actualizar esa spec primero.
 */

const SISNET_BASE_URL = import.meta.env.VITE_SISNET_BASE_URL as string

if (!SISNET_BASE_URL) {
  throw new Error(
    'VITE_SISNET_BASE_URL no está configurada. Ver README.md — sección de variables de entorno.',
  )
}

/** Debug-only (Xdebug/breakpoints en el backend PHP local) — nunca 'true' en
 *  un build real. Comparación estricta contra el string 'true': las env vars
 *  de Vite siempre llegan como string, y cualquier otro valor (incluido
 *  ausente) debe evaluar a false. Ver mismo patrón en e4c-factura. */
const XDEBUG_ENABLED = import.meta.env.VITE_XDEBUG_ENABLED === 'true'

/** Shape real de error de interfase_jwt.php (NO inventar uno "más limpio"). */
export interface SisnetErrorResponse {
  success: false
  Message: string
  msg: string
  OperationRequest: string
  UrlRequest: string
  Code: number
  CodeDescr: string
  File: string
  Line: number
  Trace: string
  forceLogout: 'S' | 'N'
}

export class SisnetError extends Error {
  readonly code: number
  readonly forceLogout: boolean
  readonly raw: SisnetErrorResponse

  constructor(raw: SisnetErrorResponse) {
    super(raw.Message || raw.msg || 'Error no identificado')
    this.name = 'SisnetError'
    this.code = raw.Code
    this.forceLogout = raw.forceLogout === 'S'
    this.raw = raw
  }
}

/** Ver ADR-011: localStorage es la fuente de verdad, un solo string (JWT crudo). */
const SESSION_STORAGE_KEY = 'sv3_session'

function readStoredSession(): string | null {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY)
  } catch {
    return null
  }
}

/** Token de sesión (JWT) — provisto por el módulo de auth. Ver ADR-007, ADR-011. */
let sessionToken: string | null = readStoredSession()

type SessionListener = () => void
const sessionListeners = new Set<SessionListener>()

export function setSisnetSession(token: string | null) {
  sessionToken = token
  try {
    if (token) localStorage.setItem(SESSION_STORAGE_KEY, token)
    else localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // localStorage no disponible (modo privado, etc.) — degradar a solo memoria
  }
  sessionListeners.forEach((listener) => listener())
}

export function getSisnetSession() {
  return sessionToken
}

/** Para useSyncExternalStore — ver useSisnetSession() en features/auth/hooks. */
export function subscribeSisnetSession(listener: SessionListener): () => void {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

interface SisnetTokenPayload {
  exp?: number
  [key: string]: unknown
}

/** Decodifica el payload de un JWT sin verificar firma — solo para leer
 *  `exp` y calcular el timing de refresh; la validación real la hace el
 *  backend en cada request. */
function decodeSisnetToken(token: string): SisnetTokenPayload | null {
  try {
    const payloadSegment = token.split('.')[1]
    if (!payloadSegment) return null
    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as SisnetTokenPayload
  } catch {
    return null
  }
}

export function getSisnetTokenRemainingMs(token: string): number | null {
  const payload = decodeSisnetToken(token)
  if (!payload || typeof payload.exp !== 'number') return null
  return payload.exp * 1000 - Date.now()
}

/** 80% del tiempo restante (ADR-011) — momento en que debe dispararse TokenRefresh. */
export function getSisnetTokenRefreshDelayMs(token: string): number | null {
  const remaining = getSisnetTokenRemainingMs(token)
  if (remaining === null) return null
  return Math.max(0, remaining * 0.8)
}

/** Callback opcional para reaccionar a un forceLogout del backend. */
let onForceLogout: (() => void) | null = null

export function setSisnetForceLogoutHandler(handler: (() => void) | null) {
  onForceLogout = handler
}

interface SisnetRequestOptions {
  /** `modulo:vista:controlador:accion` — ver AGENTS-php.md del backend. */
  opReq: string
  /** Parámetros del request, tal como los espera el Agent de PHP. */
  params?: Record<string, unknown>
  /** La mayoría de los Agents responden JSON; usar 'blob' para PDF/XLS/etc. */
  responseType?: 'json' | 'blob'
}

function buildFormBody(opReq: string, params: Record<string, unknown>): URLSearchParams {
  const body = new URLSearchParams()
  body.set('opReq', opReq)
  if (sessionToken) body.set('session', sessionToken)

  for (const [key, value] of Object.entries(params)) {
    appendParam(body, key, value)
  }
  return body
}

/** Serializa arreglos/objetos anidados igual que Ext.Ajax (`campo[0][sub]=valor`). */
function appendParam(body: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null) return

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendParam(body, `${key}[${index}]`, item))
    return
  }

  if (typeof value === 'object') {
    for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
      appendParam(body, `${key}[${subKey}]`, subValue)
    }
    return
  }

  body.set(key, String(value))
}

export async function sisnetRequest<T>(options: SisnetRequestOptions): Promise<T> {
  const { opReq, params = {}, responseType = 'json' } = options
  const body = buildFormBody(opReq, params)

  let url = SISNET_BASE_URL
  if (XDEBUG_ENABLED) {
    url += '?XDEBUG_SESSION_START=XDEBUG_ECLIPSE'
  }

  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    body,
  })

  if (responseType === 'blob') {
    if (!response.ok) throw new Error(`Sisnet V3 respondió ${response.status} para ${opReq}`)
    return (await response.blob()) as T
  }

  const json = await response.json()

  if (json && json.success === false) {
    const error = new SisnetError(json as SisnetErrorResponse)
    if (error.forceLogout) onForceLogout?.()
    throw error
  }

  return json as T
}
