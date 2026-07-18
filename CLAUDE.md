# CLAUDE.md — e4c-erp

> Memoria de proyecto para Claude Code. Léelo al inicio de cada sesión.
> El detalle vive en `docs/` y `specs/`.
>
> Repo / directorio raíz: `e4c-erp` · Backend consumido: **Sisnet V3 / PLANATOR ERP**
> (repo separado `SisnetV3Desarrollo`, no se toca desde aquí).

## Visión general

**e4c-erp** es el frontend React que reemplaza gradualmente la UI Ext JS 3.4
de Sisnet V3, consumiendo el mismo backend PHP (`interfase_jwt.php`) sin
modificarlo. No es una reescritura de una sola vez: se migra módulo por
módulo, empezando por `facturas_venta_33` (la pantalla más compleja del
sistema, elegida como prueba de fuego para fijar el estándar de las
pantallas tipo "documento" — ver `docs/arquitectura.md`).

El módulo CRM de Sisnet V3 tiene su propio frontend React ya existente y
especializado (`crm2`) — **no** se migra aquí.

## Regla de idioma

- **Documentación** (`docs/`, `specs/`, este archivo): español.
- **Código**: identificadores técnicos genéricos (hooks, utilidades, tipos de
  UI, verbos de acción: `useFacturaSearch`, `fetchClientes`, `isLoading`) en
  **inglés**.
- **Vocabulario de dominio/negocio y términos fiscales del SAT van en
  español**, sin forzar traducción: `factura`, `timbrado`, `cfdi`,
  `regimen_fiscal`, `pedimento`, `concepto`, `folio`, `cliente`. La base de
  datos de Sisnet V3 ya es 100% español (`snake_case`) — traducir estos
  términos al inglés generaría una capa de traducción arbitraria y
  divergencia de vocabulario con el backend que consumimos. Ver ADR-008 en
  `docs/decisiones.md`.
- Nunca mezclar criterios dentro del mismo identificador (ej. no
  `cancelInvoiceTimbrado`; sí `cancelarFactura` o `stampFactura` según si el
  concepto es de dominio/SAT o técnico genérico — usar juicio, no una regla
  mecánica).

## Stack

- React 19 + TypeScript + Vite 8.
- Tailwind v4 + shadcn/ui (radix primitives) — mismo stack visual que
  `e4c-factura` (proyecto hermano del usuario), no el MUI de `crm2`.
- **TanStack Query** para cache/mutaciones (ADR-003) — no Context plano.
- React Router, React Hook Form + Zod.
- Sin backend propio: consume Sisnet V3 vía `interfase_jwt.php`
  (`src/shared/lib/sisnet-client.ts`).

## Alcance del MVP (piloto)

DENTRO:
- Login (obligatorio para poder probar cualquier otra cosa — el backend
  exige JWT válido en cada request). Ver `specs/features/auth/login.md`.
- Núcleo de `facturas_venta_33`: buscar, crear pre-factura, editar
  pre-factura, timbrar, cancelar. Grid de conceptos inline. Patrón
  List-Master-Detail sin refresh (ver abajo).

FUERA (por ahora):
- Adendas de cliente (Inbursa/ABB/ARA/Lesaffre), `CancelCFDI` (huérfana en la
  UI Ext JS original), complementos de nicho (comercio exterior, detallista,
  instituciones educativas, servicio parcial de construcción).
- Catálogos (clientes, productos) y reportes como pantallas propias — el
  piloto solo cubre el patrón "documento". Los otros dos patrones de pantalla
  (catálogo, reporte) se especifican después, una vez validado este.
- CRM (tiene su propio frontend, `crm2`).

## Patrón List-Master-Detail (regla central del producto)

Confirmado ya en la UI Ext JS original (`facturas_venta.js:799-816`) y es el
estándar a replicar en todas las pantallas tipo documento:

- La vista de lista **nunca** se refresca por completo al volver de un
  detalle, ni al agregar o editar un registro.
- Todo `Add`/`Update`/`Stamp`/`Cancel` del backend regresa el **registro
  completo actualizado** bajo la llave `record`.
- El frontend usa `queryClient.setQueryData` para parchear ese registro
  directamente en la cache de la lista (agregarlo si es nuevo, reemplazarlo
  si ya existía) — nunca `invalidateQueries` + refetch de la lista completa
  tras una mutación de un solo registro.

Detalle completo en `specs/ui-screens/patron-documento-list-master-detail.md`.

## Estructura del repo

```
src/
  app/        Providers (QueryClientProvider), shell raíz, enrutamiento
  features/   Un directorio por feature de negocio — ver src/features/README.md
  shared/     Design system (shadcn), sisnet-client.ts, utilidades
docs/         Documentación de arquitectura y decisiones (español)
specs/        Specs SDD — ver specs/README.md
.claude/skills/new-feature-spec/  Skill para generar specs de una feature nueva sin alucinar contratos
```

## Convenciones

- Arquitectura de capas simple, **sin Clean Architecture ni interfaces de
  repositorio genéricas** (ADR-004). Inversión de dependencias solo donde
  algo es genuinamente volátil (ej. el cliente HTTP, para poder mockearlo en
  tests) — no por defecto en cada feature.
- Carpetas por feature (`src/features/{feature}/{api,hooks,components}`), no
  por capa técnica transversal (domain/application/infrastructure).
- Auth: JWT como parámetro `session` en el body del POST, no header
  `Authorization` (ADR-007) — paridad con `e4c-factura`, que ya lo valida en
  producción contra este mismo backend.
- Shape de error real de Sisnet V3 (no inventar uno "más limpio"):
  `{success:false, Message, msg, Code, CodeDescr, forceLogout}`.
  `forceLogout: "S"` dispara logout inmediato en el cliente. Ver
  `specs/api-contracts/README.md`.
- Todos los valores numéricos que regresa Sisnet V3 llegan como **string**
  (ej. `"total": "3080.000000"`) — no asumir `number` en los tipos de
  `specs/entities/`.

## Reglas de implementación (IMPORTANTE)

- **La spec es la fuente de verdad.** No implementar ningún endpoint, campo,
  pantalla o comportamiento que no esté en su spec
  (`specs/entities`, `specs/features`, `specs/api-contracts`,
  `specs/ui-screens`). Si algo no está especificado, no se inventa.
- **No alucinar contratos de API.** Todo shape de request/response en
  `specs/api-contracts/` debe citar su fuente: una captura real (ejemplo ya
  existente en `specs/`, o en `e4c-factura/docs/spec/09-sv3-contracts*.md`) o
  una prueba nueva contra el backend local. Nunca "parece razonable que
  regrese esto".
- **Spec antes que código.** Si al implementar se descubre que la spec está
  incompleta o equivocada, PARAR: actualizar la spec primero (y el ADR
  correspondiente si es una decisión de fondo), y solo entonces escribir
  código.
- **Mutaciones de documentos → patch de cache, nunca refetch de lista**
  (ver "Patrón List-Master-Detail" arriba). Es la regla de negocio más
  repetida de este proyecto; cualquier feature de tipo documento la hereda.
- Antes de importar un paquete, confirmar que está en `package.json`. No
  asumir que una librería o API del backend existe sin verificarlo.

## Documentos de referencia

- `docs/arquitectura.md` — arquitectura del frontend y su integración con Sisnet V3.
- `docs/decisiones.md` — registro de decisiones (ADR).
- `docs/plan-implementacion.md` — fases y qué sigue.
- `docs/design-brief.md` — dirección visual (pendiente de tokens reales).
- `specs/README.md` — qué es cada tipo de spec.

## Comandos

- Instalar dependencias: `npm install`
- Desarrollo: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Agregar componente shadcn: `npx shadcn add <componente>`
- Requiere WAMP local con `SisnetV3Desarrollo` corriendo y el origen de Vite
  agregado a `ALLOWED_ORIGINS` en su `conf.php` (ver `README.md`).
