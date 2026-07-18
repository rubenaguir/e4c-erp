---
name: new-feature-spec
description: Genera las specs SDD (entities/features/api-contracts) de una feature nueva de e4c-erp contra un módulo de Sisnet V3, sin alucinar contratos de API. Úsalo cuando el usuario pida "especificar", "agregar spec de", o "migrar la pantalla de <módulo>" antes de escribir código.
---

# new-feature-spec

Genera las specs SDD de una feature nueva de `e4c-erp`, siguiendo
`specs/README.md`. Adaptado del patrón de
`crm2/prompts_for_ia/module_initiation.md`.

## Cuándo usar esta skill

Antes de implementar cualquier pantalla o acción nueva contra un módulo de
Sisnet V3 que todavía no tiene spec en `specs/`. Si la spec ya existe, no
uses esta skill — implementa directo contra ella.

## Regla no negociable: no alucinar contratos

Este es el propósito central de la skill, no un detalle secundario. Antes de
escribir una sola línea de `specs/api-contracts/`:

1. **Busca una captura real primero.** Revisa, en este orden:
   - `specs/api-contracts/` de este repo (¿ya existe un contrato parecido
     del mismo módulo?).
   - `C:\d\Empresa4Cero\apps\e4c-factura\docs\spec\09-sv3-contracts*.md`
     (payloads reales ya capturados contra Sisnet V3).
   - El código fuente del Agent PHP en
     `C:\wamp\www\SisnetV3Desarrollo\modules\{modulo}\{vista}\{controlador}.php`
     — lee la función real y su `json_encode(...)`, no infieras la forma
     por el nombre de la función.
2. **Si no hay captura ni código accesible**, dilo explícitamente en la spec
   como "pendiente de captura real contra el backend" — nunca inventes un
   shape "razonable". Un contrato sin fuente citada es peor que no tener
   contrato: alguien lo va a implementar como si fuera verdad.
3. **Cada endpoint documentado cita su fuente** (archivo:línea del Agent PHP,
   o la sección exacta de `09-sv3-contracts*.md`).

## Pasos

1. Identifica el módulo de Sisnet V3 (ej. `ventas`, `compras`) y la pantalla
   dentro de ese módulo a especificar, usando el mismo nombre que el sistema
   legado (ej. `pedidos_venta`, `facturas_venta_33`). Si la spec es
   transversal y no pertenece a ningún módulo de negocio (ej. login), trátala
   como pseudo-módulo (ej. `auth`) en vez de forzarla dentro de un módulo
   real — ver `specs/README.md`, "Organización por módulo".
2. Determina el patrón de pantalla que le aplica: documento, catálogo o
   reporte (ver `docs/arquitectura.md` y, para el patrón documento,
   `specs/ui-screens/patron-documento-list-master-detail.md`). Si es un
   patrón nuevo (no documento/catálogo/reporte), pregunta al usuario antes
   de asumir uno.
3. Para cada acción de la pantalla (buscar, cargar, guardar, cancelar, ...),
   localiza el Agent PHP real y extrae: parámetros de entrada, shape de
   respuesta exitosa, shape de error si difiere del genérico de
   `specs/api-contracts/README.md`.
4. Escribe/actualiza, siguiendo la convención de `specs/README.md`
   ("Organización por módulo"):
   - `specs/entities/{modulo}/{entidad}.md` — campos observados, tal cual
     llegan (recuerda: numéricos como `string`). Si la entidad ya es
     compartida por otro módulo (ej. `cliente`, `concepto`), no la dupliques
     ni la anides bajo `{modulo}/` — actualiza la existente en la raíz de
     `entities/`.
   - `specs/api-contracts/{modulo}/{dominio}.md` — un contrato por acción,
     siguiendo el formato de `specs/api-contracts/ventas/facturas.md`
     (piloto). Si el contrato es transversal (ej. autenticación, LOV), va
     plano en la raíz de `api-contracts/`, no bajo un módulo.
   - `specs/features/{modulo}/{pantalla}/NNN-{accion}.md` — Given/When/Then,
     con postcondición explícita sobre parcheo de cache (TanStack Query) si
     la acción muta un documento. `NNN-` es numeración local a la carpeta de
     la pantalla, no un contador global del proyecto.
5. Si la pantalla sigue el patrón documento y necesita algo que
   `patron-documento-list-master-detail.md` no cubre (ej. un complemento
   nuevo), extiende ese documento en vez de reinventar el patrón dentro de
   la spec de la feature nueva.
6. Termina la spec con una sección "Preguntas abiertas" explícita — no
   dejar vacíos implícitos que alguien completará "sobre la marcha" al
   implementar.
