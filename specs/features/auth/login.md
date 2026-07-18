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

## Referencia a contrato de API

`specs/api-contracts/auth.md` — `SearchSucursalesUsuario`, `Login`.

## Preguntas abiertas (no resolver por defecto — confirmar antes de implementar)

- **Persistencia del JWT**: ¿localStorage (sobrevive recargas, pero
  expuesto a XSS) o solo en memoria (más seguro, pero pierde la sesión al
  recargar la pestaña)? `e4c-factura` ya resolvió esto para su propio caso
  — revisar su implementación real (no solo sus specs) antes de decidir
  aquí, en vez de elegir a ciegas.
- **`usuario_id` de `SearchSucursalesUsuario`**: confirmar si es el mismo
  valor que el campo `usuario` que el usuario captura, o si requiere una
  resolución previa (ver nota en `specs/api-contracts/auth.md`).
- **`remember_me`**: ¿el piloto expone un checkbox "recordarme" en el login,
  o se omite en esta primera versión? No decidido.
