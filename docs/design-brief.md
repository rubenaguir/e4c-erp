# Design brief — e4c-erp

> Los tokens de diseño ("Claude Design") ya están portados a
> `src/index.css` desde `e4c-factura` (proyecto hermano, misma familia de
> producto — ver ADR-002 en `docs/decisiones.md`). Ya no aplica la paleta
> placeholder mencionada más abajo.

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

## Dirección visual

Tokens de color/radio ya definidos en `src/index.css` (portados de
`e4c-factura`, ver ADR-002). Lineamientos generales derivados del propio
dominio del sistema:

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

Login con imagen de fondo (heredada de e4c-factura) + overlay oscuro-azulado
de marca, card semi-transparente enmarcado (ancho máximo ~380-400px) —
refuerza identidad de marca en el punto de entrada sin comprometer
legibilidad. Pantallas internas (listado/detalle de facturas) NO heredan
este tratamiento — mantienen fondo neutro, ya que ahí prioriza densidad de
datos sobre identidad de marca.

Imagen completa del handoff oficial (login-bg-h.png origen), decisión
consciente de mantener el mockup visible pese a mostrar la marca
"FacturaGlobal" de un producto hermano.

## Sistema de estados de documento (compartido entre pantallas tipo "documento")

Reutiliza los estatus ya definidos por Sisnet V3 (no se inventan nuevos):

| Estatus (código Sisnet V3) | Significado | Color (fuente: Badge.tsx del handoff) |
|---|---|---|
| `R` | Registrado | Color pendiente de definir — no está en el Badge.tsx del handoff actual, no se inventa aquí. |
| `P` | Prefactura / borrador sin timbrar (solo aplica a documentos con CFDI) | Fondo `var(--muted)`, texto `var(--muted-foreground)` |
| `T` | Timbrado | Fondo `#16A34A` (verde), texto blanco |
| `A` | Autorizado | Color pendiente de definir — no está en el Badge.tsx del handoff actual, no se inventa aquí. |
| `C` | Cancelado | Fondo `var(--destructive)`, texto blanco |

El design system trae además un variant "pendiente" (ámbar) en `Badge.tsx`
sin mapeo confirmado a ninguno de los estatus R/P/T/A/C de arriba — podría
aplicar a otro módulo/pantalla futura; no se usa en el piloto por ahora.

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

1. ~~Obtener del usuario el proyecto/tokens de Claude Design de `e4c-factura`.~~ Hecho.
2. ~~Actualizar `src/index.css` con los tokens reales.~~ Hecho.
3. Diseñar primero las pantallas ★ de la lista de arriba.
