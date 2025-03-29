"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const appointmentStatus_1 = require("../enums/appointmentStatus");
const AppointmentSchema = new mongoose_1.Schema({
    patient: { type: mongoose_1.Schema.Types.ObjectId, ref: "Patient", required: true },
    clinician: { type: mongoose_1.Schema.Types.ObjectId, ref: "Clinician", required: true },
    clinic: { type: mongoose_1.Schema.Types.ObjectId, ref: "Clinic", default: null },
    date: { type: Date, required: true },
    status: { type: String, enum: Object.values(appointmentStatus_1.AppointmentStatus), default: "pending" },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Appointment", AppointmentSchema);
//# sourceMappingURL=appointment.js.map