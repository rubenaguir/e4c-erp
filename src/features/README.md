# `src/features/`

Un directorio por feature de negocio, agrupado por módulo de Sisnet V3
cuando la feature pertenece a uno (ej. `ventas/facturas_venta_33/`) — mismo
criterio de agrupación que usa `specs/features/` (ver `specs/README.md` y
ADR-010 en `docs/decisiones.md`). Lo transversal que no pertenece a ningún
módulo (ej. `auth/`) se queda a nivel raíz de `features/`, sin forzarlo
dentro de una carpeta de módulo. Ver también ADR-005 en `docs/decisiones.md`:
carpetas por feature, sin capas domain/application/infrastructure.

Convención interna de cada feature:

```
features/{modulo}/{feature}/   (o features/{feature}/ si es transversal, ej. auth/)
  api/          funciones que llaman sisnet-client.ts (un archivo por Agent o grupo de Agents relacionados)
  hooks/        hooks de TanStack Query (useXSearch, useXAdd, useXCancel, ...)
  components/   componentes de UI propios de la feature
  types.ts      tipos TS del dominio (reflejan specs/entities/{modulo}/*.md, o specs/entities/*.md si la entidad es compartida entre módulos)
```

No crear una feature sin su spec correspondiente en `specs/features/` y
`specs/api-contracts/` (ver "Reglas de implementación" en `CLAUDE.md`).

La primera feature (`auth/`) se implementa a partir de
`specs/features/auth/login.md`. La segunda, `ventas/facturas_venta_33/`, a
partir de `specs/features/ventas/facturas_venta_33/*.md`.
