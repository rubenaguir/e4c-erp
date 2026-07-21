# Feature 005 — Timbrar factura

## Propósito

Convierte una pre-factura (`estatus = "P"`) en un documento fiscal
timbrado ante el SAT. Acción irreversible salvo cancelación (feature 006).

## Entidades involucradas

`factura` (mutación de estatus + asignación de `uuid`).

## Precondiciones

Sesión válida. La factura tiene `estatus = "P"`, `uuid = null`, y al menos
un concepto capturado.

## Estado confirmado (prueba real, WAMP local, esta sesión)

`Stamp` es **síncrono**: la misma respuesta ya trae el documento con
`estatus = "R"` y `uuid` asignado — no hace falta polling ni
`LoadEstatusSAT` para saber si el timbrado tuvo éxito. Confirmado con una
prueba real contra el backend local (`specs/api-contracts/ventas/facturas.md`,
sección `Stamp`) y resuelto conceptualmente por ADR-016
(`docs/decisiones.md`). El bloqueante que marcaba esta feature como "no
lista para implementar" queda levantado.

## Casos Given/When/Then

### Caso: timbrado exitoso

```
Given una pre-factura válida (al menos un concepto, cliente con RFC válido)
When el usuario confirma "Timbrar"
Then se llama Stamp con el payload completo del formulario
  And la respuesta trae record con estatus = "R" y uuid asignado (síncrono,
      confirmado con prueba real)
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

- ~~Estado final real del documento tras `Stamp`~~ / ~~síncrono vs.
  asíncrono~~ — resuelto: síncrono, ver "Estado confirmado" arriba.
- `record.estatus_sat` vino poblado (`"Vigente"`) directamente en la
  respuesta de `Stamp` en la prueba real — no confirmado si esto es
  consistente en todos los casos o si conviene igual disparar
  `LoadEstatusSAT` como refresco explícito post-timbrado; no bloqueante
  para implementar esta feature.
