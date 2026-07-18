# Specs — Spec Driven Development (SDD)

> Documentación en español; identificadores en inglés salvo vocabulario de
> dominio/SAT (ver `CLAUDE.md`, "Regla de idioma"). Estructura adaptada de
> `school-pickup/specs/README.md`.

## Qué es y por qué

Spec Driven Development (SDD) significa escribir, antes de tocar código, una
especificación por pieza del dominio (entidad, feature, contrato de API,
pantalla) que documente decisiones de detalle que no caben ni en un ADR
(que documenta el "por qué" de una decisión puntual) ni en el propio código.

Se adopta aquí por dos razones:
- **No alucinar contratos.** Sisnet V3 no tiene un contrato de API formal
  (OpenAPI/schema) y varios de sus Agents PHP tienen shapes de respuesta
  inconsistentes entre sí. Fijar en texto revisable, con fuente citada, cada
  shape de request/response antes de escribir un hook o un componente que lo
  consuma evita inventar campos o estructuras que no existen. Ver ADR-009 en
  `docs/decisiones.md`.
- **Consistencia de pantalla.** Con 13 módulos de Sisnet V3 por delante y
  solo 3 patrones de pantalla (documento, catálogo, reporte — ver
  `docs/arquitectura.md`), especificar el patrón una vez en `ui-screens/` y
  reusarlo evita que cada módulo nuevo reinvente su propia estructura de UI.

## Diferencia con `school-pickup` (importante)

`school-pickup` diseña su propio backend y su propio modelo de datos, así
que sus specs de `entities/` documentan un esquema que ese proyecto define.
**`e4c-erp` no diseña el backend** — Sisnet V3 ya existe, con su propio
modelo de datos en PostgreSQL. Por eso:
- No hay `docs/modelo-datos.md` propio.
- `specs/entities/` documenta el shape **observado** en las respuestas
  reales de Sisnet V3 (`Load`/`Search`), no un esquema que diseñemos.
- `specs/api-contracts/` documenta endpoints ya existentes del backend, no
  endpoints que este equipo vaya a implementar.

Ver ADR-006 en `docs/decisiones.md`.

## Tipos de spec

### `entities/`
Una spec por entidad de negocio tal como la expone Sisnet V3 (ej. `factura`,
`cliente`, `concepto`). Documenta los campos observados en respuestas reales
de `Load`/`Search`, su tipo tal cual llega (recordar: todo numérico llega
como `string` — ver `docs/arquitectura.md`), y qué endpoints de
`api-contracts/` la producen/consumen.

**Template (5 secciones):**
1. **Propósito** — qué representa esta entidad en el negocio.
2. **Campos observados** — tabla: campo, tipo tal cual llega (string/array/
   objeto anidado), notas. Cita el endpoint/captura de origen.
3. **Relaciones** — con qué otras entidades aparece anidada (ej. `factura`
   trae `conceptos[]`, cada concepto trae `impuestos_traslados[]`).
4. **Invariantes de negocio observadas** — reglas que el frontend debe
   respetar aunque el backend no las valide del lado del cliente (ej.
   estatus válidos, campos que solo aplican si otro campo tiene cierto
   valor).
5. **Fuente** — captura(s) real(es) de la que sale esta spec (ADR-009): cita
   el archivo/sección exacta, nunca "se infiere de".

### `features/`
Una spec por comportamiento de usuario (ej. "buscar facturas", "timbrar
factura"). Formato Given/When/Then. Debe incluir postcondiciones explícitas
sobre el patrón List-Master-Detail cuando la feature mute un documento (ver
`docs/arquitectura.md`): qué se parchea en la cache de TanStack Query y
cómo.

### `api-contracts/`
Un documento por dominio de endpoints de Sisnet V3 (ej. `auth.md`,
`facturas.md`, `lov.md`). Por cada operación: `opReq` exacto, parámetros de
request, shape completo de response (éxito y error), y la fuente de la
captura (ADR-009). Convenciones compartidas a todos los contratos en
`api-contracts/README.md` — no se repiten en cada archivo.

### `ui-screens/`
Un documento por patrón de pantalla reusable (no uno por pantalla
individual — a diferencia de `school-pickup`, aquí el objetivo explícito es
generalizar patrones entre módulos). El primero:
`patron-documento-list-master-detail.md`, que fija el estándar para todas
las pantallas tipo documento del ERP a partir del piloto `facturas_venta_33`.

## Organización por módulo

Cada tipo de spec (excepto `ui-screens/`, que es intencionalmente
cross-módulo — ver arriba) se agrupa en un subdirectorio por módulo de
Sisnet V3 cuando la spec pertenece a uno, extendiendo a `entities/`,
`features/` y `api-contracts/` el mismo criterio de "plano = cross-módulo"
que ya usaba `ui-screens/`. Motivo: con 13 módulos de Sisnet V3 por delante
y solo el módulo de ventas con 40+ features en el sistema legado, un
directorio plano por tipo de spec se vuelve imposible de navegar y genera
colisiones de nombre (ej. una feature "buscar" o una entidad "factura"
existen en más de un módulo). Ver ADR-010 en `docs/decisiones.md`.

- **`entities/{modulo}/{entidad}.md`** — cuando la entidad es propia de un
  módulo (ej. `entities/ventas/factura.md`). Las entidades compartidas
  entre módulos (ej. `cliente`, `concepto`) se quedan planas en la raíz de
  `entities/`.
- **`api-contracts/{modulo}/{dominio}.md`** — cuando el contrato cubre
  endpoints propios de un módulo (ej. `api-contracts/ventas/facturas.md`).
  Los contratos transversales (ej. `auth.md`, `lov.md`) se quedan planos en
  la raíz de `api-contracts/`.
- **`features/{modulo}/{pantalla}/NNN-{accion}.md`** — una carpeta por
  pantalla dentro del módulo, usando el mismo nombre de pantalla que el
  sistema legado (ej. `features/ventas/facturas_venta_33/`). La numeración
  `NNN-` es **local a la carpeta de la pantalla**, no un contador global del
  proyecto, para conservar el orden de flujo/implementación sin pelear por
  el mismo contador entre pantallas distintas. Lo transversal que no
  pertenece a un módulo real de Sisnet V3 (ej. login) usa un pseudo-módulo
  al mismo nivel, sin forzarlo dentro de un módulo de negocio (ej.
  `features/auth/login.md`).
- **`ui-screens/`** — sin subdirectorios, plano por diseño.

## Estado actual

- **`entities/`** — `entities/ventas/factura.md` (módulo), `cliente.md` y
  `concepto.md` (compartidas), piloto.
- **`features/`** — `features/auth/login.md` + `features/ventas/
  facturas_venta_33/` (núcleo del piloto: buscar, crear pre-factura, editar
  pre-factura, timbrar, cancelar).
- **`api-contracts/`** — `api-contracts/ventas/facturas.md` (módulo),
  `auth.md` y `lov.md` (compartidos).
- **`ui-screens/`** — 1 archivo, el patrón documento.

## Referencias cruzadas

- `docs/arquitectura.md` — integración con Sisnet V3, patrón de pantallas.
- `docs/decisiones.md` — ADRs referenciados desde cada spec.
- `CLAUDE.md` — reglas de implementación (spec como fuente de verdad).
