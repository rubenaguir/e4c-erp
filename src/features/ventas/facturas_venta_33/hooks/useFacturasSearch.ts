import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { searchFacturas } from '@/features/ventas/facturas_venta_33/api/searchFacturas'
import type { SearchFacturasParams } from '@/features/ventas/facturas_venta_33/types'

/**
 * Query key exacta de specs/ui-screens/patron-documento-list-master-detail.md:
 * ['facturas', 'search', filtros] — filtros incluye start/limit. Mutaciones
 * futuras (alta/edición/timbrado/cancelación) parchean esta cache vía
 * queryClient.setQueryData, nunca invalidateQueries sobre esta key.
 */
export function useFacturasSearch(filtros: SearchFacturasParams) {
  return useQuery({
    queryKey: ['facturas', 'search', filtros],
    queryFn: () => searchFacturas(filtros),
    placeholderData: keepPreviousData,
  })
}
