const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  }))
}));

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, callback) => {
        const fakeStream = { end: jest.fn() };
        process.nextTick(() => callback(null, { secure_url: 'https://res.cloudinary.com/test/sostek/avatars/test.jpg' }));
        return fakeStream;
      })
    }
  }
}));

let app;
let mongod;
let mongoose;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.DB_URL = mongod.getUri();
  process.env.JWT_CODE = 'test_jwt_secret_sostek';
  process.env.NODE_ENV = 'test';

  jest.resetModules();
  app = require('../src/index.js');
  mongoose = require('mongoose');

  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) return resolve();
    mongoose.connection.once('open', resolve);
    setTimeout(resolve, 5000);
  });
}, 60000);

afterAll(async () => {
  if (mongoose) await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  if (mongoose?.connection?.db) {
    const collections = await mongoose.connection.db.collections();
    for (const col of collections) {
      await col.deleteMany({});
    }
  }
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function crearUsuario(overrides = {}) {
  const datos = {
    email: 'test@ejemplo.com',
    password: 'password123',
    name: 'Test',
    surname: 'Usuario',
    ...overrides,
  };
  const res = await request(app).post('/user/signup').send(datos);
  return res;
}

async function obtenerToken(email = 'test@ejemplo.com', password = 'password123') {
  const res = await request(app).post('/user/login').send({ email, password });
  return res.body.token;
}

// ─── Signup ────────────────────────────────────────────────────────────────────

describe('POST /user/signup', () => {
  test('registro valido retorna token', async () => {
    const res = await crearUsuario();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('email invalido retorna error', async () => {
    const res = await crearUsuario({ email: 'no-es-un-email' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Correo inválido');
  });

  test('password corta retorna error', async () => {
    const res = await crearUsuario({ password: '123' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('La contraseña debe tener al menos 8 caracteres');
  });

  test('nombre vacio retorna error', async () => {
    const res = await crearUsuario({ name: '' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('El nombre es requerido');
  });

  test('apellido vacio retorna error', async () => {
    const res = await crearUsuario({ surname: '' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('El apellido es requerido');
  });

  test('email duplicado retorna error', async () => {
    await crearUsuario();
    const res = await crearUsuario();
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Correo ingresado está ya registrado en la plataforma');
  });

  test('nombre demasiado largo retorna error', async () => {
    const res = await crearUsuario({ name: 'A'.repeat(51) });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('El nombre es demasiado largo');
  });
});

// ─── Login ─────────────────────────────────────────────────────────────────────

describe('POST /user/login', () => {
  beforeEach(async () => {
    await crearUsuario();
  });

  test('login valido retorna token', async () => {
    const res = await request(app)
      .post('/user/login')
      .send({ email: 'test@ejemplo.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('password incorrecta retorna error', async () => {
    const res = await request(app)
      .post('/user/login')
      .send({ email: 'test@ejemplo.com', password: 'wrongpassword' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Correo o contraseña incorrectos');
  });

  test('email no registrado retorna error', async () => {
    const res = await request(app)
      .post('/user/login')
      .send({ email: 'noexiste@ejemplo.com', password: 'password123' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Correo o contraseña incorrectos');
  });

  test('email invalido retorna error', async () => {
    const res = await request(app)
      .post('/user/login')
      .send({ email: 'no-es-email', password: 'password123' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Correo inválido');
  });
});

// ─── Token / rutas protegidas ───────────────────────────────────────────────────

describe('Autenticacion JWT', () => {
  test('ruta protegida sin token retorna error', async () => {
    const res = await request(app).get('/user/profile');
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Token requerido');
  });

  test('ruta protegida con token invalido retorna error', async () => {
    const res = await request(app)
      .get('/user/profile')
      .set('Authorization', 'Bearer token_inventado');
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Token inválido o expirado');
  });

  test('ruta protegida con token valido retorna datos', async () => {
    await crearUsuario();
    const token = await obtenerToken();
    const res = await request(app)
      .get('/user/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('test@ejemplo.com');
    expect(res.body.user.password).toBeUndefined();
  });
});

// ─── Score ─────────────────────────────────────────────────────────────────────

describe('POST /user/score', () => {
  let token;

  beforeEach(async () => {
    await crearUsuario();
    token = await obtenerToken();
  });

  test('actualiza score_test correctamente', async () => {
    const res = await request(app)
      .post('/user/score')
      .set('Authorization', `Bearer ${token}`)
      .send({ score_test: 85 });
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Puntaje actualizado');
  });

  test('actualiza score_game correctamente', async () => {
    const res = await request(app)
      .post('/user/score')
      .set('Authorization', `Bearer ${token}`)
      .send({ score_game: 60 });
    expect(res.body.success).toBe(true);
  });

  test('actualiza ambos scores a la vez', async () => {
    const res = await request(app)
      .post('/user/score')
      .set('Authorization', `Bearer ${token}`)
      .send({ score_test: 90, score_game: 45 });
    expect(res.body.success).toBe(true);
  });

  test('sin campos de score retorna error', async () => {
    const res = await request(app)
      .post('/user/score')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Se requiere al menos score_test o score_game');
  });

  test('score negativo retorna error', async () => {
    const res = await request(app)
      .post('/user/score')
      .set('Authorization', `Bearer ${token}`)
      .send({ score_test: -10 });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('El puntaje del test debe ser un número');
  });
});

// ─── Recuperacion de password ───────────────────────────────────────────────────

describe('POST /user/forgot-password y reset-password', () => {
  beforeEach(async () => {
    await crearUsuario();
  });

  test('forgot-password con email valido envia email y retorna mensaje generico', async () => {
    const res = await request(app)
      .post('/user/forgot-password')
      .send({ email: 'test@ejemplo.com' });
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeDefined();
    const { User } = require('../src/models/authModel');
    const user = await User.findOne({ email: 'test@ejemplo.com' });
    expect(user.reset_token).toBeDefined();
    expect(user.reset_token.length).toBe(64);
  });

  test('forgot-password manda el correo en el idioma pedido', async () => {
    process.env.EMAIL_USER = 'sostek@ejemplo.com';
    process.env.EMAIL_PASS = 'clave';
    const { createTransport } = require('nodemailer');
    const asuntoCon = async (extra) => {
      await request(app).post('/user/forgot-password').send({ email: 'test@ejemplo.com', ...extra });
      return createTransport.mock.results.at(-1).value.sendMail.mock.calls[0][0].subject;
    };
    try {
      expect(await asuntoCon({ lang: 'en' })).toBe('Password recovery — SOSTEK');
      expect(await asuntoCon({})).toBe('Recuperación de contraseña — SOSTEK');
      expect(await asuntoCon({ lang: 'fr' })).toBe('Recuperación de contraseña — SOSTEK');
    } finally {
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;
    }
  });

  test('forgot-password con email no registrado retorna el mismo mensaje generico', async () => {
    const res = await request(app)
      .post('/user/forgot-password')
      .send({ email: 'noexiste@ejemplo.com' });
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeDefined();
  });

  test('reset-password con token valido cambia la password', async () => {
    await request(app)
      .post('/user/forgot-password')
      .send({ email: 'test@ejemplo.com' });
    const { User } = require('../src/models/authModel');
    const user = await User.findOne({ email: 'test@ejemplo.com' });
    const token = user.reset_token;

    const resetRes = await request(app)
      .post('/user/reset-password')
      .send({ token, new_password: 'nuevapassword123' });
    expect(resetRes.body.success).toBe(true);
    expect(resetRes.body.message).toBe('Contraseña actualizada');

    // Verificar que se puede hacer login con la nueva password
    const loginRes = await request(app)
      .post('/user/login')
      .send({ email: 'test@ejemplo.com', password: 'nuevapassword123' });
    expect(loginRes.body.success).toBe(true);
  });

  test('reset-password con token invalido retorna error', async () => {
    const res = await request(app)
      .post('/user/reset-password')
      .send({ token: 'token_falso_123', new_password: 'nuevapassword123' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Token inválido');
  });
});

// ─── Favoritos ─────────────────────────────────────────────────────────────────

describe('Favoritos', () => {
  let token;

  beforeEach(async () => {
    await crearUsuario();
    token = await obtenerToken();
  });

  test('agrega favorito correctamente', async () => {
    const res = await request(app)
      .post('/user/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ content_id: '664abc123', type: 'article' });
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Favorito agregado');
  });

  test('rechaza tipo invalido', async () => {
    const res = await request(app)
      .post('/user/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ content_id: '664abc123', type: 'video' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('El tipo debe ser article o presentation');
  });

  test('rechaza duplicado', async () => {
    await request(app)
      .post('/user/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ content_id: '664abc123', type: 'article' });
    const res = await request(app)
      .post('/user/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ content_id: '664abc123', type: 'article' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Ya está en favoritos');
  });

  test('obtiene lista de favoritos', async () => {
    await request(app)
      .post('/user/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ content_id: '664abc123', type: 'article' });
    const res = await request(app)
      .get('/user/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(true);
    expect(res.body.favorites).toHaveLength(1);
    expect(res.body.favorites[0].content_id).toBe('664abc123');
  });

  test('elimina favorito correctamente', async () => {
    await request(app)
      .post('/user/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ content_id: '664abc123', type: 'article' });
    const res = await request(app)
      .delete('/user/favorites/664abc123')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Favorito eliminado');
  });
});

// ─── Avatar ─────────────────────────────────────────────────────────────────────

describe('POST /user/avatar', () => {
  let token;

  beforeEach(async () => {
    await crearUsuario();
    token = await obtenerToken();
  });

  test('sube imagen y retorna avatar_url', async () => {
    const fakeImage = Buffer.from([0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0xFF,0xD9]);
    const res = await request(app)
      .post('/user/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', fakeImage, { filename: 'foto.jpg', contentType: 'image/jpeg' });
    expect(res.body.success).toBe(true);
    expect(res.body.avatar_url).toBe('https://res.cloudinary.com/test/sostek/avatars/test.jpg');
  });

  test('sin archivo retorna error', async () => {
    const res = await request(app)
      .post('/user/avatar')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('La imagen es requerida');
  });

  test('formato no permitido retorna error', async () => {
    const fakeFile = Buffer.from('fake-gif-data');
    const res = await request(app)
      .post('/user/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', fakeFile, { filename: 'foto.gif', contentType: 'image/gif' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Formato no válido. Solo jpg, png o webp');
  });

  test('sin token retorna error', async () => {
    const fakeImage = Buffer.from('fake-image-data');
    const res = await request(app)
      .post('/user/avatar')
      .attach('avatar', fakeImage, { filename: 'foto.jpg', contentType: 'image/jpeg' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Token requerido');
  });

  test('avatar queda guardado en el perfil del usuario', async () => {
    const fakeImage = Buffer.from([0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0xFF,0xD9]);
    await request(app)
      .post('/user/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', fakeImage, { filename: 'foto.jpg', contentType: 'image/jpeg' });
    const profileRes = await request(app)
      .get('/user/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profileRes.body.user.avatar).toBe('https://res.cloudinary.com/test/sostek/avatars/test.jpg');
  });
});

// ─── Quiz ──────────────────────────────────────────────────────────────────────

describe('Quiz', () => {
  const quizData = require('../seed/quiz_data.json');
  const ESTRATEGICAS = [6, 7, 8, 14, 15, 16, 22, 23];
  const ESCALAS = { 4: [0, 1.33, 2.67, 4], 5: [0, 1.67, 3.33, 5] };
  const preguntas = quiz => quiz.blocks.flatMap(b => b.questions);
  // Puntos de una opcion con 2 decimales, como los escribe el PDF de Carlos.
  const puntos = (opcion, pregunta) => Math.round((opcion.score * pregunta.weight / 3) * 100) / 100;
  // El tramo de un total: el de mayor min que no lo rebasa.
  const tramo = total => [...quizData.tiers].sort((a, b) => b.min - a.min).find(t => total >= t.min).title;

  // Se piden dentro de cada test para usar el mismo mongoose que la app (beforeAll hace resetModules).
  const modelos = () => require('../src/models/contentModel');
  const sembrar = () => require('../seed/seedQuiz').upsertQuizzes(quizData);

  describe('datos de quiz_data.json (fuente: el PDF de Carlos)', () => {
    test('hay 6 tests: niveles 1 a 3, cada uno con Modelo de Negocio y Empresa Rentable', () => {
      expect(quizData.quizzes.map(q => [q.level, q.type, q.title])).toEqual([
        [1, 1, 'Modelo de Negocio'], [1, 2, 'Empresa Rentable'],
        [2, 1, 'Modelo de Negocio'], [2, 2, 'Empresa Rentable'],
        [3, 1, 'Modelo de Negocio'], [3, 2, 'Empresa Rentable'],
      ]);
    });

    test('cada test tiene 23 preguntas en 3 bloques y cada pregunta exactamente 4 opciones', () => {
      for (const quiz of quizData.quizzes) {
        expect(quiz.blocks.map(b => b.questions.length)).toEqual([8, 8, 7]);
        preguntas(quiz).forEach(p => expect(p.options).toHaveLength(4));
      }
    });

    test('cada pregunta usa una escala completa sin repetir valores', () => {
      for (const quiz of quizData.quizzes) {
        for (const p of preguntas(quiz)) {
          expect([4, 5]).toContain(p.weight);
          expect(p.options.map(o => o.score).sort()).toEqual([0, 1, 2, 3]);
          expect(p.options.map(o => puntos(o, p)).sort((a, b) => a - b)).toEqual(ESCALAS[p.weight]);
        }
      }
    });

    test('las preguntas estrategicas son exactamente la 6, 7, 8, 14, 15, 16, 22 y 23', () => {
      for (const quiz of quizData.quizzes) {
        const deCinco = preguntas(quiz).map((p, i) => (p.weight === 5 ? i + 1 : null)).filter(Boolean);
        expect(deCinco).toEqual(ESTRATEGICAS);
      }
    });

    test('cada test va de 0 a 100 puntos exactos, sumados en tercios', () => {
      for (const quiz of quizData.quizzes) {
        const maxTercios = preguntas(quiz).reduce((s, p) => s + Math.max(...p.options.map(o => o.score)) * p.weight, 0);
        const minTercios = preguntas(quiz).reduce((s, p) => s + Math.min(...p.options.map(o => o.score)) * p.weight, 0);
        expect(maxTercios).toBe(300);
        expect(maxTercios / 3).toBe(100);
        expect(minTercios).toBe(0);
      }
    });

    test('los tramos de retroalimentacion cubren de 0 a 100 y respetan sus limites', () => {
      expect(quizData.tiers.map(t => [t.min, t.title])).toEqual([
        [0, 'Nivel Base-Inicial'], [20, 'Nivel Inicial'], [40, 'Desarrollo Intermedio'],
        [60, 'Desarrollo Intermedio-avanzado'], [80, 'Nivel Avanzado'],
      ]);
      quizData.tiers.forEach(t => expect(t.text.trim()).not.toBe(''));
      expect(tramo(0)).toBe('Nivel Base-Inicial');
      expect(tramo(19.99)).toBe('Nivel Base-Inicial');
      expect(tramo(20)).toBe('Nivel Inicial');
      expect(tramo(179 / 3)).toBe('Desarrollo Intermedio');
      expect(tramo(80)).toBe('Nivel Avanzado');
      expect(tramo(100)).toBe('Nivel Avanzado');
    });
  });

  describe('GET /quiz y seed:quiz', () => {
    test('GET /quiz devuelve los 6 tests ordenados, con pesos y tramos', async () => {
      await sembrar();
      const res = await request(app).get('/quiz');
      expect(res.body.success).toBe(true);
      expect(res.body.quizzes.map(q => [q.level, q.type])).toEqual([[1, 1], [1, 2], [2, 1], [2, 2], [3, 1], [3, 2]]);
      res.body.quizzes.forEach((quiz, i) => {
        expect(quiz.blocks).toEqual(quizData.quizzes[i].blocks);
        expect(quiz.tiers).toEqual(quizData.tiers);
        expect(quiz.feedbackDraft).toBeUndefined();
      });
    });

    test('GET /quiz?level=1 devuelve los dos tipos del nivel 1', async () => {
      await sembrar();
      const res = await request(app).get('/quiz?level=1');
      expect(res.body.quizzes.map(q => [q.level, q.type, q.title])).toEqual([[1, 1, 'Modelo de Negocio'], [1, 2, 'Empresa Rentable']]);
    });

    test('nivel sin contenido retorna lista vacia', async () => {
      await sembrar();
      const res = await request(app).get('/quiz?level=4');
      expect(res.body).toEqual({ success: true, quizzes: [] });
    });

    test('nivel invalido retorna error', async () => {
      const res = await request(app).get('/quiz?level=abc');
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Nivel inválido');
    });

    test('el seed es idempotente, conserva los _id y no toca otros documentos', async () => {
      const { Quiz, Evaluation } = modelos();
      // Un quiz con la forma vieja, como el que hay hoy en produccion
      const viejo = await Quiz.collection.insertOne({ level: 3, type: 1, title: 'viejo', feedbackDraft: true, blocks: [] });
      await Quiz.create({ level: 9, type: 1, title: 'Otro' });
      await Evaluation.create({ name: 'Arquitectura Nivel 1', career: 'Arquitectura' });

      await sembrar();
      const ids = async () => (await Quiz.find({ level: { $lte: 3 } }).sort({ level: 1, type: 1 }).lean()).map(q => String(q._id));
      const primera = await ids();
      await sembrar();
      expect(await ids()).toEqual(primera);
      expect(primera).toHaveLength(6);

      const reemplazado = await Quiz.collection.findOne({ level: 3, type: 1 });
      expect(String(reemplazado._id)).toBe(String(viejo.insertedId));
      expect(reemplazado.title).toBe('Modelo de Negocio');
      expect(reemplazado.feedbackDraft).toBeUndefined();
      expect(await Quiz.countDocuments({ level: 9 })).toBe(1);
      expect(await Evaluation.countDocuments()).toBe(1);
    });

    test('el seed reemplaza un quiz que cambio en la base', async () => {
      const { Quiz } = modelos();
      await sembrar();
      await Quiz.updateOne({ level: 3, type: 1 }, { title: 'Alterado', blocks: [], tiers: [] });
      await sembrar();
      const quiz = await Quiz.findOne({ level: 3, type: 1 }).lean();
      expect(quiz.title).toBe(quizData.quizzes[4].title);
      expect(quiz.blocks).toEqual(quizData.quizzes[4].blocks);
      expect(quiz.tiers).toEqual(quizData.tiers);
    });
  });
});

// ─── Contenido versionado (seed:content) ───────────────────────────────────────

describe('Contenido versionado (seed:content)', () => {
  const contenido = archivo => require(`../seed/content/${archivo}`);
  const modelos = () => require('../src/models/contentModel');
  const sembrar = () => require('../seed/seedContent').upsertContent();

  test('carga el snapshot conservando los _id y es idempotente', async () => {
    const { Article, Presentation, Evaluation } = modelos();
    await sembrar();
    await sembrar();
    expect(await Article.countDocuments()).toBe(contenido('articles.json').length);
    expect(await Presentation.countDocuments()).toBe(contenido('presentations.json').length);
    expect(await Evaluation.countDocuments()).toBe(contenido('evaluations.json').length);
    const primero = contenido('articles.json')[0];
    const guardado = await Article.collection.findOne({ _id: new (require('mongoose').Types.ObjectId)(primero._id) });
    expect(guardado.title).toBe(primero.title);
  });

  test('no borra documentos que no estan en el snapshot', async () => {
    const { Article } = modelos();
    await Article.create({ title: 'Solo en la base' });
    await sembrar();
    expect(await Article.countDocuments({ title: 'Solo en la base' })).toBe(1);
  });

  test('las rutas de detalle responden con los _id del snapshot', async () => {
    await sembrar();
    const articulo = contenido('articles.json')[0];
    const evaluacion = contenido('evaluations.json')[0];
    expect((await request(app).get('/articles/' + articulo._id)).body.article.title).toBe(articulo.title);
    expect((await request(app).get('/evaluations/' + evaluacion._id)).body.evaluation.name).toBe(evaluacion.name);
  });

  test('todos los campos del snapshot existen en los esquemas (si no, Mongoose los tiraria)', () => {
    const { Article, Presentation, Evaluation } = modelos();
    const pregunta = Evaluation.schema.path('questions').schema;
    for (const [archivo, Model] of [['articles.json', Article], ['presentations.json', Presentation], ['evaluations.json', Evaluation]]) {
      for (const doc of contenido(archivo)) {
        Object.keys(doc).forEach(campo => expect([archivo, campo, Boolean(Model.schema.path(campo))]).toEqual([archivo, campo, true]));
      }
    }
    for (const p of contenido('evaluations.json').flatMap(e => e.questions)) {
      Object.keys(p).forEach(campo => expect([campo, Boolean(pregunta.path(campo))]).toEqual([campo, true]));
      p.options.forEach(o => expect(Object.keys(o).sort()).toEqual(['text', 'value']));
    }
  });

  test('seed:presentations conserva el _id y la portada al actualizar una presentacion', () => {
    const { mergePresentation } = require('../seed/seedPresentations');
    const lista = [{ _id: 'a1', name: 'X', cover: 'portada.jpg', slides: ['1'] }];
    expect(mergePresentation(lista, 'X', ['2', '3'])).toEqual([{ _id: 'a1', name: 'X', cover: 'portada.jpg', slides: ['2', '3'] }]);
    const conNueva = mergePresentation(lista, 'Y', ['9']);
    expect(conNueva[0]).toBe(lista[0]);
    expect(conNueva[1]).toMatchObject({ name: 'Y', cover: '', slides: ['9'] });
    expect(conNueva[1]._id).toMatch(/^[0-9a-f]{24}$/);
  });

  test('las categorias son las que usa el frontend para recomendar articulos', () => {
    const deArticulos = new Set(contenido('articles.json').map(a => a.category));
    const dePreguntas = new Set(contenido('evaluations.json').flatMap(e => e.questions.map(q => q.category)));
    expect([...deArticulos].sort()).toEqual(['Ambiental', 'Económico', 'Social']);
    expect([...dePreguntas].sort()).toEqual(['Ambiental', 'Económico y Social']);
  });
});
