# Feature 005 — Timbrar factura

## Propósito

Convierte una pre-factura (`estatus = "P"`) en un documento fiscal
timbrado ante el SAT. Acción irreversible salvo cancelación (feature 006).

## Entidades involucradas

`factura` (mutación de estatus + asignación de `uuid`).

## Precondiciones

Sesión válida. La factura tiene `estatus = "P"`, `uuid = null`, y al menos
un concepto capturado.

## ⚠ Bloqueante antes de implementar

`specs/api-contracts/ventas/facturas.md` marca explícitamente que el shape de
respuesta observado de `Stamp` en la única captura disponible (
`e4c-factura/docs/spec/09-sv3-contracts.md:943-1013`) **no confirma** que
el documento termine con `uuid` asignado y `estatus` distinto de `"P"` — la
captura está truncada y el `record` de ejemplo todavía muestra
`estatus: "P"`, `uuid: null`. Antes de escribir el hook `useStampFactura` u
otra implementación de esta feature, **capturar un `Stamp` real contra el
backend local** y confirmar cuál es el estado final del documento
(¿síncrono? ¿asíncrono, requiere `LoadEstatusSAT` después?).

## Casos Given/When/Then (sujetos a confirmar con la captura real de arriba)

### Caso: timbrado exitoso

```
Given una pre-factura válida (al menos un concepto, cliente con RFC válido)
When el usuario confirma "Timbrar"
Then se llama Stamp con el payload completo del formulario
  And la respuesta trae record — su estatus/uuid final se confirma según
      la captura real pendiente (ver bloqueante arriba), no se asume aquí
  And record parchea la cache de la lista (feature 002) vía
      queryClient.setQueryData, igual que en las features 003/004
  And el toolbar del Master deshabilita "Guardar"/"Guardar pre-factura" una
      vez timbrado (paridad con la UI Ext JS original,
      facturas_venta.js:835-837 — deshabilita BTN_guardar y
      BTN_guardar_prefactura tras cualquier guardado con estatus resuelto)
```

### Caso: timbrado falla (rechazo del PAC/SAT)

```
Given un timbrado que el PAC rechaza (ej. RFC de receptor no válido ante el
      SAT)
When se llama Stamp
Then se recibe el shape de error genérico (specs/api-contracts/README.md)
  And la pre-factura permanece en estatus "P" (no se pierde el trabajo
      capturado) — comportamiento esperado por analogía con el resto del
      backend, no confirmado con captura real de este caso específico
```

## Referencia a contrato de API

`specs/api-contracts/ventas/facturas.md` — `Stamp`.

## Preguntas abiertas

- **Bloqueante** (ver arriba): estado final real del documento tras `Stamp`.
- Si el timbrado es asíncrono, ¿el frontend debe hacer polling con
  `LoadEstatusSAT` (agent auditado en `facturas_venta.php:456`, no
  documentado todavía en `specs/api-contracts/ventas/facturas.md`) o el `Stamp`
  original ya es síncrono de punta a punta? Definir antes de implementar.
