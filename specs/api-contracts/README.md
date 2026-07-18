# Convenciones compartidas de los contratos de API

Detalles que aplican a todos los contratos de este directorio por igual,
para no repetirlos en cada uno. Shape **real** de Sisnet V3 — no una versión
"limpia" inventada. Ver ADR-009 en `docs/decisiones.md`.

## Transporte

- Todas las llamadas son `POST` a `php/interfase_jwt.php`, `Content-Type:
  application/x-www-form-urlencoded` (form body, no JSON — así lo espera el
  backend), `credentials: include`, `mode: cors`.
- El parámetro `opReq` (siempre presente) identifica la operación:
  `modulo:vista:controlador:accion`.
- El JWT viaja como parámetro `session` en el body (ADR-007), agregado
  automáticamente por `src/shared/lib/sisnet-client.ts` — ningún contrato
  documentado aquí lo incluye explícitamente en su tabla de parámetros.
- Arreglos/objetos anidados se serializan estilo `Ext.Ajax`:
  `conceptos[0][sku]=...`, `conceptos[0][impuestos_traslados][0][tasa]=...`
  (ver `sisnet-client.ts`, función `appendParam`).

## Forma de la respuesta exitosa

No hay un shape único — varía por endpoint y está documentado caso por caso
en cada contrato. Patrones observados hasta ahora (confirmados con captura
real, no supuestos):

- Listados: `{"totalCount": number, "records": [...]}`.
- Detalle de un documento: el objeto completo, sin envolver.
- Mutaciones (`Add`/`Update`/`Stamp`/`Cancel`): `{"msg": string, "log":
  string, "record": {...objeto completo actualizado...}}`.
- Algunos LOV regresan `{"records": [...]}` sin `totalCount`; al menos uno
  (`ValidateLovFieldFacturaRelacion` en Sisnet V3) regresa el objeto plano
  sin envolver — inconsistencia real del backend, no error de esta spec.

**No asumir un shape por analogía con otro endpoint.** Cada contrato cita su
propia fuente.

## Forma del error

```json
{
  "success": false,
  "Message": "string (para el usuario)",
  "msg": "string (duplicado de Message en la mayoría de los casos)",
  "OperationRequest": "string (el opReq que falló)",
  "UrlRequest": "string",
  "Code": 0,
  "CodeDescr": "string",
  "File": "string (solo si ERP_DEBUG=true en el backend)",
  "Line": 0,
  "Trace": "string (solo si ERP_DEBUG=true)",
  "forceLogout": "S | N"
}
```

- `forceLogout: "S"` significa que el backend considera la sesión terminada
  (ej. otro login la invalidó) — el cliente debe cerrar sesión de inmediato,
  no solo mostrar el error. `sisnet-client.ts` expone esto vía
  `SisnetError.forceLogout` (boolean) y `setSisnetForceLogoutHandler()`.
- `Message` es el único campo pensado para mostrarse al usuario tal cual (en
  español, generado por el backend) — no requiere traducción por `code` como
  en otros proyectos del usuario (`school-pickup`): aquí el backend ya habla
  español y solo tiene un frontend "cliente" a la vez por ahora.

## Tipos numéricos

Todo campo numérico de cualquier respuesta de Sisnet V3 llega como
`string` (ej. `"total": "3080.000000"`, `"cantidad": "1.0"`). Ningún tipo en
`specs/entities/` debe declarar `number` para un campo que venga
directamente de una respuesta — la conversión, si hace falta, se hace
explícita en el frontend.
