# AVANCE SOSTEK — Backend (Fuente de Verdad)

> Última actualización: 2026-06-08
> Rama activa: `development`
> Stack: Node.js + Express + TypeScript + MongoDB

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js |
| Framework | Express 4 |
| Lenguaje | TypeScript (fuente `src/*.ts`, compilado `src/*.js`) |
| Base de datos | MongoDB 6 via Mongoose |
| Autenticación | JWT (`jsonwebtoken`) — expira en 7 días |
| Hashing | bcryptjs (salt 10) |
| Validación | express-validator |
| Rate limiting | express-rate-limit |
| Variables de entorno | dotenv |
| Desarrollo | nodemon (`npm run dev:js`) |

---

## ¿Qué es este repositorio?

El **servidor de usuarios de SOSTEK**: maneja el registro, login y edición de perfil de los usuarios de la plataforma. Corre en `http://localhost:8080` y es consumido por el frontend (Ionic React en `:3000`).

Contiene también los endpoints de contenido: evaluaciones, artículos, presentaciones y el tutorial del juego, almacenados en MongoDB Atlas. El contenido se carga con los scripts de seed en `seed/`.

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
| `POST` | `/user/forgot-password` | Generar token de recuperación de contraseña | Ninguna (pública) |
| `POST` | `/user/reset-password` | Resetear contraseña con token válido | Ninguna (pública) |
| `GET` | `/evaluations` | Lista de evaluaciones (sin preguntas) | Ninguna (pública) |
| `GET` | `/evaluations/:id` | Detalle completo de una evaluación | Ninguna (pública) |
| `GET` | `/articles` | Lista de todos los artículos | Ninguna (pública) |
| `GET` | `/articles/:id` | Detalle de un artículo | Ninguna (pública) |
| `GET` | `/presentations` | Lista de presentaciones con slides | Ninguna (pública) |
| `POST` | `/user/favorites` | Agregar artículo o presentación a favoritos | JWT requerido |
| `GET` | `/user/favorites` | Obtener lista de favoritos del usuario | JWT requerido |
| `DELETE` | `/user/favorites/:content_id` | Eliminar un favorito por ID de contenido | JWT requerido |
| `GET` | `/tutorial` | Obtener instructivo del juego (reglas + tarjetas) | Ninguna (pública) |
| `POST` | `/user/avatar` | Subir foto de perfil (jpg/png/webp, máx 5MB) a Cloudinary y guardar URL en el usuario | JWT requerido |

---

## Estado actual por módulo

### ✅ IMPLEMENTADO Y FUNCIONAL

- **`POST /user/signup`** — crea usuario en MongoDB con contraseña hasheada (bcrypt), retorna JWT
- **`POST /user/login`** — valida credenciales con bcrypt, retorna JWT
- **`POST /user/edit`** — actualiza `name`, `surname`, `birth_date`, `occupation` y `gender`; protegido con JWT (usa el email del token, no del body); los campos opcionales solo se actualizan si llegan en el body
- **`GET /user/profile`** — retorna datos del usuario (sin password); protegido con JWT
- **`POST /user/score`** — actualiza `score_test` y/o `score_game`; acepta uno o ambos campos opcionalmente
- **`DELETE /user`** — elimina la cuenta del usuario autenticado
- **`POST /user/forgot-password`** — recibe email, genera token seguro (64 hex chars) con 1h de expiración, lo guarda en el usuario en DB, retorna `{ success: true, reset_token: "..." }`; limitado por rate limit
- **`POST /user/reset-password`** — recibe `token` + `new_password`, valida que el token exista y no esté expirado, hashea la nueva contraseña con bcrypt y limpia los campos de reset en el documento
- **`GET /evaluations`** — retorna lista de evaluaciones sin el campo `questions` (incluye `name`, `career` y `description`)
- **`GET /evaluations/:id`** — retorna evaluación completa con preguntas, opciones y valores numéricos
- **`GET /articles`** — retorna lista completa de artículos
- **`GET /articles/:id`** — retorna un artículo por ID
- **`GET /presentations`** — retorna lista de presentaciones con sus URLs de slides; cada presentación incluye campo `cover` (URL de imagen de portada)
- **`POST /user/favorites`** — agrega un artículo o presentación a favoritos; valida `content_id` y `type` (`article` | `presentation`); rechaza duplicados
- **`GET /user/favorites`** — retorna el array `favorites` del usuario autenticado
- **`DELETE /user/favorites/:content_id`** — elimina el favorito con ese `content_id` usando `$pull` de MongoDB
- **`GET /tutorial`** — retorna el documento único de tutorial con `title`, `rules` y `cards[]` (16 tarjetas de escenario + 32 de solución); cada tarjeta tiene `name`, `description`, `type` y `resources` (ambiental/economico/social)
- **Middleware `verifyToken`** — valida JWT en header `Authorization: Bearer <token>` antes de rutas protegidas
- **Rate limiting** — `/user/signup` y `/user/login` limitados a 10 requests cada 15 minutos
- **Validación y sanitización de inputs** — `express-validator` en todos los endpoints con body; incluye longitudes máximas (name/surname 50, email 100, password 128, occupation 100), tipos correctos (`isFloat` en scores, `isString` en opcionales), y sanitización (`.trim()`, `.normalizeEmail()`)
- **`POST /user/avatar`** — recibe imagen `multipart/form-data` (campo `avatar`); valida formato (jpg/png/webp) y tamaño (máx 5MB); sube a Cloudinary en la carpeta `sostek/avatars`; guarda `secure_url` en el campo `avatar` del usuario; retorna `{ success: true, avatar_url: "..." }`
- **Unit tests** — Jest + Supertest + mongodb-memory-server; 33 tests cubriendo signup, login, JWT, score, recuperación de password, favoritos y avatar (`npm test`)
- **CI/CD** — GitHub Actions corre `npm test` automáticamente en cada push a `main`/`development` y en PRs a `main`
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

*(No hay endpoints sin implementar)*

---

## Prioridades recomendadas

### 🔴 Urgente (bugs que rompen flujos reales)

*(No hay ítems urgentes pendientes)*

### 🟡 Importante (calidad y seguridad)

*(No hay ítems importantes pendientes)*

### 🟢 Backlog (funcionalidades nuevas)

*(No hay ítems pendientes en el backlog)*

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
    ├── score_test          (Number, optional, default: 0)
    ├── score_game          (Number, optional, default: 0)
    ├── reset_token         (String, optional — se llena al pedir recuperación)
    ├── reset_token_expiry  (Date, optional — expiración 1h desde la generación)
    ├── favorites           (Array de { content_id: String, type: 'article'|'presentation' })
    └── avatar              (String, optional, default: '' — URL de foto de perfil en Cloudinary)

colección: evaluations
    ├── name        (String, required)
    ├── career      (String, required — enum: 'Arquitectura' | 'Diseño Industrial' | 'Otros')
    ├── description (String, default: '' — texto descriptivo de la evaluación)
    └── questions   (Array de { category, text, options: [{ text, value }] })

colección: articles
    ├── title, subtitle, type, body  (String)
    ├── image, author, author_image, page_image  (String — URLs)
    ├── category  (String)
    └── tags      (Array de String)

colección: presentations
    ├── name    (String, required)
    ├── cover   (String — URL de imagen de portada, default: '')
    └── slides  (Array de String — URLs de imágenes)

colección: tutorial  (documento único)
    ├── title   (String, required — "Instructivo SOSTEK")
    ├── rules   (String, required — texto de reglas del juego)
    └── cards   (Array de { name, description, type: 'scenario'|'solution', resources: { ambiental, economico, social } })
```

**Variables de entorno** (archivo `.env` en raíz, no incluido en el repo):

| Variable | Default actual | Descripción |
|----------|----------------|-------------|
| `PORT` | `8080` | Puerto del servidor |
| `DB_IP` | `127.0.0.1` | IP de MongoDB |
| `DB_PORT` | `27017` | Puerto de MongoDB |
| `JWT_CODE` | — | Secret para firmar tokens JWT (requerido, sin default) |
| `DB_URL` | — | Connection string completo de MongoDB Atlas (si se usa, ignora DB_IP y DB_PORT) |
| `CLOUDINARY_CLOUD_NAME` | — | Nombre del cloud en Cloudinary (para seed de presentaciones) |
| `CLOUDINARY_API_KEY` | — | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | — | API secret de Cloudinary |

---

## Archivos clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/index.ts` | Todos los endpoints y middleware (fuente TypeScript) |
| `src/index.js` | Ídem compilado — debe mantenerse sincronizado con `.ts` |
| `src/models/authModel.ts` | Schema de usuario + conexión a MongoDB (fuente) |
| `src/models/authModel.js` | Ídem compilado |
| `src/models/contentModel.ts` | Schemas de Evaluation, Article y Presentation (fuente) |
| `src/models/contentModel.js` | Ídem compilado |
| `seed/seedArticles.js` | Importa artículos desde CSV a MongoDB. Uso: `npm run seed:articles "ruta/al/archivo.csv"` |
| `seed/seedPresentations.js` | Sube imágenes locales a Cloudinary y guarda URLs en MongoDB. Uso: `npm run seed:presentations "Nombre" "ruta/carpeta"` |
| `seed/seedEvaluations.js` | Descarga las 6 evaluaciones desde Google Sheets y las inserta en MongoDB. Uso: `npm run seed:evaluations` |
| `seed/seedTutorial.js` | Inserta el instructivo del juego en MongoDB desde `seed/tutorial_data.json`. Uso: `npm run seed:tutorial` |
| `seed/tutorial_data.json` | Contenido completo del instructivo: reglas + 48 tarjetas (16 escenario, 32 solución) extraídas del PDF original |
| `.env` | Variables de entorno locales (no en repo) |
| `.env.example` | Plantilla de variables de entorno — copiar a `.env` y completar valores |
| `tests/index.test.js` | 33 unit tests con Jest + Supertest — correr con `npm test` |
| `jest.config.js` | Configuración de Jest |
| `.github/workflows/test.yml` | GitHub Actions — corre tests en cada push/PR |

---

## Cómo correr el proyecto

```bash
npm install

# MongoDB debe estar corriendo primero
npm run dev:js       # desarrollo con nodemon (recarga automática)
npm start            # producción (node directo)
npm run build-start  # compila TypeScript y arranca
npm test             # corre los 33 unit tests (no necesita MongoDB)
```

El frontend debe correr por separado en `http://localhost:3000`.
