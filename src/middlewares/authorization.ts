/*
Class which allow us to verify that the session token of a user is valid
*/

import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";

const pems: { [key: string]: string } = {};
class AuthMiddleware {

  // Singleton
  private static instance: AuthMiddleware;
  public static getInstance(): AuthMiddleware {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new AuthMiddleware();
    return this.instance;
  }

  public verifyToken(req: Request, res: Response, next: NextFunction) {
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace("Bearer ", "");
      const decodedJWT: any = jwt.decode(token, { complete: true });
      if (!decodedJWT) {
        return res.status(401).send({
          code: "InvalidTokenException",
          message: "The token is no valid 1",
        });
      }
      const kid = decodedJWT.header.kid;
      if (kid !== undefined) {
        // console.log(pems);
        // console.log(kid)
        if (Object.keys(pems).includes(kid)) {
          console.log("Verificado");
          //return res.status(401).end();
        }
        const pem = pems[kid];
        jwt.verify(token, pem, { algorithms: ["RS256"] }, function (err: any) {
          if (err) {
            return res.status(401).send({
              code: "InvalidTokenException",
              message: "The token is no valid 2",
            });
          }
        });
        req.user = decodedJWT.payload.username;
        req.token = token;
        next();
      } else {
        return res.status(401).send({
          code: "InvalidTokenException",
          message: "The token is no valid 3",
        });
      }
    } else {
      res.status(401).send({
        code: "NoTokenFound",
        message: "The token is not present in the request",
      });
    }
  }

}

export default AuthMiddleware;
