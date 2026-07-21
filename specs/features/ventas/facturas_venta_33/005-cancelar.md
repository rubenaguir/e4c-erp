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

La máquina de estados y el comportamiento de 2 fases de `Cancel33` ya están
resueltos por ADR-016 (`docs/decisiones.md`) — lo pendiente es solo la
captura puntual del shape exacto de `cancelacion_estatus` en cada fase, no
el comportamiento en sí. La UI debe reflejar el estado "cancelación en
curso" (vía `cancelacion_estatus`) y **no** deshabilitar el botón "Cancelar"
tras la primera llamada — el usuario necesita poder volver a presionarlo
más tarde para completar la segunda fase.

**Hallazgo (prueba real de sesión anterior)**: antes del flujo de 2 fases
de arriba, `Cancel33` valida un gate de autorización jerárquica
(`ventas_facturas_autoriza_*`, configurado a nivel `empresa_id`) que puede
rechazar la llamada por completo con `Code: 4` ("La factura tiene
autorizaciones pendientes: ...") sin llegar siquiera a la solicitud SAT —
ver `specs/api-contracts/ventas/facturas.md`, sección `Cancel33`.
**Decisión de alcance**: el módulo de autorizaciones jerárquicas queda
fuera del piloto (ver `CLAUDE.md`, "Alcance del MVP") — el piloto no
construye pantalla de aprobación propia, solo muestra el error del backend
tal cual (ver caso Given/When/Then correspondiente abajo).

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
Given una factura con estatus "R" (ya timbrada)
When el usuario confirma cancelación con un motivo del catálogo SAT
     (02, 03 o 04)
Then se llama Cancel33(serie, folio, motivo) — sin folio_sustitucion
  And el resultado sigue el flujo de 2 fases documentado abajo (primera
      llamada = solicitud, segunda llamada = confirmación) — ver ADR-016
```

### Caso: cancelar factura timbrada — primera fase (solicitud ante el SAT)

```
Given una factura con estatus "R" sin solicitud de cancelación previa
     (cancelacion_estatus vacío/null)
When el usuario confirma cancelación con un motivo del catálogo SAT
Then se llama Cancel33(serie, folio, motivo[, folio_sustitucion])
  And la respuesta trae record con estatus todavía "R" (sin cambiar)
  And record.cancelacion_estatus refleja la solicitud en curso
  And la UI muestra el estado "cancelación en proceso" sin deshabilitar
      el botón "Cancelar" — el usuario debe poder volver a presionarlo
      más tarde (ver ADR-016, docs/decisiones.md)
```

### Caso: cancelar factura timbrada — segunda fase (SAT ya aceptó)

```
Given una factura con estatus "R" y una cancelación ya aceptada por el
     receptor en el portal del SAT (solicitada en una llamada previa a
     Cancel33)
When el usuario presiona "Cancelar" de nuevo sobre la misma factura
Then se llama Cancel33(serie, folio, motivo[, folio_sustitucion]) otra vez
  And Cancel33 re-consulta el estatus real en el SAT
  And la respuesta trae record con estatus "C"
  And se revierte el efecto en cuentas por cobrar
  And record parchea la cache de la lista (feature 002) — sin refetch
```

### Caso: cancelar factura timbrada — con autorizaciones pendientes

```
Given una factura con estatus "R" con autorizaciones pendientes
     (ventas_facturas_autoriza_*, ver hallazgo arriba)
When el usuario presiona "Cancelar"
Then Cancel33 responde Code 4 con el mensaje del backend tal cual
     ("La factura tiene autorizaciones pendientes: ...")
  And se muestra ese mensaje vía el manejo de SisnetError ya existente
      (sin pantalla ni flujo de aprobación propio en este piloto)
  And el usuario resuelve la autorización desde la UI legacy de
      Sisnet V3, fuera de este repo — el estatus de la factura no cambia
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

- El comportamiento de 2 fases de `Cancel33` ya está resuelto por ADR-016
  (`docs/decisiones.md`) — no hace falta polling: es el mismo usuario
  presionando "Cancelar" de nuevo, no un proceso automático. Falta solo la
  captura puntual del shape exacto de `cancelacion_estatus` en cada fase
  (ver `specs/api-contracts/ventas/facturas.md`, sección `Cancel33`).
