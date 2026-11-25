require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { Types } = require('mongoose');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Las presentaciones viven en seed/content/presentations.json; npm run seed:content las carga a la base.
const CONTENT_PATH = path.join(__dirname, 'content', 'presentations.json');

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

/* Agrega una presentacion a la lista, o le cambia las slides si ya existe una con ese nombre.
   Si ya existe conserva su _id (los favoritos apuntan a el) y su portada. */
function mergePresentation(list, name, slides) {
    return list.some(p => p.name === name)
        ? list.map(p => (p.name === name ? { ...p, slides } : p))
        : [...list, { _id: new Types.ObjectId().toString(), name, cover: '', slides }];
}

async function seed() {
    // Espera: npm run seed:presentations "Nombre de la presentacion" "ruta/a/carpeta"
    const presName = process.argv[2];
    const folderPath = process.argv[3];

    if (!presName || !folderPath) {
        console.log('Uso: npm run seed:presentations "Nombre de la presentacion" "ruta/a/carpeta"');
        console.log('Ejemplo:');
        console.log('  npm run seed:presentations "Is Sustainable Innovation an Oxymoron" "C:/Users/tu-usuario/Downloads/Is Sustainable Innovation"');
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

    const list = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
    fs.writeFileSync(CONTENT_PATH, JSON.stringify(mergePresentation(list, presName, slides), null, 2) + '\n');

    console.log(`\n✅ "${presName}" quedó en seed/content/presentations.json con ${slides.length} slides.`);
    console.log('   Si quieres portada, pon la URL de la imagen en su campo "cover".');
    console.log('   Para publicarla: npm run seed:content, y commitea el JSON.');
}

if (require.main === module) {
    seed().catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
}

module.exports = { mergePresentation };
