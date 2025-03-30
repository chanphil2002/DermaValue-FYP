"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PromResponseSchema = new mongoose_1.Schema({
    appointment: { type: mongoose_1.Schema.Types.ObjectId, ref: "Appointment", required: true },
    patient: { type: mongoose_1.Schema.Types.ObjectId, ref: "Patient", required: true },
    clinician: { type: mongoose_1.Schema.Types.ObjectId, ref: "Clinician", required: true },
    prom: { type: mongoose_1.Schema.Types.ObjectId, ref: "Prom", required: true },
    responses: [
        {
            question: { type: String, required: true },
            score: { type: Number, required: true, min: 0 },
        },
    ],
    submittedAt: { type: Date, default: Date.now },
    totalScore: { type: Number, default: 0 },
});
exports.default = (0, mongoose_1.model)("PromResponse", PromResponseSchema);
//# sourceMappingURL=promResponse.js.map