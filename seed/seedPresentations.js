require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const DB_URL = process.env.DB_URL ||
    ('mongodb://' + (process.env.DB_IP || '127.0.0.1') + ':' + (process.env.DB_PORT || '27017') + '/SostekDB');

var PresentationSchema = new mongoose.Schema({
    name:   { type: String, required: true },
    slides: { type: [String], default: [] }
}, { collection: 'presentations' });

const Presentation = mongoose.model('Presentation', PresentationSchema);

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function getImageFiles(folderPath) {
    return fs.readdirSync(folderPath)
        .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
        .sort()
        .map(f => path.join(folderPath, f));
}

async function uploadToCloudinary(localPath, presentationName) {
    const fileName = path.basename(localPath, path.extname(localPath));
    const folderSlug = presentationName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const result = await cloudinary.uploader.upload(localPath, {
        folder: `sostek/presentations/${folderSlug}`,
        public_id: fileName,
        overwrite: true
    });
    return result.secure_url;
}

async function seed() {
    // Espera: node seed/seedPresentations.js "Nombre Presentacion" "/ruta/a/carpeta"
    // Ejemplo: node seed/seedPresentations.js "Is Sustainable Innovation" "C:/Users/Lenovo/Downloads/slides1"
    const presName = process.argv[2];
    const folderPath = process.argv[3];

    if (!presName || !folderPath) {
        console.log('Uso: npm run seed:presentations "Nombre de la presentacion" "ruta/a/carpeta"');
        console.log('Ejemplo:');
        console.log('  npm run seed:presentations "Is Sustainable Innovation an Oxymoron" "C:/Users/Lenovo/Downloads/Is Sustainable Innovation"');
        process.exit(1);
    }

    if (!fs.existsSync(folderPath)) {
        console.error(`Error: no existe la carpeta "${folderPath}"`);
        process.exit(1);
    }

    const images = getImageFiles(folderPath);
    if (images.length === 0) {
        console.error('No se encontraron imágenes en esa carpeta');
        process.exit(1);
    }

    await mongoose.connect(DB_URL, { useNewUrlParser: true });
    console.log('Conectado a MongoDB');
    console.log(`\n📁 Presentación: ${presName}`);
    console.log(`   ${images.length} imágenes encontradas\n`);

    const slides = [];
    for (const imgPath of images) {
        const fileName = path.basename(imgPath);
        process.stdout.write(`   Subiendo ${fileName}... `);
        const url = await uploadToCloudinary(imgPath, presName);
        slides.push(url);
        console.log('✓');
    }

    await Presentation.deleteOne({ name: presName });
    await Presentation.create({ name: presName, slides });

    console.log(`\n✅ "${presName}" guardada en MongoDB con ${slides.length} slides`);
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
