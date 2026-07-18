# Feature 003 — Crear pre-factura (Master, alta)

## Propósito

Alta de una factura nueva sin timbrar (`estatus = "P"`). Es el punto de
entrada al Master del patrón List-Master-Detail — el piloto usa
`AddPrefactura`, no `Add` directo (que timbra en el mismo paso; fuera de
alcance por ahora, ver `CLAUDE.md`).

## Entidades involucradas

`factura` (alta), `cliente` (LOV), `concepto` (LOV + captura en el grid
inline del Master).

## Precondiciones

Sesión válida. El usuario tiene acceso de escritura al módulo (no
modelado en detalle en este piloto — Sisnet V3 valida permisos del lado del
backend; el frontend no duplica esa lógica).

## Casos Given/When/Then

### Caso: nueva factura, cliente sin historial previo

```
Given el usuario abre "Nueva factura" desde el listado
When selecciona un cliente que no tiene facturas previas
Then LoadPresetClientData no encuentra datos para precargar (comportamiento
     exacto no confirmado — ver pregunta abierta en
     specs/api-contracts/ventas/facturas.md)
  And el formulario queda con los campos de encabezado vacíos/con default
```

### Caso: nueva factura, cliente con historial

```
Given el usuario selecciona un cliente con facturas previas
When se dispara LoadPresetClientData(cliente_id)
Then el formulario se precarga con método de pago, moneda, forma de pago,
     uso CFDI y régimen fiscal de la última factura de ese cliente
  And el usuario puede sobreescribir cualquier campo precargado antes de
      guardar
```

### Caso: capturar conceptos

```
Given el formulario de encabezado tiene un cliente seleccionado
When el usuario agrega un renglón al grid de conceptos, buscando por SKU
     (LoadLovFieldSku) o capturando el SKU directo (ValidateSku)
Then se agrega el renglón con precio/impuestos ya resueltos por el backend
     (ver specs/entities/concepto.md)
  And los totales del encabezado (sub_total, total_impuestos_trasladados,
      total, ...) se recalculan en el cliente, no se re-consultan al
      backend por cada renglón (ver "impuestos calculados en el cliente",
      docs/decisiones.md ADR-002 de e4c-factura, mismo criterio adoptado aquí)
```

### Caso: guardar (postcondición central — List-Master-Detail)

```
Given el formulario tiene al menos un concepto y los campos obligatorios
      completos
When el usuario guarda
Then se llama AddPrefactura con el payload completo
  And la respuesta trae record con la factura completa, incluyendo el
      folio recién asignado por el backend
  And ese record se agrega a la cache de la lista (feature 002) vía
      queryClient.setQueryData — SIN volver a llamar Search
  And el Master pasa a modo "edición" del folio ya asignado (siguiente
      guardado usa UpdatePrefactura, feature 004, no AddPrefactura de nuevo)
```

## Referencia a contrato de API

`specs/api-contracts/ventas/facturas.md` — `AddPrefactura`, `LoadPresetClientData`.
`specs/api-contracts/lov.md` — clientes, SKU.

## Referencia al patrón de pantalla

`specs/ui-screens/patron-documento-list-master-detail.md`.

## Preguntas abiertas

- Comportamiento exacto de `LoadPresetClientData` sin historial (ver
  `specs/api-contracts/ventas/facturas.md`).
- ¿Los objetos de complementos vacíos (`compl_serv_par_construc`,
  `info_seguros`, `comercio_exterior`, `detallista`) deben enviarse siempre
  presentes-pero-vacíos, o se pueden omitir del payload cuando el piloto no
  los usa? Confirmar con una prueba real antes de simplificar el payload en
  el cliente HTTP.
