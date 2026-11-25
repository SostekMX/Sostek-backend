# SOSTEK Backend

API de usuarios y contenido de Sostek, la plataforma educativa de sostenibilidad de la facultad. Está hecha con Node.js, Express 4 y Mongoose 6 sobre MongoDB Atlas. El frontend vive en otro repo: [SostekMX/Sostek](https://github.com/SostekMX/Sostek).

> **¿Primera vez?** Sigue «Tus primeros 30 minutos» en [`ONBOARDING_FRONTEND.md`](https://github.com/SostekMX/Sostek/blob/main/ONBOARDING_FRONTEND.md), que levanta los dos repos. Después lee [`ONBOARDING_BACKEND.md`](ONBOARDING_BACKEND.md).

## Arrancar

Necesitas Node 24 (está en `.nvmrc`) y Git.

```bash
git clone https://github.com/SostekMX/Sostek-backend.git
cd Sostek-backend
npm install          # la primera vez tarda unos minutos: baja MongoDB para los tests
npm run dev:memoria  # API en http://localhost:8080 con el contenido real, sin Atlas ni Docker
```

`dev:memoria` usa una base en memoria, así que lo que guardes (usuarios, favoritos) se pierde al cerrarlo. Para trabajar con una base que persista, ve `ONBOARDING_BACKEND.md` §2.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev:memoria` | Servidor y MongoDB en memoria con el contenido de `seed/`. No toca Atlas. |
| `npm run dev:js` | Servidor con recarga automática, contra la base de tu `.env`. |
| `npm start` | Servidor sin recarga. Es lo que corre Render. |
| `npm test` | Tests con Jest, Supertest y Mongo en memoria. No necesitan `.env` ni internet. |
| `npm run build` | Regenera los `.js` desde los `.ts`. Córrelo cada vez que edites un `.ts`. |
| `npm run seed:content` | Carga `seed/content/*.json`: artículos, presentaciones y evaluaciones. |
| `npm run seed:quiz` | Carga `seed/quiz_data.json`. |
| `npm run seed:tutorial` | Carga `seed/tutorial_data.json`, el instructivo del juego. |
| `npm run seed:presentations "Nombre" "carpeta"` | Sube las slides a Cloudinary y agrega la presentación a `seed/content/presentations.json`. |

Los seeds escriben en la base de tu `.env`. **Si ahí está el `DB_URL` de Atlas, escriben en producción.** `seed:content` y `seed:quiz` hacen upsert y no borran nada; `seed:tutorial` reemplaza el único documento del tutorial.

## Documentación

| Archivo | Para qué |
|---|---|
| [`ONBOARDING_BACKEND.md`](ONBOARDING_BACKEND.md) | Cómo trabajar en este repo: setup, reglas, contenido y tests |
| [`AVANCE_SOSTEK.md`](AVANCE_SOSTEK.md) | Endpoints, modelos y estado del backend |
| [`.env.example`](.env.example) | Cada variable de entorno, explicada |
| [`ARQUITECTURA.md`](https://github.com/SostekMX/Sostek/blob/main/ARQUITECTURA.md) | Cómo encajan el frontend, el backend y la base (repo del frontend) |
| [`API_CONTRACTS.md`](https://github.com/SostekMX/Sostek/blob/main/API_CONTRACTS.md) | El contrato de cada endpoint (repo del frontend) |
| [`DESPLIEGUE.md`](https://github.com/SostekMX/Sostek/blob/main/DESPLIEGUE.md) | Producción: Render, Vercel, variables, CORS y rollback (repo del frontend) |
| [`ACCESOS.md`](https://github.com/SostekMX/Sostek/blob/main/ACCESOS.md) | Las cuentas del proyecto y cómo pedir acceso (repo del frontend) |
