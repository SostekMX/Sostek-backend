"use strict";
const mongoose = require('mongoose');

const DB_URL = process.env.DB_URL ||
    ("mongodb://" + (process.env.DB_IP || "127.0.0.1") + ":" + (process.env.DB_PORT || "27017") + "/SostekDB");

mongoose.connect(DB_URL, { useNewUrlParser: true });
// Schema that defines the user register to validate login and signin
var UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    surname: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: true
    },
    password: {
        type: String,
        trim: true,
        required: true
    },
    birth_date: {
        type: String,
        required: false
    },
    occupation: {
        type: String,
        required: false
    },
    score_test: {
        type: Number,
        required: false,
        default: 0
    },
    score_game: {
        type: Number,
        required: false,
        default: 0
    },
    gender: {
        type: String,
        required: false
    },
    reset_token: {
        type: String,
        required: false
    },
    reset_token_expiry: {
        type: Date,
        required: false
    },
    favorites: [{
        content_id: { type: String, required: true },
        type: { type: String, enum: ['article', 'presentation'], required: true }
    }]
}, { collection: "users" });
exports.User = mongoose.model('User', UserSchema);
