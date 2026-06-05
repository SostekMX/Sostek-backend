const mongoose = require('mongoose');

const DB_IP = process.env.DB_IP || "127.0.0.1";
const DB_PORT = process.env.DB_PORT || "27017";
const DB_URL = "mongodb://" + DB_IP + ":" + DB_PORT +"/SostekDB";

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

  // These are the non-required values
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
  }
}, { collection: "users" });

exports.User = mongoose.model('User', UserSchema);