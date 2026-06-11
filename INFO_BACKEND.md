# INFO BACKEND — SOSTEK

> Documento de comunicación frontend → backend.
> Se actualiza cada vez que hay un cambio en el frontend que afecta la integración.
> Última actualización: 2026-06-10
> Backend corre en: `http://localhost:8080`

---

## Cambios recientes del frontend que te afectan

| Fecha | Cambio | Qué necesita el backend |
|-------|--------|------------------------|
| 2026-06-09 | **`ForgotPassword` y `ResetPassword` — flujo por email integrado ✅** | Frontend actualizado: `ForgotPassword` muestra el mensaje del backend y oculta el form (no lee `reset_token`). `ResetPassword` lee el token desde `?token=` en la URL. El backend ya envía el token por email con el link. **Actualizar `INFO_FRONTEND.md`**: el contrato de `POST /user/forgot-password` todavía documenta `{ reset_token: "..." }` — corregir a `{ success: true, message: "..." }`. |
| 2026-06-09 | **Token JWT movido a `sessionStorage`** | Sin cambios en backend — el frontend ya no usa `localStorage` para el token ni el flag de sesión. Si el backend alguna vez implementa HttpOnly cookies, avisar para eliminar el manejo manual del token en el frontend. |
| 2026-06-09 | **Contraseña mínima subida a 8 caracteres** | El frontend ahora valida mínimo 8 caracteres en signup y reset-password. **El backend debe actualizar su validación de 6 → 8 caracteres** en `/user/signup` y `/user/reset-password`, y actualizar el mensaje de error a `"La contraseña debe tener al menos 8 caracteres"`. |
| 2026-06-09 | **Guardias de ruta implementadas** | Sin cambios en backend — `/Profile` y `/Favorites` redirigen automáticamente a `/` si no hay sesión. |
| 2026-06-09 | **Email removido del body de `POST /user/edit`** | Confirmado — el backend ignora el campo `email` en el body y usa solo el del JWT (según contrato). Bug corregido en frontend. |
| 2026-06-08 | **Avatar upload — frontend ✅ completo** | ✅ Ya implementado según `INFO_FRONTEND.md` — `POST /user/avatar` activo. |
| 2026-06-08 | Avatar mostrado en header (`AppBarPopOver`) | Sin cambios en backend — el frontend lee `avatar` de `GET /user/profile` y lo guarda en `localStorage` (es URL pública, no sensible). |
| 2026-06-08 | Carrusel usa campo `cover` de presentaciones | Si el backend envía `cover` en `GET /presentations`, el frontend lo usa como portada; si no, cae en `slides[0]` — el campo es opcional |
| 2026-06-08 | `bibliography` ya se muestra en `Documents.tsx` | El campo ya llega en `GET /articles/:id` — el frontend lo renderiza automáticamente si existe |
| 2026-06-09 | Unit tests frontend completados (23 tests) | Sin cambios en backend — solo información |
| 2026-06-09 | Error boundary global agregado | Sin cambios en backend |
| 2026-06-09 | `description` en evaluaciones — **aún no llega del backend** | `GET /evaluations` devuelve solo `_id`, `name`, `career` — falta agregar `description` al schema y al seed |
| 2026-06-09 | `REACT_APP_BACKEND_URL` ya está implementado | La nota en INFO_FRONTEND.md está obsoleta — el frontend ya usa variable de entorno desde `src/config.ts` |
| 2026-06-08 | Artículos con imágenes rotas detectados | Actualizar `image` en MongoDB para 3 artículos — ver sección "Pendientes de datos" |
| 2026-06-08 | Párrafos en artículos — frontend ya divide `body` por `\n` | Agregar `\n` entre párrafos en los artículos que se ven como bloque continuo en MongoDB |
| 2026-06-08 | Evaluaciones — frontend listo para recibir `description` | Agregar campo `description` al schema y seed — ver sección "Pendientes de datos" |
| 2026-06-08 | Rediseño completo dark theme en toda la app | Sin cambios en backend |
| 2026-06-08 | IonToast para errores, IonAlert para confirmaciones destructivas | Sin cambios en backend |
| 2026-06-06 | Tutorial integrado en `Tab2.tsx` — ✅ | `GET /tutorial` — integrado en ambos lados |
| 2026-06-06 | Favoritos integrados — ✅ | `POST/GET/DELETE /user/favorites` — integrado en ambos lados |
| 2026-06-06 | Pantallas de recuperación de contraseña — ✅ | `POST /user/forgot-password` y `POST /user/reset-password` — integrado en ambos lados |
| 2026-06-06 | Botón "Eliminar cuenta" en `Profile.tsx` — ✅ | `DELETE /user` — integrado en ambos lados |
| 2026-06-06 | Puntaje enviado al terminar evaluación — ✅ | `POST /user/score` — integrado en ambos lados |
| 2026-06-05 | Migración completa de Google APIs a backend — ✅ | Artículos, evaluaciones, presentaciones y tutorial desde MongoDB |

---

## Estado de endpoints

| Endpoint | Estado frontend | Estado backend |
|----------|----------------|----------------|
| `POST /user/signup` | ✅ Integrado | ✅ Implementado |
| `POST /user/login` | ✅ Integrado | ✅ Implementado |
| `GET /user/profile` | ✅ Integrado | ✅ Implementado |
| `POST /user/edit` | ✅ Integrado | ✅ Implementado |
| `POST /user/score` | ✅ Integrado | ✅ Implementado |
| `DELETE /user` | ✅ Integrado | ✅ Implementado |
| `POST /user/forgot-password` | ✅ Integrado | ✅ Implementado |
| `POST /user/reset-password` | ✅ Integrado | ✅ Implementado |
| `GET /evaluations` | ✅ Integrado | ✅ Implementado |
| `GET /evaluations/:id` | ✅ Integrado | ✅ Implementado |
| `GET /articles` | ✅ Integrado | ✅ Implementado |
| `GET /articles/:id` | ✅ Integrado | ✅ Implementado |
| `GET /presentations` | ✅ Integrado | ✅ Implementado |
| `GET /tutorial` | ✅ Integrado | ✅ Implementado |
| `POST /user/favorites` | ✅ Integrado | ✅ Implementado |
| `GET /user/favorites` | ✅ Integrado | ✅ Implementado |
| `DELETE /user/favorites/:id` | ✅ Integrado | ✅ Implementado |
| `POST /user/avatar` | ✅ Integrado | ✅ Implementado |

---

## Pendiente de ambos lados

✅ Todo resuelto — ver `AVANCE_SOSTEK.md` para el detalle.

| Elemento | Frontend | Backend |
|----------|----------|---------|
| Foto de perfil | ✅ Completo (upload + crop + reposición + header) | ✅ `POST /user/avatar` implementado |
| Imágenes rotas en 3 artículos | ✅ Completo | ✅ URLs actualizadas en MongoDB |
| Párrafos en artículos | ✅ Completo | ✅ Saltos de línea agregados en MongoDB |
| `description` en evaluaciones | ✅ Completo | ✅ Campo agregado al schema y seed (B3) |

---

## Comportamiento del frontend en recuperación de contraseña

El flujo de recuperación funciona así (flujo actual — token por email):

1. El usuario ingresa su email en `/ForgotPassword`
2. El frontend llama a `POST /user/forgot-password` con `{ email }`
3. El backend responde con `{ success: true, message: "<mensaje>" }` y envía el email con el link `https://<dominio>/ResetPassword?token=<token>`
4. El frontend muestra el mensaje del backend como toast verde y oculta el formulario
5. El usuario hace clic en el link del email y llega a `/ResetPassword?token=<token>`
6. `ResetPassword` lee el token desde `location.search` con `useLocation` (ya no usa sessionStorage)
7. El usuario ingresa su nueva contraseña y el frontend llama a `POST /user/reset-password` con `{ token, new_password }`
8. Al éxito, muestra `IonAlert` y redirige a login

> **⚠️ INFO_FRONTEND.md desactualizado:** La sección 3 de `INFO_FRONTEND.md` documenta que `POST /user/forgot-password` devuelve `{ reset_token: "..." }` en la respuesta. Ese contrato ya no es correcto — el backend ya envía el token por email. Actualizar `INFO_FRONTEND.md` para reflejar la respuesta real: `{ success: true, message: "..." }` y que el token llega via link en el email.

---

## Comportamiento del frontend en puntaje

Cuando el usuario termina una evaluación:
- Si hay token en `sessionStorage` (usuario logueado), se llama `POST /user/score` con `{ score_test: <número> }`
- Si es invitado (sin token), no se hace ninguna llamada
- El puntaje enviado es el total acumulado de la evaluación

---

## Stack del backend

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Autenticación | JWT (`jsonwebtoken`) |
| Hash de contraseñas | `bcrypt` |
| Base de datos | MongoDB |
| Rate limiting | `express-rate-limit` |
| CORS | Habilitado para `http://localhost:3000` y `http://localhost:8100` |

---

## Modelo de usuario

```js
{
  _id,
  email,              // String, único, requerido
  password,           // String hasheado con bcrypt — nunca devolver en respuestas
  name,               // String, requerido
  surname,            // String, requerido
  birth_date,         // Date, opcional
  occupation,         // String, opcional
  gender,             // String, opcional
  score_test,         // Number, default 0
  score_game,         // Number, default 0
  favorites,          // Array de { content_id: String, type: "article" | "presentation" }
  reset_token,        // String, interno — no devolver en respuestas
  reset_token_expiry  // Date, interno — no devolver en respuestas
}
```

---

## Autenticación JWT

- Payload del token: `{ id: usuario._id, email: usuario.email }`
- El frontend guarda el token en `sessionStorage` con la clave `'token'` (migrado de localStorage para reducir exposición a XSS)
- Los endpoints protegidos deben leer el header `Authorization: Bearer <token>`
- Expiración: 7 días

**Middleware de autenticación:**
```js
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.json({ success: false, error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, SECRET_KEY); // { id, email }
    next();
  } catch {
    return res.json({ success: false, error: 'Token inválido o expirado' });
  }
}
```

---

## CORS

```js
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8100'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## Resumen de endpoints

| Método | Ruta | Auth | Estado |
|--------|------|------|--------|
| `POST` | `/user/signup` | No | ✅ Implementado |
| `POST` | `/user/login` | No | ✅ Implementado |
| `POST` | `/user/forgot-password` | No | ✅ Implementado |
| `POST` | `/user/reset-password` | No | ✅ Implementado |
| `GET` | `/user/profile` | JWT | ✅ Implementado |
| `POST` | `/user/edit` | JWT | ✅ Implementado |
| `POST` | `/user/score` | JWT | ✅ Implementado |
| `DELETE` | `/user` | JWT | ✅ Implementado |
| `POST` | `/user/favorites` | JWT | ✅ Implementado |
| `GET` | `/user/favorites` | JWT | ✅ Implementado |
| `DELETE` | `/user/favorites/:content_id` | JWT | ✅ Implementado |
| `GET` | `/evaluations` | No | ✅ Implementado |
| `GET` | `/evaluations/:id` | No | ✅ Implementado |
| `GET` | `/articles` | No | ✅ Implementado |
| `GET` | `/articles/:id` | No | ✅ Implementado |
| `GET` | `/presentations` | No | ✅ Implementado |
| `GET` | `/tutorial` | No | ✅ Implementado |

---

## Contratos de cada endpoint

### `POST /user/signup` — público

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "minimo6chars",
  "name": "Ana",
  "surname": "Martínez",
  "birth_date": "1999-05-15",
  "occupation": "Estudiante",
  "gender": "femenino"
}
```
> `birth_date`, `occupation` y `gender` son opcionales.

**Respuesta exitosa:**
```json
{ "success": true, "token": "<jwt>" }
```

**Errores:**
```json
{ "success": false, "error": "Correo inválido" }
{ "success": false, "error": "La contraseña debe tener al menos 6 caracteres" }
{ "success": false, "error": "El nombre es requerido" }
{ "success": false, "error": "El apellido es requerido" }
{ "success": false, "error": "Correo ingresado está ya registrado en la plataforma" }
{ "success": false, "error": "Demasiados intentos, intenta más tarde" }
```

---

### `POST /user/login` — público

**Body:**
```json
{ "email": "usuario@ejemplo.com", "password": "micontraseña" }
```

**Respuesta exitosa:**
```json
{ "success": true, "token": "<jwt>" }
```

**Errores:**
```json
{ "success": false, "error": "Cuenta no registrada" }
{ "success": false, "error": "Contraseña incorrecta" }
{ "success": false, "error": "Demasiados intentos, intenta más tarde" }
```

---

### `POST /user/forgot-password` — público

**Body:**
```json
{ "email": "usuario@ejemplo.com" }
```

**Respuesta exitosa:**
```json
{ "success": true, "reset_token": "<64-char-hex>" }
```
> El token es válido por 1 hora. El frontend lo muestra directamente al usuario.

**Errores:**
```json
{ "success": false, "error": "Correo inválido" }
{ "success": false, "error": "Correo no registrado" }
{ "success": false, "error": "Error al generar token" }
{ "success": false, "error": "Demasiados intentos, intenta más tarde" }
```

---

### `POST /user/reset-password` — público

**Body:**
```json
{ "token": "<reset_token>", "new_password": "nuevacontraseña" }
```

**Respuesta exitosa:**
```json
{ "success": true, "message": "Contraseña actualizada" }
```
> El token se invalida tras usarse una vez.

**Errores:**
```json
{ "success": false, "error": "El token es requerido" }
{ "success": false, "error": "La contraseña debe tener al menos 6 caracteres" }
{ "success": false, "error": "Token inválido" }
{ "success": false, "error": "Token expirado" }
```

---

### `GET /user/profile` — requiere JWT

**Header:** `Authorization: Bearer <token>`

**Respuesta exitosa:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "name": "Juan",
    "surname": "Pérez",
    "email": "usuario@mail.com",
    "birth_date": "1999-05-15T00:00:00.000Z",
    "occupation": "Estudiante",
    "gender": "masculino",
    "score_test": 120,
    "score_game": 85,
    "avatar": ""
  }
}
```
> `password`, `reset_token` y `reset_token_expiry` **nunca** deben incluirse en la respuesta.
> `avatar` se agrega cuando se implemente `POST /user/avatar` — por ahora puede ser string vacío.

**Errores:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Token inválido o expirado" }
{ "success": false, "error": "Usuario no encontrado" }
```

---

### `POST /user/edit` — requiere JWT

**Header:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Juan",
  "surname": "Pérez",
  "birth_date": "1999-05-15",
  "occupation": "Estudiante",
  "gender": "masculino"
}
```
> El campo `email` puede llegar en el body pero debe **ignorarse** — el usuario se identifica por el token.

**Respuesta exitosa:**
```json
{ "success": true, "message": "Usuario actualizado" }
```

**Errores:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "El nombre es requerido" }
{ "success": false, "message": "No se pudo actualizar información del usuario" }
```

---

### `POST /user/score` — requiere JWT

**Header:** `Authorization: Bearer <token>`

**Body** (uno o ambos campos):
```json
{ "score_test": 130 }
{ "score_game": 75 }
```
> Actualizar solo los campos que lleguen en el body, sin tocar el otro.

**Respuesta exitosa:**
```json
{ "success": true, "message": "Puntaje actualizado" }
```

**Errores:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Token inválido o expirado" }
{ "success": false, "error": "Se requiere al menos score_test o score_game" }
{ "success": false, "error": "El puntaje del test debe ser un número" }
{ "success": false, "error": "El puntaje del juego debe ser un número" }
```

---

### `DELETE /user` — requiere JWT

**Header:** `Authorization: Bearer <token>`

Sin body. Elimina permanentemente la cuenta del usuario identificado por el token.

**Respuesta exitosa:**
```json
{ "success": true, "message": "Cuenta eliminada" }
```

**Errores:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Token inválido o expirado" }
{ "success": false, "error": "Usuario no encontrado" }
```

---

### `POST /user/favorites` — requiere JWT

**Header:** `Authorization: Bearer <token>`

**Body:**
```json
{ "content_id": "<_id del artículo o presentación>", "type": "article" }
```
> `type` acepta solo `"article"` o `"presentation"`.

**Respuesta exitosa:**
```json
{ "success": true, "message": "Favorito agregado" }
```

**Errores:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "El ID del contenido es requerido" }
{ "success": false, "error": "El tipo debe ser article o presentation" }
{ "success": false, "error": "Ya está en favoritos" }
{ "success": false, "error": "Usuario no encontrado" }
```

---

### `GET /user/favorites` — requiere JWT

**Header:** `Authorization: Bearer <token>`

**Respuesta exitosa:**
```json
{
  "success": true,
  "favorites": [
    { "content_id": "664abc...", "type": "article" },
    { "content_id": "664def...", "type": "presentation" }
  ]
}
```

**Errores:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Usuario no encontrado" }
```

---

### `DELETE /user/favorites/:content_id` — requiere JWT

**Header:** `Authorization: Bearer <token>`

El `content_id` va en la URL: `/user/favorites/664abc123...`

**Respuesta exitosa:**
```json
{ "success": true, "message": "Favorito eliminado" }
```

**Errores:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Usuario no encontrado" }
{ "success": false, "error": "No se pudo eliminar el favorito" }
```

---

### `GET /articles` — público

**Respuesta esperada:**
```json
{
  "success": true,
  "articles": [
    {
      "_id": "664abc...",
      "title": "Cambio Climático y Sostenibilidad",
      "subtitle": "Impacto global del calentamiento",
      "type": "Artículo",
      "body": "Primer párrafo.\nSegundo párrafo.",
      "image": "https://res.cloudinary.com/.../imagen.jpg",
      "author": "Nombre Autor",
      "author_image": "https://...",
      "page_image": "https://...",
      "category": "Ambiental",
      "tags": ["clima", "sostenibilidad"]
    }
  ]
}
```
> El frontend invierte el array (`[...articles].reverse()`) para mostrar el más reciente primero.
> El campo `body` se divide por `\n` para mostrar párrafos separados.

---

### `GET /articles/:id` — público

**Respuesta esperada:**
```json
{
  "success": true,
  "article": {
    "_id": "664abc...",
    "title": "...",
    "subtitle": "...",
    "type": "Artículo",
    "body": "Párrafo uno.\nPárrafo dos.",
    "image": "https://...",
    "author": "...",
    "author_image": "https://...",
    "page_image": "https://...",
    "category": "Ambiental",
    "tags": ["...]
  }
}
```

---

### `GET /presentations` — público

**Respuesta esperada:**
```json
{
  "success": true,
  "presentations": [
    {
      "_id": "664xyz...",
      "name": "Sostenibilidad Urbana",
      "cover": "https://res.cloudinary.com/.../portada.jpg",
      "slides": [
        "https://res.cloudinary.com/.../slide1.jpg",
        "https://res.cloudinary.com/.../slide2.jpg"
      ]
    }
  ]
}
```
> `cover` es opcional — si llega, el frontend lo usa como imagen de portada en la tarjeta; si no, usa `slides[0]`.

---

### `GET /evaluations` — público

**Respuesta esperada:**
```json
{
  "success": true,
  "evaluations": [
    {
      "_id": "664def...",
      "name": "Arquitectura Nivel 1",
      "career": "Arquitectura",
      "description": "(3°-4° semestre) Mide si conoces y tomaste en cuenta los factores ambientales y sociales básicos en el análisis de tu proyecto.",
      "question_count": 23
    }
  ]
}
```
> `description` ya incluye el rango de semestre recomendado (✅ resuelto B3, 2026-06-10).
> `question_count` es el total de preguntas (`questions.length`), calculado en el backend (✅ resuelto B4).
> `career` acepta valores: `"Arquitectura"`, `"Diseño Industrial"`, cualquier otro cae en el filtro "Otros".

---

### `GET /evaluations/:id` — público

**Respuesta esperada:**
```json
{
  "success": true,
  "evaluation": {
    "_id": "664def...",
    "name": "Arquitectura Nivel 1",
    "career": "Arquitectura",
    "description": "...",
    "questions": [
      {
        "category": "Ambiental",
        "text": "¿Tu proyecto considera el impacto ambiental?",
        "options": [
          { "text": "Sí, completamente", "value": 10 },
          { "text": "Parcialmente", "value": 5 },
          { "text": "No", "value": 0 }
        ]
      }
    ]
  }
}
```
> Cada opción tiene `text` (label visible) y `value` (número que suma al puntaje).

---

### `GET /tutorial` — público

Sin parámetros. Retorna el instructivo completo del juego con reglas y tarjetas.

**Respuesta exitosa:**
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
> `type: "scenario"` = tarjeta de escenario (problema) · `type: "solution"` = tarjeta de solución
> Hay 16 tarjetas de escenario y 32 de solución (48 en total)

**Errores:**
```json
{ "success": false, "error": "Tutorial no encontrado" }
```

---

## ⚠️ INFO_FRONTEND.md desactualizado — actualizar

El backend mantiene `INFO_FRONTEND.md` para comunicarle cambios al frontend. Las siguientes secciones de ese archivo están desactualizadas y deben corregirse:

### Sección 2 — "Lo que falta integrar en el frontend"
**Todo lo que estaba listado ya fue integrado.** Actualizar todos los ítems a ✅:

| Elemento | Estado real |
|----------|-------------|
| Reemplazar `useGetDocuments` (tutorial) | ✅ Integrado — `Tab2.tsx` usa `GET /tutorial` |
| Reemplazar `gapi.client` con axios | ✅ Integrado — Google APIs eliminadas por completo |
| Integrar favoritos | ✅ Integrado — `useFavorites.ts` + página `/Favorites` |
| Integrar `POST /user/score` | ✅ Integrado — `FinalScoreEvaluation.tsx` |
| Integrar `DELETE /user` | ✅ Integrado — `Profile.tsx` con confirmación |
| Integrar `POST /user/forgot-password` y `POST /user/reset-password` | ✅ Integrado — pantallas `ForgotPassword.tsx` y `ResetPassword.tsx` |
| Integrar `POST /user/avatar` | ✅ Integrado — `Profile.tsx` con crop y upload |
| Mostrar `avatar` del usuario | ✅ Integrado — avatar en `Profile.tsx` y en header `AppBarPopOver.tsx` |
| Mostrar `description` de evaluaciones | ✅ Integrado — backend ya agrega `description` (con rango de semestre) y `question_count` en `GET /evaluations` |
| Mostrar `cover` de presentaciones | ✅ Integrado — `Presentation.tsx` y carrusel usan `cover` si existe |

### Errores de contraseña — mensaje desactualizado — ✅ Resuelto
`/user/signup` y `/user/reset-password` ya validan `min: 8` y devuelven `"La contraseña debe tener al menos 8 caracteres"` (BS4). Se corrigió también la documentación en `INFO_PARA_FRONTEND.md`.

### Sección 4 — Variables de entorno — ✅ Resuelto
`INFO_PARA_FRONTEND.md` ya documenta que la URL del backend usa `REACT_APP_BACKEND_URL` desde `src/config.ts` (con fallback a `localhost:8080`), no está hardcodeada.

### CORS para producción — ⏳ Pendiente
Backend ya soporta `CORS_ORIGIN` (una URL extra) en Render. Falta que frontend confirme la URL de producción (Cloudflare Pages u otra) para configurarla.

---

## Rate limiting

Aplicar a `/user/signup`, `/user/login` y `/user/forgot-password`: 10 requests por IP cada 15 minutos.

```json
{ "success": false, "error": "Demasiados intentos, intenta más tarde" }
```

---

## Pendientes del backend — datos ✅ Resueltos

### ~~1. Imágenes rotas en 3 artículos~~ ✅ Resuelto
Actualizar el campo `image` en MongoDB para estos artículos:

| Título | URL nueva |
|--------|-----------|
| `Dia Mundial de los Humedades: Celebrando y Preservando Ecosistemas Vitales` | `https://provea.org/wp-content/uploads/2020/12/Efemerides_Humedales.jpg` |
| `El impacto del cine en el medio ambiente` | `https://media.sitioandino.com.ar/p/bedcd30db0702619a8e5aac262fc8d38/adjuntos/335/imagenes/000/810/0000810381/790x0/smart/cine-medio-ambiente.png` |
| `Muebles en Abuela` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQszpgQOrAHvdAqeYQKGcQ0qo8FXS84XH6WIg&s` |

```js
db.articles.updateOne({ title: "Dia Mundial de los Humedades: Celebrando y Preservando Ecosistemas Vitales" }, { $set: { image: "https://provea.org/wp-content/uploads/2020/12/Efemerides_Humedales.jpg" } })
db.articles.updateOne({ title: "El impacto del cine en el medio ambiente" }, { $set: { image: "https://media.sitioandino.com.ar/p/bedcd30db0702619a8e5aac262fc8d38/adjuntos/335/imagenes/000/810/0000810381/790x0/smart/cine-medio-ambiente.png" } })
db.articles.updateOne({ title: "Muebles en Abuela" }, { $set: { image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQszpgQOrAHvdAqeYQKGcQ0qo8FXS84XH6WIg&s" } })
```

### ~~2. Párrafos en artículos~~ ✅ Resuelto — 24/25 artículos con `\n`; "Muebles de la Abuela" no lo necesita por ser un párrafo corto
El frontend ya divide el campo `body` por `\n` para mostrar párrafos separados. Los artículos que se ven como un bloque de texto continuo necesitan saltos de línea (`\n`) en su campo `body` en MongoDB.

### ~~3. Campo `description` en evaluaciones~~ ✅ Resuelto (B3)
Agregar campo `description: { type: String, default: '' }` al schema de evaluaciones e incluirlo en `GET /evaluations`. El frontend ya lo recibe y muestra automáticamente si existe.

| Evaluación | Descripción sugerida |
|------------|---------------------|
| Arquitectura Nivel 1 | Mide si conoces y tomaste en cuenta los factores ambientales y sociales básicos en el análisis de tu proyecto. |
| Arquitectura Nivel 2 | Mide cómo integras estrategias de sostenibilidad en el diseño y desarrollo de tu proyecto. |
| Arquitectura Nivel 3 | Mide si tu proyecto plantea sistemas y programas de sostenibilidad a largo plazo. |
| Diseño Industrial Nivel 1 | Mide tu conocimiento básico sobre impacto ambiental y sostenibilidad en el diseño de productos. |
| Diseño Industrial Nivel 2 | Mide cómo consideras la sostenibilidad en tu proceso de diseño y selección de materiales. |
| Diseño Industrial Nivel 3 | Mide qué tan profundo integra tu proyecto criterios de sostenibilidad en todo su ciclo de vida. |

---

## Pendientes del backend — seguridad y calidad ✅ Resueltos

### ~~BS1~~ — ~~Variables de entorno~~ ✅ Resuelto — sin secretos hardcodeados, `.env.example` completo
Verificar que ningún secreto (API keys, connection strings, JWT secret) esté hardcodeado en el código. Documentar en un `.env.example` todas las variables requeridas.

### ~~BS2~~ — ~~Sanitizar inputs + prevenir NoSQL Injection~~ ✅ Resuelto — `helmet`, `express-mongo-sanitize` y `express-validator` activos

MongoDB no tiene SQL, pero sí tiene **NoSQL injection**. Sin sanitización, un atacante puede enviar:

```json
POST /user/login
{ "email": { "$ne": "" }, "password": { "$ne": "" } }
```

Esto en Mongoose significa "dame el primer usuario cuyo email no sea vacío y cuya contraseña no sea vacía" — acceso sin credenciales.

**Implementar las dos capas siguientes:**

---

#### Capa 1 — Middleware global `express-mongo-sanitize` (una línea, protege todos los endpoints)

```bash
npm install express-mongo-sanitize
```

En `app.js` / `server.js`, después de `express.json()`:

```js
const mongoSanitize = require('express-mongo-sanitize');

app.use(express.json());
app.use(mongoSanitize()); // elimina claves que empiecen con $ o contengan . de req.body, req.params y req.query
```

---

#### Capa 2 — Validación de tipos con `express-validator` en endpoints de auth

```bash
npm install express-validator
```

Crear el archivo `middleware/validate.js`:

```js
const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: 'Datos inválidos' });
  }
  next();
}

module.exports = validate;
```

Aplicar en las rutas de usuario:

```js
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

// POST /user/login
router.post('/user/login',
  body('email').isString().isEmail(),
  body('password').isString().isLength({ min: 8, max: 128 }),
  validate,
  loginController
);

// POST /user/signup
router.post('/user/signup',
  body('email').isString().isEmail(),
  body('password').isString().isLength({ min: 8, max: 128 }),
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('surname').isString().trim().isLength({ min: 1, max: 100 }),
  body('birth_date').optional().isISO8601(),
  body('occupation').optional().isString().isLength({ max: 100 }),
  body('gender').optional().isIn(['masculino', 'femenino']),
  validate,
  signupController
);

// POST /user/forgot-password
router.post('/user/forgot-password',
  body('email').isString().isEmail(),
  validate,
  forgotPasswordController
);

// POST /user/reset-password
router.post('/user/reset-password',
  body('token').isString().isLength({ min: 64, max: 64 }),
  body('new_password').isString().isLength({ min: 8, max: 128 }),
  validate,
  resetPasswordController
);

// POST /user/edit
router.post('/user/edit',
  authMiddleware,
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('surname').isString().trim().isLength({ min: 1, max: 100 }),
  body('birth_date').optional().isISO8601(),
  body('occupation').optional().isString().isLength({ max: 100 }),
  body('gender').optional().isIn(['masculino', 'femenino']),
  validate,
  editController
);

// POST /user/score
router.post('/user/score',
  authMiddleware,
  body('score_test').optional().isNumeric(),
  body('score_game').optional().isNumeric(),
  validate,
  scoreController
);

// POST /user/favorites
router.post('/user/favorites',
  authMiddleware,
  body('content_id').isString().isMongoId(),
  body('type').isIn(['article', 'presentation']),
  validate,
  addFavoriteController
);

// DELETE /user/favorites/:content_id
router.delete('/user/favorites/:content_id',
  authMiddleware,
  param('content_id').isMongoId(),
  validate,
  removeFavoriteController
);
```

---

#### Capa 3 — Security headers con `helmet` (recomendado, 1 línea)

```bash
npm install helmet
```

```js
const helmet = require('helmet');
app.use(helmet()); // agrega X-Content-Type-Options, X-Frame-Options, HSTS, CSP básico, etc.
```

---

**Casos mínimos que quedan cubiertos con estas tres capas:**
- Operadores MongoDB (`$ne`, `$gt`, `$where`) en cualquier campo → bloqueados por `express-mongo-sanitize`
- Tipos incorrectos (objeto donde se espera string) → bloqueados por `express-validator`
- Strings excesivamente largos (DoS por procesamiento) → bloqueados por `isLength`
- IDs de MongoDB malformados en parámetros de URL → bloqueados por `isMongoId()`
- Headers HTTP inseguros → mitigados por `helmet`

### ~~BS3~~ — ~~Mensajes de error genéricos~~ ✅ Resuelto por el backend

`POST /user/login` ya devuelve `"Correo o contraseña incorrectos"` en ambos casos.
`POST /user/forgot-password` ya devuelve el mismo mensaje sin importar si el email existe.
El flujo de recuperación por email también está implementado. Frontend integrado.

---

### ~~BS4~~ — ~~Contraseña mínima 8 caracteres~~ ✅ Resuelto — `isLength({ min: 8 })` en signup y reset-password

El frontend ya valida mínimo 8 caracteres. El backend debe actualizar su validación para ser consistente:

- En `/user/signup`: cambiar validación de `minlength: 6` → `minlength: 8`
- En `/user/reset-password`: cambiar validación de `minlength: 6` → `minlength: 8`
- Actualizar mensajes de error: `"La contraseña debe tener al menos 8 caracteres"`
- El código de validación de BS2 ya usa `min: 8` — solo asegurarse de que la lógica del controller también valide 8

---

### ~~BT1~~ — ~~Unit tests (Jest + Supertest)~~ ✅ Resuelto — 33 tests, corren en CI
Testear lógica crítica del backend:
- Validaciones de autenticación (login, signup, tokens)
- Rate limiting activo
- Respuestas de endpoints con datos inválidos
- Lógica de puntaje (`POST /user/score`)

Herramienta recomendada: `jest` + `supertest` + `mongodb-memory-server` para base de datos de test en memoria.

---

## 🆕 Pendientes — revisión frontend (2026-06-10) ✅ Resueltos

> Hallazgos de QA manual (jefa). Se priorizan los que afectan datos en MongoDB.

### ~~B1~~ — ~~2 artículos con datos corruptos~~ ✅ Resuelto — body recargado y encoding corregido (B5)

| Artículo | `_id` | Problema |
|---|---|---|
| "El impacto del cine en el medio ambiente" | `6a226c484b54f546d8876731` | `title`, `subtitle` y `tags` tienen saltos de línea metidos en medio de palabras/URLs (ej. `tags: ["https://unsplash.\ncom/photos/CiUR8zISX60"]`). El campo `body` solo tiene 24 caracteres: `"Alexa Valladares\nCristóbal"` — parece que ahí quedó el nombre del autor en vez del cuerpo del artículo. Hay que recargar el contenido completo de este artículo. |
| "La Catástrofe Industrial de Bhopal: El Legado Perdurante de una Fuga Mortal" | `6a226c484b54f546d8876732` | El texto tiene caracteres corruptos por mal manejo de encoding (ej. `"Cat�strofe"`, `"Uni�n Carbide"`, `"f�brica"`, `"Bophal"` en vez de `"Bhopal"` en tags). Hay que reimportar este artículo asegurando codificación UTF-8. |

Ambos también tienen `category: null` — ver B2.

---

### ~~B2~~ — ~~Los 26 artículos tienen `category: null`~~ ✅ Resuelto — `category` poblada y alineada con evaluaciones (B6)

Esto rompe la recomendación de artículos al final de una evaluación. El frontend filtra los artículos por `category` (y por `title` como respaldo) usando la categoría con menor puntaje obtenida en la evaluación (ej. `"ECOSISTEMA"`, `"Economía y sociedad"`, etc.). Como `category` es siempre `null` en los 26 artículos, casi nunca hay match por categoría — hoy solo aparece 1 artículo recomendado porque su título contiene casualmente la palabra "Ecosistemas".

**Pedido:** poblar el campo `category` en los 26 artículos con valores que correspondan a las categorías usadas en las preguntas de las evaluaciones (correr `GET /evaluations/:id` de cada una de las 6 evaluaciones para ver el set completo de categorías por carrera/nivel).

---

### ~~B3~~ — ~~`description` de evaluaciones sigue vacía (`""`)~~ ✅ Resuelto (2026-06-10)

Las 6 evaluaciones (3 Arquitectura + 3 Diseño Industrial) ya tienen `description` con el rango de semestre indicado:

- **Nivel 1** → `(3°-4° semestre) ...`
- **Nivel 2** → `(5°-6° semestre) ...`
- **Nivel 3** → `(7°-8° semestre) ...`

Verificado en producción (`https://sostek-backend.onrender.com/evaluations`).

---

### ~~B4~~ — ~~Agregar conteo de preguntas a `GET /evaluations`~~ ✅ Resuelto por el backend

`GET /evaluations` ya devuelve `question_count` por evaluación. Frontend integrado (muestra "X preguntas" en cada tarjeta de Tab3).

---

## 🆕 Pendientes — revisión frontend (2026-06-10, parte 2) ✅ Resueltos

> Verificación de B1/B2/B3. Todos resueltos: B5 (encoding) y B6 (taxonomías) confirmados por escaneo completo de `articles` y `evaluations`.

### ~~B5~~ — ~~El carácter "í" se corrompe en textos largos (encoding)~~ ✅ Resuelto — escaneo completo sin caracteres `�` (U+FFFD) restantes

Revisando B1, el `body` de los 2 artículos ya se recargó (antes tenía 24 caracteres, ahora ~2000), pero **todas las apariciones de la letra "í" quedaron rotas**: en vez de "í" aparece el carácter de reemplazo `�` seguido de un guión suave invisible (U+00AD). Ejemplos reales del `body`:

- "As**í** mismo" → "As`�`­ mismo"
- "pel**í**cula" → "pel`�`­cula"
- "d**í**a" → "d`�`­a"
- "energ**í**as" → "energ`�`­as"
- "s**í**ntomas" → "s`�`­ntomas"

El resto de acentos (á, é, ó, ú, ñ) están bien — el problema es específico de "í" (en UTF-8 son los bytes `0xC3 0xAD`; parece que `0xC3` se está perdiendo/reemplazando y `0xAD` queda suelto como su propio carácter).

**Mismo bug aparece en las categorías de las preguntas de evaluación** (`GET /evaluations/:id`): la categoría llega como `"Econom�­a y sociedad"` / `"Sociedad y Econom�­a"` en vez de `"Economía y sociedad"` / `"Sociedad y Economía"`.

**Pedido:** revisar el pipeline de importación/guardado de texto largo a MongoDB — probablemente hay un `replace`/regex que está separando el byte `0xAD` de `0xC3` y tratándolo como soft-hyphen. Esto afecta tanto a `articles.body` como a `evaluations.questions[].category`.

---

### ~~B6~~ — ~~C12 sigue sin resolver: las categorías de artículos no coinciden con las de evaluaciones~~ ✅ Resuelto — ver plan acordado abajo

B2 pidió poblar `category` en los 26 artículos usando las categorías de las preguntas de evaluación (`ECOSISTEMA`, `Economía y sociedad`, `Sociedad y Economía`). Ya se pobló `category`, pero con otros 3 valores: `"Ambiental"`, `"Social"`, `"Económico"` (verificado en los 25 artículos actuales).

El frontend (`ArticleCarrousel.tsx`) filtra `article.category` (y `article.title` como respaldo) contra la categoría más débil de la evaluación. Como `"ECOSISTEMA"` / `"Economía y sociedad"` / `"Sociedad y Economía"` no coinciden con `"Ambiental"` / `"Social"` / `"Económico"`, **"Artículos recomendados" sigue sin matchear correctamente** para la mayoría de los casos — cambió la causa (ya no es `category: null`) pero el síntoma de C12 sigue presente.

**Pedido:** alinear ambas taxonomías. Lo más simple sería que `articles.category` use los mismos valores que ya existen en `evaluations.questions[].category` (corrigiendo primero el encoding de B5). Si por alguna razón los artículos deben mantener `"Ambiental"/"Social"/"Económico"`, avisar para que el frontend agregue un mapeo categoría-evaluación → categoría-artículo.

---

### ✅ Plan acordado para B6 (2026-06-10) — aplicado

Las evaluaciones solo miden **2 ejes**, pero los artículos tienen **3 categorías** — no son taxonomías equivalentes 1 a 1. Se acordó:

1. **Backend** normaliza `evaluations.questions[].category` (las 6 evaluaciones) a exactamente estos 2 valores:
   - `"Ambiental"` (en vez de `"ECOSISTEMA"`)
   - `"Económico y Social"` (unifica `"Economía y sociedad"` y `"Sociedad y Economía"`, corrigiendo también el encoding de B5)

2. **Frontend** (ya implementado en `ArticleCarrousel.tsx`) mapea el eje débil a las categorías de artículo:
   - `"Ambiental"` → artículos con `category: "Ambiental"`
   - `"Económico y Social"` → artículos con `category: "Económico"` **o** `category: "Social"`

El frontend ya quedó listo esperando estos 2 strings exactos. En cuanto el backend aplique el rename en MongoDB, "Artículos recomendados" debería funcionar para las 6 evaluaciones sin más cambios de este lado.
