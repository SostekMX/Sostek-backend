/*
Class that represents an abstract controller.
All controllers will inherit from this class
*/

import { Router } from "express";

//Middlewares
import ValidationErrorMiddleware from "../middlewares/validationError";
import AuthorizationMiddleware from "../middlewares/authorization";
import PermissionMiddleware from "../middlewares/permission";

export default abstract class AbstractController {
  private _router: Router = Router(); // The routes will be contained in this router
  private _prefix: string; // The prefix that goes after the main backend url when sending a request

  protected handleErrors = ValidationErrorMiddleware.handleErrors;
  protected authMiddleware = AuthorizationMiddleware.getInstance();
  protected permissionMiddleware = PermissionMiddleware.getInstance();

  public get prefix(): string {
    return this._prefix;
  }

  public get router(): Router {
    return this._router;
  }

  protected constructor(prefix: string) {
    this._prefix = prefix;
    this.initRoutes();
  }
  //Initialize routes
  protected abstract initRoutes(): void;
}
