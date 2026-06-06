# INFO FRONTEND — Cambios del Backend

> Para el equipo de frontend. Describe qué cambió, qué falta y cómo llamar cada endpoint.
> Backend corre en: `http://localhost:8080`
> Última actualización: 2026-06-06

---

## 1. Cambios recientes

| Fecha | Qué cambió | Qué necesita saber el frontend |
|-------|-----------|-------------------------------|
| 2026-06-06 | `GET /tutorial` implementado | El frontend ya NO necesita Google Drive para el tutorial. Reemplazar `useGetDocuments` con axios al backend. El instructivo tiene reglas del juego + 48 tarjetas (escenario y solución) con sus valores de recursos. |
| 2026-06-06 | Endpoints de favoritos: `POST /user/favorites`, `GET /user/favorites`, `DELETE /user/favorites/:content_id` | Ya se puede implementar el guardado de artículos y presentaciones favoritas. Requieren JWT. Ver contratos en sección 3. |
| 2026-06-06 | Campo `favorites` agregado al modelo de usuario | Array de `{ content_id, type }` — el frontend no lo recibe en `GET /user/profile`, se obtiene aparte con `GET /user/favorites`. |
| 2026-06-05 | Endpoints de contenido: `GET /evaluations`, `/evaluations/:id`, `/articles`, `/articles/:id`, `/presentations` | El frontend ya NO necesita Google APIs para cargar contenido. Reemplazar todas las llamadas a `gapi.client` con axios al backend. |
| 2026-06-05 | Evaluaciones, artículos y presentaciones migrados a MongoDB Atlas | Las 6 evaluaciones (3 Arquitectura + 3 Diseño Industrial), 26 artículos y 2 presentaciones ya están en la base de datos. |
| 2026-06-04 | Nuevos endpoints `POST /user/forgot-password` y `POST /user/reset-password` | Ya se puede implementar la pantalla de recuperación de contraseña. Ver contratos en sección 3. |
| 2026-05-29 | `POST /user/score` implementado | Listo para integrarse en `FinalScoreEvaluation.tsx` al terminar una evaluación. |
| 2026-05-29 | `DELETE /user` implementado | Listo para integrarse en la UI de perfil como opción "Eliminar cuenta". |

---

## 2. Lo que falta integrar en el frontend

> El backend tiene todo implementado. Lo pendiente es solo trabajo del frontend.

| Elemento | Dónde integrarlo | Estado |
|----------|-----------------|--------|
| Reemplazar `useGetDocuments` (tutorial) | Hook del tutorial — apuntar a `GET /tutorial` | ⚠️ Pendiente en frontend |
| Reemplazar `gapi.client` con axios | Todas las pantallas que cargan evaluaciones, artículos y presentaciones | ⚠️ Pendiente en frontend |
| Integrar favoritos | Menú lateral / pantalla de favoritos — usar los 3 endpoints de `/user/favorites` | ⚠️ Pendiente en frontend |
| Integrar `POST /user/score` | `FinalScoreEvaluation.tsx` al terminar una evaluación | ⚠️ Pendiente en frontend |
| Integrar `DELETE /user` | UI de perfil — opción "Eliminar cuenta" | ⚠️ Pendiente en frontend |
| Integrar `POST /user/forgot-password` y `POST /user/reset-password` | Pantalla de login / recuperación de contraseña | ⚠️ Pendiente en frontend |

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
> El frontend debe guardar este token y enviárselo al usuario para que pueda usarlo en `/user/reset-password`.

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
> El campo `favorites` **no** viene en esta respuesta — usar `GET /user/favorites` para obtenerlos.

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

### POST `/user/favorites`
Agrega un artículo o presentación a la lista de favoritos del usuario.

**Headers requeridos**
```
Authorization: Bearer <token>
```

**Body**
```json
{
  "content_id": "<_id del artículo o presentación>",
  "type": "article"
}
```
> `type` acepta solo `"article"` o `"presentation"`.

**Respuesta exitosa — 200**
```json
{ "success": true, "message": "Favorito agregado" }
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Token requerido"` | Header ausente |
| `"El ID del contenido es requerido"` | `content_id` vacío o ausente |
| `"El tipo debe ser article o presentation"` | `type` con valor inválido |
| `"Ya está en favoritos"` | El `content_id` ya está en la lista del usuario |
| `"Usuario no encontrado"` | El usuario del token ya no existe en DB |

---

### GET `/user/favorites`
Retorna la lista completa de favoritos del usuario autenticado.

**Headers requeridos**
```
Authorization: Bearer <token>
```

**Respuesta exitosa — 200**
```json
{
  "success": true,
  "favorites": [
    { "content_id": "664abc...", "type": "article" },
    { "content_id": "664def...", "type": "presentation" }
  ]
}
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Token requerido"` | Header ausente |
| `"Usuario no encontrado"` | El usuario del token ya no existe en DB |

---

### DELETE `/user/favorites/:content_id`
Elimina un favorito de la lista del usuario por su `content_id`.

**Headers requeridos**
```
Authorization: Bearer <token>
```

**Parámetro de URL**
```
/user/favorites/664abc123def456...
```

**Respuesta exitosa — 200**
```json
{ "success": true, "message": "Favorito eliminado" }
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Token requerido"` | Header ausente |
| `"Usuario no encontrado"` | El usuario del token ya no existe en DB |
| `"No se pudo eliminar el favorito"` | Error interno de DB |

---

### GET `/evaluations`
Lista todas las evaluaciones **sin** las preguntas (solo `name`, `career` y `_id`).

**Respuesta exitosa — 200**
```json
{
  "success": true,
  "evaluations": [
    { "_id": "...", "name": "Arquitectura Nivel 1", "career": "Arquitectura" },
    { "_id": "...", "name": "Diseño Industrial Nivel 1", "career": "Diseño Industrial" }
  ]
}
```

---

### GET `/evaluations/:id`
Retorna una evaluación completa con todas sus preguntas, opciones y valores.

**Respuesta exitosa — 200**
```json
{
  "success": true,
  "evaluation": {
    "_id": "...",
    "name": "Arquitectura Nivel 1",
    "career": "Arquitectura",
    "questions": [
      {
        "category": "ECOSISTEMA",
        "text": "En tu análisis de sitio, ¿cuáles de los siguientes factores consideraste?",
        "options": [
          { "text": "Recorrido del sol", "value": 1 },
          { "text": "Impacto de vientos", "value": 1 }
        ]
      }
    ]
  }
}
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Evaluación no encontrada"` | El `_id` no existe |

---

### GET `/articles`
Lista todos los artículos.

**Respuesta exitosa — 200**
```json
{
  "success": true,
  "articles": [
    {
      "_id": "...",
      "title": "Título del artículo",
      "subtitle": "...",
      "type": "article",
      "body": "...",
      "image": "https://url-imagen.com/img.jpg",
      "author": "Nombre Autor",
      "author_image": "https://...",
      "page_image": "https://...",
      "category": "...",
      "tags": ["tag1", "tag2"],
      "bibliography": "..."
    }
  ]
}
```

---

### GET `/articles/:id`
Retorna un artículo por su `_id`.

**Respuesta exitosa — 200**
```json
{ "success": true, "article": { ...mismo esquema que arriba... } }
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Artículo no encontrado"` | El `_id` no existe |

---

### GET `/presentations`
Lista todas las presentaciones con las URLs de cada slide.

**Respuesta exitosa — 200**
```json
{
  "success": true,
  "presentations": [
    {
      "_id": "...",
      "name": "Is Sustainable Innovation an Oxymoron",
      "slides": [
        "https://res.cloudinary.com/.../slide1.jpg",
        "https://res.cloudinary.com/.../slide2.jpg"
      ]
    }
  ]
}
```

---

### GET `/tutorial`
Retorna el instructivo completo del juego SOSTEK: reglas + 48 tarjetas.

**Respuesta exitosa — 200**
```json
{
  "success": true,
  "tutorial": {
    "_id": "...",
    "title": "Instructivo SOSTEK",
    "rules": "Recursos del pueblo: 20 fichas de c/u...",
    "cards": [
      {
        "name": "ALIANZA ESTRATÉGICA",
        "description": "Un reconocido grupo farmacéutico...",
        "type": "scenario",
        "resources": { "ambiental": 0, "economico": 0, "social": 0 }
      },
      {
        "name": "APICULTORES",
        "description": "Implementaste un programa de rescate...",
        "type": "solution",
        "resources": { "ambiental": 2, "economico": -2, "social": 0 }
      }
    ]
  }
}
```

> - `type: "scenario"` = tarjeta de escenario (problema), se coloca al centro de la mesa
> - `type: "solution"` = tarjeta de propuesta (solución), la juegan los participantes
> - `resources` tiene 3 valores numéricos: `ambiental` (verde), `economico` (naranja), `social` (azul)
> - Hay 16 tarjetas de escenario y 32 de solución

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Tutorial no encontrado"` | La colección `tutorial` está vacía — correr `npm run seed:tutorial` |

---

## 4. Variables de entorno

El frontend no depende de variables de entorno del backend. Solo necesita apuntar al host correcto:

| Entorno | URL base del backend |
|---------|---------------------|
| Desarrollo local | `http://localhost:8080` |
| Producción | *(a definir cuando se haga deploy)* |

> Actualmente la URL del backend está hardcodeada en el frontend. Para producción se recomienda moverla a una variable de entorno como `REACT_APP_BACKEND_URL`.
