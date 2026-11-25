// Backend completo sin Atlas ni Docker: levanta un MongoDB en memoria, lo llena con el contenido
// versionado (seed/content, el quiz y el tutorial) y arranca el servidor. Nunca toca Atlas, aunque
// tu .env tenga un DB_URL. Todo lo que hagas (usuarios, favoritos) se pierde al cerrarlo con Ctrl+C.
// Uso: npm run dev:memoria   (el puerto sale de PORT en tu .env, o 8080)
require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
    const mongod = await MongoMemoryServer.create();
    // Se pisan antes de cargar la app: el servidor y los seeds leen estas variables al importarse.
    process.env.DB_URL = mongod.getUri('SostekDB');
    process.env.JWT_CODE = process.env.JWT_CODE || 'solo-para-desarrollo-local';

    require('../src/index.js');
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) await new Promise(r => mongoose.connection.once('open', r));
    if (!['127.0.0.1', 'localhost'].includes(mongoose.connection.host)) {
        throw new Error(`la conexion no es la base en memoria (${mongoose.connection.host}); no se siembra nada`);
    }

    const { upsertContent } = require('../seed/seedContent');
    const { upsertQuizzes } = require('../seed/seedQuiz');
    const { Tutorial } = require('../src/models/contentModel');
    const counts = await upsertContent();
    await upsertQuizzes(require('../seed/quiz_data.json'));
    await Tutorial.replaceOne({}, require('../seed/tutorial_data.json'), { upsert: true });

    console.log(`[dev:memoria] Base en memoria lista: ${Object.entries(counts).map(([f, n]) => `${n} de ${f}`).join(', ')}, quiz y tutorial.`);
    console.log('[dev:memoria] Lo que guardes se pierde al cerrar con Ctrl+C. No se toca Atlas.');
})().catch(err => {
    console.error('[dev:memoria]', err.message);
    process.exit(1);
});
