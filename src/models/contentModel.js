"use strict";
const mongoose = require('mongoose');
var OptionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    value: { type: Number, required: true }
}, { _id: false });
var QuestionSchema = new mongoose.Schema({
    category: { type: String, required: true },
    text: { type: String, required: true },
    options: { type: [OptionSchema], default: [] }
}, { _id: false });
var EvaluationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    career: { type: String, required: true, enum: ['Arquitectura', 'Diseño Industrial', 'Otros'] },
    description: { type: String, default: '' },
    questions: { type: [QuestionSchema], default: [] }
}, { collection: 'evaluations' });
var ArticleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String },
    type: { type: String },
    body: { type: String },
    image: { type: String },
    author: { type: String },
    author_image: { type: String },
    page_image: { type: String },
    category: { type: String },
    tags: { type: [String], default: [] },
    bibliography: { type: String }
}, { collection: 'articles' });
var PresentationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    cover: { type: String, default: '' },
    slides: { type: [String], default: [] }
}, { collection: 'presentations' });
var TutorialCardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: ['scenario', 'solution'] },
    resources: {
        ambiental: { type: Number, default: 0 },
        economico: { type: Number, default: 0 },
        social: { type: Number, default: 0 }
    }
}, { _id: false });
var TutorialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    rules: { type: String, required: true },
    cards: { type: [TutorialCardSchema], default: [] }
}, { collection: 'tutorial' });
// Quiz por nivel y tipo de proyecto. score va de 0 (nula) a 3 (optima); feedback explica la opcion.
var QuizOptionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 3 },
    feedback: { type: String, default: '' }
}, { _id: false });
var QuizQuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: { type: [QuizOptionSchema], default: [] }
}, { _id: false });
var QuizBlockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    questions: { type: [QuizQuestionSchema], default: [] }
}, { _id: false });
var QuizSchema = new mongoose.Schema({
    level: { type: Number, required: true },
    type: { type: Number, required: true },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    focus: { type: String, default: '' },
    feedbackDraft: { type: Boolean, default: false },
    blocks: { type: [QuizBlockSchema], default: [] }
}, { collection: 'quizzes' });
QuizSchema.index({ level: 1, type: 1 }, { unique: true });
exports.Evaluation = mongoose.model('Evaluation', EvaluationSchema);
exports.Article = mongoose.model('Article', ArticleSchema);
exports.Presentation = mongoose.model('Presentation', PresentationSchema);
exports.Tutorial = mongoose.model('Tutorial', TutorialSchema);
exports.Quiz = mongoose.model('Quiz', QuizSchema);
