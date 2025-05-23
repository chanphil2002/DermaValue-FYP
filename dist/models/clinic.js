"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ClinicSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
});
exports.default = (0, mongoose_1.model)("Clinic", ClinicSchema);
//# sourceMappingURL=clinic.js.map