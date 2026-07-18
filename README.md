# e4c-erp

Frontend React para **Sisnet V3 / PLANATOR ERP**, consumiendo el backend PHP
existente (`interfase_jwt.php`) sin modificarlo. Repo separado del backend
(`SisnetV3Desarrollo`) — ver `docs/decisiones.md`, ADR-001.

Este proyecto sigue **Spec Driven Development**: antes de implementar
cualquier pantalla se escribe su spec en `specs/`. Ver `specs/README.md` y
`CLAUDE.md` (sección "Reglas de implementación") antes de escribir código.

## Stack

React 19 + Vite 8 + TypeScript + Tailwind v4 + shadcn/radix + TanStack Query
+ React Router + React Hook Form + Zod. Ver `docs/decisiones.md` (ADR-002,
ADR-003) para el razonamiento.

## Inicializar el repo

Requisitos: Node 20+, y el backend Sisnet V3 corriendo localmente en WAMP
(`http://localhost/SisnetV3Desarrollo`).

```bash
npm install
cp .env.example .env.local
```

Editar `.env.local` si tu WAMP no usa la ruta por defecto:

```
VITE_SISNET_BASE_URL=http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php
```

### CORS en dev (paso manual obligatorio)

`interfase_jwt.php` solo refleja el header `Access-Control-Allow-Origin` para
orígenes listados en `ALLOWED_ORIGINS` (`conf/conf.php` del backend); fuera de
esa lista cae a `*`, que **no** funciona con `credentials: include`. Agregar el
origen de Vite (por defecto `http://localhost:5173`) a `ALLOWED_ORIGINS` en el
`conf.php` de `SisnetV3Desarrollo` antes de probar el login localmente.

### Levantar en desarrollo

```bash
npm run dev
```

### Otros scripts

```bash
npm run build     # tsc -b && vite build
npm run lint       # eslint .
npm run preview    # sirve el build de producción
```

### Agregar componentes de shadcn/ui

```bash
npx shadcn add button
```

Los alias de `components.json` ya apuntan a `src/shared/components` y
`src/shared/lib` (no a la ruta plana `src/components` que usa shadcn por
defecto) — ver ADR-005.

## Estructura

```
src/
  app/        Providers, shell raíz, enrutamiento
  features/   Un directorio por feature de negocio (auth, facturas, ...) — ver src/features/README.md
  shared/     Design system, cliente HTTP (sisnet-client.ts), utilidades compartidas
docs/         Documentación de arquitectura y decisiones (español)
specs/        Specs SDD: entities, features, api-contracts, ui-screens
```

## Documentos de referencia

- `docs/decisiones.md` — registro de decisiones (ADR).
- `docs/arquitectura.md` — arquitectura del frontend y su integración con Sisnet V3.
- `docs/plan-implementacion.md` — fases y qué sigue.
- `docs/design-brief.md` — dirección visual (pendiente de tokens reales de "Claude Design").
- `specs/README.md` — qué es cada tipo de spec y cuándo escribirla.
