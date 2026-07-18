# Arquitectura

> Documentación en español. Ver `CLAUDE.md` para la regla de idioma del código.

## Resumen

`e4c-erp` es una SPA de React que consume Sisnet V3 exclusivamente a través
de `php/interfase_jwt.php`. No hay backend propio de este repo — Sisnet V3
**es** el backend, ya construido, con años de módulos en producción. Este
frontend no lo modifica ni lo reimplementa: lo consume.

```
Navegador (e4c-erp, Vite dev server / build estático)
    │  fetch POST, credentials: include
    ▼
php/interfase_jwt.php  (SisnetV3Desarrollo, repo separado)
    │  opReq=modulo:vista:controlador:accion
    ▼
Agent PHP del módulo correspondiente (ej. facturas_venta_33:facturas_venta:Search)
    │
    ▼
PostgreSQL (multi-tenant, empresa_id + sucursal_id)
```

## Integración con Sisnet V3

- **Dispatch por `opReq`**: cada request POST incluye `opReq` con la forma
  `modulo:vista:controlador:accion` (ej.
  `ventas:facturas_venta_33:facturas_venta:Search`). No es REST por recurso —
  es RPC por nombre de función. `src/shared/lib/sisnet-client.ts` centraliza
  la construcción de este parámetro; ninguna feature arma el string a mano.
- **Auth**: JWT como parámetro `session` en el body (ADR-007). El módulo
  `auth` (`src/features/auth/`) es responsable de obtenerlo (`Login`) y de
  guardarlo/inyectarlo en cada request subsecuente vía
  `setSisnetSession()`/`getSisnetSession()` de `sisnet-client.ts`.
- **Multi-tenant + multi-instancia**: `conf.php` de Sisnet V3 tiene
  `STAND_ALONE = false`, así que una sesión completa requiere resolver
  empresa + sucursal + **instancia** (3 partes), no solo empresa+sucursal.
  Detalle exacto de ese flujo en `specs/features/auth/login.md` — no se
  asume su forma sin capturarla primero contra el backend real (ADR-009).
- **Shape de error real** (no inventar uno "más limpio"):
  `{success:false, Message, msg, Code, CodeDescr, forceLogout}`. Ver
  `specs/api-contracts/README.md`. `sisnet-client.ts` lo traduce a
  `SisnetError`, con `forceLogout` como boolean y un hook de logout
  (`setSisnetForceLogoutHandler`) que el módulo `auth` engancha.
- **Tipos**: todo valor numérico de Sisnet V3 llega serializado como
  `string` (confirmado en las capturas reales, ej. `"total":
  "3080.000000"`). `specs/entities/` documenta los campos tal cual llegan;
  la conversión a número (si hace falta) se hace explícitamente en el
  frontend, no se asume en el tipo.
- **CORS en dev**: `interfase_jwt.php` refleja `Access-Control-Allow-Origin`
  solo para orígenes en `ALLOWED_ORIGINS` (`conf.php` del backend). Hay que
  agregar el origen del dev server de Vite ahí — ver `README.md`.

## Arquitectura de capas (frontend)

Ver ADR-004 en `docs/decisiones.md`: **sin Clean Architecture completa**.
Capas simples por feature:

```
Componente (src/features/{feature}/components/)
    │  usa
    ▼
Hook de TanStack Query (src/features/{feature}/hooks/)
    │  llama
    ▼
Función de api/ (src/features/{feature}/api/)
    │  usa
    ▼
sisnetRequest() — src/shared/lib/sisnet-client.ts
```

Sin interfaz de repositorio genérica entre estas capas. La única pieza con
inversión de dependencias deliberada es `sisnet-client.ts` en sí (para poder
mockearlo en tests de hooks/componentes sin pegarle a un backend real).

## Patrón List-Master-Detail-Complemento

Hallazgo central de la auditoría de `facturas_venta_33` (la pantalla más
compleja de Sisnet V3, usada como prueba de fuego para fijar este patrón):
la UI Ext JS original ya implementa exactamente el comportamiento que este
proyecto busca replicar y generalizar.

- **List**: grid de listado. Se preserva en memoria al navegar a un detalle
  y volver — nunca se recarga por completo salvo acción explícita del
  usuario ("Consultar"/refrescar).
- **Master**: formulario de encabezado del documento + grid de conceptos
  inline (siempre visible, no es un complemento).
- **Complemento**: ~15 sub-documentos condicionales en ventanas/paneles
  separados según el tipo de documento/cliente (impuestos por concepto,
  información aduanera, pedidos/salidas a facturar, comercio exterior,
  detallista, autorizaciones, seguimiento...). No todos aplican a todos los
  documentos — se modelan como piezas registrables, no como tabs fijos.
- **Regla de sincronización** (la más importante): toda mutación
  (`Add`/`Update`/`Stamp`/`Cancel`) regresa el registro completo actualizado
  bajo `record`. El frontend usa `queryClient.setQueryData` para parchear ese
  registro en la cache de la lista — nunca `invalidateQueries` de la lista
  completa tras guardar un solo documento.

Especificación completa del patrón, incluyendo el contrato exacto de cache de
TanStack Query, en `specs/ui-screens/patron-documento-list-master-detail.md`.
Este es el patrón a replicar para pedidos, notas de crédito, facturas/órdenes
de compra y el resto de pantallas "documento" del ERP.

Los otros dos patrones de pantalla del sistema (catálogos tipo
`clientes`/`catalogo_inventarios`, y reportes tipo
`reporte_facturacion_producto`) se especifican en una fase posterior — el
piloto cubre únicamente el patrón documento.

## Estructura de carpetas

Ver `CLAUDE.md` (sección "Estructura del repo") y `src/features/README.md`
para el detalle de convenciones por feature.
