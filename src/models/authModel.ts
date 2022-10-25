const mongoose = require('mongoose');

const DB_URL = "mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb";

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
    type: String
  },

  // These are the non-required values
  birth_date: {
    type: Date,
    required: false
  },
  occupation: {
    type: String,
    required: false
  },
  score_test: {
    type: Number,
    required: false
  },
  score_game: {
    type: Number,
    required: false
  },
  gender: {
    type: String,
    required: false
  }
}, { collection: "users" });

exports.User = mongoose.model('User', UserSchema);