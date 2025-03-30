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
exports.fillProm = exports.createProm = exports.addDisease = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const appointment_1 = __importDefault(require("../models/appointment"));
const prom_1 = __importDefault(require("../models/prom"));
const promResponse_1 = __importDefault(require("../models/promResponse"));
const disease_1 = __importDefault(require("../models/disease"));
const assertHasUser_1 = require("../util/assertHasUser");
const appointmentStatus_1 = require("../enums/appointmentStatus");
const addDisease = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, assertHasUser_1.assertHasUser)(req);
        const loggedInUserId = req.user.userId;
        const { name } = req.body;
        if (!name) {
            throw (0, http_errors_1.default)(400, "Disease name is required.");
        }
        const existingDisease = yield disease_1.default.findOne({ name });
        if (existingDisease) {
            throw (0, http_errors_1.default)(409, "Disease already exists.");
        }
        const newDisease = new disease_1.default({ name });
        yield newDisease.save();
        res.status(201).json({ message: "Disease added successfully", disease: newDisease });
    }
    catch (error) {
        next(error);
    }
});
exports.addDisease = addDisease;
const createProm = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, assertHasUser_1.assertHasUser)(req);
        const loggedInUserId = req.user.userId;
        const { name, diseaseId, questions } = req.body;
        console.log("Received disease name:", name);
        console.log("Received disease Id:", diseaseId);
        console.log("Received disease Id:", questions);
        if (!name || !diseaseId || !questions || !Array.isArray(questions) || questions.length === 0) {
            throw (0, http_errors_1.default)(400, "All fields (name, diseaseId, questions) are required.");
        }
        const promTemplate = new prom_1.default({
            name,
            disease: diseaseId,
            questions,
        });
        yield promTemplate.save();
        res.status(201).json({ message: "PROM Template created successfully", promTemplate });
    }
    catch (error) {
        next(error);
    }
});
exports.createProm = createProm;
const fillProm = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, assertHasUser_1.assertHasUser)(req);
        const loggedInUserId = req.user.userId;
        const { appointmentId } = req.params;
        const { responses } = req.body;
        if (!appointmentId || !responses) {
            throw (0, http_errors_1.default)(400, "Appointment ID and responses are required");
        }
        const appointment = yield appointment_1.default.findById(appointmentId)
            .populate({
            path: "diagnosis",
            populate: {
                path: "disease",
                model: "Disease",
            },
        })
            .exec();
        if (!appointment) {
            throw (0, http_errors_1.default)(404, "Appointment not found");
        }
        if (appointment.patient.toString() !== loggedInUserId.toString()) {
            throw (0, http_errors_1.default)(403, "You are not authorized to fill this PROM");
        }
        if (appointment.status !== appointmentStatus_1.AppointmentStatus.COMPLETED) {
            throw (0, http_errors_1.default)(400, "You can only fill PROM after treatment is completed");
        }
        if (!appointment.diagnosis) {
            throw (0, http_errors_1.default)(400, "Diagnosis must be completed before filling PROM");
        }
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const recentProm = yield promResponse_1.default.findOne({
            appointment: appointmentId,
            patient: loggedInUserId,
            submittedAt: { $gte: twoWeeksAgo },
        });
        if (recentProm) {
            throw (0, http_errors_1.default)(400, "You can only fill PROM every two weeks");
        }
        const diagnosis = appointment.diagnosis;
        const promTemplate = yield prom_1.default.findOne({ disease: diagnosis.disease });
        if (!promTemplate) {
            throw (0, http_errors_1.default)(404, "No PROM template found for this disease");
        }
        if (responses.length !== promTemplate.questions.length) {
            throw (0, http_errors_1.default)(400, "Number of responses must match the PROM questions");
        }
        let totalScore = 0;
        const validatedResponses = responses.map((response, index) => {
            if (!promTemplate.questions[index]) {
                throw (0, http_errors_1.default)(400, "Invalid question response");
            }
            totalScore += response.score;
            return {
                question: promTemplate.questions[index].questionText,
                score: response.score,
            };
        });
        const promResponse = new promResponse_1.default({
            appointment: appointment._id,
            patient: loggedInUserId,
            clinician: appointment.clinician._id,
            prom: promTemplate._id,
            responses: validatedResponses,
            totalScore,
        });
        yield promResponse.save();
        appointment.prom.push(promResponse._id);
        yield appointment.save();
        res.status(201).json({ message: "PROM submitted successfully", promResponse });
    }
    catch (error) {
        next(error);
    }
});
exports.fillProm = fillProm;
//# sourceMappingURL=promController.js.map