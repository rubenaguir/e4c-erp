# Feature 004 — Editar pre-factura (Master, edición)

## Propósito

Edición de una pre-factura ya guardada (`estatus = "P"`, sin `uuid`).
Se puede llamar múltiples veces hasta timbrar (feature 005).

## Entidades involucradas

`factura` (edición), `concepto` (edición del grid inline).

## Precondiciones

Sesión válida. La factura existe, tiene `estatus = "P"` y `uuid = null`.

## Casos Given/When/Then

### Caso: abrir una pre-factura existente desde el listado

```
Given el usuario selecciona una factura con estatus "P" en el listado
When abre el detalle
Then se llama Load(empresa_id, serie, folio)
  And el formulario se puebla con el objeto factura completo, incluyendo
      conceptos[] ya capturados
```

### Caso: editar y guardar (postcondición central)

```
Given el Master tiene cambios pendientes (encabezado y/o conceptos)
When el usuario guarda
Then se llama UpdatePrefactura con serie/folio + el payload completo
     actualizado
  And la respuesta trae record con la factura recalculada
  And ese record reemplaza (no se agrega, ya existe) el registro
      correspondiente en la cache de la lista (feature 002) vía
      queryClient.setQueryData — SIN volver a llamar Search
```

### Caso: navegar al documento siguiente/anterior (ADR-013)

```
Given el Master está abierto sobre un documento que pertenece al resultado
     de Search ya cargado en memoria (['facturas', 'search', filtrosActivos])
When el usuario usa el control de navegación siguiente/anterior
Then el frontend calcula la posición del documento actual dentro de ese
     arreglo en cache (sin llamar Search de nuevo) y llama Load sobre el
     serie/folio del documento adyacente
  And si el documento actual es el primero o el último del lote cargado,
      el control correspondiente se deshabilita (el piloto no auto-pagina)
  And si el usuario cambió los filtros de búsqueda desde que abrió el
      Master, la navegación sigue referida a la búsqueda con la que se
      abrió, no a una nueva
```

### Caso: factura ya timbrada (guardia de negocio, no solo de UI)

```
Given una factura con uuid != null (ya timbrada)
When se intenta editar
Then el frontend NO debe ofrecer la acción de editar (Master en modo
     solo-lectura salvo notas_impresion, ver
     specs/api-contracts/ventas/facturas.md — UpdateNotasImpresion, fuera de
     alcance del piloto por ahora)
  And si de todas formas se llega a llamar UpdatePrefactura sobre un
      documento timbrado, el comportamiento del backend no está confirmado
      con captura real — no asumir que lo rechaza limpiamente, verificar
      antes de confiar en esa guardia solo del lado del backend
```

## Referencia a contrato de API

`specs/api-contracts/ventas/facturas.md` — `Load`, `UpdatePrefactura`.

## Referencia al patrón de pantalla

`specs/ui-screens/patron-documento-list-master-detail.md`.

## Preguntas abiertas

- Confirmar el comportamiento real de `UpdatePrefactura` sobre un documento
  ya timbrado (ver caso de arriba) antes de decidir si el frontend confía
  únicamente en su propia guardia de UI.
