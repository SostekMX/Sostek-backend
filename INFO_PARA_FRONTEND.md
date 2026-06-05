# INFO FRONTEND — Cambios del Backend

> Para el equipo de frontend. Describe qué cambió, qué falta y cómo llamar cada endpoint.
> Backend corre en: `http://localhost:8080`
> Última actualización: 2026-06-04

---

## 1. Cambios recientes

| Fecha | Qué cambió | Qué necesita saber el frontend |
|-------|-----------|-------------------------------|
| 2026-06-04 | Nuevos endpoints `POST /user/forgot-password` y `POST /user/reset-password` | Ya se puede implementar la pantalla de recuperación de contraseña. Ver contratos en sección 3. |
| 2026-06-04 | El modelo de usuario tiene dos campos nuevos: `reset_token` y `reset_token_expiry` | Campos internos — el frontend no los recibe ni los envía directamente. |

---

## 2. Lo que falta implementar

| Endpoint | Por qué lo necesita el frontend | Estado |
|----------|---------------------------------|--------|
| `POST /user/favorites` (o similar) | El menú lateral muestra "Favoritos" pero no hay endpoint para guardar artículos favoritos | ❌ No existe todavía — pendiente definir contrato |

> Todo lo demás ya está implementado en el backend. Los ítems pendientes del lado frontend son:
> - Integrar `POST /user/score` al terminar una evaluación (`FinalScoreEvaluation.tsx`)
> - Integrar `DELETE /user` en la UI (opción "Eliminar cuenta")
> - Integrar `POST /user/forgot-password` y `POST /user/reset-password` en la pantalla de login

---

## 3. Contratos de cada endpoint

> Todas las respuestas son JSON. El campo `success: false` siempre viene acompañado de `error` (string).
> Los endpoints protegidos requieren el header: `Authorization: Bearer <token>`

---

### POST `/user/signup`
Crea una cuenta nueva y retorna un JWT.

**Body**
```json
{
  "name": "Juan",
  "surname": "Pérez",
  "email": "juan@ejemplo.com",
  "password": "minimo6chars",
  "birth_date": "2000-01-15",
  "occupation": "Estudiante",
  "gender": "Masculino"
}
```
> `birth_date`, `occupation` y `gender` son opcionales.

**Respuesta exitosa — 200**
```json
{ "success": true, "token": "<jwt>" }
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Correo inválido"` | Email mal formado |
| `"La contraseña debe tener al menos 6 caracteres"` | Password corto |
| `"El nombre es requerido"` | `name` vacío o ausente |
| `"El apellido es requerido"` | `surname` vacío o ausente |
| `"Correo ingresado está ya registrado en la plataforma"` | Email duplicado |
| `"Demasiados intentos, intenta más tarde"` | Rate limit superado (10 req / 15 min) |

---

### POST `/user/login`
Valida credenciales y retorna un JWT.

**Body**
```json
{
  "email": "juan@ejemplo.com",
  "password": "micontraseña"
}
```

**Respuesta exitosa — 200**
```json
{ "success": true, "token": "<jwt>" }
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Correo inválido"` | Email mal formado |
| `"La contraseña es requerida"` | `password` vacío |
| `"Cuenta no registrada"` | No existe usuario con ese email |
| `"Contraseña incorrecta"` | Password no coincide |
| `"Demasiados intentos, intenta más tarde"` | Rate limit superado (10 req / 15 min) |

---

### POST `/user/forgot-password`
Genera un token de recuperación válido por **1 hora** y lo retorna en la respuesta.

**Body**
```json
{
  "email": "juan@ejemplo.com"
}
```

**Respuesta exitosa — 200**
```json
{ "success": true, "reset_token": "<64-char-hex-string>" }
```
> El frontend debe guardar este token y enviárselo al usuario (por la vía que corresponda) para que pueda usarlo en `/user/reset-password`.

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Correo inválido"` | Email mal formado |
| `"Correo no registrado"` | No existe usuario con ese email |
| `"Error al generar token"` | Error interno de base de datos |
| `"Demasiados intentos, intenta más tarde"` | Rate limit superado (10 req / 15 min) |

---

### POST `/user/reset-password`
Cambia la contraseña usando el token recibido de `/user/forgot-password`. El token se invalida tras usarse.

**Body**
```json
{
  "token": "<reset_token recibido>",
  "new_password": "nuevacontraseña"
}
```

**Respuesta exitosa — 200**
```json
{ "success": true, "message": "Contraseña actualizada" }
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"El token es requerido"` | Campo `token` ausente |
| `"La contraseña debe tener al menos 6 caracteres"` | `new_password` corto |
| `"Token inválido"` | Token no existe en la base de datos |
| `"Token expirado"` | Han pasado más de 60 minutos desde que se generó |

---

### GET `/user/profile`
Retorna los datos del usuario autenticado (sin contraseña).

**Headers requeridos**
```
Authorization: Bearer <token>
```

**Respuesta exitosa — 200**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "name": "Juan",
    "surname": "Pérez",
    "email": "juan@ejemplo.com",
    "birth_date": "2000-01-15",
    "occupation": "Estudiante",
    "gender": "Masculino",
    "score_test": 0,
    "score_game": 0
  }
}
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Token requerido"` | Header `Authorization` ausente |
| `"Token inválido o expirado"` | JWT corrupto o vencido (7 días) |
| `"Usuario no encontrado"` | El usuario del token ya no existe en DB |

---

### POST `/user/edit`
Actualiza datos del perfil. Usa el email del JWT — no enviar email en el body.

**Headers requeridos**
```
Authorization: Bearer <token>
```

**Body**
```json
{
  "name": "Juan",
  "surname": "Pérez",
  "birth_date": "2000-01-15",
  "occupation": "Ingeniero",
  "gender": "Masculino"
}
```
> `birth_date`, `occupation` y `gender` son opcionales. Si no se envían, no se modifican.

**Respuesta exitosa — 200**
```json
{ "success": true, "message": "Usuario actualizado" }
```

**Errores posibles**
| `error` / `message` | Causa |
|---------------------|-------|
| `"Token requerido"` | Header ausente |
| `"Token inválido o expirado"` | JWT vencido |
| `"El nombre es requerido"` | `name` vacío |
| `"El apellido es requerido"` | `surname` vacío |
| `"No se pudo actualizar información del usuario"` | Error interno de DB |

---

### POST `/user/score`
Actualiza el puntaje del test, del juego, o ambos. Requiere al menos uno de los dos campos.

**Headers requeridos**
```
Authorization: Bearer <token>
```

**Body**
```json
{
  "score_test": 145,
  "score_game": 80
}
```
> Se puede enviar solo `score_test`, solo `score_game`, o ambos.

**Respuesta exitosa — 200**
```json
{ "success": true, "message": "Puntaje actualizado" }
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Token requerido"` | Header ausente |
| `"Token inválido o expirado"` | JWT vencido |
| `"Se requiere al menos score_test o score_game"` | Body vacío |
| `"El puntaje del test debe ser un número"` | `score_test` no es numérico |
| `"El puntaje del juego debe ser un número"` | `score_game` no es numérico |

---

### DELETE `/user`
Elimina permanentemente la cuenta del usuario autenticado.

**Headers requeridos**
```
Authorization: Bearer <token>
```

**Respuesta exitosa — 200**
```json
{ "success": true, "message": "Cuenta eliminada" }
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Token requerido"` | Header ausente |
| `"Token inválido o expirado"` | JWT vencido |
| `"Usuario no encontrado"` | El usuario ya no existe en DB |

---

## 4. Variables de entorno

El frontend no depende de variables de entorno del backend. Solo necesita apuntar al host correcto:

| Entorno | URL base del backend |
|---------|---------------------|
| Desarrollo local | `http://localhost:8080` |
| Producción | *(a definir cuando se haga deploy)* |

> Actualmente la URL del backend está hardcodeada en el frontend. Para producción se recomienda moverla a una variable de entorno como `REACT_APP_BACKEND_URL`.
