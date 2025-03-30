"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PatientSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    medicalHistory: { type: String },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Patient', PatientSchema);
//# sourceMappingURL=patient.js.map