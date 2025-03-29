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
exports.deleteClinic = exports.updateClinic = exports.getClinicById = exports.getClinics = exports.createClinic = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const clinic_1 = __importDefault(require("../models/clinic"));
const createClinic = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, location } = req.body;
        if (!name || !location) {
            throw (0, http_errors_1.default)(400, "Name and location are required");
        }
        const clinic = new clinic_1.default({ name, location });
        yield clinic.save();
        res.status(201).json({ message: "Clinic created successfully", clinic });
    }
    catch (error) {
        next(error);
    }
});
exports.createClinic = createClinic;
const getClinics = (_req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clinics = yield clinic_1.default.find();
        res.status(200).json(clinics);
    }
    catch (error) {
        next(error);
    }
});
exports.getClinics = getClinics;
const getClinicById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.isValidObjectId(id)) {
            throw (0, http_errors_1.default)(400, "Invalid clinic ID");
        }
        const clinic = yield clinic_1.default.findById(id);
        if (!clinic) {
            throw (0, http_errors_1.default)(404, "Clinic not found");
        }
        res.status(200).json(clinic);
    }
    catch (error) {
        next(error);
    }
});
exports.getClinicById = getClinicById;
const updateClinic = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!mongoose_1.default.isValidObjectId(id)) {
            throw (0, http_errors_1.default)(400, "Invalid clinic ID");
        }
        const updatedClinic = yield clinic_1.default.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedClinic) {
            throw (0, http_errors_1.default)(404, "Clinic not found");
        }
        res.status(200).json(updatedClinic);
    }
    catch (error) {
        next(error);
    }
});
exports.updateClinic = updateClinic;
const deleteClinic = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.isValidObjectId(id)) {
            throw (0, http_errors_1.default)(400, "Invalid clinic ID");
        }
        const deletedClinic = yield clinic_1.default.findByIdAndDelete(id);
        if (!deletedClinic) {
            throw (0, http_errors_1.default)(404, "Clinic not found");
        }
        res.status(200).json({ message: "Clinic deleted successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteClinic = deleteClinic;
//# sourceMappingURL=clinicController.js.map