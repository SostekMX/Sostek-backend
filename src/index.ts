import { Request, Response } from "express";

const express = require("express");
const jsonWebToken = require("jsonwebtoken");
const bodyParser = require("body-parser");
const bcryptJs = require("bcryptjs");

const dbSchema = require("./models/authModel")

const PORT = process.env.PORT || 8080;
const JWT_CODE = process.env.JWT_CODE || "tcjAU[xqQ]px9x&X(()KQhpAg=@P=cbJRJ7DZ$,:ZhW8gD#N@)r;S6TH$5u==nDaMjWd%:Jn.rS,QqkCyV*}v,UArB!_V7.+-mKZehZwCMbY/Dj69X.YKL$#byG7b.4%_tJjjG6=AeTLVinW2iGDuF*jeRX;a(S,/6]#*?3d:xT-/E2L6S$=j_,[6;(uy7cJz+]_9K5RTJd6re9e[@k@BxK,W#=ZRbT)/A2J,vfee2a%+Sc4!BW73Wdyn/r@na3?:FiL?D,nN%9Q7;H_H3!Fg.(i;bTJywEK-GXikn#(+U*}";

const app = express()
app.use(bodyParser.json())


app.post("/user/signup", (req: Request, res: Response) => {
  if(!req.body.email || !req.body.password || !req.body.name || !req.body.surname) {
    res.json({ success: false, error: "Required params missing" });
    return;
  }

  dbSchema.User.create({
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    password: bcryptJs.hashSync(req.body.password, 10)
  }).then((user: any) => {
    const token = jsonWebToken.sign({ id: user._id, email: user.email }, JWT_CODE);
    res.json({ success: true, token: token });
  }).catch((err: any) => {
    res.json({ success: false, error: err });
  });
});


app.post("/user/login", (req: Request, res: Response) => {
  if(!req.body.email || !req.body.password) {
    res.json({ success: false, error: "Required params missing" });
    return;
  }

  dbSchema.User.findOne({ email: req.body.email })
    .then((user: any) => {
      if(!user) {
        res.json({ success: false, error: "User doesn't exist" });
      } else {
        if(!bcryptJs.compareSync(req.body.password, user.password)) {
          res.json({ success: false, error: "Wrong password for given user" });
        } else {
          const token = jsonWebToken.sign({ id: user._id, email: user.email }, JWT_CODE);
          res.json({ success: true, token: token });
        }
      }
    })
    .catch((err: any) => {
      res.json({ success: false, error: err });
    });
});


app.listen(PORT, ()=> {
  console.log("Backend running on port " + PORT);
})