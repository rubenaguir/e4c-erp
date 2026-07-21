# Feature 001 — Login

## Propósito

Autenticar contra Sisnet V3 y obtener un JWT válido — precondición de
cualquier otra feature de este repo (el backend rechaza toda operación sin
sesión válida, salvo la whitelist pública de `interfase_jwt.php`).

## Entidades involucradas

Ninguna de `specs/entities/` (esas son de negocio; el login no expone una
entidad de dominio propia más allá del `user` embebido en la respuesta de
`Login`, no modelado como entidad aparte por ahora).

## Precondiciones

- El usuario existe en Sisnet V3 y tiene al menos una combinación
  empresa/sucursal/instancia asignada (`SearchSucursalesUsuario` no vacío).

## Flujo (dos pasos, por `STAND_ALONE = false` — ver `specs/api-contracts/auth.md`)

```
Given el usuario captura usuario + contraseña
When se solicita SearchSucursalesUsuario(usuario_id)
Then se recibe la lista de combinaciones empresa|sucursal|instancia disponibles

Given exactamente una combinación disponible
When se completa el paso anterior
Then se omite el selector y se procede directo a Login con esa combinación
     (UX: no forzar al usuario a "elegir" cuando no hay elección real)

Given más de una combinación disponible
When se completa el paso anterior
Then se muestra un selector (usando `descripcion` de cada combinación) antes
     de llamar a Login
```

## Casos Given/When/Then

### Caso de éxito

```
Given credenciales correctas y una combinación empresa/sucursal/instancia válida
When se llama a Login(usuario, contrasena, sucursal, workspace)
Then se recibe `session` (JWT) en la respuesta
  And se guarda en el cliente (ver "Persistencia del JWT" abajo)
  And se registra en sisnet-client.ts vía setSisnetSession()
  And se navega a la pantalla principal (listado de facturas del piloto)
```

### Caso: credenciales inválidas

```
Given credenciales incorrectas
When se llama a Login
Then el backend responde con el shape de error genérico (ver
     specs/api-contracts/README.md) — mensaje exacto no confirmado con
     captura real, mostrar `Message` tal cual lo regresa el backend (ya
     viene en español, no requiere traducción — ver CLAUDE.md)
```

### Caso: sesión expira o es invalidada durante el uso (forceLogout)

```
Given una sesión activa
When cualquier request subsecuente responde con forceLogout: "S"
Then se cierra la sesión de inmediato en el cliente (limpiar JWT guardado,
     redirigir a login) — no solo mostrar el error
  And este comportamiento se engancha una sola vez, en el módulo auth, vía
      setSisnetForceLogoutHandler() de sisnet-client.ts — ninguna otra
      feature debe manejar forceLogout por su cuenta
```

### Caso: refresh proactivo de sesión

```
Given una sesión activa con un JWT válido
When queda el 20% (o menos) del tiempo de vida del token
Then el cliente llama TokenRefresh en segundo plano y reemplaza el JWT
     guardado con el que regresa la respuesta (record completo, mismo
     shape que Login) — sin interacción del usuario, sin recargar la app

Given una sesión activa cuya pestaña estuvo en background
When la pestaña vuelve a foco (visibilitychange) y quedan menos de 10
     minutos de vida en el JWT guardado
Then el cliente llama TokenRefresh de inmediato, sin esperar al ciclo
     normal del 80%
```

### Caso: remember_me

```
Given el usuario marca el checkbox "recordarme" al capturar credenciales
When se llama Login con remember_me=true
Then el JWT resultante tiene vigencia de ~30 días en vez del default de la
     sesión (confirmado contra el backend local, ver
     specs/api-contracts/auth.md)

Given el usuario NO marca "recordarme"
When se llama Login
Then el parámetro remember_me se omite del request (o se envía "0") — NUNCA
     se envía el booleano false serializado como string, porque PHP
     interpreta el string "false" como verdadero (ver ADR-011 en
     docs/decisiones.md) — enviarlo tal cual produciría, por error, una
     sesión de 30 días
```

## Referencia a contrato de API

`specs/api-contracts/auth.md` — `SearchSucursalesUsuario`, `Login`,
`TokenRefresh`/`ValidateSession`.

## Preguntas cerradas (confirmadas contra SisnetV3Desarrollo local, usuario de prueba `demo`)

- **Persistencia del JWT**: `localStorage`, key `"sv3_session"`, JWT crudo
  sin envolver. Ver ADR-011 en `docs/decisiones.md` — mismo patrón que
  `e4c-factura` ya valida en producción contra este backend.
- **`usuario_id` de `SearchSucursalesUsuario`**: es el mismo valor que el
  campo `usuario` capturado en login, sin resolución previa. Confirmado por
  código (`Login` pasa el `usuario` crudo a `ValidateUser`, que carga
  `sistema_usuarios WHERE usuario_id = $1` con ese mismo string —
  `php/classes/Sesion.class.php:437`, `php/classes/Usuario.class.php:10-38`)
  y por captura real: `SearchSucursalesUsuario` con `usuario_id=demo`
  devolvió las combinaciones correctas del usuario `demo`.
- **`remember_me`**: sí se expone como checkbox en el login. Ver caso
  Given/When/Then arriba y la advertencia de truthiness en ADR-011.
