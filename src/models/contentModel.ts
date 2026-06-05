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

exports.Evaluation  = mongoose.model('Evaluation',  EvaluationSchema);
exports.Article     = mongoose.model('Article',     ArticleSchema);
exports.Presentation = mongoose.model('Presentation', PresentationSchema);
