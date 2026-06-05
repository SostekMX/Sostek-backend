require('dotenv').config();
const mongoose = require('mongoose');
const { parse: parseSync } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

const CSV_PATH = process.argv[2] || path.join(__dirname, '..', 'articles.csv');

const DB_URL = process.env.DB_URL ||
    ('mongodb://' + (process.env.DB_IP || '127.0.0.1') + ':' + (process.env.DB_PORT || '27017') + '/SostekDB');

var ArticleSchema = new mongoose.Schema({
    title:        { type: String, required: true },
    subtitle:     { type: String },
    type:         { type: String },
    body:         { type: String },
    image:        { type: String },
    author:       { type: String },
    author_image: { type: String },
    page_image:   { type: String },
    category:     { type: String },
    tags:         { type: [String], default: [] },
    bibliography: { type: String }
}, { collection: 'articles' });

const Article = mongoose.model('Article', ArticleSchema);

async function seed() {
    await mongoose.connect(DB_URL, { useNewUrlParser: true });
    console.log('Conectado a MongoDB');

    const csv = fs.readFileSync(CSV_PATH, 'utf-8');
    const rows = parseSync(csv, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
        trim: true
    });

    const articles = rows
        .filter(row => row.title && row.title.trim() !== '')
        .map(row => ({
            title:        row.title?.trim(),
            subtitle:     row.subtitle?.trim() || '',
            type:         row.type?.trim().toLowerCase() || 'article',
            body:         row.body?.trim() || '',
            image:        row.urlImage?.trim() || '',
            author:       row.author?.trim() || '',
            author_image: row.imgAuthor?.trim() || '',
            page_image:   row.imgPage?.trim() || '',
            tags:         row.keywords
                            ? row.keywords.split(',').map(k => k.trim()).filter(Boolean)
                            : [],
            bibliography: row.bibliography?.trim() || ''
        }));

    await Article.deleteMany({});
    console.log('Colección articles limpiada');

    const inserted = await Article.insertMany(articles);
    console.log(`${inserted.length} artículos insertados`);

    await mongoose.disconnect();
    console.log('Listo');
}

seed().catch(err => {
    console.error('Error en seed:', err.message);
    process.exit(1);
});
