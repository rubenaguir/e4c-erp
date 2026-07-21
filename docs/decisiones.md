# Registro de decisiones (ADR)

> Cada decisión: contexto, decisión y consecuencias. Útil para defender el
> proyecto y para que Claude Code entienda el "por qué", no solo el "qué".
> Formato adaptado de `school-pickup/docs/decisiones.md`.

## ADR-001 — Repo separado, backend sin modificar

**Contexto.** Sisnet V3 (`SisnetV3Desarrollo`) usa Ext JS 3.4 en el frontend,
con años de deuda de UX/responsividad. El backend PHP
(`php/interfase_jwt.php` + agents por módulo) ya está desacoplado de la
vista: el módulo CRM (`modules/ventas/crm/`) es API-only, y dos apps del
usuario (`e4c-pos`, `e4c-factura`) ya lo consumen desde React en producción.

**Decisión.** `e4c-erp` es un repositorio nuevo y separado
(`C:\d\Empresa4Cero\apps\e4c-erp`), que consume Sisnet V3 **únicamente** como
backend vía `interfase_jwt.php`. No se modifica ni un archivo de
`SisnetV3Desarrollo` desde este repo.

**Consecuencias.**
- Deploy independiente, sin mezclar código Ext JS/PHP con React.
- La migración es incremental: Ext JS sigue sirviendo los módulos no
  migrados mientras `e4c-erp` cubre los que sí, contra el mismo backend.
- Cualquier cambio de contrato de API que se necesite (ej. homologar una
  respuesta que no regresa `record`) se coordina como cambio en el otro repo,
  no aquí.

## ADR-002 — Stack: React 19 + Vite 8 + Tailwind v4 + shadcn/ui

**Contexto.** El usuario tiene dos precedentes de stack visual en proyectos
hermanos: `crm2` (MUI) y `e4c-factura`/`e4c-pos` (shadcn/Tailwind, con un
design system propio — "Claude Design" — ya usado en producción en
`e4c-factura`).

**Decisión.** `e4c-erp` reutiliza el stack de `e4c-factura`/`e4c-pos`: React
19, Vite 8, TypeScript, Tailwind v4 (vía `@tailwindcss/vite`, igual que
`e4c-pos` — más reciente que la v3 que fijó `e4c-factura`), shadcn/ui sobre
primitivas Radix, `lucide-react`, `class-variance-authority`, `tailwind-merge`.

**Consecuencias.**
- Reutiliza directamente el design system ("Claude Design") que el usuario
  ya validó en `e4c-factura`, en vez de adoptar MUI.
- `docs/design-brief.md` queda con tokens placeholder hasta que el usuario
  comparta el proyecto/tokens reales de Claude Design.
- Componentes shadcn se agregan bajo demanda (`npx shadcn add <componente>`),
  con alias apuntando a `src/shared/components` (no la ruta plana por
  defecto) — ver ADR-005.

## ADR-003 — TanStack Query para cache y mutaciones

**Contexto.** `e4c-factura` (en su propio ADR-003) eligió React Context
plano sobre TanStack Query/Redux, razonando que era "suficiente a esta
escala" para una PWA de una sola pantalla de facturación. `e4c-erp` cubrirá,
con el tiempo, los 13 módulos de Sisnet V3. La auditoría de
`facturas_venta_33` confirmó que la UI Ext JS original ya implementa un
patrón preciso: al guardar, el backend regresa el registro completo
(`record`) y el frontend lo parchea en memoria en el store de la lista, sin
refetch adicional (`facturas_venta.js:799-816`).

**Decisión.** Usar **TanStack Query** como capa de cache/mutaciones en vez de
Context plano. `queryClient.setQueryData` reproduce exactamente el parcheo
in-memory que ya hace Ext JS al guardar un documento, sin reinventar una
cache propia.

**Consecuencias.**
- Se revierte, deliberadamente, la decisión de `e4c-factura` — justificado
  por la diferencia de escala (1 pantalla vs. 13 módulos eventuales).
- Es el estándar más reconocible del ecosistema React para este problema
  (pedido explícito del usuario: arquitectura identificable sin fricción por
  un agente de IA).
- El contrato de invalidación/parcheo de cada mutación de documento se
  documenta en `specs/ui-screens/patron-documento-list-master-detail.md`, no
  se improvisa por feature.

## ADR-004 — Arquitectura de capas simple, sin Clean Architecture

**Contexto.** El usuario señaló como fricción real la inversión de
dependencias de `crm2` (interfaces de repositorio, capas
domain/application/infrastructure) — "me parece innecesaria en la mayoría de
los casos". `school-pickup` (otro proyecto del usuario) ya tomó la misma
decisión para su backend, documentada en su ADR-017: la ceremonia no se
justifica cuando el proveedor de datos ya está fijo.

**Decisión.** `e4c-erp` usa una arquitectura de capas simple: componente →
hook de TanStack Query → función de `api/` que llama `sisnet-client.ts`. Sin
entidades de dominio desacopladas, sin interfaz de repositorio genérica.
Inversión de dependencias solo donde algo es genuinamente volátil (el cliente
HTTP en sí, para poder mockearlo en tests).

**Consecuencias.**
- Menos boilerplate por feature — no hay que escribir una interfaz de
  repositorio para cada entidad de Sisnet V3.
- El costo de este enfoque es que un cambio de "cómo hablamos con Sisnet V3"
  (ej. cambiar de REST-RPC a otra cosa) tocaría más archivos que si hubiera
  una capa de abstracción — riesgo aceptado porque Sisnet V3 como backend es
  un dato fijo del proyecto, no algo que vaya a cambiar.
- Documentado explícitamente para no repetir la discusión por feature.

## ADR-005 — Estructura de carpetas por feature

**Contexto.** Con capas simples (ADR-004) descartadas las carpetas
domain/application/infrastructure de `crm2`, hace falta un criterio de
organización igual de reconocible para cualquier agente de IA.

**Decisión.** Carpetas por feature de negocio (`src/features/{feature}/`),
cada una con `api/`, `hooks/`, `components/`, `types.ts` — patrón "feature
folders" (tipo bulletproof-react), ampliamente reconocido. `src/shared/` para
lo transversal (design system, cliente HTTP, utilidades). `src/app/` para
providers y enrutamiento.

**Consecuencias.**
- Cualquier agente de IA reconoce la convención sin necesitar explicación
  extensa (a diferencia del mapa mental de Clean Architecture).
- Detalle completo y ejemplo en `src/features/README.md`.

## ADR-006 — SDD adaptado de `school-pickup`, sin modelo de datos propio

**Contexto.** El usuario señaló que la metodología SDD no está estandarizada
entre sus proyectos (`crm2` usa `specs/modules/{módulo}/{01-spec,02-design,
03-dev.todo,roadmap}.md`; `e4c-pos`/`e4c-factura` usan `docs/spec/NN-tema.md`
plano). Pidió estandarizar usando `school-pickup/docs` como referencia — es
la metodología más madura que tiene (33 ADRs, specs de 4 tipos:
`entities/features/api-contracts/ui-screens`).

**Decisión.** Adoptar la misma estructura de `school-pickup`:
`docs/{design-brief,arquitectura,decisiones,plan-implementacion}.md` +
`specs/{entities,features,api-contracts,ui-screens}/`. **Diferencia clave**:
`e4c-erp` **no** tiene `docs/modelo-datos.md` propio — el modelo de datos no
lo diseñamos nosotros, es de Sisnet V3 (PostgreSQL, ya existente).
`specs/entities/` documenta el shape observado en las respuestas reales del
backend (`Search`/`Load`), no un esquema que definamos.

**Consecuencias.**
- Misma metodología, mismo vocabulario, entre `school-pickup` y `e4c-erp` —
  reduce la fricción de cambiar de proyecto.
- `specs/entities/` se llena por observación (capturas reales), no por
  diseño — reforzado por ADR-009 (anti-alucinación de contratos).

## ADR-007 — Auth: JWT en el body (`session`), no header `Authorization`

**Contexto.** `interfase_jwt.php` acepta el JWT tanto por header
`Authorization: Bearer` (`GetBarerToken()`) como por parámetro `session` en
el body/query — ambos caminos están soportados por el backend.
`e4c-factura` (su propio ADR-005) ya eligió el body por "paridad con el
resto del stack PHP", y lo tiene validado en producción contra este mismo
backend.

**Decisión.** `e4c-erp` replica esa decisión: el JWT viaja como parámetro
`session` en el body de cada POST, no como header.

**Consecuencias.**
- Consistencia entre los frontends del mismo backend — un desarrollador que
  ya conoce `e4c-factura` reconoce el patrón aquí.
- `sisnet-client.ts` centraliza este detalle; ninguna feature arma el
  request a mano.

## ADR-008 — Idioma: documentación en español, dominio/SAT en español, técnico en inglés

**Contexto.** `school-pickup` (su propio ADR-007) usa la regla estricta
"código 100% en inglés, documentación en español", razonable porque ahí el
dominio (recogida escolar) no tiene vocabulario previo fijado. Aquí es
distinto: la base de datos de Sisnet V3 ya es 100% español (`snake_case`:
`cliente_id`, `factura`, `timbrado`, `folio`, `régimen_fiscal`,
`pedimento`), y forzar traducción de términos fiscales mexicanos (CFDI, SAT,
timbrado, pedimento) al inglés no aporta nada — al contrario, genera
divergencia de vocabulario entre frontend y backend.

**Decisión.** Documentación en español. Código: identificadores técnicos
genéricos (hooks, utilidades, verbos de acción) en inglés; vocabulario de
dominio/negocio y términos SAT en español, sin forzar traducción. Detalle y
ejemplos en `CLAUDE.md`, sección "Regla de idioma".

**Consecuencias.**
- Los nombres de campos/tipos en `specs/entities/` y en el código pueden
  copiar literalmente el nombre que ya usa Sisnet V3 (ej. `regimen_fiscal_id`,
  no `taxRegimeId`), reduciendo la traducción mental al leer request/response
  reales.
- Requiere criterio, no una regla mecánica de "archivo X = idioma Y" — se
  deja explícito en `CLAUDE.md` para que no se interprete como licencia para
  mezclar libremente.

## ADR-009 — Regla anti-alucinación de contratos de API

**Contexto.** `crm2/prompts_for_ia/module_initiation.md` ya usa este patrón
("no debes inventar, asumir ni alucinar estructuras de datos... para los
contratos de interfaz"). Sisnet V3 no tiene un contrato de API formal
(OpenAPI/schema) — cada Agent PHP es la única fuente de verdad, y varios
tienen shapes de respuesta inconsistentes entre sí (confirmado en la
auditoría de `facturas_venta_33`: unos regresan `{totalCount, records}`,
otros `{records}` sin envolver, `ValidateLovFieldFacturaRelacion` regresa el
objeto plano sin envolver).

**Decisión.** Ningún endpoint, campo o shape de respuesta se documenta en
`specs/api-contracts/` sin una captura real de request/response citada como
fuente: la auditoría de esta sesión (ver `docs/plan-implementacion.md`,
Fase 0) o `e4c-factura/docs/spec/09-sv3-contracts*.md` (payloads reales ya
capturados contra este mismo backend), o una prueba nueva contra el backend
local si falta cobertura.

**Consecuencias.**
- Cada spec de `specs/api-contracts/` referencia explícitamente su fuente.
- Si se necesita un endpoint sin captura previa, el siguiente paso es
  capturarlo (request real contra WAMP local), no inferir su forma por
  analogía con otro endpoint parecido.

## ADR-010 — Specs agrupadas por módulo de Sisnet V3

**Contexto.** `specs/features/` tenía 6 archivos planos (`NNN-{accion}.md`)
para solo 2 pantallas (login + `facturas_venta_33`), ya sin indicar en el
nombre que las facturas eran de **venta** — un problema real en cuanto se
especifique `facturas_venta_33` (compra), que colisionaría conceptualmente
con la existente. `specs/README.md` ya anticipaba el problema de escala
("13 módulos de Sisnet V3 por delante"), y el módulo de ventas por sí solo
tiene 40+ features en el sistema legado. La numeración `NNN-` global además
obliga a todas las pantallas futuras a pelear por el mismo contador en el
mismo directorio.

**Decisión.** Agrupar `entities/`, `features/` y `api-contracts/` por
módulo de Sisnet V3, tomando como referencia la estructura del sistema
legado (`specs/features/ventas/facturas_venta_33/`):
- `entities/{modulo}/{entidad}.md` y `api-contracts/{modulo}/{dominio}.md`
  cuando la spec es propia de un módulo.
- `features/{modulo}/{pantalla}/NNN-{accion}.md`, con numeración `NNN-`
  local a cada carpeta de pantalla (no un contador global).
- Lo que es compartido entre módulos (ej. entidades `cliente`/`concepto`,
  contratos `auth`/`lov`) se queda plano en la raíz de su carpeta — mismo
  criterio que ya usaba `ui-screens/`, que se mantiene sin cambio por ser
  intencionalmente cross-módulo (patrones reusables, no specs de un módulo
  específico).
- Lo transversal que no pertenece a ningún módulo real (ej. login) usa un
  pseudo-módulo (`features/auth/`) en vez de forzarse dentro de un módulo
  de negocio.

Detalle completo en `specs/README.md`, sección "Organización por módulo".

**Consecuencias.**
- `.claude/skills/new-feature-spec/SKILL.md`, único generador de specs
  nuevas, queda actualizado para escribir en la nueva convención — evita
  que la próxima spec revierta al patrón plano.
- `src/features/README.md` documenta la misma agrupación por módulo para
  cuando exista código (aún no hay features implementadas), para no repetir
  esta discusión al llegar el segundo módulo.
- Migración de los 8 archivos ya existentes (`entities/factura.md`,
  `api-contracts/facturas.md`, y los 6 de `features/`) a sus nuevas rutas,
  con todas las referencias cruzadas actualizadas.

## ADR-011 — Persistencia de sesión en localStorage y refresh proactivo

**Contexto.** `specs/features/auth/login.md` dejó abierta la pregunta de
persistencia del JWT (localStorage vs. memoria) hasta poder revisar cómo la
resolvió `e4c-factura` (proyecto hermano, mismo backend) en producción.
`e4c-factura` (`src/context/AuthContext.tsx`) ya usa `localStorage` con la
key `"sv3_session"` guardando el JWT crudo, con un timer de refresh
proactivo al 80% del tiempo restante del token y una revalidación al volver
a foco (`visibilitychange`) si quedan menos de 10 minutos — validado en
producción contra este mismo backend. Se confirmó contra `SisnetV3Desarrollo`
local (usuario de prueba `demo`, ver `specs/api-contracts/auth.md`) que:
`TokenRefresh` delega literalmente en `ValidateSession`
(`modules/seguri/acceso/acceso_jwt.php:404-408`, shape idéntico); que
`remember_me=true` en `Login` persiste ~30 días a través de refreshes
sucesivos porque la duración (`expiresIn`) viaja embebida en el propio JWT y
se reutiliza en cada renovación (`Sesion.class.php:118-158`,
`interfase_jwt.php:144-148`); y que `JWT_RENEW_THRESHOLD` (1800s, umbral fijo
interno del backend para decidir si renovar cuando se le pregunta) y
`TokenNeedsRenewal` existen y son independientes del 80% que decide este
frontend para llamar proactivamente.

**Decisión.**
- Persistencia: `localStorage`, key `"sv3_session"` — un solo string, el
  JWT crudo (sin envolver en JSON). `sisnet-client.ts` lee `localStorage` al
  inicializar el módulo (no solo al escribir), así que recargar la página no
  cierra la sesión.
- `remember_me` se expone como checkbox en el login.
- Refresh proactivo: al 80% del tiempo restante del token (no del TTL total
  desde emisión — se recalcula en cada renovación, misma semántica que
  `e4c-factura`) se llama `TokenRefresh`; adicionalmente, al volver la
  pestaña a foco (`visibilitychange`) se llama `TokenRefresh` si quedan
  menos de 10 minutos de vida.
- Reactividad sin `AuthContext` nuevo (ADR-004 ya lo descarta): `sisnet-client.ts`
  expone un store observable mínimo (`Set` de listeners notificados en cada
  `setSisnetSession`), consumido vía `useSyncExternalStore` desde un hook
  `useSisnetSession()` en `src/features/auth/hooks/`. No es Context — no hay
  `createContext`/`<Provider>` — es la API nativa de React para stores
  externos, y evita introducir el punto de estado duplicado que ADR-004
  quería evitar.
- Sin capa biométrica — existe en `e4c-factura`
  (`src/lib/biometricStorage.ts`) pero no se trae a este piloto.
- **Cuidado con `remember_me` en el body del request**: confirmado en vivo
  que `GetFromRequest("remember_me", false)` del backend evalúa el valor
  como string, y PHP considera truthy cualquier string no vacío distinto de
  `"0"` — incluyendo literalmente el string `"false"`. Enviar
  `remember_me=false` (serializado tal cual por `appendParam` de
  `sisnet-client.ts`, que hace `String(value)`) produce, contra lo
  esperado, un token de 30 días. `src/features/auth/api/login.ts` debe
  omitir el parámetro por completo (o enviar `"0"`) cuando el usuario no
  marcó "recordarme", nunca enviar el booleano `false` tal cual.

**Consecuencias.**
- Mismo patrón de persistencia que `e4c-factura` — un desarrollador que
  conoce ese proyecto reconoce la convención aquí (misma key incluso).
- Riesgo aceptado de XSS vía `localStorage` — ya es el riesgo que
  `e4c-factura` acepta en producción contra el mismo backend, no es una
  decisión nueva de este proyecto.
- El bug de truthiness de `remember_me` queda documentado aquí y en
  `specs/api-contracts/auth.md` para que no se reintroduzca por accidente
  en una feature futura que también llame `Login`.
