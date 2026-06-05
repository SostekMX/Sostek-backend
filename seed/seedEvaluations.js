require('dotenv').config();
const mongoose = require('mongoose');
const { parse } = require('csv-parse/sync');
const https = require('https');
const http = require('http');

const EVALUATIONS = [
    { name: 'Arquitectura Nivel 1',      career: 'Arquitectura',      sheetId: '1o3VWhT42d8AHKbJ_wehOc7V2GItFWJNVqo-ljbp_e-8' },
    { name: 'Arquitectura Nivel 2',      career: 'Arquitectura',      sheetId: '1VW5-D4CtnQStfQDV3XDWzUBlPnaI-wxCjwcJvB5ydOo' },
    { name: 'Arquitectura Nivel 3',      career: 'Arquitectura',      sheetId: '1aRgPg0Oep9Q6trUiENZ7gqGhcaXW4yj0ZTHyLvutOH0' },
    { name: 'Diseño Industrial Nivel 1', career: 'Diseño Industrial', sheetId: '12qYVcr8N1CzcO8OUbggy5SfJFUO_4FYtgJsnL4Vykfg' },
    { name: 'Diseño Industrial Nivel 2', career: 'Diseño Industrial', sheetId: '11nsvxFvZG5LQZhQOtP1tmnnRmxoZ6c9NH8CSuvCbSBA' },
    { name: 'Diseño Industrial Nivel 3', career: 'Diseño Industrial', sheetId: '1cqb3MWTCUUGotsYTrd5V5qbnbp1FH7EygxlVO5g_TQE' },
];

const DB_URL = process.env.DB_URL ||
    ('mongodb://' + (process.env.DB_IP || '127.0.0.1') + ':' + (process.env.DB_PORT || '27017') + '/SostekDB');

var OptionSchema = new mongoose.Schema({
    text:  { type: String, required: true },
    value: { type: Number, required: true }
}, { _id: false });

var QuestionSchema = new mongoose.Schema({
    category: { type: String, required: true },
    text:     { type: String, required: true },
    options:  { type: [OptionSchema], default: [] }
}, { _id: false });

var EvaluationSchema = new mongoose.Schema({
    name:      { type: String, required: true },
    career:    { type: String, required: true, enum: ['Arquitectura', 'Diseño Industrial', 'Otros'] },
    questions: { type: [QuestionSchema], default: [] }
}, { collection: 'evaluations' });

const Evaluation = mongoose.model('Evaluation', EvaluationSchema);

function fetchText(url, maxRedirects) {
    if (maxRedirects === undefined) maxRedirects = 5;
    return new Promise(function (resolve, reject) {
        if (maxRedirects === 0) return reject(new Error('Too many redirects'));
        var lib = url.startsWith('https') ? https : http;
        lib.get(url, function (res) {
            if ([301, 302, 303, 307, 308].indexOf(res.statusCode) !== -1) {
                res.resume();
                return resolve(fetchText(res.headers.location, maxRedirects - 1));
            }
            if (res.statusCode !== 200) {
                return reject(new Error('HTTP ' + res.statusCode + ' para ' + url));
            }
            var data = '';
            res.on('data', function (chunk) { data += chunk; });
            res.on('end', function () { resolve(data); });
            res.on('error', reject);
        }).on('error', reject);
    });
}

function fetchSheet(sheetId, tabName) {
    var url = 'https://docs.google.com/spreadsheets/d/' + sheetId +
              '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tabName);
    return fetchText(url).then(function (csv) {
        return parse(csv, {
            relax_quotes: true,
            relax_column_count: true,
            skip_empty_lines: true,
            trim: true
        });
    });
}

function buildQuestions(preguntas, respuestas, puntos) {
    var questions = [];
    var n = Math.min(preguntas.length, respuestas.length, puntos.length);
    for (var i = 1; i < n; i++) {
        var category = (preguntas[i][0] || '').trim();
        var text = (preguntas[i][1] || '').trim();
        if (!category || !text) continue;

        var respRow = respuestas[i] || [];
        var puntosRow = puntos[i] || [];
        var maxCols = Math.min(respRow.length, puntosRow.length);
        var options = [];
        for (var j = 0; j < maxCols; j++) {
            var optText = (respRow[j] || '').trim();
            var optVal = (puntosRow[j] || '').trim();
            if (!optText || optVal === '') continue;
            options.push({ text: optText, value: Number(optVal) });
        }
        if (options.length > 0) {
            questions.push({ category: category, text: text, options: options });
        }
    }
    return questions;
}

async function seed() {
    await mongoose.connect(DB_URL, { useNewUrlParser: true });
    console.log('Conectado a MongoDB\n');

    for (var k = 0; k < EVALUATIONS.length; k++) {
        var ev = EVALUATIONS[k];
        process.stdout.write('Procesando "' + ev.name + '"... ');

        var preguntas  = await fetchSheet(ev.sheetId, 'Preguntas');
        var respuestas = await fetchSheet(ev.sheetId, 'Respuestas');
        var puntos     = await fetchSheet(ev.sheetId, 'Puntos');

        var questions = buildQuestions(preguntas, respuestas, puntos);
        await Evaluation.deleteOne({ name: ev.name });
        await Evaluation.create({ name: ev.name, career: ev.career, questions: questions });
        console.log(questions.length + ' preguntas');
    }

    console.log('\nListo');
    await mongoose.disconnect();
}

seed().catch(function (err) {
    console.error('Error:', err.message);
    process.exit(1);
});
