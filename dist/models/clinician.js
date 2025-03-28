"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const clinicianSchema = new mongoose_1.Schema({
    email: { type: String, required: true },
    text: { type: String },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Note', clinicianSchema);
//# sourceMappingURL=clinician.js.map