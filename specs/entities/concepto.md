# Entity: `concepto`

## Propósito

Renglón de una factura (producto/servicio facturado). Vive anidado en
`factura.conceptos[]` — no es un recurso independiente, pero se documenta
aparte porque también se consume de forma independiente vía LOV de SKU al
capturar el grid de conceptos.

## Campos observados

Fuente: `e4c-factura/docs/spec/09-sv3-contracts.md`, `factura.conceptos[]`
dentro de `Load`/`AddPrefactura` (líneas 142-178, 742-778) y los endpoints
`LoadLovFieldSku` (líneas 465-579) / `ValidateSku` (líneas 583-655).

| Campo | Tipo (tal cual llega) | Notas |
|---|---|---|
| `sku` | string | |
| `descripcion` | string | |
| `clave_prod_ser_sat` | string | catálogo SAT c_ClaveProdServ |
| `no_identificacion` | string \| null | puede repetir el `sku` o venir vacío |
| `cantidad` | string numérico | ej. `"1.0"` |
| `unidad_id` | string | |
| `precio_lista` / `precio_unitario` | string numérico | |
| `descuento` | string numérico | importe, no porcentaje — el porcentaje vive en `factor_descuento` |
| `tipo_descuento` | string | `"F"` visto en captura (fijo/importe) — confirmar catálogo completo antes de asumir otros valores |
| `factor_descuento` | string numérico | |
| `deducible_integrado` | string numérico | relacionado al complemento de seguros, fuera de alcance del piloto |
| `importe` / `importe_precio_lista` | string numérico | |
| `objeto_impuesto_sat` | string | catálogo SAT c_ObjetoImp |
| `usa_lotes` / `usa_series` / `es_paquete` / `almacenable` | string `"S"`\|`"N"` | |
| `item` | string numérico | posición del renglón, 1-based |
| `observaciones` | string \| null | |
| `cuenta_predial_numero` | string \| null | solo aplica a arrendamiento de inmuebles |
| `lista_precios_id` | string \| null | puede venir `null` en `Load` y con valor en la respuesta de `AddPrefactura` (el backend la resuelve al guardar) |

### Solo en `LoadLovFieldSku`/`ValidateSku` (no en `factura.conceptos[]`)

| Campo | Tipo | Notas |
|---|---|---|
| `marca` / `modelo` / `submodelo` | string \| null | |
| `fraccion_arancelaria` | string \| null | comercio exterior |
| `clave_unidad_sat` | string | catálogo SAT c_ClaveUnidad |
| `unidad_aduana` | string \| null | |
| `precio` | string numérico | precio base, distinto de `precios[]` (por lista) |
| `esquema_impuestos_id` | string | agrupa los impuestos aplicables a este SKU |
| `moneda_id` / `tipo_cambio` | string | |
| `precios` | array de tuplas `[lista_precios_id, precio, moneda_id, tipo_cambio]` | **no** es un array de objetos — son arrays posicionales, ver ejemplo en la fuente |
| `estatus` | string | solo en `ValidateSku`, no en `LoadLovFieldSku` — `A` visto en captura |

## Relaciones

| Campo | Tipo | Notas |
|---|---|---|
| `impuestos_traslados` | array de `{impuesto, aplicacion, tasa, importe}` (+ `esquema_impuestos_id`, `tipo_factor`, `num_impuesto` en el shape de `LoadLovFieldSku`) | IVA/IEPS trasladado |
| `impuestos_retenciones` | array, mismo shape | ISR/IVA retenido — visto vacío (`[]`) en todas las capturas del piloto, catálogo de campos sin confirmar hasta tener un ejemplo con datos |
| `info_aduanera` | array | solo en `factura.conceptos[]`, comercio exterior — fuera de alcance del piloto, visto siempre vacío |

## Invariantes de negocio observadas

- `impuestos_traslados[].importe` en `factura.conceptos[]` es el importe ya
  calculado (`"440.00"`), no la tasa aplicada sobre la marcha — el cálculo
  de impuestos ocurre en el frontend al capturar (mismo criterio que
  `e4c-factura`, ADR-006 de ese proyecto) y se envía ya calculado al guardar.
- `precios[]` de `LoadLovFieldSku` son arrays posicionales, no objetos — un
  error común al tipar esto sería asumir `{lista, precio, moneda,
  tipoCambio}` en vez del array de 4 posiciones real.

## Fuente

`e4c-factura/docs/spec/09-sv3-contracts.md`, líneas 142-178, 465-655,
742-778.
