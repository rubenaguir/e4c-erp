# API Contract — Auth

Recurso de autenticación. Cubre `specs/features/auth/login.md`.

Ver convenciones compartidas en `specs/api-contracts/README.md` (transporte,
shape de error, `session` en el body).

## Contexto: `STAND_ALONE = false`

`conf/conf.php` de `SisnetV3Desarrollo` tiene `STAND_ALONE = false`
(confirmado por lectura directa del archivo), así que **toda sesión requiere
tres partes**: `empresa_id|sucursal_id|instancia_id`, no solo
empresa+sucursal. El parámetro `sucursal` de `Login` es exactamente este
string compuesto, con el mismo formato que devuelve
`SearchSucursalesUsuario` — de ahí que el flujo real de login sea de dos
pasos, no uno.

## `opReq=seguri:acceso:acceso_jwt:SearchSucursalesUsuario`

Lista las combinaciones empresa/sucursal/instancia a las que un usuario
tiene acceso. Público (no requiere sesión — está en la whitelist de
`interfase_jwt.php`).

**Request**
| Parámetro | Tipo | Notas |
|---|---|---|
| `usuario_id` | string | **Pendiente de confirmar**: por el nombre del parámetro y el uso que le da el query (`sistemas_usuarios.usuario_id`), es probable que sea el mismo valor que el usuario captura como "usuario" al hacer login (no un ID numérico interno distinto) — no confirmado con una captura real, solo por lectura del código fuente (`acceso_jwt.php:35`). Verificar contra el backend local antes de asumirlo en la implementación de la Fase 2. |

**Response 200** (código fuente: `acceso_jwt.php:32-98`, rama `!STAND_ALONE`
líneas 50-67 — es la rama que aplica aquí)
```json
{
  "record": [
    {
      "empresa_sucursal_id": "string (formato empresa_id|sucursal_id|instancia_id)",
      "descripcion": "string (formato empresa_id-sucursal_id)"
    }
  ]
}
```

- **Nombre de campo inconsistente con el resto del backend**: la llave es
  `record` (singular) conteniendo un array, no `records` (plural) como el
  resto de los listados de Sisnet V3 (ej. `Search` de facturas). No es un
  error de esta spec — así está en el código fuente (`acceso_jwt.php:97`).
- `empresa_sucursal_id` es literalmente el valor a pasar como `sucursal` en
  `Login` de abajo — no hay que reconstruirlo a mano en el frontend.

## `opReq=seguri:acceso:acceso_jwt:Login`

Ver `specs/features/auth/login.md`. Público (no requiere sesión).

**Request**
| Parámetro | Tipo | Notas |
|---|---|---|
| `usuario` | string | |
| `contrasena` | string | |
| `sucursal` | string | formato `empresa_id\|sucursal_id\|instancia_id` — viene de `SearchSucursalesUsuario.record[].empresa_sucursal_id` |
| `remember_me` | boolean | opcional, default `false` (código fuente: `acceso_jwt.php:181`). Si es `true`, el JWT se emite con expiración de 30 días en vez de la default de la sesión |
| `workspace` | string | opcional, default `"default"` (código fuente: `acceso_jwt.php:182`) |

**Response 200** (código fuente: `acceso_jwt.php:256-273`)
```json
{
  "success": true,
  "session": "string (JWT — este es el valor a guardar y reenviar como `session` en cada request subsecuente)",
  "usuario": "string (nombre del usuario, no el login)",
  "empresa": "string (nombre de la empresa)",
  "sucursal": "string (nombre de la sucursal)",
  "serviceToken": "string (JWT — mismo valor que `session`, duplicado)",
  "expiresAt": "string | number (formato no confirmado con captura real)",
  "user": {
    "id": "string (usuario_id)",
    "email": "string",
    "name": "string",
    "company": "string",
    "office": "string",
    "permissionMatrix": "object (estructura no documentada aquí — no se usa en el piloto)",
    "roles": "array (estructura no documentada aquí — no se usa en el piloto)"
  }
}
```

- `session` y `serviceToken` son el mismo JWT — usar `session` (nombre
  consistente con el parámetro `session` que el resto de los endpoints
  espera, ver `specs/api-contracts/README.md`).
- `permissionMatrix` y `roles` no se documentan en detalle porque el piloto
  no los consume — si una feature futura los necesita, capturar un ejemplo
  real antes de tipar su estructura (ADR-009).

**Errores conocidos** (por lectura de código, no captura real — confirmar
mensajes exactos al implementar):
| Caso | Código fuente |
|---|---|
| `workspace` vacío | `acceso_jwt.php:202`, `Exception("Seleccione el ambiente de trabajo", ALERT_USUARIO)` |
| `sucursal` sin 3 partes (dado `STAND_ALONE = false`) | `acceso_jwt.php:216`, `Exception("La empresa, sucursal e instancia son inválidas.", ALERT_USUARIO)` |
| Credenciales inválidas | delegado a `Sesion::ValidateUser()` — mensaje exacto no confirmado, verificar en implementación |

**⚠️ `remember_me` — truthiness de string en PHP (confirmado con captura
real).** `GetFromRequest("remember_me", false)` (línea 181/193) recibe
siempre un string (todo parámetro HTTP lo es) y el backend lo evalúa con
`$remember_me ? "30 day" : ""` (línea 246). PHP considera **verdadero**
cualquier string no vacío distinto de `"0"` — **incluyendo el string
`"false"`**. Confirmado contra el backend local: enviar
`remember_me=false` (tal como lo serializaría `String(false)` en JS)
produjo un JWT de 30 días, igual que `remember_me=true`. Solo omitir el
parámetro, o enviar `""`/`"0"`, produce el TTL default (`JWT_EXPIRES_IN`,
"4 hour"). El cliente de `e4c-erp` **nunca** debe enviar el booleano `false`
serializado tal cual — debe omitir la llave del todo cuando el usuario no
marcó "recordarme" (ver ADR-011 en `docs/decisiones.md`).

## `opReq=seguri:acceso:acceso_jwt:TokenRefresh`

Requiere sesión válida (`session` en el body, agregado automáticamente por
`sisnet-client.ts`). No requiere ningún otro parámetro — confirmado con
captura real (ver abajo).

**Código fuente**: `acceso_jwt.php:404-408` —
```php
function TokenRefresh(&$resultType, &$Sistem=null) {
   $resultType = "json";
   return ValidateSession($resultType, $Sistem);
}
```
`TokenRefresh` delega literalmente en `ValidateSession` (el código que
generaba su propia respuesta está comentado, líneas 408-425, no se
ejecuta). Por lo tanto ambas acciones regresan exactamente el mismo shape —
confirmado con captura real: login con usuario de prueba `demo` y llamada
subsecuente a `TokenRefresh` con ese `session` devolvió una respuesta con
las mismas llaves que `Login` (`success, session, usuario, empresa,
sucursal, serviceToken, expiresAt, user{id,email,name,company,office,
permissionMatrix,roles}`).

**`ValidateSession`** (`acceso_jwt.php:428-462`) es la función real. Antes
de armar la respuesta, revisa si el token necesita renovarse:
```php
if ($Sistem->TokenNeedsRenewal())
   $Sistem->GenerateJWToken($Sistem->tokenExpiresIn, $roles);
```
`TokenNeedsRenewal()` (`php/classes/Sesion.class.php:151-158`) compara el
`exp` del token contra `JWT_RENEW_THRESHOLD` (`conf/conf.php:8` = `1800`
segundos, umbral **fijo** interno del backend — no confundir con el 80% que
decide el frontend para llamar proactivamente, son dos cosas
independientes). Si el token está lejos de expirar, `TokenRefresh` regresa
el mismo `session` sin cambios (confirmado: llamar `TokenRefresh`
inmediatamente después de un `Login` fresco devolvió el mismo `expiresAt`,
sin renovar).

`$Sistem->tokenExpiresIn` viene de decodificar el claim `expiresIn` del
propio JWT entrante (`php/interfase_jwt.php:144-148`), que a su vez fue
escrito por `GenerateJWToken` al emitir el token
(`Sesion.class.php:118-149`, línea 142: `"expiresIn" => $duration`). Por
transitividad, un token emitido con `remember_me=true` (`"30 day"`) sigue
regenerándose con esa misma duración en cada renovación futura vía
`TokenRefresh`, nunca cae al default de 4h.

**Response 200** — idéntico al de `Login` (mismas llaves, ver arriba).

## Preguntas cerradas (confirmadas contra SisnetV3Desarrollo local, usuario de prueba `demo`)

- **Formato de `expiresAt`**: string `"Y-m-d H:i:s"` (ej.
  `"2026-08-19 19:24:31"`), no epoch/millis. Confirmado en código
  (`Sesion.class.php:127`: `$dt->format("Y-m-d H:i:s")`, asignado a
  `$Sistem->SesionEnd`) y en captura real de `Login`/`TokenRefresh`. Mismo
  campo, mismo formato, en las tres acciones (`Login`, `ValidateSession`,
  `TokenRefresh`).
- **Persistencia del JWT en el cliente**: `localStorage`, key
  `"sv3_session"` — ver ADR-011 en `docs/decisiones.md` y
  `specs/features/auth/login.md`.
- **`SearchSucursalesUsuario` antes de tener contraseña validada**: no hay
  paso intermedio — es público (whitelist de `interfase_jwt.php`, no
  requiere sesión) y usa directamente el `usuario` capturado como
  `usuario_id`, sin resolución previa. Confirmado con captura real.
