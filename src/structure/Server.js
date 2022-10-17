"use strict";
/*
Class that represents the entire backend server
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
class Server {
    constructor(appInit) {
        this.app = (0, express_1.default)();
        this.port = appInit.port;
        this.portS = appInit.portS;
        this.env = appInit.env;
        this.loadMiddlewares(appInit.middlewares);
        this.loadRoutes(appInit.controllers);
    }
    loadRoutes(controllers) {
        // Test page
        this.app.get("/", (_, res) => {
            res.status(200).send({
                message: "The backend is working",
                documentation: "https://github.com/mnunez77/Sostek",
            });
        });
        // Add controllers
        controllers.forEach((controller) => {
            this.app.use(`/${controller.prefix}`, controller.router);
        });
    }
    // Add middlewares
    loadMiddlewares(middlewares) {
        middlewares.forEach((middleware) => {
            this.app.use(middleware);
        });
    }
    init() {
        this.httpsServer = https_1.default.createServer(this.app);
        this.app.listen(this.port, () => {
            console.log(`Server running @'http://localhost:${this.port}'`);
        });
        this.httpsServer.listen(8443, () => console.log("Corriendo HTTPS 8443"));
    }
}
exports.default = Server;
