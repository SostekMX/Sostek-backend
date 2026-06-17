# Guía para el siguiente estudiante — SOSTEK Backend

> Si es tu primera vez en este repo, leé esto antes de tocar código.
> Después de esta guía, leé `AVANCE_SOSTEK.md` — ese archivo es la fuente de verdad del estado actual (qué está hecho, qué falta, prioridades).

---

## 1. Contexto: por qué este backend existe

Al principio, el frontend (Ionic React) leía el contenido (artículos, evaluaciones, presentaciones, tutorial) directamente desde Google Sheets / Google Drive usando `gapi.client`. Esto se abandonó porque **no teníamos forma de conseguir o mantener las API keys de Google** para ese proyecto a largo plazo (son cuentas personales, no institucionales, y expiran o se revocan).

La solución fue migrar todo ese contenido a **MongoDB Atlas** y servirlo desde este backend con endpoints propios (`/articles`, `/evaluations`, `/presentations`, `/tutorial`). Los scripts en `seed/` son los que hicieron esa migración una sola vez — están ahí por si hay que recargar contenido en el futuro (ver sección 5).

Si en algún momento te preguntás "¿por qué no usamos directamente la API de Google?" — esa es la respuesta.

---

## 2. Setup desde cero

```bash
npm install
cp .env.example .env
```

Completá `.env` con:

| Variable | De dónde sale |
|----------|---------------|
| `JWT_CODE` | Inventalo vos — cualquier string largo y random (ej. generado con `openssl rand -hex 32`). No tiene que coincidir con nada externo, solo tiene que ser secreto y estable. |
| `DB_URL` | Connection string de MongoDB Atlas. **Pedile acceso al cluster `SostekDB`** a quien te pasó el repo — no se puede generar solo. |
| `CLOUDINARY_*` | Credenciales de la cuenta de Cloudinary del proyecto (usadas para avatares y para las imágenes de presentaciones). Pedilas también. |
| `EMAIL_USER` / `EMAIL_PASS` | Cuenta de Gmail que envía los correos de recuperación de contraseña. `EMAIL_PASS` es una **contraseña de aplicación** de Google, no la contraseña normal de la cuenta (Cuenta Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicación). |
| `FRONTEND_URL` | `http://localhost:3000` en desarrollo. |
| `CORS_ORIGIN` | Dejalo vacío en desarrollo. Solo se usa en producción (Render/Cloudflare Pages). |

Sin `DB_URL` o `JWT_CODE` el servidor no funciona — son las dos variables sin las que no hay forma de arrancar.

```bash
npm run dev:js     # servidor con recarga automática (nodemon)
```

El servidor queda en `http://localhost:8080`. El frontend (Ionic, repo separado) corre en `http://localhost:3000` y ya está configurado para apuntar ahí.

---

## 3. Lo que NO podés romper

Estas reglas existen porque romperlas tira abajo el login de usuarios reales o expone datos. Si vas a tocar algo de esta lista, pensalo dos veces y probá con curl/Postman antes de hacer commit:

1. **El JWT se firma y valida con `JWT_CODE`.** Si cambiás ese secret en producción, todos los usuarios logueados pierden la sesión (su token deja de ser válido).
2. **`src/index.ts` y `src/index.js` deben mantenerse sincronizados a mano.** El servidor en producción corre `src/index.js` (JS compilado a mano, no por `tsc` directamente en cada commit — revisá `package.json` para los scripts exactos). Si editás un endpoint en `.ts` y no replicás el cambio en `.js`, el cambio no llega a producción aunque el PR se vea bien.
3. **Nunca devolver `password`, `reset_token` ni `reset_token_expiry` en una respuesta JSON.** `GET /user/profile` ya los excluye explícitamente — si agregás un endpoint nuevo que devuelve el usuario, repetí ese mismo filtro.
4. **Los mensajes de error de login y forgot-password son intencionalmente genéricos** (`"Correo o contraseña incorrectos"`, mismo mensaje para email registrado y no registrado). Es para evitar que alguien pueda enumerar qué correos están registrados. No los hagas más específicos "para ayudar al usuario" — es una decisión de seguridad, no un descuido.
5. **Todo endpoint que toque la base de datos en nombre de un usuario usa el email del JWT (`req.user.email`), nunca un email que venga en el body.** Si agregás un campo `email` al body de un endpoint protegido, ignoralo — si no, cualquiera podría editar el perfil de otra persona pasando su email en el body.
6. **CORS solo acepta los orígenes en la lista (`localhost:3000`, `localhost:8100` + `CORS_ORIGIN`).** No pongas `origin: '*'` aunque parezca que "soluciona" un error de CORS en desarrollo — eso abre el backend a cualquier sitio.

---

## 4. Qué hacer con cada tipo de cambio

| Cambio | Pasos obligatorios |
|--------|---------------------|
| Endpoint nuevo o modificado | 1) Escribilo en `src/index.ts` **y** `src/index.js`. 2) Agregá validación con `express-validator` (no confiar en que el frontend ya validó). 3) Probalo con curl/Postman a mano. 4) Escribí un test en `tests/index.test.js`. 5) Actualizá la tabla de endpoints y el estado en `AVANCE_SOSTEK.md`. |
| Cambio al schema de Mongo | Editá `src/models/authModel.ts` o `contentModel.ts` (son los que importa `index.js`, no hay versión `.js` separada de los modelos — TypeScript los compila, pero revisá que el campo nuevo tenga `default` si no es obligatorio para no romper documentos viejos). |
| Bug encontrado | Agregalo a la sección de bugs en `AVANCE_SOSTEK.md` antes de arrancar a arreglarlo, y movelo a "implementado" cuando esté resuelto y probado. |
| Variable de entorno nueva | Agregala a `.env.example` con un comentario de qué es y de dónde se obtiene, y a la tabla de variables en `AVANCE_SOSTEK.md`. |
| Cualquier cambio | Corré `npm test` antes de abrir PR. Si rompiste un test existente, es señal de que cambiaste un contrato que el frontend probablemente está usando — avisá antes de mergear. |

---

## 5. Seeds — cuándo correrlos

Los seeds **no se corren automáticamente**. Solo hace falta correrlos si:
- Es la primera vez que conectás a un cluster de Mongo vacío, o
- Cambió el contenido fuente (nuevo CSV de artículos, nuevas evaluaciones en el Google Sheet, etc.)

```bash
npm run seed:articles "ruta/al/archivo.csv"
npm run seed:presentations "Nombre" "ruta/a/carpeta"
npm run seed:evaluations
npm run seed:tutorial
```

Si corrés un seed sobre una base que ya tiene datos, revisá el script primero — algunos insertan duplicados en vez de actualizar si lo corrés dos veces.

---

## 6. Tests

```bash
npm test
```

- Usa Jest + Supertest + `mongodb-memory-server` (una base de Mongo en memoria, no toca el cluster real de Atlas). Por eso `npm test` funciona sin `.env` configurado y sin internet.
- Hay 33 tests cubriendo signup, login, JWT, edición de perfil, score, recuperación de contraseña, favoritos y avatar.
- GitHub Actions corre `npm test` automáticamente en cada push a `main`/`development` y en cada PR a `main` — si lo rompés, el check rojo te va a avisar antes de que llegue a producción.
- No hay tests de integración contra el Mongo real ni contra Cloudinary — esos solo se prueban a mano con curl/Postman (ver sección 4).

---

## 7. Deploy

- Backend: Render, deploy automático al hacer push a `main`. URL: `https://sostek-backend.onrender.com`.
- UptimeRobot pingea `/health` cada 5 minutos para que Render no duerma el servicio.
- Frontend: Render (Static Site), separado de este repo.
- Si agregás una URL nueva de frontend en producción, agregala a la variable `CORS_ORIGIN` en el dashboard de Render del backend (separadas por coma) — si no, el navegador va a bloquear las requests por CORS aunque el backend esté funcionando bien.

---

## 8. Dónde mirar si algo no tiene sentido

| Pregunta | Dónde buscar |
|----------|--------------|
| "¿Qué está hecho y qué falta?" | `AVANCE_SOSTEK.md` |
| "¿Qué hace este endpoint exactamente?" | `src/index.ts` (es la fuente; `.js` es el espejo compilado a mano) |
| "¿Qué forma tiene este documento en Mongo?" | `src/models/authModel.ts` o `contentModel.ts` |
| "¿Cómo se probó esto la última vez?" | `tests/index.test.js` |
| "¿Por qué se tomó esta decisión rara?" | `git log` — los commits están en español y explican el porqué, no solo el qué |
