# Plan de implementación — e4c-erp

> Guía de secuencia para saber "qué sigue" en cualquier momento del
> proyecto. No duplica contenido de otros documentos — solo referencia y
> ordena. Fuente de verdad de cada tema sigue viviendo en
> `docs/decisiones.md`, `docs/arquitectura.md` y `specs/`. Formato adaptado
> de `school-pickup/docs/plan-implementacion.md`.
>
> Actualizar los checkboxes conforme se avanza. Es un documento vivo.

## Metodología

Este proyecto sigue Spec Driven Development (SDD): cada pieza se especifica
en `specs/` **antes** de escribir código de implementación. Ver
`specs/README.md` para el detalle de los 4 tipos de spec (`entities/`,
`features/`, `api-contracts/`, `ui-screens/`), adaptados de `school-pickup`
para un proyecto que **consume** un backend ajeno en vez de diseñar el
propio (ver ADR-006).

Orden general: **auditoría del backend real → specs → código**. Nunca se
salta directo a código sin spec, salvo scaffolding trivial (configuración de
proyecto, tooling) — ver "Reglas de implementación" en `CLAUDE.md`.

## Fase 0 — Fundamentos documentales ✅ completo

- [x] Auditoría de `facturas_venta_33` contra `SisnetV3Desarrollo` (agents
      vigentes vs. deprecated, shapes de respuesta, patrón
      List-Master-Detail confirmado en la UI Ext JS original) — hecha en la
      sesión de origen de este proyecto, transcrita a `docs/` y `specs/` de
      este repo (no vive solo en el historial de chat — ver
      "Continuidad" abajo).
- [x] `docs/decisiones.md` — ADRs 001-009.
- [x] `docs/arquitectura.md` — integración con Sisnet V3, arquitectura de
      capas, patrón List-Master-Detail-Complemento.
- [x] `CLAUDE.md` — memoria de proyecto, reglas de implementación.
- [x] `specs/README.md`, `specs/api-contracts/README.md`.
- [x] `.claude/skills/new-feature-spec/` — skill para generar specs de
      features nuevas sin alucinar contratos.

### Tooling y scaffold ✅ completo

- [x] Scaffold Vite + React 19 + TypeScript.
- [x] Tailwind v4 (`@tailwindcss/vite`) + shadcn/ui (`components.json` con
      alias apuntando a `src/shared/`, no a la ruta plana por defecto).
- [x] TanStack Query, React Router, React Hook Form + Zod instalados.
- [x] Estructura `src/{app,features,shared}/`.
- [x] `src/shared/lib/sisnet-client.ts` — cliente HTTP mínimo (arma `opReq`,
      agrega `session` al body, parsea el shape de error real de Sisnet V3).
- [x] `.env.example` con `VITE_SISNET_BASE_URL`.

## Fase 1 — Specs del piloto: login + núcleo `facturas_venta_33`

- [x] `specs/entities/ventas/factura.md`, `entities/cliente.md`, `entities/concepto.md`.
- [x] `specs/api-contracts/auth.md`, `api-contracts/ventas/facturas.md`, `api-contracts/lov.md`.
- [x] `specs/features/auth/login.md` (con la pregunta abierta de persistencia
      del JWT explícita, no resuelta por defecto).
- [x] `specs/features/ventas/facturas_venta_33/*.md` del núcleo de facturación
      (buscar, crear pre-factura, editar pre-factura, timbrar, cancelar) —
      cada una con el caso "se agrega/parchea en la lista sin refresh" como
      postcondición.
- [x] `specs/ui-screens/patron-documento-list-master-detail.md`.

## Fase 2 — Implementación: `auth`

- [ ] Resolver la pregunta abierta de persistencia del JWT (localStorage vs.
      memoria) — capturar el flujo real de selección
      empresa/sucursal/instancia contra el backend local antes de fijarlo en
      la spec (dado `STAND_ALONE = false`, ver `docs/arquitectura.md`).
- [ ] `src/features/auth/` — pantalla de login, hook de sesión, integración
      con `sisnet-client.ts` (`setSisnetSession`, `setSisnetForceLogoutHandler`).
- [ ] Verificación end-to-end: login real contra WAMP local obtiene un JWT
      válido; una llamada subsecuente autenticada regresa datos.

## Fase 3 — Implementación: núcleo `facturas_venta_33`

- [ ] `src/features/facturas/` siguiendo el patrón de
      `specs/ui-screens/patron-documento-list-master-detail.md`.
- [ ] Verificación: crear una pre-factura, timbrarla, cancelarla — cada
      mutación parchea la lista sin refetch completo (criterio de
      aceptación explícito del usuario).

## Fase 4+ — Generalización (no iniciar sin cerrar Fase 3)

- [ ] Especificar y aplicar el patrón "documento" a un segundo módulo
      (candidatos: `pedidos_venta`, `notas_credito_33`) para confirmar que
      generaliza sin retrabajo mayor.
- [ ] Especificar el patrón "catálogo" (ej. `clientes`,
      `catalogo_inventarios`) — más simple que "documento": sin
      complementos, sin máquina de estados compleja.
- [ ] Especificar el patrón "reporte" (ej. `reporte_facturacion_producto`) —
      filtros + tabla/export, sin mutaciones.
- [ ] Priorizar el resto de los 13 módulos de Sisnet V3 según uso real.

---

## Decisiones pendientes que bloquean fases futuras

| Pendiente | Bloquea | Estado |
|---|---|---|
| Tokens reales del design system ("Claude Design" de `e4c-factura`) | `docs/design-brief.md`, componentes shadcn con paleta final | Abierto — pendiente que el usuario comparta el proyecto/tokens |
| Persistencia del JWT en cliente | Fase 2 | Abierto — ver `specs/features/auth/login.md` |
| Forma exacta de selección empresa/sucursal/instancia en login | Fase 2 | Abierto — `e4c-factura` ya trae `empresa_id`/`sucursal_id` fijos en sus payloads; confirmar si ese atajo aplica aquí o si el login debe resolverlo dinámicamente |

## Continuidad entre sesiones

Este proyecto nació de una sesión de auditoría en el repo del backend
(`SisnetV3Desarrollo`). Esa sesión **no** es accesible desde una sesión de
Claude Code abierta aquí — el mecanismo de continuidad es que todo lo
relevante de esa auditoría ya quedó transcrito en `docs/decisiones.md`,
`docs/arquitectura.md` y `specs/` de este mismo repo. Cualquier sesión nueva
en `e4c-erp` empieza leyendo `CLAUDE.md`, sin necesitar el historial de esa
conversación original.
