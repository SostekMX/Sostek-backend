require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const { Tutorial } = require('../src/models/contentModel');

const DATA_PATH = process.argv[2] || path.join(__dirname, 'tutorial_data.json');

const DB_URL = process.env.DB_URL ||
    ('mongodb://' + (process.env.DB_IP || '127.0.0.1') + ':' + (process.env.DB_PORT || '27017') + '/SostekDB');

async function seed() {
    await mongoose.connect(DB_URL, { useNewUrlParser: true });
    console.log('Conectado a MongoDB');

    const data = require(DATA_PATH);

    await Tutorial.deleteMany({});
    console.log('Colección tutorial limpiada');

    await Tutorial.create(data);
    console.log(`Tutorial "${data.title}" insertado con ${data.cards.length} tarjetas`);

    await mongoose.disconnect();
    console.log('Listo');
}

// Solo corre al ejecutarlo (npm run seed:tutorial), nunca al importarlo desde otro archivo.
if (require.main === module) {
    seed().catch(err => {
        console.error('Error en seed:', err.message);
        process.exit(1);
    });
}
