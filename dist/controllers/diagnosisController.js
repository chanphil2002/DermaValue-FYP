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
exports.updateDiagnosis = exports.getDiagnosisByAppointment = exports.addDiagnosis = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const diagnosis_1 = __importDefault(require("../models/diagnosis"));
const disease_1 = __importDefault(require("../models/disease"));
const appointment_1 = __importDefault(require("../models/appointment"));
const assertHasUser_1 = require("../util/assertHasUser");
const addDiagnosis = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, assertHasUser_1.assertHasUser)(req);
        const { id } = req.params;
        const loggedInUserId = req.user.userId;
        const { disease, description, treatmentPlan } = req.body;
        if (!disease || !description || !treatmentPlan) {
            throw (0, http_errors_1.default)(400, "Diagnosis and treatment plan are required");
        }
        const appointment = yield appointment_1.default.findById(id)
            .populate("clinician")
            .exec();
        if (!appointment) {
            throw (0, http_errors_1.default)(404, "Appointment not found");
        }
        if (appointment.clinician.user._id.toString() !== loggedInUserId.toString()) {
            throw (0, http_errors_1.default)(403, "You are not authorized to add diagnosis for this appointment");
        }
        const existingDiagnosis = yield diagnosis_1.default.findOne({ appointment: id });
        if (existingDiagnosis) {
            throw (0, http_errors_1.default)(409, "Diagnosis already exists for this appointment");
        }
        const diseaseExists = yield disease_1.default.findById(disease);
        if (!diseaseExists) {
            throw (0, http_errors_1.default)(404, "Specified disease not found");
        }
        const diagnosisRecord = new diagnosis_1.default({
            appointment: appointment._id,
            clinician: appointment.clinician._id,
            disease,
            description,
            treatmentPlan,
        });
        yield diagnosisRecord.save();
        appointment.diagnosis = diagnosisRecord._id;
        yield appointment.save();
        res.status(201).json({ message: "Diagnosis added successfully", diagnosis: diagnosisRecord });
    }
    catch (error) {
        next(error);
    }
});
exports.addDiagnosis = addDiagnosis;
const getDiagnosisByAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const diagnosis = yield diagnosis_1.default.findOne({ appointment: appointmentId }).populate("clinician");
        if (!diagnosis) {
            throw (0, http_errors_1.default)(404, "No diagnosis found for this appointment");
        }
        res.status(200).json(diagnosis);
    }
    catch (error) {
        next(error);
    }
});
exports.getDiagnosisByAppointment = getDiagnosisByAppointment;
const updateDiagnosis = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        (0, assertHasUser_1.assertHasUser)(req);
        const { diagnosisId } = req.params;
        const { diagnosis, treatmentPlan } = req.body;
        const existingDiagnosis = yield diagnosis_1.default.findById(diagnosisId).populate("disease");
        if (!existingDiagnosis) {
            throw (0, http_errors_1.default)(404, "Diagnosis not found");
        }
        if (existingDiagnosis.clinician.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId.toString())) {
            throw (0, http_errors_1.default)(403, "You are not authorized to update this diagnosis");
        }
        existingDiagnosis.disease = diagnosis || existingDiagnosis.disease;
        existingDiagnosis.treatmentPlan = treatmentPlan || existingDiagnosis.treatmentPlan;
        yield existingDiagnosis.save();
        res.status(200).json({ message: "Diagnosis updated successfully", diagnosis: existingDiagnosis });
    }
    catch (error) {
        next(error);
    }
});
exports.updateDiagnosis = updateDiagnosis;
//# sourceMappingURL=diagnosisController.js.map