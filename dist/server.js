"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const validateEnv_1 = __importDefault(require("./util/validateEnv"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const port = validateEnv_1.default.PORT;
console.log("Attempting to connect to PostgreSQL via Prisma...");
prisma.$connect()
    .then(() => {
    console.log("🟢 [Prisma]: Connected to PostgreSQL");
    app_1.default.listen(port, () => {
        console.log(`🚀 [Server]: Running at http://localhost:${port}`);
    });
})
    .catch((error) => {
    console.error("🔴 [Prisma]: Connection error", error);
    process.exit(1);
});
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
    console.log("🔴 [Prisma]: Disconnected");
    process.exit(0);
}));
//# sourceMappingURL=server.js.map