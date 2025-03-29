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
exports.bookAppointment = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const appointment_1 = __importDefault(require("../models/appointment"));
const bookAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clinician, clinic, date } = req.body;
        const patient = req.user;
        if (!clinician || !clinic || !date) {
            throw (0, http_errors_1.default)(400, "All fields are required");
        }
        const appointment = new appointment_1.default({
            patient,
            clinician,
            clinic,
            date,
            status: "pending"
        });
        yield appointment.save();
        res.status(201).json({ message: "Appointment booked successfully", appointment });
    }
    catch (error) {
        next(error);
    }
});
exports.bookAppointment = bookAppointment;
//# sourceMappingURL=appointmentController.js.map