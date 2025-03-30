"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PromSchema = new mongoose_1.Schema({
    disease: { type: mongoose_1.Schema.Types.ObjectId, ref: "Disease", required: true },
    name: { type: String, required: true },
    questions: [
        {
            questionText: { type: String, required: true },
            score: { type: Number, default: 0, min: 0, max: 5 },
        },
    ],
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Prom', PromSchema);
//# sourceMappingURL=prom.js.map