# INFO BACKEND — SOSTEK

> Documento de comunicación frontend → backend.
> Se actualiza cada vez que hay un cambio en el frontend que afecta la integración.
> Última actualización: 2026-06-08
> Backend corre en: `http://localhost:8080`

---

## Cambios recientes del frontend que te afectan

| Fecha | Cambio | Qué necesita el backend |
|-------|--------|------------------------|
| 2026-06-08 | Artículos con imágenes rotas detectados | Actualizar `image` en MongoDB para 3 artículos — ver sección "Pendientes de datos" |
| 2026-06-08 | Párrafos en artículos — frontend ya divide `body` por `\n` | Agregar `\n` entre párrafos en los artículos que se ven como bloque continuo en MongoDB |
| 2026-06-08 | Evaluaciones — frontend listo para recibir `description` | Agregar campo `description` al schema y seed — ver sección "Pendientes de datos" |
| 2026-06-08 | Foto de perfil — UI pendiente de implementar | Necesita nuevo endpoint `POST /user/avatar` + campo `avatar` en modelo de usuario |
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
| `POST /user/avatar` | ⚠️ Pendiente frontend | ❌ Pendiente backend |

---

## Pendiente de ambos lados

| Elemento | Frontend | Backend |
|----------|----------|---------|
| Foto de perfil | UI pendiente (espera endpoint) | Implementar `POST /user/avatar` + campo `avatar` en modelo |
| Imágenes rotas en 3 artículos | ✅ Muestra placeholder cuando imagen falla | Actualizar URLs en MongoDB |
| Párrafos en artículos | ✅ Divide `body` por `\n` | Agregar saltos de línea en datos de MongoDB |
| `description` en evaluaciones | ✅ Listo para recibirlo | Agregar campo al schema + seed |

---

## Comportamiento del frontend en recuperación de contraseña

El flujo de recuperación funciona así:

1. El usuario ingresa su email en `/ForgotPassword`
2. El frontend llama a `POST /user/forgot-password` con `{ email }`
3. El backend responde con `{ success: true, reset_token: "<token>" }`
4. El frontend guarda el token en `sessionStorage` con la clave `reset_token` y navega a `/ResetPassword`
5. En `/ResetPassword`, el usuario ve el token precargado (editable) y escribe su nueva contraseña
6. El frontend llama a `POST /user/reset-password` con `{ token, new_password }`
7. Al éxito, el frontend borra el token de `sessionStorage` y redirige a login

> Nota: El frontend muestra el token directamente al usuario para que lo copie/use. No hay envío de email desde el frontend.

---

## Comportamiento del frontend en puntaje

Cuando el usuario termina una evaluación:
- Si hay token en `localStorage` (usuario logueado), se llama `POST /user/score` con `{ score_test: <número> }`
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
- El frontend guarda el token en `localStorage` con la clave `'token'`
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
    "score_game": 85
  }
}
```
> `password`, `reset_token` y `reset_token_expiry` **nunca** deben incluirse en la respuesta.

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

## Rate limiting

Aplicar a `/user/signup`, `/user/login` y `/user/forgot-password`: 10 requests por IP cada 15 minutos.

```json
{ "success": false, "error": "Demasiados intentos, intenta más tarde" }
```

---

## Pendientes del backend — datos

### 1. Imágenes rotas en 3 artículos
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

### 2. Párrafos en artículos
El frontend ya divide el campo `body` por `\n` para mostrar párrafos separados. Los artículos que se ven como un bloque de texto continuo necesitan saltos de línea (`\n`) en su campo `body` en MongoDB.

### 3. Campo `description` en evaluaciones
Agregar campo `description: { type: String, default: '' }` al schema de evaluaciones e incluirlo en `GET /evaluations`. El frontend ya lo recibe y muestra automáticamente si existe.

| Evaluación | Descripción sugerida |
|------------|---------------------|
| Arquitectura Nivel 1 | Mide si conoces y tomaste en cuenta los factores ambientales y sociales básicos en el análisis de tu proyecto. |
| Arquitectura Nivel 2 | Mide cómo integras estrategias de sostenibilidad en el diseño y desarrollo de tu proyecto. |
| Arquitectura Nivel 3 | Mide si tu proyecto plantea sistemas y programas de sostenibilidad a largo plazo. |
| Diseño Industrial Nivel 1 | Mide tu conocimiento básico sobre impacto ambiental y sostenibilidad en el diseño de productos. |
| Diseño Industrial Nivel 2 | Mide cómo consideras la sostenibilidad en tu proceso de diseño y selección de materiales. |
| Diseño Industrial Nivel 3 | Mide qué tan profundo integra tu proyecto criterios de sostenibilidad en todo su ciclo de vida. |

### 4. Endpoint `POST /user/avatar` — nuevo
Subir imagen de perfil a Cloudinary y guardar la URL en el usuario.

**Headers:** `Authorization: Bearer <token>` + `Content-Type: multipart/form-data`

**Body (form-data):** campo `avatar` (archivo jpg/png/webp, máx 5MB)

**Respuesta exitosa:**
```json
{ "success": true, "avatar_url": "https://res.cloudinary.com/.../avatar.jpg" }
```

**Cambios en el modelo de usuario:**
- Agregar campo `avatar: { type: String, default: '' }`
- Incluir `avatar` en la respuesta de `GET /user/profile`

---

## Pendientes del backend — seguridad y calidad

### BS1 — Variables de entorno
Verificar que ningún secreto (API keys, connection strings, JWT secret) esté hardcodeado en el código. Documentar en un `.env.example` todas las variables requeridas.

### BS2 — Sanitizar inputs
Validar y rechazar inputs malformados en todos los endpoints. Casos mínimos:
- Longitud máxima en strings (nombre, apellido, email, contraseña)
- Tipos correctos (número donde se espera número)
- Rechazar body vacío o campos `null`/`undefined` inesperados
- Recomendado: `express-validator`

### BT1 — Unit tests (Jest + Supertest)
Testear lógica crítica del backend:
- Validaciones de autenticación (login, signup, tokens)
- Rate limiting activo
- Respuestas de endpoints con datos inválidos
- Lógica de puntaje (`POST /user/score`)

Herramienta recomendada: `jest` + `supertest` + `mongodb-memory-server` para base de datos de test en memoria.
