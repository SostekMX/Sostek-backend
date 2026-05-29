# AVANCE SOSTEK — Backend (Fuente de Verdad)

> Última actualización: 2026-05-29 (revisado contra código real)
> Rama activa: `main`
> Stack: Node.js + Express + TypeScript + MongoDB

---

## ¿Qué es este repositorio?

El **servidor de usuarios de SOSTEK**: maneja el registro, login y edición de perfil de los usuarios de la plataforma. Corre en `http://localhost:8080` y es consumido por el frontend (Ionic React en `:3000`).

No contiene lógica de contenido (artículos, evaluaciones, presentaciones) — eso viene de Google APIs directamente al frontend.

---

## Endpoints disponibles

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| `POST` | `/user/signup` | Registro de usuario nuevo | Ninguna (pública) |
| `POST` | `/user/login` | Login con email y contraseña | Ninguna (pública) |
| `POST` | `/user/edit` | Editar nombre y apellido | JWT requerido |
| `GET` | `/user/profile` | Obtener datos del perfil | JWT requerido |
| `POST` | `/user/score` | Actualizar score_test y/o score_game | JWT requerido |
| `DELETE` | `/user` | Eliminar cuenta del usuario | JWT requerido |

---

## Estado actual por módulo

### ✅ IMPLEMENTADO Y FUNCIONAL

- **`POST /user/signup`** — crea usuario en MongoDB con contraseña hasheada (bcrypt), retorna JWT
- **`POST /user/login`** — valida credenciales con bcrypt, retorna JWT
- **`POST /user/edit`** — actualiza `name`, `surname`, `birth_date`, `occupation` y `gender`; protegido con JWT (usa el email del token, no del body); los campos opcionales solo se actualizan si llegan en el body
- **`GET /user/profile`** — retorna datos del usuario (sin password); protegido con JWT
- **`POST /user/score`** — actualiza `score_test` y/o `score_game`; acepta uno o ambos campos opcionalmente
- **`DELETE /user`** — elimina la cuenta del usuario autenticado
- **Middleware `verifyToken`** — valida JWT en header `Authorization: Bearer <token>` antes de rutas protegidas
- **Rate limiting** — `/user/signup` y `/user/login` limitados a 10 requests cada 15 minutos
- **Validación de inputs** — `express-validator` activo en todos los endpoints con body
- **Modelo de usuario** — esquema Mongoose completo con todos los campos (ver sección de arquitectura)
- **CORS** — configurado para `http://localhost:3000` y `http://localhost:8100` (Ionic), con `methods` y `allowedHeaders` explícitos
- **JWT** — secret leído desde variable de entorno `JWT_CODE`; tokens expiran en 7 días

---

### 🐛 BUGS CONOCIDOS (rompen funcionalidad)

*(No hay bugs activos en este momento)*

---

### ⚠️ INCOMPLETO / A MEDIAS

| Elemento | Ubicación | Estado |
|----------|-----------|--------|
*(No hay ítems incompletos pendientes)*

---

### ❌ NO IMPLEMENTADO

- Recuperación de contraseña

---

## Prioridades recomendadas

### 🔴 Urgente (bugs que rompen flujos reales)

*(No hay ítems urgentes pendientes)*

### 🟡 Importante (calidad y seguridad)

*(No hay ítems importantes pendientes)*

### 🟢 Backlog (funcionalidades nuevas)

*(No hay ítems de backlog pendientes)*

---

## Arquitectura de datos

```
MongoDB (SostekDB)
└── colección: users
    ├── name          (String, required)
    ├── surname       (String, required)
    ├── email         (String, required, unique, lowercase)
    ├── password      (String, required, bcrypt hash)
    ├── birth_date    (String, optional)
    ├── occupation    (String, optional)
    ├── gender        (String, optional)
    ├── score_test    (Number, optional, default: 0)
    └── score_game    (Number, optional, default: 0)
```

**Variables de entorno** (archivo `.env` en raíz, no incluido en el repo):

| Variable | Default actual | Descripción |
|----------|----------------|-------------|
| `PORT` | `8080` | Puerto del servidor |
| `DB_IP` | `127.0.0.1` | IP de MongoDB |
| `DB_PORT` | `27017` | Puerto de MongoDB |
| `JWT_CODE` | — | Secret para firmar tokens JWT (requerido, sin default) |

---

## Cómo correr el proyecto

```bash
npm install

# MongoDB debe estar corriendo primero
npm run dev:js       # desarrollo con nodemon (recarga automática)
npm start            # producción (node directo)
npm run build-start  # compila TypeScript y arranca
```

El frontend debe correr por separado en `http://localhost:3000`.
