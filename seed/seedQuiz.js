require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const { Quiz } = require('../src/models/contentModel');

const DATA_PATH = process.argv[2] || path.join(__dirname, 'quiz_data.json');

const DB_URL = process.env.DB_URL ||
    ('mongodb://' + (process.env.DB_IP || '127.0.0.1') + ':' + (process.env.DB_PORT || '27017') + '/SostekDB');

/* data es el contenido de quiz_data.json: { tiers, quizzes }. Los tramos de retroalimentacion
   son los mismos para todos los tests, asi que se escriben una vez y aqui se copian a cada quiz.
   Idempotente: cada quiz reemplaza al que ya tenga su mismo nivel y tipo (conserva su _id), o
   se inserta si no existe. No borra nada mas, porque la base es la misma de produccion. */
async function upsertQuizzes(data) {
    for (const quiz of data.quizzes) {
        await Quiz.replaceOne({ level: quiz.level, type: quiz.type }, { ...quiz, tiers: data.tiers }, { upsert: true, runValidators: true });
    }
}

async function seed() {
    await mongoose.connect(DB_URL, { useNewUrlParser: true });
    console.log('Conectado a MongoDB');

    const data = require(DATA_PATH);
    await upsertQuizzes(data);
    for (const quiz of data.quizzes) {
        const total = quiz.blocks.reduce((n, b) => n + b.questions.length, 0);
        console.log(`Nivel ${quiz.level}, tipo ${quiz.type} "${quiz.title}": ${quiz.blocks.length} bloques, ${total} preguntas`);
    }

    await mongoose.disconnect();
    console.log('Listo');
}

if (require.main === module) {
    seed().catch(err => {
        console.error('Error en seed:', err.message);
        process.exit(1);
    });
}

module.exports = { upsertQuizzes };
