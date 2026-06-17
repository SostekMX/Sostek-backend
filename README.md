# SOSTEK Backend

Servidor de usuarios y contenido para la plataforma educativa SOSTEK. Construido con Node.js + Express + MongoDB Atlas.

## Setup

**1. Instalar dependencias**
```bash
npm install
```

**2. Crear el archivo `.env`** copiando `.env.example` y llenando los valores:
```bash
cp .env.example .env
```

**3. Correr el servidor**
```bash
npm run dev:js     # desarrollo (nodemon, recarga automática)
npm start          # producción
```

El servidor queda disponible en `http://localhost:8080`.

## Cargar contenido a la base de datos

La primera vez (o cuando cambie el contenido) hay que correr los seeds:

```bash
# Artículos — requiere el CSV exportado de Google Sheets
npm run seed:articles "ruta/al/archivo.csv"

# Presentaciones — requiere las imágenes descargadas localmente
npm run seed:presentations "Nombre de la presentacion" "ruta/a/la/carpeta"

# Evaluaciones — descarga automáticamente desde Google Sheets público
npm run seed:evaluations

# Tutorial del juego — inserta reglas y tarjetas desde seed/tutorial_data.json
npm run seed:tutorial
```

## Correr los tests

```bash
npm test     # 33 unit tests con Jest + Supertest (no necesita MongoDB)
```

## Documentación

| Archivo | Para quién |
|---------|-----------|
| `AVANCE_SOSTEK.md` | Fuente de verdad del proyecto — estado, endpoints, arquitectura |
| `ONBOARDING_BACKEND.md` | Guía de onboarding para quien se suma al proyecto por primera vez |
