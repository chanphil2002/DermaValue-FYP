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
exports.acceptOrRejectAppointment = exports.getAppointment = exports.bookAppointment = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const appointment_1 = __importDefault(require("../models/appointment"));
const appointmentStatus_1 = require("../enums/appointmentStatus");
const assertHasUser_1 = require("../util/assertHasUser");
const bookAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, assertHasUser_1.assertHasUser)(req);
        console.log("Authenticated User:", req.user);
        const { clinician, clinic, date } = req.body;
        const patient = req.user.userId;
        console.log(patient);
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
const getAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, assertHasUser_1.assertHasUser)(req);
        const appointmentId = req.params.id;
        const appointment = yield appointment_1.default.findById(appointmentId)
            .populate({
            path: "clinician",
            populate: {
                path: "user",
                model: "User",
            },
        })
            .exec();
        if (!appointment) {
            throw (0, http_errors_1.default)(404, "Appointment not found");
        }
        res.json(appointment);
    }
    catch (error) {
        next(error);
    }
});
exports.getAppointment = getAppointment;
const acceptOrRejectAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, assertHasUser_1.assertHasUser)(req);
        const { id } = req.params;
        const loggedInUserId = req.user.userId;
        const action = req.body.action;
        if (!action || (action !== 'accept' && action !== 'reject')) {
            throw (0, http_errors_1.default)(400, "Invalid action. Action must be 'accept' or 'reject'.");
        }
        const appointment = yield appointment_1.default.findById(id).populate("clinician");
        if (!appointment) {
            throw (0, http_errors_1.default)(404, "Appointment not found");
        }
        if (appointment.status !== appointmentStatus_1.AppointmentStatus.PENDING) {
            throw (0, http_errors_1.default)(400, "Appointment is not in pending status");
        }
        if (appointment.clinician.user._id.toString() !== loggedInUserId.toString()) {
            throw (0, http_errors_1.default)(403, "You are not authorized to accept this appointment");
        }
        if (action === 'accept') {
            appointment.status = appointmentStatus_1.AppointmentStatus.APPROVED;
        }
        else if (action === 'reject') {
            appointment.status = appointmentStatus_1.AppointmentStatus.REJECTED;
        }
        yield appointment.save();
        res.status(200).json({
            message: "Appointment accepted successfully",
            appointment,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.acceptOrRejectAppointment = acceptOrRejectAppointment;
//# sourceMappingURL=appointmentController.js.map