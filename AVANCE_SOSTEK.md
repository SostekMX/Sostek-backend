# AVANCE SOSTEK — Backend (Fuente de Verdad)

> Última actualización: 2026-11-24, entrega del servicio social. Contenido versionado en `seed/content`, `npm run dev:memoria`, CI que revisa la sincronía `.ts`/`.js` y mensajes claros al arrancar.
> Rama activa: `development`. `main` es lo que corre en producción.
> Stack: Node.js 24 + Express 4 + TypeScript + MongoDB (Mongoose 6)

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
| Headers de seguridad | helmet |
| Email | nodemailer (Gmail SMTP) |
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
| `GET` | `/health` | Health check — responde `{ status: 'ok' }` (usado por UptimeRobot para mantener el servidor activo) | Ninguna (pública) |
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
| `GET` | `/quiz?level=N` | Quizzes de proyectos de negocio (`level` opcional) | Ninguna (pública) |
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
- **`POST /user/forgot-password`**: recibe el correo (y `lang`: `es` o `en`), genera un token seguro de 64 caracteres hexadecimales que vence en 1 h, lo guarda en el usuario y lo manda **solo por correo**. Siempre responde el mismo mensaje genérico, exista o no el correo, y nunca devuelve el token. Tiene rate limit.
- **`POST /user/reset-password`** — recibe `token` + `new_password`, valida que el token exista y no esté expirado, hashea la nueva contraseña con bcrypt y limpia los campos de reset en el documento
- **`GET /evaluations`** — retorna lista de evaluaciones sin el campo `questions`, pero agrega `question_count` (total de preguntas) calculado con `questions.length`; incluye `name`, `career` y `description` (ahora con rango de semestre recomendado, ej. `"(3°-4° semestre) ..."`)
- **`GET /evaluations/:id`** — retorna evaluación completa con preguntas, opciones y valores numéricos; `questions[].category` usa solo `"Ambiental"` o `"Económico y Social"` (alineado con las categorías de artículos para el sistema de recomendación)
- **`GET /articles`** — retorna lista completa de artículos; los 25 artículos tienen `category` asignada (`Ambiental` | `Económico` | `Social`) para el sistema de recomendación
- **`GET /articles/:id`** — retorna un artículo por ID
- **`GET /presentations`** — retorna lista de presentaciones con sus URLs de slides; cada presentación incluye campo `cover` (URL de imagen de portada)
- **`POST /user/favorites`** — agrega un artículo o presentación a favoritos; valida `content_id` y `type` (`article` | `presentation`); rechaza duplicados
- **`GET /user/favorites`** — retorna el array `favorites` del usuario autenticado
- **`DELETE /user/favorites/:content_id`** — elimina el favorito con ese `content_id` usando `$pull` de MongoDB
- **`GET /tutorial`** — retorna el documento único de tutorial con `title`, `rules` y `cards[]` (16 tarjetas de escenario + 32 de solución); cada tarjeta tiene `name`, `description`, `type` y `resources` (ambiental/economico/social)
- **`GET /quiz`** — retorna `quizzes[]` ordenados por `level` y `type`; con `?level=N` filtra por nivel (un nivel sin contenido da `[]`, uno inválido da `success: false`). Hay 6 tests: niveles 1 a 3, cada uno con type 1 (Modelo de Negocio) y type 2 (Empresa Rentable), de 23 preguntas. Cada pregunta trae su `weight` (4 estándar, 5 estratégica), cada opción su `score` (escalón 0–3), y cada quiz sus 5 `tiers` de retroalimentación final. La opción vale `score × weight / 3` y el total va de 0 a 100 (ver API_CONTRACTS)
- **Middleware `verifyToken`** — valida JWT en header `Authorization: Bearer <token>` antes de rutas protegidas
- **Rate limiting** — `/user/signup` y `/user/login` limitados a 10 requests cada 15 minutos
- **Validación y sanitización de inputs** — `express-validator` en todos los endpoints con body; incluye longitudes máximas (name/surname 50, email 100, password 128, occupation 100), tipos correctos (`isFloat` en scores, `isString` en opcionales), y sanitización (`.trim()`, `.normalizeEmail()`)
- **`POST /user/avatar`** — recibe imagen `multipart/form-data` (campo `avatar`); valida formato (jpg/png/webp) y tamaño (máx 5MB); sube a Cloudinary en la carpeta `sostek/avatars`; guarda `secure_url` en el campo `avatar` del usuario; retorna `{ success: true, avatar_url: "..." }`
- **Graceful shutdown** — el servidor captura `SIGUSR2` (nodemon restart), `SIGTERM` y `SIGINT` (Ctrl+C) para cerrar el HTTP server antes de salir; evita el error `EADDRINUSE` al reiniciar en desarrollo
- **Unit tests**: Jest, Supertest y mongodb-memory-server. Cubren signup, login, JWT, score, recuperación de contraseña, favoritos, avatar, el quiz y los seeds de contenido (`npm test`).
- **CI**: GitHub Actions corre `npm test` y revisa que los `.js` salgan de los `.ts` (`npm run build` sin diferencias) en cada push a `main` y a `development`, y en los PR hacia ellas.
- **Arranque claro**: si la base no responde, el servidor imprime el host (sin credenciales) y qué revisar. Sin `JWT_CODE` no arranca, y dice cómo generarlo.
- **`npm run dev:memoria`**: backend completo con MongoDB en memoria y el contenido de `seed/`. Nunca toca Atlas.
- **Modelo de usuario** — esquema Mongoose completo con todos los campos (ver sección de arquitectura)
- **CORS**: acepta `http://localhost:3000`, `http://localhost:8100` y los orígenes de `CORS_ORIGIN` (variable de entorno, separados por coma). En producción es `https://sostek.vercel.app`.
- **`GET /health`** — endpoint de health check; responde `{ status: 'ok' }`; usado por UptimeRobot para mantener el servidor en Render siempre activo
- **JWT** — secret leído desde variable de entorno `JWT_CODE`; tokens expiran en 7 días
- **Email de recuperación** — `POST /user/forgot-password` envía email con link y token vía nodemailer + Gmail SMTP; requiere `EMAIL_USER`, `EMAIL_PASS` y `FRONTEND_URL` en `.env`; si no están configuradas, loguea warning y continúa sin enviar
- **Seguridad (helmet)** — `app.use(helmet())` activa 15 headers HTTP de protección (CSP, X-Frame-Options, HSTS, etc.)
- **Seguridad (MIME validation)** — subida de avatar valida magic bytes reales del archivo con `file-type`, no solo el Content-Type del cliente
- **Seguridad (enumeración)** — login devuelve `"Correo o contraseña incorrectos"` en ambos casos de fallo; forgot-password siempre devuelve el mismo mensaje genérico independientemente de si el email existe
- **Seguridad (rate limit completo)** — `/user/reset-password` también tiene rate limit (10 req / 15 min)
- **Seguridad (profile)** — `GET /user/profile` excluye `reset_token` y `reset_token_expiry` de la respuesta
- **Seguridad (errores)** — los `.catch()` devuelven mensajes genéricos; nunca exponen objetos de error de Mongoose al cliente

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

| Ítem | Estado |
|------|--------|
| **Deploy en Render** — `main` sincronizado con `development`, deploy disparado y `/health` responde `{"status":"ok"}` (200 OK). URL: `https://sostek-backend.onrender.com` | ✅ Activo |
| **UptimeRobot** — monitor activo en `https://sostek-backend.onrender.com/health`, checks cada 5 min, 100% uptime. | ✅ Activo |
| **Actualizar URL del frontend**: el frontend usa `REACT_APP_BACKEND_URL=https://sostek-backend.onrender.com`. | ✅ Hecho |
| **Frontend en Vercel**: `https://sostek.vercel.app` es el oficial desde el 2026-06-17. `CORS_ORIGIN` lo deja pasar (verificado el 2026-11-24). | ✅ Activo |
| **Sitio estático de Render** (`sostek-frontend.onrender.com`): quedó abandonado. Se sigue publicando con cada push a `main`, pero CORS no lo deja pasar, así que no carga contenido. Está pendiente de baja: ve `ACCESOS.md` en el repo del frontend. | ⚠️ Pendiente de baja |

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
    ├── category  (String — 'Ambiental' | 'Económico' | 'Social', la usa el frontend para recomendar)
    ├── tags      (Array de String)
    └── bibliography (String)

colección: presentations
    ├── name    (String, required)
    ├── cover   (String — URL de imagen de portada, default: '')
    └── slides  (Array de String — URLs de imágenes)

colección: tutorial  (documento único)
    ├── title   (String, required — "Instructivo SOSTEK")
    ├── rules   (String, required — texto de reglas del juego)
    └── cards   (Array de { name, description, type: 'scenario'|'solution', resources: { ambiental, economico, social } })

colección: quizzes  (único por level + type)
    ├── level, type      (Number, required — p. ej. 3 y 1)
    ├── title, summary, focus (String)
    ├── blocks           (Array de { name, questions: [{ text, weight: 4|5, options: [{ text, score: 0–3 }] }] })
    └── tiers            (Array de { min, title, text } — 5 tramos de retroalimentación, iguales en los 6 tests)
```

**Variables de entorno**: cada una está explicada en [`.env.example`](.env.example), que es la única referencia. Los valores de producción viven en Render; ve [`DESPLIEGUE.md`](https://github.com/SostekMX/Sostek/blob/main/DESPLIEGUE.md).

---

## Archivos clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/index.ts` | Todos los endpoints y el middleware (fuente TypeScript) |
| `src/index.js` | Lo genera `npm run build` desde el `.ts`. Es lo que corre en producción; CI revisa que coincida |
| `src/models/authModel.ts` | Esquema de usuario y conexión a MongoDB (fuente) |
| `src/models/contentModel.ts` | Esquemas de Evaluation, Article, Presentation, Tutorial y Quiz (fuente) |
| `src/models/*.js` | Los genera `npm run build` |
| `seed/content/*.json` | **Contenido de producción**: artículos, presentaciones y evaluaciones con sus `_id`. Se exportó de Atlas el 2026-11-24 y es la fuente de verdad. |
| `seed/seedContent.js` | Carga `seed/content` con upsert por `_id`; no borra nada. Uso: `npm run seed:content` |
| `seed/seedPresentations.js` | Sube imágenes locales a Cloudinary y agrega la presentación a `seed/content/presentations.json`. Uso: `npm run seed:presentations "Nombre" "ruta/carpeta"` |
| `seed/seedTutorial.js` | Carga el instructivo del juego desde `seed/tutorial_data.json`. Uso: `npm run seed:tutorial` |
| `seed/seedQuiz.js` | Upsert idempotente de los quizzes por nivel y tipo desde `seed/quiz_data.json`: copia los tramos a cada test, conserva los `_id` y no borra nada. Uso: `npm run seed:quiz` |
| `seed/quiz_data.json` | Los 6 tests y los 5 tramos, extraídos del PDF de ponderación de Carlos (`Ponderacion_retro.pdf`, lo guarda coordinación). Un test valida escalas, preguntas estratégicas, máximo de 100 y tramos |
| `seed/tutorial_data.json` | El instructivo completo: reglas y 48 tarjetas (16 de escenario y 32 de solución) |
| `scripts/dev-memoria.js` | `npm run dev:memoria`: MongoDB en memoria con el contenido de `seed/` y el servidor |
| `.env.example` | Plantilla de variables de entorno. Se copia a `.env`, que no se versiona |
| `tests/index.test.js` | Tests con Jest y Supertest. Se corren con `npm test` |
| `jest.config.js` | Configuración de Jest |
| `.github/workflows/test.yml` | GitHub Actions: tests y revisión de que los `.js` salgan de los `.ts` |

---

## Cómo correr el proyecto

```bash
npm install
npm run dev:memoria  # MongoDB en memoria con el contenido real; no necesita .env ni Atlas
npm run dev:js       # desarrollo con nodemon, contra la base de tu .env
npm start            # producción (node directo)
npm run build        # regenera los .js después de editar un .ts
npm test             # tests (no necesitan MongoDB instalado ni .env)
```

El frontend corre por separado en `http://localhost:3000`. Todo el detalle está en `ONBOARDING_BACKEND.md`.

---

## Deuda técnica conocida

No bloquea nada hoy, pero conviene planearla:

- **Mongoose 6.** Pasar a la 8 o posterior obliga a quitar los callbacks de `findOneAndUpdate` en `src/index.ts`, porque Mongoose 7 los eliminó.
- **Express 4, `express-validator` 6 y `nodemailer` 8** están varias versiones atrás.
- **El contenido de los artículos enlaza imágenes de sitios ajenos.** Algunas ya no cargan. Conviene subirlas a Cloudinary y cambiar las URLs en `seed/content/articles.json`.
