require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const { Quiz } = require('../src/models/contentModel');

const DATA_PATH = process.argv[2] || path.join(__dirname, 'quiz_data.json');

const DB_URL = process.env.DB_URL ||
    ('mongodb://' + (process.env.DB_IP || '127.0.0.1') + ':' + (process.env.DB_PORT || '27017') + '/SostekDB');

/* Idempotente: cada quiz reemplaza al que ya tenga su mismo nivel y tipo, o se inserta si
   no existe. No borra nada mas, porque la base es la misma de produccion. */
async function upsertQuizzes(quizzes) {
    for (const quiz of quizzes) {
        await Quiz.replaceOne({ level: quiz.level, type: quiz.type }, quiz, { upsert: true, runValidators: true });
    }
}

async function seed() {
    await mongoose.connect(DB_URL, { useNewUrlParser: true });
    console.log('Conectado a MongoDB');

    const quizzes = require(DATA_PATH);
    await upsertQuizzes(quizzes);
    for (const quiz of quizzes) {
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
