# INFO FRONTEND — Cambios del Backend

> Para el equipo de frontend. Describe qué cambió, qué falta y cómo llamar cada endpoint.
> Backend corre en: `http://localhost:8080`
> Última actualización: 2026-06-09

---

## 1. Cambios recientes

| Fecha | Qué cambió | Qué necesita saber el frontend |
|-------|-----------|-------------------------------|
| 2026-06-09 | **`POST /user/forgot-password` — flujo cambiado** | Ya no retorna `reset_token` en la respuesta. Ahora envía un **email** al usuario con el link y el token. Ver nuevo contrato abajo. **El frontend necesita actualizar las pantallas ForgotPassword y ResetPassword.** |
| 2026-06-09 | **`POST /user/login` — mensajes de error unificados** | Ya no distingue entre "correo no registrado" y "contraseña incorrecta". Ahora ambos casos devuelven `"Correo o contraseña incorrectos"`. Actualizar cualquier lógica que compare el mensaje de error. |
| 2026-06-08 | `POST /user/avatar` implementado | Nueva pantalla o botón para subir foto de perfil. Enviar `multipart/form-data` con el campo `avatar`. Formatos aceptados: jpg, png, webp (máx 5MB). La URL del avatar queda disponible en `GET /user/profile` como `avatar`. Ver contrato en sección 3. |
| 2026-06-08 | Campo `avatar` agregado al modelo de usuario y al perfil | `GET /user/profile` ahora incluye `avatar` (string URL de Cloudinary, o `""` si no tiene foto). |
| 2026-06-08 | Campo `description` en evaluaciones | `GET /evaluations` ahora incluye `description` en cada ítem de la lista. Puede mostrarse como subtítulo o descripción en la UI de selección de evaluación. |
| 2026-06-08 | Campo `cover` en presentaciones | `GET /presentations` ahora incluye `cover` (URL de imagen de portada de Cloudinary) en cada presentación. Puede usarse como thumbnail en la lista. |
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
| **Actualizar pantalla `ForgotPassword`** | Ya no leer `reset_token` de la respuesta. Mostrar mensaje "Revisá tu correo" y nada más. Ver flujo completo abajo. | 🔴 Requiere cambio — flujo roto si no se actualiza |
| **Actualizar pantalla `ResetPassword`** | Leer el token del query param `?token=` de la URL en vez de `sessionStorage`. El link del email llega como `http://localhost:3000/ResetPassword?token=<token>`. | 🔴 Requiere cambio — flujo roto si no se actualiza |
| Actualizar mensajes de error en login | Si el frontend compara el string de error (`"Cuenta no registrada"`, `"Contraseña incorrecta"`), ahora ambos son `"Correo o contraseña incorrectos"` | 🟡 Solo si se compara el string de error |

---

### Flujo nuevo de recuperación de contraseña

```
1. Usuario ingresa su email en ForgotPassword
2. Frontend llama POST /user/forgot-password con { email }
3. Backend responde { success: true, message: "Si el correo está registrado..." }
   → El mismo mensaje para email registrado y no registrado
4. Frontend muestra el mensaje y listo — no guarda ningún token
5. Usuario recibe email con link: http://localhost:3000/ResetPassword?token=<token>
6. Usuario hace clic en el link → llega a ResetPassword con ?token= en la URL
7. Frontend lee el token con: new URLSearchParams(window.location.search).get('token')
   (o el equivalente en React Router / Ionic)
8. Usuario escribe nueva contraseña → Frontend llama POST /user/reset-password con { token, new_password }
9. Al éxito, redirigir a login
```

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
| `"Correo o contraseña incorrectos"` | Email no registrado **o** contraseña incorrecta (mensaje unificado) |
| `"Demasiados intentos, intenta más tarde"` | Rate limit superado (10 req / 15 min) |

---

### POST `/user/forgot-password`
Envía un email al usuario con un link de recuperación válido por **1 hora**. El token ya **no** viene en la respuesta — llega por email.

**Body**
```json
{
  "email": "juan@ejemplo.com"
}
```

**Respuesta exitosa — 200**
```json
{ "success": true, "message": "Si el correo está registrado, recibirás instrucciones en tu bandeja de entrada" }
```
> ⚠️ La respuesta es **siempre la misma** independientemente de si el email existe o no.
> El frontend solo muestra este mensaje — no hace nada más.

**El email que recibe el usuario contiene:**
- Un link: `http://localhost:3000/ResetPassword?token=<token>`
- El token en texto plano (por si el link no funciona)

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Correo inválido"` | Email mal formado |
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
    "score_game": 0,
    "avatar": "https://res.cloudinary.com/.../sostek/avatars/foto.jpg"
  }
}
```
> El campo `favorites` **no** viene en esta respuesta — usar `GET /user/favorites` para obtenerlos.
> El campo `avatar` es `""` si el usuario no ha subido foto de perfil.

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

### POST `/user/avatar`
Sube una imagen de perfil a Cloudinary y guarda la URL en el usuario. La URL queda disponible en `GET /user/profile` como `avatar`.

**Headers requeridos**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form data**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `avatar` | Archivo | Imagen JPG, PNG o WebP, máximo 5 MB |

**Respuesta exitosa — 200**
```json
{ "success": true, "avatar_url": "https://res.cloudinary.com/.../sostek/avatars/foto.jpg" }
```

**Errores posibles**
| `error` | Causa |
|---------|-------|
| `"Token requerido"` | Header `Authorization` ausente |
| `"Token inválido o expirado"` | JWT vencido |
| `"La imagen es requerida"` | No se envió ningún archivo en el campo `avatar` |
| `"Formato no válido. Solo jpg, png o webp"` | El archivo no es uno de los formatos permitidos |
| `"La imagen no debe superar 5MB"` | El archivo supera el límite de tamaño |
| `"Error al subir imagen"` | Error al conectar con Cloudinary |

---

### GET `/evaluations`
Lista todas las evaluaciones **sin** las preguntas (solo `name`, `career`, `description` y `_id`).

**Respuesta exitosa — 200**
```json
{
  "success": true,
  "evaluations": [
    {
      "_id": "...",
      "name": "Arquitectura Nivel 1",
      "career": "Arquitectura",
      "description": "Texto descriptivo de la evaluación"
    },
    {
      "_id": "...",
      "name": "Diseño Industrial Nivel 1",
      "career": "Diseño Industrial",
      "description": ""
    }
  ]
}
```
> `description` puede ser `""` si no tiene descripción cargada.

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
Lista todas las presentaciones con las URLs de cada slide y la imagen de portada.

**Respuesta exitosa — 200**
```json
{
  "success": true,
  "presentations": [
    {
      "_id": "...",
      "name": "Is Sustainable Innovation an Oxymoron",
      "cover": "https://res.cloudinary.com/.../portada.jpg",
      "slides": [
        "https://res.cloudinary.com/.../slide1.jpg",
        "https://res.cloudinary.com/.../slide2.jpg"
      ]
    }
  ]
}
```
> `cover` puede ser `""` si la presentación no tiene portada configurada.

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

> La URL del backend ya está en variable de entorno `REACT_APP_BACKEND_URL` (con fallback a `http://localhost:8080`). Definida en `src/config.ts`.
