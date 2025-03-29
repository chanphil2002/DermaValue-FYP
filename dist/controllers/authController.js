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
exports.loginUser = exports.registerUser = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../models/user"));
const clinician_1 = __importDefault(require("../models/clinician"));
const patient_1 = __importDefault(require("../models/patient"));
const userRole_1 = require("../enums/userRole");
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, role, clinic, services, medicalHistory } = req.body;
        if (!username || !email || !password || !role) {
            throw (0, http_errors_1.default)(400, "All fields are required");
        }
        const existingUser = yield user_1.default.findOne({ email });
        if (existingUser) {
            throw (0, http_errors_1.default)(409, "User already exists");
        }
        const user = new user_1.default({ username, email, password, role });
        yield user.save();
        if (role === userRole_1.UserRole.CLINICIAN) {
            const clinician = new clinician_1.default({ user: user._id, clinic, services, approved: false });
            yield clinician.save();
        }
        else if (role === userRole_1.UserRole.PATIENT) {
            const patient = new patient_1.default({ user: user._id, medicalHistory });
            yield patient.save();
        }
        res.status(201).json({ message: "User registered successfully", userId: user._id });
    }
    catch (error) {
        next(error);
    }
});
exports.registerUser = registerUser;
const loginUser = (role) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password || !role) {
            throw (0, http_errors_1.default)(400, "Email and password are required");
        }
        const user = yield user_1.default.findOne({ email });
        if (!user || user.role !== role)
            throw (0, http_errors_1.default)(401, "Invalid credentials");
        const isMatch = yield user.comparePassword(password);
        if (!isMatch)
            throw (0, http_errors_1.default)(401, "Invalid credentials");
        if (role === userRole_1.UserRole.CLINICIAN) {
            const clinician = yield clinician_1.default.findOne({ user: user._id });
            if (!clinician)
                throw (0, http_errors_1.default)(404, "Clinician profile not found");
            if (!clinician.approved)
                throw (0, http_errors_1.default)(403, "Clinician not approved by admin");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "Login successful", token });
    }
    catch (error) {
        next(error);
    }
});
exports.loginUser = loginUser;
//# sourceMappingURL=authController.js.map