"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const DiagnosisSchema = new mongoose_1.Schema({
    appointment: { type: mongoose_1.Schema.Types.ObjectId, ref: "Appointment", required: true },
    clinician: { type: mongoose_1.Schema.Types.ObjectId, ref: "Clinician", required: true },
    disease: { type: mongoose_1.Schema.Types.ObjectId, ref: "Disease", required: true },
    description: { type: String, required: true },
    treatmentPlan: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Diagnosis', DiagnosisSchema);
//# sourceMappingURL=diagnosis.js.map