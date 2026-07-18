# API Contract — LOV (catálogos de autocompletar)

Patrón genérico de autocompletar/lista de valores. Dos variantes en Sisnet
V3: LOV **globales** (`Lov:Lov:Lov:...`, reusables entre módulos) y LOV
**propios de un módulo** (ej. `facturas_venta_conceptos:LoadLovFieldSku`,
solo aplican a `facturas_venta_33`).

Ver convenciones compartidas en `specs/api-contracts/README.md`.

## `opReq=Lov:Lov:Lov:LoadLovFieldClientes`

Autocompletar de clientes al capturar el campo cliente de una factura.
Requiere sesión.

**Request**
| Parámetro | Tipo | Notas |
|---|---|---|
| `pageSize` | number | visto `500` en captura real — no hay evidencia de paginación real (`start`/`limit`), parece traer todo hasta `pageSize` |

**Response 200**: `{"totalCount": number, "records": cliente[]}` — ver
`specs/entities/cliente.md` para el shape de cada registro.

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 199-276.

## `opReq=Lov:Lov:Lov:ValidateLovFieldClientes`

Valida un `cliente_id` capturado directamente (sin pasar por el
autocompletar) y regresa sus datos para precargar el formulario. Requiere
sesión.

**Request**: `{ "cliente_id": "string" }`

**Response 200**: el objeto `cliente` completo, **sin envolver** (no
`{records: [...]}`, es el objeto directo) — ver
`specs/entities/cliente.md`.

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 278-321.

## `opReq=ventas:facturas_venta_33:facturas_venta_conceptos:LoadLovFieldSku`

Autocompletar de SKU al capturar un renglón del grid de conceptos. Propio
del módulo `facturas_venta_33` — no es un LOV global. Requiere sesión.

**Request**
| Parámetro | Tipo | Notas |
|---|---|---|
| `start` | number | visto `0` |
| `limit` | number | visto `500` |
| `pageSize` | number | visto `500`, redundante con `limit` en la captura real |
| `lista_precios_id` | string | opcional, puede venir vacío — filtra precios por lista si se especifica |

**Response 200**: `{"totalCount": number, "records": concepto[]}` (shape de
LOV de SKU, ver la sección "Solo en `LoadLovFieldSku`/`ValidateSku`" de
`specs/entities/concepto.md` — **no** es el mismo shape que
`factura.conceptos[]`).

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 465-579.

## `opReq=ventas:facturas_venta_33:facturas_venta_conceptos:ValidateSku`

Valida un `sku` capturado directamente. Requiere sesión.

**Request**: `{ "sku": "string", "lista_precios_id": "string (opcional, puede venir vacío)" }`

**Response 200**: el objeto `concepto` (shape de LOV de SKU) completo, sin
envolver. Incluye `estatus` (no presente en `LoadLovFieldSku`).

**Errores**: si el SKU no existe o no está activo, el backend lanza
excepción (`ALERT_USUARIO`) — se recibe como el shape de error genérico de
`specs/api-contracts/README.md`, no un `200` con objeto vacío.

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 583-655.

## Inconsistencia conocida (no corregir, documentar)

`ValidateLovFieldFacturaRelacion` (otro LOV propio de `facturas_venta_33`,
fuera de alcance del piloto) regresa el objeto plano igual que
`ValidateLovFieldClientes`/`ValidateSku` de arriba — el patrón "Load regresa
`{records}` o `{totalCount, records}`, Validate regresa el objeto plano sin
envolver" es consistente entre los LOV auditados hasta ahora. Si un LOV
nuevo rompe este patrón, documentarlo como excepción explícita, no
normalizar la spec para que "encaje".
