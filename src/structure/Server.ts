/*
Class that represents the entire backend server
*/

import express, { Request, Response, NextFunction } from "express";
import AbstractController from "../controllers/AbstractController";
import https from "https";
import * as fs from "fs";
import * as path from "path";
import { readFile, writeFile } from "fs/promises";

class Server {
  private app: express.Application;
  private port: number;
  private portS: number;
  private env: string;
  private httpsServer: any;

  constructor(appInit: {
    port: number;
    portS: number;
    middlewares: any;
    controllers: AbstractController[];
    env: string;
  }) {
    this.app = express();
    this.port = appInit.port;
    this.portS = appInit.portS;
    this.env = appInit.env;
    this.loadMiddlewares(appInit.middlewares);
    this.loadRoutes(appInit.controllers);
  }

  private loadRoutes(controllers: AbstractController[]): void {
    // Test page
    this.app.get("/", (_: any, res: Response) => {
      res.status(200).send({
        message: "The backend is working",
        documentation:
          "https://github.com/mnunez77/Sostek",
      });
    });

    // Add controllers
    controllers.forEach((controller: AbstractController) => {
      this.app.use(`/${controller.prefix}`, controller.router);
    });
  }

  // Add middlewares
  private loadMiddlewares(middlewares: any[]): void {
    middlewares.forEach((middleware: any) => {
      this.app.use(middleware);
    });
  }

  public init(): void {
    this.httpsServer = https.createServer(this.app);
    this.app.listen(this.port, () => {
      console.log(`Server running @'http://localhost:${this.port}'`);
    });
    this.httpsServer.listen(8443, () => console.log("Corriendo HTTPS 8443"));
  }
}

export default Server;
