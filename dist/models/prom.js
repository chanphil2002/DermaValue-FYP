"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const promSchema = new mongoose_1.Schema({}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Prom', promSchema);
//# sourceMappingURL=prom.js.map