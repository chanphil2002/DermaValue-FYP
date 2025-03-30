"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appointmentController = __importStar(require("../controllers/appointmentController"));
const diagnosisController = __importStar(require("../controllers/diagnosisController"));
const auth_1 = require("../middleware/auth");
const userRole_1 = require("../enums/userRole");
const router = express_1.default.Router();
router.post("/", auth_1.authenticateJWT, (0, auth_1.authorizeRole)([userRole_1.UserRole.PATIENT]), appointmentController.bookAppointment);
router.get("/:id", auth_1.authenticateJWT, (0, auth_1.authorizeRole)([userRole_1.UserRole.CLINICIAN]), appointmentController.getAppointment);
router.patch("/:id/status", auth_1.authenticateJWT, (0, auth_1.authorizeRole)([userRole_1.UserRole.CLINICIAN]), appointmentController.acceptOrRejectAppointment);
router.post("/:id/diagnosis", auth_1.authenticateJWT, (0, auth_1.authorizeRole)([userRole_1.UserRole.CLINICIAN]), diagnosisController.addDiagnosis);
router.get("/:id/diagnosis", auth_1.authenticateJWT, (0, auth_1.authorizeRole)([userRole_1.UserRole.CLINICIAN]), diagnosisController.getDiagnosisByAppointment);
exports.default = router;
//# sourceMappingURL=appointmentRouter.js.map