# Guía para el siguiente estudiante: SOSTEK Backend

> Si es tu primera vez en este repo, lee esto antes de tocar código.
> - Para levantar todo (backend y frontend) en media hora, sigue «Tus primeros 30 minutos» en [`ONBOARDING_FRONTEND.md`](https://github.com/SostekMX/Sostek/blob/main/ONBOARDING_FRONTEND.md).
> - Para saber qué está hecho y qué falta, ve [`AVANCE_SOSTEK.md`](AVANCE_SOSTEK.md).

---

## 1. Contexto: por qué existe este backend

Al principio, el frontend (Ionic React) leía todo el contenido directo de Google Sheets y Google Drive con `gapi.client`: artículos, evaluaciones, presentaciones y el tutorial. Se abandonó porque **no había forma de conservar las API keys de Google**: eran de cuentas personales, no institucionales, y expiran o se revocan.

La solución fue mover el contenido a **MongoDB Atlas** y servirlo desde este backend con endpoints propios (`/articles`, `/evaluations`, `/presentations`, `/tutorial` y `/quiz`). Hoy el contenido vive versionado en `seed/` y se carga con los seeds (ver §5).

---

## 2. Setup desde cero

```bash
npm install
npm run dev:memoria
```

Con eso basta para trabajar. La API queda en `http://localhost:8080`, con una base en memoria que ya trae el contenido real: `seed/content`, el quiz y el tutorial. No necesitas `.env`, Atlas ni Docker. Lo que guardes se pierde al cerrarlo.

- **La primera instalación tarda.** `npm install` baja MongoDB para los tests y para `dev:memoria`: unos 780 MB en Windows y unos 120 MB en Linux o macOS. Se guarda en `node_modules/.cache` y no se vuelve a bajar.
- **Corre `dev:memoria` desde la carpeta del repo.** Desde otra carpeta no encuentra ese binario y lo baja otra vez.
- **Si el puerto 8080 está ocupado**, crea un `.env` con `PORT=8081` y apunta el frontend a ese puerto con `REACT_APP_BACKEND_URL`.

### Con una base que se conserve

```bash
cp .env.example .env          # llena JWT_CODE: el archivo dice cómo generarlo
docker run -d --name sostek-mongo -p 27017:27017 mongo:6   # o cualquier MongoDB local
npm run seed:content && npm run seed:quiz && npm run seed:tutorial
npm run dev:js                # servidor con recarga automática
```

### Contra Atlas (producción)

Solo si te dieron acceso: ve [`ACCESOS.md`](https://github.com/SostekMX/Sostek/blob/main/ACCESOS.md). El connection string va en `DB_URL`. **Todo lo que hagas en localhost escribe en la base real, que tiene usuarios reales.**

- Si `mongodb+srv://` falla con `querySrv ECONNREFUSED`, usa el connection string estándar (`mongodb://…`), sin SRV. Atlas lo da en **Connect → Drivers**.
- Tu IP tiene que estar en la lista de **Network Access** de Atlas.

Si el servidor no arranca, el mensaje dice qué falta: `[db] No se pudo conectar a MongoDB en …` o `[config] Falta JWT_CODE…`. Todas las variables están explicadas en `.env.example`. Las de correo (`EMAIL_*`) y las de Cloudinary (`CLOUDINARY_*`) son opcionales en local.

---

## 3. Lo que NO puedes romper

Romper estas reglas tira el login de usuarios reales o expone datos. Si vas a tocar algo de esta lista, piénsalo dos veces y pruébalo contra `dev:memoria` antes de hacer commit.

1. **El JWT se firma y se valida con `JWT_CODE`.** Si cambias ese secreto en producción, todos los usuarios con sesión abierta la pierden: su token deja de ser válido.
2. **El servidor corre `src/index.js`, no el `.ts`.** Edita el `.ts`, corre `npm run build` para regenerar los `.js` y commitea los dos. Lo mismo vale para los modelos (`src/models/*.ts` → `*.js`). CI falla si los `.js` no coinciden con lo que genera `tsc`.
3. **Nunca devuelvas `password`, `reset_token` ni `reset_token_expiry` en una respuesta JSON.** `GET /user/profile` ya los excluye; si agregas un endpoint que devuelva el usuario, repite ese filtro.
4. **Los mensajes de error de login y de forgot-password son genéricos a propósito.** Así nadie puede averiguar qué correos están registrados. No los hagas más específicos «para ayudar al usuario».
5. **Todo endpoint que toca la base en nombre de un usuario usa el correo del JWT (`req.user.email`)**, nunca uno que venga en el body. Si no, cualquiera podría editar el perfil de otra persona mandando su correo.
6. **CORS solo acepta los orígenes de la lista**: `localhost:3000`, `localhost:8100` y los de `CORS_ORIGIN`. No pongas `origin: '*'` aunque parezca que arregla un error de CORS: eso abre el backend a cualquier sitio.

---

## 4. Qué hacer con cada tipo de cambio

| Cambio | Pasos obligatorios |
|--------|---------------------|
| Endpoint nuevo o modificado | 1) Escríbelo en `src/index.ts` y corre `npm run build`. 2) Agrega validación con `express-validator`: no confíes en que el frontend ya validó. 3) Pruébalo con curl o Postman contra `dev:memoria`. 4) Escribe un test en `tests/index.test.js`. 5) Actualiza la tabla de endpoints de `AVANCE_SOSTEK.md` y [`API_CONTRACTS.md`](https://github.com/SostekMX/Sostek/blob/main/API_CONTRACTS.md). |
| Cambio al esquema de Mongo | Edita `src/models/*.ts` y corre `npm run build`. Si el campo no es obligatorio, ponle `default` para no romper documentos viejos. Si es un campo de contenido, agrégalo también a los JSON de `seed/content`. |
| Bug encontrado | Anótalo en `AVANCE_SOSTEK.md` antes de arreglarlo, y muévelo a «implementado» cuando esté resuelto y probado. |
| Variable de entorno nueva | Agrégala a `.env.example` con un comentario que diga qué es y de dónde sale. Si se usa en producción, agrégala también a [`DESPLIEGUE.md`](https://github.com/SostekMX/Sostek/blob/main/DESPLIEGUE.md). |
| Cualquier cambio | Corre `npm test` antes de abrir el PR. CI corre en los PR a `development` y a `main`. Si rompiste un test existente, probablemente cambiaste un contrato que usa el frontend: avisa antes de integrar. |

Commits en español, en formato `tipo(alcance): descripción` y sin autoría de IA (ve la regla de `ONBOARDING_FRONTEND.md`).

---

## 5. Contenido y seeds

La app solo **lee** el contenido. Se edita en los JSON de `seed/` y se carga con los seeds. **Esos JSON son la fuente de verdad**: si cambias algo directo en Atlas, actualiza también el JSON.

| Seed | Fuente | Qué hace |
|---|---|---|
| `npm run seed:content` | `seed/content/*.json` | Hace upsert por `_id`: no borra, no duplica y conserva los favoritos y las URLs |
| `npm run seed:quiz` | `seed/quiz_data.json` | Hace upsert por nivel y tipo, y copia los tramos de retroalimentación a cada test |
| `npm run seed:tutorial` | `seed/tutorial_data.json` | Reemplaza el documento del tutorial |
| `npm run seed:presentations "Nombre" "carpeta"` | imágenes locales | Sube las slides a Cloudinary (necesita `CLOUDINARY_*`) y agrega la presentación a `seed/content/presentations.json`. Después corre `seed:content`. |

Todos escriben en la base de tu `.env`. Con el `DB_URL` de Atlas, escriben en **producción**.

**Para agregar un artículo:**
1. Copia uno en `seed/content/articles.json`, cambia los campos y ponle un `_id` nuevo de 24 caracteres hexadecimales. Puedes generarlo con `node -e "console.log(new (require('mongoose').Types.ObjectId)().toString())"`.
2. Usa en `category` un valor de `Ambiental`, `Económico` o `Social`. Con eso el frontend recomienda artículos al terminar una evaluación.
3. Las preguntas de las evaluaciones usan `Ambiental` o `Económico y Social`. Un test revisa estas categorías.

`seed:articles` (desde un CSV) y `seed:evaluations` (desde Google Sheets) se retiraron en noviembre de 2026. Sus fuentes estaban desactualizadas y correrlos borraba arreglos que se hicieron en la base. Siguen en el historial de git.

---

## 6. Tests

```bash
npm test
```

- Usan Jest, Supertest y `mongodb-memory-server`, una base de Mongo en memoria. No tocan Atlas ni necesitan `.env`, y después de la primera instalación tampoco necesitan internet.
- Cubren registro, login, JWT, perfil, puntaje, recuperación de contraseña, favoritos, avatar, el quiz y los seeds de contenido.
- GitHub Actions corre los tests y revisa que los `.js` salgan de los `.ts` en cada push a `main` y a `development`, y en cada PR hacia ellas.
- No hay tests contra Atlas ni contra Cloudinary reales.

---

## 7. Deploy

Render publica `main` automáticamente. Las variables, CORS, el rollback y UptimeRobot están en [`DESPLIEGUE.md`](https://github.com/SostekMX/Sostek/blob/main/DESPLIEGUE.md), en el repo del frontend.

---

## 8. Dónde buscar si algo no tiene sentido

| Pregunta | Dónde buscar |
|----------|--------------|
| ¿Qué está hecho y qué falta? | `AVANCE_SOSTEK.md` |
| ¿Qué hace este endpoint exactamente? | `src/index.ts` (es la fuente; el `.js` se genera con `npm run build`) |
| ¿Qué forma tiene este documento en Mongo? | `src/models/authModel.ts` o `contentModel.ts` |
| ¿Cómo se probó esto la última vez? | `tests/index.test.js` |
| ¿Por qué se tomó esta decisión rara? | `git log`: los commits están en español y explican el porqué, no solo el qué |
