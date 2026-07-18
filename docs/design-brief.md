# Design brief — e4c-erp

> **PENDIENTE (TODO):** este documento es un placeholder. Los tokens reales
> de diseño ("Claude Design") ya existen y están en uso en
> `C:\d\Empresa4Cero\apps\e4c-factura` (proyecto hermano, misma familia de
> producto — POS/facturación rápida). Antes de diseñar cualquier pantalla de
> `e4c-erp` hace falta que el usuario comparta el proyecto/tokens de Claude
> Design de `e4c-factura` para reutilizarlos aquí (ver ADR-002 en
> `docs/decisiones.md`). Mientras tanto, `src/index.css` usa una paleta
> neutra placeholder (shadcn "zinc" por defecto), explícitamente marcada
> como temporal.

## Qué es e4c-erp

Frontend React que reemplaza gradualmente la UI Ext JS 3.4 de **Sisnet V3 /
PLANATOR ERP** (sistema ERP multi-tenant para empresas mexicanas: ventas,
inventarios, compras, contabilidad, RR.HH., tesorería, cumplimiento fiscal
CFDI 4.0), consumiendo el mismo backend PHP existente. Migración incremental
por módulo, no una reescritura de una sola vez.

Piloto (prueba de fuego): `facturas_venta_33` — la pantalla más compleja del
sistema, elegida deliberadamente para fijar el estándar de las pantallas
tipo "documento" antes de generalizarlo a pedidos, notas de crédito,
compras, etc.

## Dirección visual (a definir con los tokens reales)

Hasta no tener los tokens de Claude Design de `e4c-factura`, aplican estos
lineamientos generales, derivados del propio dominio del sistema:

- **Personalidad**: profesional, confiable, orientado a productividad — el
  usuario típico (personal administrativo/ventas de una empresa mexicana)
  usa esta pantalla varias horas al día. Prioridad: eficiencia de captura y
  legibilidad de datos densos (grids de conceptos, totales, impuestos), no
  estética decorativa.
- **Densidad**: alta en el listado y en el grid de conceptos (tablas de
  datos, muchas columnas numéricas); el formulario de encabezado puede ser
  menos denso.
- **Responsividad**: la motivación original de este proyecto es justamente
  la falta de responsividad de Ext JS 3.4 — cualquier pantalla nueva debe
  funcionar razonablemente en tablet, no solo en desktop de escritorio (el
  caso de uso móvil puro, tipo POS/facturación rápida, ya lo cubren
  `e4c-pos`/`e4c-factura` por separado).

## Sistema de estados de documento (compartido entre pantallas tipo "documento")

Reutiliza los estatus ya definidos por Sisnet V3 (no se inventan nuevos):

| Estatus (código Sisnet V3) | Significado |
|---|---|
| `R` | Registrado |
| `P` | Prefactura / borrador sin timbrar (solo aplica a documentos con CFDI) |
| `T` | Timbrado |
| `A` | Autorizado |
| `C` | Cancelado |

Los colores/tokens para cada estatus quedan pendientes de los tokens reales
de Claude Design — no se fijan aquí de forma provisional para evitar
retrabajo.

## Pantallas del piloto (a diseñar primero)

★ = pantalla hero, la que define el look del patrón "documento".

1. **Login** — selección de empresa/sucursal/instancia incluida (ver
   `specs/features/auth/login.md`).
2. ★ **Listado de facturas** (`facturas_venta_33` → `Search`) — grid
   principal, filtros, acción "Nueva factura".
3. ★ **Detalle de factura (Master + conceptos)** — encabezado + grid de
   conceptos inline. Define el patrón List-Master-Detail-Complemento que se
   reutilizará en el resto de pantallas "documento" — ver
   `docs/arquitectura.md`.
4. **Ventana de pedidos a facturar** (complemento) — ejemplo de "ventana de
   complemento condicional" del patrón.

## Fuera de alcance (no diseñar en el piloto)

- Adendas de cliente, complementos de nicho (comercio exterior, detallista,
  etc.) — ver `CLAUDE.md`, "Alcance del MVP".
- Catálogos y reportes como pantallas propias — patrones a especificar
  después del piloto.
- CRM — tiene su propio frontend (`crm2`).

## Cómo continuar este brief

1. Obtener del usuario el proyecto/tokens de Claude Design de `e4c-factura`.
2. Actualizar `src/index.css` con los tokens reales (reemplazando la paleta
   placeholder).
3. Diseñar primero las pantallas ★ de la lista de arriba.
