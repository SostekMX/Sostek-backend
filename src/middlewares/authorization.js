"use strict";
/*
Class which allow us to verify that the session token of a user is valid
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pems = {};
class AuthMiddleware {
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new AuthMiddleware();
        return this.instance;
    }
    verifyToken(req, res, next) {
        if (req.headers.authorization) {
            const token = req.headers.authorization.replace("Bearer ", "");
            const decodedJWT = jsonwebtoken_1.default.decode(token, { complete: true });
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
                jsonwebtoken_1.default.verify(token, pem, { algorithms: ["RS256"] }, function (err) {
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
            }
            else {
                return res.status(401).send({
                    code: "InvalidTokenException",
                    message: "The token is no valid 3",
                });
            }
        }
        else {
            res.status(401).send({
                code: "NoTokenFound",
                message: "The token is not present in the request",
            });
        }
    }
}
exports.default = AuthMiddleware;
