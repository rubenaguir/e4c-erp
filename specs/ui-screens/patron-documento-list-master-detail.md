# Patrón de pantalla — Documento (List-Master-Detail-Complemento)

> Documento más importante de la Fase 1 (ver `docs/plan-implementacion.md`):
> generaliza el hallazgo de la auditoría de `facturas_venta_33` a un patrón
> reusable para toda pantalla tipo "documento" del ERP (pedidos, notas de
> crédito, facturas/órdenes de compra, etc.). Los otros dos patrones
> (catálogo, reporte) se especifican en fases posteriores — ver
> `docs/arquitectura.md`.

## Origen del patrón (evidencia, no diseño desde cero)

La UI Ext JS original de `facturas_venta_33` **ya implementa** este
comportamiento en producción (auditoría de
`SisnetV3Desarrollo/modules/ventas/facturas_venta_33/facturas_venta.js`,
sesión de origen de este proyecto):

- `facturas_venta.js:1052` (`Load()`) — abrir el detalle no reutiliza el
  registro del listado como fuente; hace un request real a `Load`, pero
  guarda una referencia (`form.record = record`) al registro del store del
  listado.
- `facturas_venta.js:799-816` (dentro del handler de guardado) — si es un
  registro nuevo, se crea un record vacío y se agrega **directamente al
  store del listado** (`Ext.getCmp('GRID_listado').getStore().add(record)`)
  antes de poblarlo; si ya existía, se llama `SetRecordValues(form.record,
  that.json.record)` sobre el mismo objeto que vive en el store del
  listado. Como es el mismo objeto en memoria, el grid del listado se
  actualiza sin ningún request adicional.
- No hay ningún handler de refresh al volver del tab de detalle al tab de
  listado (`facturas_venta.ini.js`) — el store del listado se preserva tal
  cual estaba.

Este documento traduce ese comportamiento exacto a TanStack Query.

## Estructura del patrón

```
List (vista de lista)
  │
  ├── Master (encabezado del documento)
  │     └── Detail-grid inline (ej. grid de conceptos — siempre visible,
  │           no es un complemento)
  │
  └── Complementos (N sub-documentos condicionales, en ventanas/paneles
        separados — no todos aplican a todos los documentos)
```

Para `facturas_venta_33` específicamente: Master = encabezado de factura,
Detail-grid = grid de conceptos, Complementos = pedidos-a-facturar,
impuestos por concepto, información aduanera, etc. (la mayoría fuera de
alcance del piloto — ver `CLAUDE.md`).

## Contrato de cache — TanStack Query

### Query keys

```ts
// Lista
['facturas', 'search', filtros] // filtros: objeto serializable de specs/api-contracts/ventas/facturas.md#Search

// Detalle (opcional; el piloto puede no cachear el detalle por separado si
// el Master siempre se abre fresco vía Load — decidir al implementar)
['facturas', 'detalle', serie, folio]
```

### Regla de parcheo tras una mutación (Add/Update/Stamp/Cancel)

Toda mutación de documento (`AddPrefactura`, `UpdatePrefactura`, `Stamp`,
`Cancel`, `Cancel33` — ver `specs/api-contracts/ventas/facturas.md`) regresa
`{msg, log, record}` con el documento completo actualizado. La regla,
**sin excepción**, es:

```ts
onSuccess: (data, variables) => {
  queryClient.setQueryData(['facturas', 'search', filtrosActivos], (old) => {
    if (!old) return old
    const index = old.records.findIndex(
      (r) => r.serie === data.record.serie && r.folio === data.record.folio,
    )
    if (index === -1) {
      // Alta: se agrega al principio (o donde el orden de la lista lo
      // requiera), incrementando totalCount.
      return { totalCount: old.totalCount + 1, records: [data.record, ...old.records] }
    }
    // Edición/timbrado/cancelación: merge parcial en su posición (ADR-012)
    // — conserva campos derivados de joins (ej. saldo, num_cta_cobrar) que
    // Search trae pero data.record no.
    const records = [...old.records]
    records[index] = { ...records[index], ...data.record }
    return { ...old, records }
  })
}
```

- **Nunca** `queryClient.invalidateQueries(['facturas', 'search'])` tras una
  mutación de un solo documento — eso dispara un refetch completo de la
  lista, exactamente lo que este patrón existe para evitar (ver "Origen del
  patrón" arriba).
- Si hay múltiples query keys de listado activas simultáneamente (ej. el
  usuario tiene dos búsquedas con filtros distintos abiertas — no
  confirmado si el piloto lo permite), la mutación debe parchear **todas**
  las que existan en cache, no solo la última usada. Resolver con
  `queryClient.getQueriesData({ queryKey: ['facturas', 'search'] })` +
  iterar, en vez de asumir una sola query key activa.
- El shape exacto de `records[i]` (angosto, de `Search`) vs. `data.record`
  (completo, de `Load`/mutación) **difieren** — ver
  `specs/entities/ventas/factura.md`. Resuelto por ADR-012 (merge parcial
  genérico): el parcheo de arriba conserva los campos derivados de joins
  (ej. `saldo`, `num_cta_cobrar`, `estatus_cxc`) que trae `Search` pero no
  `data.record`, en vez de perderlos con un reemplazo total.

Se recomienda extraer esta lógica a `src/shared/lib/mergeDocumentRecord.ts`
cuando se implemente la primera mutación (Fase 3) — no específico de
factura, reusable por cualquier módulo tipo documento.

### Navegación List ↔ Master

- Abrir el Master **no** reutiliza el registro angosto del listado como
  fuente de datos completa — siempre hace `Load` (paridad con
  `facturas_venta.js:1052`, ver "Origen del patrón").
- Volver al listado **no** dispara ningún refetch — ni de `Search` ni de la
  query del listado. El único momento en que el listado cambia es por el
  parcheo de la sección anterior.

## Complementos condicionales

No se modelan como tabs fijos del Master (a diferencia de la tentación
obvia de "una pantalla = un layout con tabs"). Cada complemento es una
pieza independiente, activable según el tipo de documento/cliente/opción de
programa (`CheckProgramOption` en la UI Ext JS original). Para el piloto,
ningún complemento entra en alcance (ver `CLAUDE.md`) — este documento deja
la estructura lista para cuando se agreguen, pero no prescribe su
implementación todavía.

## Aplicación a otros módulos "documento" (fuera del piloto)

Cuando se especifique el segundo módulo tipo documento (ver
`docs/plan-implementacion.md`, Fase 4+), reusar este documento como base:
las query keys cambian de dominio (`['pedidos', 'search', ...]`), pero la
regla de parcheo y la navegación List↔Master no deberían necesitar
redecidirse — si un módulo nuevo rompe alguna de estas reglas (ej. su
`Add`/`Update` no regresa `record` completo), es una señal para homologar
ese endpoint en el backend (`SisnetV3Desarrollo`, repo separado) antes de
forzar una excepción aquí.
