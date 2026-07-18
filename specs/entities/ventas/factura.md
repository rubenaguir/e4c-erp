# Entity: `factura`

## Propósito

Documento de venta con timbrado fiscal CFDI 4.0 (o pre-factura sin
timbrar, `estatus = "P"`). Entidad central del piloto — ver
`docs/arquitectura.md`.

## Campos observados

Fuente: `Load`/`AddPrefactura` reales capturados en
`e4c-factura/docs/spec/09-sv3-contracts.md` (líneas 71-196 y 672-797) y la
auditoría de `SisnetV3Desarrollo/modules/ventas/facturas_venta_33/facturas_venta.php`
de la sesión de origen de este proyecto (ver `docs/plan-implementacion.md`,
Fase 0).

Todos los campos numéricos llegan como **string** — ver
`specs/api-contracts/README.md`.

| Campo | Tipo (tal cual llega) | Notas |
|---|---|---|
| `empresa_id` | string | |
| `sucursal_id` | string | solo en `Search`, no en `Load` |
| `serie` / `folio` | string | llave del documento junto con `empresa_id` |
| `version` | string | `"4.0"` — versión de CFDI |
| `uuid` | string \| null | `null` mientras no está timbrado (`estatus = "P"`) |
| `cliente_id` | string | |
| `receptor_rfc` / `receptor_nombre` | string | snapshot del cliente al momento de facturar |
| `fecha` | string `dd/mm/aaaa hh:mm[:ss]` | no ISO 8601 — parsear con cuidado |
| `fecha_vencimiento` | string `dd/mm/aaaa` | |
| `estatus` | string enum | `R` registrado, `P` prefactura, `T` timbrado, `A` autorizado, `C` cancelado — ver `docs/design-brief.md` |
| `estatus_sat` | string \| null | ej. `"Vigente"` — viene del PAC, no es el mismo enum que `estatus` |
| `cancelacion_estatus` / `cancelacion_motivo` / `cancelacion_motivo_descr` / `cancelacion_cfdi_reemplaza` / `cancelacion_acuse` | string \| null | solo relevantes cuando `estatus = "C"` o hay una solicitud de cancelación en curso |
| `sub_total_conceptos` / `sub_total` / `descuento` / `total_impuestos_retenidos` / `total_impuestos_trasladados` / `total` | string numérico | |
| `sub_total_imp_locales` / `total_imp_local_retenciones` / `total_imp_local_traslados` | string numérico | impuestos locales (ISR/IEPS estatal, no federales) |
| `moneda_id` / `tipo_cambio` | string | |
| `forma_pago` / `forma_pago_descr` | string | catálogo SAT c_FormaPago |
| `metodo_de_pago` / `metodo_pago` / `metodo_pago_descr` | string | ojo: dos campos distintos (`metodo_de_pago` = clave numérica interna, `metodo_pago` = clave SAT `PUE`/`PPD`) — no unificar sin confirmar con el backend |
| `uso_id` / `uso_descr` | string | catálogo SAT c_UsoCFDI |
| `regimen_fiscal_id` | string | catálogo SAT c_RegimenFiscal, del **receptor** en este contexto |
| `emisor_rfc` / `emisor_nombre` | string | de la empresa emisora, no editable desde el frontend |
| `calle`, `no_exterior`, `no_interior`, `colonia`, `localidad`, `referencia`, `municipio`, `estado`, `pais`, `codigo_postal` | string | domicilio fiscal del receptor, snapshot al momento de facturar |
| `vendedor_id` / `vendedor_nombre` | string \| null | |
| `centro_utilidad_id` / `centro_costo_id` | string \| null | |
| `observaciones` / `notas_impresion` | string \| null | `notas_impresion` es editable post-timbrado vía `UpdateNotasImpresion` (ver `specs/api-contracts/ventas/facturas.md`) |
| `actualizacion_usuario_id` / `actualizacion_fecha` | string | auditoría, no editable |

## Relaciones (anidadas en `Load`/`AddPrefactura`/`UpdatePrefactura`/`Stamp`)

| Campo | Tipo | Notas |
|---|---|---|
| `conceptos` | `concepto[]` | ver `specs/entities/concepto.md` — siempre presente, el grid inline del Master |
| `impuestos_locales` | array de `{impuesto, importe, tasa, aplicacion}` | nivel documento, no por concepto |
| `info_seguros` | array | complemento de seguros — fuera de alcance del piloto (ver `CLAUDE.md`) |
| `compl_serv_parc_construc` | array | complemento servicio parcial de construcción — fuera de alcance del piloto |
| `pedidos` | `{totalCount, records}` | pedidos de venta relacionados a esta factura |
| `salidas` | `{totalCount, records}` | salidas de almacén relacionadas |
| `reportes_consigna` | `{totalCount, records}` | reportes de consigna relacionados |
| `documentos` | array | documentos relacionados (CFDI relacionados) |
| `comercio_exterior` | `{mercancias: []}` | complemento comercio exterior — fuera de alcance del piloto |

## Invariantes de negocio observadas

- `estatus = "P"` (prefactura) implica `uuid = null`. Solo se puede editar
  con `UpdatePrefactura` mientras esté en este estatus; una vez timbrada
  (`Stamp`), pasa a tener `uuid` y a comportarse como documento fiscal
  inmutable salvo cancelación.
- `estatus = "C"` es terminal salvo el caso especial de pre-factura
  cancelada (ver `specs/api-contracts/ventas/facturas.md`, distinción
  `Cancel`/`Cancel33`).
- El shape de `Search` (listado) es más angosto que el de `Load` (detalle) —
  no asumir que todos los campos de esta spec están presentes en un registro
  de listado. Ver `specs/api-contracts/ventas/facturas.md`.

## Fuente

- `e4c-factura/docs/spec/09-sv3-contracts.md`, endpoints `Load` (líneas
  57-196), `AddPrefactura` (líneas 658-797), `UpdatePrefactura` (líneas
  799-940) — capturas reales, empresa `DEMO`.
- Auditoría de `facturas_venta.php` (`SisnetV3Desarrollo`) de la sesión de
  origen — funciones `GetFactura` (línea 548), `Add`/`AddPrefactura`/
  `UpdatePrefactura`/`Stamp` (líneas 3326-3503).
