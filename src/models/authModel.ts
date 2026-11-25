const mongoose = require('mongoose');

const DB_URL = process.env.DB_URL ||
  ("mongodb://" + (process.env.DB_IP || "127.0.0.1") + ":" + (process.env.DB_PORT || "27017") + "/SostekDB");

// Sin este catch, una base inalcanzable tumba el proceso con un stack trace que no dice que paso.
// El host se imprime sin usuario ni contrasena.
mongoose.connect(DB_URL, { useNewUrlParser: true }).catch((err: any) => {
  const host = DB_URL.replace(/^mongodb(\+srv)?:\/\/([^@/]*@)?/, '').split('/')[0];
  console.error(`[db] No se pudo conectar a MongoDB en ${host}: ${err.message}`);
  console.error('[db] Revisa DB_URL (o DB_IP y DB_PORT) en tu .env. Ver ONBOARDING_BACKEND.md.');
  process.exit(1);
});

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
  },
  favorites: [{
    content_id: { type: String, required: true },
    type: { type: String, enum: ['article', 'presentation'], required: true }
  }],
  avatar: {
    type: String,
    required: false,
    default: ''
  }
}, { collection: "users" });

exports.User = mongoose.model('User', UserSchema);

// Marca el archivo como modulo: sin esto, el `const mongoose` choca con el del otro modelo (TS2451).
export {};
