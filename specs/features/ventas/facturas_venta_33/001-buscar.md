# Feature 002 — Buscar facturas (List)

## Propósito

Vista de lista del patrón List-Master-Detail para `facturas_venta_33`. Es
la pantalla de entrada del piloto — desde aquí se abre el Master (feature
003 en adelante) y aquí es donde debe verse, sin refresh, el efecto de
cualquier alta/edición hecha en el Master.

## Entidades involucradas

`factura` (shape angosto de `Search` — ver `specs/entities/ventas/factura.md`).

## Precondiciones

Sesión válida (feature 001).

## Casos Given/When/Then

### Caso: búsqueda inicial

```
Given la pantalla de listado se monta por primera vez
When se ejecuta Search sin filtro de fecha, solo con paginado por defecto
     (start=0, limit fijo — ver "Decisiones de diseño")
Then se puebla la cache de TanStack Query bajo una query key estable
     (ej. ['facturas', 'search', filtros]) con {totalCount, records}
```

### Caso: aplicar filtros

```
Given el usuario captura filtros (serie, folio, rfc, nombre, estatus,
      fechas, pedido)
When se dispara la búsqueda
Then se ejecuta un nuevo Search con esos parámetros
  And se actualiza la cache bajo la query key correspondiente a esos filtros
      (no se muta la cache de la búsqueda anterior)
```

### Caso: volver de un detalle sin refresh (regla central del proyecto)

```
Given el usuario abrió una factura desde el listado (feature 003+)
When regresa al listado (sin haber guardado cambios, o después de guardar)
Then el listado NO vuelve a llamar Search
  And si hubo una mutación (alta/edición/timbrado/cancelación) en el
      detalle, el registro correspondiente en la cache del listado ya
      refleja los cambios — parcheado por la mutación misma (ver
      specs/ui-screens/patron-documento-list-master-detail.md), no por un
      refetch disparado al volver
```

## Referencia a contrato de API

`specs/api-contracts/ventas/facturas.md` — `Search`.

## Referencia al patrón de pantalla

`specs/ui-screens/patron-documento-list-master-detail.md` — contrato exacto
de la query key y de cómo cada mutación parchea esta cache.

## Decisiones de diseño

- Filtros por defecto al montar la pantalla: **sin filtro de fecha**, solo
  paginado (`start`/`limit`) — trae los registros más recientes de
  cualquier fecha. Se prefirió sobre un rango tipo "mes actual" para no
  ocultar facturas recientes que caigan fuera de un corte arbitrario de
  calendario.
