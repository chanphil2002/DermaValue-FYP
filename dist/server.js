"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const validateEnv_1 = __importDefault(require("./util/validateEnv"));
const mongoose_1 = __importDefault(require("mongoose"));
const port = validateEnv_1.default.PORT;
console.log("Attempting to connect to MongoDB...");
mongoose_1.default.set('debug', true);
mongoose_1.default.connect(validateEnv_1.default.LOCAL_MONGO, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: process.env.NODE_ENV === "development",
})
    .then(() => {
    console.log("[mongo]: Connected to the database");
    app_1.default.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
    });
})
    .catch((error) => {
    console.error("[mongo]: Connection error", error);
});
//# sourceMappingURL=server.js.map