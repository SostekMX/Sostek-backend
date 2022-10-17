"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PermissionMiddleware {
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new PermissionMiddleware();
        return this.instance;
    }
}
exports.default = PermissionMiddleware;
