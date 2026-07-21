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
`specs/entities/ventas/factura.md`.

**Confirmado con prueba real** (WAMP local, empresa `DEMO`, esta sesión):
si el cliente **no tiene facturas previas**, la respuesta es un **arreglo
vacío `[]`** (no un objeto `factura`, no un error) — probado con
`cliente_id = "140"` ("Test Company SA de CV...", sin facturas, confirmado
por `Search` con su `rfc` regresando `totalCount: 0`). El frontend debe
verificar `Array.isArray(response)` (o `!response || Array.isArray
(response)`) antes de tratar la respuesta como objeto `factura` para
precargar el formulario — un cliente nuevo simplemente no precarga nada.

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

**Response 200**: `{msg, log, record}`. Por ADR-016 (`docs/decisiones.md`,
explicación directa del dueño del dominio), `Stamp` exitoso deja el
documento en `estatus = "R"` (Registrada) — el `"P"`/`uuid: null` que
todavía se ve en la captura truncada de `09-sv3-contracts.md` (línea 1002 y
970) era un artefacto de esa captura, no el estado real post-timbrado; este
módulo no usa `"T"` como estatus de timbrado (ver
`specs/entities/ventas/factura.md`, invariantes).

**Confirmado con prueba real** (WAMP local, empresa `DEMO`, sesión de esta
ronda): `Stamp` de la prefactura `F-1531` (estatus `"P"`, `uuid: null`)
regresó `record.estatus = "R"`, `record.uuid =
"b79a4912-e781-4443-b7d9-3f9e80e05ab2"`, `record.estatus_sat = "Vigente"` —
confirma la máquina de estados de ADR-016. Nota aparte: `estatus_sat` vino
poblado directamente en esta respuesta de `Stamp` (no `null`), a diferencia
de lo documentado para `Load`/`Search` en
`specs/entities/ventas/factura.md` (carga diferida vía `LoadEstatusSAT`) —
no es contradictorio (es la respuesta de la propia acción de timbrado, no
un `Load`/`Search` posterior), pero no confirmado si `Stamp` siempre lo
puebla o fue específico de esta corrida; no se documenta como invariante
sin una segunda observación.

**Nota de implementación** (no de contrato): el backend requiere que todo
campo escalar presente en `Load` — incluyendo los anidados dentro de cada
`conceptos[i]` como `observaciones` — viaje en el request aunque sea
`null`/vacío; omitirlo produce `Code: 4` ("Undefined array key"). El
cliente HTTP (`sisnet-client.ts`) debe serializar `null` como cadena vacía,
no omitir la llave, para los campos del formulario de `factura`/`concepto`.

**Fuente**: `e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 943-1013 +
ADR-016 + prueba real de esta sesión.

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
{ "msg": "string", "log": "string", "record": { /* factura, ver comportamiento de 2 fases abajo */ } }
```

**Comportamiento de 2 fases (ADR-016, `docs/decisiones.md`)** — `Cancel33`
es el mismo endpoint para ambas llamadas del flujo de cancelación de una
factura `R`:
1. **Primera llamada** (solicitud): pide la cancelación ante el SAT.
   `record.estatus` **no** cambia todavía — sigue en `"R"`. El SAT/receptor
   debe aceptar la cancelación en su propio portal, proceso externo que
   puede tardar horas. La respuesta puebla `cancelacion_estatus` (y
   probablemente `cancelacion_motivo`/`cancelacion_motivo_descr`, ver
   `specs/entities/ventas/factura.md`) para reflejar que hay una solicitud
   en curso.
2. **Segunda llamada** (mismo botón, presionado de nuevo más tarde):
   `Cancel33` re-consulta el estatus real en el SAT; si ya fue aceptada,
   ahí sí `record.estatus` pasa a `"C"` y se revierte el efecto en cuentas
   por cobrar. Si el SAT todavía no confirma, no aplica el cambio.

**Hallazgo nuevo (prueba real, WAMP local, empresa `DEMO`, esta sesión)**:
antes de llegar al flujo de 2 fases de arriba, `Cancel33` valida un nivel
de autorización previo e independiente del SAT. Sobre la factura recién
timbrada `F-1531` (estatus `"R"`), la primera llamada a `Cancel33` (motivo
`"02"`) fue rechazada con `Code: 4`, `Message: "La factura tiene
autorizaciones pendientes: AUTORIZACION PARA CANCELAR FACTURA"` — **no**
se llegó a ejecutar el flujo de solicitud SAT descrito arriba. Por lectura
de código (`Factura.class.php`, función de validación antes de la
cancelación): el backend consulta las tablas
`ventas_facturas_autoriza_niveles` / `ventas_facturas_autoriza_conceptos` /
`ventas_facturas_autoriza_sucursales` / `ventas_facturas_autorizaciones` —
un módulo de autorización jerárquica configurado a nivel `empresa_id`
(no por documento) que bloquea la cancelación hasta que alguien con el rol
correspondiente la apruebe. **No estaba documentado en ningún spec previo**
y no es parte de ADR-016 (que describe el flujo SAT, no este gate de
autorización interno).

**Pendiente**:
- Capturar el shape exacto de `cancelacion_estatus` en la primera llamada
  SAT de las 2 fases de ADR-016 requiere primero resolver/otorgar esa
  autorización pendiente en el tenant `DEMO` (fuera de alcance de esta
  ronda — implica un flujo de aprobación propio, no solo una llamada API) o
  probar contra una factura/tenant sin esta regla de autorización
  configurada.
- Documentar el gate de autorización como su propio contrato de API
  (`opReq` de aprobación, shape de `ventas_facturas_autorizaciones`) cuando
  se decida si el piloto lo cubre o queda fuera de alcance — no asumido
  aquí, requiere decisión del dueño del producto.
- La segunda llamada (confirmación SAT) sigue sin observar, ahora también
  bloqueada transitivamente por lo anterior.

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

- ~~Confirmar con captura real que `Stamp` regresa `estatus = "R"`~~ —
  confirmado con prueba real (ver sección `Stamp` arriba).
- Confirmar con captura real el shape de `cancelacion_estatus` en la primera
  y segunda llamada a `Cancel33` sobre una factura `R` — bloqueado por el
  gate de autorización descubierto en esta ronda (ver sección `Cancel33`
  arriba); requiere primero decidir cómo se resuelve esa autorización en el
  tenant de prueba, o probar contra un tenant sin esa regla configurada.
- Decidir si el gate de autorización de cancelación
  (`ventas_facturas_autoriza_*`) entra en el alcance del piloto o queda
  fuera — hoy no está mencionado en `CLAUDE.md` ni en ningún spec de
  `facturas_venta_33`.
- ~~Comportamiento de `LoadPresetClientData` sin historial~~ — confirmado
  con prueba real: regresa `[]` (ver sección `LoadPresetClientData`
  arriba).
- `SendMail`/`PrintPdf`: capturar antes de que una feature los necesite.
