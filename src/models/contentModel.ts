const mongoose = require('mongoose');

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

var PresentationSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  slides: { type: [String], default: [] }
}, { collection: 'presentations' });

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

exports.Evaluation  = mongoose.model('Evaluation',  EvaluationSchema);
exports.Article     = mongoose.model('Article',     ArticleSchema);
exports.Presentation = mongoose.model('Presentation', PresentationSchema);
exports.Tutorial    = mongoose.model('Tutorial',    TutorialSchema);
