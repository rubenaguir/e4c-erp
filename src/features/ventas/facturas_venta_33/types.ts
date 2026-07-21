/**
 * Tipos de facturas_venta_33 — reflejan specs/entities/ventas/factura.md y
 * specs/api-contracts/ventas/facturas.md#Search.
 * No inventar campos que no estén ahí (ver CLAUDE.md, "Reglas de implementación").
 */

/**
 * facturas_venta_33 solo usa P/R/C (ver ADR-016 en docs/decisiones.md) —
 * T/A son vocabulario genérico de Sisnet V3 que no aplica a esta entidad,
 * aunque el parámetro `estatus` del contrato de Search los acepte.
 */
export type EstatusFactura = 'P' | 'R' | 'C'

/**
 * Shape angosto que regresa Search. El contrato
 * (specs/api-contracts/ventas/facturas.md#Search) no lo tabula campo por
 * campo — solo dice "como Load menos relaciones anidadas, más saldo/
 * num_cta_cobrar/estatus_cxc". Se tipan aquí solo los campos que consume
 * el listado; no asumir que el registro real no trae más.
 */
export interface FacturaSearchRecord {
  serie: string
  folio: string
  receptor_rfc: string
  receptor_nombre: string
  /** dd/mm/aaaa hh:mm[:ss] — no ISO 8601. */
  fecha: string
  estatus: EstatusFactura
  /** Numérico como string — Sisnet V3 nunca regresa number (ver CLAUDE.md). */
  total: string
  /** Derivado de join, solo presente en Search (no en Load) — opcional. */
  saldo?: string
}

/** Todos opcionales — specs/api-contracts/ventas/facturas.md#Search. */
export interface SearchFacturasParams {
  /** dd/mm/aaaa */
  fecha_inicial?: string
  /** dd/mm/aaaa */
  fecha_final?: string
  rfc?: string
  nombre?: string
  serie?: string
  folio?: string
  pedido_serie?: string
  pedido_folio?: string
  estatus?: EstatusFactura
  start?: number
  limit?: number
  [key: string]: unknown
}

export interface SearchFacturasResponse {
  totalCount: number
  records: FacturaSearchRecord[]
}
