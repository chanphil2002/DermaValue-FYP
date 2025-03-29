"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectClinician = exports.approveClinician = void 0;
const clinician_1 = __importDefault(require("../models/clinician"));
const approveClinician = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clinicianId } = req.params;
        yield clinician_1.default.findByIdAndUpdate(clinicianId, { status: "approved" });
        res.status(200).json({ message: "Clinician approved successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.approveClinician = approveClinician;
const rejectClinician = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clinicianId } = req.params;
        yield clinician_1.default.findByIdAndDelete(clinicianId);
        res.status(200).json({ message: "Clinician rejected successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.rejectClinician = rejectClinician;
//# sourceMappingURL=adminController.js.map