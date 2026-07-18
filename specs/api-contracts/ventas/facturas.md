# API Contract — Facturas (`facturas_venta_33`)

Núcleo del piloto. Cubre `specs/features/ventas/facturas_venta_33/001-*.md`
a `005-*.md`. Todo
`opReq` de este documento tiene el prefijo
`ventas:facturas_venta_33:facturas_venta:` salvo que se indique otro
controlador.

Ver convenciones compartidas en `specs/api-contracts/README.md` y el shape
de `factura`/`concepto` en `specs/entities/`.

**Fuera de alcance de este contrato** (ver `CLAUDE.md`, "Alcance del MVP"):
adendas de cliente, `CancelCFDI` (huérfana en la UI Ext JS original, con un
bug de integridad conocido — marca `estatus='C'` incondicionalmente incluso
sin confirmación real del SAT), `ProcesaCancelacionInterface` (deep-link de
confirmación externa), complementos de nicho (comercio exterior, detallista,
instituciones educativas, servicio parcial de construcción).

## `opReq=...:Search`

Listado paginado de facturas. Requiere sesión.

**Request**
| Parámetro | Tipo | Notas |
|---|---|---|
| `fecha_inicial` / `fecha_final` | string `dd/mm/aaaa` | opcionales |
| `rfc` / `nombre` | string | opcionales, filtro de receptor |
| `serie` / `folio` | string | opcionales |
| `pedido_serie` / `pedido_folio` | string | opcionales |
| `estatus` | string | opcional, uno de `R`/`P`/`T`/`A`/`C` |
| `disable_sucursal_filter` | string \| vacío | opcional, visto vacío en captura |
| `start` / `limit` | number | paginación estándar |

**Response 200**
```json
{ "totalCount": number, "records": factura[] }
```

El shape de cada registro de `records` es **más angosto** que `Load` — solo
los campos relevantes para el grid del listado (ver
`specs/entities/ventas/factura.md`, campos observados en `Search`: incluye
`saldo`, `num_cta_cobrar`, `estatus_cxc` que no aparecen en `Load`, y
**no** incluye `conceptos`/relaciones anidadas).

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 1-54.

## `opReq=...:Load`

Detalle completo de una factura, para abrir en el Master. Requiere sesión.

**Request**: `{ "empresa_id": "string", "serie": "string", "folio": "string" }`

**Response 200**: objeto `factura` completo — ver `specs/entities/ventas/factura.md`.

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 57-196.

## `opReq=...:LoadPresetClientData`

Al seleccionar un cliente en una factura **nueva**, precarga método de
pago/moneda/forma de pago/uso CFDI/régimen fiscal de la última factura de
ese cliente (evita recapturar esos campos cada vez). Requiere sesión.

**Request**: `{ "cliente_id": "string" }`

**Response 200**: mismo shape que `Load` (objeto `factura` completo, con
datos de la última factura de ese cliente) — ver
`specs/entities/ventas/factura.md`. Si el cliente no tiene facturas previas,
comportamiento no confirmado con captura real (¿objeto vacío? ¿error?) —
verificar antes de implementar el caso "cliente nuevo" en
`specs/features/ventas/facturas_venta_33/002-crear-prefactura.md`.

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 323-462.

## `opReq=...:AddPrefactura`

Crea una factura sin timbrar (`estatus = "P"`). Es el alta real que usa el
piloto — no `Add` directo (que crea y timbra en un solo paso; fuera de
alcance del piloto por ahora, ver
`specs/features/ventas/facturas_venta_33/002-*.md`). Requiere
sesión.

**Request**: el objeto `factura` completo tal como lo captura el
formulario (todos los campos editables de encabezado) + `conceptos[]`
(array, formato `conceptos[0][sku]=...`, ver
`specs/api-contracts/README.md`) + los objetos de complementos
(`compl_serv_par_construc`, `info_seguros`, `comercio_exterior`,
`detallista`) **vacíos pero presentes** en la captura real — no confirmado
si el backend los requiere presentes aunque vacíos o si se pueden omitir.

**Response 200**
```json
{ "msg": "string", "log": "string", "record": { /* objeto factura completo, con folio ya asignado */ } }
```

Esta es la respuesta que dispara el parcheo de la cache del listado (ver
`specs/ui-screens/patron-documento-list-master-detail.md`): `record` trae
el `folio` recién asignado por el backend, que el frontend no puede
predecir de antemano.

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 658-797.

## `opReq=...:UpdatePrefactura`

Edita una pre-factura existente (`estatus = "P"`, sin `uuid`). Se puede
llamar múltiples veces hasta timbrar. Requiere sesión.

**Request**: mismo shape que `AddPrefactura` + `serie`/`folio` (la llave del
documento a actualizar) + `estatus="P"` explícito en el body (visto en la
captura real).

**Response 200**: mismo shape que `AddPrefactura`
(`{msg, log, record}`), con los totales recalculados.

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 799-940.

## `opReq=...:Stamp`

Timbra una pre-factura ante el SAT — la convierte de `estatus = "P"` a
documento fiscal con `uuid`. Requiere sesión.

**Request**: mismo shape que `UpdatePrefactura` (el formulario completo,
incluyendo `serie`/`folio` de la pre-factura a timbrar).

**Response 200**: `{msg, log, record}` — el `record` de la captura real
todavía trae `"estatus": "P"` y `"uuid": null` (línea 1002 y 970 de
`09-sv3-contracts.md`), lo cual es sospechoso para una operación de
"timbrado" — **no confirmado si esto es el estado real post-timbrado o un
artefacto de la captura de ejemplo** (posible timbrado asíncrono, o la
captura se hizo contra un ambiente sin PAC configurado). Verificar con una
prueba real contra el backend local antes de implementar
`specs/features/ventas/facturas_venta_33/004-timbrar.md` — no asumir que `Stamp` deja al
documento en `estatus = "P"` sin confirmarlo.

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 943-1013
(respuesta truncada en la captura leída — confirmar el resto de los campos,
en particular `uuid` y `estatus` finales, antes de dar esta spec por
completa).

## `opReq=...:Cancel33`

Cancelación SAT de una factura **ya timbrada** (`estatus` distinto de
`"P"`). Ruta vigente confirmada por auditoría de código — es la que dispara
el botón "Cancelar" del toolbar cuando el documento no es pre-factura.
Requiere sesión.

**Request** (por auditoría de código,
`SisnetV3Desarrollo/modules/ventas/facturas_venta_33/facturas_venta.php:4087`
— sin captura real de JSON, solo lectura de fuente):
| Parámetro | Tipo | Notas |
|---|---|---|
| `serie` / `folio` | string | |
| `motivo` | string | catálogo SAT de motivo de cancelación (`01`-`04`) |
| `folio_sustitucion` | string | requerido solo si `motivo = "01"` |

**Response 200** (shape confirmado por lectura de código,
`facturas_venta.php:4178-4182` — no captura real):
```json
{ "msg": "string", "log": "string", "record": { /* factura con estatus actualizado si el SAT confirmó la cancelación */ } }
```

Por auditoría de código: la cancelación real ante el SAT es condicional —
`record.estatus` solo cambia a `"C"` si el SAT confirmó la cancelación, no
de forma incondicional. Confirmar con una prueba real antes de implementar
el manejo del caso "cancelación en proceso" (SAT puede regresar "pendiente"
en vez de confirmar de inmediato).

## `opReq=...:Cancel`

Cancelación de una **pre-factura** (`estatus = "P"`, sin `uuid` — o con
`uuid` en el caso raro de una prefactura que ya se timbró por error). Es la
rama que dispara el mismo botón "Cancelar" cuando el documento sigue en
`estatus = "P"`.

**Request** (por auditoría de código,
`facturas_venta.php:4804` — sin captura real): `{ "serie": "string", "folio": "string" }`
— sin `motivo`/`folio_sustitucion` (no aplica, no hay CFDI que cancelar ante
el SAT en el caso normal).

**Response 200** (por auditoría de código, `facturas_venta.php:5110-5114`):
```json
{ "msg": "string", "log": "string", "record": { /* factura con estatus = "C" */ } }
```

## Regla de decisión Cancel vs. Cancel33 (para el frontend)

```
Given una factura con estatus === "P"
When el usuario confirma cancelación
Then llamar a Cancel (sin pedir motivo SAT)

Given una factura con estatus !== "P" (ya timbrada)
When el usuario confirma cancelación
Then pedir motivo (01-04) y folio_sustitucion si motivo === "01"
  And llamar a Cancel33
```

## `opReq=...:SendMail`

Envía el PDF+XML de una factura por correo. Requiere sesión. **Sin captura
real ni auditoría de código detallada en esta ronda** — pendiente antes de
implementar `specs/features/` que lo requiera. No asumir su shape.

## `opReq=...:PrintPdf`

Genera el PDF de una factura individual. `resultType = "pdf"` — no es JSON,
es un stream binario (ver `specs/api-contracts/README.md` sobre
`responseType: 'blob'` en `sisnet-client.ts`). **Sin captura real de
parámetros exactos en esta ronda** — pendiente antes de implementar.

## Preguntas abiertas

- Confirmar con prueba real el estado post-`Stamp` (ver nota arriba) — es
  crítico porque define el criterio de éxito de "timbrar factura".
- Capturar `Cancel33`/`Cancel` reales (con JSON de request/response) antes
  de implementar `specs/features/ventas/facturas_venta_33/005-cancelar.md` — hoy la spec
  descansa en lectura de código, no en observación directa.
- `SendMail`/`PrintPdf`: capturar antes de que una feature los necesite.
