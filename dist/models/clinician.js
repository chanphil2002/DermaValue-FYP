"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ClinicianSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    clinic: { type: mongoose_1.Schema.Types.ObjectId, ref: "Clinic", default: null },
    services: { type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Service" }], default: [] },
    approved: { type: Boolean, default: false },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Clinician", ClinicianSchema);
//# sourceMappingURL=clinician.js.map