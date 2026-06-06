import { Request, Response, NextFunction } from "express";

const express = require("express");
const jsonWebToken = require("jsonwebtoken");
const bodyParser = require("body-parser");
const bcryptJs = require("bcryptjs");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const dbSchema = require("./models/authModel");
const contentSchema = require("./models/contentModel");

const PORT = process.env.PORT || 8080;
const JWT_CODE = process.env.JWT_CODE;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8100'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { success: false, error: "Demasiados intentos, intenta más tarde" }
});

function verifyToken(req: any, res: Response, next: NextFunction) {
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

function validate(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json({ success: false, error: (errors.array()[0] as any).msg });
    return false;
  }
  return true;
}


app.post("/user/signup", authLimiter, [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('name').notEmpty().trim().withMessage('El nombre es requerido'),
  body('surname').notEmpty().trim().withMessage('El apellido es requerido'),
], (req: Request, res: Response) => {
  if (!validate(req, res)) return;

  dbSchema.User.create({
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    password: bcryptJs.hashSync(req.body.password, 10),
    birth_date: req.body.birth_date,
    occupation: req.body.occupation,
    gender: req.body.gender
  }).then((user: any) => {
    const token = jsonWebToken.sign({ id: user._id, email: user.email }, JWT_CODE, { expiresIn: '7d' });
    res.json({ success: true, token: token });
  }).catch((err: any) => {
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
], (req: Request, res: Response) => {
  if (!validate(req, res)) return;

  dbSchema.User.findOne({ email: req.body.email })
    .then((user: any) => {
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
    .catch((err: any) => {
      res.json({ success: false, error: err });
    });
});


app.post("/user/edit", verifyToken, [
  body('name').notEmpty().trim().withMessage('El nombre es requerido'),
  body('surname').notEmpty().trim().withMessage('El apellido es requerido'),
], (req: any, res: Response) => {
  if (!validate(req, res)) return;

  const update: any = { name: req.body.name, surname: req.body.surname };
  if (req.body.birth_date !== undefined) update.birth_date = req.body.birth_date;
  if (req.body.occupation !== undefined) update.occupation = req.body.occupation;
  if (req.body.gender !== undefined) update.gender = req.body.gender;

  dbSchema.User.findOneAndUpdate(
    { email: req.user.email },
    update,
    null,
    function (err: any, docs: any) {
      if (err) {
        res.json({ success: false, message: "No se pudo actualizar información del usuario" });
        return;
      }
      res.json({ success: true, message: "Usuario actualizado" });
    }
  );
});


app.get("/user/profile", verifyToken, (req: any, res: Response) => {
  dbSchema.User.findOne({ email: req.user.email }, { password: 0 })
    .then((user: any) => {
      if (!user) {
        res.json({ success: false, error: "Usuario no encontrado" });
        return;
      }
      res.json({ success: true, user: user });
    })
    .catch((err: any) => {
      res.json({ success: false, error: err });
    });
});


app.post("/user/score", verifyToken, [
  body('score_test').optional().isNumeric().withMessage('El puntaje del test debe ser un número'),
  body('score_game').optional().isNumeric().withMessage('El puntaje del juego debe ser un número'),
], (req: any, res: Response) => {
  if (!validate(req, res)) return;

  const update: any = {};
  if (req.body.score_test !== undefined) update.score_test = req.body.score_test;
  if (req.body.score_game !== undefined) update.score_game = req.body.score_game;

  if (Object.keys(update).length === 0) {
    res.json({ success: false, error: "Se requiere al menos score_test o score_game" });
    return;
  }

  dbSchema.User.findOneAndUpdate({ email: req.user.email }, update, null, function (err: any, docs: any) {
    if (err) {
      res.json({ success: false, error: "No se pudo actualizar el puntaje" });
      return;
    }
    res.json({ success: true, message: "Puntaje actualizado" });
  });
});


app.post("/user/forgot-password", authLimiter, [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
], (req: Request, res: Response) => {
  if (!validate(req, res)) return;

  dbSchema.User.findOne({ email: req.body.email })
    .then((user: any) => {
      if (!user) {
        res.json({ success: false, error: "Correo no registrado" });
        return;
      }
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000);

      dbSchema.User.findOneAndUpdate(
        { email: req.body.email },
        { reset_token: token, reset_token_expiry: expiry },
        null,
        function (err: any) {
          if (err) {
            res.json({ success: false, error: "Error al generar token" });
            return;
          }
          res.json({ success: true, reset_token: token });
        }
      );
    })
    .catch((err: any) => {
      res.json({ success: false, error: "Error interno" });
    });
});


app.post("/user/reset-password", [
  body('token').notEmpty().withMessage('El token es requerido'),
  body('new_password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
], (req: Request, res: Response) => {
  if (!validate(req, res)) return;

  dbSchema.User.findOne({ reset_token: req.body.token })
    .then((user: any) => {
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
        function (err: any) {
          if (err) {
            res.json({ success: false, error: "Error al actualizar contraseña" });
            return;
          }
          res.json({ success: true, message: "Contraseña actualizada" });
        }
      );
    })
    .catch((err: any) => {
      res.json({ success: false, error: "Error interno" });
    });
});


app.delete("/user", verifyToken, (req: any, res: Response) => {
  dbSchema.User.findOneAndDelete({ email: req.user.email })
    .then((user: any) => {
      if (!user) {
        res.json({ success: false, error: "Usuario no encontrado" });
        return;
      }
      res.json({ success: true, message: "Cuenta eliminada" });
    })
    .catch((err: any) => {
      res.json({ success: false, error: "No se pudo eliminar la cuenta" });
    });
});


app.get("/evaluations", (req: Request, res: Response) => {
  contentSchema.Evaluation.find({}, { questions: 0 })
    .then((evaluations: any) => {
      res.json({ success: true, evaluations });
    })
    .catch(() => {
      res.json({ success: false, error: "Error al obtener evaluaciones" });
    });
});


app.get("/evaluations/:id", (req: Request, res: Response) => {
  contentSchema.Evaluation.findById(req.params.id)
    .then((evaluation: any) => {
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


app.get("/articles", (req: Request, res: Response) => {
  contentSchema.Article.find({})
    .then((articles: any) => {
      res.json({ success: true, articles });
    })
    .catch(() => {
      res.json({ success: false, error: "Error al obtener artículos" });
    });
});


app.get("/articles/:id", (req: Request, res: Response) => {
  contentSchema.Article.findById(req.params.id)
    .then((article: any) => {
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


app.get("/presentations", (req: Request, res: Response) => {
  contentSchema.Presentation.find({})
    .then((presentations: any) => {
      res.json({ success: true, presentations });
    })
    .catch(() => {
      res.json({ success: false, error: "Error al obtener presentaciones" });
    });
});


app.post("/user/favorites", verifyToken, [
  body('content_id').notEmpty().withMessage('El ID del contenido es requerido'),
  body('type').isIn(['article', 'presentation']).withMessage('El tipo debe ser article o presentation'),
], (req: any, res: Response) => {
  if (!validate(req, res)) return;

  dbSchema.User.findOne({ email: req.user.email })
    .then((user: any) => {
      if (!user) {
        res.json({ success: false, error: "Usuario no encontrado" });
        return;
      }
      const alreadyFavorite = user.favorites.some((f: any) => f.content_id === req.body.content_id);
      if (alreadyFavorite) {
        res.json({ success: false, error: "Ya está en favoritos" });
        return;
      }
      dbSchema.User.findOneAndUpdate(
        { email: req.user.email },
        { $push: { favorites: { content_id: req.body.content_id, type: req.body.type } } },
        null,
        function (err: any) {
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


app.get("/user/favorites", verifyToken, (req: any, res: Response) => {
  dbSchema.User.findOne({ email: req.user.email }, { favorites: 1 })
    .then((user: any) => {
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


app.delete("/user/favorites/:content_id", verifyToken, (req: any, res: Response) => {
  dbSchema.User.findOneAndUpdate(
    { email: req.user.email },
    { $pull: { favorites: { content_id: req.params.content_id } } },
    null,
    function (err: any, user: any) {
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


app.listen(PORT, () => {
  console.log("Backend running on port " + PORT);
});
