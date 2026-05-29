# Integración Frontend ↔ Backend — SOSTEK

> Base URL: `http://localhost:8080`
> Todas las respuestas son JSON con la forma `{ success: boolean, ... }`
> CORS habilitado para `http://localhost:3000` y `http://localhost:8100`
> Tokens JWT expiran en **7 días**

---

## Cómo enviar el token JWT

Los endpoints protegidos requieren el token en el header `Authorization`:

```ts
// Guardar al hacer login o signup
localStorage.setItem('token', data.token);

// Leer para enviarlo en requests protegidos
const token = localStorage.getItem('token');

axios.post('http://localhost:8080/user/edit', body, {
  headers: { Authorization: `Bearer ${token}` }
});
```

> **Importante:** el token debe guardarse en `localStorage`, no en `sessionStorage`. Con `sessionStorage` el usuario pierde la sesión al refrescar la página y no puede hacer requests autenticados.

---

## Cambios que rompen el frontend actual

Estos dos cambios requieren actualizar el frontend **antes de que funcione con el backend nuevo**:

### 1. `POST /user/edit` ahora requiere JWT

Antes se podía llamar sin headers. Ahora sin el header `Authorization: Bearer <token>` el backend responde:
```json
{ "success": false, "error": "Token requerido" }
```

Agregar el header en la llamada de Axios donde se edita el perfil.

### 2. `POST /user/edit` ya no necesita `email` en el body

El backend toma el email directamente del token. Si el frontend lo sigue mandando no hay problema (se ignora), pero ya no es requerido.

### 3. `POST /user/signup` — contraseña mínimo 6 caracteres

Si el formulario de registro permitía contraseñas más cortas, ahora el backend las rechaza con:
```json
{ "success": false, "error": "La contraseña debe tener al menos 6 caracteres" }
```

Agregar esa validación también en el formulario del frontend.

---

## Referencia completa de endpoints

### `POST /user/signup` — público

**Body:**
```json
{
  "email": "usuario@mail.com",
  "password": "min6chars",
  "name": "Juan",
  "surname": "Pérez",
  "birth_date": "1999-05-15",
  "occupation": "Estudiante",
  "gender": "M"
}
```
`birth_date`, `occupation` y `gender` son opcionales.

**Respuesta exitosa:**
```json
{ "success": true, "token": "<jwt>" }
```

**Errores posibles:**
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
{
  "email": "usuario@mail.com",
  "password": "micontraseña"
}
```

**Respuesta exitosa:**
```json
{ "success": true, "token": "<jwt>" }
```

**Errores posibles:**
```json
{ "success": false, "error": "Correo inválido" }
{ "success": false, "error": "La contraseña es requerida" }
{ "success": false, "error": "Cuenta no registrada" }
{ "success": false, "error": "Contraseña incorrecta" }
{ "success": false, "error": "Demasiados intentos, intenta más tarde" }
```

---

### `POST /user/edit` — requiere JWT ⚠️ cambio

**Headers:** `Authorization: Bearer <token>`

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
`name` y `surname` son requeridos. `birth_date`, `occupation` y `gender` son opcionales — solo se actualizan si se mandan. `email` ya no es necesario — el backend lo lee del token.

**Respuesta exitosa:**
```json
{ "success": true, "message": "Usuario actualizado" }
```

**Errores posibles:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Token inválido o expirado" }
{ "success": false, "error": "El nombre es requerido" }
{ "success": false, "error": "El apellido es requerido" }
{ "success": false, "message": "No se pudo actualizar información del usuario" }
```

---

### `GET /user/profile` — requiere JWT 🆕

Reemplaza la necesidad de guardar los datos del usuario en sessionStorage. Llamar al cargar la pantalla de perfil.

**Headers:** `Authorization: Bearer <token>`

**Respuesta exitosa:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "name": "Juan",
    "surname": "Pérez",
    "email": "usuario@mail.com",
    "birth_date": "1999-05-15",
    "occupation": "Estudiante",
    "gender": "M",
    "score_test": 120,
    "score_game": 85
  }
}
```
La `password` nunca se incluye en la respuesta.

**Errores posibles:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Token inválido o expirado" }
{ "success": false, "error": "Usuario no encontrado" }
```

---

### `POST /user/score` — requiere JWT 🆕

Llamar al terminar una evaluación (Tab 3) o al terminar una partida del juego (Tab 2).

**Headers:** `Authorization: Bearer <token>`

**Body** — se puede mandar uno o ambos:
```json
{ "score_test": 130 }
{ "score_game": 75 }
{ "score_test": 130, "score_game": 75 }
```

**Respuesta exitosa:**
```json
{ "success": true, "message": "Puntaje actualizado" }
```

**Errores posibles:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Token inválido o expirado" }
{ "success": false, "error": "El puntaje del test debe ser un número" }
{ "success": false, "error": "El puntaje del juego debe ser un número" }
{ "success": false, "error": "Se requiere al menos score_test o score_game" }
```

---

### `DELETE /user` — requiere JWT 🆕

Elimina permanentemente la cuenta del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Respuesta exitosa:**
```json
{ "success": true, "message": "Cuenta eliminada" }
```

**Errores posibles:**
```json
{ "success": false, "error": "Token requerido" }
{ "success": false, "error": "Token inválido o expirado" }
{ "success": false, "error": "Usuario no encontrado" }
```

---

## Rate limiting

`/user/signup` y `/user/login` tienen un límite de **10 requests por IP cada 15 minutos**. Al superarlo, el servidor devuelve:
```json
{ "success": false, "error": "Demasiados intentos, intenta más tarde" }
```
Mostrar este mensaje al usuario tal cual — no reintentar automáticamente.

---

## Patrón recomendado para el token en el frontend

```ts
// Al hacer login o signup exitoso
localStorage.setItem('token', response.data.token);

// Helper para requests autenticados
function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Al hacer logout
localStorage.removeItem('token');

// Al recibir "Token inválido o expirado" en cualquier request
// → redirigir al login y borrar el token
localStorage.removeItem('token');
// redirect a /login
```

---

## Resumen: qué tiene que hacer el frontend

| Tarea | Prioridad | Descripción |
|-------|-----------|-------------|
| Cambiar `sessionStorage` → `localStorage` para el token | 🔴 Urgente | Sin esto, los requests autenticados fallan al refrescar |
| Agregar header JWT a `POST /user/edit` | 🔴 Urgente | El endpoint lo rechaza sin token |
| Validar contraseña mínimo 6 caracteres en el form de registro | 🟡 Importante | El backend la rechaza si es más corta |
| Llamar a `GET /user/profile` al cargar la pantalla de perfil | 🟡 Importante | Para mostrar los datos actualizados del usuario |
| Llamar a `POST /user/score` al terminar una evaluación (Tab 3) | 🟢 Backlog | Persistir el puntaje en la cuenta del usuario |
| Llamar a `POST /user/score` al terminar el juego (Tab 2) | 🟢 Backlog | Cuando el juego online esté implementado |
| Agregar opción "Eliminar cuenta" en perfil o ajustes | 🟢 Backlog | Llama a `DELETE /user` |
