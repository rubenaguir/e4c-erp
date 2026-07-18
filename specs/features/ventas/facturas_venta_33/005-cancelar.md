# Feature 006 — Cancelar factura

## Propósito

Cancela una factura, ya sea una pre-factura sin timbrar (`Cancel`) o una
factura timbrada ante el SAT (`Cancel33`) — ver la regla de decisión en
`specs/api-contracts/ventas/facturas.md`.

## Entidades involucradas

`factura` (mutación de estatus a `"C"`).

## Precondiciones

Sesión válida. La factura no está ya cancelada.

## ⚠ Antes de implementar

`specs/api-contracts/ventas/facturas.md` marca `Cancel`/`Cancel33` como
documentados solo por lectura de código fuente (`facturas_venta.php`), sin
captura real de JSON de request/response. Capturar al menos un `Cancel33`
real contra el backend local (con un `motivo` distinto de `"01"` para evitar
también tener que resolver `folio_sustitucion`) antes de dar esta feature
por lista para implementar.

## Casos Given/When/Then

### Caso: cancelar pre-factura (sin timbrar)

```
Given una factura con estatus "P"
When el usuario confirma cancelación
Then se llama Cancel(serie, folio) — sin pedir motivo SAT
  And la respuesta trae record con estatus "C"
  And record parchea la cache de la lista (feature 002) — sin refetch
```

### Caso: cancelar factura timbrada — motivo distinto de "01"

```
Given una factura con estatus distinto de "P" (ya timbrada)
When el usuario confirma cancelación con un motivo del catálogo SAT
     (02, 03 o 04)
Then se llama Cancel33(serie, folio, motivo) — sin folio_sustitucion
  And la respuesta trae record; su estatus final depende de si el SAT
      confirmó la cancelación de inmediato o quedó "en proceso" — no
      asumir confirmación inmediata sin verificar con la captura real
      pendiente (ver bloqueante arriba)
```

### Caso: cancelar factura timbrada — motivo "01" (sustitución)

```
Given una factura con estatus distinto de "P"
When el usuario elige motivo "01" (comprobante emitido con errores, con
     relación)
Then el formulario de cancelación EXIGE folio_sustitucion antes de permitir
     confirmar (validación de UI, espejo de la regla de negocio del backend
     — facturas_venta.php:4087 y siguientes)
  And se llama Cancel33(serie, folio, motivo="01", folio_sustitucion)
```

## Referencia a contrato de API

`specs/api-contracts/ventas/facturas.md` — `Cancel`, `Cancel33`.

## Fuera de alcance (explícito)

`CancelCFDI` no se implementa — es una ruta huérfana en la UI Ext JS
original (menú comentado) con un bug de integridad conocido (marca
`estatus='C'` incondicionalmente). Ver `CLAUDE.md`, "Alcance del MVP".

## Preguntas abiertas

- Estado final real tras `Cancel33` cuando el SAT no confirma de inmediato
  (¿"en proceso"? ¿el frontend debe hacer polling?) — mismo tipo de
  pregunta que en `specs/features/ventas/facturas_venta_33/004-timbrar.md`, pendiente de
  captura real.
