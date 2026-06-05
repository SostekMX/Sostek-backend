# INFO BACKEND — SOSTEK

> Documento de comunicación frontend → backend.
> Se actualiza cada vez que hay un cambio en el frontend que afecta la integración.
> Última actualización: 2026-06-04
> Backend corre en: `http://localhost:8080`

---

## Cambios recientes del frontend que te afectan

| Fecha | Cambio | Qué necesita el backend |
|-------|--------|------------------------|
| 2026-05-29 | Perfil ahora carga datos al entrar via `GET /user/profile` con JWT | Endpoint debe devolver todos los campos del usuario excepto `password` |
| 2026-05-29 | `POST /user/edit` ahora envía header `Authorization: Bearer <token>` | Endpoint debe validar el token y leer el usuario del token, no del body |
| 2026-05-29 | Login y signup ahora guardan el token en `localStorage` | El token debe llegar en `response.data.token` en ambos endpoints |

---

## Lo que el frontend necesita que el backend implemente

| Endpoint | Estado | Cuándo lo usa el frontend |
|----------|--------|--------------------------|
| `POST /user/score` | ❌ Pendiente (frontend aún no lo llama) | Al terminar una evaluación en Tab 3 |
| `DELETE /user` | ❌ Pendiente (pantalla no implementada aún) | Opción "Eliminar cuenta" en perfil |

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
  email,          // String, único, requerido
  password,       // String hasheado con bcrypt — nunca devolver en respuestas
  name,           // String, requerido
  surname,        // String, requerido
  birth_date,     // Date, opcional
  occupation,     // String, opcional
  gender,         // String, opcional — el frontend envía 'masculino' o 'femenino'
  score_test,     // Number, default 0
  score_game,     // Number, default 0
}
```

---

## Autenticación JWT

- Payload del token: `{ id: usuario._id, email: usuario.email }`
- El frontend guarda el token en `localStorage` con la clave `'token'`
- Los endpoints protegidos deben leer el header `Authorization: Bearer <token>`
- Expiración recomendada: 7 días

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
| `GET` | `/user/profile` | JWT | ✅ Implementado |
| `POST` | `/user/edit` | JWT | ✅ Implementado |
| `POST` | `/user/score` | JWT | ❌ Pendiente |
| `DELETE` | `/user` | JWT | ❌ Pendiente |

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

**Validaciones requeridas:**
- `email`: formato válido, no registrado previamente
- `password`: mínimo 6 caracteres
- `name` y `surname`: requeridos

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

> `password` **nunca** debe incluirse en la respuesta.

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

### `POST /user/score` — requiere JWT ❌ Pendiente

**Header:** `Authorization: Bearer <token>`

**Body** (uno o ambos campos):
```json
{ "score_test": 130 }
{ "score_game": 75 }
```

**Comportamiento:** Actualizar solo los campos que lleguen en el body.

**Respuesta exitosa:**
```json
{ "success": true, "message": "Puntaje actualizado" }
```

**Errores:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Se requiere al menos score_test o score_game" }
```

---

### `DELETE /user` — requiere JWT ❌ Pendiente

**Header:** `Authorization: Bearer <token>`

Sin body. Elimina permanentemente la cuenta del usuario identificado por el token.

**Respuesta exitosa:**
```json
{ "success": true, "message": "Cuenta eliminada" }
```

**Errores:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Usuario no encontrado" }
```

---

## Rate limiting recomendado

Aplicar a `/user/signup` y `/user/login`: 10 requests por IP cada 15 minutos.

```json
{ "success": false, "error": "Demasiados intentos, intenta más tarde" }
```
