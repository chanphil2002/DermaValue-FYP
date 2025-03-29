"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_errors_1 = __importDefault(require("http-errors"));
const authenticateJWT = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token)
            throw (0, http_errors_1.default)(401, "Access denied. No token provided.");
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        next((0, http_errors_1.default)(401, "Invalid or expired token"));
    }
};
exports.authenticateJWT = authenticateJWT;
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user)
                throw (0, http_errors_1.default)(401, "User not authenticated");
            if (!allowedRoles.includes(req.user))
                throw (0, http_errors_1.default)(403, "Access denied. Insufficient permissions.");
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorizeRole = authorizeRole;
//# sourceMappingURL=auth.js.map