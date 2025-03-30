"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const morgan_1 = __importDefault(require("morgan"));
const http_errors_1 = __importStar(require("http-errors"));
const method_override_1 = __importDefault(require("method-override"));
const authRouter_1 = __importDefault(require("./routes/authRouter"));
const clinicianRouter_1 = __importDefault(require("./routes/clinicianRouter"));
const adminRouter_1 = __importDefault(require("./routes/adminRouter"));
const clinicRouter_1 = __importDefault(require("./routes/clinicRouter"));
const serviceRouter_1 = __importDefault(require("./routes/serviceRouter"));
const appointmentRouter_1 = __importDefault(require("./routes/appointmentRouter"));
const promRouter_1 = __importDefault(require("./routes/promRouter"));
const app = (0, express_1.default)();
app.engine("ejs", require("ejs-mate"));
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, method_override_1.default)("_method"));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use("/", authRouter_1.default);
app.use("/clinician", clinicianRouter_1.default);
app.use("/admin", adminRouter_1.default);
app.use("/clinic", clinicRouter_1.default);
app.use("/service", serviceRouter_1.default);
app.use("/appointment", appointmentRouter_1.default);
app.use("/prom", promRouter_1.default);
app.use((req, res, next) => { next((0, http_errors_1.default)(404, "Enpoint Not found")); });
app.use((error, req, res, next) => {
    console.error(error);
    let errorMessage = "An error occurred";
    let statusCode = 500;
    if ((0, http_errors_1.isHttpError)(error)) {
        errorMessage = error.message;
        statusCode = error.status;
    }
    res.status(statusCode).json({ message: errorMessage });
});
exports.default = app;
//# sourceMappingURL=app.js.map