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

## Preguntas abiertas

- Confirmar con una prueba real (no solo lectura de código) el formato
  exacto de `expiresAt` y si `SearchSucursalesUsuario` requiere el
  `usuario_id` antes de tener contraseña validada, o si hay un paso
  intermedio no capturado aquí (ej. resolver `usuario_id` a partir del
  `usuario` capturado). Ver `docs/plan-implementacion.md`, Fase 2.
- Persistencia del JWT en el cliente (localStorage vs. memoria) — no
  resuelto aquí, es decisión de `specs/features/auth/login.md`.
