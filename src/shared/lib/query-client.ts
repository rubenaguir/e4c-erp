import { QueryClient } from '@tanstack/react-query'

/**
 * Ver ADR-003 en docs/decisiones.md: TanStack Query es la fuente de verdad
 * de cache/mutaciones. Las mutaciones de documentos (Add/Update/Stamp/Cancel)
 * deben usar `queryClient.setQueryData` para parchear el registro en la
 * cache del listado, replicando el patrón List-Master-Detail confirmado en
 * la auditoría de Ext JS — nunca invalidar+refetch el listado completo tras
 * guardar un solo registro. Ver specs/ui-screens/patron-documento-list-master-detail.md.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Facturación es una operación fiscal: no se tolera divergencia de
      // datos silenciosa. Sin refetch automático agresivo; refresco explícito.
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})
