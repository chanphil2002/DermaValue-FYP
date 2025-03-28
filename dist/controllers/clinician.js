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
exports.deleteClinician = exports.updateClinician = exports.createClinician = exports.getClinician = exports.getClinicians = void 0;
const clinician_1 = __importDefault(require("../models/clinician"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const getClinicians = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clinicians = yield clinician_1.default.find().exec();
        res.locals.isIndexPage = true;
        res.render('home', { clinicians });
    }
    catch (error) {
        next(error);
    }
});
exports.getClinicians = getClinicians;
const getClinician = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const clinicianId = req.params.id;
    try {
        if (!mongoose_1.default.isValidObjectId(clinicianId)) {
            throw (0, http_errors_1.default)(400, "Invalid clinician ID");
        }
        const clinician = yield clinician_1.default.findById(clinicianId).exec();
        if (!clinician) {
            throw (0, http_errors_1.default)(404, "Clinician not found");
        }
        res.status(200).json(clinician);
    }
    catch (error) {
        next(error);
    }
});
exports.getClinician = getClinician;
const createClinician = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.body.email;
    const name = req.body.name;
    try {
        if (!email) {
            throw (0, http_errors_1.default)(400, "Title is required");
        }
        const newClinician = yield clinician_1.default.create({
            email: email,
            name: name
        });
        res.redirect("/");
    }
    catch (error) {
        next(error);
    }
});
exports.createClinician = createClinician;
const updateClinician = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const clinicianId = req.params.id;
    const newEmail = req.body.email;
    const newName = req.body.name;
    try {
        if (!mongoose_1.default.isValidObjectId(clinicianId)) {
            throw (0, http_errors_1.default)(400, "Invalid clinician ID");
        }
        if (!newEmail) {
            throw (0, http_errors_1.default)(400, "Title is required");
        }
        const clinician = yield clinician_1.default.findById(clinicianId).exec();
        if (!clinician) {
            throw (0, http_errors_1.default)(404, "Clinician not found");
        }
        clinician.email = newEmail;
        const updatedClinician = yield clinician.save();
        res.status(200).json(updatedClinician);
    }
    catch (error) {
        next(error);
    }
});
exports.updateClinician = updateClinician;
const deleteClinician = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const clinicianId = req.params.id;
    try {
        if (!mongoose_1.default.isValidObjectId(clinicianId)) {
            throw (0, http_errors_1.default)(400, "Invalid clinician ID");
        }
        const clinician = yield clinician_1.default.findByIdAndDelete(clinicianId).exec();
        if (!clinician) {
            throw (0, http_errors_1.default)(404, "Clinician not found");
        }
        res.sendStatus(204);
    }
    catch (error) {
        next(error);
    }
});
exports.deleteClinician = deleteClinician;
//# sourceMappingURL=clinician.js.map