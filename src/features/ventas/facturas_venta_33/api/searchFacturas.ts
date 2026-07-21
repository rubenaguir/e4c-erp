import { sisnetRequest } from '@/shared/lib/sisnet-client'
import type { SearchFacturasParams, SearchFacturasResponse } from '@/features/ventas/facturas_venta_33/types'

export function searchFacturas(params: SearchFacturasParams): Promise<SearchFacturasResponse> {
  return sisnetRequest({
    opReq: 'ventas:facturas_venta_33:facturas_venta:Search',
    params,
  })
}
