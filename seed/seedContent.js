require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const { Article, Presentation, Evaluation } = require('../src/models/contentModel');

const CONTENT_DIR = process.argv[2] || path.join(__dirname, 'content');

const DB_URL = process.env.DB_URL ||
    ('mongodb://' + (process.env.DB_IP || '127.0.0.1') + ':' + (process.env.DB_PORT || '27017') + '/SostekDB');

// Cada archivo de seed/content con el modelo que lo guarda.
const SOURCES = [
    ['articles.json', Article],
    ['presentations.json', Presentation],
    ['evaluations.json', Evaluation],
];

/* Idempotente: cada documento reemplaza al que tenga su mismo _id, o se inserta si no existe.
   No borra nada y conserva los _id, asi que los favoritos de los usuarios y las URLs de las
   evaluaciones siguen funcionando. Devuelve cuantos documentos cargo de cada archivo. */
async function upsertContent(dir = CONTENT_DIR) {
    const counts = {};
    for (const [file, Model] of SOURCES) {
        const docs = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        for (const doc of docs) {
            await Model.replaceOne({ _id: doc._id }, doc, { upsert: true, runValidators: true });
        }
        counts[file] = docs.length;
    }
    return counts;
}

async function seed() {
    await mongoose.connect(DB_URL, { useNewUrlParser: true });
    console.log('Conectado a MongoDB');

    const counts = await upsertContent();
    for (const [file, n] of Object.entries(counts)) console.log(`${file}: ${n} documentos`);

    await mongoose.disconnect();
    console.log('Listo');
}

if (require.main === module) {
    seed().catch(err => {
        console.error('Error en seed:', err.message);
        process.exit(1);
    });
}

module.exports = { upsertContent };
