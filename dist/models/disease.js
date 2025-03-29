"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const diseaseSchema = new mongoose_1.Schema({}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Disease', diseaseSchema);
//# sourceMappingURL=disease.js.map