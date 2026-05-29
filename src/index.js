"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const jsonWebToken = require("jsonwebtoken");
const bodyParser = require("body-parser");
const bcryptJs = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const dbSchema = require("./models/authModel");

const PORT = process.env.PORT || 8080;
const JWT_CODE = process.env.JWT_CODE;
const app = express();
var cors = require('cors');

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8100'],
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

const authLimiter = rateLimit({
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


app.post("/user/signup", authLimiter, [
    body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('name').notEmpty().trim().withMessage('El nombre es requerido'),
    body('surname').notEmpty().trim().withMessage('El apellido es requerido'),
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
    body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
], (req, res) => {
    if (!validate(req, res)) return;

    dbSchema.User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                res.json({ success: false, error: "Cuenta no registrada" });
            } else {
                if (!bcryptJs.compareSync(req.body.password, user.password)) {
                    res.json({ success: false, error: "Contraseña incorrecta" });
                } else {
                    const token = jsonWebToken.sign({ id: user._id, email: user.email }, JWT_CODE, { expiresIn: '7d' });
                    res.json({ success: true, token: token });
                }
            }
        })
        .catch((err) => {
            res.json({ success: false, error: err });
        });
});


app.post("/user/edit", verifyToken, [
    body('name').notEmpty().trim().withMessage('El nombre es requerido'),
    body('surname').notEmpty().trim().withMessage('El apellido es requerido'),
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
    dbSchema.User.findOne({ email: req.user.email }, { password: 0 })
        .then((user) => {
            if (!user) {
                res.json({ success: false, error: "Usuario no encontrado" });
                return;
            }
            res.json({ success: true, user: user });
        })
        .catch((err) => {
            res.json({ success: false, error: err });
        });
});


app.post("/user/score", verifyToken, [
    body('score_test').optional().isNumeric().withMessage('El puntaje del test debe ser un número'),
    body('score_game').optional().isNumeric().withMessage('El puntaje del juego debe ser un número'),
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


app.listen(PORT, () => {
    console.log("Backend running on port " + PORT);
});
