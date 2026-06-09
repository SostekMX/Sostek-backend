const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

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
    expect(res.body.error).toBe('La contraseña debe tener al menos 6 caracteres');
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

  test('forgot-password con email valido retorna reset_token', async () => {
    const res = await request(app)
      .post('/user/forgot-password')
      .send({ email: 'test@ejemplo.com' });
    expect(res.body.success).toBe(true);
    expect(res.body.reset_token).toBeDefined();
    expect(res.body.reset_token.length).toBe(64);
  });

  test('forgot-password con email no registrado retorna error', async () => {
    const res = await request(app)
      .post('/user/forgot-password')
      .send({ email: 'noexiste@ejemplo.com' });
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Si el correo está registrado, recibirás instrucciones');
  });

  test('reset-password con token valido cambia la password', async () => {
    const forgotRes = await request(app)
      .post('/user/forgot-password')
      .send({ email: 'test@ejemplo.com' });
    const token = forgotRes.body.reset_token;

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
