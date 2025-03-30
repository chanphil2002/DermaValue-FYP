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
exports.registerUser = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const client_1 = require("@prisma/client");
const userRole_1 = require("../enums/userRole");
const prisma = new client_1.PrismaClient();
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, role, clinic, services, medicalHistory } = req.body;
        if (!username || !email || !password || !role) {
            throw (0, http_errors_1.default)(400, "All fields are required");
        }
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw (0, http_errors_1.default)(409, "User already exists");
        }
        if (!email) {
            throw new Error("Email is required");
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield tx.user.create({
                data: { username, email, password, role },
            });
            if (role === userRole_1.UserRole.CLINICIAN) {
                yield tx.clinician.create({
                    data: {
                        userId: user.id,
                        clinicId: clinic || null,
                        services: {
                            connect: (services === null || services === void 0 ? void 0 : services.map((id) => ({ id }))) || [],
                        },
                        approved: false,
                    },
                });
            }
            else if (role === userRole_1.UserRole.PATIENT) {
                yield tx.patient.create({
                    data: {
                        userId: user.id,
                        medicalHistory: medicalHistory || "",
                    },
                });
            }
            return user;
        }));
        res.status(201).json({ message: "User registered successfully", userId: result.id });
    }
    catch (error) {
        next(error);
    }
});
exports.registerUser = registerUser;
//# sourceMappingURL=authController.js.map