import { Request, Response } from "express";

const express = require("express");
const jsonWebToken = require("jsonwebtoken");
const bodyParser = require("body-parser");
const bcryptJs = require("bcryptjs");

const dbSchema = require("./models/authModel")

const PORT = process.env.PORT || 8080;
const JWT_CODE = process.env.JWT_CODE || "afj2oj9fj2fkjlasdmmwwleqioeuxzvx";

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