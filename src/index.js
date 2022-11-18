"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const jsonWebToken = require("jsonwebtoken");
const bodyParser = require("body-parser");
const bcryptJs = require("bcryptjs");
const dbSchema = require("./models/authModel");
const PORT = process.env.PORT || 8080;
const JWT_CODE = process.env.JWT_CODE || "tcjAU[xqQ]px9x&X(()KQhpAg=@P=cbJRJ7DZ$,:ZhW8gD#N@)r;S6TH$5u==nDaMjWd%:Jn.rS,QqkCyV*}v,UArB!_V7.+-mKZehZwCMbY/Dj69X.YKL$#byG7b.4%_tJjjG6=AeTLVinW2iGDuF*jeRX;a(S,/6]#*?3d:xT-/E2L6S$=j_,[6;(uy7cJz+]_9K5RTJd6re9e[@k@BxK,W#=ZRbT)/A2J,vfee2a%+Sc4!BW73Wdyn/r@na3?:FiL?D,nN%9Q7;H_H3!Fg.(i;bTJywEK-GXikn#(+U*}";
const app = express();
var cors = require('cors');

// use it before all route definitions
app.use(cors({origin: 'http://localhost:3000'})); //! Necesario para probar en local **

app.use(bodyParser.json());
app.post("/user/signup", (req, res) => {
    if (!req.body.email || !req.body.password || !req.body.name || !req.body.surname) {
        res.json({ success: false, error: "Faltan campos por completar" });
        return;
    }
    console.log(req.body)
    dbSchema.User.create({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        password: bcryptJs.hashSync(req.body.password, 10),
        birth_date: req.body.birth_date,
        occupation: req.body.occupation,
        gender: req.body.gender
    }).then((user) => {
        const token = jsonWebToken.sign({ id: user._id, email: user.email }, JWT_CODE);
        res.json({ success: true, token: token });
    }).catch((err) => {
        let error_msg = "Error al crear cuenta";
        if(err.code == 11000){
            error_msg = "Correo ingresado está ya registrado en la plataforma";
        }
        res.json({ success: false, error: error_msgz });
    });
});
app.post("/user/edit", (req, res) => {
    if (!req.body.email || !req.body.name || !req.body.surname) {
        res.json({ success: false, error: "Falta correo" });
        return;
    }

    dbSchema.User.findOneAndUpdate({email: req.body.email } , 
        {name: req.body.name, surname: req.body.surname }, null, function (err, docs) {
        if (err){
            res.json({ success: false, message: "No se pudo actualizar información del usuario" });
            return;
        }
        else{
            res.json({ success: true, message: "Usuario actualizado" });
            return;
        }
    });
});
app.post("/user/login", (req, res) => {
    if (!req.body.email || !req.body.password) {
        res.json({ success: false, error: "Correo y/o contraseña incorrectos" });
        return;
    }
    dbSchema.User.findOne({ email: req.body.email })
        .then((user) => {
        if (!user) {
            res.json({ success: false, error: "Cuenta no registrada" });
        }
        else {
            if (!bcryptJs.compareSync(req.body.password, user.password)) {
                res.json({ success: false, error: "Contraseña incorrecta" });
            }
            else {
                const token = jsonWebToken.sign({ id: user._id, email: user.email }, JWT_CODE);
                res.json({ success: true, token: token });
            }
        }
    })
        .catch((err) => {
        res.json({ success: false, error: err });
    });
});
app.listen(PORT, () => {
    console.log("Backend running on port " + PORT);
});
