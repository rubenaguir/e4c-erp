# Entity: `cliente`

## Propósito

Cliente al que se le puede facturar. En el piloto solo se consume vía LOV
(`Lov:Lov:Lov:LoadLovFieldClientes`/`ValidateLovFieldClientes`) para
seleccionar/precargar datos en el formulario de factura — el catálogo de
clientes como pantalla propia (CRUD completo) es el patrón "catálogo",
fuera de alcance del piloto (ver `CLAUDE.md`).

## Campos observados

Fuente: `e4c-factura/docs/spec/09-sv3-contracts.md`, endpoints
`LoadLovFieldClientes` (líneas 199-276) y `ValidateLovFieldClientes` (líneas
278-321) — capturas reales, empresa `DEMO`.

| Campo | Tipo (tal cual llega) | Notas |
|---|---|---|
| `empresa_id` | string | solo en `LoadLovFieldClientes`, ausente en `ValidateLovFieldClientes` |
| `cliente_id` | string | |
| `corporativo_id` | string | igual a `cliente_id` en los ejemplos observados — relación exacta sin confirmar, no asumir que siempre coinciden |
| `rfc` | string | puede ser genérico (`XEXX010101000`) para público en general |
| `nombre` | string | |
| `calle`, `no_interior`, `no_exterior`, `colonia`, `localidad`, `referencia`, `municipio`, `estado`, `pais`, `codigo_postal` | string \| null | domicilio fiscal |
| `metodo_de_pago` / `metodo_de_pago_descr` | string \| null | preferencia guardada del cliente, precarga el formulario de factura |
| `lista_precios_id` | string | puede venir `""` (string vacío, no `null`) cuando no tiene lista asignada |
| `vendedor_id` / `vendedor_nombre` | string \| null | |
| `num_cta_pago` | string \| null | |
| `dias_credito` | string numérico | |
| `limite_credito` | string numérico | |
| `fecha_vencimiento` | string `dd/mm/aaaa` | vigencia del cliente, no de un documento |
| `estatus` | string enum | `A` activo, `I` inactivo (visto en captura real) — confirmar catálogo completo antes de asumir que son los únicos dos valores |
| `regimen_fiscal_id` | string | catálogo SAT c_RegimenFiscal |

## Invariantes de negocio observadas

- `ValidateLovFieldClientes` se dispara al capturar directamente un
  `cliente_id` en el campo de cliente de la pantalla de factura (no solo al
  seleccionar de una lista) — ver `specs/api-contracts/lov.md`.
- Un cliente con `estatus = "I"` sigue siendo devuelto por
  `LoadLovFieldClientes` (visto en la captura real, línea 271 de
  `09-sv3-contracts.md`) — el frontend debe decidir si lo filtra/marca
  visualmente, el backend no lo excluye del LOV.

## Fuente

`e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 199-321.
