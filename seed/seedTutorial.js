require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const DATA_PATH = process.argv[2] || path.join(__dirname, 'tutorial_data.json');

const DB_URL = process.env.DB_URL ||
    ('mongodb://' + (process.env.DB_IP || '127.0.0.1') + ':' + (process.env.DB_PORT || '27017') + '/SostekDB');

var TutorialCardSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    description: { type: String, required: true },
    type:        { type: String, required: true, enum: ['scenario', 'solution'] },
    resources: {
        ambiental: { type: Number, default: 0 },
        economico:  { type: Number, default: 0 },
        social:     { type: Number, default: 0 }
    }
}, { _id: false });

var TutorialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    rules: { type: String, required: true },
    cards: { type: [TutorialCardSchema], default: [] }
}, { collection: 'tutorial' });

const Tutorial = mongoose.model('Tutorial', TutorialSchema);

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

seed().catch(err => {
    console.error('Error en seed:', err.message);
    process.exit(1);
});
