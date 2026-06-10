"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const jsonWebToken = require("jsonwebtoken");
const bodyParser = require("body-parser");
const bcryptJs = require("bcryptjs");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const fileType = require('file-type');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const dbSchema = require("./models/authModel");
const contentSchema = require("./models/contentModel");

const PORT = process.env.PORT || 8080;
const JWT_CODE = process.env.JWT_CODE;
const app = express();
var cors = require('cors');

app.use(helmet());
app.use(mongoSanitize());
const corsOrigins = ['http://localhost:3000', 'http://localhost:8100'];
if (process.env.CORS_ORIGIN) corsOrigins.push(process.env.CORS_ORIGIN);
app.use(cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

const authLimiter = process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        message: { success: false, error: "Demasiados intentos, intenta más tarde" }
    });

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.json({ success: false, error: "Token requerido" });
        return;
    }
    try {
        req.user = jsonWebToken.verify(token, JWT_CODE);
        next();
    } catch (err) {
        res.json({ success: false, error: "Token inválido o expirado" });
    }
}

function validate(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({ success: false, error: errors.array()[0].msg });
        return false;
    }
    return true;
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Formato no válido. Solo jpg, png o webp'));
    }
});

async function sendResetEmail(to, token) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('[email] EMAIL_USER o EMAIL_PASS no configurados — email no enviado');
        return;
    }
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/ResetPassword?token=${token}`;
    await transporter.sendMail({
        from: `"SOSTEK" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Recuperación de contraseña — SOSTEK',
        html: `
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en SOSTEK.</p>
      <p><a href="${resetUrl}">Restablecer contraseña</a></p>
      <p>O copiá este token directamente en la app:</p>
      <p><strong>${token}</strong></p>
      <p>Este enlace expira en <strong>1 hora</strong>.</p>
      <p>Si no solicitaste esto, podés ignorar este correo.</p>
    `
    });
}

function uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'sostek/avatars', resource_type: 'image' },
            (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(buffer);
    });
}


app.get("/health", (_req, res) => { res.json({ status: 'ok' }); });

app.post("/user/signup", authLimiter, [
    body('email').isEmail().withMessage('Correo inválido').normalizeEmail().isLength({ max: 100 }).withMessage('Correo demasiado largo'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres').isLength({ max: 128 }).withMessage('Contraseña demasiado larga'),
    body('name').notEmpty().trim().withMessage('El nombre es requerido').isLength({ max: 50 }).withMessage('El nombre es demasiado largo'),
    body('surname').notEmpty().trim().withMessage('El apellido es requerido').isLength({ max: 50 }).withMessage('El apellido es demasiado largo'),
    body('birth_date').optional({ nullable: true }).isString().trim().isLength({ max: 20 }).withMessage('Fecha de nacimiento inválida'),
    body('occupation').optional({ nullable: true }).isString().trim().isLength({ max: 100 }).withMessage('Ocupación demasiado larga'),
    body('gender').optional({ nullable: true }).isString().trim().isLength({ max: 20 }).withMessage('Género inválido'),
], (req, res) => {
    if (!validate(req, res)) return;

    dbSchema.User.create({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        password: bcryptJs.hashSync(req.body.password, 10),
        birth_date: req.body.birth_date,
        occupation: req.body.occupation,
        gender: req.body.gender
    }).then((user) => {
        const token = jsonWebToken.sign({ id: user._id, email: user.email }, JWT_CODE, { expiresIn: '7d' });
        res.json({ success: true, token: token });
    }).catch((err) => {
        let error_msg = "Error al crear cuenta";
        if (err.code == 11000) {
            error_msg = "Correo ingresado está ya registrado en la plataforma";
        }
        res.json({ success: false, error: error_msg });
    });
});


app.post("/user/login", authLimiter, [
    body('email').isEmail().withMessage('Correo inválido').normalizeEmail().isLength({ max: 100 }).withMessage('Correo demasiado largo'),
    body('password').notEmpty().withMessage('La contraseña es requerida').isLength({ max: 128 }).withMessage('Contraseña demasiado larga'),
], (req, res) => {
    if (!validate(req, res)) return;

    dbSchema.User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user || !bcryptJs.compareSync(req.body.password, user.password)) {
                res.json({ success: false, error: "Correo o contraseña incorrectos" });
                return;
            }
            const token = jsonWebToken.sign({ id: user._id, email: user.email }, JWT_CODE, { expiresIn: '7d' });
            res.json({ success: true, token: token });
        })
        .catch(() => {
            res.json({ success: false, error: "Error interno" });
        });
});


app.post("/user/edit", verifyToken, [
    body('name').notEmpty().trim().withMessage('El nombre es requerido').isLength({ max: 50 }).withMessage('El nombre es demasiado largo'),
    body('surname').notEmpty().trim().withMessage('El apellido es requerido').isLength({ max: 50 }).withMessage('El apellido es demasiado largo'),
    body('birth_date').optional({ nullable: true }).isString().trim().isLength({ max: 20 }).withMessage('Fecha de nacimiento inválida'),
    body('occupation').optional({ nullable: true }).isString().trim().isLength({ max: 100 }).withMessage('Ocupación demasiado larga'),
    body('gender').optional({ nullable: true }).isString().trim().isLength({ max: 20 }).withMessage('Género inválido'),
], (req, res) => {
    if (!validate(req, res)) return;

    const update = { name: req.body.name, surname: req.body.surname };
    if (req.body.birth_date !== undefined) update.birth_date = req.body.birth_date;
    if (req.body.occupation !== undefined) update.occupation = req.body.occupation;
    if (req.body.gender !== undefined) update.gender = req.body.gender;

    dbSchema.User.findOneAndUpdate({ email: req.user.email }, update, null, function (err, docs) {
        if (err) {
            res.json({ success: false, message: "No se pudo actualizar información del usuario" });
            return;
        }
        res.json({ success: true, message: "Usuario actualizado" });
    });
});


app.get("/user/profile", verifyToken, (req, res) => {
    dbSchema.User.findOne({ email: req.user.email }, { password: 0, reset_token: 0, reset_token_expiry: 0 })
        .then((user) => {
            if (!user) {
                res.json({ success: false, error: "Usuario no encontrado" });
                return;
            }
            res.json({ success: true, user: user });
        })
        .catch(() => {
            res.json({ success: false, error: "Error interno" });
        });
});


app.post("/user/score", verifyToken, [
    body('score_test').optional().isFloat({ min: 0 }).withMessage('El puntaje del test debe ser un número'),
    body('score_game').optional().isFloat({ min: 0 }).withMessage('El puntaje del juego debe ser un número'),
], (req, res) => {
    if (!validate(req, res)) return;

    const update = {};
    if (req.body.score_test !== undefined) update.score_test = req.body.score_test;
    if (req.body.score_game !== undefined) update.score_game = req.body.score_game;

    if (Object.keys(update).length === 0) {
        res.json({ success: false, error: "Se requiere al menos score_test o score_game" });
        return;
    }

    dbSchema.User.findOneAndUpdate({ email: req.user.email }, update, null, function (err, docs) {
        if (err) {
            res.json({ success: false, error: "No se pudo actualizar el puntaje" });
            return;
        }
        res.json({ success: true, message: "Puntaje actualizado" });
    });
});


app.post("/user/forgot-password", authLimiter, [
    body('email').isEmail().withMessage('Correo inválido').normalizeEmail().isLength({ max: 100 }).withMessage('Correo demasiado largo'),
], async (req, res) => {
    if (!validate(req, res)) return;

    const genericResponse = { success: true, message: "Si el correo está registrado, recibirás instrucciones en tu bandeja de entrada" };

    try {
        const user = await dbSchema.User.findOne({ email: req.body.email });
        if (!user) {
            res.json(genericResponse);
            return;
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await dbSchema.User.findOneAndUpdate(
            { email: req.body.email },
            { reset_token: token, reset_token_expiry: expiry }
        );
        await sendResetEmail(user.email, token);
        res.json(genericResponse);
    } catch {
        res.json({ success: false, error: "Error interno" });
    }
});


app.post("/user/reset-password", authLimiter, [
    body('token').notEmpty().isString().isLength({ max: 200 }).withMessage('El token es requerido'),
    body('new_password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres').isLength({ max: 128 }).withMessage('Contraseña demasiado larga'),
], (req, res) => {
    if (!validate(req, res)) return;

    dbSchema.User.findOne({ reset_token: req.body.token })
        .then((user) => {
            if (!user) {
                res.json({ success: false, error: "Token inválido" });
                return;
            }
            if (user.reset_token_expiry < new Date()) {
                res.json({ success: false, error: "Token expirado" });
                return;
            }
            const hashedPassword = bcryptJs.hashSync(req.body.new_password, 10);
            dbSchema.User.findOneAndUpdate(
                { reset_token: req.body.token },
                { password: hashedPassword, reset_token: null, reset_token_expiry: null },
                null,
                function (err) {
                    if (err) {
                        res.json({ success: false, error: "Error al actualizar contraseña" });
                        return;
                    }
                    res.json({ success: true, message: "Contraseña actualizada" });
                }
            );
        })
        .catch((err) => {
            res.json({ success: false, error: "Error interno" });
        });
});


app.delete("/user", verifyToken, (req, res) => {
    dbSchema.User.findOneAndDelete({ email: req.user.email })
        .then((user) => {
            if (!user) {
                res.json({ success: false, error: "Usuario no encontrado" });
                return;
            }
            res.json({ success: true, message: "Cuenta eliminada" });
        })
        .catch((err) => {
            res.json({ success: false, error: "No se pudo eliminar la cuenta" });
        });
});


app.get("/evaluations", (req, res) => {
    contentSchema.Evaluation.find({})
        .then((evaluations) => {
            const result = evaluations.map((evaluation) => {
                const obj = evaluation.toObject();
                obj.question_count = obj.questions.length;
                delete obj.questions;
                return obj;
            });
            res.json({ success: true, evaluations: result });
        })
        .catch(() => {
            res.json({ success: false, error: "Error al obtener evaluaciones" });
        });
});


app.get("/evaluations/:id", (req, res) => {
    contentSchema.Evaluation.findById(req.params.id)
        .then((evaluation) => {
            if (!evaluation) {
                res.json({ success: false, error: "Evaluación no encontrada" });
                return;
            }
            res.json({ success: true, evaluation });
        })
        .catch(() => {
            res.json({ success: false, error: "Error al obtener evaluación" });
        });
});


app.get("/articles", (req, res) => {
    contentSchema.Article.find({})
        .then((articles) => {
            res.json({ success: true, articles });
        })
        .catch(() => {
            res.json({ success: false, error: "Error al obtener artículos" });
        });
});


app.get("/articles/:id", (req, res) => {
    contentSchema.Article.findById(req.params.id)
        .then((article) => {
            if (!article) {
                res.json({ success: false, error: "Artículo no encontrado" });
                return;
            }
            res.json({ success: true, article });
        })
        .catch(() => {
            res.json({ success: false, error: "Error al obtener artículo" });
        });
});


app.get("/presentations", (req, res) => {
    contentSchema.Presentation.find({})
        .then((presentations) => {
            res.json({ success: true, presentations });
        })
        .catch(() => {
            res.json({ success: false, error: "Error al obtener presentaciones" });
        });
});


app.get("/tutorial", (req, res) => {
    contentSchema.Tutorial.findOne({})
        .then((tutorial) => {
            if (!tutorial) {
                res.json({ success: false, error: "Tutorial no encontrado" });
                return;
            }
            res.json({ success: true, tutorial });
        })
        .catch(() => {
            res.json({ success: false, error: "Error al obtener el tutorial" });
        });
});


app.post("/user/favorites", verifyToken, [
    body('content_id').notEmpty().isString().isLength({ max: 100 }).withMessage('El ID del contenido es requerido'),
    body('type').isIn(['article', 'presentation']).withMessage('El tipo debe ser article o presentation'),
], (req, res) => {
    if (!validate(req, res)) return;

    dbSchema.User.findOne({ email: req.user.email })
        .then((user) => {
            if (!user) {
                res.json({ success: false, error: "Usuario no encontrado" });
                return;
            }
            const alreadyFavorite = user.favorites.some((f) => f.content_id === req.body.content_id);
            if (alreadyFavorite) {
                res.json({ success: false, error: "Ya está en favoritos" });
                return;
            }
            dbSchema.User.findOneAndUpdate(
                { email: req.user.email },
                { $push: { favorites: { content_id: req.body.content_id, type: req.body.type } } },
                null,
                function (err) {
                    if (err) {
                        res.json({ success: false, error: "No se pudo agregar a favoritos" });
                        return;
                    }
                    res.json({ success: true, message: "Favorito agregado" });
                }
            );
        })
        .catch(() => {
            res.json({ success: false, error: "Error interno" });
        });
});


app.get("/user/favorites", verifyToken, (req, res) => {
    dbSchema.User.findOne({ email: req.user.email }, { favorites: 1 })
        .then((user) => {
            if (!user) {
                res.json({ success: false, error: "Usuario no encontrado" });
                return;
            }
            res.json({ success: true, favorites: user.favorites });
        })
        .catch(() => {
            res.json({ success: false, error: "Error interno" });
        });
});


app.delete("/user/favorites/:content_id", verifyToken, (req, res) => {
    dbSchema.User.findOneAndUpdate(
        { email: req.user.email },
        { $pull: { favorites: { content_id: req.params.content_id } } },
        null,
        function (err, user) {
            if (err) {
                res.json({ success: false, error: "No se pudo eliminar el favorito" });
                return;
            }
            if (!user) {
                res.json({ success: false, error: "Usuario no encontrado" });
                return;
            }
            res.json({ success: true, message: "Favorito eliminado" });
        }
    );
});


app.post("/user/avatar", verifyToken, (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') return res.json({ success: false, error: 'La imagen no debe superar 5MB' });
            return res.json({ success: false, error: err.message || 'Error al procesar imagen' });
        }
        next();
    });
}, async (req, res) => {
    if (!req.file) return res.json({ success: false, error: 'La imagen es requerida' });
    try {
        let detected;
        try { detected = await fileType.fromBuffer(req.file.buffer); } catch { detected = null; }
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!detected || !allowedMimes.includes(detected.mime)) {
            return res.json({ success: false, error: 'Formato no válido. Solo jpg, png o webp' });
        }
        const result = await uploadToCloudinary(req.file.buffer);
        await dbSchema.User.findOneAndUpdate({ email: req.user.email }, { avatar: result.secure_url });
        res.json({ success: true, avatar_url: result.secure_url });
    } catch (err) {
        res.json({ success: false, error: 'Error al subir imagen' });
    }
});


if (process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, () => {
        console.log("Backend running on port " + PORT);
    });

    const shutdown = () => server.close(() => process.exit(0));
    process.once('SIGUSR2', shutdown);  // nodemon restart
    process.on('SIGTERM', shutdown);    // kill
    process.on('SIGINT', shutdown);     // Ctrl+C
}

module.exports = app;
